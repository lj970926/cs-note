---
title: DeepSeek V4.1 Flash 模型架构 Highlights
tags:
  - mlsys
  - deepseek
  - attention
  - kv-cache
  - moe
  - inference
aliases:
  - DeepSeek-V4.1-Flash
  - DeepSeek V4.1 Flash 架构
created: 2026-10-15
source: DeepSeek-V4.1-Flash：Pushing the Limits of KV Cache Compression，arXiv 2609.19969v1
description: 从 CED、CSA2、分层索引与 FP4 KV 到 SWA Bounded Replay，理解 DeepSeek V4.1 Flash 如何降低长上下文 Agent 的计算、缓存和数据搬运成本。
---

# DeepSeek V4.1 Flash 模型架构 Highlights

> [!abstract] 核心思路
> 长程 Agent 的负载越来越 **input-heavy**：工具返回和不断增长的上下文增加 prefill 成本，历史 KV 的存储、复用和搬运也越来越贵。V4.1 Flash 沿着这条链路做联合优化：**CED 减少 prompt 的计算深度，CSA2 减少 global KV 的重复存储和索引，FP4 缩小每条 KV，SWA Bounded Replay 再用少量重算换掉长期 SWA 缓存。**

本文基于用户提供的论文 *DeepSeek-V4.1-Flash: Pushing the Limits of KV Cache Compression*（2026-09-17，v1），聚焦架构及其推理含义。配图直接截取自论文；页码指 PDF 页脚页码。模块机制和数值以论文为准，“理解”部分是对设计意图的归纳。

## Basic

- **40 层语言主干：20 层 causal encoder + 20 层 decoder**。两部分都遵守因果约束，输出仍是自回归文本。
- 前两层只有 **SWA**，其余 38 层均为 **SWA + global sparse attention（CSA2）**；SWA window 为 **128**。
- **552B backbone + 196B Engram**；论文报告 **Prefill A8B、Decode A16B**。上代 V4 Flash 为 **284B backbone、A13B**。这里的 A8B/A16B 是激活参数口径，不代表部署只需加载这些权重。
- 所有 Transformer 层的 FFN 使用 **DeepSeekMoE**：每层 **1 shared expert + 384 routed experts**，每 token 选择 **6 routed experts**，专家中间维度为 2304。
- hidden size **5120**；64 个 query heads，head dim **512**；indexer 为 32 heads × 128 dim；global attention **Top-512**。
- 原生接收图文输入，支持 **1M context**；预训练共 **45T tokens**。图文从语言主干预训练开始共同参与训练。

来源：§2.1、§4.2.1–4.2.2、Table 1，pp.7–8、21–24。

## Architecture

![[assets/MLSys/Models/DeepSeek V4.1 Flash/DeepSeek V4.1 Flash Figure 3 总体架构.png]]

*论文 Figure 3，p.7：总体架构。`CSA2(ratio, mode)` 中的 ratio 是序列压缩率，mode 是该层的 KV / index 复用方式。*

把图中的重复结构展开，可以更直观地看到 KV 的归属：

| 区段 | 层结构 | global KV 的组织 |
| --- | --- | --- |
| Encoder 前 2 层 | `SWA × 2` | 不生成 global KV |
| Encoder 后 18 层 | `[CSA2(2, Full) + CSA2(2, Reuse) × 5] × 3` | 3 组，每组 6 层共享；每 2 个 token 压成 1 条 global entry |
| Decoder 前 4 层 | `CSA2(1, Full) + CSA2(1, Reuse) × 3` | 建立 decoder 的唯一一组 global KV |
| Decoder 后 16 层 | `[CSA2(1, Reindex) + CSA2(1, Reuse) × 3] × 4` | 继续共享同一组 KV，但每 4 层更新一次 Top-K |

