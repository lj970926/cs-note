---
title: SFINAE
description: C++ 模板规则——替换失败不是错误，失败的候选从重载集合中被静默剔除
date: 2026-07-27
tags: [concept, cpp, template-metaprogramming]
aliases: []
---

# SFINAE

## Definition

**SFINAE**（Substitution Failure Is Not An Error，替换失败不是错误）是 C++ 函数模板重载决议的一条规则：当编译器为候选模板做模板参数替换时，如果替换结果无效（例如 `T::foo` 中的 `T` 没有成员 `foo`），编译器**不报错**，而是把该候选从重载集合中静默剔除，继续考虑其余候选。只有所有候选都失败时才是编译错误。[[sources/src-sfinae|src-sfinae]]

读法：英语社区通常当作单词念 **"sfin-ay"** /ˈsfɪneɪ/（近似"斯菲内"），也有人逐字母念 S-F-I-N-A-E。

## Key properties

- 只保护**替换阶段**（模板参数、函数签名、返回类型等直接上下文）；替换成功后，函数体或更深层的模板实例化出错仍是硬错误。
- 使得"编译期按类型条件分支"成为可能：靠制造无效类型来启用/禁用重载。
- 典型工具是 `std::enable_if`（C++11）：条件不满足时展开为无效类型，触发 SFINAE 剔除该重载。[[sources/src-sfinae|src-sfinae]]
- C++20 的 `requires` / concepts 在多数场景下是更直观的替代，但 SFINAE 仍是底层机制，且广泛存在于旧代码库。

## Example

```cpp
#include <type_traits>
#include <iostream>

// 版本 1：只对整数类型启用
template <typename T>
std::enable_if_t<std::is_integral_v<T>, void>
print_kind(T) { std::cout << "整数\n"; }

// 版本 2：只对浮点类型启用
template <typename T>
std::enable_if_t<std::is_floating_point_v<T>, void>
print_kind(T) { std::cout << "浮点\n"; }

int main() {
    print_kind(42);    // 版本 2 替换失败 → 被剔除，选版本 1
    print_kind(3.14);  // 版本 1 被剔除，选版本 2
}
```

## Related concepts

- [[concepts/Integral Constant|Integral Constant]] — 常与 `enable_if` 配合，把编译期布尔值编码成类型
- [[concepts/Template Metaprogramming|Template Metaprogramming]] — SFINAE 所属的编译期编程范式
- [[concepts/Type Traits|Type Traits]] — 提供 `std::is_integral` 等条件，供 SFINAE 判断
- [[concepts/CRTP|CRTP]] — 同属模板静态多态的惯用法

## Sources

- [[sources/src-sfinae|src-sfinae]]
- [[sources/src-integral-constant|src-integral-constant]] — 首次提及 SFINAE 的入口页
