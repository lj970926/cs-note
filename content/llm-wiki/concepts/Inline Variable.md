---
title: Inline Variable
description: C++17 引入的可在头文件中定义且不会引发重复定义的全局/静态变量
date: 2026-07-25
tags: [concept, cpp, c++17]
aliases: []
---

# Inline Variable

## Definition

Inline Variable 是 C++17 引入的特性，允许在头文件中定义全局变量或类的静态成员变量，并保证所有翻译单元中只存在一份实例，不会违反 One Definition Rule（ODR）。

## Syntax

```cpp
// 类内静态成员
class IOHandler {
    inline static IOHandler iohandler;
};

// 头文件中的全局 inline 变量
inline int global_counter = 0;
```

## Benefits

- 实现 header-only 库，无需单独的 `.cpp` 定义文件。
- 避免链接时的重复定义错误。
- 简化单例等模式的实现。

## Related concepts

- [[concepts/ODR|ODR]]
- [[sources/src-cpp17-inline-static|src-cpp17-inline-static]]
