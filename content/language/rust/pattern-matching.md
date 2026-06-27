---
title: Pattern Matching
tags:
  - rust
  - syntax
date: 2026-06-10
---

# Pattern Matching

Rust 的 pattern matching 主要通过 `match` 表达式和 `if let` 来实现。

## 基本 `match` 语法

```rust
match value {
    pattern1 => expression1,
    pattern2 => expression2,
    _ => default_expression,  // _ 匹配所有其他情况
}
```

## 常见的 Pattern 类型

### 1. 匹配字面值

```rust
let x = 1;
match x {
    1 => println!("one"),
    2 => println!("two"),
    3 => println!("three"),
    _ => println!("other"),
}
```

### 2. 匹配多个值

```rust
match x {
    1 | 2 => println!("one or two"),  // 用 | 分隔多个模式
    3..=5 => println!("three to five"),  // 范围匹配
    _ => println!("other"),
}
```

### 3. 匹配枚举

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u32 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

### 4. 匹配元组

```rust
let point = (0, -2);
match point {
    (0, 0) => println!("origin"),
    (x, 0) => println!("x-axis, x={}", x),
    (0, y) => println!("y-axis, y={}", y),
    (x, y) => println!("({}, {})", x, y),
}
```

### 5. 匹配结构体

```rust
struct Point {
    x: i32,
    y: i32,
}

let p = Point { x: 0, y: 7 };
match p {
    Point { x, y: 0 } => println!("on x-axis at {}", x),
    Point { x: 0, y } => println!("on y-axis at {}", y),
    Point { x, y } => println!("somewhere else ({}, {})", x, y),
}
```

### 6. 匹配引用和解构

```rust
let reference = &4;
match reference {
    &val => println!("got a value: {}", val),  // 解构引用
}

// 或者用 ref
match 4 {
    ref val => println!("got a reference to: {}", val),
}
```

### 7. 匹配守卫 (Match Guards)

```rust
let num = Some(4);
match num {
    Some(x) if x < 5 => println!("less than five: {}", x),
    Some(x) => println!("{}", x),
    None => (),
}
```

### 8. 绑定变量 (绑定运算符 @)

```rust
let msg = Message::Hello { id: 5 };
match msg {
    Message::Hello { id: id_variable @ 3..=7 } => {
        println!("found an id in range: {}", id_variable)
    },
    Message::Hello { id: 10..=12 } => {
        println!("found an id in another range")
    },
    Message::Hello { id } => {
        println!("found some other id: {}", id)
    },
}
```

## `if let` 简洁语法

当你只关心**一种情况**时，用 `if let` 更简洁：

```rust
let config_max = Some(3u8);
// 用 match
match config_max {
    Some(max) => println!("maximum is {}", max),
    _ => (),
}

// 用 if let（更简洁）
if let Some(max) = config_max {
    println!("maximum is {}", max);
}
```

## `while let` 循环

```rust
let mut stack = Vec::new();
stack.push(1);
stack.push(2);
stack.push(3);

while let Some(top) = stack.pop() {
    println!("{}", top);
}
```

## `let` 语句中的模式

```rust
let (x, y, z) = (1, 2, 3);
println!("x={}, y={}, z={}", x, y, z);
```

## 函数参数中的模式

```rust
fn print_point(&(x, y): &(i32, i32)) {
    println!("x: {}, y: {}", x, y);
}

let point = (3, 5);
print_point(&point);
```

## Related
- [[The Rust Programming Language]]
- [[enum]]

## 参考

- [[Rust 程序设计语言]]
