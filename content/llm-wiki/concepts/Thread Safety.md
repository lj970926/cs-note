---
title: Thread Safety
description: 多个线程访问共享资源时程序行为正确的性质
date: 2026-07-25
tags: [concept, concurrency, cpp]
aliases: []
---

# Thread Safety

## Definition

线程安全是指当多个线程并发访问共享数据或资源时，程序仍然能够产生正确、可预期结果的性质。实现线程安全通常需要同步原语（如互斥锁、条件变量、原子操作）或避免共享状态。

## Common techniques

- **Mutex / Lock**：互斥访问临界区。
- **Condition variable**：线程间等待/通知机制。
- **Atomic operations**：无锁同步。
- **Thread-local storage**：消除共享。
- **Immutable data**：数据不可变，自然线程安全。

## Related concepts

- [[concepts/Object Lifetime Management|Object Lifetime Management]]
- [[concepts/Memory Order|Memory Order]]

## Sources

- [[sources/src-linux-multithreaded-server-programming|src-linux-multithreaded-server-programming]]
