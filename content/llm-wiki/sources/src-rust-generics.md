---
title: "Rust Generics"
description: Rust 泛型语法、trait bound、where 子句与单态化机制的笔记摘要
source_type: note
local_ref: "[[language/rust/generics]]"
date: 2026-07-25
tags: [source, rust, generics, type-system, trait-bound]
aliases: []
---

# Rust Generics

> Source: [[language/rust/generics]]

## One-line summary

Rust 泛型把具体类型抽象为类型参数，通过 **trait bound** 约束可用操作，并在编译期通过**单态化**生成具体代码，实现零成本抽象。

## Key claims

- 泛型可用于函数、结构体、枚举、方法，多类型参数用逗号分隔。
- `T: Trait` 是 trait bound，解锁对泛型参数的操作（如 `PartialOrd`、`Display`）。
- 多个 bound 用 `+` 连接；长 bound 列表用 `where` 子句更清晰。
- `impl<T> Point<T> { ... }` 为泛型类型实现方法；`impl Point<f32> { ... }` 可为特定类型特化。
- 单态化在编译期把泛型代码展开为每个具体类型的独立代码，无运行时开销，但会增加编译时间和二进制体积。
- `Option<T>` 与 `Result<T, E>` 是标准库中最典型的泛型枚举。

## Related pages

- [[concepts/Rust Generics|Rust Generics]]
- [[concepts/Rust Trait|Rust Trait]]
- [[concepts/Monomorphization|Monomorphization]]
- [[sources/src-rust-enum|src-rust-enum]]
- [[language/rust/traits]]

## Reference

- [The Rust Book — Generic Types and Traits](https://doc.rust-lang.org/book/ch10-00-generics.html)
