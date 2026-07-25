---
title: ABA Problem
description: CAS 无锁操作中值相同但状态已变的经典问题
date: 2026-07-25
tags: [concept, concurrency, lock-free, cpp]
aliases: []
---

# ABA Problem

## Definition

ABA 问题是在使用 CAS（Compare-And-Swap）等无锁原语时出现的经典问题：一个线程读取值为 A 后被挂起，另一个线程将值改为 B 又改回 A，第一个线程恢复后看到值仍是 A，便认为状态未变，但实际上中间已经发生过状态转换。

## Why it matters

在基于 CAS 的无锁数据结构（如无锁栈、队列）中，ABA 问题可能导致：
- 访问已释放或复用的内存
- 破坏链表/树等结构的完整性
- 段错误或数据损坏

## Solutions

| 方案 | 说明 |
|---|---|
| 版本号 | 每次修改递增版本号，CAS 同时检查值和版本号 |
| 标记位 | 用布尔标记检测是否被修改过 |
| TaggedPointer | 将指针和版本号打包成 64/128 位原子操作 |
| Hazard Pointer | 延迟回收被其他线程可能访问的内存 |
| Epoch-based Reclamation | 按 epoch 批量回收内存 |

## Related concepts

- [[concepts/CAS|CAS]]
- [[concepts/Lock-Free Data Structure|Lock-Free Data Structure]]
- [[concepts/Hazard Pointer|Hazard Pointer]]
- [[concepts/Memory Order|Memory Order]]

## Sources

- [[sources/src-aba-problem|src-aba-problem]]
