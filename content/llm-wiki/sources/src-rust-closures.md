---
title: "Rust Closures"
description: Rust 闭包的捕获方式、Fn/FnMut/FnOnce trait 与使用场景笔记摘要
source_type: note
local_ref: "[[language/rust/closure]]"
date: 2026-07-25
tags: [source, rust, closures, ownership, fn-traits]
aliases: []
---

# Rust Closures

> Source: [[language/rust/closure]]

## One-line summary

Rust 闭包是携带外部环境的匿名函数；决定其可用范围的关键是捕获方式以及实现 `Fn`、`FnMut` 还是 `FnOnce`。

## Key claims

- 闭包可赋值给变量、传给函数，并在定义处捕获外部作用域的值。
- 捕获方式分三种：不可变借用、可变借用、`move` 获取所有权。
- 闭包自动实现一个或多个 trait：
  - `Fn`：只读或不捕获，可多次调用。
  - `FnMut`：修改捕获值，可多次调用。
  - `FnOnce`：可能把捕获值 move 出闭包体，调用后可能消耗自身。
- 所有闭包至少实现 `FnOnce`；`Fn` ⊂ `FnMut` ⊂ `FnOnce`。
- API 根据调用次数选择 trait bound：`unwrap_or_else` 用 `FnOnce`，`sort_by_key` 用 `FnMut`。
- `move` 关键字强制闭包获取捕获值的所有权，常用于线程等闭包比当前作用域活得更久的场景。

## Related pages

- [[concepts/Rust Closure|Rust Closure]]
- [[concepts/Rust Ownership|Rust Ownership]]
- [[concepts/Rust Borrowing|Rust Borrowing]]
- [[concepts/Rust Iterator|Rust Iterator]]
- [[language/rust/traits]]
- [[language/rust/generics]]

## Reference

- [The Rust Book — Closures](https://doc.rust-lang.org/book/ch13-01-closures.html)
