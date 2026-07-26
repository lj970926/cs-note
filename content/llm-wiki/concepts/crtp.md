---
title: CRTP
description: C++ 中通过模板继承实现静态多态的惯用法
date: 2026-07-25
tags: [concept, cpp, template-metaprogramming, design-pattern]
aliases: [Curiously Recurring Template Pattern]
---

# CRTP

## Definition

**CRTP（Curiously Recurring Template Pattern，奇异递归模板模式）** 是 C++ 中一种利用模板参数传递派生类类型、在基类中通过 `static_cast` 调用派生类接口的惯用法。它可以在编译期实现多态行为，而无需虚函数和运行时动态分派。

## Key properties

- **静态多态**：方法调用在编译期绑定，没有虚函数开销。
- **侵入性较小**：派生类只需继承 `Base<Derived>`，并按约定实现接口。
- **编译期信息可用**：基类知道派生类的完整类型，可用来实现计数器、访问者、策略注入等。

## Common use cases

1. **替代虚函数**：需要多态接口但性能敏感的场景。
2. **Mixin**：通过继承多个轻量基类组合功能。
3. **对象计数**：基类模板为每个 `Derived` 类型维护独立计数。
4. **表达式模板 / 访问者模式**：利用派生类类型做编译期分发。

## Trade-offs

| 优点 | 缺点 |
|------|------|
| 无运行时虚函数开销 | 无法运行时动态替换实现 |
| 编译期内联优化更彻底 | 派生类与基类耦合更紧 |
| 类型信息在编译期可用 | 接口约定靠文档/命名约束 |

## Related concepts

- [[concepts/Static Polymorphism|Static Polymorphism]] — 编译期实现的多态
- [[concepts/Mixin|Mixin]] — 通过继承组合可复用功能单元
- [[concepts/Template Metaprogramming|Template Metaprogramming]] — C++ 模板在编译期进行计算和分派
- [[concepts/Value Category|Value Category]] — 与完美转发、类型推导相关

## Sources

- [[sources/src-crtp|src-crtp]]
- [[language/C++/integral_constant]]
