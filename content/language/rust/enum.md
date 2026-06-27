---
title: Enum
tags:
  - rust
  - type-system
date: 2026-06-10
---

# Enum

Rust 的枚举是一个**标签联合体**（tagged union），不是简单的整数常量，也不是类。

## 基本定义

```rust
enum ShirtColor {
    Red,
    Blue,
}
```

- `ShirtColor` 是一个**类型**
- `Red` 和 `Blue` 是**变体**（variants），即构造器
- `ShirtColor::Red` 是调用构造器后得到的**值**（实例）

## 带数据的枚举

变体可以携带不同类型、不同数量的数据：

```rust
enum Message {
    Quit,                       // 没有数据
    Move { x: i32, y: i32 },   // 匿名结构体
    Write(String),              // 一个 String
    ChangeColor(i32, i32, i32), // 三个 i32
}
```

使用：

```rust
let msg1 = Message::Quit;
let msg2 = Message::Move { x: 10, y: 20 };
let msg3 = Message::Write(String::from("hello"));
let msg4 = Message::ChangeColor(255, 0, 0);
```

## 构造器 vs 值

| 概念 | 说明 | 例子 |
|------|------|------|
| 构造器 | 定义，蓝图 | `enum Foo { Bar }` 中的 `Bar` |
| 值 | 实例，用构造器创建出来的东西 | `let x = Foo::Bar` 中的 `Foo::Bar` |

```rust
// 构造器定义
enum ShirtColor {
    Red,    // 这是构造器
    Blue,
}

// 使用构造器创建值
let color = ShirtColor::Red;  // color 是值，不是构造器
```

## `Option<T>` 枚举

Rust 没有 null，用 `Option` 表示可能为空的值：

```rust
enum Option<T> {
    Some(T),  // 有值
    None,     // 无值
}
```

使用：

```rust
let user_pref1 = Some(ShirtColor::Red);  // Option<ShirtColor> 类型
let user_pref2: Option<ShirtColor> = None;
```

拆解过程：
```
ShirtColor::Red       → 创建 ShirtColor 的一个值
Some(ShirtColor::Red) → 包装成 Option<ShirtColor> 类型的值
user_pref1            → 绑定到这个 Option 值
```

## 内存布局

```rust
enum Message {
    Quit,
    Write(String),
}
```

内存中包含：
- **标签**（tag）：标识当前是哪个变体
- **数据**（data）：如果是带数据的变体

```
Message::Quit          → [标签: Quit]
Message::Write("hi")   → [标签: Write] [数据: "hi"]
```

## 和其他语言的对比

| 语言 | 枚举特点 |
|------|----------|
| C/C++ | 只是整数常量的别名 |
| Java | 类的实例，有方法、字段 |
| **Rust** | 标签联合体，变体可携带不同类型的数据 |

## match 解构

用 `match` 来处理不同变体：

```rust
match msg {
    Message::Quit => println!("Quit"),
    Message::Move { x, y } => println!("Move to ({}, {})", x, y),
    Message::Write(text) => println!("Text message: {}", text),
    Message::ChangeColor(r, g, b) => println!("Color: ({}, {}, {})", r, g, b),
}
```

## Related
- [[The Rust Programming Language]]

## 参考

- [[Pattern Matching]]
- [[Visibility]]
