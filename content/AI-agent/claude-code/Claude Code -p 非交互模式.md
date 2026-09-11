---
title: Claude Code -p 非交互模式
tags:
  - claude-code
  - 工具链
  - cli
created: 2026-09-11
aliases:
  - claude -p
---

> [!abstract] 一句话总结
> `claude -p`（`--print`）是 Claude Code CLI 的非交互（headless）模式：接收一次输入、执行完直接把结果打印到 stdout，适合脚本和自动化场景。交互模式是"聊天窗口"（参见 [[Claude Code 快捷键]]），`-p` 是"把 Claude Code 当命令行工具调用"。

---

## 基本用法

```bash
# 一次性提问
claude -p "这个报错是什么原因？" < error.log

# 从管道读取输入
git diff | claude -p "review 这个 diff"

# 指定输出格式（脚本里解析用）
claude -p "总结这个文件" --output-format json
```

## 常用参数与行为

- `-c` / `--continue`：接着上一次会话继续；`-r` / `--resume <id>`：恢复指定会话。
- `--output-format`：`text`（默认）、`json`、`stream-json`；`json` 附带 cost、session_id 等结构化字段。
- stdin 会并入上下文：管道传文件内容时无需手动转述。
- 退出码区分成功 / 权限拒绝 / API 错误，适合在 shell 脚本里判断。
- 环境变量同样生效（`ANTHROPIC_API_KEY`、`CLAUDE_CODE_*`），常用于 CI、pre-commit、定时任务。
- 后台/长驻自动化场景可结合 [[Claude Code Loop 工程：loop、goal 与 schedule]] 中的 goal 与 schedule 能力。

## 什么时候用哪个

- 人在场、要来回讨论 → 交互模式。
- 一次成型、要拿结果继续处理（脚本、CI、批处理）→ `claude -p`。
