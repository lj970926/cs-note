---
title: integral_constant
description: C++ std::integral_constant 笔记摘要
source_type: note
local_ref: "[[language/C++/integral_constant]]"
date: 2026-07-25
tags: [source, cpp, template-metaprogramming]
aliases: []
---

# integral_constant

> Source: [[language/C++/integral_constant]]

## One-line summary

`std::integral_constant` 是 C++ 标准库中用于模板元编程的类型，用于封装一个编译期常量及其类型信息。

## Key claims

- 主要应用于模板元编程，把值提升为类型，使编译期计算和分派成为可能。
- `std::true_type` 和 `std::false_type` 是 `std::integral_constant<bool, true>` 与 `std::integral_constant<bool, false>` 的别名。
- 常与类型特征（type traits）结合，把布尔或整型结果编码到类型中。

## Related pages

- [[concepts/Integral Constant|Integral Constant]]
- [[concepts/Template Metaprogramming|Template Metaprogramming]]
- [[language/C++/CRTP]]

## Reference

- [cppreference — std::integral_constant](https://en.cppreference.com/w/cpp/types/integral_constant.html)
