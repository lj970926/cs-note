---
title: Codex CLI 使用指南
tags:
  - ai-agent
  - codex
aliases:
  - Codex CLI 权限模式速查
  - Codex CLI 恢复会话（resume）
  - Codex resume
  - Codex Plan mode：先规划再执行
  - Codex 计划模式
created: 2026-10-19
updated: 2026-10-20
source:
  - https://learn.chatgpt.com/docs/developer-commands?surface=cli
  - https://developers.openai.com/blog/run-long-horizon-tasks-with-codex
---

# Codex CLI 使用指南

整理 Codex CLI 的恢复会话、计划模式与权限参数，作为日常使用的统一入口。

## 恢复会话（resume）

恢复历史会话使用 **`codex resume` 子命令**，不是 `codex --resume`。

```sh
# 打开历史会话列表，选择要恢复的会话
codex resume

# 直接继续当前工作目录最近的会话
codex resume --last

# 显示所有目录的会话，找不到历史会话时可用
codex resume --all

# 跨目录恢复最近的会话
codex resume --last --all

# 恢复指定会话：将 <SESSION_ID> 替换为真实会话 ID
codex resume <SESSION_ID>
```

默认按当前工作目录筛选会话；`--all` 取消目录筛选。日常接着上次的工作，通常在原项目目录执行 `codex resume --last` 即可。

恢复会话时也可以传入模型、审批和沙箱选项；权限参数见 [[#权限模式]]。

## Plan mode：先规划再执行

Codex 有原生 **Plan mode（计划模式）**，App、CLI 和 IDE 插件都支持。它与 Claude Code Plan mode 的用途类似：在开始修改代码前，先探索现有实现、澄清需求，并形成可审阅的实施方案。

### 如何开启

在输入框使用 `/plan` 切换到 Plan mode，然后描述任务。

例如：

> 帮我规划一下如何重构这个模块。先分析现有实现，列出方案、涉及文件、风险和验证方法，暂时不要改代码。

### 工作方式

1. 阅读代码，了解当前实现与约束。
2. 需求不明确时，提出关键问题。
3. 将任务拆成清晰、可审阅的实施步骤。
4. 与用户对齐方案后，再进入实施阶段。

### 什么时候用

- **适合先规划**：需求还不明确、跨多个模块的重构，或需要先比较技术方案的改动。
- **可以直接执行**：范围清楚的小修复、简单文案修改，或已经有明确方案的重复任务。

这与 [[Cursor Agent Best Practice#Plan Mode]] 中“复杂任务先规划、简单任务直接执行”的建议一致。

计划模式用于组织先规划再执行的工作流程，审批与沙箱权限见下一节。

## 权限模式

`codex --yolo` 是完全访问模式的快捷写法；完整参数为 `codex --dangerously-bypass-approvals-and-sandbox`。两者效果等价：跳过审批提示，并绕过沙箱限制。

```sh
codex --yolo
# 等价于
codex --dangerously-bypass-approvals-and-sandbox
```

这个模式会让 Codex 在当前机器上不受沙箱保护地运行命令，只应在可信环境中使用。日常工作流与权限设计可参考 [[Harness Engineering：以 Agent 为中心的工程实践]] 和 [[LLM Wiki]]。

## 来源

- [OpenAI 官方文档：Codex CLI 命令参考](https://learn.chatgpt.com/docs/developer-commands?surface=cli)，其中 [codex resume](https://learn.chatgpt.com/docs/developer-commands?surface=cli#codex-resume) 说明会话恢复参数。
- [OpenAI：Run long horizon tasks with Codex](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex)：说明 App、CLI 和 IDE 插件支持原生 Plan mode，并通过 `/plan` 开启。
- 本机 `codex --help` 与 `codex resume --help`。恢复会话与 Plan mode 核对日期：2026-10-20；权限模式沿用 2026-10-19 的记录。
