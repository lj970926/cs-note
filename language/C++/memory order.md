<iframe src="https://www.ramtintjb.com/blog/memory-ordering" allow="fullscreen" allowfullscreen="" style="height:100%;width:100%; aspect-ratio: 16 / 9; "></iframe>

https://www.ramtintjb.com/blog/memory-ordering

C++一共有三种memory order：
# 1. sequence consistence
最强的memory order，所有线程获得全局一致的访存序列(同一时刻所有线程看到的是相同的内存)，禁止处理器和编译器重排。具体地，对于arm等weakly order平台，一个seq_cst的atomic store对应以下指令序列：
```armasm
; counter.store(10, std::memory_order_seq_cst);
dbm ish
movs r2, #10
dmb ish
```
可以看到，这里在访存指令的前后都添加了memory barrider。对于strongly order平台（x86），需要先mov指令后额外使用xchg等指定确保全局一致性。
# 2. relaxed
最弱的memory order，只保证原子性，允许编译器和处理器重排。对于strongly order和weakly order，不会有任何额外的barrier overhead。

```c++
// Thread 1
nonAtomicNum = 20
atomicNum.store(40, std::memory_order_relaxed);
flag.store(true, std::memory_order_relaxed); // A

// Thread 2
while (!flag.load(std::memory_order_relaxed)); // B
assert(nonAtomicNum == 20); // May fires
assert(atomicNum.load(std::memory_order_relaxed) == 40); // May fires
```

主要问题在于，类似上面的情况下，line8和line9的两个assert是有失败概率的，因为relaxed order并未保证thread 1中的三个访存指令被thread2看到的先后顺序，当flag.store在前两个访存指令之前发生时，后面两个assert会失败。
# 3. acquire/release
介于1和2的中间态，需要在store的时候指定release，在load的时候指定acquire。该model能保证release线程中的所有代码中在前的访存操作，在release操作完成时对于acquire线程已经全部执行完，同时acquire操作之后的所有访存均严格发生在acquire之后。但对于其他非acquire，并没有这种保证。
```c++
// Thread 1
nonAtomicNum = 20
atomicNum.store(40, std::memory_order_relaxed);
flag.store(true, std::memory_order_release); // A

// Thread 2
while (!flag.load(std::memory_order_acquire)); // B
assert(nonAtomicNum == 20); // Never fires
assert(atomicNum.load(std::memory_order_relaxed) == 40); // Never fires
```
同样是类似的2中的代码，由于添加了flag的acquire/release，上述代码不会存在assert fail。
对于x86等strongly order平台，acquire/release和relaxed在指定层面是相同的，没有额外开销。对于arm等weakly order平台，需要在release前插入memory barrier以确保前面的访存执行完。在acquire后添加barrier以确保后续的访存操作能看到acquire的结果
# 同一个线程里面前面的语句可能在下一条语句后面执行吗？由于处理器和编译器的重排？
好问题，这里要把两个层面分清楚：**「实际发生了什么」** 和 **「你能不能观察到」**。

## 单线程视角：你永远观察不到重排

C++ 有一条铁律，叫 **as-if 规则**（标准里也叫 "sequenced-before" 配合可观察行为）：

> 编译器和处理器可以任意重排、合并、消除操作，**只要单线程程序的可观察行为（observable behavior）不变**。

所以在**单线程内、并且只看这个线程自己**的时候，答案是：**不会**。你写

```cpp
a = 1;   // (1)
b = 2;   // (2)
```

从这个线程自己的角度，结果永远等价于「先 1 后 2」。哪怕底层真的乱序了，你也绝对观察不到 `a` 还没被赋值就执行了依赖 `a` 的逻辑。这就是为什么单线程程序员根本不需要关心重排——语言给了你顺序执行的**假象**，而且这个假象在单线程里是滴水不漏的。

## 但底层「实际」确实在重排

你的直觉是对的——物理上，编译器和 CPU 真的会让 (2) 的某些效果先于 (1) 完成。比如：

**编译器层面：** 如果 `a` 和 `b` 是无关的普通变量，编译器完全可能调整指令顺序、把它们放进寄存器延迟写回内存、甚至如果发现 `a=1` 后面又被覆盖就直接删掉。

**CPU 层面：** 即使编译器生成的指令是「先存 a 再存 b」，CPU 的 store buffer、乱序执行、缓存系统也可能让 `b` 的写入先到达内存/对其他核可见。x86 相对保守（store-store 不重排），但 ARM、Power 这些弱内存模型架构重排得很凶。

## 关键：单线程的假象，在多线程下破裂

这就接上了前面聊的 happens-before。重排在单线程里被完美隐藏，但**另一个线程**可以「偷看」到这种乱序：

```cpp
int a = 0, b = 0;

// 线程 1
a = 1;   // (1)
b = 2;   // (2)

// 线程 2
if (b == 2)        // 看到 b 已经是 2
    assert(a == 1); // 不保证成立！可能看到 a 还是 0
```

线程 2 可能观察到 `b == 2` 但 `a == 0`——因为对线程 2 来说，(1) 和 (2) 的到达顺序没有任何保证。线程 1 自己永远看不到这个矛盾，但线程 2 能。

所以更精确的说法是：

- **「前面的语句可能在后面的语句之后实际执行」——是的，物理上会发生。**
- **「同一个线程能否观察到这种倒置」——不能，as-if 规则保证。**
- **「别的线程能否观察到」——能，除非你用同步手段（原子、锁等）建立 happens-before。**

