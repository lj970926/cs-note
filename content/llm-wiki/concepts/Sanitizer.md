---
title: Sanitizer
description: 编译器内置的动态程序正确性检测工具族
date: 2026-07-25
tags: [concept, cpp, debugging, tooling]
aliases: []
---

# Sanitizer

## Definition

Sanitizer 是 Clang/GCC 内置的一类动态检测工具，通过编译期插桩在运行时检测特定类型的 bug。它们通常以 `-fsanitize=...` 的形式开启。

## Common sanitizers

| 工具 | flag | 检测目标 |
|---|---|---|
| ASan | `-fsanitize=address` | 内存越界、UAF、double-free、泄漏 |
| TSan | `-fsanitize=thread` | 数据竞争、死锁 |
| UBSan | `-fsanitize=undefined` | 未定义行为 |
| MSan | `-fsanitize=memory` | 未初始化内存读取（仅 Clang） |

## Notes

- ASan 和 TSan 不能同时开启。
- ASan 可与 UBSan 组合使用。
- 适合开发和测试阶段，不适合生产环境。

## Related concepts

- [[entities/AddressSanitizer|AddressSanitizer]]
- [[concepts/Memory Safety|Memory Safety]]
- [[concepts/Thread Safety|Thread Safety]]

## Sources

- [[sources/src-addresssanitizer-guide|src-addresssanitizer-guide]]
