---
title: "src-cpp-forwarding-reference"
description: "C++ 转发引用、引用折叠与 make_pair 报错理解摘要"
date: 2026-07-25
tags: [source, cpp, templates, forwarding-reference]
source_type: note
local_ref: "[[language/C++/C++ 转发引用、引用折叠与 make_pair报错理解]]"
aliases: []
---

# src-cpp-forwarding-reference

## One-line summary

[[concepts/Forwarding Reference|转发引用]] `T&&` 在模板推导时会根据实参是左值还是右值把 `T` 推导为 `T&` 或 `T`；配合 [[concepts/Reference Collapsing|引用折叠]] 和 `std::forward<T>` 实现 [[concepts/Perfect Forwarding|完美转发]]。

## Source

- Vault note: [[language/C++/C++ 转发引用、引用折叠与 make_pair报错理解]]

## Key claims

1. 转发引用的形式是 `template<class T> void f(T&& x)`，且 `T` 必须参与推导。
2. 传左值时 `T` 推导为 `T&`，`T&&` 经引用折叠后变成 `T&`；传右值时 `T` 推导为 `T`，`T&&` 保持为右值引用。
3. 手动显式指定模板参数（如 `make_pair<int, int>`）会破坏转发引用推导，导致左值无法绑定到 `int&&`。
4. `std::forward<T>(x)` 保持原始值类别；`std::move(x)` 无条件转为右值。
5. 推荐用 `emplace_back` 替代 `make_pair` + `push_back`。

## Linked pages

- [[concepts/Forwarding Reference|Forwarding Reference]]
- [[concepts/Reference Collapsing|Reference Collapsing]]
- [[concepts/Perfect Forwarding|Perfect Forwarding]]
- [[concepts/Value Category|Value Category]]
