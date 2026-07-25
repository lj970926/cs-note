---
title: Plan Mode
description: 让 AI 在动手前先产出执行计划的模式
date: 2026-07-25
tags: [concept, ai-agent, planning, workflow]
aliases: []
---

# Plan Mode

## Definition

Plan Mode 是 AI 编程工具中的一种交互模式：在让 Agent 实际修改代码前，先让它分析需求、产出执行计划并与用户确认。目的是减少反复试错，确保关键问题在动手前被充分讨论。

## When to use

- 复杂、跨模块或容易遗漏边界条件的任务
- 用户自己也不确定最佳实现路径时
- Agent 已走进死胡同，需要重新梳理思路时

## Trade-offs

| 场景 | 建议 |
|---|---|
| 复杂任务 | 使用 Plan Mode，先规划再执行 |
| 简单、重复、做过很多次的小改动 | 直接交给 Agent 处理 |
| Agent 多次修改仍不符合预期 | 回到计划，细化需求，避免重复犯错 |

## Related

- [[concepts/AI Coding Agent|AI Coding Agent]]
- [[entities/Cursor|Cursor]]
- [[sources/src-cursor-agent-best-practice|src-cursor-agent-best-practice]]
