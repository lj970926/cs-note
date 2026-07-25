---
title: Rules and Skills
description: 给 AI Agent 的持久化约束与领域知识配置
date: 2026-07-25
tags: [concept, ai-agent, prompt-engineering, configuration]
aliases: []
---

# Rules and Skills

## Definition

Rules 与 Skills 是把对 AI Agent 的约束、背景知识和可复用工作流持久化的配置机制。Rules 通常聚焦、稳定、进入初始上下文；Skills 按需加载，承载更具体的领域知识。

## Rules

- 聚焦必要且不太会变动的要求
- 多用文件引用，保持精简、少修改
- 只在 Agent 反复犯同样错误时才动态新增

## Skills

- 承载领域知识，模型按需取用
- frontmatter 会进入初始上下文，需要尽量精简
- 适合封装可复用的工作流或框架知识

## Guiding principle

所有需要进初始上下文的东西都应满足：**简洁、清晰、正确、关键**。

## Related

- [[concepts/AI Coding Agent|AI Coding Agent]]
- [[entities/Cursor|Cursor]]
- [[entities/Claude Code|Claude Code]]
- [[sources/src-cursor-agent-best-practice|src-cursor-agent-best-practice]]
