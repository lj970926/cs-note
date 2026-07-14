---
title: "macOS 下使用 QEMU 学习 RISC-V：安装环境并跑通 riscv-test"
description: "在 macOS 上搭建 RISC-V 学习环境的完整教程，包括安装 QEMU、RISC-V 工具链，编写裸机程序，并使用 QEMU 运行和调试"
date: 2026-07-14
tags:
  - RISC-V
  - QEMU
  - macOS
  - 系统编程
  - 汇编
  - GDB
  - 裸机编程
  - 工具链
aliases:
  - "RISC-V 环境搭建"
  - "QEMU RISC-V 教程"
  - "RISC-V 裸机程序"
status: in-progress
---

## 目标

在 macOS 上搭建一个最小 RISC-V 学习环境：

``` text
macOS
 |
 |  QEMU
 |
RISC-V virt machine
 |
test.elf
```

完成：

-   安装 QEMU
-   安装 RISC-V GNU Toolchain
-   编译一个裸机 RISC-V 程序
-   使用 QEMU 启动运行

------------------------------------------------------------------------

# 1. 安装 QEMU

macOS 推荐使用 Homebrew：

``` bash
brew install qemu
```

检查：

``` bash
qemu-system-riscv64 --version
```

查看支持的 RISC-V machine：

``` bash
qemu-system-riscv64 -machine help
```

学习 RISC-V 时主要使用：

    virt

它是 QEMU 提供的通用 RISC-V 虚拟开发板。

------------------------------------------------------------------------

# 2. 安装 RISC-V 工具链

需要以下工具：

-   riscv64-unknown-elf-gcc
-   riscv64-unknown-elf-gdb
-   riscv64-unknown-elf-objdump

## 方法 1：Homebrew tap（如果可用）

``` bash
brew tap riscv/riscv
brew install riscv-tools
```

检查：

``` bash
riscv64-unknown-elf-gcc --version
```

------------------------------------------------------------------------

## 方法 2：使用官方预编译工具链（推荐）

如果 brew 安装失败，可以安装 RISC-V 官方 GNU Toolchain。

安装后确保：

``` bash
riscv64-unknown-elf-gcc
riscv64-unknown-elf-gdb
```

在 PATH 中。

检查：

``` bash
which riscv64-unknown-elf-gcc
```

------------------------------------------------------------------------

# 3. 创建第一个 RISC-V 裸机程序

创建目录：

``` bash
mkdir riscv-test
cd riscv-test
```

目录：

    riscv-test/
    ├── start.S
    ├── main.c
    └── linker.ld

------------------------------------------------------------------------

# 4. 编写启动代码

## start.S

``` asm
.section .text
.globl _start

_start:
    call main

loop:
    j loop
```

作用：

-   设置入口 `_start`
-   调用 C 函数
-   进入死循环

------------------------------------------------------------------------

# 5. 编写 C 程序

## main.c

``` c
volatile int x;

int main()
{
    x = 1234;

    while(1);

    return 0;
}
```

这里：

-   `x` 会被放入内存
-   可以通过调试器观察

------------------------------------------------------------------------

# 6. 编写 linker script

## linker.ld

``` ld
ENTRY(_start)

SECTIONS
{
    . = 0x80000000;

    .text :
    {
        *(.text*)
    }

    .data :
    {
        *(.data*)
    }

    .bss :
    {
        *(.bss*)
    }
}
```

作用：

指定：

-   程序入口
-   内存布局
-   代码加载地址

QEMU virt machine 默认 RAM 地址：

    0x80000000

------------------------------------------------------------------------

# 7. 编译 RISC-V ELF

执行：

``` bash
riscv64-unknown-elf-gcc \
-march=rv64gc \
-mabi=lp64d \
-nostdlib \
-T linker.ld \
start.S main.c \
-o test.elf
```

参数说明：

  参数            作用
  --------------- ------------------
  -march=rv64gc   生成 RV64GC 指令
  -mabi=lp64d     使用 64 位 ABI
  -nostdlib       不链接标准库
  -T linker.ld    指定链接脚本

------------------------------------------------------------------------

# 8. 查看反汇编

``` bash
riscv64-unknown-elf-objdump -d test.elf
```

可以看到：

-   addi
-   jal
-   ret
-   stack 操作

------------------------------------------------------------------------

# 9. 使用 QEMU 运行

启动：

``` bash
qemu-system-riscv64 \
-machine virt \
-nographic \
-bios none \
-kernel test.elf
```

此时：

    Mac CPU
     |
    QEMU TCG
     |
    RISC-V CPU
     |
    test.elf

正在运行。

------------------------------------------------------------------------

# 10. 使用 GDB 调试

启动 QEMU：

``` bash
qemu-system-riscv64 \
-machine virt \
-nographic \
-bios none \
-kernel test.elf \
-S \
-s
```

参数：

  参数   作用
  ------ -------------------------
  -S     启动后暂停 CPU
  -s     开启 localhost:1234 GDB

------------------------------------------------------------------------

启动 GDB：

``` bash
riscv64-unknown-elf-gdb test.elf
```

连接：

``` gdb
target remote localhost:1234
```

查看寄存器：

``` gdb
info registers
```

> [!tip] 对比学习
> RISC-V 寄存器与 x86 寄存器设计理念不同，可参考 [[system-programming/x86 registers]] 对比学习。

单步：

``` gdb
si
```

查看 PC：

``` gdb
p/x $pc
```

------------------------------------------------------------------------

# 11. 常见问题

## Homebrew 卡在 Waiting in queue

例如：

    remote: Waiting in queue...

说明镜像服务器排队。

可以：

``` bash
Ctrl+C
```

跳过。

安装时禁止自动更新：

``` bash
HOMEBREW_NO_AUTO_UPDATE=1 brew install qemu
```

------------------------------------------------------------------------

## brew 找不到 riscv-tools

错误：

    No available formula with the name "riscv-tools"
原因：
Homebrew 官方仓库已经移除该 formula。
解决：
-   使用 riscv tap
-   或安装官方 GNU Toolchain

------------------------------------------------------------------------

# 12. 下一步学习路线

推荐：

    riscv-test
        |
        v
    GDB 调试寄存器
        |
        v
    OpenSBI
        |
        v
    Linux on RISC-V
        |
        v
    xv6-riscv
        |
        v
    修改 OS:
        - trap
        - scheduler
        - page table

------------------------------------------------------------------------

# 相关笔记

- [[system-programming/x86 registers]] - x86 架构寄存器，可与 RISC-V 寄存器对比学习
- [[website/计算机启动过程]] - 计算机启动流程，理解裸机程序执行环境
- [[source-code/Linux-0.11/系统启动]] - Linux 0.11 系统启动源码，深入理解操作系统启动