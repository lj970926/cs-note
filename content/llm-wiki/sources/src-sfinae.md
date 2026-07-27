---
title: SFINAE
description: cppreference 关于 SFINAE（替换失败不是错误）的参考页摘要
source_type: web
source_url: https://en.cppreference.com/w/cpp/language/sfinae.html
accessed: 2026-07-27
date: 2026-07-27
tags: [source, cpp, template-metaprogramming]
aliases: []
---

# SFINAE

> Source: <https://en.cppreference.com/w/cpp/language/sfinae.html>

## One-line summary

SFINAE（Substitution Failure Is Not An Error）：函数模板重载决议中，模板参数替换失败的候选会被静默剔除而非报错。

## Key claims

- 替换发生在函数模板的**直接上下文**（模板参数、函数签名、返回类型、自 C++11 起的默认模板参数等）中；替换失败只把该候选移出重载集合。
- 替换成功后，在函数体或进一步的模板实例化中出错仍是**硬错误**（hard error），SFINAE 不提供保护。
- `std::enable_if`（C++11）是 SFINAE 最常见的应用：条件不满足时制造无效类型，从而按条件启用/禁用重载。
- C++20 的 constraints / concepts 提供了更直观的替代，但底层精神与 SFINAE 一脉相承。

## Related pages

- [[concepts/SFINAE|SFINAE]]
- [[concepts/Integral Constant|Integral Constant]]
- [[concepts/Template Metaprogramming|Template Metaprogramming]]

## Reference

- [cppreference — SFINAE](https://en.cppreference.com/w/cpp/language/sfinae.html)
- [cppreference — std::enable_if](https://en.cppreference.com/w/cpp/types/enable_if.html)
