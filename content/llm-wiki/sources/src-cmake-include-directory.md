---
title: "include directory"
description: CMake 中设置头文件搜索路径的笔记摘要
source_type: note
local_ref: "[[language/CMake/include directory]]"
date: 2026-07-25
tags: [source, cmake, build-system]
aliases: []
---

# include directory

> Source: [[language/CMake/include directory]]

## One-line summary

CMake 中设置 C/C++ 头文件搜索路径的两种主要方式：全局的 `include_directories` 与目标级推荐的 `target_include_directories`。

## Key claims

- `include_directories(...)` 全局生效，会影响当前目录及子目录的所有目标，不推荐现代 CMake 使用。
- `target_include_directories(target PRIVATE/PUBLIC/INTERFACE ...)` 仅作用于指定目标，支持传递性控制，是现代 CMake 推荐做法。
- 常用路径变量：
  - `${CMAKE_SOURCE_DIR}`：最顶层 `CMakeLists.txt` 所在目录
  - `${CMAKE_CURRENT_SOURCE_DIR}`：当前 `CMakeLists.txt` 所在目录
  - `${PROJECT_SOURCE_DIR}`：`project()` 命令所在目录

## Related pages

- [[concepts/CMake Dependency Management|CMake Dependency Management]]
- [[sources/src-cmake-using-dependencies|src-cmake-using-dependencies]]

## Reference

- [cmake-language(7) — include_directories](https://cmake.org/cmake/help/latest/command/include_directories.html)
- [cmake-language(7) — target_include_directories](https://cmake.org/cmake/help/latest/command/target_include_directories.html)
