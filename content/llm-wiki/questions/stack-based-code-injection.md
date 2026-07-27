---
title: 基于栈溢出的代码注入
description: 经典 stack smashing 攻击的原理、注入位置、NOP sled，以及 NX/ASLR/canary 防御如何推动攻击进化为 ret2libc/ROP
date: 2026-07-26
tags: [question, security, stack, memory, system-programming]
aliases: []
created: 2026-07-26
---

# 基于栈溢出的代码注入

## Question

基于 stack overflow 的 code injection 一般是怎么做的？代码注入到哪里？

## Answer

### 注入位置

**代码就注入在溢出的那个缓冲区本身**——通常是栈上的局部 buffer。变体：环境变量（envp 位于栈顶附近）、堆缓冲区、全局/静态缓冲区（`.data`/`.bss`），取决于溢出点在哪段内存。

### 经典流程（stack smashing）

前提：程序存在无边界检查的栈拷贝（`gets`/`strcpy`/`sprintf`）。栈帧布局：

```
低地址  ┌──────────────────┐
        │  buffer[64]      │  ← 输入从这里写入，向高地址溢出
        ├──────────────────┤
        │  saved rbp       │
        ├──────────────────┤
        │  return address  │  ← 覆盖目标
        ├──────────────────┤
高地址  │  调用者的帧       │
        └──────────────────┘
```

构造输入：`[ shellcode ][ 填充 ][ 覆盖值 = buffer 地址 ]`

1. 溢出盖过 saved rbp，把 return address 改写为 buffer 地址。
2. 函数 `ret` 跳入 buffer，执行注入的机器码（经典 payload：`execve("/bin/sh")`，故称 shellcode）。

### NOP sled

无 ASLR 时栈地址大致可预测但猜不准字节级起点。在 shellcode 前铺大量 `0x90`（NOP），返回地址落在 sled 任意位置都能"滑"到 shellcode，把猜测精度从字节级放宽到 sled 长度级。

### 防御与攻击的协同进化

| 防御 | 杀死了什么 | 攻击的进化 |
|---|---|---|
| NX bit（栈 `rw-`） | 栈上注入代码无法执行 | ret2libc：不注入代码，`ret` 到 libc `system()` |
| ASLR | 地址不可预测，NOP sled 失效 | 信息泄露 + ROP：复用程序自身 gadget 链式拼接 |
| Stack canary | 覆盖返回地址前先破坏金丝雀值被检测 | 泄露 canary 或攻击其他控制数据 |
| PIE | 程序自身 gadget 地址也随机化 | 结合泄露逐一击破 |

现代利用多为"信息泄露 + ROP chain"组合；纯栈注入仅存在于无 NX 的老系统/嵌入式。这也是 `-z execstack` 是安全禁忌的原因（见 [[questions/linux-process-address-space|Linux 进程地址空间布局]] 中 GNU_STACK 一节）。

### 为什么经典 payload 是拿 shell

**拿到 shell = 拿到被攻破进程权限的完整交互式操作权**：

- **继承目标进程权限**：溢出 setuid root 程序或 root daemon，弹出的就是 root shell。
- **shell 是通用载体**：读文件、改配置、装后门都是现成命令，无需为每个动作单独写 shellcode。
- **post-exploitation 典型步骤**：信息收集 → 权限提升 → 持久化（后门/SSH key/cron）→ 横向移动（pivot 进内网）。
- **shell 并非唯一选择**：shellcode 可执行任意系统调用——bind shell（开端口等连接）、reverse shell（主动回连，穿 NAT/防火墙更可靠）、dropper/stager（拉取更大 payload）。真实攻击中直接干活型更常见，体积小、不易告警。
- `execve("/bin/sh")` 成为经典演示，是因为它是**最小成本的"完全控制"证明**：几十字节机器码换一个可敲命令的会话。

### 一句话总结

注入到溢出的缓冲区本身（一般在栈上），靠覆盖返回地址引入执行流；NX 堵死后攻击转向"不注入、复用现有代码"的 ret2libc / ROP。

## Sources

- 无外部来源，基于通用系统安全知识整理（经典参考：Aleph One, *Smashing The Stack For Fun And Profit*, Phrack 49）。
- 相关页面：[[concepts/NX Bit|NX Bit]]、[[concepts/ASLR|ASLR]]、[[questions/linux-process-address-space|Linux 进程地址空间布局]]、[[concepts/x86-64|x86-64]]

## Follow-ups

- ROP gadget 查找与链式构造机制，可建独立 concept 页
- Stack canary 的实现（TLS 存储、`__stack_chk_fail`）
- ret2libc 在无 ASLR 环境下的具体布局
- CFI 等新一代控制流防御
