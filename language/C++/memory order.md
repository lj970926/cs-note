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