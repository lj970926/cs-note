---
tags:
  - ELF
  - 动态链接
  - x86-64
  - 逆向
  - 系统编程
aliases:
  - PLT
  - GOT
  - Lazy Binding
---

# PLT / GOT / 动态链接笔记

> 语境：x86-64 ELF、PIC、动态链接、延迟绑定。核心一句话：**PLT 是跳板代码，GOT 是装真实地址的表，`.rela.plt` 是说明“哪个地址槽填哪个符号”的清单。**

## 1. 总览

外部函数调用编译时不知道真实地址，所以走间接层：

```text
call printf@plt
  -> PLT stub
  -> GOT 槽
  -> 真实 libc 函数
```

首次调用时 GOT 还没填好，会拐去动态链接器解析；解析后写回 GOT，以后直达。

```text
                 .text                         .plt
┌─────────────────────────┐          ┌──────────────────────────────┐
│ call printf@plt ────────┼─────────>│ printf@plt:                  │
│                         │          │   jmp *printf@GOTPCREL(%rip) │
│                         │          │   push reloc_index           │
│                         │          │   jmp PLT0                   │
└─────────────────────────┘          └──────────────┬───────────────┘
                                                    │
                                                    ▼
                                     ┌──────────────────────────────┐
                                     │ PLT0 公共解析入口            │
                                     │   push GOT[1]  # link_map    │
                                     │   jmp *GOT[2]  # resolver    │
                                     └──────────────┬───────────────┘
                                                    ▼
                                     ┌──────────────────────────────┐
                                     │ _dl_runtime_resolve          │
                                     │ 查符号 -> 写回 GOT -> 进入   │
                                     └──────────────────────────────┘
```

解析后再次调用：

```text
call printf@plt
  -> jmp *printf@got
  -> GOT 里已是真实地址
  -> 直接进 printf
```

## 2. PLT：Procedure Linkage Table

PLT 是**过程链接表**，放外部函数调用的跳板代码。

典型 `foo@plt`：

```asm
foo@plt:
    jmp *foo@GOTPCREL(%rip)   # 通过 GOT 槽间接跳
    push $reloc_index         # 未解析时：告诉解析器我是谁
    jmp PLT0                  # 去公共解析入口
```

要点：

- 管“怎么调过去”。
- 每个外部函数一个小 stub。
- 第一次调用通常走 lazy 解析路径。
- 开启 `-Wl,-z,now` / Full RELRO 后，启动时就解析，lazy 路径不再走。

## 3. GOT：Global Offset Table

GOT 是**全局偏移表**，保存外部符号的真实地址或待解析槽位。

分工：

- PLT：代码桩，负责跳。
- GOT：数据槽，负责存地址。

常见节区：

```text
.got       常放全局数据/本模块需要的地址槽
.got.plt   传统上放 lazy-binding 的函数地址槽，配套 .plt
.plt.got   某些链接器/配置下放非 lazy 的 PLT 相关项
```

函数延迟绑定的效果：

```text
第一次前：foo@got = 指回 foo@plt 的 push reloc_index
第一次后：foo@got = libc 中 foo 的真实地址
```

## 4. `jmp *foo@GOTPCREL(%rip)` 是什么？

真实指令语义是 RIP-relative 间接跳转。

AT&T 示意：

```asm
jmp *foo@GOTPCREL(%rip)
```

更接近 Intel 语义：

```asm
jmp qword ptr [rip + foo_got_offset]
```

语义：

```text
addr   = RIP_next + foo_got_offset
target = *(uint64_t *)addr
rip    = target
```

注意：

- `*` 表示间接跳转：不是跳到 GOT 槽地址，而是跳到 **GOT 槽里存的值**。
- `(%rip)` 用于 PIC/ASLR：不能写死绝对地址，用相对偏移，整体映射搬走也能算对。
- 反汇编里通常看不到 `@GOTPCREL`，只剩数字偏移和 objdump 注释：

```asm
1030: ff 25 e2 2f 00 00    jmp *0x2fe2(%rip)  # 3018 <printf@GLIBC_2.2.5>
```

严格说法：`foo@GOTPCREL(%rip)` 是汇编器/重定位表达式；链接完变成 `jmp *disp(%rip)`。

## 5. 它能一个 cycle 完成吗？

不能按 1 cycle 理解。至少要：

```text
1. 算 GOT 槽地址：RIP_next + disp
2. 从内存读 8 字节目标地址
3. 用读到的值更新 RIP
```

实际表现：

- GOT 命中 L1/L2，且间接分支预测正确：乱序下开销可能被隐藏，但 latency 仍不是 1 cycle。
- 预测错误：流水线重定向，十几到几十 cycle 级代价。
- GOT 不在缓存或 TLB miss：更贵。
- 首次 lazy binding：还要进 `_dl_runtime_resolve`，远大于普通跳转。

粗略记：

```text
直接 call/jmp：主要赌分支预测
间接 jmp *mem：多一个 load target 依赖
PLT 首次调用：load + resolver + 写 GOT + 再跳，最贵
```

## 6. `push` 是做什么的？

x86 栈向低地址增长：

```asm
push rax
```

近似：

```asm
sub $8, %rsp
mov %rax, (%rsp)
```

即：

```text
rsp -= 8
[rsp] = value
```

`pop rax` 反过来：

```text
rax = [rsp]
rsp += 8
```

函数调用也靠栈：

```text
call foo  ≈ push 返回地址; jmp foo
ret       ≈ pop 返回地址到 rip
```

