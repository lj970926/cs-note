---
title: 多头潜在注意力 (MLA)
tags:
  - mlsys
  - attention
  - inference
  - kv-cache
  - deepseek
aliases:
  - MLA
  - Multi-Head Latent Attention
created: 2026-09-01
updated: 2026-09-01
source: 基于 DeepSeek-V2 的 MLA 设计与用户提供材料整理
---

# 多头潜在注意力（MLA）

> [!abstract] 一句话概括
> **MLA（Multi-Head Latent Attention）不是缓存完整的多头 K/V，而是缓存它们共同的低维 latent $c^{KV}$，再把投影矩阵吸收到 Query 和输出投影中。** 它以低秩共享替代 MQA/GQA 的硬共享，在保留多头 K/V 表达能力的同时大幅缩小 KV Cache。

MLA 由 DeepSeek-V2 系统性提出，后续 DeepSeek-V3 / R1 继续采用。它在推理系统中的关键意义是：改变了 KV Cache 的**数据表示**，从而减少 decode 时读取历史上下文的 HBM 流量。

## 1. 问题：MHA 的 KV Cache 随上下文增长

标准多头注意力（MHA）对 hidden state $h_t$ 投影得到：

$$
q_t = W^Q h_t, \qquad k_t = W^K h_t, \qquad v_t = W^V h_t
$$

在自回归 decode 中，历史 token 的 K/V 必须保留，避免每生成一个 token 都重算整段上下文。若有 $H$ 个 attention heads、每头维度为 $d_h$，则每层每 token 的缓存量为：

$$
2 H d_h
$$

对 $L$ 层、$T$ 个 token 的总量约为：

$$
2 L T H d_h
$$

长上下文 decode 通常是 memory-bound：新 Query 需要从 HBM 读取大量历史 K/V。因此 KV Cache 同时限制容量和 decode 吞吐。

## 2. MHA、MQA、GQA 与 MLA

| 机制 | K/V 的组织方式 | 每层每 token 的缓存元素数 |
|---|---|---:|
| MHA | 每个 Query head 有独立 K/V | $2 H d_h$ |
| MQA | 所有 Query heads 共享一组 K/V | $2 d_h$ |
| GQA | 多个 Query heads 共享一组 K/V，共 $G$ 组 | $2 G d_h$ |
| MLA | 缓存联合低维 latent 与 RoPE key | $d_c + d_h^R$ |

MQA / GQA 直接减少 KV heads；MLA 则让每个 head 的 K/V 都由同一个紧凑 latent 经各自的 up-projection 得到。它可粗略看作：**用低秩分解替代对 K/V 的硬共享。**

## 3. K/V 低秩联合压缩

MLA 先把 $h_t$ 下投影成低维 latent：

$$
c_t^{KV} = W^{DKV} h_t, \qquad c_t^{KV} \in \mathbb{R}^{d_c}
$$

然后从它恢复 content K/V：

$$
k_t^C = W^{UK} c_t^{KV}, \qquad v_t^C = W^{UV} c_t^{KV}
$$

其中 $d_c \ll H d_h$。重点不是“先得到 K/V 再压缩”，而是 K/V 从一开始就共享同一个 latent bottleneck：

```text
hidden state → cKV (latent) ──→ K_content
                            └─→ V
```

因此缓存的信息是**扩张前**的 $c^{KV}$，而不是扩张后的完整多头 K/V。

## 4. Matrix absorption：无需显式恢复 K/V

上一节省略了 head 维度；严格地说，**每个 head 有自己的 up-projection 和被吸收后的 Query，但所有 head 共享同一份 latent cache**。

将 Key 的 up-projection 按 head 切分：

$$
W^{UK} =
\begin{bmatrix}
W^{UK}_1 \\
\vdots \\
W^{UK}_H
\end{bmatrix},
\qquad
k^C_{j,i} = W^{UK}_i c_j^{KV}
$$

其中 $i$ 是 head 下标。对第 $i$ 个 head 的 content score：

$$
(q^C_{t,i})^\top k^C_{j,i}
= (q^C_{t,i})^\top W^{UK}_i c_j^{KV}
= \left((W^{UK}_i)^\top q^C_{t,i}\right)^\top c_j^{KV}
$$

