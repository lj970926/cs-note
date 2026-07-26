---
title: Google Test
description: C++ 主流单元测试框架及其在 CMake 中的集成方式
date: 2026-07-25
tags: [concept, cpp, testing, cmake]
aliases: [gtest]
---

# Google Test

## Definition

**Google Test**（常简写为 **gtest**）是 Google 开源的 C++ 单元测试框架， accompanying 的 **Google Mock**（gmock）提供打桩与 Mock 能力。它是 C++ 生态中最常用的测试框架之一。

## Core features

- **断言宏**：`ASSERT_EQ`、`EXPECT_TRUE`、`EXPECT_THROW` 等，区分致命与非致命失败。
- **测试夹具（Test Fixture）**：通过继承 `::testing::Test` 在多个测试间共享准备/清理逻辑。
- **参数化测试**：`TEST_P` + `INSTANTIATE_TEST_SUITE_P` 用多组参数运行同一测试逻辑。
- **死亡测试**：`EXPECT_DEATH` 验证程序在特定条件下会退出。
- **Mock**：`gmock` 用 `MOCK_METHOD` 定义可预期调用的虚接口实现。

## CMake integration

```cmake
enable_testing()
find_package(GTest REQUIRED)

add_executable(my_test test.cpp)
target_link_libraries(my_test PRIVATE GTest::gtest_main)

add_test(NAME my_test COMMAND my_test)
```

或使用 `FetchContent` 在构建时拉取源码：

```cmake
include(FetchContent)
FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG        v1.14.0
)
FetchContent_MakeAvailable(googletest)
```

## Best practices

- 测试目标独立，便于并行执行和选择性运行。
- 优先使用 `EXPECT_*` 让单条测试暴露更多失败点；只有无法继续时才用 `ASSERT_*`。
- 用 `TYPED_TEST` 或参数化测试覆盖模板/多种输入。

## Related concepts

- [[concepts/CMake Dependency Management|CMake Dependency Management]] — 在 CMake 中引入 gtest 的方式
- [[concepts/Unit Testing|Unit Testing]] — 最小可测试单元的验证方法
- [[concepts/Test-Driven Development|Test-Driven Development]] — 以测试驱动设计的方法

## Sources

- [[sources/src-cmake-google-test|src-cmake-google-test]]