## 有依赖时连物理重排都不允许

还要补一点：如果两条语句之间有**数据依赖**或**可观察的副作用依赖**，那连底层都不能真正乱序（或者必须保证结果一致）：

```cpp
a = 1;
b = a + 1;   // 依赖 a，b 必须看到 a==1
```

这里 (2) 读了 (1) 的结果，所以无论编译器还是 CPU，都必须保证 `b` 算出来是 2。重排只发生在**互不依赖**的操作之间。

## 一句话总结

重排在硬件和编译器层面真实存在，但 C++ 用 as-if 规则保证它对**单线程自身完全透明**；这个透明性**不延伸到其他线程**，所以多线程下你必须靠原子和锁来重新建立顺序保证。换句话说：单线程的「顺序执行」是一个语言精心维护的、对自己绝对可靠、对别人不作数的承诺。

# Release Sequence
好问题，x86 是讲这个的绝佳例子，因为它的硬件内存模型很强，导致 acquire/release 在 x86 上几乎「免费」。

## 先说 x86 的硬件内存模型：TSO

x86（含 x86-64）用的是 **TSO（Total Store Order）**，是一种相当强的内存模型。它默认就保证了：

- **Load-Load 不重排**（读不会越过读）
- **Load-Store 不重排**（读不会越过后面的写）
- **Store-Store 不重排**（写不会越过写）
- **唯一允许的重排：Store-Load**，即一个写可以被推迟到后面的读之后变得可见。这正是 store buffer 造成的——写先进 store buffer，后面的读可以先从缓存/内存拿数据。

关键结论：x86 硬件**天然就提供了 acquire 和 release 语义**，因为 acquire（读之后的操作不能上移）和 release（写之前的操作不能下移）需要禁止的，恰好都不在 x86 允许重排的那一项里。

## 对应的底层指令

**普通 load / store 本身就够了**——不需要任何特殊屏障指令。

```cpp
std::atomic<int> x;

x.load(std::memory_order_acquire);   // 编译成普通的 MOV（读）
x.store(1, std::memory_order_release); // 编译成普通的 MOV（写）
x.load(std::memory_order_relaxed);   // 同样是普通 MOV
x.store(1, std::memory_order_relaxed); // 同样是普通 MOV
```

也就是说在 x86 上，`relaxed`、`acquire`、`release`、`acq_rel` 的**纯 load 和纯 store**，生成的机器码是**完全一样的**——都是普通 `mov`。区别只存在于**编译器层面**：内存序会限制**编译器**的重排和优化，但不需要插入任何硬件屏障指令。

这就是为什么在 x86 上「acquire/release 是免费的」这个说法成立——运行时零开销，唯一的约束发生在编译期。

## seq_cst 才是要付费的那个

差异出现在 `seq_cst`，因为它要禁止那个唯一被允许的 Store-Load 重排。通常的做法是在 **store** 上加屏障：

```cpp
x.store(1, std::memory_order_seq_cst);
```

常见编译成：

```asm
; 方式一（GCC/Clang 常用）：用带 lock 前缀的 xchg
mov  eax, 1
xchg eax, [x]      ; xchg 隐含 lock，是一个 full barrier

; 方式二：普通 mov + 显式 full fence
mov  [x], 1
mfence             ; 刷 store buffer，禁止 store-load 重排
```

而 seq_cst 的 **load** 仍然是普通 `mov`（因为屏障已经由 store 那侧负担了）。这是一种常见的非对称实现：把全部开销放在 store 上，load 保持便宜。注意 ABI 约定要求编译器对 store 和 load 的实现方式配套，不能一边用旧约定一边用新约定。

`mfence` 和 `lock` 前缀指令（`xchg`、`lock add` 等）都是 **full barrier**——它们会把 store buffer 排空，连唯一允许的 Store-Load 重排也禁掉，从而恢复顺序一致性。

## RMW 操作

读-改-写（`fetch_add`、`compare_exchange`、`exchange` 等）在 x86 上无论什么内存序，本来就要用 `lock` 前缀指令（`lock add`、`lock cmpxchg`、`xchg`）来保证原子性，而 `lock` 前缀**本身就是 full barrier**。所以在 x86 上，RMW 操作的不同内存序之间机器码差异也很小——硬件已经顺带给了你最强的序。

## 小结对照表

|操作|x86 指令|运行时开销|
|---|---|---|
|load relaxed/acquire/seq_cst|普通 `MOV`|零|
|store relaxed/release|普通 `MOV`|零|
|store seq_cst|`XCHG` 或 `MOV + MFENCE`|有（full barrier）|
|RMW（任何序）|`LOCK` 前缀指令|有（full barrier，原子性本来就需要）|

## 对比一下弱内存架构

这也解释了为什么 acquire/release 的设计在 x86 上看不出价值，到了 **ARM / AArch64 / Power** 才显出区别。那些架构是弱内存模型，几乎所有重排都允许，所以：

- acquire load 要用 `ldar`（或 `ldapr`），release store 要用 `stlr`
- relaxed 才是普通 `ldr`/`str`
- 不同内存序生成**真的不同**的指令，开销差异明显

所以你写 acquire/release 而不是无脑 seq_cst，**在 x86 上几乎没区别，但写出来的代码移植到 ARM 上能省下实打实的屏障开销**——这正是用精确内存序而非默认 seq_cst 的意义所在。

如果你想，我可以把同一段 release/acquire 代码在 x86 和 ARM64 下的实际汇编对照贴出来，差异会非常直观。