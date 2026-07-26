---
title: Rust Generics
description: Rust 中通过类型参数消除重复、结合 trait bound 约束并在编译期单态化的泛型机制
date: 2026-07-25
tags: [concept, rust, generics, type-system, trait-bound, monomorphization]
aliases: []
---

# Rust Generics

## Definition

**Rust Generics**（泛型）是把具体类型抽象为**类型参数**的机制。泛型代码在定义时不指定具体类型，调用/实例化时由编译器推断或显式指定，并通过**单态化**在编译期生成针对每个具体类型的独立代码。

## Generic syntax

### Generic function

```rust
fn largest<T: std::cmp::PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}
```

- `T` 是类型参数，调用时通常可自动推断。
- 多个类型参数用逗号分隔：`fn swap<T, U>(a: T, b: U) -> (U, T)`。

### Generic struct

```rust
struct Point<T, U> {
    x: T,
    y: U,
}
```

### Generic enum

```rust
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

### Generic methods

```rust
impl<T> Point<T> {
    fn x(&self) -> &T { &self.x }
}
```

- 必须为 `impl` 重复声明泛型参数：`impl<T> Point<T>`。
- 可以为具体类型特化：`impl Point<f32> { fn distance_from_origin(&self) -> f32 { ... } }`。
- 方法可有自己的泛型参数，与 `impl` 参数独立。

## Trait bounds

Trait bound 约束泛型参数必须实现某些 trait，才能调用对应方法。

```rust
fn print_largest<T: PartialOrd + std::fmt::Display>(list: &[T]) {
    println!("{}", largest(list));
}
```

- 多个 bound 用 `+` 连接。
- 涉及关联类型或 bound 较长时，使用 `where` 子句更清晰：

```rust
fn process<I>(iter: I)
where
    I: Iterator,
    I::Item: std::fmt::Display,
{
    for item in iter { println!("{}", item); }
}
```

## Monomorphization

**单态化**是 Rust 编译器在编译期把泛型代码展开为具体类型代码的过程。

```rust
let integer = Some(5);
let float = Some(5.0);
```

编译器会生成类似 `Option_i32` 和 `Option_f64` 的独立实现。

### Trade-offs

| 优点 | 代价 |
|------|------|
| 无运行时开销（零成本抽象） | 编译时间更长 |
| 类型安全在编译期保证 | 二进制体积可能增大（代码膨胀） |

## Common pitfalls

- `Point<T> { x: T, y: T }` 的两个字段必须是同一类型。
- 不能对裸泛型 `T` 做类型特定操作（如 `x * 2`），必须加 trait bound。
- `impl<T>` 不要忘记写 `impl` 后面的泛型参数列表。

## Related concepts

- [[concepts/Rust Trait|Rust Trait]] — Rust 中定义共享行为与约束泛型的接口
- [[concepts/Monomorphization|Monomorphization]] — 编译期将泛型展开为具体类型代码的过程
- [[concepts/Type Parameter|Type Parameter]] — 泛型中用于替代具体类型的占位符
- [[concepts/Rust Enum|Rust Enum]] — Rust 中可携带数据的标签联合体，`Option`/`Result` 是其典型应用

## Sources

- [[sources/src-rust-generics|src-rust-generics]]
