---
title: memory order
description: C++ memory order 笔记摘要
source_type: note
local_ref: "[[language/C++/memory order]]"
date: 2026-07-25
tags: [source, cpp, concurrency, memory-model]
aliases: []
---

# memory order

> Source: [[language/C++/memory order]]

## One-line summary

C++ 原子操作通过 `std::memory_order` 控制多线程间的可见性和指令重排，平衡正确性与性能。

## Key claims

- `memory_order_seq_cst`：最强，所有线程看到全局一致的访存顺序；在 ARM 等弱序架构需要完整 barrier，x86 也需额外指令保证全局一致性。
- `memory_order_relaxed`：最弱，只保证原子性，允许编译器和 CPU 重排；不同线程可能观察到不同的写入顺序。
- `memory_order_acquire` / `memory_order_release`：成对使用建立 happens-before；release 线程中先前的写对 acquire 线程可见。
- 单线程内 as-if 规则隐藏重排；多线程下必须用原子或锁建立同步，否则其他线程可能观察到乱序。
- Release sequence：release 写之后的一串 RMW 操作可以延续同步链，使读到接力值的 acquire 线程仍与原始 release 写同步（C++20 收紧为仅 RMW）。

## Related pages

- [[concepts/Memory Order|Memory Order]]
- [[concepts/Thread Safety|Thread Safety]]
- [[concepts/CAS|CAS]]
- [[language/C++/ABA问题]]
- [[language/C++/compare_exchange_weak vs strong]]
- [[language/C++/std-promise 和 std-future]]
- [[language/C++/Coroutine]]

## Reference

- [Memory Ordering — ramtintjb.com](https://www.ramtintjb.com/blog/memory-ordering)
- [cppreference — std::memory_order](https://en.cppreference.com/w/cpp/atomic/memory_order)
