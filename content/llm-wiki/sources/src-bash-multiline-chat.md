---
title: "Source: Chat Bash 脚本中执行临时多行命令"
source_type: chat
local_raw: "[[llm-wiki/raw/chats/2026-07-29-bash-multiline-command]]"
ingested: 2026-07-29
tags: [source, chat, bash, shell]
aliases: []
created: 2026-07-29
---

# Source: Chat Bash 脚本中执行临时多行命令

## One-line summary

2026-07-29 Claude Code 会话：整理 bash 脚本中执行临时多行命令的五种方式（heredoc、`bash -c`、ANSI-C 引号、命令分组、临时文件）及场景选型。

## Key claims

- Heredoc 喂解释器（如 `python3 <<'EOF'`）是最常用方式；定界符加引号 `<<'EOF'` 才能阻止 `$` 变量展开，保证内容原样执行。
- `bash -c '多行字符串'` 适合在新 shell 上下文跑几条命令；`$'...\n...'` ANSI-C 引号适合 ssh / docker exec 远程场景。
- `{ ...; }` 命令分组不改变执行上下文，适合统一重定向日志。
- 临时文件（`mktemp`）适合需要保留或调试脚本内容的场景；需要传参/复用时直接定义函数更合适。
- 最常见的坑：heredoc 定界符忘加引号导致 `$` 被意外展开。

## Key concepts

- [[concepts/Heredoc|Heredoc]]

## Linked pages

- [[concepts/Heredoc|Heredoc]]
- [[questions/bash-multiline-command|Bash 脚本中执行临时多行命令的方式]]
