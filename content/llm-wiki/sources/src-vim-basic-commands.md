---
title: "src-vim-basic-commands"
description: "VIM 基础命令速查笔记"
date: 2026-07-25
tags: [source, vim, tool, note]
source_type: note
local_ref: "[[coding-tools/VIM使用/基础命令]]"
aliases: []
---

# src-vim-basic-commands

## One-line summary

[[entities/Vim|Vim]] 普通模式、插入模式、可视模式和命令行模式的常用命令速查，强调操作符、动作和 Ex 命令的组合使用。

## Source

- Vault note: [[coding-tools/VIM使用/基础命令]]
- External cheat sheet: https://vim.rtorr.com/

## Key claims

1. 普通模式核心：删除/修改操作符（`d`/`c`）配合 motion，`f`/`t` 查找字符，`r`/`R` 替换。
2. 插入模式常用：`C-h`/`C-w`/`C-u` 删除，`C-r` 粘贴寄存器，`C-o` 临时进入普通模式。
3. 可视模式：按字符/行/列块三种选择，`o` 切换选区端点，`gv` 重选上次选区。
4. 命令行模式：`range` + `normal`/`t`/`m` 批量操作，`@:` 重复上次 Ex 命令，`q:` 进入命令历史窗口。

## Linked pages

- [[entities/Vim|Vim]]
- [[sources/src-practical-vim|src-practical-vim]]
- [[entities/Drew Neil|Drew Neil]]