这里有个值得注意的取舍：**decoder 的 ratio=1，即 global KV 保留逐 token 的序列分辨率，主要靠跨层共享和低比特存储控制容量。** `ratio=1` 不代表 full attention；实际 attention 仍只读取 Top-512 global entries 和本层 SWA KV。

来源：Figure 3、§4.2.1，pp.7、21–22。

## 1. CED：让大部分 prompt 只经过半个网络

### Decoder global KV 直接来自 encoder 输出

普通逐层生成 KV 的结构中，要拿到高层的 KV，prompt 就得先经过这些层的完整计算。CED 改变了 decoder **global KV 的来源**：它由最后一层 encoder 的 hidden states $H_{20}$ 直接投影得到，而不是由各 decoder 层的 hidden states 生成。

论文式 (1) 写为：

$$
C_l = H_{20} W_l^{KV}, \qquad Z_l = H_{20} W_l^Z, \qquad l > 20
$$

其中 $C_l$ 是 KV entries，$Z_l$ 是对应的压缩权重。这是 CED 的一般形式；结合本模型的 CSA2 配置，decoder 只有第一个 Full 层实际生成一组 global KV，后续层复用它。

因此，长 prompt 完成 encoder 前向之后，就能以很小的投影成本得到 decoder 所需的 global KV，**无需让每个 prompt token 都走完 20 层 decoder 的完整前向**。

### SWA 保留逐层计算，所以还需要尾部 replay

CED 没有把 decoder 的所有 KV 都改成 encoder 投影。**各层 SWA KV 仍来自该层自己的 hidden states**，保留局部信息处理的计算深度。因此 prefill 结束前，还要把 prompt 最后的 **128 tokens** 送过 decoder，近似重建其 SWA 状态，供后续 decode 使用。

冷 prefill 的主要路径可概括为：

```text
全部 prompt → 20 层 encoder → decoder global KV 投影
                         └→ 尾部最多 128 tokens → 20 层 decoder → decoder SWA KV
```

对长度 $N \gg W$ 的输入，按 token-layer 工作量计，论文给出的近似是：

$$
O(NL) \longrightarrow O(NL/2 + WL/2) \approx O(NL/2)
$$

这里 $L=40$，$W=128$。这个式子用于解释 CED 省掉的层计算，不是对所有 attention 子项复杂度的完整展开。

**理解：Prefill A8B / Decode A16B 来自执行路径的差异。** 大多数输入 token 只走 encoder；生成新 token 时则仍经过 encoder 和 decoder。短 prompt 的尾部 replay 占比更高，实际 TTFT 也受视觉编码、数据搬运等影响，不能直接把“计算近乎减半”换算成所有请求的 2× 加速。

来源：§2.2，p.9；Decoder SWA Bounded Replay，§3.2.2，p.20。

## 2. CSA2：把“共享什么 KV”和“本层看哪里”拆开

![[assets/MLSys/Models/DeepSeek V4.1 Flash/DeepSeek V4.1 Flash Figure 4 CSA2 三种模式.png]]

*论文 Figure 4，p.10：绿色部分在当前层计算；黄色部分复用已有 KV；红色部分复用已有 Top-K indices。*

CSA2 的关键是区分三种对象：**main KV、indexer K、Top-K indices**。前两者是缓存内容，后者是某个 query 选中了哪些历史位置。共享 KV 可以省存储，共享 Top-K 可以省索引计算，这两件事可以独立选择。

| 静态指定的层模式 | Main KV / indexer K | Top-K indices | 当前层仍需做什么 |
| --- | --- | --- | --- |
| **Full** | 当前层生成 | 当前层计算 | Main Q、SWA KV、indexer Q、索引和 attention |
| **Reindex** | 复用最近的 Full 层 | 用本层 indexer Q 重新计算 | Main Q、SWA KV、索引和 attention |
| **Reuse** | 复用最近的 Full 层 | 复用针对这组 KV 最近产生的 Top-K | Main Q、SWA KV 和 attention |

