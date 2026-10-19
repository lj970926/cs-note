---
title: Codex CLI 权限模式速查
tags:
  - ai-agent
  - codex
aliases: []
created: 2026-10-19
source: https://developers.openai.com/codex/cli
---

# Codex CLI 权限模式速查

`codex --yolo` 是完全访问模式的快捷写法；完整参数为 `codex --dangerously-bypass-approvals-and-sandbox`。两者效果等价：跳过审批提示，并绕过沙箱限制。

```sh
codex --yolo
# 等价于
codex --dangerously-bypass-approvals-and-sandbox
```

这个模式会让 Codex 在当前机器上不受沙箱保护地运行命令，只应在可信环境中使用。日常工作流与权限设计可参考 [[Harness Engineering：以 Agent 为中心的工程实践]] 和 [[LLM Wiki]]。