定义该 head 在 latent 空间中的 Query：

$$
\tilde q_{t,i} = (W^{UK}_i)^\top q^C_{t,i}
$$

即可直接用 $\tilde q_{t,i}$ 与历史 latent $c_j^{KV}$ 做内积；无需为历史 token 显式恢复 $k^C_{j,i}$。实际 MLA 的 $q^C_{t,i}$ 也由 Query latent 经 head-specific projection 得到，因此可将这些矩阵进一步预先融合到 Query projection 中。

Value 的融合同样逐 head 进行。令 $C$ 的每一行是一个历史 $c_j^{KV}$，且：

$$
v^C_{j,i} = W^{UV}_i c_j^{KV},
\qquad
O_i = A_i C (W^{UV}_i)^\top
$$

其中 $A_i$ 是第 $i$ 个 head 的 attention 权重。若把输出投影按 head 行块切为 $W^O_i$，则：

$$
O = \sum_{i=1}^{H} O_i W^O_i
= \sum_{i=1}^{H} A_i C \underbrace{(W^{UV}_i)^\top W^O_i}_{W^{UO}_i}
$$

因此可将每个 $W^{UV}_i$ 分别与其 $W^O_i$ 融合。多头表达能力仍然保留：不同 head 有不同的 $\tilde q_{t,i}$、$A_i$ 以及输出融合矩阵；共享的只有缓存的 $c^{KV}$。

于是推理实现可以把：

- 每个 $W^{UK}_i$ 吸收到对应的 Query projection；
- 每个 $W^{UV}_i$ 与对应的 $W^O_i$ 融合；
- 历史状态只保持为一份 $c^{KV}$。

这正是 MLA 能节省 cache 而不承担“逐 token 解压全量 K/V”成本的原因。

## 5. RoPE 冲突与 Decoupled RoPE

上述吸收依赖投影矩阵与 token 位置无关。但 [[Rotary Embedding|RoPE]] 会对不同位置应用不同旋转 $R_j$：

$$
q_t^\top R_j W^{UK} c_j^{KV}
$$

由于 $R_j$ 随 key 位置 $j$ 变化，不能再把它简单吸收到当前 Query 的固定投影中。MLA 的解决方式是把内容和位置拆开（Decoupled RoPE）：

$$
k_{t,i} = [k_{t,i}^C; k_t^R], \qquad
q_{t,i} = [q_{t,i}^C; q_{t,i}^R]
$$

于是 attention score 分为内容和位置两部分：

$$
q^\top k = (q^C)^\top k^C + (q^R)^\top k^R
$$

其中 $k^C$ 走 latent 压缩路径，$k^R$ 是单独生成、施加 RoPE 后缓存的位置 key。最终的 MLA KV Cache 是：

$$
\boxed{[c^{KV}, k^R]}
$$

而不是多头的 $[K_1, V_1, K_2, V_2, \ldots]$。

```text
hidden ──→ cKV ──→ content K / V ──→ cache cKV
   │
   └────────────→ RoPE K ───────────→ cache kR
```

> [!note] Query 的 RoPE 路径
> 在 DeepSeek MLA 中，$q^R$ 从低秩 Query latent 映射后再施加 RoPE；$k^R$ 则从输入 hidden state 直接得到。这一非对称设计使位置部分可以单独缓存。参见 [[DeepSeek R1]]。

## 6. Cache 缩减的量级

DeepSeek-V2 的一组配置中：

$$
d_c = 4d_h, \qquad d_h^R = \frac{1}{2}d_h
$$

故 MLA 每 token 的缓存为：

$$
d_c + d_h^R = 4.5d_h
$$

相当于约 $2.25$ 个 GQA KV heads，而不是 MHA 的 $2H$ 个 head 向量。DeepSeek-V2 论文报告其相对前代模型的 KV Cache 可减少 93.3%；具体节省比例仍取决于层数、head 配置、latent 维度、精度与是否另有缓存状态。

## 7. 从推理引擎视角的心智模型

MLA 的收益不限于“省显存”：

