---
title: 如何阅读 Intel SDM
description: 面向有体系结构基础但不熟悉 x86 的读者的 SDM 阅读路线
date: 2026-07-26
tags: [question, x86, assembly, system-programming]
aliases: []
created: 2026-07-26
---

# 如何阅读 Intel SDM

## Question

对于对体系结构有一些了解、但对 x86 不太熟的人，推荐怎么读 Intel SDM？

## Answer

**核心原则：SDM 是参考手册不是教科书，全套 5000+ 页，不要从头线性读。**

### 阶段 0：定位（1–2 小时）

Vol.1 第 1–2 章快速过，建立 x86 词汇表：IA-32、Intel 64、long mode、compatibility mode 等术语的对应关系。通用的体系结构知识（流水线、缓存、ISA 设计）可以直接迁移。

### 阶段 1：基本执行环境（重点，半天）

Vol.1 第 3 章是唯一需要认真通读的部分：

- 16 个 GPR 及部分寄存器别名（AL/AH/AX/EAX/RAX）
- 寻址模式，尤其是 RIP-relative（PIC 的核心）
- 栈约定与 `RFLAGS` 的隐式更新

x87/MMX/SSE 数据类型章节先跳过，用到再回来。

### 阶段 2：按目标选 track

**Track A — 读编译器输出 / 性能分析（大多数人）：**
- Vol.2 不逐页读，用 felixcloutier.com/x86 按需查指令
- 学会读 Vol.2 指令条目结构：Operation 伪代码 → Flags Affected → Exceptions
- 微架构细节（端口、延迟、流水线）不在 SDM 里，在 *Optimization Reference Manual*
- 实践：Godbolt 上看 C → asm，逐条查不认识的指令

**Track B — OS / 系统编程（Vol.3 按兴趣顺序，不必按章节顺序）：**
1. 分页（第 4 章）— 精读：CR3、四级页表、TLB 行为
2. 中断与异常（第 6 章）— 精读：IDT、异常向量
3. 内存序（§8.2）— 精读：x86-TSO 与 ARM/RISC-V 弱内存模型的对比
4. 分段（第 3 章）— 略读：64 位下基本是历史遗留，只需理解 FS/GS 用于 TLS
5. APIC、VMX 用到再说

### 明确跳过

x87 FPU 细节、BCD、硬件任务切换（Vol.3 第 7 章）、16 位实模式（除非写 bootloader）、MMX（已被 SSE 取代）、Vol.4（纯表格，按需查）。

### 一句话总结

Vol.1 第 3 章 + Vol.3 按 track 选读 + felixcloutier 查指令，剩下的都当字典。

## Sources

- [[sources/src-intel-sdm|src-intel-sdm]]
- [[concepts/x86-64|x86-64]]
- [[system-programming/x86 registers|x86 registers]] — 阶段 1 的配套速查笔记

## Follow-ups

- x86-TSO 内存模型与 C++ memory order 的映射关系（可关联 [[concepts/Memory Order|Memory Order]]）
- Optimization Reference Manual 是否值得 ingest 为独立来源
- AMD64 手册与 SDM 在 long mode 描述上的差异
