---
title: Rust Traits
source: https://doc.rust-lang.org/book/ch10-02-traits.html
created: 2026-07-03
tags:
  - rust
  - rust-book
  - trait
  - trait-bounds
  - trait-objects
  - dynamic-dispatch
  - associated-types
  - type-system
aliases:
  - Rust trait
  - Rust 特征
  - trait
---

# Rust Traits

> [!summary]
> trait 是 Rust 定义**共享行为**的机制——它告诉编译器"某种类型能做哪些事"。理解 trait 要抓住三个层次：**如何定义和实现 trait**（静态契约）、**trait bound 如何约束泛型**（编译期检查）、**trait object 如何实现运行时多态**（动态派发）。

相关笔记：[[Rust]]、[[Rust Ownership]]、[[generics|Rust Generics]]、[[closure|Rust Closures]]、[[iterators|Rust Iterators]]、[[enum|Enum]]

## 1. 定义 Trait

trait 告诉 Rust 编译器"某种类型具有哪些行为"，是泛型约束的基石。

### 基本语法

```rust
pub trait Summary {
    fn summarize(&self) -> String;
}
```

声明一个 trait 后，为具体类型实现它：

```rust
pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {}", self.headline, self.location)
    }
}
```

这就意味着 `NewsArticle` 满足了 `Summary` 这个 trait bound，可以用在任何要求 `T: Summary` 的地方。

### 默认实现

trait 方法可以提供默认实现，类型可以选择覆盖或直接用默认：

```rust
pub trait Summary {
    fn summarize(&self) -> String {
        String::from("(Read more...)")
    }
}

// 空 impl 块也能工作，使用默认实现
impl Summary for NewsArticle {}
```

默认实现里可以调用同一个 trait 里的其他方法（即使它们没有默认实现），这让 trait 可以构建层次化的接口：

```rust
pub trait Summary {
    fn summarize_author(&self) -> String;

    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.summarize_author())
    }
}
```

此时实现者只需提供 `summarize_author`，`summarize` 自动生成。

### 孤儿规则（Orphan Rule）

> 只有当 trait 或类型至少有一个定义在当前 crate 中时，才能对该类型实现该 trait。

```rust
// 错：Vec<T> 和 Display 都定义在标准库，不属于当前 crate
// impl Display for Vec<i32> { ... }
```

这条规则防止两个 crate 对同一个 (type, trait) 组合提供冲突的实现。绕开方法：使用 newtype 模式包装外部类型，再为包装类型实现 trait。

## 2. Trait Bounds — 约束泛型

泛型给了灵活性，但也带来了限制：在不知道 `T` 是什么类型时，能做的操作非常有限。

```rust
// 不能编译：T 可以是任何类型，不一定支持 >
fn largest<T>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest { /* 错：不能对泛型 T 使用 > */ }
    }
    largest
}
```

**Trait bound** 解决这个问题：告诉编译器"T 必须实现某些 trait"，从而解锁相应的操作。

```rust
// T 必须能比较大小
fn largest<T: PartialOrd>(list: &[T]) -> &T { /* ... */ }

// T 必须能比较 AND 能被打印
fn print_largest<T: PartialOrd + std::fmt::Display>(list: &[T]) {
    println!("{}", largest(list));
}
```

### 常见 trait bound 速查

| Trait                     | 解锁的功能                | 典型来源           |
| ------------------------- | -------------------- | -------------- |
| `PartialOrd` / `Ord`      | `>` `<` `>=` `<=` 比较 | 标准库            |
| `PartialEq` / `Eq`        | `==` `!=` 比较          | 标准库            |
| `Clone`                   | `.clone()` 复制        | 标准库            |
| `Copy`                    | 按位复制（隐式）             | 标准库            |
| `Display`                 | `{}` 格式化打印           | `std::fmt`     |
| `Debug`                   | `{:?}` 调试打印          | `std::fmt`     |
| `Default`                 | `Default::default()` | 标准库            |
| `Into<T>` / `From<T>`     | 类型转换                 | `std::convert` |
| `Iterator`                | `for` 循环             | `std::iter`    |
| `Fn` / `FnMut` / `FnOnce` | 当作函数调用               | `std::ops`     |

### 用 trait bound 条件实现方法

```rust
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x);
        } else {
            println!("The largest member is y = {}", self.y);
        }
    }
}
```

只有 `T` 同时满足 `Display` 和 `PartialOrd` 时，`cmp_display` 才可用。

### `where` 子句

当 trait bound 列表很长时，用 `where` 更可读。另一个典型场景是 bound 涉及关联类型：

