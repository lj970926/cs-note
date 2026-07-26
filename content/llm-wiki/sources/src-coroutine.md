---
title: Coroutine
description: C++ Coroutine 笔记摘要
source_type: note
local_ref: "[[language/C++/Coroutine]]"
date: 2026-07-25
tags: [source, cpp, async, concurrency]
aliases: []
---

# Coroutine

> Source: [[language/C++/Coroutine]]

## One-line summary

C++ 协程是一种可在执行过程中挂起、将控制权交还调用方，并在稍后恢复执行的函数抽象。

## Key claims

- 协程遇到阻塞或需要让出执行权时可以**挂起**，返回到外层调用函数。
- 挂起后可在某个时刻**恢复执行**，无需重新进入函数。
- C++20 起在语言层面标准化了协程机制（`co_await`、`co_yield`、`co_return`）。
- 与线程不同，协程是**协作式**调度，通常由用户层调度器管理，切换开销低于内核线程。

## Related pages

- [[concepts/Coroutine|Coroutine]]
- [[language/C++/memory order]]
- [[language/C++/std-promise 和 std-future]]

## Reference

- [cppreference — Coroutines](https://en.cppreference.com/w/cpp/language/coroutines)
