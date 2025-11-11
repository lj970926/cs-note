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