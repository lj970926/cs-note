---
title: enable_shared_from_this
description: C++ enable_shared_from_this 笔记摘要
source_type: note
local_ref: "[[language/C++/enable_shared_from_this]]"
date: 2026-07-25
tags: [source, cpp, smart-pointer, memory-management]
aliases: []
---

# enable_shared_from_this

> Source: [[language/C++/enable_shared_from_this]]

## One-line summary

`std::enable_shared_from_this` 允许被 `std::shared_ptr` 管理的对象在内部安全地获取一个与现有管理者共享引用计数的 `std::shared_ptr`。

## Key claims

- 直接在成员函数里用 `std::shared_ptr<T>(this)` 会创建独立的引用计数，可能在该对象已被 `shared_ptr` 管理时导致重复释放或悬空引用。
- 继承 `std::enable_shared_from_this<Derived>` 后，可调用 `shared_from_this()` 返回与外部管理者共享引用计数的 `shared_ptr`。
- 实现要点：基类中保存一个 `weak_ptr`；当 `shared_ptr` 首次接管对象时，会把自身的控制块信息写回该 `weak_ptr`。

## Related pages

- [[concepts/enable_shared_from_this|enable_shared_from_this]]
- [[concepts/Smart Pointer|Smart Pointer]]
- [[language/C++/intrusive_ptr]]
- [[language/C++/SCOPE_EXIT]]

## References

1. [知乎 — C++ enable_shared_from_this](https://zhuanlan.zhihu.com/p/393571228)
2. [cppreference — std::enable_shared_from_this](https://en.cppreference.com/w/cpp/memory/enable_shared_from_this.html)
3. [enbale-shared-from-this 实现分析](https://blog.guorongfei.com/2017/01/25/enbale-shared-from-this-implementaion/)
