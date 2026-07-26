---
title: "判断编译器类型"
description: CMake 中通过 CMAKE_CXX_COMPILER_ID 判断编译器类型与版本的笔记摘要
source_type: note
local_ref: "[[language/CMake/判断编译器类型]]"
date: 2026-07-25
tags: [source, cmake, cpp]
aliases: []
---

# 判断编译器类型

> Source: [[language/CMake/判断编译器类型]]

## One-line summary

CMake 通过 `CMAKE_CXX_COMPILER_ID` 和 `CMAKE_CXX_COMPILER_VERSION` 在 `project()` 调用后识别当前 C++ 编译器类型与版本。

## Key claims

- `CMAKE_CXX_COMPILER_ID` 常见取值：`Clang`、`AppleClang`、`GNU`、`MSVC`。
- `MATCHES "Clang"` 可同时匹配 Clang 与 AppleClang；`STREQUAL` 为精确匹配。
- `CMAKE_CXX_COMPILER_VERSION` 配合 `VERSION_GREATER_EQUAL` 等比较运算符可做版本判断。
- 所有判断应在 `project()` 之后使用。

## Related pages

- [[concepts/CMake Compiler Detection|CMake Compiler Detection]]
- [[concepts/CMake Dependency Management|CMake Dependency Management]]

## Reference

- [CMake — CMAKE_CXX_COMPILER_ID](https://cmake.org/cmake/help/latest/variable/CMAKE_CXX_COMPILER_ID.html)
