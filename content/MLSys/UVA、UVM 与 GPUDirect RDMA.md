---
title: UVA、UVM 与 GPUDirect RDMA
tags:
  - mlsys
  - cuda
  - gpu
  - rdma
aliases:
  - UVA、UVM、GDR
  - GPUDirect RDMA
created: 2026-08-19
updated: 2026-08-19
---

# UVA、UVM 与 GPUDirect RDMA

把 UVA、UVM 和 GDR（GPUDirect RDMA）放在一起看，关键是区分它们分别回答的问题：

```text
                  GPU 内存相关能力

        地址空间           内存管理           数据传输
           │                  │                  │
           ▼                  ▼                  ▼
         UVA                UVM                GDR
 Unified Virtual       Unified Virtual     GPUDirect RDMA
   Addressing             Memory

 “地址怎么表示？”       “数据放在哪？”       “数据怎么跨机器搬？”
```

| | UVA | UVM | GDR |
|---|---|---|---|
| 全称 | Unified Virtual Addressing | Unified Virtual Memory / Managed Memory | GPUDirect RDMA |
| 解决问题 | 统一编址 | 统一内存管理 | NIC 直接访问 GPU 显存 |
| 主要对象 | CPU/GPU 地址空间 | CPU RAM + GPU VRAM | NIC/HCA + GPU VRAM |
| 会搬数据吗 | 否 | 可能自动迁移 | 是，DMA / RDMA |
| CPU/GPU 共享同一指针 | 提供基础 | 核心使用方式 | 不是重点 |
| 跨机器通信 | 否 | 否 | 是 |
| 典型 API | `cudaMalloc` + UVA | `cudaMallocManaged` | verbs / UCX / NCCL 等 |
| NCCL 中的重要程度 | 基础设施 | 通常不是关键路径 | 跨节点通信的关键路径 |

## UVA：统一“地址”

```cpp
float* p;
cudaMalloc(&p, size);
```

UVA 建立统一的虚拟地址体系：不同地址范围可对应 CPU RAM、GPU 0 VRAM、GPU 1 VRAM。CUDA 因而可由指针值判断它指向哪一类内存、属于哪张 GPU。

```text
        Unified Virtual Address Space

0x1000... ─────→ CPU RAM
0x7000... ─────→ GPU 0 VRAM
0x8000... ─────→ GPU 1 VRAM
```

这也是 `cudaMemcpy(dst, src, size, cudaMemcpyDefault)` 能推断拷贝方向的基础。

> [!important]
> UVA 只回答“地址是什么意思”，不负责把数据搬到别处。CPU RAM 仍是 CPU RAM，GPU VRAM 仍是 GPU VRAM。

## UVA 的底层原理：统一 VA 编号，不是统一页表

UVA 的基础是 64 位进程中足够大的虚拟地址（VA）空间。CUDA driver 在同一个 OS 进程内为 CPU 和每张 GPU 划分互不重叠的 VA 范围；一个指针的数值因此可用于识别其所属位置。

```text
同一进程的 unified virtual address space

CPU range       GPU 0 range        GPU 1 range
0x1000...       0x7000...          0x8000...
    │                │                  │
    ▼                ▼                  ▼
CPU RAM          GPU 0 VRAM         GPU 1 VRAM
```

这里的“统一”是**编号统一**，通常不表示 CPU 和 GPU 真的共用同一张硬件页表：CPU 和每张 GPU 仍各自通过 MMU、页表和 TLB 把 VA 翻译为其可访问的物理地址。[[system-programming/x86 registers|CPU 页表的 CR3]] 是 CPU 一侧页表根的例子。

### `cudaMalloc` 时发生什么

概念上，`cudaMalloc(&p, size)` 会：

1. 在目标 GPU 的 VRAM 中取得物理页；
2. 为它分配一个 GPU VA，例如 `p = 0x7000...`；
3. 在该 GPU 的地址翻译结构中建立 `GPU VA → GPU VRAM` 映射，并由 CUDA driver 保存 allocation metadata。

```text
CPU 线程持有 p = 0x7000...       GPU kernel 使用 p = 0x7000...
              │                                │
              ▼                                ▼
      CPU 页表通常无映射                   GPU MMU / TLB
              │                                │
          不能解引用                            ▼
                                            GPU 页表
                                                │
                                                ▼
                                            GPU 0 VRAM
```

所以 CPU 能把 `p` 传给 CUDA API，却不能直接执行 `p[0] = 1`；后者会访问 CPU 自己的页表中未映射的 GPU VA。反过来，CUDA runtime 可用指针值及 allocation metadata 判定 `cudaMemcpyDefault` 的源、目的位置。

### Host memory、P2P 与 UVM 如何改变映射

- `cudaHostAlloc` / `cudaMallocHost` 分配的 pinned host memory 可被 GPU 映射；在 UVA 下通常可用与 host 相同数值的指针从 kernel 访问。`cudaHostRegister` 注册的既有 host memory 则可能有不同的 device pointer，需要 `cudaHostGetDevicePointer()`。
- `cudaDeviceEnablePeerAccess()` 会让**当前 GPU**建立对 peer GPU allocation 的访问映射；UVA 使两端可使用同一数值的指针，但 P2P 映射和 PCIe/NVLink 拓扑才决定是否真的能直接访问。
- `cudaMallocManaged` 的 UVM 以同一 VA 为基础，但能在运行期间更新映射、处理缺页并迁移物理页。UVA 本身不做这些工作。

