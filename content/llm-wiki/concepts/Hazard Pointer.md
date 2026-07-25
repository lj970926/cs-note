---
title: Hazard Pointer
description: 无锁数据结构中安全延迟回收内存的机制
date: 2026-07-25
tags: [concept, concurrency, lock-free, memory-management]
aliases: []
---

# Hazard Pointer

## Definition

Hazard Pointer 是一种用于无锁数据结构的内存回收机制：线程在访问共享节点时先将其标记为"危险"，回收器只释放不再被任何线程标记为危险的节点，从而避免 ABA 问题和使用已释放内存。

## Core idea

1. 读取节点前，线程把节点指针写入自己的 hazard pointer。
2. 其他线程想要删除该节点时，先将其放入待回收列表。
3. 回收时扫描所有 hazard pointer，只有未被保护的节点才能真正释放。

## Trade-offs

| 优点 | 缺点 |
|---|---|
| 完全避免 ABA 问题 | 实现复杂 |
| 不需要 128 位原子操作 | 需要全局协调和定期扫描 |
| 读操作开销低 | 内存回收有延迟 |

## Related concepts

- [[concepts/ABA Problem|ABA Problem]]
- [[concepts/Lock-Free Data Structure|Lock-Free Data Structure]]
- [[concepts/CAS|CAS]]

## Sources

- [[sources/src-aba-problem|src-aba-problem]]
