---
title: AIPerf：压测 LLM Serving 与多轮数据集
tags:
  - benchmarking
  - performance
  - aiperf
  - inference-serving
aliases:
  - AIPerf 压测 LLM Serving
  - AIPerf：压测 vLLM 与多轮数据集
created: 2026-09-04
description: 用 AIPerf 压测 OpenAI-compatible LLM serving 服务，覆盖基线命令、指标、GPU 监控与单轮/多轮/原始请求数据集。
source:
  - https://docs.nvidia.com/aiperf/tutorials/model-endpoint-guides/profile-open-ai-compatible-text-ap-is-using-ai-perf
  - https://docs.nvidia.com/aiperf/dev/tutorials/datasets-inputs/custom-dataset-guide
  - https://docs.nvidia.com/aiperf/dev/reference/conversation-context-mode
---

# AIPerf：压测 LLM Serving 与多轮数据集

> [!summary]
> AIPerf 是向 OpenAI-compatible API 发真实请求的压测客户端。它可压测 vLLM、SGLang、TensorRT-LLM 等 serving 服务，不依赖 Dynamo；Dynamo 只是在测量目标变为 frontend、路由、多个 worker 或 PD 分离等整套服务时才需要出现在路径中。

[[MLSys/vllm/vLLM 监控：使用 Binary 部署 Prometheus + Grafana]] 已覆盖 vLLM 的 Prometheus/Grafana 监控；本页补充用 AIPerf 产生可控压测流量、读取端到端指标，以及组织真实对话数据集的方法。

## 1. 直接压测 OpenAI-compatible 服务

以下用 vLLM 举例；其他 OpenAI-compatible 服务替换 URL、模型名或 endpoint 即可。模型名应以 `/v1/models` 返回的值为准：

```bash
MODEL=Qwen/Qwen3-32B-FP8

vllm serve "$MODEL" --host 0.0.0.0 --port 8000
curl http://localhost:8000/v1/models

pip install aiperf
```

以固定 2k input / 256 output、10 并发为基线：

```bash
aiperf profile \
  --model "$MODEL" \
  --url http://localhost:8000 \
  --endpoint-type chat \
  --streaming \
  --synthetic-input-tokens-mean 2000 \
  --synthetic-input-tokens-stddev 0 \
  --output-tokens-mean 256 \
  --output-tokens-stddev 0 \
  --extra-inputs min_tokens:256 \
  --extra-inputs ignore_eos:true \
  --concurrency 10 \
  --request-count 100 \
  --warmup-request-count 5 \
  --artifact-dir artifacts/vllm-baseline
```

- `--endpoint-type chat` 默认对应 `/v1/chat/completions`；测 `/v1/completions` 时改用 `completions`。
- `--streaming` 才能测量 TTFT 和 ITL。
- input/output token 的标准差设为 `0`，并用 `min_tokens` 与 `ignore_eos` 限制提前结束，可让不同实验的请求形状可比。
- 扫并发时固定模型、ISL、OSL、请求数和随机种子，只改变 `--concurrency`；在延迟明显恶化前的最高稳定吞吐附近寻找饱和点。

## 2. 指标与产物

重点记录：

| 指标 | 含义 | 常见归因 |
| --- | --- | --- |
| TTFT | 首 token 前的时间 | 排队、路由、prefill |
| ITL | 相邻输出 token 的间隔 | decode 调度、batch、带宽 |
| Request Latency / P99 | 完整请求及尾延迟 | 用户体验、负载过饱和 |
| Output Token Throughput | 总生成吞吐 | 系统容量 |

`--artifact-dir` 下常用文件：

- `profile_export_aiperf.csv`：聚合指标，适合横向比较。
- `profile_export_aiperf.json`：聚合结果和本次配置。
- `profile_export.jsonl`：逐请求指标，可定位 P99 尖刺或失败。
- `inputs.json`：实际发送的 payload，可用于精确重放。

vLLM 的 `/metrics` 是 Prometheus endpoint，AIPerf 默认会发现并采集服务端指标。若压测机正是 GPU 所在机器，可增加 `--gpu-telemetry pynvml`；跨机器采集 GPU 指标则在服务端使用 DCGM exporter。

## 3. 数据集选型

| 目标 | 数据集类型 | 数据是否包含 assistant 回复 |
| --- | --- | --- |
| 固定长度容量基线 | synthetic | 不适用 |
| 独立真实 prompt | `single_turn` JSONL | 否 |
| 真实交互式多轮聊天 | `multi_turn` JSONL | 通常否，使用运行时生成结果 |
| 固定上下文的严格 A/B | `raw_payload` JSONL 或 `inputs_json` | 是，payload 原样发送 |
| 复现线上到达时间 | Mooncake/Bailian JSONL、Baseten Parquet trace | 由 trace 定义 |
| 公共对话集 | `--public-dataset sharegpt` 等 | 由内置 loader 定义 |

