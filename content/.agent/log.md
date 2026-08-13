---
title: Agent Log
tags:
  - agent
  - meta
  - log
draft: true
created: 2026-08-11
---

# Agent Log —— 时间线

> 追加式（append-only）日志，记录 Agent 对笔记库的操作。
> 只在用户明确要求记录后才新增条目；不要改写历史记录。

| 前缀 | 含义 |
|------|------|
| `ingest` | 收录外部资料（文章/论文/网页），整理成笔记 |
| `note` | 新建一篇笔记 |
| `update` | 更新已有笔记 |
| `query` | 一次值得留痕的查询/综合（可选） |
| `lint` | 健康检查（查死链、孤儿页、矛盾等） |
| `init` | 结构/约定变更 |

> 最近 5 条：`grep "^## \[" log.md | tail -5`

---

## [2026-08-11] init | 建立 Agent 工作目录与索引

- 新增 `content/AGENTS.md`、`content/CLAUDE.md`，规定回答前先检索笔记、仅在用户明确要求时写笔记。
- 新增 `.agent/index.md`（导航目录，按主题收录全部已发布笔记的一行摘要）与本日志。
- `quartz.config.yaml` 的 `ignorePatterns` 加入 `.agent`、`AGENTS.md`、`CLAUDE.md`，移除已失效的 `llm-wiki`。
- `scripts/prepare-new-content-notes.mjs` 同步忽略这些路径，避免把 Agent 工作文件当作新笔记检查。

## [2026-08-11] update | 补充 MoE 量化粒度

- 在 [[MLSys/Model Quantization]] 的"KV Cache 量化"前新增 `MoE 量化的粒度：per-(expert, channel/block)` 小节：per-channel-per-expert 的 scale 形状 `[E, out_features]`、FP8 MoE 的 128×128 block quant、激活用 per-token-per-expert。

## [2026-08-11] note | 算法导论 (CLRS) 阅读路线

- 新增 [[book-notes/算法导论 (CLRS) 阅读路线]]：把 CLRS 35 章按"地基(Ch1–5) → 核心(Ch6–16) → 进阶图算法(Ch21–26) → 选读(Ch18–20,27–35)"四阶段组织，附阅读建议和与 LeetCode 的配合策略。
- 同步更新 `.agent/index.md` 的 book-notes 条目。

## [2026-08-12] note | DeepEP normal dispatch 各 rank 不同 token 数

- 新增 [[MLSys/DeepEP normal dispatch 各 rank 不同 token 数]]：normal(高吞吐) dispatch/combine 天然支持各 rank 不同 token 数，靠 count all-to-all/notify 协商收发布局；`num_tokens_per_rank` 等是可选预计算元信息而非等长约束；等长只在叠加 CUDA Graph 时由上层 padding 强加。
- 区分 V1 `Buffer` 与 V2 `ElasticBuffer`，并链接到 [[vLLM DP 协调、CUDA Graph 与 DeepEP Low Latency]] 说明 LL 路径的固定容量协议差异。
- 同步更新 `.agent/index.md` 的 MLSys 条目。

## [2026-08-13] note | 双调排序 (Bitonic Sort)

- 新增 [[MLSys/算子/双调排序 (Bitonic Sort)]]：整理双调序列、双调合并、伪代码、复杂度及其适合 GPU 并行执行的原因。
- 补充它与 [[top_k_top_p sampling]] 中小规模候选集排序/选择的联系，并说明 Top-k 不一定需要完整排序。
- 同步更新 `.agent/index.md` 的 MLSys 条目。

## [2026-08-13] note | Warp Shuffle

- 新增 [[MLSys/算子/Warp Shuffle]]：整理 CUDA warp 内寄存器交换机制、四类 shuffle intrinsic、warp reduce 与蝶形通信。
- 重点记录参与 mask、部分 warp、分支发散、无效来源 lane 以及 `_sync` 不等于内存屏障等易错点。
- 补充 `__shfl_xor_sync` 与 [[双调排序 (Bitonic Sort)]] 比较伙伴选择的联系，并同步更新 `.agent/index.md`。
