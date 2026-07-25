---
title: Lock-Free Data Structure
description: 不依赖互斥锁，通过原子操作保证线程安全的数据结构
date: 2026-07-25
tags: [concept, concurrency, lock-free, data-structure]
aliases: []
---

# Lock-Free Data Structure

## Definition

无锁数据结构是不使用互斥锁，而是通过原子操作（如 CAS）保证线程安全的数据结构。理想情况下，至少有一个线程能在有限步骤内完成操作，不会因其他线程挂起而无限等待。

## Common examples

- 无锁栈（lock-free stack）
- 无锁队列（lock-free queue）
- 无锁链表

## Challenges

- **ABA 问题**：CAS 只比较值，可能忽略中间状态变化。
- **内存回收**：删除的节点可能仍被其他线程访问，需要 Hazard Pointer 或 epoch-based reclamation。
- **复杂度**：正确实现和验证比加锁结构困难得多。

## Related concepts

- [[concepts/CAS|CAS]]
- [[concepts/ABA Problem|ABA Problem]]
- [[concepts/Hazard Pointer|Hazard Pointer]]

## Sources

- [[sources/src-aba-problem|src-aba-problem]]
