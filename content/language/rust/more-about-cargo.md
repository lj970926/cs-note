---
title: Cargo 进阶：发布、工作区与扩展
source: https://doc.rust-lang.org/book/ch14-00-more-about-cargo.html
created: 2026-07-11
tags:
  - rust
  - rust-book
  - cargo
  - crates-io
  - workspace
aliases:
  - More About Cargo
  - Rust Cargo 进阶
---

# Cargo 进阶：发布、工作区与扩展

> [!summary]
> Cargo 不只是构建工具：它用 **profile** 平衡编译速度与运行性能；用 **crates.io** 分发库；用 **workspace** 管理多个协作 crate；还能安装二进制工具并以 `cargo-*` 形式扩展自身。

相关笔记：[[The Rust Programming Language]]、[[use-and-mod|Rust Modules and use]]、[[visibility|Rust Visibility]]

## 1. 构建配置：Release Profiles

Cargo 有预定义的构建配置（profile），最常用的是：

| 命令                      | profile   | 默认取向         |
| ----------------------- | --------- | ------------ |
| `cargo build`           | `dev`     | 快速编译，便于频繁开发  |
| `cargo build --release` | `release` | 更多优化，便于分发和运行 |

二者独立配置。默认情况下，`dev` 的 `opt-level = 0`，而 `release` 的 `opt-level = 3`：优化等级越高，编译通常越慢、产物运行通常越快。

```toml
# Cargo.toml
[profile.dev]
opt-level = 1

[profile.release]
opt-level = 3
```

> [!tip]
> 通常只覆盖确有需要的选项；未写出的选项仍沿用该 profile 的默认值。完整选项见 [Cargo profiles 文档](https://doc.rust-lang.org/cargo/reference/profiles.html)。

## 2. 发布库到 crates.io

### 文档既是说明，也是测试

- 用 `///` 为紧随其后的公开项编写文档；Markdown 会由 `rustdoc` 渲染为 HTML。
- 用 `//!` 为**所在模块或 crate** 编写总览文档，通常放在 `src/lib.rs` 或模块文件顶部。
- `cargo doc` 生成文档；`cargo doc --open` 会生成并在浏览器中打开。
- 文档中的 Rust 代码示例会被 `cargo test` 执行（doc test），所以示例不会悄悄过期。

```rust
/// 将输入值加一。
///
/// # Examples
/// ```
/// assert_eq!(6, my_crate::add_one(5));
/// ```
pub fn add_one(x: i32) -> i32 {
    x + 1
}
```

常见的文档小节包括 `# Examples`、`# Panics`、`# Errors` 和 `# Safety`；其中 `unsafe` 函数应明确调用方必须保持哪些不变量。

### 用 `pub use` 设计面向用户的 API

内部模块层级适合维护，不一定适合使用者。可以保留内部结构，再将关键类型和函数重新导出到更短、更稳定的路径：

```rust
// src/lib.rs
pub use self::kinds::{PrimaryColor, SecondaryColor};
pub use self::utils::mix;
```

这样调用者可以写 `use art::{mix, PrimaryColor};`，而不必了解 `kinds`、`utils` 的内部组织。这个做法与 [[use-and-mod|模块导入和可见性]] 的机制相同，但目标是建立清晰的公共 API 边界。

### 发布前清单

1. 在 [crates.io](https://crates.io/) 登录并获取 API token，执行 `cargo login`。token 会保存在本机，应当像密码一样保密。
2. 在 `Cargo.toml` 的 `[package]` 中填写唯一名称、版本、描述和许可证：

```toml
[package]
name = "my_crate"
version = "0.1.0"
edition = "2024"
description = "A short description of this crate."
license = "MIT OR Apache-2.0"
```

3. 执行 `cargo publish` 上传。
4. 后续版本遵循 [语义化版本](https://semver.org/) 修改 `version`，再发布。

> [!warning] 发布是永久的
> crates.io 上已发布的版本不能覆盖或删除。发现版本有问题时可执行 `cargo yank --vers 1.0.1`，阻止新解析的依赖选中它；已有 `Cargo.lock` 的项目仍可继续构建。`cargo yank --vers 1.0.1 --undo` 可以撤销 yank。若误传了密钥，**yank 并不能移除泄漏内容**，必须立刻轮换该密钥。

## 3. 用 Workspace 管理多 crate 项目

workspace 是一组共同开发的 package，核心共享：

- 一个顶层 `Cargo.lock`：锁定并协调依赖版本；
- 一个顶层 `target/`：复用构建产物，避免重复编译。

```toml
# 顶层 Cargo.toml
[workspace]
resolver = "3"
members = ["app", "core"]
```

在 workspace 根目录中执行 `cargo new app` 或 `cargo new core --lib`，Cargo 会自动将新 package 加入 `members`。workspace 内 crate 仍须**显式**声明彼此依赖：

```toml
# app/Cargo.toml
[dependencies]
core = { path = "../core" }
```

常用操作：

```bash
cargo build             # 构建整个 workspace
cargo run -p app        # 运行指定 package
cargo test              # 测试全部成员
cargo test -p core      # 只测试指定成员
```

共享 lockfile 不等于自动拥有依赖：即使 `core` 使用了 `rand`，`app` 若要直接 `use rand`，也必须在自己的 `Cargo.toml` 声明它。兼容的版本要求会尽量被解析为同一个版本；不兼容时 Cargo 才会保留多个版本。

> [!note]
> workspace 中的 crate 是独立 package。发布时也要逐个发布，并以 `cargo publish -p crate_name` 指定目标。

## 4. 安装与扩展 Cargo

### `cargo install`：安装二进制 crate

`cargo install` 面向 Rust 开发工具，而非替代系统包管理器。它只能安装带有 binary target 的 package：

```bash
cargo install ripgrep
```

安装后的可执行文件通常在 `~/.cargo/bin`（使用 rustup 的默认配置下）；将该目录加入 `$PATH` 后即可直接运行 `rg` 等工具。

### 自定义子命令

Cargo 会把 `$PATH` 中形如 `cargo-foo` 的可执行文件识别为 `cargo foo`：

```bash
# PATH 中有 cargo-audit 时
cargo audit
```

因此可以通过 `cargo install` 安装生态工具，并获得与内置子命令一致的调用体验；`cargo --list` 会列出可用的自定义命令。

## 一页速记

| 需求 | 首选命令 / 机制 |
| --- | --- |
| 加快日常编译或调优产物 | `[profile.dev]` / `[profile.release]` |
| 生成、打开并校验 API 文档 | `cargo doc --open`、`cargo test` |
| 隐藏模块细节，简化用户导入路径 | `pub use` |
| 发布库 | `cargo login` → 完善 package metadata → `cargo publish` |
| 撤回有问题的已发布版本 | `cargo yank --vers <version>` |
| 管理多个相互协作的 crate | 顶层 `[workspace]` + `members` |
| 构建、测试或运行某个成员 | `-p <package>` |
| 安装 Rust CLI 工具 | `cargo install <crate>` |
| 扩展 Cargo 命令 | 在 `$PATH` 中提供 `cargo-<name>` |

## 参考

- [The Rust Programming Language — More About Cargo](https://doc.rust-lang.org/book/ch14-00-more-about-cargo.html)
- [Cargo Book](https://doc.rust-lang.org/cargo/)
