---
title: 双调排序 (Bitonic Sort)
tags:
  - algorithm
  - parallel-computing
  - gpu
aliases:
  - 双调排序
  - Bitonic Sort
  - Bitonic Sorting Network
created: 2026-08-13
---

# 双调排序 (Bitonic Sort)

双调排序是一种基于**排序网络（sorting network）**的比较排序算法。它的比较顺序只由输入长度决定，与输入数据无关，因此同一阶段的比较可以并行执行，适合 GPU、SIMD 和硬件电路。

## 双调序列

双调序列（bitonic sequence）可以理解为：序列先单调递增，再单调递减；允许循环移位后满足这个性质。纯递增或纯递减序列也可以视为双调序列。

例如：

```text
1, 4, 7, 9, 8, 5, 2
```

## 核心过程

双调排序由两个过程组成：

1. **构造双调序列**：把前半部分排成升序，后半部分排成降序，拼起来便得到一个双调序列。
2. **双调合并（bitonic merge）**：对于长度为 $n$ 的双调序列，把相距 $n/2$ 的元素两两比较。升序合并时小值放前、大值放后，之后分别递归合并两个长度为 $n/2$ 的子序列。

长度为 8 时，合并的第一阶段可以同时比较：

```text
a[0] ↔ a[4]
a[1] ↔ a[5]
a[2] ↔ a[6]
a[3] ↔ a[7]
```

这些比较操作互不依赖，因此可以并行执行。第一阶段之后，较小的一半被分到左侧、较大的一半被分到右侧；两个半区仍是双调序列，可以继续递归合并。

## 伪代码

```text
bitonic_sort(a, lo, n, ascending):
    if n <= 1:
        return

    k = n / 2
    bitonic_sort(a, lo,     k, true)
    bitonic_sort(a, lo + k, k, false)
    bitonic_merge(a, lo, n, ascending)

bitonic_merge(a, lo, n, ascending):
    if n <= 1:
        return

    k = n / 2
    parallel for i = lo .. lo + k - 1:
        if ascending and a[i] > a[i + k]:
            swap(a[i], a[i + k])
        if not ascending and a[i] < a[i + k]:
            swap(a[i], a[i + k])

    bitonic_merge(a, lo,     k, ascending)
    bitonic_merge(a, lo + k, k, ascending)
```

## 复杂度

设 $n=2^m$：

- 总比较次数：$O(n\log^2 n)$
- 排序网络的并行深度：$O(\log^2 n)$
- 原地迭代实现的额外空间：$O(1)$
- 通常要求长度是 2 的幂；其他长度可通过填充哨兵值或使用非二次幂变体处理

普通 CPU 上，双调排序通常不如 $O(n\log n)$ 的归并排序、堆排序或快速排序；它多付出的一个 $\log n$ 因子，换来的是固定、规则且高度并行的比较结构。

## 为什么适合 GPU

- 同一阶段的 compare-and-swap 彼此独立，容易映射到并行线程。
- 比较拓扑固定，控制流规则，不需要根据数据选择分支或递归划分位置。
- 对固定且较小的数组，可以在一个 thread block 内结合 shared memory 完成。
- 每个阶段之间需要同步；规模很大时，同步和额外比较会使它不如 radix sort、merge sort 等 GPU 排序算法。

双调排序网络也可用于固定规模的候选集排序或选择。例如 [[top_k_top_p sampling]] 中需要找出高概率 token；某些 GPU Top-k 实现会用排序网络处理小块候选值，但 **Top-k 只要求选出最大的 $k$ 个元素，并不一定需要完整排序**。

## 要点

- 双调排序的核心不是“先升后降”本身，而是把双调序列通过规则的 compare-and-swap 网络合并成有序序列。
- 它的优势是并行结构规则，而不是理论比较次数最少。
- 它通常是不稳定排序：相等元素的原始相对顺序没有保证。

## Related

- [[top_k_top_p sampling]]
