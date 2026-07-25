---
title: "src-aba-problem"
description: "ABA 问题笔记摘要"
date: 2026-07-25
tags: [source, cpp, concurrency, lock-free]
source_type: note
local_ref: "[[language/C++/ABA问题]]"
aliases: []
---

# src-aba-problem

## One-line summary

[[concepts/ABA Problem|ABA 问题]]是[[concepts/CAS|CAS]]无锁操作中的经典陷阱：值从 A 变成 B 又变回 A，使线程误以为状态未变，从而可能访问已释放内存或破坏数据结构。

## Source

- Vault note: [[language/C++/ABA问题]]

## Key claims

1. ABA 问题本质：值相同，但状态可能已经改变。
2. 常见于无锁栈/队列的 CAS 操作，特别是节点被删除后内存被复用。
3. 解决方案包括版本号（AtomicStampedReference）、标记（AtomicMarkableReference）、TaggedPointer 和 Hazard Pointer。
4. Hazard Pointer 和 Epoch-based Reclamation 是 C++ 中更完整的内存回收方案。

## Linked pages

- [[concepts/ABA Problem|ABA Problem]]
- [[concepts/CAS|CAS]]
- [[concepts/Lock-Free Data Structure|Lock-Free Data Structure]]
- [[concepts/Hazard Pointer|Hazard Pointer]]
- [[concepts/Memory Order|Memory Order]]
- [[language/C++/compare_exchange_weak vs strong]] — vault 原笔记
