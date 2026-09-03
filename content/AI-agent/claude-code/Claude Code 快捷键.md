---
title: Claude Code 快捷键
tags:
  - claude-code
  - 快捷键
  - 工具链
created: 2026-09-03
aliases: []
---

> [!abstract] 一句话总结
> Claude Code 的输入框遵循 readline/emacs 风格：**清空全部输入用 `Ctrl+U`**（光标在行尾时），或 `Ctrl+A` 到行首后 `Ctrl+K`；`Esc` 打断当前操作，`Shift+Tab` 切换权限模式。

---

## 1. 编辑输入（readline / emacs 风格）

| 快捷键 | 作用 |
|---|---|
| `Ctrl + A` / `Ctrl + E` | 光标移到行首 / 行尾 |
| `Ctrl + U` | 删除光标**前**的所有内容（光标在行尾时 = 清空整行） |
| `Ctrl + K` | 删除光标**后**的所有内容 |
| `Ctrl + W` | 删除光标前一个单词 |
| `Ctrl + Y` | 粘贴刚删除的内容（yank） |
| `Option + ←` / `Option + →` | 按单词移动光标（macOS） |

> [!tip] 一键清空输入
> 光标在行尾时直接 `Ctrl + U`；不确定光标位置就先 `Ctrl + A` 再 `Ctrl + K`。

## 2. 发送与换行

| 快捷键 | 作用 |
|---|---|
| `Enter` | 发送 |
| `Option + Enter` | 换行（macOS 常用） |
| `Shift + Enter` 或 `Ctrl + J` | 换行（取决于终端配置） |

## 3. 会话控制

| 快捷键 | 作用 |
|---|---|
| `Esc` | 打断 Claude 当前操作 |
| `Esc` `Esc`（双击） | 回到历史消息继续编辑（rewind） |
| `Ctrl + C` | 清空输入框；连按两次退出 |
| `Ctrl + D` | 输入框为空时退出会话 |
| `Ctrl + L` | 清屏 |
| `Ctrl + R` | 搜索历史输入 |
| `↑` / `↓` | 浏览历史输入 |
| `Shift + Tab` | 循环切换权限模式（普通 → 自动接受编辑 → 计划模式） |
| `Ctrl + B` | 把运行中的 Bash 命令放到后台（见 [[AI-agent/claude-code/Claude Code Loop 工程：loop、goal 与 schedule]]；tmux 下需连按两次） |
| `Ctrl + T` | 切换任务列表视图 |

## 4. 输入框的特殊前缀

不是快捷键，但同样改变输入行为：

| 前缀 | 作用 |
|---|---|
| `#` | 快速写入 memory |
| `!` | 直接运行 shell 命令，输出进入对话 |
| `@` | 引用文件路径 |
| `/` | 打开 slash command 菜单 |

## 5. 自定义键位

键位可通过 `~/.claude/keybindings.json` 自定义（VS Code 风格 JSON）。具体 schema 见官方文档。

> [!note] 时效性
> 快捷键随版本迭代，以 [Claude Code 官方文档的 Interactive Mode 页面](https://code.claude.com/docs/en/interactive-mode) 为准。

---

## 相关笔记

- [[命令行工具/shell 快捷键]] —— readline/emacs 风格快捷键在 shell 里的对应版本
- [[AI-agent/claude-code/Claude Code Loop 工程：loop、goal 与 schedule]] —— `Ctrl+B` 后台任务、`Esc` 停止 loop 等与会话控制相关的深入内容