**Reindex 是两者之间的折中**：不增加一整份历史 KV，但允许深层 query 选择不同的上下文。Reuse 层则连 indexer Q 和打分都省掉。

> [!note] Reuse 仍然产生新的 attention 输出
> 每层保留自己的 Main Q、SWA KV 和 MoE。复用的是 KV 和稀疏位置选择，不是把上一层的 attention output 直接复制过来。Full 也只是完整执行 CSA2 路径，不表示 dense attention。

按本模型配置统计，38 个 CSA2 层中有 **4 个 Full、4 个 Reindex、30 个 Reuse**。全局缓存从逐层持有变成 **encoder 3 组 + decoder 1 组**；30 个 Reuse 层同时省掉了独立索引过程。

### 另外几处简化

- **统一为 CSA2**，替代 V4 的 CSA / HCA 混合结构。
- compressor 去掉相邻压缩块间的 overlap，也去掉压缩过程中的 absolute positional embedding。
- **Indexer K 从 main KV 投影得到**，替代从 hidden states 出发的独立压缩分支。

从缓存视角看，它同时优化了 entry 表示、序列压缩和层间复用三个维度。关于“用紧凑表示替代完整多头 KV”的前置概念，可以对照 [[MLSys/算子/多头潜在注意力 (MLA)|多头潜在注意力（MLA）]]。

来源：§2.3–2.3.1，pp.9–11；层数统计根据 §4.2.1 配置展开。

## 3. Hierarchical Sparse Indexer：先全局找候选，再让深层重新挑选

![[assets/MLSys/Models/DeepSeek V4.1 Flash/DeepSeek V4.1 Flash Figure 5 分层稀疏索引.png]]

*论文 Figure 5，p.11：decoder 第一个 Full 层建立共享候选池，后面的 Reindex 层只在候选池内选择自己的 Top-512。*

即使已经复用很多 Top-K，剩余 indexer 若每次都扫描 1M 上下文，仍然很贵。V4.1 在 **decoder** 中进一步缩小后续索引的搜索范围：

1. 第一个 Full 层对所有因果可见的 global positions 打分，选出自己使用的 **Top-512**。
2. 同时把位置按 **8 positions/block** 分块，以块内最大 index score 作为 block score，最多选 **2048 blocks**。
3. 把这些块覆盖的位置汇成共享候选池，最多 **16,384 positions**。
4. 后续 4 个 Reindex 层只在这个池中打分，各自选 Top-512；Reuse 层沿用最近一次选择。

**候选池比最终 Top-K 大得多，因此深层仍可改变选择，同时避免反复扫描完整上下文。** 候选池是针对每个 query 产生的，不是所有请求共用的一份固定位置表。

若 decoder 上下文为 1M，后续单个 Reindex 的候选数约为全长的 1/64。这个比例只描述后续 indexer 的打分范围；**第一个 Full 层仍扫描完整因果上下文，encoder 也不使用这套候选限制**，因此不能声称整个网络的索引复杂度都与长度无关。

该机制在 post-training 中引入，训练和推理使用同样的候选限制，让深层 indexer 提前适应受限搜索空间。

来源：§2.3.2，pp.11–12；§4.2.1，p.22。

## 4. FP4 KV：共享之后，再压缩每条缓存

V4 已使用 FP4 indexer；V4.1 进一步将 **main KV cache 从 FP8 压到 FP4**，并在 post-training 中引入 QAT。

| 缓存 / 分支 | 精度与格式 | 主要目的 |
| --- | --- | --- |
| Main KV | E2M1 数据，每 16 channels 配一个 E4M3 scale | 降低 HBM / SSD 存储和搬运量 |
| Indexer Q / K | MXFP4 | 兼顾 indexer 计算效率与缓存大小 |
| SWA KV | 保留 FP8 | 局部状态对量化更敏感 |

