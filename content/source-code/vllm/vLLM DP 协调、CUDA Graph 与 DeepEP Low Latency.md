---
title: vLLM DP 协调、CUDA Graph 与 DeepEP Low Latency
date: 2026-07-06
tags:
  - vllm
  - cuda-graph
  - data-parallel
  - deepep
  - source-reading
---

---
title: vLLM DP 协调、CUDA Graph 与 DeepEP Low Latency
date: 2026-07-06
tags:
  - vllm
  - cuda-graph
  - data-parallel
  - deepep
  - source-reading
---

# vLLM DP 协调、CUDA Graph 与 DeepEP Low Latency

## 问题

`vllm/v1/worker/dp_utils.py` 里的 `coordinate_batch_across_dp()` 为什么必要？

特别是在 decode 侧使用 `deepep_low_latency` 时，如果 DeepEP LL 本身可以用 `max_tokens_per_rank` 这种固定容量协议，CUDA Graph 下还需要跨 DP rank 做同步和 padding 吗？

## 简短结论

`coordinate_batch_across_dp()` 的核心作用不是简单同步 batch size，而是给本轮 forward 在 DP ranks 之间建立一个统一的执行契约：

- 所有 rank 是否都启用 microbatching / DBO；
- 每个 rank 本轮实际按多少 token 执行；
- 所有 rank 使用哪种 CUDA Graph runtime mode。

对于 decode 侧的 `deepep_low_latency`，DP padding 到最大 token 数这件事可能在某些窄场景里偏保守，因为 DeepEP LL dispatch/combine 更接近固定容量协议。

但 **CUDA Graph mode 仍然必须跨 rank 对齐**。不应该允许同一个 DP/EP 通信组里一部分 rank 走 CUDA Graph replay，另一部分 rank 走 eager。

## 相关源码路径

- `vllm/v1/worker/dp_utils.py`
  - `coordinate_batch_across_dp()`
  - `_synchronize_dp_ranks()`
  - `_post_process_cudagraph_mode()`
  - `_post_process_dp_padding()`

- `vllm/v1/worker/gpu_model_runner.py`
  - 先按本 rank 的 batch 做 CUDA Graph dispatch；
  - 调用 `coordinate_batch_across_dp()`；
  - 再用 DP 同步后的 token 数和 cudagraph mode 重新 dispatch。

- `vllm/forward_context.py`
  - 用 `num_tokens_across_dp` 构造 `DPMetadata`。

- `vllm/model_executor/layers/fused_moe/prepare_finalize/deepep_ll.py`
  - `DeepEPLLPrepareAndFinalize`；
  - 调用 `buffer.low_latency_dispatch(..., self.max_tokens_per_rank, ...)`；
  - dispatch 返回的 handle 会被 combine 使用。

## `coordinate_batch_across_dp()` 做了什么

每个 DP rank 会贡献本 rank 的：

- 未 padding 的 token 数；
- 已经经过非 DP padding 后的 token 数，例如 CUDA Graph bucket、TP/SP padding；
- 是否希望启用 ubatching；
- 本 rank 选择的 cudagraph mode。

然后通过 DP group 上的 all-reduce 收集所有 rank 的信息。后处理逻辑大致是：

- 只有所有 rank 都满足 ubatching 条件时，才启用 ubatching；
- cudagraph mode 取所有 rank 的最小值，即有 rank 退到 `NONE`，大家都退；
- 当同步后的 cudagraph mode 不是 `NONE`，或者 ubatching 生效时，启用 DP padding。

当前关键策略可以概括为：

```python
should_dp_pad = synced_cudagraph_mode != 0 or should_ubatch
```

也就是说，CUDA Graph 打开时，当前实现会把各 DP rank padding 到同一个 token count。

## CUDA Graph 为什么让约束变强

CUDA Graph replay 固定了 capture 时的 kernel 序列、tensor shape、内存地址和依赖关系。在单卡上，这主要是本地 shape 是否匹配的问题；但在 DP + EP/MoE 场景里，Graph replay 还会固定跨 rank 通信发生的位置和顺序。

如果每个 DP rank 独立决定 graph mode 和 graph bucket，就可能出现：

