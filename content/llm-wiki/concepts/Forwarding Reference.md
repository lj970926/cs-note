---
title: Forwarding Reference
description: C++ 模板中既能接收左值又能接收右值的特殊引用
date: 2026-07-25
tags: [concept, cpp, templates]
aliases: []
---

# Forwarding Reference

## Definition

转发引用（Forwarding Reference）是 C++ 模板中形如 `T&&` 的参数，其中 `T` 是需要被推导的模板参数。它能同时接收左值和右值，是完美转发的基础。

## Deduction rules

| 实参 | `T` 推导为 | 参数实际类型 |
|---|---|---|
| 左值 | `T&` | `T&`（经引用折叠） |
| 右值 | `T` | `T&&` |

## Important caveat

手动显式指定模板参数（如 `f<int>(a)`）会禁用转发引用的特殊推导，参数变成普通右值引用 `int&&`，左值无法绑定。

## Related concepts

- [[concepts/Reference Collapsing|Reference Collapsing]]
- [[concepts/Perfect Forwarding|Perfect Forwarding]]
- [[concepts/Value Category|Value Category]]

## Sources

- [[sources/src-cpp-forwarding-reference|src-cpp-forwarding-reference]]
