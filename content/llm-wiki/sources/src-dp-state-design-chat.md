---
title: "Source: Chat DP 状态设计与转移方程技巧"
source_type: chat
local_raw: "[[llm-wiki/raw/chats/2026-07-28-dp-state-design-tips]]"
ingested: 2026-07-28
tags: [source, chat, algorithm]
aliases: []
created: 2026-07-28
---

# Source: Chat DP 状态设计与转移方程技巧

## One-line summary

2026-07-28 Claude Code 会话（[[sources/src-knapsack-dp-chat|背包与 DP 会话]]的延续）：系统整理 DP 状态设计（无后效性、前缀结构、按需加维）与转移方程构建（枚举最后一步决策）的技巧、常见模式选型表与验证 checklist。

## Key claims

- 状态设计 = 用最少的信息唯一刻画未来；核心检验标准是无后效性（状态相同 ⇒ 未来最优决策相同）。
- 大多数状态是"前缀结构"（处理到第 i 个）；一维不够时看缺什么信息就加一维；状态值通常就是优化目标。
- 转移方程的通用推导框架：枚举到达当前状态的"最后一步决策"，对所有前驱取最优；比"从前向后想"更不容易漏情况。
- 常见模式：线性 / 背包型 / 区间 / 双序列 / 状态压缩 / 树形 DP；识别信号如两串对比→双序列、区间分割→区间 DP、n ≤ 20→状压。
- 实战路径：先写暴力递归（参数即状态、返回值组合即转移）→ 记忆化 → 填表；状态爆炸时换状态里存的东西（如 LIS 的 O(n²)→O(n log n)）。
- 边界与填表顺序是转移方程的一半；自查四条：无后效性、完备性、顺序、边界。

## Key concepts

- [[concepts/Dynamic Programming|Dynamic Programming]]
- [[concepts/0-1 Knapsack|0-1 Knapsack]]

## Linked pages

- [[concepts/Dynamic Programming|Dynamic Programming]]
- [[questions/dp-state-design-tips|DP 状态设计与转移方程技巧]]
