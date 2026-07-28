---
title: 0-1 Knapsack
description: 物品不可分割的背包问题；贪心因容量碎片失效，是贪心选择性质不成立的典型反例
date: 2026-07-28
tags: [concept, algorithm]
aliases: [0-1 背包, 背包问题]
---

# 0-1 Knapsack

## Definition

0-1 背包问题：给定容量 W 的背包和 n 件物品（各有重量 wᵢ 和价值 vᵢ），每件物品**要么整件拿、要么不拿**（不可分割，故称 0-1），求能装下的最大总价值。

## 为什么贪心失效

按"单位重量价值最高"贪心，在分数背包（物品可切分）中是最优策略，但在 0-1 背包中失效。根源是**不可分割造成的容量碎片**：拿了性价比最高的物品后，剩余空间可能什么也装不下，碎片被白白浪费。

反例（来源 [[sources/src-knapsack-dp-chat|src-knapsack-dp-chat]]）：容量 10，A(6, 30)、B(5, 20)、C(5, 20)。A 性价比最高（5 > 4），贪心拿 A 后剩 4 单位空间装不下 B/C，得 30；而 B + C 恰好塞满容量得 40。

从正确性条件看：拿 A 这个局部最优选择**不存在于任何全局最优解中**——贪心选择性质不成立，详见 [[concepts/Greedy Algorithm|Greedy Algorithm]]。

## DP 解法

定义 `dp[i][w]` = 前 i 件物品、容量 w 时的最大价值：

```
dp[i][w] = max(
    dp[i-1][w],                  // 不拿第 i 件
    dp[i-1][w - wᵢ] + vᵢ         // 拿第 i 件（前提 w ≥ wᵢ）
)
```

答案为 `dp[n][W]`，时间/空间 O(nW)（伪多项式——W 是数值而非输入位数）。空间可优化为一维滚动数组（容量维度倒序枚举）。见 [[concepts/Dynamic Programming|Dynamic Programming]]。

## Related concepts

- [[concepts/Greedy Algorithm|Greedy Algorithm]] — 贪心失效的典型反例
- [[concepts/Dynamic Programming|Dynamic Programming]] — 标准解法

## Sources

- [[sources/src-knapsack-dp-chat|src-knapsack-dp-chat]]
- [[sources/src-greedy-naming-chat|src-greedy-naming-chat]]
