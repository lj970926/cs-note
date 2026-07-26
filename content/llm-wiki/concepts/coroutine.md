---
title: Coroutine
description: 可在执行过程中挂起并在之后恢复的函数/控制流抽象
date: 2026-07-25
tags: [concept, cpp, async, concurrency]
aliases: []
---

# Coroutine

## Definition

**协程（Coroutine）** 是一种允许在执行过程中主动挂起、将控制权交还给调用者，并在之后从挂起点恢复执行的函数或控制流抽象。与常规函数“一直运行到返回”不同，协程可以多次进入和退出，状态在挂起期间得以保留。

## Key properties

- **协作式调度**：协程自行决定何时挂起/恢复，不依赖操作系统抢占。
- **低开销切换**：同一线程内切换协程通常只需保存/恢复少量寄存器和栈帧状态，无需进入内核。
- **状态保留**：挂起时局部变量和执行位置被保存，恢复后继续执行。
- **非抢占**：除非协程主动让出，否则会一直执行到下一个挂起点。

## C++ Coroutine

C++20 在语言层面引入协程支持，核心关键字：

- `co_await`：挂起当前协程，等待某个可等待对象（awaitable）完成。
- `co_yield`：向调用者产生一个值并挂起，下次恢复时继续。
- `co_return`：从协程返回最终值。

C++ 协程通过编译器生成的状态机实现，开发者通常需要借助 `std::coroutine_handle` 和 `promise_type` 来定义协程行为。

## Related concepts

- [[concepts/Thread Safety|Thread Safety]] — 多线程共享资源的正确性
- [[concepts/Memory Order|Memory Order]] — 协程跨线程恢复时的内存可见性
- [[concepts/Forwarding Reference|Forwarding Reference]] — 协程库中常见的参数转发技术

## Sources

- [[sources/src-coroutine|src-coroutine]]
