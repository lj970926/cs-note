---
title: "objdump"
tags:
  - tool
  - binary
---

objdump 是 GNU binutils 里的目标文件/可执行文件分析工具，可以查看文件头、段信息、符号表、反汇编代码等。类似工具：`readelf`（更侧重 ELF 结构）、`nm`（只看符号）、`gdb` 里的 `disassemble`。

# 常用用法速查
```bash
objdump -d a.out            # 反汇编 .text 段（最常用）
objdump -d -M intel a.out   # Intel 语法反汇编（默认是 AT&T 语法）
objdump -S a.out            # 反汇编并穿插显示源代码（需要 -g 编译）
objdump -h a.out            # 查看段（section）表
objdump -x a.out            # 显示所有头信息（全量汇总）
objdump -t a.out            # 查看符号表
objdump -r a.out            # 查看重定位信息（分析 .o 文件常用）
```

# 信息查看类选项
* `-f`：显示文件头摘要（架构、入口地址、格式等）。
* `-h`：段表，含每个段的 size、VMA、LMA、文件偏移，快速了解内存布局。
* `-x`：all-headers，相当于 `-f -h -t -r` 等的合集，输出很长，建议配合 grep。
* `-t`：符号表（类似 `nm`，但带 section 和属性信息）。
* `-T`：动态符号表（.dynsym），分析动态链接库导出了哪些函数时用。
* `-p`：私有头信息，对 ELF 来说就是 program headers（段如何被加载到内存）和动态段信息（依赖哪些 .so）。
* `-R`：动态重定位表，看 GOT/PLT 相关条目。
```bash
objdump -p libfoo.so | grep NEEDED   # 查看 so 依赖了哪些库
```

# 反汇编类选项
* `-d`：只反汇编可执行段（通常是 .text）。
* `-D`：反汇编**所有**段，包括数据段（数据会被当成指令解码，一般只在做固件/shellcode 分析时用）。
* `-M intel` / `-M att`：选择 Intel / AT&T 汇编语法，x86 下最常用 `-M intel`。
* `-S`：源码和汇编交错显示，需要编译时带 `-g`；配合 `-O0` 编译出来的二进制对应关系最清晰。
* `-l`：在汇编里标注对应的源文件名和行号（也需要 `-g`）。
* `-C`：demangle C++/Rust 符号名，把 `_ZN3foo3barE` 还原成 `foo::bar`。
* `--no-show-raw-insn`：不显示指令的机器码字节，输出更干净。
* `-b <format>`：指定文件格式，`objdump -D -b binary -m i386 raw.bin` 可以反汇编裸二进制（无文件头）。
* `-m <arch>`：指定架构，配合 `-b binary` 使用，如 `-m aarch64`。
* `--start-address=0xADDR` / `--stop-address=0xADDR`：只反汇编指定地址范围，分析大文件时很实用。

# 常见组合
```bash
# 看某个函数的反汇编（配合 grep 定位）
objdump -d -M intel a.out | grep -A 50 '<main>:'

# 只看某个段
objdump -d -j .text a.out        # -j 指定段名
objdump -s -j .rodata a.out      # -s 按十六进制+ASCII dump 段内容，看字符串/常量

# 分析动态链接
objdump -T libfoo.so | grep UND  # 未定义符号 = 需要从外部导入的
objdump -R a.out                 # PLT/GOT 重定位项

# 内联函数 / 源码级分析
objdump -dSl -C -M intel a.out | less
```

# 补充说明
* `-s` 是 dump 段内容（十六进制 + ASCII），不是反汇编，适合看 `.rodata`、`.data` 里的数据。
* stripped（去符号）的二进制 `-t`/`-d` 里看不到函数名，只有地址；`-T` 对动态符号仍有效。
* macOS 上默认没有 objdump，可以用 `otool -tv` 替代，或者 `brew install binutils` 后用 `gobjdump`；LLVM 系的 `llvm-objdump` 选项基本兼容。
* 交叉分析其他架构的目标文件时，用对应工具链的版本，如 `aarch64-linux-gnu-objdump`。
