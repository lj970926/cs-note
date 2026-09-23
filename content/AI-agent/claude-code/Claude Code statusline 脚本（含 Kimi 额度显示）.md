---
title: Claude Code statusline 脚本（含 Kimi 额度显示）
tags:
  - claude-code
  - kimi
aliases: []
created: 2026-09-23
---

# Claude Code statusline 脚本（含 Kimi 额度显示）

自用 `~/.claude/statusline.sh`，在 Claude Code 底部状态栏显示：cwd、git 分支、模型、推理指标（首字延迟 / cache 命中率 / 输出速度）、上下文占用，以及 Kimi 订阅的 5 小时窗口与月度额度。

## 效果

```
~/code/quartz main k3-256k 首字 3s cache 85% · 12 tok/s ctx 24% (63k/262k) kimi 5h:8% 月:4%
```

## 配置方式

`~/.claude/settings.json`：

```json
{
  "statusLine": {
    "command": "~/.claude/statusline.sh",
    "type": "command"
  }
}
```

## 脚本全文

```bash
#!/usr/bin/env bash
# Claude Code status line.
# Segments: cwd (blue) · git branch (green) · model (gray) · cache-hit% + output tok/s (cyan)
# Metrics are read from the session transcript's last assistant message.

input=$(cat)

cwd=$(echo "$input"   | jq -r '.workspace.current_dir // empty')
branch=$(git -C "$cwd" --no-optional-locks rev-parse --abbrev-ref HEAD 2>/dev/null)
model=$(echo "$input" | jq -r '.model.display_name // empty')
tp=$(echo "$input"    | jq -r '.transcript_path // empty')

blue=$'\033[38;5;31m'; green=$'\033[38;5;76m'; gray=$'\033[38;5;245m'; cyan=$'\033[38;5;80m'; yellow=$'\033[38;5;179m'; purple=$'\033[38;5;141m'; reset=$'\033[0m'

out=""
[ -n "$cwd" ]    && out="${blue}${cwd}${reset}"
[ -n "$branch" ] && out="$out ${green}${branch}${reset}"
[ -n "$model" ]  && out="$out ${gray}${model}${reset}"

# --- inference metrics -------------------------------------------------------
if [ -n "$tp" ] && [ -f "$tp" ]; then
  # Last assistant message: cache tokens + output tokens + timestamp + prompt total.
  read -r hit ot ats prompt < <(grep '"type":"assistant"' "$tp" 2>/dev/null | tail -1 | jq -r '
    (.message.usage // {}) as $u
    | (($u.input_tokens // 0) + ($u.cache_read_input_tokens // 0) + ($u.cache_creation_input_tokens // 0)) as $prompt
    | [ (if $prompt > 0 then ((($u.cache_read_input_tokens // 0) * 100 / $prompt) | floor) else -1 end),
        ($u.output_tokens // 0),
        (.timestamp // ""),
        $prompt ]
    | @tsv' 2>/dev/null)

  # Request start ≈ timestamp of the last non-assistant entry that has one (user / tool result).
  uts=$(grep '"timestamp":' "$tp" 2>/dev/null | grep -v '"type":"assistant"' | tail -1 | jq -r '.timestamp // empty' 2>/dev/null)
  u_ep=$(date -j -u -f "%Y-%m-%dT%H:%M:%S" "${uts%%.*}" +%s 2>/dev/null)

  # First response block of the latest turn: first assistant entry after that request start.
  # NOTE: upper bound on TTFT — includes the first block's own generation time.
  fts=$(awk '/"timestamp":/ { if (/"type":"assistant"/) { if (f == "") f = $0 } else f = "" } END { print f }' "$tp" 2>/dev/null | jq -r '.timestamp // empty' 2>/dev/null)
  f_ep=$(date -j -u -f "%Y-%m-%dT%H:%M:%S" "${fts%%.*}" +%s 2>/dev/null)
  if [ -n "$f_ep" ] && [ -n "$u_ep" ]; then
    d=$((f_ep - u_ep))
    [ "$d" -ge 0 ] && out="$out ${purple}首字 ${d}s${reset}"
  fi

  if [ -n "$hit" ] && [ "$hit" -ge 0 ] 2>/dev/null; then
    seg="cache ${hit}%"
    # Effective output throughput: output tokens / (assistant_ts - request_start).
    if [ -n "$ats" ] && [ -n "$u_ep" ] && [ "$ot" -gt 0 ] 2>/dev/null; then
      a_ep=$(date -j -u -f "%Y-%m-%dT%H:%M:%S" "${ats%%.*}" +%s 2>/dev/null)
      if [ -n "$a_ep" ]; then
        dt=$((a_ep - u_ep))
        [ "$dt" -lt 1 ] && dt=1
        seg="$seg · $((ot / dt)) tok/s"
      fi
    fi
    out="$out ${cyan}${seg}${reset}"
  fi

  # Context occupancy: prompt tokens of the last request vs. the context window.
  if [ -n "$prompt" ] && [ "$prompt" -gt 0 ] 2>/dev/null; then
    limit=${CLAUDE_CODE_MAX_CONTEXT_TOKENS:-200000}
    out="$out ${yellow}ctx $((prompt * 100 / limit))% ($((prompt / 1000))k/$((limit / 1000))k)${reset}"
  fi
fi

# --- kimi quota (5h window + monthly) -----------------------------------------
# Cached for 60s; refresh happens in a detached background curl so rendering
# never blocks on the network.
kimi_cache="$HOME/.claude/.kimi-usage.json"
now=$(date +%s)
mtime=$(stat -f %m "$kimi_cache" 2>/dev/null || echo 0)
if [ $((now - mtime)) -gt 60 ]; then
  (
    key=$(jq -r '.env.ANTHROPIC_AUTH_TOKEN' "$HOME/.claude/settings.json" 2>/dev/null)
    [ -n "$key" ] && curl -s -m 5 -H "Authorization: Bearer $key" \
      https://api.kimi.com/coding/v1/usages -o "$kimi_cache.tmp" 2>/dev/null \
      && [ -s "$kimi_cache.tmp" ] && mv "$kimi_cache.tmp" "$kimi_cache"
  ) >/dev/null 2>&1 &
fi
if [ -f "$kimi_cache" ]; then
  read -r h5 mo < <(jq -r '[(.usages.limit_5h.used_ratio // -1), (.usages.limit_month_total.used_ratio // -1)] | @tsv' "$kimi_cache" 2>/dev/null)
  if [ -n "$h5" ] && [ "$h5" != "-1" ]; then
    h5p=$(printf '%.0f' "$(echo "$h5 * 100" | bc)")
    mop=$(printf '%.0f' "$(echo "$mo * 100" | bc)")
    # green < 70%, yellow 70-89%, red >= 90% (keyed on the tighter 5h window)
    if [ "$h5p" -ge 90 ]; then qc=$'\033[38;5;167m'
    elif [ "$h5p" -ge 70 ]; then qc=$'\033[38;5;179m'
    else qc=$'\033[38;5;76m'; fi
    out="$out ${qc}kimi 5h:${h5p}% 月:${mop}%${reset}"
  fi
fi

echo "$out"
```

