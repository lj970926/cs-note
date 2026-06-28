---
title: Rust Iterators
source: https://doc.rust-lang.org/book/ch13-02-iterators.html
created: 2026-06-28
tags:
  - rust
  - rust-book
  - iterators
  - closures
  - trait
aliases:
  - Rust 迭代器
  - Rust iterators
---

# Rust Iterators

> [!summary]
> 迭代器模式让你按顺序处理序列中的每个元素，而不用关心“怎么遍历、什么时候结束”。Rust 的迭代器是**惰性**的：只有调用**消费适配器**时，才会真正执行。

相关笔记：[[Rust Closures]]、[[Rust]]、[[Rust Ownership]]、[[Rust Borrowing]]、[[Rust Generics]]

## 1. 创建和使用迭代器

迭代器把“遍历序列”这件事封装起来。最简单的用法就是 `for` 循环，它会在背后自动创建并消费迭代器。

```rust
fn main() {
    let v1 = vec![1, 2, 3];
    let v1_iter = v1.iter();

    for val in v1_iter {
        println!("Got: {val}");
    }
}
```

也可以把“创建迭代器”和“使用迭代器”分开写，这在需要链式调用时很常见。

## 2. `Iterator` trait 与 `next`

所有迭代器都实现 `Iterator` trait：

```rust
pub trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;

    // 其他有默认实现的方法省略
}
```

关键点：

- `type Item` 是关联类型，表示迭代器每次返回的元素类型。
- `next` 一次返回一个 `Some(item)`，结束时返回 `None`。
- 调用 `next` 会改变迭代器内部状态，所以迭代器本身必须是可变的。
- `iter()` 返回不可变引用 `&T`。
- `into_iter()` 获取所有权，返回 `T`。
- `iter_mut()` 返回可变引用 `&mut T`。

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn iterator_demonstration() {
        let v1 = vec![1, 2, 3];
        let mut v1_iter = v1.iter();

        assert_eq!(v1_iter.next(), Some(&1));
        assert_eq!(v1_iter.next(), Some(&2));
        assert_eq!(v1_iter.next(), Some(&3));
        assert_eq!(v1_iter.next(), None);
    }
}
```

在 `for` 循环里，可变性和所有权由编译器自动处理。

## 3. 消费适配器（Consuming Adapters）

调用 `next` 把迭代器“用掉”的方法叫**消费适配器**。调用后迭代器就不能再用了。

### `sum`

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn iterator_sum() {
        let v1 = vec![1, 2, 3];
        let v1_iter = v1.iter();
        let total: i32 = v1_iter.sum();
        assert_eq!(total, 6);
    }
}
```

调用 `sum` 后，`v1_iter` 已被消耗，再次使用会编译报错。

### `collect` —— 把迭代器收集成集合

```rust
fn main() {
    let v1: Vec<i32> = vec![1, 2, 3];
    let v2: Vec<_> = v1.iter().map(|x| x + 1).collect();
    assert_eq!(v2, vec![2, 3, 4]);
}
```

`collect` 是消费适配器，能把结果汇总成 `Vec`、`HashMap` 等集合。多个适配器可以链式调用，但链尾必须有一个消费适配器才能触发执行。

## 4. 迭代器适配器（Iterator Adapters）

**迭代器适配器**本身不会消费迭代器，而是把原迭代器转换成另一个迭代器。它们是惰性的，需要配合消费适配器才会真正执行。

### `map` —— 转换每个元素

```rust
fn main() {
    let v1: Vec<i32> = vec![1, 2, 3];
    v1.iter().map(|x| x + 1);  // 警告：unused，因为 lazy
}
```

上面这行会产生 `unused` 警告：只创建了一个新的迭代器，但没有消费它，闭包里的 `+1` 根本不会执行。

### `filter` —— 用闭包筛选元素

```rust
#[derive(PartialEq, Debug)]
struct Shoe {
    size: u32,
    style: String,
}

fn shoes_in_size(shoes: Vec<Shoe>, shoe_size: u32) -> Vec<Shoe> {
    shoes.into_iter().filter(|s| s.size == shoe_size).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn filters_by_size() {
        let shoes = vec![
            Shoe { size: 10, style: String::from("sneaker") },
            Shoe { size: 13, style: String::from("sandal") },
            Shoe { size: 10, style: String::from("boot") },
        ];

        let in_my_size = shoes_in_size(shoes, 10);

        assert_eq!(
            in_my_size,
            vec![
                Shoe { size: 10, style: String::from("sneaker") },
                Shoe { size: 10, style: String::from("boot") },
            ]
        );
    }
}
```

这里 `filter` 的闭包捕获了外部变量 `shoe_size`，只保留尺码匹配的元素。流程是：

1. `into_iter()` 获取 `shoes` 的所有权。
2. `filter(|s| s.size == shoe_size)` 适配成只返回匹配项的迭代器。
3. `collect()` 消费并收集成新的 `Vec<Shoe>`。

这个例子很好地展示了闭包和迭代器组合使用的典型模式。

## 5. 核心概念对照

| 概念 | 说明 |
|---|---|
| **惰性求值** | 迭代器在调用消费适配器前不会执行 |
| **消费适配器** | `sum`、`collect` 等，会消耗迭代器 |
| **迭代器适配器** | `map`、`filter` 等，返回新迭代器，不立即执行 |
| **`next()`** | `Iterator` trait 的必需方法，返回 `Option<Self::Item>` |
| **闭包** | 常与适配器配合使用，可捕获环境变量 |
| **链式调用** | 多个适配器可组合成可读性高的转换流水线 |

## 6. 常见坑

### 只创建迭代器不消费，代码不会执行

```rust
let v = vec![1, 2, 3];
v.iter().map(|x| println!("{x}")); // 不会打印任何东西
```

要加上消费适配器：

```rust
v.iter().for_each(|x| println!("{x}"));
// 或
let _: Vec<_> = v.iter().map(|x| x * 2).collect();
```

### 消费后不能再使用同一个迭代器

```rust
let v = vec![1, 2, 3];
let iter = v.iter();
let total: i32 = iter.sum();
// iter 已经被消耗，下面这行会报错
// for x in iter { println!("{x}"); }
```

### `iter()` vs `into_iter()` vs `iter_mut()`

| 方法 | 返回类型 | 是否转移所有权 |
|---|---|---|
| `iter()` | `&T` | 否 |
| `iter_mut()` | `&mut T` | 否，但需要可变借用 |
| `into_iter()` | `T` | 是 |

选择哪个版本，取决于你是想读取、修改还是拿走元素。

## 7. 一句话总结

Rust 迭代器的精髓是**惰性 + 适配器组合**：先用 `map`/`filter` 等搭建转换流水线，最后用 `collect`/`sum`/`for_each` 等触发真正执行；闭包负责在每一步提供灵活的转换逻辑。

## Related
- [[The Rust Programming Language]]
