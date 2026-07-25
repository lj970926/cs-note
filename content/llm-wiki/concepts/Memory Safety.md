---
title: Memory Safety
description: 程序访问内存时不会出现越界、use-after-free 等未定义行为的性质
date: 2026-07-25
tags: [concept, cpp, security, debugging]
aliases: []
---

# Memory Safety

## Definition

内存安全是指程序在访问内存时不会出现越界读写、使用已释放内存、重复释放、访问未初始化内存等未定义行为。内存安全 bug 是 C/C++ 程序中崩溃和安全漏洞的主要来源。

## Common bugs

- 缓冲区溢出（heap/stack/global）
- use-after-free
- double-free
- 未初始化内存读取
- 空指针解引用

## Mitigation

- 静态分析、动态检测工具（[[entities/AddressSanitizer|ASan]]、MSan、Valgrind）
- 安全语言（Rust、Java、Go 等）
- 编码规范和代码审查

## Related concepts

- [[entities/AddressSanitizer|AddressSanitizer]]
- [[concepts/Sanitizer|Sanitizer]]
- [[concepts/Thread Safety|Thread Safety]]

## Sources

- [[sources/src-addresssanitizer-guide|src-addresssanitizer-guide]]
