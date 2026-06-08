---

aliases:

- MoE grouped GEMM FLOPs
- EP 扩展收益 tags:
- permanent-note
- mlsys/inference
- mlsys/moe
- gpu/gemm created: 2026-06-08 source: 与 Claude 的讨论整理 related:
- "[[DeepGEMM]]"
- "[[Expert Parallel]]"
- "[[Roofline 模型]]"
- "[[DeepSeek-V3]]"

---

# MoE matmul 计算量与 EP 收益

> [!abstract] 一句话 MoE grouped GEMM 沿 **M 轴**分组,总 FLOPs 等价于一个"有效 M = 路由后总 token 数"的普通 GEMM。**开大 EP 不改变每卡 FLOPs,而是抬高每个专家的 M,把同样的算力从 memory-bound 推向 compute-bound。**

## 1. 单个 grouped GEMM 的 FLOPs

[[DeepGEMM]] 的设计:**只在 M 轴分组,N 和 K 固定**(MoE 里所有专家形状一致)。专家 $i$ 拿到 $m_i$ 个 token,那一段就是 $[m_i, K] \times [K, N]$:

$$\text{FLOPs}_i = 2 \cdot m_i \cdot N \cdot K$$

求和,关键在于 $\sum_i m_i = M_{\text{total}}$:

$$\text{FLOPs} = \sum_i 2 m_i N K = 2 \cdot M_{\text{total}} \cdot N \cdot K,\qquad M\_{\text{total}} = \text{num\_tokens} \times \text{top\_k}$$

> [!note] 核心结论 分组对**总** FLOPs 没影响。它塌缩成一个 $M = M_{\text{total}}$ 的普通 GEMM。分组只影响**怎么跑**(padding / mask / 调度),不影响**算多少**。

## 2. 整层 MoE FFN(DeepSeek SwiGLU 风格)

记 hidden = $h$,moe intermediate = $I$。每个 token 过一个专家:

|矩阵|形状|FLOPs/token|
|---|---|---|
|gate + up(fuse)|$[h, 2I]$|$4hI$|
|down|$[I, h]$|$2hI$|
|**合计**||**$6hI$**|

整层(T 个 token,$n_\text{shared}$ 个共享专家):

$$\text{FLOPs}\_{\text{layer}} = 6 h I \cdot \big(\underbrace{T \cdot \text{top\_k}}\_{\text{routed}} + \underbrace{T \cdot n_{\text{shared}}}_{\text{shared}}\big)$$

写成两个 grouped GEMM 一致:gate_up = $4 M_{\text{total}} h I$,down = $2 M_{\text{total}} h I$。

## 3. 有效 FLOPs vs 实际跑的 FLOPs

这是 MoE 算 TFLOPS 最容易踩的坑,两种 layout 不同:

> [!warning] Contiguous(prefill / 训练) 每个专家段要对齐到 GEMM M block(`get_mk_alignment_for_contiguous_layout()`,一般 128)。实际 launch 行数 = $\sum_i \lceil m_i / \text{align}\rceil \cdot \text{align}$,padding 部分白算。$m_i$ 越小、专家越不均衡,浪费越大。

> [!warning] Masked(decode + CUDA graph) 形状固定成 `expected_m`,靠 mask 在 block 粒度跳过无效计算。有效 FLOPs ≈ $2 \cdot m_{\text{valid}} \cdot N \cdot K$。

**实践口径:**

- **理论 / 模型 FLOPs**:直接 $2 M_{\text{total}} N K$,$M_{\text{total}} = \text{tokens} \times \text{top\_k}$,不管 padding。
- **kernel 实测 TFLOPS**:分子用 valid token 数,分母用 kineto 测的 kernel 时间。padding / mask 浪费体现在比 dense BMM 上界低(论文常拿**完全负载均衡的 dense BMM 当 grouped GEMM 的 TFLOPS 上界**)。

## 4. 开大 EP 的收益从哪来

> [!important] 前提:每卡 token 数 $t$ 不变 → 每卡 MoE matmul FLOPs 基本不变($\approx 2 \cdot t \cdot \text{top\_k} \cdot N \cdot K$,常数)。 → 所以 **EP 的收益不是减少计算量,而是让同样的 FLOPs 跑得更高效。**

设每卡 token $t$、top_k $k$、专家总数 $E$、EP degree $P$(每卡 $E/P$ 个专家)。一个 EP 组里 $P$ 张卡 all-to-all,总 token-expert pair = $P t k$,均摊到 $E$ 个专家:

$$M_{\text{per-expert}} = \frac{P \cdot t \cdot k}{E} ;\propto; P$$

**$t$ 固定时,EP 越大 → 每个专家的 M 越大 → grouped GEMM 的 group size 越高。**

两种等价视角:

- **聚合**:EP 把更多卡的 token 漏斗到同一组 $E$ 个专家,权重分片所以显存不爆,能同时处理的 token 总量上升。
- **稀释**:每卡 token 不变,但本地只剩 $E/P$ 个专家,token 集中到更少专家里,M 变高。

## 5. 为什么 M 变高就赚 —— [[Roofline 模型]]

单专家 GEMM $[M,K]\times[K,N]$ 的算术强度:

$$I \sim \frac{2MNK}{\underbrace{MK}_{\text{act}} + \underbrace{KN}_{\text{weight}} + MN}$$

> 分母两项:$MK$ 是读激活,$KN$ 是读权重。

- **M 很小**(decode,每专家几个~几十 token):分母被 $KN$(权重)主导,等于**纯流式搬权重**,kernel 严重 **memory-bound**,achieved TFLOPS 远低于峰值。
- **M 变大**:同一份权重复用到更多 token,算术强度上升,kernel 从 memory-bound 爬向 **compute-bound**,MFU 显著提高。

> [!tip] 这就是大 EP 推理(几百卡)的根本动机 把每个专家的 M 顶到能喂饱 tensor core 的水平。

**次要收益:**

- padding 浪费占比下降(M=40 对齐到 128 亏一半;M=1000 对齐到 1024 几乎不亏)。
- per-group 固定开销(TMA descriptor、scaling factor、调度)被更多 token 摊薄。

## 6. 收益的上界与代价

> [!danger] 不是越大越好
> 
> - M 超过 tensor core 饱和拐点后,再涨 EP 对 matmul 效率边际收益趋零。
> - all-to-all 通信量随 EP 涨,跨节点跳数变多,overlap 更难。
> - 专家负载不均被放大:某卡的 hot expert M 远超别人,那一段拖慢整组 grouped GEMM。

**Sweet spot:** EP 大到让 $M_{\text{per-expert}}$ 跨过 compute-bound 拐点,同时 all-to-all 还能被计算 overlap 掉。

## 7. 待办 / 延伸

- [ ] 用 V3 参数($E$=256, $k$=8, $h$=7168, $I$=2048)代入,画 $M_{\text{per-expert}}$ vs EP 曲线,标出 H800 FP8 GEMM 的饱和拐点
- [ ] 对照 [[DeepEP]] 的 all-to-all 通信量,估 overlap 窗口
- [ ] 关联 [[PD 分离]]:prefill(大 M, contiguous)与 decode(小 M, masked)对 EP 的不同诉求