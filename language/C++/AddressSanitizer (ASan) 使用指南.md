---

title: AddressSanitizer (ASan) 使用指南 tags:

- debugging
- 内存安全
- sanitizer
- cpp created: 2026-05-29

---

# AddressSanitizer (ASan) 使用指南

AddressSanitizer(简称 ASan)是 Clang / GCC 内置的内存错误检测器,通过在编译期插桩 + 运行时库的方式,在程序实际触发内存错误的那一刻精确定位问题。它是排查 C/C++ 内存 bug 最高效的工具之一。

> [!tip] 一句话定位 编译时加 `-fsanitize=address -g`,正常跑程序,出错时 ASan 会打印**出错位置 + 分配位置 + 调用栈**,把"段错误在哪"变成"哪一行越界、那块内存是谁分配的"。

## 一、它能检测什么

- **堆缓冲区溢出**(heap buffer overflow)——读写越过 `malloc`/`new` 分配的边界
- **栈缓冲区溢出**(stack buffer overflow)——越过局部数组边界
- **全局缓冲区溢出**(global buffer overflow)
- **释放后使用**(use-after-free / 悬垂指针)
- **返回后使用**(use-after-return,需开运行时选项)
- **作用域结束后使用**(use-after-scope,需 `-fsanitize-address-use-after-scope`)
- **重复释放 / 释放非法指针**(double-free / invalid free)
- **内存泄漏**(通过内置的 LeakSanitizer,见下)

> [!warning] 它检测不了什么 ASan 抓的是**空间和生命周期**类错误。它**不能**检测:数据竞争(那是 ThreadSanitizer 的活)、未初始化内存读取(MemorySanitizer)、整数溢出 / UB(UndefinedBehaviorSanitizer)。

## 二、基本用法

### 编译开启

```bash
# Clang 或 GCC 通用
clang -fsanitize=address -g -O1 foo.c -o foo
# C++
clang++ -fsanitize=address -g -O1 foo.cpp -o foo
```

> [!note] 关键编译选项说明
> 
> - `-fsanitize=address`:开启 ASan,**编译和链接都要带上**这个 flag。
> - `-g`:保留调试信息,报错才能显示文件名和行号。
> - `-O1`:推荐的优化级别,比 `-O0` 快且报告依然准确;过高的优化可能影响栈错误的检测。
> - `-fno-omit-frame-pointer`:让调用栈更完整可靠,建议加上。

### 直接运行

```bash
./foo
```

不需要额外启动器,正常运行即可。一旦命中内存错误,ASan 立刻中止程序并打印报告。

## 三、读懂报错输出

一份典型的 heap-use-after-free 报告结构如下:

```
==12345==ERROR: AddressSanitizer: heap-use-after-free on address 0x...
READ of size 4 at 0x... thread T0
    #0 0x... in main foo.c:10        <- 出错的那一行
    ...
freed by thread T0 here:             <- 这块内存是在哪里被 free 的
    #0 0x... in free
    #1 0x... in main foo.c:9
previously allocated by thread T0 here:   <- 这块内存最初在哪里分配的
    #0 0x... in malloc
    #1 0x... in main foo.c:8
```

> [!info] 三段式定位法 ASan 报告的精髓就在这三段:**出错点 → 释放点 → 分配点**。把这三处连起来,内存的"一生"就清楚了,根因往往一眼可见。

## 四、运行时选项 `ASAN_OPTIONS`

通过环境变量调整行为,无需重新编译:

```bash
# 检测内存泄漏(Linux 默认开,macOS 需手动开)
ASAN_OPTIONS=detect_leaks=1 ./foo

# 检测 use-after-return
ASAN_OPTIONS=detect_stack_use_after_return=1 ./foo

# 第一个错误后继续运行(默认遇错即停)
ASAN_OPTIONS=halt_on_error=0 ./foo

# 把报告写到文件
ASAN_OPTIONS=log_path=./asan.log ./foo

# 多个选项用冒号分隔
ASAN_OPTIONS=detect_leaks=1:halt_on_error=0:verbosity=1 ./foo
```

常用项速记:`detect_leaks`(泄漏检测)、`halt_on_error`(遇错是否停)、`log_path`(日志路径)、`abort_on_error`(用 abort 而非 exit,便于 core dump)、`symbolize`(符号化栈,默认开)。

## 五、macOS 上的注意事项

> [!warning] macOS 与 Linux 的差异
> 
> - **泄漏检测**:LeakSanitizer 在 macOS 上的支持不如 Linux 完整,`detect_leaks` 在部分 macOS 版本上可能不可用或行为不同。检测泄漏时,Instruments 的 Leaks 模板或命令行 `leaks` 往往更可靠。
> - **符号化**:确保 Xcode Command Line Tools 已安装,ASan 依赖 `atos` / `llvm-symbolizer` 来把地址翻译成行号。若栈只显示地址没有行号,通常是符号化工具没找到。
> - **Xcode 集成**:直接在 Scheme → Diagnostics 里勾选 "Address Sanitizer" 即可,不用手敲 flag。

## 六、性能开销

> [!note] 代价 ASan 大约带来 **2 倍左右的运行变慢**和**约 2~3 倍的内存占用**(因为要维护 shadow memory 影子内存来记录每块地址的可用状态)。这个开销适合开发和测试阶段,**不要在生产环境开启**。

## 七、与其他 Sanitizer 的关系

|Sanitizer|flag|检测目标|
|---|---|---|
|ASan|`-fsanitize=address`|越界、UAF、double-free、泄漏|
|TSan|`-fsanitize=thread`|数据竞争、死锁|
|UBSan|`-fsanitize=undefined`|未定义行为(整数溢出、空指针解引用等)|
|MSan|`-fsanitize=memory`|未初始化内存读取(仅 Clang)|

> [!danger] 不能同时使用的组合 **ASan 和 TSan 不能同时开启**(影子内存机制冲突)。要分别编译两份来跑。 ASan 可以和 **UBSan 组合**使用:`-fsanitize=address,undefined`,这是很常见的搭配。

## 八、常见坑

- **链接时漏了 flag**:只在编译加 `-fsanitize=address`、链接没加,会报一堆 undefined symbol。编译和链接都要带。
- **没加 `-g` 导致没行号**:报告里全是地址,定位困难。
- **第三方库没插桩**:bug 出在没用 ASan 编译的库里时,栈可能不完整。理想情况是整个工程统一开 ASan 编译。
- **误以为能抓数据竞争**:多线程偶现的崩溃,如果 ASan 查不出来,换 [[ThreadSanitizer (TSan) 使用]]。

## 速查清单

> [!summary] 用 ASan 排查内存 bug 的标准流程
> 
> 1. 编译加 `-fsanitize=address -g -O1 -fno-omit-frame-pointer`(编译 + 链接都加)
> 2. 正常运行程序,复现问题
> 3. 读报告的**三段**:出错点 → 释放点 → 分配点
> 4. 需要查泄漏:`ASAN_OPTIONS=detect_leaks=1`(macOS 优先用 Instruments)
> 5. 需要查 use-after-return:`ASAN_OPTIONS=detect_stack_use_after_return=1`
> 6. 怀疑是数据竞争而非内存越界 → 改用 TSan

---
