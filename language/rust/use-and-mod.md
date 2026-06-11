---
title: Rust 的 use 和 mod
tags:
  - rust
  - module-system
aliases:
  - mod
  - use
  - 模块系统
date: 2026-06-10
---

# Rust 的 use 和 mod

## 前置知识：模块系统概览

Rust 的模块系统由几个关键字协作完成：

| 关键字     | 作用          |
| ------- | ----------- |
| `mod`   | 声明/定义模块     |
| `use`   | 引入路径到当前作用域  |
| `pub`   | 控制可见性       |
| `crate` | 当前 crate 的根 |
| `self`  | 当前模块        |
| `super` | 父模块         |

---

## mod：声明和定义模块

### 两种写法

**1. 内联定义** — 模块内容写在当前文件里

```rust
mod garden {
    pub fn plant() {}
    mod seeds {
        pub fn sow() {}
    }
}
```

**2. 外部文件** — 模块内容在单独文件中，用 `mod` 声明引用

```rust
mod garden; // 编译器去找 garden.rs 或 garden/mod.rs
```

### 文件查找规则（Rust 2018+）

```
src/
├── main.rs
├── garden.rs          ← mod garden; 找这里
└── garden/
    └── seeds.rs       ← garden.rs 里的 mod seeds; 找这里
```

> 旧风格 `garden/mod.rs` 也支持，但推荐用 `garden.rs` + `garden/` 目录。

### mod 的本质

`mod` 是**定义**，不是引用。它说"这个模块存在，内容在这"。

```rust
// main.rs
mod utils;        // 定义 utils 模块，内容在 utils.rs
mod utils;        // ❌ 错误！不能定义两次
```

---

## use：引入路径到作用域

### 基本用法

```rust
use std::collections::HashMap;

let mut map = HashMap::new(); // 不用写 std::collections::HashMap::new()
```

### use 不会复制代码

`use` 只是创建一个**别名/快捷方式**，不会复制或移动任何东西。

### 常见引入模式

```rust
// 引入具体项
use std::io::Write;

// 引入多个（嵌套路径）
use std::io::{self, Write, Read};

// 引入所有公开项（谨慎使用）
use std::collections::*;

// 引入枚举变体
use std::option::Option::{Some, None}; // 实际上 prelude 已经帮你做了
```

### 路径起点

| 起点 | 含义 |
|------|------|
| `crate::` | 从当前 crate 根开始 |
| `self::` | 从当前模块开始 |
| `super::` | 从父模块开始 |
| 直接写名字 | 等同于 `crate::`（在 `use` 语句中） |

```rust
// 在 src/utils/helper.rs 中
use crate::models::User;       // 从 crate 根找 models::User
use self::local_fn;            // 当前模块的 local_fn
use super::other_helper;       // 父模块 utils 下的 other_helper
```

---

## mod + use 配合

### 典型项目结构

```
src/
├── main.rs
├── models/
│   ├── mod.rs
│   └── user.rs
└── utils/
    ├── mod.rs
    └── helper.rs
```

**src/models/mod.rs**

```rust
pub mod user; // 声明并公开 user 子模块
```

**src/models/user.rs**

```rust
pub struct User {
    pub name: String,
}
```

**src/main.rs**

```rust
mod models;                           // 定义 models 模块
use models::user::User;               // 引入 User

fn main() {
    let u = User { name: "Alice".into() };
}
```

### re-export（pub use）

在 `mod.rs` 中用 `pub use` 可以把子模块的内容"提升"到父模块：

```rust
// src/models/mod.rs
pub mod user;
pub use user::User; // 现在可以用 models::User 直接访问
```

```rust
// main.rs 就可以简化为
use models::User; // 不用 models::user::User
```

---

## Prelude：隐式的 use

Rust 自动在每个 crate 里隐式插入：

```rust
use std::prelude::rust_2021::*;
```

所以以下类型可以直接使用，不需要 `use`：

- `Option`、`Some`、`None`
- `Result`、`Ok`、`Err`
- `Vec`、`String`、`Box`
- `println!`、`vec!` 等宏

---

## 常见错误

### 1. 忘记 `pub`

```rust
// lib.rs
mod utils; // 没有 pub，外部 crate 看不到

// 别的 crate
use my_lib::utils; // ❌ 私有
```

### 2. 只 `use` 不 `mod`

```rust
// main.rs
use utils::helper; // ❌ 编译器不知道 utils 是什么

// 正确做法
mod utils;              // 先定义
use utils::helper;      // 再引入
```

### 3. 文件找不到

```
// mod garden; 会找：
//   src/garden.rs  或  src/garden/mod.rs
// 如果都没有 → 编译错误
```

---

## 速查表

```rust
// 定义模块（外部文件）
mod my_module;

// 定义模块（内联）
mod my_module { ... }

// 引入
use crate::path::to::Item;
use std::collections::HashMap;

// 引入多个
use std::io::{self, Read, Write};

// re-export
pub use my_module::PublicType;

// 路径关键字
crate::   // crate 根
self::    // 当前模块
super::   // 父模块
```
