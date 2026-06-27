---
title: Rust Closures
source: https://doc.rust-lang.org/book/ch13-01-closures.html
created: 2026-06-18
tags:
  - rust
  - rust-book
  - closures
  - ownership
  - fn-traits
aliases:
  - Rust 闭包
  - Rust closures
---

# Rust Closures

> [!summary]
> 闭包是可以存进变量、传给函数、并且能捕获定义处环境的匿名函数。理解闭包的关键不是语法，而是它如何捕获外部值，以及它最终满足 `Fn`、`FnMut` 还是 `FnOnce`。

相关笔记：[[Rust]]、[[Rust Ownership]]、[[Rust Borrowing]]、[[Rust Generics]]、[[Rust Iterators]]

## 1. 闭包是什么

闭包可以理解成“带着上下文的匿名函数”：

- 可以赋值给变量。
- 可以作为参数传给其他函数。
- 可以在定义处捕获外部作用域里的值。
- 通常用于较短、局部、和调用场景紧密相关的逻辑。

普通函数不能自动捕获定义处的环境；闭包可以。

```rust
let tax_rate = 0.08;
let total = |price: f64| price * (1.0 + tax_rate);

println!("{}", total(100.0));
```

这里 `total` 捕获了外部变量 `tax_rate`。

## 2. `unwrap_or_else` 展示了闭包的惰性

页面用 `Option<T>::unwrap_or_else` 说明闭包的典型用途：只有在需要时才运行 fallback 逻辑。

```rust
let preferred = None;
let choice = preferred.unwrap_or_else(|| compute_default());
```

核心点：

- `Some(value)` 时直接返回 `value`，闭包不会执行。
- `None` 时才调用闭包。
- 闭包可以捕获当前环境里的变量或方法调用。

这比提前计算默认值更灵活，尤其当默认值计算昂贵或依赖上下文时。

## 3. 闭包类型通常由编译器推断

闭包不像公开 API 里的 `fn` 那样经常需要完整类型标注。它们通常很短，使用范围也窄，所以 Rust 编译器大多能根据调用方式推断参数和返回值类型。

几种等价风格：

```rust
fn add_one_fn(x: u32) -> u32 {
    x + 1
}

let add_one_full = |x: u32| -> u32 { x + 1 };
let add_one_infer = |x| x + 1;
```

但一个闭包的参数和返回值会被推断成一组具体类型。一旦第一次调用确定了类型，后面不能拿同一个闭包当成“泛型函数”来用。

```rust
let identity = |x| x;

let s = identity(String::from("hello"));
// let n = identity(5); // 错：这个闭包已经被推断为接收并返回 String
```

## 4. 闭包如何捕获环境

闭包捕获外部值的方式和函数接收参数的方式相对应：

| 捕获方式 | 什么时候发生 | 影响 |
|---|---|---|
| 不可变借用 | 闭包只读取外部值 | 外部值仍可被其他不可变引用读取 |
| 可变借用 | 闭包会修改外部值 | 闭包存在并可能被调用期间，会限制其他借用 |
| 获取所有权 | 使用 `move`，或闭包体需要拥有值 | 外部值可能被移动进闭包 |

只读取外部值：

```rust
let list = vec![1, 2, 3];
let show = || println!("{list:?}");

show();
println!("{list:?}");
```

修改外部值：

```rust
let mut count = 0;
let mut inc = || {
    count += 1;
};

inc();
inc();
```

强制移动捕获值：

```rust
let name = String::from("Rust");
let owned = move || println!("{name}");

owned();
```

`move` 常见于线程等场景，因为闭包可能比当前作用域活得更久，必须拥有自己用到的数据。

## 5. `Fn`、`FnMut`、`FnOnce`

闭包会根据“闭包体如何使用捕获的值”自动实现一个或多个 trait。

