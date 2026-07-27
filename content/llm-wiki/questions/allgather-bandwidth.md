---
title: All-Gather 的算法带宽与总线带宽
description: all-gather 中 algbw = S/t，busbw = algbw × (n-1)/n 的口径与推导
date: 2026-07-27
tags: [question, distributed-training, collective-communication, nccl]
aliases: []
created: 2026-07-27
---

# All-Gather 的算法带宽与总线带宽

## Question

all-gather 算法的算法带宽（algbw）和总线带宽（busbw）分别怎么算？

## Answer

设 rank 数为 $n$，总数据量为 $S$（all-gather 完成后每个 rank 持有的结果大小，每个 rank 贡献 $S/n$），实测耗时 $t$。

### 算法带宽（algbw）

$$\text{algbw} = \frac{S}{t}$$

即"用户视角的有效数据量 ÷ 时间"，只反映算法完成了多少工作，不关心底层实际传了多少字节。

### 总线带宽（busbw）

$$\text{busbw} = \text{algbw} \times \frac{n-1}{n} = \frac{S(n-1)}{n \cdot t}$$

**推导**（ring all-gather）：

- 环上一共 $n-1$ 步，每步每个 rank 向邻居发送/接收 $S/n$ 大小的分片；
- 所以每个 rank 在链路上实际传输的总字节数为 $(n-1)\cdot\frac{S}{n}$；
- 除以时间 $t$ 即得单 rank 占用的总线带宽 $\frac{S(n-1)}{n \cdot t}$。

修正因子 $\frac{n-1}{n}$ 与实现（ring/tree）无关，是 NCCL-tests 统一使用的口径：busbw 可直接与硬件链路带宽（如 NVLink 的 GB/s）对比，衡量带宽利用率。$n$ 很大时 busbw ≈ algbw。

### 对照：其他集合通信的修正因子

| 操作 | busbw / algbw |
|---|---|
| All-Gather | $(n-1)/n$ |
| Reduce-Scatter | $(n-1)/n$ |
| All-Reduce | $2(n-1)/n$ |
| Broadcast / Reduce | $1$ |

## Sources

- 无外部来源，基于 NCCL-tests 的通行口径整理。
- 相关页面：[[concepts/All-Gather|All-Gather]]

## Follow-ups

- All-Reduce 修正因子 $2(n-1)/n$ 的推导（reduce-scatter + all-gather 两段相加）
- NVLink / NVSwitch 拓扑下 tree 与 ring 算法选择对 busbw 实测的影响
- 建 [[NCCL]] 实体页
