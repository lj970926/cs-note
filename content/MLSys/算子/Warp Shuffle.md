---
title: Warp Shuffle
tags:
  - cuda
  - gpu
  - parallel-computing
  - warp
aliases:
  - Warp 洗牌
  - CUDA Warp Shuffle
  - __shfl_sync
created: 2026-08-13
---

# Warp Shuffle

Warp Shuffle 是 CUDA 中的 **warp 内寄存器数据交换机制**。它允许一个 lane 直接取得同一 warp 内另一个 lane 提供的值，无需先把数据写入 shared memory。

NVIDIA GPU 的一个 warp 通常由 32 个线程组成，每个线程称为一个 **lane**，编号为 0–31。

```text
通过 shared memory： lane A 寄存器 → shared memory → lane B 寄存器
Warp Shuffle：       lane A 寄存器 ───────→ lane B 寄存器
```

> [!note] 交换的是求值结果
> `__shfl*_sync` 中每个 lane 先对 `value` 求值，然后按规则选择某个 lane 的该值作为返回值。它不能任意读取其他线程的寄存器或局部变量。

## 基本接口

```cpp
T __shfl_sync(
    unsigned mask,
    T value,
    int src_lane,
    int width = warpSize
);
```

例如，把 lane 0 的 `x` 广播给整个 warp：

```cpp
unsigned mask = 0xffffffffu;
int y = __shfl_sync(mask, x, 0);
```

每个 lane 传入的 `x` 可以不同；执行后，所有 lane 的 `y` 都等于 lane 0 提供的 `x`。

`width` 可以把 warp 分成多个独立子组；它必须是 2 的幂且不大于 `warpSize`。例如 `width = 8` 时，一个 32-lane warp 被分成四个 8-lane 子组。

## 四种常用模式

```cpp
__shfl_sync(mask, value, src_lane);          // 从指定 lane 读取
__shfl_up_sync(mask, value, delta);          // 从 lane_id - delta 读取
__shfl_down_sync(mask, value, delta);        // 从 lane_id + delta 读取
__shfl_xor_sync(mask, value, lane_mask);     // 从 lane_id ^ lane_mask 读取
```

假设每个 lane 提供的 `value` 就是自己的 lane ID：

- `__shfl_sync(mask, value, 0)`：所有 lane 得到 0，即广播。
- `__shfl_down_sync(mask, value, 1)`：lane 0 读 lane 1，lane 1 读 lane 2，依次向下。
- `__shfl_up_sync(mask, value, 1)`：lane 1 读 lane 0，lane 2 读 lane 1，依次向上。
- `__shfl_xor_sync(mask, value, 1)`：lane 0 和 1、2 和 3 等相邻 lane 互换数据。

`xor` 模式可以构造蝶形交换网络，也可用于 [[双调排序 (Bitonic Sort)]] 中按 `lane_id ^ stride` 定位比较伙伴。

## 经典用法：Warp Reduce

对一个完整 warp 的 32 个值求和：

```cpp
__device__ float warp_reduce_sum(float value) {
    constexpr unsigned FULL_MASK = 0xffffffffu;

    for (int offset = warpSize / 2; offset > 0; offset /= 2) {
        value += __shfl_down_sync(FULL_MASK, value, offset);
    }
    return value;
}
```

每一轮都让前半部分 lane 取得后半部分 lane 的部分和：

```text
offset = 16: lane 0 ← lane 16, lane 1 ← lane 17, ...
offset =  8: lane 0 ← lane  8, lane 1 ← lane  9, ...
offset =  4
offset =  2
offset =  1
```

经过 $\log_2 32 = 5$ 轮后，lane 0 得到整个 warp 的总和。其他 lane 一般只持有部分和，不能直接当作最终结果。

对完整的 2 的幂大小子组，使用蝶形归约可让每个 lane 都得到总和：

```cpp
for (int offset = warpSize / 2; offset > 0; offset /= 2) {
    value += __shfl_xor_sync(0xffffffffu, value, offset);
}
```

## `mask` 与分支是最容易出错的地方

`mask` 指定哪些 lane 参与这次 warp 级操作：

```cpp
constexpr unsigned FULL_MASK = 0xffffffffu;
unsigned mask = __ballot_sync(FULL_MASK, is_valid);
```

`__ballot_sync` 会把每个 lane 的 `is_valid` 布尔值收集成一个 32-bit mask。

> [!warning] `mask` 不是“忽略无效数据”的自动开关
> mask 中所有尚未退出的 lane 必须执行相同的 shuffle intrinsic，并使用相同的 mask。如果读取的来源 lane 没有参与，返回值未定义。

例如，对一个 warp 前 `n` 个连续 lane 的值求和：

```cpp
int lane = threadIdx.x % warpSize;
bool is_valid = lane < n;
unsigned mask = __ballot_sync(0xffffffffu, is_valid);

if (is_valid) {
    for (int offset = warpSize / 2; offset > 0; offset /= 2) {
        float other = __shfl_down_sync(mask, value, offset);
        if (lane + offset < n) {
            value += other;
        }
    }
}
```

不要在已经发生分支发散后，随意用 `__activemask()` 猜测逻辑上应当参与的线程集合。更稳妥的做法是在进入分支前用 `__ballot_sync` 明确构造 mask。

## Shuffle 不等于通用同步或内存屏障

`_sync` 后缀表示 intrinsic 会协调 mask 中的参与 lane，以完成这次数据交换；它不代表 shared/global memory 读写获得了通用的内存顺序保证。如果算法还需要通过内存通信，应根据范围另外使用 `__syncwarp()`、`__syncthreads()` 或相应的 memory fence。

## 适合与不适合的场景

Warp Shuffle 常用于：

- warp 内广播；
- reduce / all-reduce；
- prefix scan；
- 投票、选择与小规模排序；
- 矩阵转置、数据重排等 warp 级算子。

它的边界也很明确：

- 只能在同一 warp 内交换，不能跨 warp 或跨 thread block；
- 算法若需要随机索引的大容量共享数据，shared memory 通常更合适；
- 分支发散、部分 warp 和错误 mask 很容易导致未定义结果。

## 一句话总结

> Warp Shuffle 是一个按 lane 选择数据源的 warp 内寄存器交换原语；它用更少的数据搬运实现广播、归约和蝶形通信，但必须正确处理参与 mask 和无效来源 lane。

## Related

- [[双调排序 (Bitonic Sort)]]
