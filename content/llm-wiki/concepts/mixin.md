---
title: Mixin
description: 通过继承组合可复用功能单元的设计方式
date: 2026-07-25
tags: [concept, design-pattern, cpp]
aliases: []
---

# Mixin

## Definition

**Mixin** 是一种通过将小型、单一职责的功能类组合到目标类中，以复用行为而非建立深层继承层次的设计方式。Mixin 通常不单独实例化，而是作为“可插入能力”被其他类继承或组合。

## In C++

C++ 中 Mixin 常通过模板和多重继承实现。CRTP 也是实现参数化 Mixin 的常见手段：

```cpp
template <typename Derived>
struct Comparable {
    bool operator!=(const Derived& other) const {
        return !static_cast<const Derived*>(this)->operator==(other);
    }
};
```

## Related concepts

- [[concepts/CRTP|CRTP]] — 实现编译期 Mixin 的常用模板惯用法
- [[concepts/Composition Over Inheritance|Composition Over Inheritance]]

## Sources

- [[sources/src-crtp|src-crtp]]
