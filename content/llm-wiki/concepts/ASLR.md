---
title: ASLR
description: 地址空间布局随机化（Address Space Layout Randomization），每次启动随机偏移各段基址，使硬编码地址的攻击失效
date: 2026-07-26
tags: [concept, security, memory, linux, system-programming]
aliases: []
created: 2026-07-26
---

# ASLR

## Definition

ASLR（Address Space Layout Randomization，地址空间布局随机化）在每次进程启动时给各段基址加随机偏移：栈、mmap 区（含 libc）、heap；可执行文件本身需编译为 PIE 才能随机化。

- Linux 开关：`/proc/sys/kernel/randomize_va_space`（0=关，1=栈+mmap，2=再加 heap，默认 2）。
- GDB 默认 `set disable-randomization on`，调试时地址固定便于复现。
- 派生进程（fork）继承父进程布局，不重新随机化。

## 安全意义与局限

- **作用**：使硬编码地址的攻击（ret2libc 跳 `system()`、NOP sled 猜栈地址）失效。
- **局限**：
  - 只随机化**基址**，段内相对偏移不变——泄露任一指针即可推算整段布局，因此**信息泄露**成为现代利用的前置步骤。
  - 熵有限：32 位 mmap 基址仅十几位随机，对自动重启的服务可暴力枚举；64 位熵大，基本不可爆破。
  - 对不随机化的部分无效：非 PIE 可执行文件的代码段地址固定（`0x400000`），仍可作 ROP gadget 来源。
- 与 [[concepts/NX Bit|NX Bit]] 互补：NX 消灭"注入代码"，ASLR 消灭复用代码所需的地址知识；两者叠加把利用门槛从单个溢出抬到"溢出 + 信息泄露 + 稳定利用链"。

## Related

- [[questions/linux-process-address-space|Linux 进程地址空间布局]] — 被随机化的各段
- [[questions/stack-based-code-injection|基于栈溢出的代码注入]] — ASLR 所防御的攻击
- [[concepts/NX Bit|NX Bit]]

## Sources

- 无外部来源，基于通用系统安全知识整理。