细节：x86-64 下 `push $imm` 通常 imm32 符号扩展后压 8 字节；SysV ABI 还要求调用点栈 16 字节对齐。

## 7. `reloc_index` 是什么？

`reloc_index` 是该外部函数在 `.rela.plt` 里的**重定位表项序号**，不是 GOT 地址，也不是符号地址。

```asm
printf@plt:
    jmp *printf@GOTPCREL(%rip)
    push $0x0          # .rela.plt[0]
    jmp PLT0

puts@plt:
    jmp *puts@GOTPCREL(%rip)
    push $0x1          # .rela.plt[1]
    jmp PLT0
```

解析器收到：

```text
link_map, reloc_index
```

然后：

```text
rela      = rela.plt + reloc_index * sizeof(Elf64_Rela)   # x86-64 每项 24 字节
sym_index = ELF64_R_SYM(rela->r_info)
type      = ELF64_R_TYPE(rela->r_info)    # R_X86_64_JUMP_SLOT
name      = strtab + symtab[sym_index].st_name
addr      = lookup(name)
*(rela->r_offset) = addr                  # 回填 GOT
jmp addr
```

## 8. `.rela.plt` 是什么？

`.rela.plt` 保存 PLT 相关动态重定位项：告诉动态链接器哪些 GOT 槽该填哪个函数。

x86-64 每项：

```c
typedef struct {
    Elf64_Addr r_offset;   // 要改写的位置：通常是 GOT 槽地址
    uint64_t   r_info;     // 符号索引 + 重定位类型
    int64_t    r_addend;   // 加数，JUMP_SLOT 一般为 0
} Elf64_Rela;
```

`r_info` 拆解：

```text
ELF64_R_SYM(r_info)  = .dynsym 符号下标
ELF64_R_TYPE(r_info) = 重定位类型，如 R_X86_64_JUMP_SLOT
```

示例：

```bash
readelf -r ./a.out
```

```text
Relocation section '.rela.plt' ... contains 2 entries:
  Offset          Info           Type               Sym. Name + Addend
000000403fa8  000100000007 R_X86_64_JUMP_SLOT     printf@GLIBC_2.2.5 + 0
000000403fb0  000200000007 R_X86_64_JUMP_SLOT     exit@GLIBC_2.2.5 + 0
```

含义：

```text
r_offset = 0x403fa8  -> printf 的 GOT 槽
type     = JUMP_SLOT -> PLT lazy binding 函数槽
sym      = printf    -> 去依赖库查 printf
addend   = 0
```

常见邻居：

```text
.rela.dyn   数据/全局符号重定位：R_X86_64_GLOB_DAT、R_X86_64_RELATIVE 等
.rela.plt   函数 PLT/GOT 槽：主要 R_X86_64_JUMP_SLOT
```

32-bit x86 多用 `.rel.plt` / `Elf32_Rel`；x86-64 用 RELA，所以是 `.rela.plt`。

## 9. 公共解析入口 PLT0

PLT0 是所有未解析函数共用的 resolver stub。

典型逻辑：

```asm
PLT0:
    push GOT[1]       # link_map*
    jmp *GOT[2]       # _dl_runtime_resolve
```

GOT 开头几项由动态链接器预填：

```text
GOT[0] = .dynamic 地址
GOT[1] = link_map*
GOT[2] = _dl_runtime_resolve 地址
```

完整链路：

```text
call foo@plt
  -> jmp *foo@got
  -> 第一次指回 push reloc_index
  -> jmp PLT0
  -> push link_map; jmp *_dl_runtime_resolve
  -> 按 reloc_index 找 .rela.plt 项
  -> 查符号，回填 foo@got
  -> 进入真 foo
```

## 10. 安全与链接选项

- Lazy binding：第一次调用才解析，启动快，但 GOT 可写窗口更久。
- `-Wl,-z,now` / `BIND_NOW`：启动时解析全部 JUMP_SLOT。
- Full RELRO：常配合 `relro + now`，解析后 GOT 映射只读，降低 GOT overwrite 风险。
- Partial RELRO：GOT 仍可写，常见利用面更大。

## 11. 实操命令

```bash
cat > t.c <<'EOF'
#include <stdio.h>
int main(){ printf("hi\n"); }
EOF

gcc -fPIC t.c -o t

readelf -S ./t       # 看 .plt/.got/.got.plt/.rela.plt
readelf -r ./t       # 看 .rela.plt 的 JUMP_SLOT
objdump -d ./t       # 看 call foo@plt / jmp *disp(%rip)
objdump -R ./t       # 动态重定位
```

观察点：

```bash
objdump -d ./t | grep -A5 '<printf@plt>'
readelf -r ./t | grep -E 'GLOB_DAT|JUMP_SLOT|GOTPCREL'
```

## 12. 一页速记

```text
PLT       = 跳板代码：怎么跳
GOT       = 地址槽：跳到哪
.rela.plt = 清单：哪个 GOT 槽填哪个符号
reloc_index = .rela.plt 项序号
PLT0      = 共用 resolver stub
首次调用  = PLT -> GOT 未填 -> PLT0 -> _dl_runtime_resolve -> 回填 GOT
之后调用  = PLT -> GOT 已填 -> 直达目标
```

## 相关

- [[ELF 结构]]
- [[动态链接器 ld.so]]
- [[SysV x86-64 ABI]]
- [[RELRO 与 GOT overwrite]]
- [[PIC 与 ASLR]]