Main KV 的格式借鉴 NVFP4，但省略第二级 global scale；**RoPE 和 non-RoPE 部分使用同一种格式，在 RoPE 之后量化**。读取缓存后先反量化再做 attention，因此这里的 FP4 首要收益是存储压缩，不要求 attention 主计算直接使用相同格式的 FP4 矩阵乘。

单算上述 main KV 的数据和一级 scale，每元素平均需要：

$$
4 + \frac{8}{16} = 4.5\text{ bits}
$$

所以“FP4”不能简单理解成所有缓存元素都恰好占 4 bits。这个算式还未计入具体实现的对齐和其他元数据。

CSA2 与 FP4 结合后，论文报告 **global KV 仅 890 bytes/token，约为 V4 Flash 的 1/4**。该口径包含 main KV 和 indexer K，**不包含本层各自保留的 SWA KV**。按这一口径，100 万 token 的 global KV 数据约为 **0.89 GB（十进制）**；完整请求的显存预算还需加上 SWA、权重、workspace 等。

来源：Abstract、§1，pp.1、4–5；§2.4.4，p.14。4.5 bits 和 0.89 GB 为根据论文配置进行的简单换算。

## 5. SWA Bounded Replay：只重算尾部，降低持久化成本

这是连接架构与部署的一环。SWA 在运行时只需保留固定窗口，但在多轮会话的许多历史检查点上长期保存 SWA 状态，累计容量仍然很大。论文指出，V4 的 SWA KV 接近 persistent KV 容量的一半。

难点是：**SWA 的依赖会沿层数累积**。要精确恢复 $L$ 层的 SWA，理论上需 replay 约 $LW$ 个 token；只看“窗口 128”并不意味着精确恢复只需 128 tokens。

V4.1 接受一个经过实验验证的近似：仅 replay 最近 $W=128$ tokens，并把 SWA 的可见范围截在 replay 段内。论文报告质量损失很小，但重建状态与完整前向并非数学等价。

| 路径 | 触发与动作 | 解决的成本 |
| --- | --- | --- |
| **Encoder Bounded Replay** | global prefix KV 命中而 encoder SWA 缺失时，重放缓存前缀最后 128 tokens；只重建 SWA，已有 global KV 不重算、不覆盖；新 suffix 正常生成两种 KV | 允许把 SWA 从长期 persistent cache 中移除 |
| **Decoder Bounded Replay** | 每次 prefill，把 prompt 最后 128 tokens 的 encoder 输出送过 decoder，重建本次 decode 所需 SWA | 让其余 prompt token 绕过完整 decoder 计算 |

部署上区分了两类生命周期：global KV 留在长期 persistent cache；encoder SWA 则使用分钟级 TTL 的短期 host DRAM 池，缺失时做 bounded replay。**Decoder SWA 不进入 prefix cache**，由每次 prefill 重建。

所以 persistent KV 的约 **1/8** 来自两个效果叠加：

$$
\underbrace{\text{长期缓存移除 SWA}}_{\text{约剩 }1/2}
\times
\underbrace{\text{global KV 的架构与精度压缩}}_{\text{约剩 }1/4}
\approx \frac18
$$

**理解：真正让缓存分层变得可行的是 miss 之后的恢复成本足够小。** 这也说明 1/8 是相同工作负载下的部署统计，不是每个请求在所有长度上的固定压缩比。关于旧版 KV cache 在 vLLM 中的组织，可对照 [[source-code/vllm/DeepSeekV4 KV Cache 管理]]；缓存工作集与 miss 的影响可参见 [[MLSys/LRU 抖动（LRU Thrashing）与 KV Cache|LRU 抖动与 KV Cache]]。

来源：§3.2.1–3.2.2，pp.19–20。

## 6. Single-Pass mHC：改一点依赖关系，换来更充分的 kernel fusion

mHC 在相邻 block 之间保留多条 residual streams；本模型 expansion factor 为 **4**。原始形式中，当前 block 的输入混合系数 $A_l$ 也由当前 residual $X_l$ 预测：