- KV Cache capacity 更大，可容纳更长 context 或更多并发请求；
- decode 时每个历史 token 的 HBM 读取更少，减轻带宽压力；
- 更容易提升 batch size 与 decode throughput；
- kernel / cache manager 必须认识 `$[c^{KV}, k^R]$` 这种布局，而非假设 cache 总是完整 K/V。

```text
GQA cache: token → [K heads][V heads]
MLA cache: token → [latent cKV][RoPE key kR]
```

在 vLLM 中进一步追踪分页、对齐与 FlashMLA kernel 的实现，可参考 [[source-code/vllm/DeepSeekV4 KV Cache 管理]]。

## 8. Prefill：压缩写 cache，不等于用 absorb 路径计算

> [!summary] 结论
> 对长 prompt 的 **dense Prefill**，通常应当保留压缩的 `$[c^{KV}, k^R]$` cache，但不一定应采用 matrix absorption（MQA 形式）来计算 attention；展开为 MHA 形式并用 FlashAttention 往往更合适。**Decode 才是 absorb 的主战场。**

这里需要区分两个独立决策：

1. **cache 表示**：Prefill 结束后，仍只写入 `$[c^{KV}, k^R]$`，以服务后续 Decode，以及可能的 Prefill/Decode 分离传输。
2. **本次 attention 的计算形式**：计算当前 Prefill 的 attention 时，可选 MHA 展开形式或 absorb 后的 MQA 形式。

对于 dense Prefill，序列中的 $S_q$ 个 Query 通常同时与 $S_k$ 个 Key 计算 attention，主项近似为：

$$
O(H S_q S_k d)
$$

在 MHA 形式中，content score 的内积维度为单头维度 $d_h^C$；absorb 后则变为 latent 维度 $d_c$：

$$
(q^C_{t,i})^\top k^C_{j,i}
\quad \longrightarrow \quad
\tilde q_{t,i}^\top c_j^{KV}
$$

DeepSeek-V2 的一组配置中 $d_c=4d_h$，因此 absorb 会增大 dense attention 的内积/聚合维度。另一方面，MHA 形式中对 K/V 的临时展开只随序列长度线性增加；FlashAttention 可以分块在片上消费这些临时值，而无需物化完整的 $S_q \times S_k$ attention 矩阵。长 Prefill 时，$S^2$ attention 主项通常会盖过这部分线性开销，因此 MHA 形式更容易跑得快。

| 场景 | 推荐计算形式 | 原因 |
|---|---|---|
| Dense Prefill、长 prompt | MHA 展开 + FlashAttention | 避免将 attention 的内积维度从 $d_h^C$ 提高到 $d_c$ |
| Decode（$S_q=1$） | absorb / MQA | 避免反复读/恢复扩张后的多头 K/V，cache 读取带宽是主要瓶颈 |
| Sparse Prefill 或短 Query chunk 对很长 KV | 需 benchmark | cache 紧凑性和减少读取可能抵消更宽内积的计算成本 |

这不是纯数学上的绝对结论，而是由硬件和 kernel 决定的取舍。DeepSeek 的 [FlashMLA support matrix](https://github.com/deepseek-ai/FlashMLA#performance) 也采用了这一分工：Dense Prefill 标为 MHA mode，而 Dense Decode 与 Sparse Prefill 标为 MQA mode。该矩阵是很强的工程信号，但具体模型、GPU、batch、上下文长度和分页方式仍应以 benchmark 为准。

## 9. 结论速查

1. MLA 的 latent 是 $c^{KV}$，它是 K/V 的共同低维来源。
2. 缓存的是 $[c^{KV}, k^R]$，不是完整多头 K/V。
3. 通过 matrix absorption，content K/V 不必在 decode 时显式还原。
4. Decoupled RoPE 解决了位置旋转与低秩压缩不能直接融合的问题。
5. 对 serving 而言，核心影响是 KV Cache layout 与 HBM traffic。
6. Prefill 要“压缩存”，但对长 dense prompt 未必“absorb 算”；后者常更适合 Decode。

## Related

- [[DeepSeek R1]]
- [[DeepSeek-V3 Technical Report]]
- [[Rotary Embedding]]
- [[source-code/vllm/DeepSeekV4 KV Cache 管理]]
- [[Model Quantization#KV Cache 量化]]
