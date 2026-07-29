---
title: GitHub Copilot
description: GitHub 出品的 AI 编程助手，覆盖 IDE 补全、Chat、CLI 与云端 agent
date: 2026-07-29
tags: [entity, tool, ai-coding]
aliases: [Copilot]
---

# GitHub Copilot

## Definition

**GitHub Copilot** 是 GitHub 出品的 AI 编程助手，产品线覆盖 IDE 内联补全、Copilot Chat、Copilot CLI 与云端 coding agent，支持 VS Code、JetBrains、Visual Studio、Xcode、Eclipse 等 IDE。

## Attributes

- **厂商**：GitHub（Microsoft）
- **模型策略**：多模型可选（OpenAI、Anthropic、Google 等），并提供 [[concepts/Model Routing|Auto 模型路由]]——结合任务复杂度评估与系统健康度自动选模型；付费用户用 Auto 有 10% premium request 折扣
- **计费**：按 premium request 乘数计费，Auto 按实际选中的模型计费

## Related

- [[concepts/AI Coding Agent|AI Coding Agent]]
- [[entities/Cursor|Cursor]] — 竞品，同样提供 Auto 路由（Cursor Router）
- [[entities/Claude Code|Claude Code]]

## Sources

- [[sources/src-model-routing-chat|src-model-routing-chat]]