```rust
fn process<I>(iter: I)
where
    I: Iterator,
    I::Item: Display,
{
    for item in iter {
        println!("{}", item);
    }
}
```

### Derive — 自动实现 trait

很多标准 trait 可以用 `#[derive]` 自动生成实现：

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct Point {
    x: i32,
    y: i32,
}
```

常用的 derivable trait：`Debug`、`Clone`、`Copy`、`PartialEq`、`Eq`、`PartialOrd`、`Ord`、`Hash`、`Default`。

## 3. `impl Trait` 语法

`impl Trait` 是 trait bound 的语法糖，用在参数位置和返回位置有不同的含义。

### 参数位置

```rust
// 用 impl Trait
fn notify(item: &impl Summary) {
    println!("Breaking news! {}", item.summarize());
}

// 等价的泛型写法
fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}
```

参数位置的 `impl Trait` 就是泛型的简写。注意细微区别：多个 `impl Trait` 参数可以是不同类型，泛型 `T` 写法则强制同类型：

```rust
// 两个参数可以是任意实现了 Summary 的不同类型
fn notify(item1: &impl Summary, item2: &impl Summary) { ... }

// 强制两个参数类型相同
fn notify<T: Summary>(item1: &T, item2: &T) { ... }
```

### 返回位置

返回位置的 `impl Trait` **不是**泛型——它表示"返回某个实现了此 trait 的具体类型，但不暴露具体类型名"（opaque type）：

```rust
fn returns_summarizable() -> impl Summary {
    NewsArticle {
        headline: String::from("..."),
        location: String::from("..."),
        content: String::from("..."),
    }
}
```

关键限制：函数体内**所有的返回路径必须返回同一种具体类型**：

```rust
// 错：两个分支返回了不同类型
fn returns_summarizable(switch: bool) -> impl Summary {
    if switch {
        NewsArticle { /* ... */ }
    } else {
        Tweet { /* ... */ }  // 类型不匹配！
    }
}
```

> [!note]
> `impl Trait` 在返回位置的本质是**编译期确定具体类型 + 隐藏类型名**，别跟 trait object 的动态派发搞混。如果需要返回不同类型，可以用 `Box<dyn Trait>`（见第 6 节）。

## 4. 关联类型（Associated Types）

关联类型是在 trait 定义里把一个类型占位符和 trait 绑定在一起。最经典的例子是 `Iterator`：

```rust
pub trait Iterator {
    type Item;  // 关联类型占位符

    fn next(&mut self) -> Option<Self::Item>;
}
```

实现时指定具体类型：

```rust
impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        // ...
    }
}
```

### 为什么不用泛型参数？

换个思路，`Iterator` 完全可以写成泛型：

```rust
pub trait IteratorGeneric<Item> {
    fn next(&mut self) -> Option<Item>;
}
```

但这样就有个问题：对一个类型，可以多次实现 `IteratorGeneric<u32>`、`IteratorGeneric<String>`……而关联类型强制一个类型**对一个 trait 只能有一种关联类型的选择**——`Counter` 的 `.next()` 只能返回 `u32`，没有歧义。

| 场景 | 用泛型参数 | 用关联类型 |
|---|---|---|
| 一个类型需要多种 trait 实现 | ✓ | ✗ |
| trait 签名里多处引用同一类型 | 啰嗦 | 简洁 |
| 调用方无须每次标注类型 | ✗ | ✓ |

简化的判断标准：**如果需要"一个类型 + 这个 trait = 唯一一组行为"，用关联类型；如果需要"一个类型 + 这个 trait + 不同参数 = 不同行为"，用泛型参数。**

## 5. Supertrait

一个 trait 可以要求实现者必须先实现另一个 trait：

```rust
use std::fmt;

// 要求：实现 Display 是使用 OutlinePrint 的前提
trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string();  // 因为 Supertrait 保证了 Display
        let len = output.len();
        println!("{}", "*".repeat(len + 4));
        println!("*{}*", " ".repeat(len + 2));
        println!("* {} *", output);
        println!("*{}*", " ".repeat(len + 2));
        println!("{}", "*".repeat(len + 4));
    }
}
```

这里 `OutlinePrint: Display` 的含义是：如果一个类型想 `impl OutlinePrint`，它必须先 `impl Display`。同时，在 `OutlinePrint` 的默认方法里可以直接用 `self.to_string()`。

标准库里的典型例子：`Copy: Clone`——所有 `Copy` 类型自动满足 `Clone`。`Eq: PartialEq` 同理。

可以在一个 trait 上叠加多个 supertrait：

```rust
trait Advanced: Display + Clone + PartialOrd { /* ... */ }
```

## 6. Trait Object — 动态派发

前面一直讨论的是**静态派发**（泛型 + 单态化）。Rust 还支持**动态派发**，通过 `dyn Trait` 实现。

### 两种派发对比

```rust
// 静态派发：编译期为每个具体类型生成一份代码
fn static_dispatch<T: Summary>(item: &T) {
    println!("{}", item.summarize());
}