- rank 0 replay full CUDA graph，rank 1 走 eager；
- 不同 rank 使用不同 graph bucket；
- attention metadata 和实际 padded shape 不一致；
- `DPMetadata` 描述的 token 数和实际执行 shape 不一致；
- DeepEP/NCCL/NVSHMEM 相关通信调用顺序不一致；
- 最终 collective 或通信 kernel hang。

所以 CUDA Graph 下的问题不只是“本 rank 的 graph replay shape 是否匹配”，还包括“所有相关 rank 是否以兼容的顺序进入相同的分布式通信路径”。

## DeepEP Low Latency 的特殊性

`deepep_low_latency` 和一些变长 all-to-all 路径不同，它对每轮当前 token 数的依赖更弱。

在 `DeepEPLLPrepareAndFinalize` 里，dispatch 调用形态是：

```python
self.buffer.low_latency_dispatch(
    a1,
    dispatch_topk_ids,
    self.max_tokens_per_rank,
    num_experts,
    ...
)
```

combine 使用 dispatch 返回的 handle。

这说明 DeepEP LL 更像固定容量协议，而不是每轮都完全依赖 `num_tokens_across_dp.max()` 的变长协议。

因此：

- 对 decode-only 的 `deepep_low_latency`，不同 DP rank 的实际 token 数不完全一致，DeepEP LL 通信 buffer 本身可能可以承受；
- 这让“跳过 DP padding 到最大 token 数”的 fast path 在理论上有优化空间；
- 但这并不等于可以跳过 cudagraph mode 的跨 rank 同步。

## 如果一个 rank 没走 CUDA Graph，其余 rank 都走了会怎样

这个情况不安全。

风险主要不一定来自 DeepEP LL 的 buffer 大小，而更可能来自通信序列、stream 顺序和 graph/eager 分支不一致。

### 1. 通信调用序列可能不一致

CUDA Graph ranks 会 replay 捕获好的 dispatch/combine 调用序列。eager rank 则按当前 runtime 分支执行。

如果 eager rank 因为 batch shape、metadata、DBO、spec decode 或 attention path 条件不同，走了不同分支，就可能出现：

- graph ranks 已经发起 `low_latency_dispatch`；
- eager rank 还没到 dispatch，或者跳过了 dispatch；
- graph ranks 进入 combine，eager rank 还在别的 collective；
- 通信组内调用序列不匹配，最终 hang。

### 2. stream 顺序可能不一致

CUDA Graph replay 会按 capture 时记录的 stream 和依赖关系提交工作。eager rank 则按普通 Python 执行流提交 kernel。

即使两边最后都调用 dispatch/combine，如果 stream/event 顺序不同，也可能出现某个 rank 的通信 kernel 等 peer，而 peer 还没有提交对应操作。

### 3. metadata 和 shape 契约可能不一致

vLLM forward 里同时有：

- `batch_descriptor`；
- `DPMetadata`；
- attention metadata；
- padded token count；
- speculative decode metadata；
- dummy padding token / phantom request。

一个 rank eager、其他 rank graph，容易导致这些 metadata 走不同构造路径或对应不同 shape。DeepEP LL 通信容量够，不代表上层 metadata 就一致。

### 4. DBO 场景尤其危险

DBO 要求两个 ubatch 线程运行完全一致数量的 yield。相关 PR 也强调过：两个 microbatch 必须有相同 yield 次数。

如果部分 rank graph、部分 rank eager，或者某个 rank 没进入相同的 ubatching / full decode path，就可能破坏 yield/dispatch/combine 节奏，hang 风险很高。

## 和公开 PR / Issue 的关系

### PR #30173

