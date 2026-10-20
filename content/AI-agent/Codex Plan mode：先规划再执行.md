---
title: Codex Plan mode：先规划再执行
tags:
  - ai-agent
  - codex
aliases:
  - Codex 计划模式
created: 2026-10-20
source: https://developers.openai.com/blog/run-long-horizon-tasks-with-codex
---

# Codex Plan mode：先规划再执行

Codex 有原生 **Plan mode（计划模式）**，App、CLI 和 IDE 插件都支持。它与 Claude Code Plan mode 的用途类似：在开始修改代码前，先探索现有实现、澄清需求，并形成可审阅的实施方案。

## 如何开启

在输入框使用 `/plan` 切换到 Plan mode，然后描述任务。

例如：

> 帮我规划一下如何重构这个模块。先分析现有实现，列出方案、涉及文件、风险和验证方法，暂时不要改代码。

## 工作方式

1. 阅读代码，了解当前实现与约束。
2. 需求不明确时，提出关键问题。
3. 将任务拆成清晰、可审阅的实施步骤。
4. 与用户对齐方案后，再进入实施阶段。

## 什么时候用

- **适合先规划**：需求还不明确、跨多个模块的重构，或需要先比较技术方案的改动。
- **可以直接执行**：范围清楚的小修复、简单文案修改，或已经有明确方案的重复任务。

这与 [[Cursor Agent Best Practice#Plan Mode]] 中“复杂任务先规划、简单任务直接执行”的建议一致。

Plan mode 管的是工作流程；审批与沙箱权限是另一个维度，相关参数见 [[Codex CLI 权限模式速查]]。

## 来源

- [OpenAI：Run long horizon tasks with Codex](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex)：说明 App、CLI 和 IDE 插件支持原生 Plan mode，并通过 `/plan` 开启。核对日期：2026-10-20。
