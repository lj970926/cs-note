---
title: "General Rules for Using Dependencies"
description: CMake 使用依赖官方指南笔记摘要
source_type: note
local_ref: "[[language/CMake/General Rules for Using Depencies]]"
date: 2026-07-25
tags: [source, cmake, build-system]
aliases: []
---

# General Rules for Using Dependencies

> Source: [[language/CMake/General Rules for Using Depencies]]

## One-line summary

CMake 官方关于如何在项目中引入和管理外部依赖的指南，涵盖 `find_package`、导入目标、配置与构建时依赖等最佳实践。

## Key claims

- 现代 CMake 推荐通过**导入目标（imported targets）**使用依赖，而不是直接操作变量如 `<Pkg>_INCLUDE_DIRS`。
- `find_package()` 是定位外部库的主要入口。
- 依赖可分为构建时依赖、链接时依赖和运行时依赖；CMake 通过 `INTERFACE`、`PRIVATE`、`PUBLIC` 传递性控制链接与使用要求。
- 使用 `FetchContent` 或 `ExternalProject` 可以在构建时获取依赖源码。

## Related pages

- [[concepts/CMake Dependency Management|CMake Dependency Management]]
- [[language/CMake/include directory]]
- [[language/CMake/判断编译器类型]]
- [[language/Makefile]]

## Reference

- [CMake — Using Dependencies Guide](https://cmake.org/cmake/help/v3.31/guide/using-dependencies/index.html)
