---
title: Rust Iterator
description: Rust 中基于 Iterator trait 的惰性遍历、消费适配器与迭代器适配器组合机制
date: 2026-07-25
tags: [concept, rust, iterator, trait, closure, lazy-evaluation]
aliases: [Rust Iterators]
---

# Rust Iterator

## Definition

**Rust Iterator** 是 Rust 中按顺序访问集合元素的标准抽象。它封装了遍历逻辑，并通过**惰性求值**只在被消费时执行。

## Iterator trait

所有迭代器都实现 `Iterator` trait：

```rust
pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}
```

- `Item` 是关联类型，表示每次返回的元素类型。
- `next` 一次返回一个元素；耗尽后返回 `None`。
- 调用 `next` 会改变迭代器状态，因此迭代器本身必须是可变的。

## Creating iterators

常见集合提供三种迭代方法：

| 方法 | 返回 | 所有权影响 |
|---|---|---|
| `iter()` | `&T` | 不转移所有权 |
| `iter_mut()` | `&mut T` | 可变借用 |
| `into_iter()` | `T` | 转移所有权 |

```rust
let v = vec![1, 2, 3];
for val in v.iter() {
    println!("{}", val);
}
```

## Consuming adapters

消费适配器调用 `next` 消耗迭代器并产出结果：

- `sum`：求和。
- `collect`：收集到 `Vec`、`HashMap` 等集合。
- `for_each`：对每个元素执行副作用。
- `count`、`fold` 等。

```rust
let total: i32 = v.iter().sum();
let doubled: Vec<i32> = v.iter().map(|x| x * 2).collect();
```

消费后迭代器不能再使用。

## Iterator adapters

迭代器适配器返回新迭代器，不立即执行：

- `map`：转换每个元素。
- `filter`：按闭包条件筛选。
- `take`、`skip`、`enumerate`、`zip` 等。

```rust
let iter = v.iter().map(|x| x + 1); // 不会执行 +1
```

必须接上消费适配器才会触发实际计算。

## Laziness

Rust 迭代器是**惰性**的：

```rust
v.iter().map(|x| println!("{}", x)); // 什么都不打印
v.iter().for_each(|x| println!("{}", x)); // 消费并打印
```

这种设计让链式组合不会产生中间集合，提升性能与可读性。

## Related concepts

- [[concepts/Rust Closure|Rust Closure]] — 常与迭代器适配器配合提供转换/筛选逻辑
- [[concepts/Rust Trait|Rust Trait]] — Rust 中定义共享行为的接口，`Iterator` 是典型代表
- [[concepts/Lazy Evaluation|Lazy Evaluation]] — 表达式直到需要结果时才求值的策略
- [[concepts/Rust Generics|Rust Generics]] — 迭代器类型通过泛型参数支持任意元素类型

## Sources

- [[sources/src-rust-iterators|src-rust-iterators]]
