---
title: AI Coding Agent
description: 能自主理解、修改、验证代码的 AI 智能体
date: 2026-07-25
tags: [concept, ai-agent, coding, automation]
aliases: []
---

# AI Coding Agent

## Definition

AI Coding Agent 是指能够接收自然语言指令、自主读取代码上下文、执行编辑/测试/调试/提交等操作，并持续迭代直到满足目标的 AI 智能体。代表产品包括 [[entities/Claude Code|Claude Code]]、[[entities/Cursor|Cursor]] Agent、GitHub Copilot 等。

## Core practices

| 实践 | 说明 |
|---|---|
| Plan Mode | 动手前让 Agent 生成计划，复杂任务尤其重要 |
| 上下文管理 | 只给相关上下文，避免噪音；必要时开新 session |
| Rules / Skills | 把不变约束和领域知识抽象成可复用配置 |
| TDD | 用测试定义可验证目标，Agent 按红-绿-重构循环推进 |
| 多 Agent 并行 | 子任务隔离、多模型投票、结果对比 |
| 云端 Agent | 长任务在远程沙箱运行，完成后异步通知 |

## Related concepts

- [[entities/Claude Code|Claude Code]]
- [[entities/Cursor|Cursor]]
- [[concepts/Loop Engineering|Loop Engineering]] — 循环驱动的工作方式
- [[concepts/Plan Mode|Plan Mode]]
- [[concepts/Rules and Skills|Rules and Skills]]

## Sources

- [[sources/src-cursor-agent-best-practice|src-cursor-agent-best-practice]]
- [[sources/src-claude-code-loop-engineering|src-claude-code-loop-engineering]]
