---
title: CMake Compiler Detection
description: 在 CMake 中识别 C/C++ 编译器类型与版本的方法
date: 2026-07-25
tags: [concept, cmake, cpp]
aliases: []
---

# CMake Compiler Detection

## Definition

**CMake Compiler Detection** 指在 CMake 配置阶段识别当前使用的 C/C++ 编译器类型与版本，从而有条件地设置编译选项、特性开关或依赖查找策略。

## Key variables

| 变量 | 含义 |
|------|------|
| `CMAKE_CXX_COMPILER_ID` | 编译器标识字符串，如 `GNU`、`Clang`、`AppleClang`、`MSVC` |
| `CMAKE_CXX_COMPILER_VERSION` | 编译器版本号字符串 |

这些变量在 `project()` 调用之后才可安全使用。

## Common compiler IDs

- `GNU`：GCC / G++
- `Clang`：LLVM Clang（非 Apple 分发）
- `AppleClang`：Apple 分发的 Clang
- `MSVC`：Microsoft Visual C++

## Examples

```cmake
# 同时匹配 Clang 与 AppleClang
if(CMAKE_CXX_COMPILER_ID MATCHES "Clang")
    target_compile_options(my_app PRIVATE -Wall -Wextra)
endif()

# 精确区分 AppleClang
if(CMAKE_CXX_COMPILER_ID STREQUAL "AppleClang")
    message(STATUS "Using Apple Clang")
endif()

# 版本判断
if(CMAKE_CXX_COMPILER_ID STREQUAL "GNU" AND
   CMAKE_CXX_COMPILER_VERSION VERSION_GREATER_EQUAL "12.0")
    message(STATUS "GCC 12+")
endif()
```

## Notes

- `MATCHES` 使用正则匹配，`"Clang"` 能同时命中 `Clang` 与 `AppleClang`。
- `STREQUAL` 是精确字符串匹配。
- 条件编译选项推荐通过 `target_compile_options` 施加到具体目标，而非全局 `add_compile_options`。

## Related concepts

- [[concepts/CMake Dependency Management|CMake Dependency Management]] — 在 CMake 中管理依赖
- [[concepts/Build System|Build System]] — 编译、链接、测试等构建流程的自动化工具

## Sources

- [[sources/src-cmake-compiler-detection|src-cmake-compiler-detection]]
