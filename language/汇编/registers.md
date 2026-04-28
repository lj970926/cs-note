## 1. 通用寄存器 GPR

x86-64 有 **16 个 64 位通用寄存器**：

RAX RBX RCX RDX  
RSI RDI RBP RSP  
R8  R9  R10 R11  
R12 R13 R14 R15

它们可以按不同宽度访问：

|64 位|32 位|16 位|8 位|
|---|---|---|---|
|RAX|EAX|AX|AL|
|RBX|EBX|BX|BL|
|RCX|ECX|CX|CL|
|RDX|EDX|DX|DL|
|RSI|ESI|SI|SIL|
|RDI|EDI|DI|DIL|
|RBP|EBP|BP|BPL|
|RSP|ESP|SP|SPL|
|R8|R8D|R8W|R8B|
|R9|R9D|R9W|R9B|
|R10|R10D|R10W|R10B|
|R11|R11D|R11W|R11B|
|R12|R12D|R12W|R12B|
|R13|R13D|R13W|R13B|
|R14|R14D|R14W|R14B|
|R15|R15D|R15W|R15B|

老的 4 个寄存器还有高 8 位名字：

AH BH CH DH

例如：

RAX  
 ├─ EAX  低 32 位  
 │   └─ AX   低 16 位  
 │       ├─ AH  AX 的高 8 位  
 │       └─ AL  AX 的低 8 位

一个很重要的规则：**在 x86-64 里，写 32 位寄存器会把对应 64 位寄存器的高 32 位清零。**

比如：

mov eax, 1

执行后：

RAX = 0x0000000000000001

不是只改低 32 位。

但写 16 位或 8 位不会自动清高位：

mov al, 1

只改 `RAX` 的最低 8 位。

---

## 2. 常见通用寄存器传统用途

虽然现代编译器可以灵活分配寄存器，但很多寄存器有传统含义：

|寄存器|常见用途|
|---|---|
|`RAX`|返回值、累加器|
|`RBX`|通用寄存器，常作为 callee-saved|
|`RCX`|计数器、函数参数、shift count 用 `CL`|
|`RDX`|返回值扩展、乘除法高位、函数参数|
|`RSI`|source index，字符串/内存操作源地址|
|`RDI`|destination index，字符串/内存操作目标地址|
|`RBP`|frame pointer，栈帧基址|
|`RSP`|stack pointer，栈顶指针|
|`R8-R15`|x86-64 新增通用寄存器|

比如整数除法会隐式用到 `RAX` / `RDX`：

; unsigned divide: RDX:RAX / r/m64  
div rbx

函数返回值通常放在：

整数/指针返回值：RAX  
较大的返回值：可能用 RAX + RDX，或通过隐藏指针返回

---

## 3. 栈相关寄存器：RSP / RBP

`RSP` 是栈顶指针，几乎不能随便乱用。

push rax    ; RSP -= 8, [RSP] = RAX  
pop rax     ; RAX = [RSP], RSP += 8

`RBP` 传统上作为栈帧基址：

push rbp  
mov rbp, rsp  
sub rsp, 32

然后访问局部变量和参数：

mov rax, [rbp - 8]

但优化编译时，编译器经常省略 frame pointer，把 `RBP` 当普通寄存器用。这通常叫：

-fomit-frame-pointer

---

## 4. 指令指针 RIP

`RIP` 是 instruction pointer，表示下一条要执行的指令地址。

在 x86-64 里，`RIP-relative addressing` 很常见：

mov rax, [rip + some_global]

这对位置无关代码 PIC/PIE 很重要。

你通常不能像普通寄存器一样直接：

mov rip, rax

而是通过跳转、调用、返回来改变它：

jmp label  
call func  
ret

---

## 5. 标志寄存器 RFLAGS

`RFLAGS` 保存条件码和控制标志。

常见标志位：