[Fix `assert batch_descriptor.num_tokens == num_tokens_padded`](https://github.com/vllm-project/vllm/pull/30173)

这个 PR 最直接相关。描述里提到 DP + `FULL_DECODE_ONLY` 有一个 edge case： 一个 rank 走 eager，其他 rank 想走 cudagraph。修复方向就是跨 rank 同步每个 rank 想跑的 cudagraph mode。

这支持一个结论：**至少 cudagraph mode 必须同步**。

### PR #26375

[Make DP padding optional in coordinate_batch_across_dp](https://github.com/vllm-project/vllm/pull/26375)

这个 PR 说明另一个方向：eager prefill 下无条件 DP padding 会导致 excessive padding 和 assertion failure。它让 DP padding 变成可选，但 microbatching 时仍然无条件 padding。

这个 PR 的测试使用了 `deepep_low_latency`，说明项目里确实已经遇到过 “不是所有路径都应该强制 DP padding”的问题。

### PR #23693

[Add Dual-Batch Overlap mechanism to vLLM](https://github.com/vllm-project/vllm/pull/23693)

这个 PR 和 `deepep_low_latency` + full CUDA graph decode 关系很近。它说明 DBO 只在所有 DP groups 都运行 full-decode batches 时启用，并且测试命令包含：

```bash
VLLM_ALL2ALL_BACKEND=deepep_low_latency
--compilation_config '{"cudagraph_mode": "full_decode_only"}'
--enable-microbatching
```

它还强调两个 microbatch 必须运行相同数量的 yield。这说明 decode / CUDA Graph / DeepEP 通信路径对执行一致性有强要求。

### PR #45237

[Avoid mixed batch on spec-dec D-node via padding](https://github.com/vllm-project/vllm/pull/45237)

这个 PR 讨论 P/D disaggregation + speculative decode 下，decode worker 新接收的请求可能只有 1 token，而已有 speculative decode 请求有 `1 + N` tokens， 从而形成 non-uniform batch shape。

PR 描述里明确说：DP mode 下 cudagraph mode 和 padding 会跨 rank coordinate， 一个 rank 进入 mixed path 会让其他 DP ranks 也走更慢的 mixed / piecewise path。

它通过 padding first post-transfer step 来保持 uniform decode / full CUDA graph path。

### Issue #23789 / PR #28579

- [Issue #23789: Pad for cudagraphs before constructing attention metadata](https://github.com/vllm-project/vllm/issues/23789)
- [PR #28579: Refactor padding logic and pad for CUDA graphs before attention metadata building](https://github.com/vllm-project/vllm/pull/28579)

这组讨论说明 CUDA Graph padding 必须在 attention metadata 构建前被感知。

如果 metadata 是按未 padding shape 构建，而 graph 实际按 padded shape 执行， attention backend 或 ahead-of-time scheduler 就可能看到错误 batch size。

### Issue #28207

[CUDA Graph Capture Issue: Unexpected Prefill Branches in Uniform Decode Graphs when MTP=2](https://github.com/vllm-project/vllm/issues/28207)

这个 issue 不是 DP padding 本身，但说明 CUDA Graph decode 对 shape 和 metadata 一致性非常敏感。MTP 下如果 capture size 不能被 uniform decode query length 整除，padding 会让 uniform decode graph 里错误捕获 prefill branch。

这进一步说明 CUDA Graph 下不能只看 token 数，还要看 padding 后的请求形态和 metadata 分支。

## 可能的优化方向

未来可以考虑把当前策略拆得更细：

1. cudagraph mode 跨 DP/EP rank 始终同步；
2. 是否 padding 到 DP 最大 token 数，由具体 backend 和执行路径决定。

一个可能的 no-DP-padding fast path 需要同时证明：

- decode only；
- 使用 `deepep_low_latency`；
- 没有 DBO / ubatching，或没有任何要求 uniform ubatch shape 的路径；
- 所有 rank 同意相同 cudagraph mode；
- graph bucket 选择不要求跨 DP rank token count 一致；
- 所有 `DPMetadata` 消费方都能接受 per-rank token 数不同；
- attention / spec decode metadata 与本 rank 的 local padded shape 一致；
- 通信调用顺序和 stream/event 顺序仍然一致。

在这些条件没有被完整证明并编码进代码前，当前保守策略是合理的：

- CUDA Graph 打开时同步 cudagraph mode；
- 当前实现也会 padding 到 DP max。

## 当前判断

对 `deepep_low_latency` decode 来说，**DP padding 到最大 token 数可能在某些场景里不是严格必要**，存在优化空间。

但 **cudagraph mode 跨 rank 同步是必要的**。同一个 DeepEP/DP 通信组里混合 eager 和 CUDA Graph replay，风险很高，典型后果是通信调用序列不匹配、metadata shape 不一致，最终 hang 或 assert。

