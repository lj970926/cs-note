---
title: std-promise 和 std-future
description: C++ std::promise 与 std::future 异步结果传递机制笔记摘要
source_type: note
local_ref: "[[language/C++/std-promise 和 std-future]]"
date: 2026-07-25
tags: [source, cpp, async, concurrency]
aliases: []
---

# std-promise 和 std-future

> Source: [[language/C++/std-promise 和 std-future]]

## One-line summary

`std::promise` 与 `std::future` 是 C++11 提供的一对“一次性”异步结果传递机制：生产者通过 `promise` 写入值或异常，消费者通过 `future` 阻塞读取，两者共享同一块状态并完成跨线程同步。

## Key claims

- **shared state**：堆上保存结果/异常、就绪标志和同步原语的状态块。
- `promise` 是写入端，`future` 是读取端；一个 `promise` 只能产生一个 `future`。
- `promise` 不可拷贝，只能 `std::move`。
- `future::get()` 只能调用一次；如需多次/多线程读取，使用 `std::shared_future`。
- 常见异常：重复设置抛 `promise_already_satisfied`；未设置就析构抛 `broken_promise`；二次 `get()` 通常导致 `no_state`。
- 选择层级：`std::async` > `std::packaged_task` > `std::promise`（封装从低到高）。

## Related pages

- [[concepts/Promise and Future|Promise and Future]]
- [[concepts/Memory Order|Memory Order]]
- [[concepts/Coroutine|Coroutine]]
- [[concepts/Thread Safety|Thread Safety]]

## Reference

- [cppreference — std::promise](https://en.cppreference.com/w/cpp/thread/promise)
- [cppreference — std::future](https://en.cppreference.com/w/cpp/thread/future)
- [cppreference — std::shared_future](https://en.cppreference.com/w/cpp/thread/shared_future)
