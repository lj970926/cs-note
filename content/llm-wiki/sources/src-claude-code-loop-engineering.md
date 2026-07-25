---
title: "src-claude-code-loop-engineering"
description: "Claude Code Loop 工程：/loop、/goal 与 /schedule"
date: 2026-07-25
tags: [source, claude-code, loop-engineering, agent]
source_type: note
local_ref: "[[AI-agent/claude-code/Claude Code Loop 工程：loop、goal 与 schedule]]"
aliases: []
---

# src-claude-code-loop-engineering

## One-line summary

[[entities/Claude Code|Claude Code]] 的 loop engineering 把“逐条 prompt 驱动”升级为“循环驱动”，核心原语是 `/loop`（时间驱动）、`/goal`（完成条件驱动）和 `/schedule`（持久调度）。

## Source

- Vault note: [[AI-agent/claude-code/Claude Code Loop 工程：loop、goal 与 schedule]]

## Key claims

1. Claude Code 的 loop 分为四类：turn-based、goal-based、time-based、proactive，自动化程度依次升高。
2. `/loop` 是 session 级定时重复，适合轮询 CI、部署状态等“靠节奏触发”的任务；关了终端即失效。
3. `/goal` 是 session 级 Stop hook，由独立评估模型判断完成条件是否满足；条件必须可验证，最好加 turn 上限并要求展示验证证据。
4. `/schedule` 分 session 内 cron 与云端 routine，后者可跨关机存活，适合每日 triage 等长期任务。
5. 选型原则：有验证终点用 `/goal`，等外部变化用 `/loop`，关机后仍要跑用 `/schedule` 云端 routine。
6. 可观测性现状：`/goal` 有状态指示器，`/loop` 几乎不可见，需要自己记着开了哪些 loop。

## Linked pages

- [[entities/Claude Code|Claude Code]]
- [[concepts/Loop Engineering|Loop Engineering]]
