---
title: Chapter2 Data parallel computing
tags:
  - book
  - parallel-computing
  - gpu
  - cuda
aliases:
  - Programming Massively Parallel Processors 第二章
  - PMPP Ch.2
created: 2026-09-03
source: "Programming Massively Parallel Processors: A Hands-on Approach"
---

# Programming Massively Parallel Processors —— Chapter 2 Data Parallel Computing

## CUDA 的线程层级

> When a program’s host code launches a kernel, the CUDA run-time system generates a grid of threads that are organized into a two-level hierarchy. Each grid is organized as an array of thread blocks, which will be referred to as blocks for brevity. All blocks of a grid are of the same size; each block can contain up to 1024 threads.

- **Host code** 是运行在 CPU 上的代码。它通过 kernel launch（例如 `kernel<<<gridDim, blockDim>>>(...)`）请求 GPU 执行一个 kernel。
- 一次 launch 在逻辑上产生一个 **grid**；其层级为 `Grid → Thread Block → Thread`。`gridDim` 指定 block 的数量，`blockDim` 指定每个 block 的线程数量；两者都可以是一、二或三维。
- 同一次 launch 中，每个 block 的 `blockDim` 相同。数据量不能整除 block 大小时，通常仍启动完整的 block，并用 `if (idx < n)` 跳过越界线程；不会为最后一小段数据创建一个更小的 block。
- 一个 block 最多可包含 1024 个线程（也受具体设备能力及 `x`、`y`、`z` 各维度上限约束）。因此，block size 是 kernel 配置和性能调优的重要参数。
- block 是 GPU 调度到 SM 的基本单位；不同 block 默认彼此独立，可以以任意顺序被分配到不同 SM。一个 block 内的线程则可使用 shared memory，并通过 `__syncthreads()` 协作。
- grid/block/thread 是**编程模型中的逻辑组织**，不代表所有线程会同时在物理硬件上运行。GPU 会分批调度 block，而 block 内线程通常以每 32 个线程一个 warp 的粒度执行。

> [!info] CUDA 版本背景
> CUDA 3.0 及之后的版本允许每个 thread block 最多包含 1024 个线程；更早的一些 CUDA 版本只允许最多 512 个线程。这是历史版本差异，实际编程时仍应查询目标设备的能力上限。

### Block 执行顺序不可假设：Kernel 的硬件可扩展性

> Note that all the thread blocks operate on different parts of the vectors. They can be executed in any arbitrary order. Programmers must not make any assumptions regarding execution order. A small GPU with a small amount of execution resources may execute only one or two of these thread blocks in parallel. A larger GPU may execute 64 or 128 blocks in parallel. This gives CUDA kernels scalability in execution speed with hardware, that is, same code runs at lower speed on small GPUs and higher speed on larger GPUs.

- 不同 block 处理向量的不同部分，彼此之间**可以以任意顺序执行**；程序员不能对执行顺序做任何假设。
- 小 GPU 执行资源少，同一时刻可能只能并行执行 1～2 个 block；大 GPU 可能同时执行 64 或 128 个 block。
- 这正是 CUDA kernel 的**硬件可扩展性（scalability）**：同一份代码在小 GPU 上慢、在大 GPU 上快，无需修改。因为编程模型只描述"有多少工作"，block 到 SM 的映射由硬件按自身资源决定。

> [!warning] 顺序假设是隐蔽 bug 的来源
> 一旦代码隐含依赖 block 的执行先后（例如假设 block 0 先写完全局数据、block 1 再读），在小 GPU 上可能"碰巧正确"，换到大 GPU 或不同调度下就会出错。跨 block 的依赖必须用多个 kernel、atomic 或 cooperative groups 显式表达。

### Kernel 内建坐标变量

`blockDim`、`blockIdx` 和 `threadIdx` 是 CUDA kernel（device code）中可直接使用的**内建变量**，不是操作系统意义上的环境变量。CUDA runtime 根据 kernel launch 的配置，为每个正在执行的线程提供这些值。

| 内建变量 | 类型 | 含义 | 取值范围 |
| --- | --- | --- | --- |
| `blockDim` | `dim3` | 当前 block 在 `x`、`y`、`z` 三个维度上的线程数量 | 由 launch 的第二个配置参数指定；同一次 launch 的所有 block 相同 |
| `blockIdx` | `uint3` | 当前 block 在 grid 中的三维坐标 | `0` 到 `gridDim.{x,y,z} - 1` |
| `threadIdx` | `uint3` | 当前线程在所属 block 中的三维坐标 | `0` 到 `blockDim.{x,y,z} - 1` |

