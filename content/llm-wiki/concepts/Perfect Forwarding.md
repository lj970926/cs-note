---
title: Perfect Forwarding
description: 在函数模板中保持参数原始左值/右值属性传递给另一个函数
date: 2026-07-25
tags: [concept, cpp, templates]
aliases: []
---

# Perfect Forwarding

## Definition

完美转发（Perfect Forwarding）是指在函数模板中把参数传递给另一个函数时，保持其原始的左值/右值属性。实现依赖转发引用 + `std::forward<T>` + 引用折叠。

## Example

```cpp
template<class T>
void wrapper(T&& x) {
    real_func(std::forward<T>(x));
}

int a = 1;
wrapper(a); // 调用 real_func(int&)
wrapper(1); // 调用 real_func(int&&)
```

## Key point

函数参数 `x` 即使有名字、类型是 `T&&`，在函数内部表达式 `x` 也是左值。必须用 `std::forward<T>(x)` 才能恢复其原始值类别。

## Related concepts

- [[concepts/Forwarding Reference|Forwarding Reference]]
- [[concepts/Reference Collapsing|Reference Collapsing]]
- [[concepts/Value Category|Value Category]]

## Sources

- [[sources/src-cpp-forwarding-reference|src-cpp-forwarding-reference]]