|标志|含义|
|---|---|
|`ZF`|Zero Flag，结果是否为 0|
|`SF`|Sign Flag，结果符号位|
|`CF`|Carry Flag，无符号进位/借位|
|`OF`|Overflow Flag，有符号溢出|
|`PF`|Parity Flag，奇偶校验|
|`AF`|Auxiliary Carry，BCD 相关，较少用|
|`DF`|Direction Flag，字符串指令方向|
|`IF`|Interrupt Flag，是否允许中断，内核态相关|

比如：

cmp rax, rbx  
je equal        ; ZF = 1 时跳转  
jl less         ; 有符号小于  
jb below        ; 无符号小于

`cmp a, b` 本质上做：

a - b

但不保存结果，只更新 flags。

---

## 6. 调用约定相关寄存器

这个非常重要。不同平台 ABI 不一样。

### Linux/macOS/BSD: System V AMD64 ABI

整数/指针参数顺序：

RDI, RSI, RDX, RCX, R8, R9

返回值：

RAX

caller-saved：

RAX, RCX, RDX, RSI, RDI, R8-R11

callee-saved：

RBX, RBP, R12-R15

也就是说，如果函数要用 `RBX`、`R12` 这些，需要自己保存恢复。

例子：

int add(int a, int b);

在 System V 下：

a -> EDI  
b -> ESI  
返回值 -> EAX

---

### Windows x64 ABI

整数/指针参数顺序：

RCX, RDX, R8, R9

返回值：

RAX

caller-saved：

RAX, RCX, RDX, R8-R11

callee-saved：

RBX, RBP, RDI, RSI, R12-R15

Windows 还有一个很重要的概念：**shadow space**。

调用函数前，caller 要在栈上预留 32 字节：

4 个寄存器参数的 home space

---

## 7. 浮点 / SIMD 寄存器

现代 x86-64 浮点和向量计算主要用 XMM/YMM/ZMM。

|寄存器|位宽|来源|
|---|---|---|
|`XMM0-XMM15`|128 bit|SSE|
|`YMM0-YMM15`|256 bit|AVX|
|`ZMM0-ZMM31`|512 bit|AVX-512|

关系大概是：

ZMM0  512 bit  
 └─ YMM0  低 256 bit  
     └─ XMM0  低 128 bit

在 x86-64 System V ABI 中，浮点参数通常走：

XMM0, XMM1, XMM2, ...

比如：

double f(double a, double b);

通常：

a -> XMM0  
b -> XMM1  
返回值 -> XMM0

常见指令：

addsd xmm0, xmm1   ; scalar double  
addss xmm0, xmm1   ; scalar float  
addps xmm0, xmm1   ; packed float  
vaddps ymm0, ymm1, ymm2

---

## 8. x87 FPU 寄存器

老式浮点单元使用 x87 栈寄存器：

ST0 ST1 ST2 ST3 ST4 ST5 ST6 ST7

它们是栈式的，不是普通寄存器文件：

fld qword ptr [x]  
fld qword ptr [y]  
faddp  
fstp qword ptr [z]

现代编译器一般更偏向 SSE/AVX，除非老 ABI、long double、特殊场景。

---

## 9. MMX 寄存器

MMX 寄存器：

MM0-MM7

它们历史上和 x87 寄存器别名，现代代码很少直接用。一般了解即可。

---

## 10. 段寄存器

x86 有段寄存器：

CS DS ES SS FS GS

在现代 64 位用户态下，大部分段机制基本淡化，但 `FS` 和 `GS` 仍然非常重要。

常见用途：

|寄存器|用途|
|---|---|
|`FS`|Linux 上常用于线程局部存储 TLS|
|`GS`|Linux 内核常用于 per-CPU 数据；Windows 上也常用于 TEB/PEB 相关结构|

比如 Linux x86-64 访问线程局部变量可能通过：

mov rax, qword ptr fs:[offset]

---

## 11. 控制寄存器 CR

控制寄存器主要在内核、OS、虚拟化里用：

