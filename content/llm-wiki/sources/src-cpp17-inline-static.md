---
title: "src-cpp17-inline-static"
description: "C++17 inline static 成员变量笔记摘要"
date: 2026-07-25
tags: [source, cpp, c++17]
source_type: note
local_ref: "[[language/C++/C++17 inline static]]"
aliases: []
---

# src-cpp17-inline-static

## One-line summary

[[concepts/Inline Variable|C++17 inline static]] 允许在类内直接定义静态成员变量，实现 header-only 且避免 ODR 违规。

## Source

- Vault note: [[language/C++/C++17 inline static]]

## Key claims

1. C++17 起，`inline static` 成员变量可在类内直接初始化，声明即定义。
2. 不需要在 `.cpp` 中单独定义，适合 header-only 库。
3. `inline` 保证多个翻译单元中只有一份实例，不违反 ODR。

## Linked pages

- [[concepts/Inline Variable|Inline Variable]]
- [[concepts/ODR|ODR]]