三者都有 `.x`、`.y`、`.z` 分量。坐标从 **0** 开始；对于一维 launch，未使用的 `y`、`z` 维度大小默认为 1，对应索引为 0。

#### 一维数据的全局线程索引

```cpp
__global__ void add_one(float* data, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        data[i] += 1.0f;
    }
}

int threads_per_block = 256;
int blocks_per_grid = (n + threads_per_block - 1) / threads_per_block;
add_one<<<blocks_per_grid, threads_per_block>>>(data, n);
```

其中：

- `blockIdx.x * blockDim.x` 是当前 block 覆盖的数据区间的起点；
- `threadIdx.x` 是线程在该 block 内的偏移；
- 两者相加得到线程在整个 grid 中的一维全局索引；
- `if (i < n)` 用于保护最后一个不完整 block 中超出数据范围的线程。

#### Kernel 自动局部变量是每线程私有的

上例中的 `int i` 是 kernel 函数内部声明的 **automatic local variable（自动局部变量）**。从 CUDA 编程模型看，每个线程都有自己独立的 `i`：

- 如果一次 kernel launch 逻辑上创建了 10,000 个线程，就存在 10,000 份彼此独立的 `i`；
- 某个线程对自己 `i` 的赋值不会修改、也不会被其他线程的 `i` 观察到；
- 即使多个线程执行同一条 `int i = ...` 语句，它们操作的仍是各自的线程私有状态；
- 如果线程之间需要交换数据，应显式使用 shared memory、global memory 或 warp 级通信原语，而不能依靠普通局部变量。

> [!note] “10,000 份”描述的是逻辑语义
> 这不意味着 GPU 会提前在某块普通内存中分配 10,000 个 `int`，也不意味着 10,000 个线程同时驻留在硬件上。GPU 会分批调度 block/warp；只有当前 resident 的线程需要占用对应的执行资源，编译器还可能直接消除不必要的局部变量。

自动局部变量的**可见范围是每线程私有**，但实际存储位置由编译器决定：

| 编译结果 | 物理位置与特点 |
| --- | --- |
| 寄存器 | 常见情况；每个 resident 线程占用自己的寄存器，访问速度快 |
| Local memory | 寄存器不足（register spilling）、大型局部数组、动态索引或需要取地址时可能使用；仍然每线程私有，但物理上位于 device memory，并可能经过缓存 |
| 被优化掉 | 如果变量只作为中间表达式且无需独立存储，编译器可能不为它分配实际位置 |

> [!important] Private 是作用域，不等于存储在 local memory
> “局部变量属于每个线程”描述的是可见性和生命周期。它通常优先保存在寄存器中；CUDA 的 **local memory** 之所以叫 local，是因为其作用域属于单个线程，而不是因为它位于片上或访问速度快。

