---
title: Greedy Algorithm
description: 每步取局部最优且不回头、靠贪心选择性质保证全局最优的算法设计范式
date: 2026-07-28
tags: [concept, algorithm]
aliases: [贪心算法, 贪心, Greedy]
---

# Greedy Algorithm

## Definition

贪心算法是一种算法设计范式：把问题拆成一系列决策点，**每一步只取当前看来局部最优的选择，做出后不再撤销**，期望由此得到全局最优解。名字"贪心"形象地描述了这种短视且不回头的决策风格（见 [[questions/why-called-greedy|贪心算法为什么叫贪心]]）。

## 核心特征

- **短视**：选择时只看当前步的收益，不考虑对后续决策的影响。这是它快的原因——不需要像 [[concepts/Dynamic Programming|Dynamic Programming]] 那样枚举所有子问题。
- **不回头**：选择一旦做出即锁死，没有回溯机制。与 [[Backtracking]]"走错就退回来换路"形成鲜明对比。
- **迭代式决策**：每步做出一个选择，问题规模缩小，进入下一步继续贪。

## 适用条件

贪心能得到全局最优，前提是问题满足：

1. **贪心选择性质**：局部最优选择能导向全局最优解（即存在某个最优解包含当前贪心选择）。
2. **最优子结构**：问题的最优解包含子问题的最优解（与动态规划共用此性质）。

使用时必须先证明（或用交换论证等方法验证）贪心选择性质成立——这是贪心算法正确性分析的核心工作。

## 经典正例与反例

| 问题 | 贪心策略 | 是否正确 |
| --- | --- | --- |
| 哈夫曼编码 | 每次合并频率最低的两个节点 | ✅ |
| 最小生成树（Kruskal / Prim） | 每次拿权最小的安全边 | ✅ |
| 活动选择问题 | 每次选结束最早的活动 | ✅ |
| 找零钱（标准币制） | 每次拿不超过剩余的最大面额 | ✅（任意币制不保证） |
| 0-1 背包 | 按单位重量价值最高装 | ❌ 需动态规划 |

0-1 背包的具体反例见 [[concepts/0-1 Knapsack|0-1 Knapsack]] 与 [[questions/greedy-vs-dp|贪心 vs 动态规划]]。

## Related concepts

- [[concepts/Dynamic Programming|Dynamic Programming]] — 贪心不满足贪心选择性质时的替代范式
- [[concepts/0-1 Knapsack|0-1 Knapsack]] — 贪心失效的典型问题
- [[Backtracking]] — 带回溯的搜索，与"不回头"的贪心形成对比

## Sources

- [[sources/src-greedy-naming-chat|src-greedy-naming-chat]]
- [[sources/src-knapsack-dp-chat|src-knapsack-dp-chat]]
