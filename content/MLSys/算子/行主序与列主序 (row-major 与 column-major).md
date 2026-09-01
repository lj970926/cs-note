---
title: 行主序与列主序 (row-major 与 column-major)
tags:
  - memory-layout
  - matrix
  - gpu
aliases:
  - Row-major
  - Column-major
  - 行主序
  - 列主序
created: 2026-09-01
---

# 行主序与列主序 (row-major 与 column-major)

`row-major` 和 `column-major` 说的是二维数组或矩阵映射到一维内存时，**哪一维构成外层的大分组**；`major` 不是“更重要”，而是“更高位、变化更慢”的意思。

设矩阵元素为 `A[i][j]`，有 `m` 行、`n` 列，且下标从 0 开始：

- **行主序（row-major）**：先连续存完一整行，再存下一行。

  ```text
  A[0][0], A[0][1], ..., A[0][n-1], A[1][0], ...
  ```

  线性偏移为 `i * n + j`。行下标 `i` 是 major index：它类似十进制数的高位，变化较慢；列下标 `j` 在一行内连续变化。

- **列主序（column-major）**：先连续存完一整列，再存下一列。

  ```text
  A[0][0], A[1][0], ..., A[m-1][0], A[0][1], ...
  ```

  线性偏移为 `i + j * m`。列下标 `j` 是 major index，行下标 `i` 连续变化。

因此，这个命名的实际意义是：一眼看出**连续内存对应整行还是整列**，进而判断地址计算、遍历顺序和缓存/内存访问是否友好。

| 布局 | 相邻地址通常对应 | 遍历时更连续的内层循环 |
| --- | --- | --- |
| row-major | 同一行的相邻列 | 列下标 `j` |
| column-major | 同一列的相邻行 | 行下标 `i` |

C/C++ 的普通多维数组通常采用 row-major；Fortran 与 MATLAB 中的数组通常采用 column-major。对 GPU 矩阵算子而言，布局还会影响线程是否能合并访问内存；需要转换或重排布局时，可结合 [[Warp Shuffle]] 等 warp 级数据交换手段实现。

## 一句话总结

> `major` 指外层、变化慢的维度；row-major 表示按“行块”连续存放，column-major 表示按“列块”连续存放。