CR0 CR2 CR3 CR4 CR8

常见含义：

|寄存器|含义|
|---|---|
|`CR0`|控制保护模式、分页等|
|`CR2`|page fault 发生时的线性地址|
|`CR3`|页表基址，切换地址空间常改它|
|`CR4`|启用各种 CPU 扩展特性|
|`CR8`|task priority register，x86-64 中断优先级相关|

比如 page fault 时，内核会读：

mov rax, cr2

得到导致缺页的地址。

---

## 12. 调试寄存器 DR

调试寄存器：

DR0 DR1 DR2 DR3 DR6 DR7

常用于硬件断点。

|寄存器|用途|
|---|---|
|`DR0-DR3`|断点地址|
|`DR6`|调试状态|
|`DR7`|调试控制|

调试器可以设置硬件 watchpoint，比如“某个地址被写时中断”。

---

## 13. Model-Specific Registers: MSR

MSR 不是普通寄存器，而是通过特殊指令访问：

rdmsr  
wrmsr

常见 MSR：

IA32_EFER  
IA32_STAR  
IA32_LSTAR  
IA32_FMASK  
FS_BASE  
GS_BASE

系统调用、长模式、TLS、内核入口等都和 MSR 有关。

例如 Linux x86-64 的 `syscall` 入口地址通常配置在 `IA32_LSTAR`。

---

## 14. AVX-512 相关 mask 寄存器

AVX-512 引入 opmask 寄存器：

K0 K1 K2 K3 K4 K5 K6 K7

用于向量 mask 操作：

vaddps zmm0 {k1}, zmm1, zmm2

表示只对 mask 中打开的 lane 执行。

---

## 15. 32 位 x86 寄存器

32 位 x86 只有 8 个主要通用寄存器：

EAX EBX ECX EDX  
ESI EDI EBP ESP

对应低 16 位：

AX BX CX DX SI DI BP SP

部分有 8 位：

AL AH  
BL BH  
CL CH  
DL DH

32 位没有 `R8-R15`，寄存器非常紧张，这也是 x86-64 编译后经常比 x86 更快的原因之一：**通用寄存器数量翻倍了**。

---

## 16. 一张总表

|类别|寄存器|
|---|---|
|通用寄存器|`RAX-RDX`, `RSI`, `RDI`, `RBP`, `RSP`, `R8-R15`|
|指令指针|`RIP`|
|标志寄存器|`RFLAGS`|
|SIMD/浮点|`XMM0-XMM31`, `YMM0-YMM31`, `ZMM0-ZMM31`，实际数量取决于模式和硬件|
|x87|`ST0-ST7`|
|MMX|`MM0-MM7`|
|段寄存器|`CS`, `DS`, `ES`, `SS`, `FS`, `GS`|
|控制寄存器|`CR0`, `CR2`, `CR3`, `CR4`, `CR8`|
|调试寄存器|`DR0-DR3`, `DR6`, `DR7`|
|MSR|通过 `rdmsr/wrmsr` 访问|
|AVX-512 mask|`K0-K7`|

---

## 17. 最值得先记的部分

如果你刚开始读 x86-64 汇编，优先记这些：

RAX：返回值  
RDI RSI RDX RCX R8 R9：System V 前 6 个整数参数  
RCX RDX R8 R9：Windows x64 前 4 个整数参数  
RSP：栈顶  
RBP：栈帧，可能被省略  
RIP：当前执行位置  
RFLAGS：条件跳转依赖它  
XMM0-XMM7：常见浮点参数和返回值

对于系统编程，再补：

CR3：页表基址  
CR2：page fault 地址  
FS/GS：TLS / per-cpu  
MSR：syscall、TLS base、内核入口

一句话总结：**普通 C/C++ 函数调用主要关心 GPR、RSP、RIP、RFLAGS、XMM；写 OS 或 runtime 时才会大量接触 CR、MSR、FS/GS、DR 这些特殊寄存器。**