---
title: Dynamic Programming
description: 把重叠子问题各解一次并存表、由子问题答案拼出原问题最优解的算法设计范式
date: 2026-07-28
tags: [concept, algorithm]
aliases: [动态规划, DP]
---

# Dynamic Programming

## Definition

动态规划（DP）是一种算法设计范式：把问题拆成子问题，**每个子问题只求解一次并把答案存下来**，后续遇到直接查表，用子问题的答案逐步拼出原问题的答案。与 [[concepts/Greedy Algorithm|贪心]] 的关键区别：DP 不在中途做不可逆的选择，而是把所有分支的结果都算出来，让最优性自己浮出来。

## 适用条件

1. **最优子结构**：问题的最优解包含子问题的最优解（与贪心共用此性质）。
2. **重叠子问题**：子问题会被反复遇到，缓存才划算。若子问题互不重叠，那是分治（如归并排序），不需要 DP。

## 工作方式

- **自底向上（填表）**：按依赖顺序递推所有状态，典型如背包的二维表。
- **自顶向下（记忆化递归）**：按自然递归结构写，加缓存避免重复计算。

以 [[concepts/0-1 Knapsack|0-1 背包]] 为例：`dp[i][w]` = 前 i 件物品、容量 w 的最大价值，转移方程 `dp[i][w] = max(dp[i-1][w], dp[i-1][w-wᵢ] + vᵢ)`。DP 对每件物品把"拿 / 不拿"两个分支都算出来存着，最后取 `dp[n][W]`。

## 与贪心的对比

一句话：**贪心是"赌"——赌眼前最好的选择在某个全局最优解里；DP 是"算"——不赌，存下所有子问题答案让最优性浮出来。** 贪心选择性质成立时，贪心是 DP 的"豪华简化版"（不用填表，一趟扫描）；不成立时只能退回 DP。详细对比表见 [[questions/greedy-vs-dp|贪心 vs 动态规划]]。

## 代价

- 用**空间和时间换正确性**：复杂度通常是 O(n × 状态维度)，如背包 O(nW)（伪多项式——W 是数值而非输入位数）。
- **状态设计是难点**："dp 数组该定义成什么"往往比转移方程更考验人。系统的构建技巧见 [[questions/dp-state-design-tips|DP 状态设计与转移方程技巧]]。

## Related concepts

- [[concepts/Greedy Algorithm|Greedy Algorithm]]
- [[concepts/0-1 Knapsack|0-1 Knapsack]]
- [[Backtracking]] — 另一种"保留所有分支"的范式，但不缓存子问题

## Sources

- [[sources/src-knapsack-dp-chat|src-knapsack-dp-chat]]
- [[sources/src-dp-state-design-chat|src-dp-state-design-chat]]
