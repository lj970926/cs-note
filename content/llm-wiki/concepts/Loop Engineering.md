---
title: Loop Engineering
description: 用循环（loop）而非逐条 prompt 驱动 LLM 持续工作的方法论
date: 2026-07-25
tags: [concept, agent, claude-code, automation]
aliases: []
---

# Loop Engineering

## Definition

Loop engineering 是一种 LLM 工作方式：不再逐条人工 prompt，而是设计**循环**——系统自动决定下一步、自动判断何时停止。由 Anthropic 在 2026 年中提出，并在 Claude Code 中以 `/loop`、 `/goal`、 `/schedule` 等原语产品化。

## Loop 的四种类型

| 类型         | 触发方式            | 停止条件       | 适用场景        |
| ---------- | --------------- | ---------- | ----------- |
| Turn-based | 人工逐条 prompt     | 每个 turn 结束 | 日常交互 + 显式验证 |
| Goal-based | 上一 turn 结束      | 模型确认条件满足   | 有可验证终点的工作   |
| Time-based | 时间间隔到达          | 手动停止或任务完成  | 轮询、周期检查     |
| Proactive  | 事件或 schedule 触发 | 每次任务目标达成   | 长时间无人值守任务流  |

## Core primitives in Claude Code

- `/loop` — 时间驱动的 session 级重复。适合盯 CI、看部署。关了终端即停，可观测性较弱。
- `/goal` — 条件驱动的 session 级任务。由独立评估模型判断完成条件；条件需可验证，建议加 turn 上限。
- `/schedule` — 持久调度。session 内 cron 7 天过期；云端 routine 可跨关机存活，但有每日运行上限。

## Related concepts

- [[entities/Claude Code|Claude Code]]
- [[concepts/Agentic Workflow|Agentic Workflow]]
- [[concepts/Stop Hook|Stop Hook]]

## Sources

- [[sources/src-claude-code-loop-engineering|src-claude-code-loop-engineering]]
- [Loop engineering: Getting started with loops](https://claude.com/blog/getting-started-with-loops)
- [Introducing routines in Claude Code](https://claude.com/blog/introducing-routines-in-claude-code)
