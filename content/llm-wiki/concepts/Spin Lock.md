---
title: Spin Lock
description: 通过循环 CAS 操作忙等待获取的锁
date: 2026-07-25
tags: [concept, cpp, concurrency, locking]
aliases: []
---

# Spin Lock

## Definition

自旋锁（Spin Lock）是一种通过循环执行原子 CAS 操作来忙等待获取的锁。线程在锁被占用时不会睡眠，而是一直尝试获取，直到成功。

## When to use

- 临界区极短
- 线程不会长时间持有锁
- 多核环境下，避免线程切换开销

## Implementation patterns

### try_lock — 用 strong

```cpp
bool try_lock() noexcept {
    bool expected = false;
    return locked_.compare_exchange_strong(
        expected, true,
        std::memory_order_acquire,
        std::memory_order_relaxed);
}
```

### lock — 用 weak，配合 TTAS

```cpp
void lock() noexcept {
    for (;;) {
        while (locked_.load(std::memory_order_relaxed)) {
            pause();  // 或 yield
        }
        bool expected = false;
        if (locked_.compare_exchange_weak(
                expected, true,
                std::memory_order_acquire,
                std::memory_order_relaxed)) {
            return;
        }
    }
}
```

## Trade-offs

| 优点 | 缺点 |
|---|---|
| 获取锁延迟低 | 忙等待浪费 CPU |
| 避免线程切换 | 临界区长时效率差 |
| 实现简单 | 不公平，可能饿死 |

## Related concepts

- [[concepts/CAS|CAS]]
- [[concepts/Memory Order|Memory Order]]
- [[concepts/Thread Safety|Thread Safety]]

## Sources

- [[sources/src-compare-exchange-weak-strong|src-compare-exchange-weak-strong]]
