---
title: Rust Closure
description: Rust 中携带外部环境、由编译器推断并实现 Fn/FnMut/FnOnce trait 的匿名函数
date: 2026-07-25
tags: [concept, rust, closures, ownership, fn-traits]
aliases: [Rust Closures]
---

# Rust Closure

## Definition

**Rust 闭包（Closure）** 是一种可以捕获其定义处环境的匿名函数。与普通 `fn` 不同，闭包能够自动借用、修改或移动外部变量，因此常用于短小的、依赖上下文的局部逻辑。

## Basic syntax

```rust
let tax_rate = 0.08;
let total = |price: f64| price * (1.0 + tax_rate);
println!("{}", total(100.0));
```

## Capturing environment

闭包捕获外部值的方式由编译器根据闭包体推断：

| 方式 | 语法/触发条件 | 影响 |
|------|---------------|------|
| 不可变借用 | 只读取外部值 | 外部值仍可被其他不可变引用读取 |
| 可变借用 | 修改外部值 | 闭包存活期间限制其他借用 |
| 获取所有权 | 使用 `move` 关键字 | 外部值被移入闭包 |

```rust
let name = String::from("Rust");
let owned = move || println!("{name}");
owned();
```

## Fn traits

Rust 根据闭包体如何使用捕获值，自动为闭包实现以下 trait：

| Trait | 闭包体行为 | 可调用次数 | 关系 |
|-------|-----------|-----------|------|
| `FnOnce` | 可能把捕获值 move 出闭包 | 至少一次 | 所有闭包至少实现 |
| `FnMut` | 不 move 出，但可能修改捕获值 | 多次 | 满足 `FnOnce` |
| `Fn` | 不 move 出，也不修改捕获值 | 多次 | 满足 `FnMut` 与 `FnOnce` |

子集关系：`Fn` ⊂ `FnMut` ⊂ `FnOnce`。

## Choosing trait bounds

- 只调用一次：`FnOnce() -> T`，如 `unwrap_or_else`。
- 调用多次且允许状态变化：`FnMut`，如 `sort_by_key`。
- 调用多次且只读/可并发：`Fn`。

## Common pitfalls

- 同一闭包在首次调用后会被推断为具体类型，不能当作泛型函数复用。
- 可变捕获会延长闭包对变量的借用，期间不能再随意访问该变量。
- 需要多次调用的 API 不能接受把捕获值 move 出闭包体的 `FnOnce`。

## Related concepts

- [[concepts/Rust Ownership|Rust Ownership]] — Rust 所有权系统
- [[concepts/Rust Borrowing|Rust Borrowing]] — Rust 借用规则
- [[concepts/Rust Trait|Rust Trait]] — Rust 中定义共享行为的机制
- [[concepts/Rust Iterator|Rust Iterator]] — 常与闭包配合使用的迭代器

## Sources

- [[sources/src-rust-closures|src-rust-closures]]
- [[language/rust/traits]]
- [[language/rust/generics]]
