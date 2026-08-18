---
title: GPT-J 与 GPT-NeoX RoPE 配对布局
tags:
  - mlsys
  - attention
  - rope
  - operator
aliases:
  - GPT-J RoPE
  - interleaved RoPE
created: 2026-08-18
---

# GPT-J 与 GPT-NeoX RoPE 配对布局

“GPT-J RoPE”通常不是另一套 $\theta$、base 或频率计算公式，而是 **RoPE 旋转维度在 tensor 中的配对布局（convention）**。它和 [[Rotary Embedding]] 的核心二维旋转相同；差别在于每个二维向量的两个分量存放在哪两个维度。

对任意一对分量 $(x_a, x_b)$，RoPE 施加的旋转为：

$$
\begin{bmatrix}
x'_a \\
x'_b
\end{bmatrix}
=
\begin{bmatrix}
\cos\theta & -\sin\theta \\
\sin\theta & \cos\theta
\end{bmatrix}
\begin{bmatrix}
x_a \\
x_b
\end{bmatrix}.
$$

代码通常把它写成：

$$
x' = x \odot \cos\theta + \operatorname{rotate}(x) \odot \sin\theta.
$$

其中 `rotate` 的具体实现取决于 layout。

## GPT-J style：interleaved

设一个 attention head 向量为：

```text
x = [x0, x1, x2, x3, x4, x5]
```

GPT-J style 按相邻维度配对：

```text
(x0, x1), (x2, x3), (x4, x5)

dim:  0  1   2  3   4  5
      └──┘   └──┘   └──┘
```

因此：

```text
rotate(x) = [-x1, x0, -x3, x2, -x5, x4]
```

FlashAttention 将这种布局称作 **interleaved rotary**；因此常见开关对应为：

```text
interleaved=True  → GPT-J style → (0,1), (2,3), ...
```

伪代码：

```python
def rotate_gptj(x):
    x_even = x[..., 0::2]
    x_odd = x[..., 1::2]
    return stack((-x_odd, x_even), dim=-1).flatten(-2)
```

## GPT-NeoX style：non-interleaved

令 $d=6$，先把向量分为前、后两个 half：

```text
[x0, x1, x2 | x3, x4, x5]
```

GPT-NeoX style 的配对关系是：

```text
(x0, x3), (x1, x4), (x2, x5)

dim:  0  1  2 | 3  4  5
       \  \  \   /  /  /
        \  \  └─/──/──/
         \  └───/──/──/
          └─────/──/──/
```

所以：

```text
rotate(x) = [-x3, -x4, -x5, x0, x1, x2]
```

Hugging Face 中常见的 `rotate_half` 就是这一种实现：

```python
def rotate_neox(x):
    x1 = x[..., : x.shape[-1] // 2]
    x2 = x[..., x.shape[-1] // 2 :]
    return cat((-x2, x1), dim=-1)
```

相应地：

```text
interleaved=False → GPT-NeoX style → (0,d/2), (1,d/2+1), ...
```

## 为什么这个 convention 不能弄错

两种 layout 在数学上都只是把二维向量旋转同样的角度；改变的只是 **二维分量与 tensor 维度的映射**。但模型训练时，Q/K 的权重已经和一种特定映射共同适配。

若模型按 GPT-J convention 训练、推理时却按 GPT-NeoX convention 应用 RoPE（或反过来），每一维会和错误的伙伴维度相旋转，Q/K 的位置关系随之错误，注意力结果自然会失真。

> [!warning] Kernel 排查要点
> 在 vLLM、FlashAttention、FlashInfer 或 SGLang 的 kernel/config 中看到 `is_neox_style`、`interleaved`、`GPTJ_ROPE` 等开关时，优先确认它控制的是 rotation-dimension layout，而不是 RoPE 的 base、缩放策略或频率公式。

## rotary_dim

GPT-J 的 `rotary_dim` 表示只对一个 head 的前 `rotary_dim` 个维度施加 RoPE；未覆盖的剩余维度保持原样。无论采用哪种 layout，`rotary_dim` 都需要是偶数，才能完整组成二维旋转对。

## Related

- [[Rotary Embedding]]
- [[FlashAttention- Fast and Memory-Efficient Exact Attention with IO-Awareness]]
- [[vllm 源码随手记]]
