---
title: "Rust Iterators"
description: Rust 迭代器 trait、惰性求值、消费适配器与迭代器适配器的笔记摘要
source_type: note
local_ref: "[[language/rust/iterators]]"
date: 2026-07-25
tags: [source, rust, iterator, trait, closure, lazy-evaluation]
aliases: []
---

# Rust Iterators

> Source: [[language/rust/iterators]]

## One-line summary

Rust 迭代器是**惰性**的：通过 `map`/`filter` 等适配器搭建转换流水线，只有调用 `collect`/`sum`/`for_each` 等**消费适配器**时才会真正执行。

## Key claims

- 所有迭代器实现 `Iterator` trait，核心是 `next(&mut self) -> Option<Self::Item>`。
- `iter()` 返回 `&T`，`iter_mut()` 返回 `&mut T`，`into_iter()` 返回 `T` 并转移所有权。
- **消费适配器**调用 `next` 消耗迭代器，如 `sum`、`collect`、`for_each`。
- **迭代器适配器**返回新迭代器、不立即执行，如 `map`、`filter`。
- 只创建迭代器而不消费，闭包逻辑不会执行。
- 闭包常与适配器组合，提供灵活的转换/筛选逻辑。

## Related pages

- [[concepts/Rust Iterator|Rust Iterator]]
- [[concepts/Rust Closure|Rust Closure]]
- [[concepts/Lazy Evaluation|Lazy Evaluation]]
- [[sources/src-rust-closures|src-rust-closures]]
- [[language/rust/generics]]

## Reference

- [The Rust Book — Iterators and Closures](https://doc.rust-lang.org/book/ch13-00-functional-features.html)
