---
title: "Source: Chat 0-1 背包贪心反例与动态规划"
source_type: chat
local_raw: "[[llm-wiki/raw/chats/2026-07-28-knapsack-counterexample-and-dp]]"
ingested: 2026-07-28
tags: [source, chat, algorithm]
aliases: []
created: 2026-07-28
---

# Source: Chat 0-1 背包贪心反例与动态规划

## One-line summary

2026-07-28 Claude Code 会话（[[sources/src-greedy-naming-chat|贪心命名会话]]的延续）：给出 0-1 背包贪心失效的具体反例，并讲解动态规划的核心思想及其与贪心的系统对比。

## Key claims

- 0-1 背包反例：容量 10，A(6,30) 性价比最高但拿后剩 4 单位空间只能浪费，贪心得 30；B+C 恰好塞满得 40。根源是物品不可分割造成无法回收的容量碎片。
- 分数背包贪心最优、0-1 背包贪心失效，差别就在于不可分割性。
- DP 核心：重叠子问题各解一次并存表，由子问题答案拼出原问题答案；中途不做不可逆选择。
- DP 适用条件：最优子结构（与贪心共用）+ 重叠子问题（否则是分治）。
- 关系：贪心是 DP 在贪心选择性质成立时的"豪华简化版"；性质不成立时必须退回 DP。
- 代价：DP 用时空换正确性；背包 O(nW) 是伪多项式；状态设计常比转移方程更难。

## Key concepts

- [[concepts/Dynamic Programming|Dynamic Programming]]
- [[concepts/0-1 Knapsack|0-1 Knapsack]]
- [[concepts/Greedy Algorithm|Greedy Algorithm]]

## Linked pages

- [[concepts/Dynamic Programming|Dynamic Programming]]
- [[concepts/0-1 Knapsack|0-1 Knapsack]]
- [[concepts/Greedy Algorithm|Greedy Algorithm]]
- [[questions/greedy-vs-dp|贪心 vs 动态规划]]