$$
X_{l+1}=B_lX_l+C_l\mathcal F_l(A_lX_l),
\qquad (A_l,B_l,C_l)=\mathcal H(X_l)
$$

这里有一个影响融合的数据依赖：需要先遍历 hidden dimension，算完 $A_l$，才能做输入混合 $A_lX_l$，因此还要再次读取 residual。

Single-Pass mHC 将输入混合系数错开一个 block，改用 **前一个 block 产生的 $A_{l-1}$**：

$$
X_{l+1}=B_lX_l+C_l\mathcal F_l(A_{l-1}X_l)
$$

这样每个 hidden tile 到达后，便可同时参与输入混合与下一组系数的预测，不必等待当前完整 reduction 结束。部署时，**Mega-mHC** 将 residual update、input mixing、coefficient prediction、input pre-norm 和 FP8 conversion 融进一个 kernel。

论文按 activation 元素读写量计，原实现含 pre-norm 为 $(4n+4)d$，Single-Pass 实现达到 $(2n+2)d$，即 **这部分 activation memory traffic 减半**。论文报告系数错位带来的质量损失可忽略；这个收益不是整个模型的显存带宽或时延减半。

**理解：这里先改计算图，让融合具备条件，再用 kernel 实现兑现收益。**

来源：§2.4.1，pp.12–13；§4.2.1，p.22。

## 7. Engram：把部分记忆容量放进稀疏 lookup

V4.1 额外配置 **196B Engram 参数**，将 memorization 与 computation 部分解耦。输入 token 的局部 N-gram 经 tokenizer compression 和 multi-head hashing，查出 memory embedding，再经 context-aware gating 和多分支集成融入主干。

- 两个模块平分参数，放在 **zero-indexed layer 1 和 14**，即第 2、15 个 Transformer 层。
- N-gram orders 为 **{2, 3, 4}**，每个 order 使用 8 个 hash heads，总 embedding dim 为 2048。
- 每个 head 的表约有 16M entries，表长取不同质数；embedding tables 与 K/V projections 均用 FP8。
- 相比原 Engram，去掉 short causal convolution，以降低推理栈复杂度；embedding 优化器改为 momentum update + Sinkhorn balancing。

推理上的重点是 **lookup 地址只取决于输入 token 序列**，无需等待前面深层 hidden states 算完。因而可以从 host memory 提前经 RDMA 预取 embedding，并与主干计算重叠。

**理解：196B 查表参数增加的是稀疏访问的记忆容量，不能等价为新增 196B dense FFN 计算。** 但相应的存储、通信和预取系统仍然需要承担成本。

来源：§2.4.2，p.13；§3.1.3，p.18。

## 8. DSpark：让 draft 长度同时适应预测质量和系统负载

主干预训练不再联合训练 MTP，改为预训练完成后单独训练 **DSpark**，用于 speculative decoding。V4.1 的具体配置是：

- **3 个 Transformer blocks**，SWA window 为 128。
- 一次前向并行得到 **5 个 draft positions** 的基础 logits，再由轻量 **Markov head** 补上 token 间依赖。
- Confidence head 预测每个位置的条件接受概率，进一步估计 draft prefix 能存活多长。
- Scheduler 结合这些概率与实测 engine throughput 曲线，按当前负载为**每个请求动态选择 verification length**，优化系统期望吞吐。

训练上先冻结 backbone，只训练 DSpark；post-training 时让 DSpark 跟随 backbone 更新，但其目标的梯度不回传 backbone。它同时服务于线上推理和 RL / OPD 的 rollout 生成。

**理解：并行 drafting 降低串行开销，Markov head 补依赖，confidence scheduler 控制无效验证的成本。** 更完整的算法讨论见 [[paper/DSpark-Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation|DSpark]]，并可与 [[paper/DFlash Block Diffusion for Flash Speculative Decoding|DFlash]] 对照。

来源：§2.4.3，pp.13–14。

