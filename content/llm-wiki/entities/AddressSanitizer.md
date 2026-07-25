---
title: AddressSanitizer
description: Clang/GCC 内置的内存错误检测工具（ASan）
date: 2026-07-25
tags: [entity, tool, cpp, sanitizer, debugging]
aliases: []
---

# AddressSanitizer

## Definition

AddressSanitizer（ASan）是 Clang 和 GCC 内置的内存错误检测器，通过编译期插桩和运行时 shadow memory 在程序触发内存错误时立即报告问题位置、分配位置和调用栈。

## What it detects

- 堆/栈/全局缓冲区溢出
- use-after-free / use-after-return / use-after-scope
- double-free / invalid-free
- 内存泄漏（通过 LeakSanitizer）

## What it does not detect

- 数据竞争（ThreadSanitizer）
- 未初始化内存读取（MemorySanitizer）
- 整数溢出等未定义行为（UndefinedBehaviorSanitizer）

## Related

- [[sources/src-addresssanitizer-guide|src-addresssanitizer-guide]]
- [[concepts/Sanitizer|Sanitizer]]
- [[concepts/Memory Safety|Memory Safety]]
