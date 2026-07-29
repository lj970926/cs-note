---
title: Heredoc
description: Shell 中把多行文本原样传递给命令的标准输入的重定向语法
date: 2026-07-29
tags: [concept, bash, shell]
aliases: [here document, here-doc]
---

# Heredoc

## Definition

**Heredoc**（here document）是 Shell 中的一种重定向语法，用 `<<` 加一个定界符把随后的多行文本作为命令的标准输入，直到定界符单独成行结束。它是在脚本中内嵌多行文本（临时脚本、SQL、配置片段）的标准方式。

## Basic syntax

```bash
command <<'DELIMITER'
...多行内容...
DELIMITER
```

- 定界符惯用 `EOF` / `END`，可任意命名；结束行**不能有任何前导空白**（除非用 `<<-`，见下）。
- 内容原样进入 command 的 stdin。

## Quoting semantics（最重要的细节）

定界符是否加引号决定 bash 是否对内容做展开：

| 写法 | 行为 |
|---|---|
| `<<EOF`（无引号） | 内容中的 `$变量`、`` `命令` ``、`$(...)` 会被 bash **展开** |
| `<<'EOF'`（单引号） | 内容**完全原样**，不做任何展开 |
| `<<"EOF"`（双引号） | 同单引号，不展开 |

**经验法则：想把内容原样喂给解释器就写 `<<'EOF'`。** 忘记加引号是最常见的坑——脚本里的 `$` 会被当前 shell 提前吃掉。

## `<<-`：剥离前导 Tab

`<<-EOF` 会剥掉每行行首的 **Tab**（仅 Tab，不含空格），允许内容在脚本中缩进书写，保持可读性：

```bash
if true; then
	cat <<-EOF
		第一行
		第二行
	EOF
fi
```

## Common patterns

- **喂给解释器跑临时脚本**：`python3 <<'EOF' ... EOF`
- **远程执行多条命令**：`ssh host bash -s <<'EOF' ... EOF`（远端 bash 从 stdin 读脚本）
- **写入文件**：`cat > file <<'EOF' ... EOF`（配合 `mktemp` 做临时脚本）
- **多行变量赋值**：`var=$(cat <<'EOF' ... EOF)`

## Related concepts

- [[concepts/ANSI-C Quoting|ANSI-C Quoting]] — `$'...'` 转义语法，适合单行内嵌换行的场景
- [[concepts/Command Grouping|Command Grouping]] — `{ ...; }` 把多条命令当整体，适合统一重定向

## Sources

- [[sources/src-bash-multiline-chat|src-bash-multiline-chat]]
