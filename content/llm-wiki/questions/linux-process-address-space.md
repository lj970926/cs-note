---
title: Linux 进程地址空间布局
description: x86-64 Linux 进程虚拟地址空间的典型布局：text/data/bss/heap/mmap/stack 与内核空间
date: 2026-07-26
tags: [question, linux, memory, system-programming]
aliases: []
created: 2026-07-26
---

# Linux 进程地址空间布局

## Question

Linux 的进程地址空间长什么样？

## Answer

以最常见的 **x86-64、4 级页表（48 位虚拟地址）** 为例，从高地址到低地址：

```
0xFFFFFFFFFFFFFFFF ┌─────────────────────┐
                   │   内核空间            │  0xffff800000000000 以上，
                   │  （所有进程共享映射）   │  用户态不可访问
0xFFFF800000000000 ├─────────────────────┤
                   ~  巨大空洞（非规范地址）~  48 位 VA 用不满 64 位
0x00007FFFFFFFFFFF ├─────────────────────┤
                   │   用户栈 (stack)      │  向下增长，默认上限 8MB (ulimit -s)
                   ├─────────────────────┤
                   ~    未映射空洞         ~
                   ├─────────────────────┤
                   │   mmap 区            │  共享库、匿名 mmap、线程栈，
                   │                     │  向下扩展
                   ├─────────────────────┤
                   │   堆 (heap / brk)    │  malloc 小对象来源，向上增长
                   ├─────────────────────┤
                   │   BSS 段             │  未初始化全局/静态变量（清零页）
                   ├─────────────────────┤
                   │   Data 段            │  已初始化全局/静态变量
                   ├─────────────────────┤
0x0000000000400000 │   Text 段            │  代码 + 只读常量（r-x）
                   ├─────────────────────┤
0x0                │   保留区（NULL 页）    │  不可映射，用于抓空指针解引用
                   └─────────────────────┘
```

### 关键点

- **VMA 是管理单位**：每个连续区间是一个 `vm_area_struct`，带独立权限（r/w/x）。`cat /proc/<pid>/maps` 可直接观察实际布局。
- **ASLR**：stack、mmap 区、heap 及 PIE 可执行文件的加载基址每次启动随机偏移；相对顺序固定，绝对地址不固定。
- **惰性分配**：VMA 只是"承诺"，首次访问触发 page fault 才分配物理页，因此可以超额"申请"虚拟内存。
- **stack 与 mmap 区相向生长**，碰撞即 stack overflow / OOM。
- **vDSO** 映射在 mmap 区顶部附近，使 `gettimeofday` 等高频调用无需陷入内核。
- **5 级页表**（内核 5.4+ 且硬件支持）将用户空间扩至 56 位，但 48 位布局仍是默认形态。
- **32 位系统**概念相同：text 从 `0x08048000` 开始，经典 3G/1G 划分下内核占顶部 1GB。

### 栈的权限

用户栈在 `/proc/<pid>/maps` 中显示为 `rw-p`（如 `7ffffffde000-7ffffffff000 rw-p ... [stack]`）：

- **可读可写、不可执行（NX）**：x86-64 硬件级 no-execute 位阻止栈上注入的 shellcode 执行，是 stack smashing 防护的关键。
- **权限来源是 ELF 的 `PT_GNU_STACK` 段**：链接器默认生成 `RW`，`gcc -z execstack` 可改成可执行栈（`RWX`），安全上应避免。
- **grow-down 是隐藏属性**：栈 VMA 带 `VM_GROWSDOWN`，page fault 命中 guard 区域时内核自动向下扩展，直到 `RLIMIT_STACK`（默认 8MB）。
- **线程栈不在 `[stack]` 段**：pthread 线程栈位于 mmap 区，同为 `rw-`，尾部有 `PROT_NONE` guard page（`---p`），越界即 segfault。

### 查看权限的命令

**静态（看二进制的 GNU_STACK segment）**：

```bash
readelf -lW ./a.out | grep GNU_STACK   # 标准用法：RW=不可执行，RWE=可执行栈
objdump -p ./a.out                     # 也打印 program headers，含 GNU_STACK
execstack -q ./a.out                   # 专查/改可执行栈标志
checksec --file=./a.out                # pwntools 自带，直接显示 NX enabled/disabled
```

注意 GNU_STACK 是 segment（program header）而非 section，因此 `readelf -S` / `objdump -h` 看不到。

**动态（看运行中进程的实际 VMA 权限）**：

```bash
cat /proc/<pid>/maps | grep -E 'stack|heap'
pmap -X <pid>
```

验证对比：

```bash
gcc -o nx main.c && gcc -z execstack -o ex main.c
readelf -lW nx | grep GNU_STACK   # RW
readelf -lW ex | grep GNU_STACK   # RWE
```

**GDB（调试时查看）**：

```gdb
info proc mappings          # 各段地址范围 + 权限（调试器内嵌版 /proc/pid/maps）
p/x $rsp                    # 当前栈指针，对照 mappings 看落在哪段
info frame                  # 当前栈帧：返回地址、saved rbp、局部变量位置
info stack / bt full        # 调用栈，带参数和局部变量
x/32gx $rsp                 # 以 8 字节为单位 dump 栈内存
maintenance info sections   # 二进制 section 布局（静态，类似 objdump -h）
```

实用组合：`info frame` 的 saved rip 减 `$rsp` 可算缓冲区溢出覆盖长度；代码段基址为 `0x555555...` 说明 PIE + ASLR 生效，`0x400000` 则是非 PIE 固定基址。GDB 默认 `set disable-randomization on`，调试时地址固定便于复现。老版本 GDB 的 `info proc mappings` 无 Perms 列，需回 `/proc/pid/maps` 确认权限。

### 一句话总结

低地址是编译期确定的 text/data/bss，中间 heap 向上、mmap 区向下，顶部是用户栈；上半部地址全部留给内核，中间隔着巨大的非规范地址空洞。

## Sources

- 无外部来源，基于通用系统知识整理。
- 相关页面：[[concepts/x86-64|x86-64]]、[[concepts/Memory Safety|Memory Safety]]

## Follow-ups

- VMA / page fault / demand paging 机制细节，值得建独立 concept 页
- `/proc/<pid>/maps` 各字段含义与 `pmap` 工具
- ASLR 的具体实现与 `mmap_min_addr` 保护
- [[questions/stack-based-code-injection|基于栈溢出的代码注入]] — NX 位存在的原因
- 5 级页表（LA57）启用条件与布局变化
