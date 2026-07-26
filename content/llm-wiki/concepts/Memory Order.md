---
title: Memory Order
description: 多线程程序中内存访问操作的可见性和排序规则
date: 2026-07-25
tags: [concept, concurrency, cpp, memory-model]
aliases: []
---

# Memory Order

## Definition

内存顺序（Memory Order）规定了多线程程序中内存读写操作的可见性和排序规则。它决定了一个线程对共享变量的写入何时对另一个线程可见，以及编译器和 CPU 可以对指令做哪些重排序。

## C++ memory order levels

| 内存序                    | 强度  | 核心保证                      |
| ---------------------- | --- | ------------------------- |
| `memory_order_relaxed` | 最弱  | 仅保证操作原子性，不保证顺序            |
| `memory_order_consume` | 弱   | 依赖关系可见，实际使用较少             |
| `memory_order_acquire` | 中   | 本线程后续读/写不会被重排到该原子操作之前     |
| `memory_order_release` | 中   | 本线程先前读/写不会被重排到该原子操作之后     |
| `memory_order_acq_rel` | 中   | 同时具有 acquire 和 release 语义 |
| `memory_order_seq_cst` | 最强  | 所有线程看到全局一致的全序             |

### Sequence consistency (`seq_cst`)

默认且最强的内存序。所有线程获得全局一致的访存序列，禁止编译器和处理器重排。

- 在 ARM 等弱序架构上，通常需要在访存指令前后插入内存屏障。
- 在 x86 等强序架构上，仍需使用如 `xchg` 之类的指令确保全局可见性。

### Relaxed

只保证原子性，允许任意重排。典型反例：

```cpp
// Thread 1
nonAtomicNum = 20;
atomicNum.store(40, std::memory_order_relaxed);
flag.store(true, std::memory_order_relaxed);

// Thread 2
while (!flag.load(std::memory_order_relaxed));
assert(nonAtomicNum == 20);          // May fail
assert(atomicNum.load() == 40);       // May fail
```

Thread 2 可能先观察到 `flag == true`，但 `nonAtomicNum` 和 `atomicNum` 的写入尚未可见。

### Acquire/Release

成对使用建立 **happens-before**：

```cpp
// Thread 1
nonAtomicNum = 20;
atomicNum.store(40, std::memory_order_relaxed);
flag.store(true, std::memory_order_release);  // release

// Thread 2
while (!flag.load(std::memory_order_acquire)); // acquire
assert(nonAtomicNum == 20);          // Guaranteed
assert(atomicNum.load() == 40);       // Guaranteed
```

release 操作之前的所有写，在 acquire 线程中读入该 release 写入的值后均可见。

## 单线程 vs 多线程视角

C++ 的 **as-if 规则** 保证：在单线程内，只要可观察行为不变，编译器和 CPU 可以任意重排。因此单线程程序员通常看不到重排。

但在多线程下，另一个线程可能观察到这种乱序：

```cpp
int a = 0, b = 0;

// Thread 1
a = 1;
b = 2;

// Thread 2
if (b == 2)
    assert(a == 1);  // Not guaranteed without synchronization
```

必须通过原子操作、锁等同步手段建立 happens-before。

## Release sequence

一个 release 写 `W` 之后，沿同一原子变量的修改顺序，由 `W` 本身及后续所有 RMW（读-改-写）操作组成的最长连续序列称为 **release sequence**。只要 acquire 读读到了 release sequence 中任意操作写入的值，`W` 与 `R` 之间就存在 synchronizes-with 关系。

典型价值：引用计数中多个线程用 relaxed RMW 接力修改计数，最后一个负责释放资源的线程仍能看见之前所有线程对被管理对象的写入。

> C++20 收窄了定义：release sequence 中除 W 外**只接受 RMW**，不再包含同线程的普通 store。

## Related concepts

- [[concepts/Thread Safety|Thread Safety]]
- [[concepts/Object Lifetime Management|Object Lifetime Management]]
- [[concepts/CAS|CAS]]
- [[concepts/Spin Lock|Spin Lock]]

## Sources

- [[sources/src-linux-multithreaded-server-programming|src-linux-multithreaded-server-programming]]
- [[sources/src-memory-order|src-memory-order]]
- [[language/C++/memory order]] — vault 原笔记
