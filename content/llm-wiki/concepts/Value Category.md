---
title: Value Category
description: C++ 中表达式的左值/右值分类
date: 2026-07-25
tags: [concept, cpp]
aliases: []
---

# Value Category

## Definition

值类别（Value Category）是 C++ 对每个表达式的分类，决定它能绑定到哪种引用、能否被移动等。最基本的两类是左值（lvalue）和右值（rvalue）。

## Lvalue

- 有名字、可取地址
- 可以出现在赋值号左边
- 例如：变量名、返回左值引用的函数调用、解引用结果

## Rvalue

- 临时对象、字面量、返回非引用的函数调用
- 不能取地址（通常）
- 可以被移动语义"窃取"资源

## Why it matters

模板推导和重载决议依赖表达式的值类别，而非变量声明类型。例如变量 `a` 声明为 `int`，但表达式 `a` 是左值。

## Related concepts

- [[concepts/Forwarding Reference|Forwarding Reference]]
- [[concepts/Perfect Forwarding|Perfect Forwarding]]
- [[concepts/Reference Collapsing|Reference Collapsing]]

## Sources

- [[sources/src-cpp-forwarding-reference|src-cpp-forwarding-reference]]
