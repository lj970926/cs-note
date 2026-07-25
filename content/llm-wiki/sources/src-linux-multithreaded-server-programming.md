---
title: "src-linux-multithreaded-server-programming"
description: "《Linux 多线程服务端编程：使用 muduo C++ 网络库》读书笔记摘要"
date: 2026-07-25
tags: [source, book, cpp, concurrency, network]
source_type: note
local_ref: "[[book-notes/Linux 多线程服务端编程 使用 muduo C++ 网络库]]"
aliases: []
---

# src-linux-multithreaded-server-programming

## One-line summary

[[entities/陈硕|陈硕]] 的《Linux 多线程服务端编程：使用 muduo C++ 网络库》聚焦 C++ 服务端并发编程，核心议题包括线程安全的对象生命期管理、互斥锁/条件变量实现，以及 Muduo 网络库的设计。

## Source

- Vault note: [[book-notes/Linux 多线程服务端编程 使用 muduo C++ 网络库]]
- Book: 《Linux 多线程服务端编程：使用 muduo C++ 网络库》by [[entities/陈硕|陈硕]]

## Key claims

1. 线程安全的对象生命期管理是 C++ 多线程编程的核心难题之一。
2. 在不需要灵活性的地方把代码写死，是更高明的设计。
3. 单线程服务器有常用且成熟的编程模型，适合特定场景。
4. 笔记关联了 [[memory order]] 与 [[bthread]] 等主题。

## Linked pages

- [[entities/陈硕|陈硕]]
- [[entities/Linux 多线程服务端编程|Linux 多线程服务端编程]]
- [[concepts/Thread Safety|Thread Safety]]
- [[concepts/Object Lifetime Management|Object Lifetime Management]]
