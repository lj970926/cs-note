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
