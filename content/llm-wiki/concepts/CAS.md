---
title: CAS
description: 比较并交换，实现无锁算法的核心原子原语
date: 2026-07-25
tags: [concept, concurrency, lock-free, atomic]
aliases: []
---

# CAS

## Definition

CAS（Compare-And-Swap）是一种原子操作：先比较内存位置的当前值是否等于期望值，若相等则写入新值。它是实现无锁数据结构和算法的基础原语。

## Signature

```cpp
bool compare_exchange_weak(T& expected, T desired,
                           memory_order succ,
                           memory_order fail);
```

- `expected`：期望值；失败时会被更新为当前值。
- `desired`：想要写入的新值。
- 返回 `true` 表示交换成功。

## Weak vs strong

| 项目 | `compare_exchange_weak` | `compare_exchange_strong` |
|---|---|---|
| 值相等时是否可能失败 | 可能 | 不会因伪失败而失败 |
| Spurious failure | 允许 | 不允许 |
| 适合场景 | CAS 循环 | 单次尝试 |
| 常见用途 | lock-free stack/queue、计数更新、自旋锁循环 | `try_lock()`、状态机单次转换 |
| x86 | 通常与 strong 相同 | 通常与 weak 相同 |
| ARM/POWER | 可能生成更轻量代码 | 可能内部需要重试 |

- `compare_exchange_weak` 适合放在循环里；即使值相等也可能因 LL/SC 等底层机制伪失败。
- `compare_exchange_strong` 适合只试一次的场景，如 `try_lock()`。
- 失败时 `expected` 都会被更新为当前原子值。
- `failure` memory order 不能是 `release` 或 `acq_rel`，因为失败时没有写操作。

## Related concepts

- [[concepts/ABA Problem|ABA Problem]]
- [[concepts/Lock-Free Data Structure|Lock-Free Data Structure]]
- [[concepts/Memory Order|Memory Order]]

## Sources

- [[sources/src-aba-problem|src-aba-problem]]
- [[language/C++/compare_exchange_weak vs strong]] — vault 原笔记