// 动态派发：通过 vtable 在运行时查找方法地址
fn dynamic_dispatch(item: &dyn Summary) {
    println!("{}", item.summarize());
}
```

| 维度 | 泛型 `<T: Trait>`（静态） | `dyn Trait`（动态） |
|---|---|---|
| 何时确定调用目标 | 编译期（单态化） | 运行时（vtable） |
| 运行时开销 | 无 | 有（指针间接跳转） |
| 二进制体积 | 大（每种类型一份代码） | 小（一份代码） |
| 类型异构集合 | ✗（`Vec<T>` 只能存一种类型） | ✓（`Vec<Box<dyn Trait>>` 可存不同类型） |
| 能否使用关联函数 | ✓ | ✗（只能调 trait 方法） |
| 必须 `Sized` | ✗ | ✗（trait object 是 `?Sized`） |

### 什么时候用哪个

```rust
// 泛型：类型在编译期已知，追求零开销
// 适合：容器、算法、性能敏感路径
fn process_items<T: Draw>(items: &[T]) { /* ... */ }

// trait object：需要运行时多态，类型在编译期不确定
// 适合：GUI 组件列表、插件系统、回调注册
fn process_items(items: &[Box<dyn Draw>]) { /* ... */ }

// 典型场景：存储不同类型的对象
let components: Vec<Box<dyn Draw>> = vec![
    Box::new(Button { /* ... */ }),
    Box::new(TextField { /* ... */ }),
    Box::new(SelectBox { /* ... */ }),
];
```

> [!note]
> Rust 默认倾向静态派发。除非确实需要运行时多态（异构集合 / 编译期类型未知），优先用泛型。

### Object Safety

只有 **object-safe** 的 trait 才能用于 `dyn Trait`。一个 trait object safe 需要满足（简化版）：

1. trait 所有方法不返回 `Self`（除非 `Self: Sized`）
2. trait 方法没有泛型参数

```rust
trait Clone {
    fn clone(&self) -> Self;  // 返回 Self → 不是 object safe
}
// 不能用于 dyn Clone

trait Draw {
    fn draw(&self);           // object safe ✓
}
```

## 7. 常见坑

### `impl Trait` 返回不同类型

```rust
// 错：编译器不知道返回什么具体类型
fn factory(choice: bool) -> impl Summary {
    if choice {
        NewsArticle { /* ... */ }
    } else {
        Tweet { /* ... */ }  // 不是同一种类型！
    }
}
```

解决方案：用 `Box<dyn Trait>` 替代 `impl Trait`。

### 为外部类型实现外部 trait（孤儿规则违规）

```rust
use std::fmt;

// 错：Vec 和 Display 都定义在标准库
// impl fmt::Display for Vec<String> { ... }
```

解决方案：用 newtype 模式——

```rust
struct MyVec(Vec<String>);

impl fmt::Display for MyVec {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}
```

### trait 方法有默认实现但忘记引入 trait

即使只需要默认实现，也必须把 trait 引入作用域：

```rust
// 错：编译器不知道 NewsArticle 有 summarize 方法
// let article = NewsArticle { ... };
// article.summarize();

// 对：必须 use trait
use Summary;  // 或用完全限定路径
article.summarize();
```

### 泛型参数过多导致签名膨胀

```rust
// 太啰嗦
fn complex<T, U, V>(t: T, u: U, v: V) -> V
where
    T: AsRef<str> + Clone,
    U: Into<String> + Debug,
    V: Default + Display,
{ /* ... */ }
```

评估是否可以：
- 把一些约束下沉到具体使用处（只在需要时加 bound）
- 考虑用 trait object 替代部分泛型参数
- 重构为更小的函数

## 8. 一句话总结

trait 是 Rust 表达"类型能做什么"的核心机制。定义 trait = 写契约，`impl Trait` = 签契约，trait bound = 检查契约。关键决策只在一点：**编译期能确定类型 → 泛型 + 静态派发；编译期不能确定 → `dyn Trait` + 动态派发**。

## Related
- [[generics|Rust Generics]]
- [[The Rust Programming Language]]
- [[closure|Rust Closures]]
- [[iterators|Rust Iterators]]
- [[enum|Enum]]
