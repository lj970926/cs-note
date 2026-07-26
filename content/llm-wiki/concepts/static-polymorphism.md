---
title: Static Polymorphism
description: 在编译期而非运行期实现的多态行为
date: 2026-07-25
tags: [concept, cpp, template-metaprogramming, design-pattern]
aliases: []
---

# Static Polymorphism

## Definition

**静态多态（Static Polymorphism）** 是指在编译期完成类型选择和函数绑定的多态机制。与动态多态（虚函数、运行时类型识别）不同，静态多态没有运行时分派开销，所有决策在编译期确定。

## Common mechanisms

- **函数重载（Overloading）**：根据参数类型在编译期选择重载版本。
- **模板（Templates）**：根据实例化类型生成特定代码。
- **CRTP**：通过模板继承实现编译期接口分发。
- **策略模式（Policy-Based Design）**：用模板参数注入行为策略。

## Trade-offs

| 优点 | 缺点 |
|------|------|
| 无运行时开销 | 编译时间更长、二进制体积可能增大 |
| 可内联优化 | 无法运行时替换实现 |
| 类型错误在编译期暴露 | 错误信息可能复杂 |

## Related concepts

- [[concepts/CRTP|CRTP]] — C++ 静态多态的典型实现
- [[concepts/Template Metaprogramming|Template Metaprogramming]]
- [[concepts/Value Category|Value Category]]

## Sources

- [[sources/src-crtp|src-crtp]]
