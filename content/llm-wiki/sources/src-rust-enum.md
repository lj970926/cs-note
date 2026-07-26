---
title: "Rust Enum"
description: Rust 枚举作为标签联合体及其变体携带数据的笔记摘要
source_type: note
local_ref: "[[language/rust/enum]]"
date: 2026-07-25
tags: [source, rust, enum, type-system]
aliases: []
---

# Rust Enum

> Source: [[language/rust/enum]]

## One-line summary

Rust 的枚举是**标签联合体（tagged union）**，每个变体可以携带不同类型和数量的数据；`Option<T>` 是最常用的内置枚举之一。

## Key claims

- Rust enum 是类型，变体是构造器，调用构造器得到值。
- 变体可携带数据：无数据、命名字段、单值、多值元组。
- 内存布局包含 tag 标识当前变体，以及对应的数据。
- `Option<T>` 用 `Some(T)` / `None` 替代 null，是 Rust 类型系统的核心。
- `match` 用于穷尽地解构枚举变体。

## Related pages

- [[concepts/Rust Enum|Rust Enum]]
- [[concepts/Rust Pattern Matching|Rust Pattern Matching]]
- [[concepts/Rust Option|Rust Option]]
- [[language/rust/pattern-matching]]
- [[language/rust/visibility]]

## Reference

- [The Rust Book — Enums and Pattern Matching](https://doc.rust-lang.org/book/ch06-00-enums.html)
