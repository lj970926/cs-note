---
title: "Source: Chat 贪心算法命名由来"
source_type: chat
local_raw: "[[llm-wiki/raw/chats/2026-07-28-greedy-algorithm-naming]]"
ingested: 2026-07-28
tags: [source, chat, algorithm]
aliases: []
created: 2026-07-28
---

# Source: Chat 贪心算法命名由来

## One-line summary

2026-07-28 Claude Code 会话：解释贪心算法命名由来——每步只取局部最优、不反悔不回头的决策风格，以及贪心正确的充当前提（贪心选择性质）。

## Key claims

- "贪心"描述算法的决策方式：每一步只拿眼前局部最优的选择，不撤销、不回头、不为将来打算。
- 名字隐含两层含义：短视（不考虑对后续的影响，所以快但可能错）和不回头（无回溯机制，与回溯算法形成对比）。
- 贪心得到全局最优的前提是问题满足贪心选择性质（通常配合最优子结构）。
- 正例：哈夫曼编码、Kruskal/Prim 最小生成树、活动选择问题；反例：0-1 背包需用动态规划。
- 名字既是描述也是警告：用贪心前需先证明该问题上贪心选择是对的。

## Key concepts

- [[concepts/Greedy Algorithm|Greedy Algorithm]]

## Linked pages

- [[concepts/Greedy Algorithm|Greedy Algorithm]]
- [[questions/why-called-greedy|贪心算法为什么叫贪心]]
