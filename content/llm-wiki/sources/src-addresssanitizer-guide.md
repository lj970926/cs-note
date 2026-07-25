---
title: "src-addresssanitizer-guide"
description: "AddressSanitizer (ASan) 使用指南摘要"
date: 2026-07-25
tags: [source, cpp, debugging, sanitizer]
source_type: note
local_ref: "[[language/C++/AddressSanitizer (ASan) 使用指南]]"
aliases: []
---

# src-addresssanitizer-guide

## One-line summary

[[entities/AddressSanitizer|AddressSanitizer]] 是 Clang/GCC 内置的内存错误检测器，编译时加 `-fsanitize=address -g`，运行时能在越界、UAF、double-free 等错误发生点精确定位问题。

## Source

- Vault note: [[language/C++/AddressSanitizer (ASan) 使用指南]]

## Key claims

1. ASan 通过编译期插桩 + 运行时库检测堆/栈/全局缓冲区溢出、use-after-free、double-free、内存泄漏等。
2. 不检测数据竞争（TSan）、未初始化内存读取（MSan）、整数溢出/UB（UBSan）。
3. 推荐编译选项：`-fsanitize=address -g -O1 -fno-omit-frame-pointer`。
4. 报错核心是三段式：出错点 → 释放点 → 分配点。
5. ASan 和 TSan 不能同时开启；ASan 可与 UBSan 组合。
6. 性能开销约 2 倍运行时间和 2~3 倍内存，不适合生产环境。

## Linked pages

- [[entities/AddressSanitizer|AddressSanitizer]]
- [[concepts/Memory Safety|Memory Safety]]
- [[concepts/Sanitizer|Sanitizer]]
- [[concepts/Thread Safety|Thread Safety]]
- [[编译相关/GCC Warning Options]] — vault 原笔记
