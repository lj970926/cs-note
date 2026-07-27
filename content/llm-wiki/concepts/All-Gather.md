---
title: All-Gather
description: 集合通信原语：把每个 rank 的分片聚合到所有 rank，使每个 rank 持有完整结果
date: 2026-07-27
tags: [concept, distributed-training, collective-communication]
aliases: [全收集]
---

# All-Gather

## Definition

All-Gather 是一种集合通信（collective communication）原语：$n$ 个 rank 各持有一份数据分片，操作完成后**每个 rank 都持有全部 $n$ 份分片拼接成的完整数据**。它是 All-Reduce 的"后半段"（All-Reduce = Reduce-Scatter + All-Gather），也是分布式训练中梯度/参数同步、张量并行激活收集的基础操作。

## 通信量与带宽口径

设 rank 数为 $n$，总数据量为 $S$（即完成后每个 rank 持有的结果大小，每个 rank 贡献 $S/n$），耗时 $t$：

- **算法带宽（algbw）**：$\text{algbw} = S/t$。用户视角的有效数据量 ÷ 时间，不反映底层实际传输量。
- **总线带宽（busbw）**：$\text{busbw} = \text{algbw} \times \frac{n-1}{n}$。

**推导**（ring all-gather）：共 $n-1$ 步，每步每个 rank 向邻居发送/接收 $S/n$ 的分片，因此每个 rank 在链路上实际传输 $(n-1)\cdot\frac{S}{n}$ 字节，除以 $t$ 即得单 rank 总线带宽。该修正因子与实现（ring/tree）无关，是 NCCL-tests 的统一口径，目的是让 busbw 能直接与硬件链路带宽（如 NVLink GB/s）对比，衡量利用率。

各集合通信的修正因子：

| 操作 | busbw / algbw |
|---|---|
| All-Gather | $(n-1)/n$ |
| Reduce-Scatter | $(n-1)/n$ |
| All-Reduce | $2(n-1)/n$ |
| Broadcast / Reduce | $1$ |

$n$ 很大时 $\frac{n-1}{n} \to 1$，all-gather 的 busbw ≈ algbw。

## Related concepts

- [[NCCL]]（未建页）— NVIDIA 集合通信库，algbw/busbw 口径的出处
- [[Ring All-Reduce]]（未建页）

## Sources

- 无外部来源，基于 NCCL-tests 的通行口径整理。详见 [[questions/allgather-bandwidth|All-Gather 的算法带宽与总线带宽]]。