> [!warning]
> UVA 不等于 CPU 能访问 `cudaMalloc` 指针，也不等于普通 `malloc` 指针一定可由 kernel 解引用；它首先是地址识别和地址唯一性机制，访问能力取决于具体 mapping、权限与硬件路径。

### 地址空间够用吗？

通常完全够用。64 位指针的理论地址空间是 $2^{64} = 16\ \text{EiB}$；硬件实际可翻译的有效 VA 位数通常小于 64，但即使按 48 位计算也有 $2^{48} = 256\ \text{TiB}$，远大于常见节点的 RAM 与多卡 VRAM 总和。CUDA driver 会在设备支持的有效 VA 范围中进行划分，应用不应依赖某个固定地址段或有效位数。

更重要的是 VA 与物理容量分离：

```text
保留 VA range       → 占用地址编号，不分配 RAM / VRAM
map physical memory  → 建立 VA → PA 映射
cudaMalloc           → 同时需要可用 VRAM
```

CUDA Driver VMM API 中的 `cuMemAddressReserve()` 可只预留地址范围，之后再用 `cuMemMap()` 映射物理 allocation；这正是“地址空间很大、物理内存稀缺”这一分离的显式接口。实际程序更早遇到的通常是 VRAM、RAM、页表/映射资源或 P2P 拓扑限制，而不是 UVA VA 耗尽。

## UVM：统一“内存管理”

```cpp
float* p;
cudaMallocManaged(&p, size);
```

CPU 可以直接写 `p[0] = 1`，GPU kernel 也可使用同一个 `p`。从程序视角看，CPU 和 GPU 使用同一 pointer；从物理位置看，数据页面可能位于 CPU RAM 或 GPU VRAM。

```text
              一个 pointer
                   │
                   ▼
               Virtual Page
                /       \
               /         \
          CPU RAM ←──→ GPU VRAM
                  migration
```

当处理器访问尚未位于合适位置的页面时，CUDA runtime / driver 可参与 page placement、migration 和 page fault 处理。因此 UVM 类似 CPU 虚拟内存的“虚拟页由系统决定放在 RAM 还是 Swap”，只是其候选位置是 CPU RAM 与 GPU VRAM。

> [!tip]
> UVA 是统一地址地图；UVM 则在这张地图之上管理“数据实际住在哪里、是否需要迁移”。

## GDR：NIC 直接搬运 GPU 数据

GDR = GPUDirect RDMA。它不是内存抽象，而是 I/O 数据路径优化：网卡（NIC/HCA）能够通过 DMA 直接读写 GPU 显存。

没有 GDR 时，跨机 GPU 通信通常需要经由两端 CPU RAM 中转：

```text
GPU A → CPU RAM → NIC → Network → NIC → CPU RAM → GPU B
```

有 GDR 时，路径变为：

```text
GPU A → NIC → InfiniBand / Network → NIC → GPU B
```

对一个由 `cudaMalloc` 分配的 GPU buffer，GDR 的概念路径是：

```text
GPU buffer
  │
  ▼
注册 GPU memory
  │
  ▼
RDMA mapping
  │
  ▼
HCA / NIC ── InfiniBand ── HCA / NIC
  │
  ▼
远端 GPU VRAM
```

> [!important]
> GDR 解决的是“网卡怎样不经 CPU RAM、直接读写 GPU page”，而非“这个 page 应放在 CPU 还是 GPU”。

## 三者的关系

```text
                 Application
                      │
                  GPU pointer
                      │
            ┌─────────▼──────────┐
            │        UVA         │
            │   统一虚拟地址空间   │
            └─────────┬──────────┘
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
            UVM               GDR
      管理 page 在哪里       NIC 直接 DMA
             │                 │
      CPU RAM ↔ VRAM       NIC ↔ VRAM
```

UVM 和 GDR 并不是上下层关系：前者决定数据 placement，后者优化 NIC 与 GPU 之间的 I/O 路径。

## 在 NCCL / MLSys 中的理解

如果关注 NCCL、多 GPU 或多节点通信，可以这样组织：

```text
UVA
│
├──── GPU P2P
│       └── 同机 GPU ↔ GPU
│
└──── GPUDirect RDMA
        └── 跨机 GPU ↔ NIC ↔ GPU
```

UVM 更适合减少手工 H2D / D2H 拷贝与管理 CPU/GPU memory placement 的编程负担；而追求确定性、低延迟和极致吞吐的训练或推理通信路径，通常主动控制 GPU memory，而不依赖 UVM 的按页迁移。

可以用“房子”来记：

- **UVA**：为 CPU、GPU 0、GPU 1 的房子建立统一门牌号系统。
- **UVM**：决定物品实际放在哪栋房子，必要时负责搬家。
- **GDR**：让货车（NIC）直接开到 GPU 家门口取货，不经 CPU 的中转仓库。

最终压缩为三句：

> **UVA：Where is the address?** —— 地址怎么统一表示。  
> **UVM：Where is the data?** —— 数据实际放哪、要不要迁移。  
> **GDR：How does the data move?** —— 网卡怎样直接搬 GPU 数据。

这些区分是理解 [[IBGDA]]、[[NIXL]]、NVSHMEM、NCCL 与 IB verbs 中内存注册概念的基础。

## 参考

- [CUDA Programming Guide: Unified Virtual Address Space](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/understanding-memory.html)
- [CUDA Runtime API: Unified Addressing](https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__UNIFIED.html)
- [CUDA Programming Guide: Virtual Memory Management](https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/virtual-memory-management.html)
