---
title: ODR
description: C++ 的 One Definition Rule，规定实体在整个程序中只能被定义一次
date: 2026-07-25
tags: [concept, cpp]
aliases: []
---

# ODR

## Definition

ODR（One Definition Rule，单一定义规则）是 C++ 的基本规则之一：任何变量、函数、类、枚举或模板在程序中只能有一个定义。违反 ODR 会导致未定义行为，通常表现为链接错误。

## Exceptions

- **Inline functions/variables**（C++17 起）：可以在多个翻译单元中定义，只要定义完全相同，链接器会合并为一份实例。
- **Templates**：可以在多个翻译单元中定义。
- **ODR-used**：只有被 ODR 使用的实体才必须有定义。

## Related concepts

- [[concepts/Inline Variable|Inline Variable]]
- [[sources/src-cpp17-inline-static|src-cpp17-inline-static]]
