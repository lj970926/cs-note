---
title: Visibility
tags:
  - rust
  - module
date: 2026-06-10
---

# Visibility

Rust 的可见性规则控制哪些代码可以访问哪些项（结构体、函数、方法等）。

## 默认可见性

- **模块内私有**：没有 `pub` 关键字的项默认只能在**定义它的模块内**访问
- 同一个文件内的代码互相可见

```rust
struct Inventory {
    shirts: Vec<ShirtColor>,
}

impl Inventory {
    fn giveaway(&self, user_preference: Option<ShirtColor>) -> ShirtColor {
        // ...
    }
    
    fn most_stocked(&self) -> ShirtColor {
        // ...
    }
}

fn main() {
    let store = Inventory { shirts: vec![...] };
    // ✅ 可以调用，因为 main 和 Inventory 在同一个模块
    store.giveaway(Some(ShirtColor::Blue));
    store.most_stocked();
}
```

## `pub` 关键字

加上 `pub` 后，项可以被**外部模块**访问：

```rust
pub struct Inventory {
    pub shirts: Vec<ShirtColor>,
}

impl Inventory {
    pub fn giveaway(&self, user_preference: Option<ShirtColor>) -> ShirtColor {
        // ...
    }
    
    pub fn most_stocked(&self) -> ShirtColor {
        // ...
    }
}
```

## 常见场景

| 场景 | 是否可见 |
|------|----------|
| 同一个模块内 | ✅ 始终可见 |
| 父模块访问子模块的私有项 | ❌ 不可见 |
| 子模块访问父模块的私有项 | ❌ 不可见 |
| 任何地方访问 `pub` 项 | ✅ 可见 |

## `pub(crate)`

只在当前 crate 内可见，外部 crate 不可见：

```rust
pub(crate) fn helper() {
    // 只有同一个 crate 内的代码可以调用
}
```

## `super` 和 `self`

- `super`：访问父模块
- `self`：访问当前模块（显式指定）

```rust
mod parent {
    fn secret() {}
    
    mod child {
        fn call_parent() {
            super::secret();  // 访问父模块的函数
        }
    }
}
```

## 参考

- [[Pattern Matching]]
- [[Rust 程序设计语言]]
