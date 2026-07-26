---
title: CRTP
description: Curiously Recurring Template Pattern 笔记摘要
source_type: note
local_ref: "[[language/C++/CRTP(将子类作为父类模板)]]"
date: 2026-07-25
tags: [source, cpp, template-metaprogramming, design-pattern]
aliases: []
---

# CRTP

> Source: [[language/C++/CRTP(将子类作为父类模板)]]

## One-line summary

**CRTP（Curiously Recurring Template Pattern）** 是一种 C++ 模板惯用法：子类将自身作为模板参数传给基类，从而在编译期实现静态多态。

## Key claims

- 基类通过 `static_cast<Derived*>(this)` 调用派生类方法，避免虚函数表开销。
- 本质是**编译期多态**（静态多态），所有绑定在编译期解析。
- 常见用途：
  - 静态多态（替代虚函数）
  - Mixin 组合
  - 对象计数器、访问者模式等模板元编程技巧

## Related pages

- [[concepts/CRTP|CRTP]]
- [[concepts/Static Polymorphism|Static Polymorphism]]
- [[language/C++/integral_constant]]

## Code snippet

```cpp
template <typename Derived>
class Base {
    void foo() {
        static_cast<Derived*>(this)->bar(); // 调用子类方法
    }
};

class MyClass : public Base<MyClass> {
    void bar() { /* ... */ }
};
```
