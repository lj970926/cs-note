---
title: "Chat: Bash 脚本中执行临时多行命令的方式"
date: 2026-07-29
tags: [raw, chat, bash, shell]
aliases: []
---

# Chat: Bash 脚本中执行临时多行命令的方式

> 2026-07-29 Claude Code 会话存档。本文件为原始材料，归档后不再修改。

## Q

bash 脚本里执行一个临时的多行命令，有什么好的方式吗？

## A

在 bash 脚本里执行"临时多行命令"，常用方式按场景分：

### 1. Heredoc 喂给解释器（最常用）

适合临时跑一段 Python/SQL/其他脚本：

```bash
python3 <<'EOF'
import json
data = {"a": 1}
print(json.dumps(data, indent=2))
EOF
```

**关键点：`<<'EOF'` 加引号**，内容里的 `$变量` 不会被 bash 展开——这才是"原样执行"的保证。不加引号（`<<EOF`）则会做变量替换，通常是你不想要的。

### 2. `bash -c` + 多行字符串

适合要在一个新 shell 上下文里跑几条 bash 命令：

```bash
bash -c '
  cd /tmp
  echo "step 1"
  echo "step 2"
'
```

单引号包裹，内部不会提前展开。要注意内部别再用单引号，或者用 `$'...'` 转义。

### 3. `$'...'` ANSI-C 引号（一行命令带换行）

```bash
ssh remote $'cd /app\ngit pull\nsystemctl restart app'
```

把 `\n` 变成真实换行，适合 ssh、docker exec 这类远程场景——对方收到的是多条命令。

### 4. 命令分组 `{ ...; }`

只是想在当前 shell 里把多行当一个整体（比如统一重定向）：

```bash
{
  echo "=== start ==="
  do_something
  echo "=== end ==="
} >> run.log 2>&1
```

### 5. 临时文件（需要保留/调试时）

```bash
tmp=$(mktemp)
cat > "$tmp" <<'EOF'
...多行内容...
EOF
python3 "$tmp"
rm "$tmp"
```

### 怎么选

| 场景 | 推荐 |
|---|---|
| 跑一段 Python/Node/SQL | heredoc（`<<'EOF'`） |
| 远程 ssh 执行多条 | `$'...\n...'` 或 heredoc 管道：`ssh host bash -s <<'EOF'` |
| 统一日志重定向 | `{ }` 分组 |
| 需要传参/复用 | 不如直接定义一个函数 |

最常见的坑就是 heredoc 忘了给定界符加引号，导致 `$` 被意外展开——记住：**想原样执行就写 `<<'EOF'`**。
