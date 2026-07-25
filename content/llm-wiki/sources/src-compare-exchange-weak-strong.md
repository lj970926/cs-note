---
title: "src-compare-exchange-weak-strong"
description: "C++ compare_exchange_weak vs strong 笔记摘要"
date: 2026-07-25
tags: [source, cpp, concurrency, cas]
source_type: note
local_ref: "[[language/C++/compare_exchange_weak vs strong]]"
aliases: []
---

# src-compare-exchange-weak-strong

## One-line summary

`compare_exchange_weak` 允许伪失败，适合 CAS 循环；`compare_exchange_strong` 保证值相等时成功，适合单次尝试如 `try_lock()`。

## Source

- Vault note: [[language/C++/compare_exchange_weak vs strong]]

## Key claims

1. `compare_exchange_strong` 只在原子值不等于 `expected` 时失败，适合单次尝试。
2. `compare_exchange_weak` 即使原子值等于 `expected` 也可能因 spurious failure 失败，适合放在循环里。
3. 失败时 `expected` 会被更新为当前原子值。
4. `failure` memory order 不能是 `release` 或 `acq_rel`，因为失败时没有写操作。
5. x86 上两者通常生成相同代码；ARM/POWER 等架构上 weak 可能更轻量。
6. 自旋锁 `try_lock()` 用 strong，`lock()` 循环用 weak。

## Linked pages

- [[concepts/CAS|CAS]]
- [[concepts/Spin Lock|Spin Lock]]
- [[concepts/Memory Order|Memory Order]]
- [[concepts/ABA Problem|ABA Problem]]
