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

- `memory_order_relaxed`：只保证原子性，不保证顺序。
- `memory_order_consume`：依赖关系可见（实际使用较少）。
- `memory_order_acquire`：本线程中后续读操作不会被重排序到该原子操作之前。
- `memory_order_release`：本线程中先前写操作不会被重排序到该原子操作之后。
- `memory_order_acq_rel`：同时具有 acquire 和 release 语义。
- `memory_order_seq_cst`：顺序一致性，最强的默认模型。

## Related concepts

- [[concepts/Thread Safety|Thread Safety]]
- [[concepts/Object Lifetime Management|Object Lifetime Management]]

## Sources

- [[sources/src-linux-multithreaded-server-programming|src-linux-multithreaded-server-programming]]
- [[language/C++/memory order]] — vault 原笔记