## 9. 多模态入口：先减少视觉 token，再交给同一套长上下文主干

图像路径为：

```text
Image → DeepSeek-ViT → 3×3 pixel-unshuffle → 2-layer MLP projector
                                                ↓
                         与 text embeddings 一起输入 causal encoder
```

DeepSeek-ViT 从头训练，使用 **32 layers、hidden 1024、16 heads、patch size 14**。为支持可变分辨率，用 **2D-RoPE** 替代标准 absolute positional embedding，并采用 linear patch projection、RMSNorm 和 SwiGLU。

`3×3 pixel-unshuffle` 将局部空间位置重排到 channel 维，使送进语言主干的 **视觉 token 数缩小 9 倍**；论文配置支持约 1344×1344 的输入分辨率。

另一个与 MoE 相关的细节是 **modality-specific load balancing**：text 和 image 分别维护 expert correction biases、分别按负载更新，避免汇总负载均衡掩盖某个模态内部的专家拥塞；被选中 expert 的输出权重仍使用原始 routing scores。

来源：§2.1.1，p.8；§4.2.1，p.22。

## 从推理系统看，这些设计分别省在哪里

| 设计 | 直接减少的成本 | 要保留的边界 |
| --- | --- | --- |
| CED + decoder replay | 大部分 prompt 的 decoder 层计算 | 尾部仍需 decoder 前向；decode 仍走完整主干 |
| CSA2 KV sharing | 重复的 main KV / indexer K 存储 | 各层 SWA KV 和 Main Q 保持独立 |
| CSA2 index reuse | Reuse 层的 indexer 计算 | Reindex 层仍重新选择上下文 |
| Hierarchical indexer | decoder 深层 Reindex 的扫描范围 | 第一层保留全局扫描 |
| FP4 main KV | KV 容量与数据搬运 | SWA 保留 FP8；读取后反量化 |
| Encoder bounded replay | 长期 SWA 存储及 miss 恢复成本 | 状态是近似重建 |
| Single-Pass mHC | residual activation 读写和 kernel 调度 | 减半指 mHC 对应部分的流量 |
| Engram | 以稀疏访问增加记忆容量 | 需要表存储、通信和预取 |
| DSpark | 每个接受 token 分摊的生成开销 | 收益依赖接受率、负载与验证成本 |

![[assets/MLSys/Models/DeepSeek V4.1 Flash/DeepSeek V4.1 Flash Figure 2 Decode FLOPs.png]]

*论文 Figure 2，p.5：上下文由 4K 增至 1M（256 倍），V4.1 Flash 的单 token decode FLOPs 只增加约 25%。图中按 BF16 / FP8 / FP4 的 1 / 0.5 / 0.25 权重折算，描述的是计算量，不是端到端 latency。*

实际部署还采用 vision **Encoder–Prefill–Decode（EPD）分离**，这里的 Encoder 指视觉编码阶段，与 CED 的 causal encoder 含义不同。论文报告经 kernel fusion 后，CSA2 **Reuse 层**每层 prefill 只需 15 个 kernels，decode 只需 11 个；这些数字属于论文的优化实现，不能直接当作所有框架的执行结果。

来源：§1、Figure 2，p.5；§3.2，pp.18–19。

## 参考与关联

- 论文：*DeepSeek-V4.1-Flash: Pushing the Limits of KV Cache Compression*，用户提供的 PDF，arXiv:2609.19969v1。本文重点对应 §2、§3.2、§4.2.1。
- [[MLSys/Models/Deepseek V4|DeepSeek V4]]：上代模型的实现与系统优化入口。
- [[MLSys/算子/多头潜在注意力 (MLA)|MLA]]：KV latent 表示和 attention 计算形式。
- [[source-code/vllm/DeepSeekV4 KV Cache 管理]]：上代模型的 KV 分组、布局与分配。
- [[paper/DSpark-Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation|DSpark]]：draft head、接受率与负载感知调度。