自定义数据通常选 JSONL，每行一个 JSON 对象；本地已有的原始 ShareGPT 文件并不必然能直接作为 AIPerf 的自定义数据，应转换为下列格式，或直接使用 `--public-dataset sharegpt`。

### 3.1 单轮：`single_turn`

每行一个独立请求：

```jsonl
{"text":"解释一下 PagedAttention。"}
{"text":"比较 TP 与 PP 的适用场景。","output_length":256,"extra":{"temperature":0}}
```

```bash
aiperf profile --model "$MODEL" --url http://localhost:8000 \
  --endpoint-type chat --streaming \
  --input-file prompts.jsonl --custom-dataset-type single_turn \
  --concurrency 8 --request-count 100
```

`output_length` 会覆盖全局 OSL；`extra` 中的字段会合并到该请求的 API body。

### 3.2 多轮：`multi_turn` 会使用运行时真实输出

```jsonl
{"session_id":"chat_001","turns":[{"text":"什么是 KV Cache？"},{"text":"它为何影响长上下文推理？"}]}
```

默认的 `deltas_without_responses` 模式中，数据集只给每一轮新增的用户输入。AIPerf 会在同一 session 内顺序执行：

```text
turn 1 数据：用户 U1
请求 1：[U1] → vLLM 实际回复 A1
turn 2 数据：用户 U2
请求 2：[U1, A1, U2] → vLLM 实际回复 A2
```

这会反映真实聊天时的上下文增长和 prefix cache 行为；但被测模型的回复内容或长度变化，也会使后续请求随之变化。因此，它适合交互行为和多轮缓存测试，而不是最严格的同输入 A/B 对比。

### 3.3 固定完整历史：`raw_payload`

若要让每次运行收到完全相同的请求，把完整的 OpenAI payload 写入 JSONL。`messages`、`temperature`、`max_tokens`、`tools` 等字段都会原样发送：

```jsonl
{"model":"Qwen/Qwen3-32B-FP8","messages":[{"role":"user","content":"什么是 KV Cache？"}],"max_tokens":128,"temperature":0}
{"model":"Qwen/Qwen3-32B-FP8","messages":[{"role":"user","content":"什么是 KV Cache？"},{"role":"assistant","content":"KV Cache 是……"},{"role":"user","content":"它为何影响长上下文推理？"}],"max_tokens":128,"temperature":0}
```

```bash
aiperf profile --model "$MODEL" --url http://localhost:8000 \
  --endpoint-type chat --streaming \
  --input-file payloads.jsonl --custom-dataset-type raw_payload \
  --concurrency 8
```

这里第二条中的 assistant 内容是数据集固定的历史，而不是第一条本轮压测产生的输出。若 `raw_payload` 输入是目录，每个 `.jsonl` 文件代表一个多轮 session，且每行都应带齐其所需历史。

### 3.4 重放 AIPerf 已跑过的请求：`inputs_json`

一次压测生成的 `inputs.json` 记录了实际 payload。用它可将相同输入发送给另一套 vLLM 配置：

```bash
aiperf profile --model "$MODEL" --url http://server-b:8000 \
  --endpoint-type chat --streaming \
  --input-file artifacts/vllm-baseline/inputs.json \
  --custom-dataset-type inputs_json \
  --concurrency 8
```

`inputs.json` 是多行格式的完整 JSON，必须显式指定 `inputs_json`，不能按普通 JSONL 读取。

## 4. 多轮与固定输入的取舍

- 要模拟真实用户：用 `multi_turn`。AIPerf 将当前服务的真实回复接入下一轮。
- 要公平比较服务端参数、模型版本或不同 serving engine：用 `raw_payload` 或从基准运行导出的 `inputs.json`。这样每次请求的 history 都固定。
- 要保持多轮但降低随机性：在 `extra` 或全局 `--extra-inputs` 中设 `temperature:0`，并尽量固定 output length；仍需注意不同服务的生成 token 数可能不同。

## 参考

- https://docs.nvidia.com/aiperf/tutorials/model-endpoint-guides/profile-open-ai-compatible-text-ap-is-using-ai-perf
- https://docs.nvidia.com/aiperf/dev/tutorials/datasets-inputs/custom-dataset-guide
- https://docs.nvidia.com/aiperf/dev/reference/conversation-context-mode
- https://docs.nvidia.com/aiperf/tutorials/datasets-inputs/raw-payload-replay
