---
title: Rust Enum
description: Rust 中可携带数据的标签联合体枚举类型
date: 2026-07-25
tags: [concept, rust, enum, type-system]
aliases: []
---

# Rust Enum

## Definition

**Rust Enum**（枚举）是一种**标签联合体（tagged union）**。与 C/C++ 中仅作为整数常量别名的枚举不同，Rust 枚举的每个变体（variant）可以携带不同类型和数量的关联数据。

## Basic syntax

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}
```

- `Message` 是类型。
- `Quit`、`Move`、`Write`、`ChangeColor` 是构造器。
- `Message::Write(String::from("hi"))` 是值（实例）。

## Variant payload types

| 变体形式 | 示例 | 说明 |
|----------|------|------|
| 单元变体 | `Quit` | 无数据 |
| 匿名结构体 | `Move { x, y }` | 命名字段 |
| 单值元组 | `Write(String)` | 一个关联值 |
| 多值元组 | `ChangeColor(i32, i32, i32)` | 多个关联值 |

## Memory layout

Rust 枚举在内存中至少包含：

- **tag**：标识当前激活的变体。
- **data**：对应变体携带的数据（如果有）。

编译器会对 tag 进行布局优化（如 null pointer optimization），`Option<&T>` 可与 `Box<T>` 一样只用一个指针表示。

## Option<T>

Rust 没有 null，使用内置枚举表示可空值：

```rust
enum Option<T> {
    Some(T),
    None,
}
```

## Pattern matching

```rust
match msg {
    Message::Quit => println!("Quit"),
    Message::Move { x, y } => println!("Move to ({}, {})", x, y),
    Message::Write(text) => println!("Text: {}", text),
    Message::ChangeColor(r, g, b) => println!("Color: ({}, {}, {})", r, g, b),
}
```

`match` 要求穷尽（exhaustive），确保每个变体都被处理。

## Related concepts

- [[concepts/Rust Pattern Matching|Rust Pattern Matching]] — Rust 中基于结构进行分支和解构的机制
- [[concepts/Rust Option|Rust Option]] — 表示值可能存在或不存在的枚举
- [[concepts/Rust Result|Rust Result]] — 表示操作可能成功或失败的枚举
- [[concepts/Algebraic Data Type|Algebraic Data Type]] — 由积类型与和类型组合而成的数据类型

## Sources

- [[sources/src-rust-enum|src-rust-enum]]
- [[language/rust/pattern-matching]]
