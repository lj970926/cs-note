---
title: DeepEP normal dispatch/combine 支持各 rank 不同 token 数
tags:
  - mlsys
  - moe
  - inference
  - distributed
aliases:
  - DeepEP normal kernel
  - DeepEP dispatch 变长
created: 2026-08-12
---

# DeepEP normal dispatch/combine 支持各 rank 不同 token 数

**结论**：DeepEP 的 normal（高吞吐）dispatch/combine 天然支持每个 EP rank 传入数量不同的 token——MoE all-to-all 本来就是变长的。各 rank 等长不是接口要求，而是上层（如 CUDA Graph）强加的约束。

> 这里讨论的是 **V1 normal kernel**（`Buffer.dispatch`，NVSHMEM 版）。V2 已统一到 `ElasticBuffer`，但变长语义不变。注意与 [[vLLM DP 协调、CUDA Graph 与 DeepEP Low Latency|low-latency 路径]]区分：LL 用 `max_tokens_per_rank` 固定容量协议，normal 没有这个参数。

## 为什么天然支持变长

normal dispatch 分两步协商收发数量，发送方和接收方在调用前都不需要知道对端有多少 token：

1. **layout/count 交换**：每个 rank 根据自己的 `topk_idx` 算出本 rank 要发给每个 peer 的 token 数（`num_tokens_per_rank`、`num_tokens_per_rdma_rank`、`is_token_in_rank`、`num_tokens_per_expert`），通过 count all-to-all / notify 交换给对端。
2. **数据 all-to-all**：拿到对端的计数后，按协商好的变长布局收发。

关键在于这些计数张量是**每个 rank 各自不同**的向量，而不是一个全组统一的标量。每个 rank 自己有多少输入 token、要发给哪些 peer，完全由本 rank 的 batch 和路由结果决定。

## 接口形态（V1 `Buffer.dispatch`）

```python
def dispatch(
    self,
    x: torch.Tensor,                          # [n, hidden]，n 每个 rank 可以不同
    topk_idx: Optional[torch.Tensor],
    topk_weights: Optional[torch.Tensor],
    # 以下三个都是可选的预计算路由元信息；不传则内部自己协商
    num_tokens_per_rank: Optional[torch.Tensor] = None,
    num_tokens_per_rdma_rank: Optional[torch.Tensor] = None,
    is_token_in_rank: Optional[torch.Tensor] = None,
    num_experts: Optional[int] = None,
    ...
) -> Tuple[
    recv_x, recv_topk_idx, recv_topk_weights,
    num_recv_tokens_per_expert_list,          # 每个 expert 收到多少 token，变长
    handle, event,
]:
    ...
```

- `x.shape[0]`（即 `n`）每个 rank 可以不同。
- `num_tokens_per_rank` / `num_tokens_per_rdma_rank` / `is_token_in_rank` **不是用来强制等长的**，而是可选的、预计算好的路由元信息（由 `Buffer.get_dispatch_layout(topk_idx, num_experts)` 算出）。传了省掉内部那次计数交换；不传 DeepEP 自己协商。
- 返回值带 `num_recv_tokens_per_expert_list` 等**每个 expert/rank 各不相同**的接收计数。`recv_x` 内部会做对齐 padding，但有效 token 数由返回计数标出。

`combine` 对称：输入是 dispatch 返回的 `recv_x`（变长）+ `handle`，按原发送方 all-to-all 回去，每个 rank 最终拿回自己原来的 `n` 行结果，同样支持各 rank 数量不同。

## 内部对齐 padding 不影响语义

normal kernel 会把收发数量按 NVLink/IPC 与 RDMA 的传输粒度做对齐，但这是内部处理，有效行数由返回的 token count 决定，**不要求各 rank 等长**。

## 唯一的等长约束来自 CUDA Graph

这是上层限制，不是 normal kernel 的限制：

- normal kernel 的 legacy 文档原话：CPU 要等 GPU 的 signal，所以 normal 路径**默认不兼容 CUDA graph**（除非用仅机内的 `num_worst_tokens`）。
- 一旦上层用 CUDA Graph capture，kernel 序列、tensor shape、内存地址、跨 rank 通信顺序都被固定，replay 时 `n` 和收发布局不能变。因此 vLLM 等框架在 CUDA Graph 下会把各 DP rank padding 到同一个 max token count——这正是 [[vLLM DP 协调、CUDA Graph 与 DeepEP Low Latency]] 里讨论的 DP padding 动机。

一句话：**normal dispatch/combine 允许、且就是为「各 rank token 数不同」设计的；只有叠加 CUDA Graph 时，上层才需要自己 padding 对齐。**

## 参考

- [DeepEP（V2 README）](https://github.com/deepseek-ai/DeepEP) —— high-throughput / low-latency 已统一为 `ElasticBuffer`，变长靠 `handle` 元数据表达。
- [DeepEP V1 legacy 文档](https://github.com/deepseek-ai/DeepEP/blob/main/docs/legacy.md) —— 含 normal/LL 示例，"dispatch 内部不知道会收到多少 token" 及 normal 路径的 CUDA graph 说明。
- [V1 源码 `deep_ep/buffer.py`](https://github.com/deepseek-ai/DeepEP/blob/v1.0.0/deep_ep/buffer.py) —— `Buffer.dispatch/combine`、`get_dispatch_layout` 的逐参数 docstring（用 `v1.0.0` tag 访问，main 分支已被 V2 替换）。
- [V2 源码 `deep_ep/buffers/elastic.py`](https://github.com/deepseek-ai/DeepEP/blob/main/deep_ep/buffers/elastic.py) —— `ElasticBuffer.dispatch/combine` 与 `EPHandle`。
- [deepep 源码分析（一）—— notify_dispatch](https://blog.csdn.net/u010643777/article/details/160667834) —— 含各 rank `num_tokens_per_rank` 不同的数值示例，直观展示变长协商。