| Trait | 闭包体做了什么 | 可调用次数 | 直觉 |
|---|---|---:|---|
| `FnOnce` | 可能把捕获值 move 出闭包 | 至少一次，可能只能一次 | 会消耗环境 |
| `FnMut` | 不 move 出捕获值，但可能修改捕获值 | 多次 | 会改变环境 |
| `Fn` | 不 move 出捕获值，也不修改捕获值，或不捕获环境 | 多次 | 只读或纯计算 |

关系可以这样记：

- 所有闭包至少实现 `FnOnce`。
- 实现 `Fn` 的闭包也能满足 `FnMut` 和 `FnOnce` 的要求。
- 实现 `FnMut` 的闭包也能满足 `FnOnce` 的要求。
- 只实现 `FnOnce` 的闭包最受限，因为它可能调用一次后就把捕获值消耗掉了。

## 6. API 为什么选择不同的闭包 trait bound

### `unwrap_or_else` 使用 `FnOnce`

`unwrap_or_else` 最多只会调用 fallback 闭包一次：

- `Some` 时不调用。
- `None` 时调用一次。

所以它用 `FnOnce() -> T` 就够了。这样设计最宽松，因为所有闭包都至少能作为 `FnOnce` 使用。

### `sort_by_key` 使用 `FnMut`

排序时，`sort_by_key` 会对多个元素反复调用闭包，因此闭包必须能被多次调用。

```rust
items.sort_by_key(|item| item.score);
```

它选择 `FnMut`，因为排序过程可能需要反复调用闭包，同时允许闭包维护一些可变状态，比如计数器。

```rust
let mut calls = 0;

items.sort_by_key(|item| {
    calls += 1;
    item.score
});
```

但不能在这种闭包里把捕获到的非 `Copy` 值 move 出去，否则这个闭包就只能调用一次，无法满足 `sort_by_key` 的需求。

## 7. 函数名也可以当闭包用

如果不需要捕获环境，可以直接传函数名。

```rust
let value: Option<Vec<i32>> = None;
let list = value.unwrap_or_else(Vec::new);
```

这里 `Vec::new` 本身能满足对应的 `Fn` trait bound。

## 8. 常见坑

### 同一个闭包不是泛型函数

未标注类型的闭包会在首次使用时确定具体类型。

```rust
let f = |x| x;
let a = f("hello");
// let b = f(42); // 错
```

### 可变捕获会影响借用范围

如果闭包捕获了某个变量的可变引用，那么在闭包最后一次使用之前，不能随便再对那个变量做不可变借用或可变借用。

```rust
let mut xs = vec![1, 2, 3];
let mut push = || xs.push(4);

// println!("{xs:?}"); // 这里可能和闭包持有的可变借用冲突
push();
println!("{xs:?}");
```

### 多次调用的闭包里不能 move 出捕获值

像 `sort_by_key` 这种会多次调用闭包的 API，不能接受“调用一次就消耗捕获值”的闭包。

```rust
let label = String::from("called");

// 如果闭包把 label 移走，它就无法被安全地调用多次。
```

可选修复：

- 改成借用。
- 改成计数器等可变状态。
- 必要时显式 `clone`，但要意识到性能成本。

## 9. 记忆模型

判断一个闭包属于哪类，可以按这个顺序问：

1. 它有没有把捕获的值 move 出闭包体？
   - 有：通常只能是 `FnOnce`。
2. 它有没有修改捕获的值？
   - 有：通常是 `FnMut`。
3. 它只是读取捕获值，或者根本不捕获？
   - 通常是 `Fn`。

再看调用方需求：

- 只会调用一次：可以要求 `FnOnce`，最灵活。
- 会调用多次且可能允许状态变化：要求 `FnMut`。
- 会多次调用且希望不改变环境，甚至可能并发调用：要求 `Fn`。

## 10. 一句话总结

Rust 闭包的核心是”捕获环境 + trait 约束”。语法只是入口，真正决定闭包能被哪些 API 接受的是它如何借用、修改或移动捕获到的值。

## Related
- [[The Rust Programming Language]]
