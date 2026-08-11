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