官方说明参见 [CUDA Programming Guide：GPU Device Memory Spaces](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html#gpu-device-memory-spaces) 和 [CUDA Best Practices Guide：Local Memory](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#local-memory)。

#### 二维数据的全局坐标

```cpp
__global__ void process_image(float* image, int width, int height) {
    int x = blockIdx.x * blockDim.x + threadIdx.x;
    int y = blockIdx.y * blockDim.y + threadIdx.y;

    if (x < width && y < height) {
        int offset = y * width + x;
        // 处理 image[offset]
    }
}

dim3 threads(16, 16);
dim3 blocks((width + threads.x - 1) / threads.x,
            (height + threads.y - 1) / threads.y);
process_image<<<blocks, threads>>>(image, width, height);
```

> [!tip] 相关内建变量
> `gridDim` 给出 grid 在各维度上的 block 数量；`warpSize` 给出一个 warp 的线程数。它们与本节三个变量一样，只能直接在 device code 中使用。

官方定义参见 [CUDA Programming Guide：Built-in Types and Variables](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cpp-language-extensions.html)。

#### 这些值在硬件层面存在哪里？

它们不存放在 global、shared 或 local memory 中，也不是普通的 C++ 对象。更准确地说，CUDA C++ 将它们暴露为内建变量，编译器再把读取操作逐层降低为 GPU 的**只读特殊寄存器接口**：

```text
CUDA C++ 内建变量
        ↓
NVVM special-register intrinsic
        ↓
PTX 只读 special register
        ↓
SASS 读取特殊执行状态
        ↓
普通通用寄存器参与后续计算
```

CUDA C++ 与 PTX 的主要对应关系如下。PTX 中的 **CTA（Cooperative Thread Array）**对应 CUDA 中的 thread block。

| CUDA C++ | PTX special register | 含义 |
| --- | --- | --- |
| `threadIdx.{x,y,z}` | `%tid.{x,y,z}` | 当前线程在 CTA 内的坐标 |
| `blockDim.{x,y,z}` | `%ntid.{x,y,z}` | CTA 在各维度的线程数量 |
| `blockIdx.{x,y,z}` | `%ctaid.{x,y,z}` | 当前 CTA 在 grid 中的坐标 |
| `gridDim.{x,y,z}` | `%nctaid.{x,y,z}` | grid 在各维度的 CTA 数量 |

例如，下面的 CUDA C++ 表达式：

```cpp
int i = blockIdx.x * blockDim.x + threadIdx.x;
```

在 PTX 层概念上类似：

```ptx
mov.u32     %r1, %ctaid.x;
mov.u32     %r2, %ntid.x;
mov.u32     %r3, %tid.x;
mad.lo.u32  %r4, %r1, %r2, %r3;
```

这里的 `mov` 不是从内存加载，而是把特殊寄存器值读入普通寄存器。到具体 GPU 的 SASS 机器码后，常见形式是用 `S2R`（Special Register to Register）指令读取类似 `SR_CTAID.X`、`SR_NTID.X` 和 `SR_TID.X` 的状态；确切指令与优化结果取决于 GPU 架构和编译器。

这些值在 kernel 启动和调度过程中产生：

- `blockDim` 来自 `kernel<<<grid, block>>>` 的 launch 配置；
- `blockIdx` 在某个 block/CTA 被调度执行时确定，同一 block 内的线程看到相同的值；
- `threadIdx` 来自线程在 block 内的身份，不同线程看到不同的值；
- 编译器读取这些特殊状态后，可能将结果保存在普通寄存器中复用，也可能合并或消除不必要的读取。

> [!important] 是硬件特殊寄存器，但要注意抽象层次
> 可以把这些内建变量理解为硬件特殊寄存器：PTX 明确定义了 `%tid`、`%ntid`、`%ctaid` 等只读 special register，实际机器码也通常通过特殊寄存器读取指令取得它们。不过 CUDA/PTX 保证的是这个**架构接口及其行为**，并不保证芯片内部一定为每个值设置独立的物理寄存器；底层也可能由调度器状态或线程元数据实现。

它们也不是通常意义上的“编译时常量替换”。编译器会把 `threadIdx.x` 等名字替换为特殊寄存器读取操作，但不会通常替换成固定数字：同一个已编译 kernel 可以用不同的 block size 启动，而且不同线程和 block 必须分别看到自己的索引。只有编译器能够证明具体数值时，才可能进一步做常量折叠。

底层定义参见 [PTX ISA：Special Registers](https://docs.nvidia.com/cuda/parallel-thread-execution/index.html#special-registers)。

### Block size 与 warp 对齐

出于硬件执行效率的考虑，**一个 thread block 的线程总数通常选择为 32 的倍数**。CUDA 会将 block 中的线程按每 32 个组成一个 warp；如果线程总数不是 32 的倍数，最后一个 warp 会有一部分 lane 没有对应的有效线程，可能造成执行资源浪费。关于 warp 的执行模型与 lane，可参见 [[MLSys/算子/Warp Shuffle]]。

对于三维 block，线程总数为：

$$
N_{\text{threads}} = \text{blockDim.x} \times \text{blockDim.y} \times \text{blockDim.z}
$$

> [!warning] 不是每个维度都必须是 32 的倍数
> 原文的 “the number of threads in each dimension ... should be multiples of 32” 容易被理解为 `blockDim.x`、`blockDim.y` 和 `blockDim.z` 都必须是 32 的倍数。更准确的经验是让**线程总数**成为 32 的倍数。例如，`dim3(16, 16)` 的两个维度都不是 32 的倍数，但总线程数是 $16 \times 16 = 256$，仍可完整组成 8 个 warp；`dim3(32, 8)` 同样包含 256 个线程。

32 的倍数只是 block size 的基础经验，并不保证性能最优。实际配置还要综合数据布局与内存访问方式、寄存器和 shared memory 用量、occupancy，以及目标 GPU 的资源限制。

### 从顺序循环到线程网格：Loop Parallelism

> “The loop is now replaced with the grid of threads.”

教材比较顺序版本与 CUDA 版本后指出：原来由 `for` 循环表达的**迭代空间**，在 CUDA 中可以改由整个线程网格表达；最直接的映射是每个逻辑线程负责原循环的一次迭代。这种数据并行形式也称为 **loop parallelism（循环并行）**。

顺序 CPU 版本：

```cpp
for (int i = 0; i < n; ++i) {
    output[i] = input[i] * 2.0f;
}
```

对应的 CUDA 版本：

```cpp
__global__ void scale(const float* input, float* output, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        output[i] = input[i] * 2.0f;
    }
}

int threads = 256;
int blocks = (n + threads - 1) / threads;
scale<<<blocks, threads>>>(input, output, n);
```

两种写法的对应关系为：

| 顺序循环 | CUDA 线程网格 |
| --- | --- |
| 循环的第 `i` 次迭代 | 全局编号为 `i` 的逻辑线程 |
| 循环变量 `i` | `blockIdx.x * blockDim.x + threadIdx.x` |
| 循环体 | 每个线程执行的 kernel 函数体 |
| 循环上界 `n` | launch 的 grid 大小与 `if (i < n)` 边界检查 |
| CPU 依次推进迭代 | GPU 将 block/warp 分配到 SM 并分批执行 |

> [!important] 不是硬件暗中执行原来的 `for` 循环
> “线程网格替代循环”描述的是编程模型和工作划分的等价关系，不是说 GPU 内部藏着一个循环替程序员逐次执行。通常是程序员把循环显式改写为 kernel 与 launch；runtime/driver 提交逻辑线程网格，硬件再把 block 拆成 warp，并在有限的 SM 上并行或分批调度。所有逻辑线程也不需要同时驻留。

#### 为什么这给了硬件更大的调度自由度？

顺序循环把迭代顺序写成 `0 → 1 → 2 → ...`；线程网格则主要描述“有哪些工作”以及它们如何分组。只要各次迭代彼此独立，CUDA 就不要求不同 block 按固定顺序执行，因此调度器可以：

- 把 block 分配给任意有可用资源的 SM；
- 按任意顺序启动不同 block；
- 在某个 warp 等待数据时改为执行其他 ready warp；
- 当逻辑线程数超过物理执行资源时，将它们分成多批执行；
- 让同一个 kernel 在具有不同 SM 数量和资源规模的 GPU 上运行。

这可以理解为“相信硬件”，但更准确地说是**把工作定义与执行调度分离**。双方的职责仍然不同：

| 程序员负责 | CUDA runtime / 硬件负责 |
| --- | --- |
| 将问题拆成 grid、block 和 thread | 将 block 映射到具体 SM |
| 保证允许重排的迭代之间没有非法依赖 | 选择和切换 ready warp |
| 选择 block size、数据布局和访存方式 | 在资源约束下安排 resident block/warp |
| 处理边界、同步、原子操作和跨阶段依赖 | 分批执行超过物理容量的逻辑线程 |
| 减少分支发散与低效内存访问 | 利用大量可运行 warp 隐藏部分延迟 |

> [!note] 调度自由来自独立性契约
> 程序员实际告诉 GPU 的是：“这些 block 可以按任意顺序执行，结果仍然正确。”如果不同工作之间存在依赖，就必须通过 shared memory、同步、atomic、cooperative groups，或者拆分为多个 kernel 来显式表达，不能依赖 block 的执行先后顺序。

#### Kernel 仍然可以包含循环

“一个线程对应一次迭代”是最直观的映射，但不是 CUDA 的强制规则。常见的 **grid-stride loop** 会让每个线程处理多次迭代：

```cpp
__global__ void scale(const float* input, float* output, int n) {
    for (int i = blockIdx.x * blockDim.x + threadIdx.x;
         i < n;
         i += blockDim.x * gridDim.x) {
        output[i] = input[i] * 2.0f;
    }
}
```

此外，单个线程内部的串行计算、tile 内的数据处理和每线程负责多个元素时，也都会继续使用循环。线程网格取代的是适合并行展开的那一层外部循环，而不是消灭所有循环。进一步的数据分块与复用参见 [[MLSys/算子/CUDA Tiling]]。

## CUDA 函数执行空间限定符

CUDA C++ 使用函数限定符（execution space specifier）说明函数**在哪里执行**以及**可以从哪里调用**。教材 Figure 2.13 中的三个基本限定符如下：

| 函数限定符 | 执行位置 | 通常从哪里调用 | 调用方式 |
| --- | --- | --- | --- |
| `__host__`，或不写限定符 | CPU / host | host | 普通函数调用 |
| `__device__` | GPU / device | `__device__` 或 `__global__` 函数 | device code 中的普通函数调用 |
| `__global__` | GPU / device | 通常由 host 调用；动态并行时也可由 device 调用 | 使用 `<<<grid, block>>>` 启动 kernel |

### `__host__`：普通 CPU 函数

```cpp
__host__ float host_func(float x) {
    return x + 1.0f;
}
```

`__host__` 函数在 CPU 上执行，并从 host code 调用。如果函数没有写 `__host__`、`__device__` 或 `__global__`，默认就是 host 函数，因此通常省略 `__host__`。

### `__device__`：GPU 上的辅助函数

```cpp
__device__ float square(float x) {
    return x * x;
}

__global__ void apply_square(float* data, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        data[i] = square(data[i]);
    }
}
```

`__device__` 函数在 GPU 上执行，只能从 device code 调用，例如从 kernel 或另一个 `__device__` 函数中调用。它可以像普通函数一样返回值，不使用 `<<<...>>>` 启动。

### `__global__`：kernel 入口

```cpp
__global__ void kernel_func(float* data, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) {
        data[i] += 1.0f;
    }
}

// host code
kernel_func<<<blocks_per_grid, threads_per_block>>>(data, n);
```

`__global__` 声明的是 CUDA kernel：函数体在 GPU 上执行，但普通情况下由 CPU 上的 host code 使用 execution configuration `<<<grid, block>>>` 发起。它有几个重要特点：

- 返回类型必须是 `void`，计算结果需要通过指针参数写入 device memory；
- 调用时必须提供 execution configuration；
- kernel launch 对 host 通常是异步的：launch 返回不代表 GPU 已经执行完毕；
- 在支持并启用 **CUDA Dynamic Parallelism** 时，一个 kernel 也可以从 device 端启动另一个 `__global__` kernel，这是教材表格中“只能从 host 调用”的例外。

> [!important] 调用边界
> host 不能像普通函数一样直接调用 `__device__` 函数，device code 也不能直接调用只标记为 `__host__` 的函数。`__global__` kernel 是 host 向 device 提交并行工作的主要入口。

### `__host__ __device__`：同时生成 CPU 与 GPU 版本

```cpp
__host__ __device__ float clamp_zero(float x) {
    return x < 0.0f ? 0.0f : x;
}
```

两个限定符可以组合使用。编译器会分别生成 host 版本和 device 版本，使函数能在两侧调用；但函数体必须能够在两个执行环境中成立。需要区分两条编译路径时，可以使用 `__CUDA_ARCH__` 条件编译。

> [!warning] 函数与变量上的 `__device__` 含义不同
> 本节讨论的是**函数限定符**。当 `__device__` 用于命名空间或文件作用域变量时，它是 memory space specifier，表示变量位于 device global memory；不要和 `__device__` 函数混为一谈。

官方定义参见 [CUDA Programming Guide：Execution Space Specifiers](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cpp-language-extensions.html#execution-space-specifiers)。

## SPMD 与 SIMD 的区别

CUDA 采用 **SPMD（Single Program Multiple Data，单程序多数据）** 编程模型：多个并行处理单元在不同的数据上执行同一个程序（kernel），但它们在同一时刻**不一定执行同一条指令**。例如，不同线程可以根据自己的 thread ID 处理不同数据，也可能因条件分支而走不同的控制流。

**SIMD（Single Instruction Multiple Data，单指令多数据）** 则要求所有处理单元在任意时刻执行同一条指令，只是该指令作用于不同的数据（Flynn, 1972）。

| 对比维度 | SPMD | SIMD |
| --- | --- | --- |
| 共享的内容 | 同一个程序 | 同一时刻的同一条指令 |
| 处理的数据 | 多份不同数据 | 多份不同数据 |
| 同一时刻的指令 | 可以不同 | 必须相同 |
| 关注层次 | 程序组织方式 | 指令执行方式 |

> [!important] 关键区别
> “执行同一个程序”不等于“每一时刻都执行同一条指令”。SPMD 描述的是并行任务如何组织程序，SIMD 描述的是处理单元如何同步执行指令，因此二者不能等同。

> [!note] 与上一章的联系
> 这里的层级解释了 [[book-notes/Programming Massively Parallel Processors/Chapter 1 Introduction|第一章]]所说的“GPU 用大量线程提高吞吐量”：程序员先把数据映射到逻辑线程，再由硬件把 block 和 warp 调度到 SM 上执行。
