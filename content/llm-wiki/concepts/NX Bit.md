---
title: NX Bit
description: 硬件级的页不可执行位（No-eXecute），实现 W^X 策略，堵死数据区代码注入
date: 2026-07-26
tags: [concept, security, memory, x86, system-programming]
aliases: [NX, XD bit, No-eXecute]
created: 2026-07-26
---

# NX Bit

## Definition

NX bit（No-eXecute）是 x86-64 页表项（PTE）第 63 位的**硬件级不可执行标记**。标记为 NX 的页可正常读写数据，但 CPU 试图从该页**取指令**时触发 page fault，进程收到 SIGSEGV。

- 经典 x86 页权限只有读/写，"可读即可执行"；AMD 在 64 位扩展中加入 NX，Intel 对应实现叫 XD bit（eXecute Disable）。
- 使 **W^X 策略**成为可能：任何一页要么可写要么可执行，二者不兼得。内核据此设置：栈 `rw-`、堆 `rw-`、代码段 `r-x`。
- 栈的 NX 由 ELF `PT_GNU_STACK` 段决定（`readelf -lW` 可见，`-z execstack` 可关闭，安全禁忌）。

## 安全意义

- **堵死数据区代码注入**：栈/堆上的 shellcode 无法执行，stack smashing 的经典套路失效。
- **催生代码复用攻击**：已有可执行代码（libc、程序自身）仍可任意跳转，攻击进化为 ret2libc / ROP——NX 管"能不能执行"，管不了"跳到哪"。
- 与 [[concepts/ASLR|ASLR]] 互补：NX 消灭"注入代码"，ASLR 消灭复用代码所需的地址知识。

## Related

- [[questions/linux-process-address-space|Linux 进程地址空间布局]] — 各段权限的实际表现
- [[questions/stack-based-code-injection|基于栈溢出的代码注入]] — NX 所防御的攻击
- [[concepts/x86-64|x86-64]] — NX 所在的指令集架构
- [[concepts/Memory Safety|Memory Safety]]

## Sources

- 无外部来源，基于通用系统安全知识整理。
