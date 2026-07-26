---
title: "Makefile"
description: Makefile 特殊变量与基本规则笔记摘要
source_type: note
local_ref: "[[language/Makefile]]"
date: 2026-07-25
tags: [source, makefile, build-system]
aliases: []
---

# Makefile

> Source: [[language/Makefile]]

## One-line summary

Makefile 是 GNU Make 使用的构建规则文件，通过目标（target）、依赖（prerequisite）和配方（recipe）描述如何生成产物。

## Key claims

- 规则格式：`target: prerequisites \n\trecipe`。
- 常用自动变量：
  - `$@`：当前目标名
  - `$?`：比目标新的所有依赖
  - `$^`：所有依赖（去重）
  - `$<`：第一个依赖
- Make 通过比较目标与依赖的时间戳决定是否执行配方。

## Related pages

- [[concepts/Makefile|Makefile]]
- [[concepts/Build System|Build System]]
- [[language/Makefile tutorial]]
- [[language/CMake/General Rules for Using Depencies]]

## Reference

- [GNU Make Manual](https://www.gnu.org/software/make/manual/)
- [Makefile tutorial — makefiles.io](https://makefiletutorial.com/)
