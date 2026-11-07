---
title: Mamba 的状态转移与短卷积
tags:
  - mlsys
  - inference
  - ssm
aliases:
  - Mamba
created: 2026-11-07
description: Mamba-1 与 Mamba-2 的推理状态形状、SSM 递推，以及短卷积与展开窗口后的逐点卷积为何等价。
---

# Mamba 的状态转移与短卷积

SSM 全称 **State Space Model（状态空间模型）**。Mamba 的选择性 SSM 用固定大小的状态来表示已经读过的序列。每个 token 到来后，它先衰减旧状态，再写入当前输入，最后从新状态读出输出。推理时，每个 Mamba 层还维护一个短卷积窗口。

## 每层缓存的 shape

设 `b` 为 batch size，`e = d_inner = expand × d_model`，`n = d_state`，`k = d_conv`。Mamba-2 另有 `h = nheads`、`p = headdim`、`g = ngroups`，实际参与 SSM 的宽度 `e_s = d_ssm = h × p`。下表使用官方实现的单层、单卡逻辑形状。

| 缓存 | Mamba-1 | Mamba-2 | 内容 |
| --- | --- | --- | --- |
| `ssm_state` | `[b, e, n]` | `[b, h, p, n]` | 每个通道或每个头的递推状态 |
| `conv_state` | `[b, e, k]` | `[b, e_s + 2*g*n, k]` | 最近 `k` 个位置的卷积前输入 |

Mamba-1 先对投影出的输入做短卷积，再从卷积结果生成 $\Delta_t,B_t,C_t$。Mamba-2 从输入投影并行得到 `x`、`B`、`C` 和步长的投影值，然后把 `x`、`B`、`C` 拼在一起做短卷积，所以多了 `2*g*n` 个卷积通道。两种实现都从更新后的 `ssm_state` 读出，再做输出门控和投影。

例如 `b=1, d_model=2048, expand=2, d_conv=4`，Mamba-1 取 `d_state=16` 时，两份缓存分别是 `[1,4096,16]` 和 `[1,4096,4]`。Mamba-2 取 `d_ssm=4096, headdim=64, ngroups=1, d_state=128` 时，分别是 `[1,64,64,128]` 和 `[1,4352,4]`。

Prefill 用 scan 或分块计算得到提示词末尾的状态，decode 每步更新这两份缓存。两份缓存都没有随上下文长度增长的轴。短卷积只看局部窗口，SSM 通过递推把更早的信息保留在状态里。相关的固定大小递推缓存也可见 [[MLSys/算子/Linear Attention|Linear Attention]]，推理框架中的缓存管理见 [[source-code/vllm/vllm 源码随手记]]。

## SSM 状态怎么转移

一般的离散 SSM 把状态更新和输出读出写成 $S_t=\bar A_t S_{t-1}+\bar B_t x_t$、$y_t=C_t S_t+D x_t$。Mamba 的 $\Delta_t$、$B_t$、$C_t$ 由输入决定，分别影响衰减和写入强度、写入方向、读出方向。$A$ 和直通系数 $D$ 是模型权重。

以 Mamba-1 的官方单步实现为准，$i$ 是通道，$j$ 是状态分量，公式省略 batch 下标：

$$
S_{t,i,j} =
\underbrace{\exp(\Delta_{t,i} A_{i,j})\, S_{t-1,i,j}}_{\text{衰减旧状态}}
+
\underbrace{\Delta_{t,i}\,x_{t,i}\,B_{t,j}}_{\text{写入当前输入}},
\qquad
y_{t,i} = \sum_j S_{t,i,j} C_{t,j} + D_i x_{t,i}.
$$

| 量 | Mamba-1 单步 shape | Mamba-2 单步 shape |
| --- | --- | --- |
| SSM 输入 $x_t$ | `[b, e]` | `[b, h, p]` |
| 正步长 $\Delta_t$ | `[b, e]` | `[b, h]` |
| 连续衰减参数 $A=-\exp(A_{\log})$ | `[e, n]` | `[h]` |
| 写入和读出向量 $B_t, C_t$ | 各 `[b, n]` | 各 `[b, g, n]` |
| 读出 $y_t$ | `[b, e]` | `[b, h, p]` |

