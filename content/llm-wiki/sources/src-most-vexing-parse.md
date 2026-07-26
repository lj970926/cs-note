---
title: Most vexing parse
description: C++ Most Vexing Parse 笔记摘要
source_type: note
local_ref: "[[language/C++/Most vexing parse]]"
date: 2026-07-25
tags: [source, cpp, parsing]
aliases: []
---

# Most vexing parse

> Source: [[language/C++/Most vexing parse]]

## One-line summary

**Most vexing parse** 是 C++ 中一种语法歧义：看起来像对象初始化的表达式，被编译器解析为函数声明。

## Key claims

- 典型形式：`TimeKeeper time_keeper(Timer());` 不会被解释为创建 `TimeKeeper` 对象，而是声明一个名为 `time_keeper` 的函数。
- 根本原因是 C++ 语法允许函数参数使用括号包裹的标识符，导致带临时对象的初始化与函数声明冲突时，优先按函数声明解析。
- 解决方案：使用花括号初始化 `{}` 或额外括号消除歧义。

## Related pages

- [[concepts/Most Vexing Parse|Most Vexing Parse]]
- [[concepts/Value Category|Value Category]]

## Reference

- [Wikipedia — Most vexing parse](https://en.wikipedia.org/wiki/Most_vexing_parse)
- [cppreference — Direct initialization](https://en.cppreference.com/w/cpp/language/direct_initialization)
