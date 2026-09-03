---
title: CUDA Tiling
tags:
  - cuda
  - gpu
  - mlsys
  - kernel
aliases:
  - CUDA 分块
  - tiling
created: 2026-09-03
---

# CUDA Tiling

Tiling（分块）是把大问题切成能放进片上存储的小块、逐块处理的通用 GPU 优化手段。核心动机是**显存带宽远落后于算力**：通过分块换取数据复用、延迟隐藏和并行度，把 memory-bound 的 kernel 变成 compute-bound。

## 1. 数据复用：把 global memory 访问换成 shared memory 访问

最经典的作用。以矩阵乘法为例：朴素实现中每个输出元素都要从 global memory 读一整行 A 和一整列 B，$O(N^3)$ 次计算对应 $O(N^3)$ 次显存访问，很快撞上 DRAM 带宽上限。把 A、B 切成小块搬进 shared memory 后，块内数据被 block 内所有线程反复复用，显存访问量降为 $O(N^3 / T)$（$T$ 是 tile 边长）。

[[book-notes/Programming Massively Parallel Processors/Chapter 1 Introduction|PMPP 读书笔记]]中的表述：

> 直接把循环拆给 GPU，常常会很快撞上 DRAM 带宽上限。进一步优化通常需要利用片上存储进行数据复用，减少 global memory 访问；但片上存储容量有限，又会引入新的布局、分块和同步约束。

## 2. 让"装不下"的问题变得可解（工作集裁剪）

Shared memory 和寄存器都很小（几十 KB ~ 几百 KB / SM），完整矩阵根本放不下。Tiling 把问题切成能放进片上存储的小块逐块处理——这不仅是性能手段，很多时候是**可行性**手段。比如 FlashAttention 能处理超长序列，靠的就是从不物化完整的 $S \times S$ attention 矩阵。

## 3. IO 感知：配合在线归约，用计算换显存 IO

[[paper/FlashAttention- Fast and Memory-Efficient Exact Attention with IO-Awareness|FlashAttention]] 是 tiling 思想的集大成者：

- 外层循环加载 K/V 分块，内层加载 Q 分块，在 SRAM 里算局部 attention；
- 配合 **online softmax**，每行维护当前最大值，逐块动态修正局部结果，最终写出精确结果；
- 把 attention 的显存复杂度从 $O(S^2)$ 降到 $O(S)$，同时实测更快——因为 HBM IO 才是瓶颈，不是 FLOPs。

[[MLSys/算子/多头潜在注意力 (MLA)|MLA]] 的 MHA 形式在长 prefill 下可行，同样因为 FlashAttention 可以分块在片上消费临时展开的 K/V，而无需物化完整 attention 矩阵。

## 4. 并行化与任务划分

- **Block 级并行**：tiling 天然给出 thread block 的划分方式，每个 block 独立处理一个输出 tile，是 CUDA 编程模型的标准映射。
- **流水与延迟隐藏**：现代 kernel（CUTLASS、Triton）用 multi-stage tiling，在计算第 i 块的同时异步预取第 i+1 块（`cp.async` / TMA），把显存延迟藏在计算后面。
- **顺序/递推问题的并行**：[[MLSys/算子/Linear Attention|Linear Attention]] 的 **chunk parallel** 也是 tiling——把序列分块，块内并行、块间只传很小的状态，把原本串行的 RNN 式递推变成可并行计算。

## 5. 访存局部性与 coalescing

Tile 的形状和加载方式可以设计成让 warp 内线程连续访存（coalesced），并配合 padding 消除 shared memory bank conflict。行/列主序不同时还需要在 tile 加载时做转置，见[[MLSys/算子/行主序与列主序 (row-major 与 column-major)|行主序与列主序]]。

## 6. 提升算术强度（arithmetic intensity）

从 roofline 模型看，tiling 的本质是**提高每次显存搬运对应的计算量**。tile 越大复用越多，但受 shared memory / 寄存器容量约束；tile 尺寸调优（autotuning）就是在"复用程度"和"占用率 / 资源占用"之间找平衡点。

## 一句话总结

Tiling 通过把数据切成能放进片上存储的小块，换取数据复用、延迟隐藏和并行度，把 memory-bound 变成 compute-bound；在 FlashAttention、Linear Attention 这类场景里，它还进一步解决了"中间结果根本放不下显存"的可行性问题。