Mamba-1 的 $A$ 按通道保存对角元素，旧状态因此是逐元素衰减。$A<0$ 且 $\Delta_t>0$，所以每个衰减系数在 0 和 1 之间。$C_t$ 只参与读出。Mamba-2 把衰减系数共享到整个 head，同一个 head 的 `[p,n]` 状态用同一个标量衰减。设 head $i$ 属于组 $g(i)$，其写入项是 `[p]` 向量与 `[n]` 向量的外积：

$$
S_t^{(i)}
=
\exp(\Delta_t^{(i)} A^{(i)})\,S_{t-1}^{(i)}
+
\Delta_t^{(i)}\,x_t^{(i)}\,B_t^{(g(i))\top}.
$$

然后用 $S_t^{(i)} C_t^{(g(i))}$ 读出 `[p]`，再加输入直通项。这里的写入项采用官方代码里的 $\Delta_t B_t x_t$ 形式。

## 短卷积何时等价于 kernel size 1

Mamba-1 和 Mamba-2 的官方实现默认 `d_conv=4`。原始输入的布局为 `[batch, channels, time]`，卷积沿时间轴滑动。因果窗口只用当前位置和之前的位置，序列开头从左侧补零。卷积按通道分组，每个原始通道各用自己的一套权重。

以一个通道为例，激活之前的卷积结果是：

$$
y_t=w_0 v_{t-3}+w_1 v_{t-2}+w_2 v_{t-1}+w_3 v_t+\mathrm{bias}.
$$

**也可以先把这 4 个时间位置展开到 channel 维，再用 kernel size 1 求出同一个结果。** 对每个 $t$，把 $[v_{t-3},v_{t-2},v_{t-1},v_t]$ 装进该位置的 4 个新通道，然后用同一组 $w_0,\ldots,w_3$ 做点积。推广到 `C` 个原始通道时，每个卷积分组接收同一个原始通道的 4 个时间偏移。

| 布局 | 输入 shape | 卷积设置 |
| --- | --- | --- |
| 在原始时间轴取窗口 | `[B, C, L]` | `Conv1d(C, C, kernel_size=4, groups=C)`，左补 3 个零 |
| 时间轴放在二维张量的宽度上 | `[B, C, 1, L]` | `Conv2d(C, C, kernel_size=(1, 4), groups=C)`，左补 3 个零 |
| 把窗口展开到通道轴 | `[B, 4*C, L]` | `Conv1d(4*C, C, kernel_size=1, groups=C)` |
| 展开后加一个高度轴 | `[B, 4*C, 1, L]` | `Conv2d(4*C, C, kernel_size=(1, 1), groups=C)` |

前两种由卷积算子取窗口，后两种在准备输入时取窗口。只要填充、权重顺序和 bias 相同，它们在数学上等价。对未展开的 `[B,C,L]` 直接用 `kernel_size=1` 时，每个位置只提供当前 token 的值。

Decode 时，卷积更新相当于把窗口从 `[v_(t-4), v_(t-3), v_(t-2), v_(t-1)]` 滑到 `[v_(t-3), v_(t-2), v_(t-1), v_t]`。每次只追加 **1 个新 token**，更新后的窗口依然有 **4 个值**。官方单步实现可以直接在这个窗口上按通道做点积，无需为整段序列物化展开后的 `[B,4*C,L]`。

## 参考资料

- [Mamba 论文 `2–3：状态空间模型与选择机制](https://arxiv.org/html/2312.00752v2)
- [Mamba-2 论文 `5–7：标量转移、SSD 与多头结构](https://arxiv.org/html/2405.21060v1)
- [Mamba-1 官方实现：step 与 allocate_inference_cache](https://github.com/state-spaces/mamba/blob/main/mamba_ssm/modules/mamba_simple.py#L194-L247)
- [Mamba-2 官方实现：step 与 allocate_inference_cache](https://github.com/state-spaces/mamba/blob/main/mamba_ssm/modules/mamba2.py#L264-L337)
