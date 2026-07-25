---
title: Reference Collapsing
description: C++ 中多个引用限定符组合时折叠为单一引用类型的规则
date: 2026-07-25
tags: [concept, cpp, templates]
aliases: []
---

# Reference Collapsing

## Definition

引用折叠（Reference Collapsing）是 C++ 中当多个引用限定符组合在一起时，将它们折叠为单一引用类型的规则。常见于模板推导和 typedef/using 别名中。

## Rules

```cpp
T&  &  -> T&
T&  && -> T&
T&& &  -> T&
T&& && -> T&&
```

记忆口诀：**只要有一个 `&`，结果就是左值引用；只有两个 `&&` 才是右值引用。**

## Why it matters

转发引用 `T&&` 在 `T` 被推导为 `T&` 时，会形成 `T& &&`，引用折叠后变成 `T&`，从而能绑定左值。

## Related concepts

- [[concepts/Forwarding Reference|Forwarding Reference]]
- [[concepts/Perfect Forwarding|Perfect Forwarding]]

## Sources

- [[sources/src-cpp-forwarding-reference|src-cpp-forwarding-reference]]
