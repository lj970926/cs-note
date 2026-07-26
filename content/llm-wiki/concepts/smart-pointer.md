---
title: Smart Pointer
description: 封装裸指针、自动管理生命周期的 C++ 指针类型
date: 2026-07-25
tags: [concept, cpp, memory-management, raii]
aliases: []
---

# Smart Pointer

## Definition

**智能指针（Smart Pointer）** 是 C++ 中封装裸指针、在对象生命周期结束时自动释放资源的类模板。它们把资源所有权语义融入类型系统，是 RAII 思想在内存管理上的典型应用。

## Common types

| 类型 | 所有权语义 | 典型用途 |
|------|-----------|----------|
| `std::unique_ptr<T>` | 独占所有权 | 明确单一所有者，转移用 `std::move` |
| `std::shared_ptr<T>` | 共享所有权，引用计数 | 多个所有者共享同一对象 |
| `std::weak_ptr<T>` | 非拥有性弱引用 | 打破循环引用、观察对象是否存活 |
| `std::auto_ptr<T>`（C++17 移除） | 已废弃 | 不应使用 |

## Key trade-offs

- `unique_ptr` 零开销，不能复制，只能移动。
- `shared_ptr` 有引用计数开销，支持复制，但需要避免循环引用。
- `weak_ptr` 不增加引用计数，使用前需 `lock()` 提升为 `shared_ptr`。

## Related concepts

- [[concepts/enable_shared_from_this|enable_shared_from_this]] — 在对象内部安全获取 shared_ptr
- [[concepts/RAII|RAII]] — 资源获取即初始化
- [[concepts/Object Lifetime Management|Object Lifetime Management]] — 对象生命周期与线程安全

## Sources

- [[sources/src-enable-shared-from-this|src-enable-shared-from-this]]