## Kimi 额度段说明

数据源是 Kimi 的非公开接口（社区逆向，随时可能失效）：

```bash
curl -H "Authorization: Bearer $KIMI_KEY" https://api.kimi.com/coding/v1/usages
```

返回结构（2026-09 实测）：

| 字段 | 含义 |
|---|---|
| `usages.limit_5h.used_ratio` | 5 小时滚动窗口用量比例（0-1），带 `reset_time` |
| `usages.limit_month_total.used_ratio` | 月度总额度池用量比例 |
| `usages.limit_month_code.used_ratio` | 月度额度中 Kimi Code 部分 |
| `limits[0].detail` | 5 小时窗口的请求数限制（used/limit/remaining） |

设计要点：

- **缓存 60 秒**：结果写 `~/.claude/.kimi-usage.json`，过期后由后台 detached curl 异步刷新，statusline 渲染永远只读缓存、不阻塞。代价是缓存刚过期那一拍显示旧值。
- **key 不落盘**：运行时从 `~/.claude/settings.json` 的 `env.ANTHROPIC_AUTH_TOKEN` 读取，脚本本身不含密钥。
- **颜色告警**：按 5h 窗口用量变色 —— <70% 绿、70–89% 黄、≥90% 红。
- 官方查询入口：Kimi Code CLI 里 `/usage`，或网页 `kimi.com/membership/subscription?tab=quota`。

## 依赖与坑

> [!warning] 已知限制
> - 依赖 `jq`、`bc`、`curl`。
> - `date -j -f` 和 `stat -f %m` 是 **macOS (BSD)** 语法；Linux 需改成 `date -d` 和 `stat -c %Y`。
> - Kimi 的 `usages` 接口是非公开的，字段变动时额度段会**静默消失**（脚本报错被吞），排查先看 `~/.claude/.kimi-usage.json` 是否更新。
> - 「首字」耗时是 TTFT 上界：包含第一个 block 自身的生成时间。
> - tok/s 是有效输出吞吐 = 输出 tokens ÷（assistant 时间戳 − 请求开始），含排队和工具调用间隙，会低于纯生成速度。

## 相关笔记

- [[AI-agent/claude-code/Claude Code Loop 工程：loop、goal 与 schedule|Claude Code Loop 工程]]
- [[AI-agent/claude-code/Claude Code 快捷键|Claude Code 快捷键]]
- [[AI-agent/claude-code/Claude Code -p 非交互模式|Claude Code -p 非交互模式]]
