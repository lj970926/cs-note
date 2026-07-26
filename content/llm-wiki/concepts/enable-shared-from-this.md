---
title: enable_shared_from_this
description: 在对象内部安全获取管理自身的 shared_ptr 的 C++ 机制
date: 2026-07-25
tags: [concept, cpp, smart-pointer, memory-management]
aliases: []
---

# enable_shared_from_this

## Definition

`std::enable_shared_from_this` 是 C++11 引入的一个模板基类。当某个类继承 `std::enable_shared_from_this<Derived>` 后，该类对象可通过 `shared_from_this()` 成员函数获取一个与当前管理该对象的 `std::shared_ptr` 共享引用计数的智能指针。

## Problem it solves

在类成员函数中直接写：

```cpp
std::shared_ptr<MyObject> GetSharedObject() {
    return std::shared_ptr<MyObject>(this);
}
```

会新建一个独立的引用计数块。如果对象本身已经被另一个 `shared_ptr` 管理，则会出现两个互不知情的引用计数，导致对象被重复释放或生命周期不可控。

## Usage

```cpp
class MyObject : public std::enable_shared_from_this<MyObject> {
public:
    std::shared_ptr<MyObject> GetSharedObject() {
        return shared_from_this();
    }
};
```

所有通过 `GetSharedObject()` 拿到的 `shared_ptr` 都与管理该对象的 `shared_ptr` 共享同一组引用计数。

## Implementation idea

- `enable_shared_from_this` 基类内部维护一个 `std::weak_ptr<Derived>`。
- 当 `std::shared_ptr` 首次构造或接管对象时，会检测对象是否继承自 `enable_shared_from_this`；如果是，就把控制块信息写入该 `weak_ptr`。
- `shared_from_this()` 调用时从 `weak_ptr` 提升出 `shared_ptr`；若对象尚未被 `shared_ptr` 管理，则抛出 `std::bad_weak_ptr`。

## Related concepts

- [[concepts/Smart Pointer|Smart Pointer]] — C++ 自动管理生命周期的指针封装
- [[concepts/Object Lifetime Management|Object Lifetime Management]] — 多线程环境下安全创建和销毁对象的问题
- [[concepts/RAII|RAII]] — 资源获取即初始化

## Sources

- [[sources/src-enable-shared-from-this|src-enable-shared-from-this]]
