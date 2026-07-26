---
title: "Google Test"
description: 在 CMake 项目中集成 Google Test 的笔记摘要
source_type: note
local_ref: "[[language/CMake/Google Test]]"
date: 2026-07-25
tags: [source, cmake, cpp, testing]
aliases: []
---

# Google Test

> Source: [[language/CMake/Google Test]]

## One-line summary

在 CMake 项目中集成 Google Test（gtest/gmock）进行单元测试的常见做法与注意事项。

## Key claims

- Google Test 是 C++ 最常用的单元测试框架之一，提供断言、测试夹具、参数化测试、死亡测试等功能。
- 在 CMake 中通常通过 `find_package(GTest)` 或 `FetchContent` 引入。
- 使用 `enable_testing()` 和 `add_test()` 将测试目标注册到 CTest。
- 推荐将测试代码组织为独立可执行目标，链接 `GTest::gtest` / `GTest::gmock`。

## Related pages

- [[concepts/Google Test|Google Test]]
- [[concepts/CMake Dependency Management|CMake Dependency Management]]
- [[sources/src-cmake-using-dependencies|src-cmake-using-dependencies]]

## Reference

- [CMake 4: Test with Google Test — 西伯尔的博客](https://blog.xizhibei.me/2020/04/05/cmake-4-test-with-google-test/)
- [GoogleTest User's Guide](https://google.github.io/googletest/)
