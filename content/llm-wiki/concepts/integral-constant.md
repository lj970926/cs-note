---
title: Integral Constant
description: C++ 中把编译期常量及其类型信息封装成类型的模板元编程工具
date: 2026-07-25
tags: [concept, cpp, template-metaprogramming]
aliases: []
---

# Integral Constant

## Definition

**Integral Constant** 是 C++ 标准库中 `std::integral_constant<T, v>` 所表达的概念：把一个编译期常量值 `v` 连同其类型 `T` 一起封装成一个类型。这样，数值信息就可以在模板元编程中作为类型参与重载、特化和 SFINAE。

## Key properties

- 把**值**提升为**类型**，实现编译期计算。
- 提供 `value` 静态成员访问底层常量。
- `std::true_type` 与 `std::false_type` 是最常用的特化：
  - `std::true_type` 等价于 `std::integral_constant<bool, true>`
  - `std::false_type` 等价于 `std::integral_constant<bool, false>`

## Common usage

- 类型特征（type traits）返回真假或整数结果，例如 `std::is_integral<T>::value`。
- 编译期分支：通过重载或偏特化接受 `std::true_type` / `std::false_type` 的函数/类模板。
- 与 `std::conditional`、`std::enable_if` 等配合实现条件类型选择。

## Example

```cpp
template <typename T>
void foo_impl(T x, std::true_type)  { /* T 是整型 */ }

template <typename T>
void foo_impl(T x, std::false_type) { /* T 不是整型 */ }

template <typename T>
void foo(T x) {
    foo_impl(x, std::is_integral<T>{});
}
```

## Related concepts

- [[concepts/Template Metaprogramming|Template Metaprogramming]] — 编译期利用模板进行计算和分派
- [[concepts/SFINAE|SFINAE]] — 替换失败不是错误
- [[concepts/Type Traits|Type Traits]] — 在编译期查询类型属性的工具
- [[concepts/CRTP|CRTP]] — 与模板元编程配合的静态多态惯用法

## Sources

- [[sources/src-integral-constant|src-integral-constant]]
