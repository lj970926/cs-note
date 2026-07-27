---
title: "Source: Intel SDM"
source_type: web
source_url: https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html
local_ref: ""
local_raw: ""
accessed: 2026-07-26
ingested: 2026-07-26
tags: [source, x86, assembly, system-programming]
aliases: [Intel SDM, Intel 软件开发手册]
created: 2026-07-26
---

# Source: Intel SDM

## One-line summary

Intel® 64 and IA-32 Architectures Software Developer's Manual（Intel SDM）是 x86 / x86-64 架构最权威的官方参考手册，涵盖指令集、系统编程和 MSR，提供 Combined Volumes 单文件 PDF 下载。

## Key claims

- 手册分四卷，可按需查阅：
  - **Volume 1**：基础架构——寄存器、寻址模式、数据类型、中断异常概览。
  - **Volume 2 (A/B/C/D)**：指令集参考 A–Z，查单条指令的语义、flags 影响、异常用这本。
  - **Volume 3 (A/B/C/D)**：系统编程指南——分页、中断/异常、CR 寄存器、MSR、虚拟化（VMX）、TSX。
  - **Volume 4**：Model-Specific Registers（MSR）参考，按处理器型号索引。
- Intel SDM 只覆盖 Intel 处理器；AMD 处理器需对照 AMD64 Architecture Programmer's Manual，两者在 MSR 编号和特性支持上可能有差异。
- x86-64（long mode）最早由 AMD 定义，查 `syscall`、long mode 等扩展时 AMD 手册有时更清晰。

## Key entities

- [[entities/Intel|Intel]]

## Key concepts

- [[concepts/x86-64|x86-64]]

## Related resources

- [[sources/src-felixcloutier-x86|felixcloutier.com/x86]] — Intel SDM Vol.2 指令参考的网页版，查单条指令比翻 PDF 快。
- [AMD 文档中心](https://www.amd.com/en/search/documentation/hub.html) — 搜 "AMD64 Architecture Programmer's Manual"。

## Linked pages

- [[entities/Intel|Intel]]
- [[concepts/x86-64|x86-64]]
- [[system-programming/x86 registers|x86 registers]] — vault 原笔记，内容可对照 SDM Vol.1 / Vol.3
