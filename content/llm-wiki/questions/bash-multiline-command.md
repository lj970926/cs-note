---
title: "Bash 脚本中执行临时多行命令的方式"
date: 2026-07-29
tags: [question, bash, shell]
aliases: []
created: 2026-07-29
---

# Bash 脚本中执行临时多行命令的方式

## Question

bash 脚本里执行一个临时的多行命令，有什么好的方式？

## Answer

五种常用方式，按场景选型：

### 1. Heredoc 喂给解释器（最常用）

```bash
python3 <<'EOF'
import json
print(json.dumps({"a": 1}))
EOF
```

定界符加引号（`<<'EOF'`）阻止 `$` 展开，内容原样执行。详见 [[concepts/Heredoc|Heredoc]]。

### 2. `bash -c` + 多行字符串

```bash
bash -c '
  cd /tmp
  echo "step 1"
'
```

单引号包裹避免提前展开；适合需要新 shell 上下文的场景。注意内部别再用单引号。

### 3. `$'...'` ANSI-C 引号

```bash
ssh remote $'cd /app\ngit pull\nsystemctl restart app'
```

`\n` 变真实换行，适合 ssh / docker exec 远程场景。

### 4. 命令分组 `{ ...; }`

```bash
{
  echo "=== start ==="
  do_something
} >> run.log 2>&1
```

在当前 shell 里把多行当整体，适合统一重定向。

### 5. 临时文件

```bash
tmp=$(mktemp)
cat > "$tmp" <<'EOF'
...
EOF
python3 "$tmp"
rm "$tmp"
```

适合需要保留或调试脚本内容的场景。

## 选型表

| 场景 | 推荐 |
|---|---|
| 跑一段 Python/Node/SQL | heredoc（`<<'EOF'`） |
| 远程 ssh 执行多条 | `$'...\n...'` 或 `ssh host bash -s <<'EOF'` |
| 统一日志重定向 | `{ }` 分组 |
| 需要传参/复用 | 直接定义函数 |

## Sources

- [[sources/src-bash-multiline-chat|src-bash-multiline-chat]]

## Follow-ups

- `<<-` 剥离 Tab 的行为与陷阱（只剥 Tab 不剥空格）
- `set -e` 与 heredoc 内命令失败的交互
