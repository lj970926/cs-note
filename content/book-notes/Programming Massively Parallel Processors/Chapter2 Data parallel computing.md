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

CUDA 采用 **SPMD（Single Program Multiple Data，单程序多数据）**编程模型：多个并行处理单元在不同的数据上执行同一个程序（kernel），但它们在同一时刻**不一定执行同一条指令**。例如，不同线程可以根据自己的 thread ID 处理不同数据，也可能因条件分支而走不同的控制流。

**SIMD（Single Instruction Multiple Data，单指令多数据）**则要求所有处理单元在任意时刻执行同一条指令，只是该指令作用于不同的数据（Flynn, 1972）。

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
