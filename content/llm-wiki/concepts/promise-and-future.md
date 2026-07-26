---
title: Promise and Future
description: C++ 中用于跨线程一次性传递异步结果与同步状态的标准机制
date: 2026-07-25
tags: [concept, cpp, async, concurrency]
aliases: []
---

# Promise and Future

## Definition

**Promise/Future** 是 C++11 引入的标准异步结果传递机制。`std::promise<T>` 作为生产者端向 shared state 写入值或异常；`std::future<T>` 作为消费者端从 shared state 读取结果，并在结果尚未就绪时阻塞等待。

## Core components

- **shared state**：堆上分配的状态块，保存结果/异常、就绪标志以及同步原语。
- **`std::promise<T>`**：写入端。提供 `set_value()` 和 `set_exception()`。
- **`std::future<T>`**：读取端。提供 `get()`、`wait()`、`wait_for()`、`wait_until()`。

## Key rules

| 规则 | 说明 |
|------|------|
| 一次性 | 一个 `promise` 只能产生一个 `future`；`future::get()` 只能调用一次 |
| 不可拷贝 | `promise` 只能 `std::move`；`future` 同样只能 move |
| 异常传递 | `set_exception(std::current_exception())` 可把异常跨线程传递 |
| 析构行为 | `promise` 未设置就析构会在 shared state 中存入 `broken_promise` |
| 多次读取 | 使用 `std::shared_future`，可拷贝、可多次 `get()` |

## Typical usage

```cpp
std::promise<int> p;
std::future<int> f = p.get_future();

std::thread t([pr = std::move(p)]() mutable {
    pr.set_value(42);
});

int v = f.get();  // 阻塞直到 set_value
```

## Wait interfaces

- `wait()`：阻塞直到就绪。
- `wait_for(duration)`：最多等待指定时长，返回 `std::future_status`。
- `wait_until(time_point)`：等到某个时间点。

## Relationship with async and packaged_task

| 工具 | 适用场景 |
|------|----------|
| `std::async` | 直接启动异步任务并拿结果，最方便 |
| `std::packaged_task` | 把可调用对象包装成任务丢进线程池 |
| `std::promise` | 需要完全手动控制写入时机 |

## Related concepts

- [[concepts/Memory Order|Memory Order]] — shared state 内部的同步依赖内存序
- [[concepts/Coroutine|Coroutine]] — C++20 协程提供了另一种异步结果组织方式
- [[concepts/Thread Safety|Thread Safety]] — 跨线程共享状态的前提

## Sources

- [[sources/src-std-promise-future|src-std-promise-future]]
