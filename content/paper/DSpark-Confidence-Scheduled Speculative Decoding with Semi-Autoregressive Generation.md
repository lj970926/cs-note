---
title: DSpark — Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation
tags:
  - paper
  - speculative-decoding
  - dspark
  - semi-autoregressive
  - confidence-scheduled
  - dflash
  - llm-inference
---

# Key Insight
Speculative Decoding 开启后，TPOT 的计算公式：
$$L=\frac{T_{draft} + T_{verify}}{\tau}$$
$T_{draft}$ 和$T_{verify}$ 即 draft 和 verify 阶段的耗时，$\tau$ 为 accept_length。为了压缩 TPOT，主要是降低$T_{draft}$ 以及提升$\tau$ 
* 传统的 autogressive draft model在提升$\tau$ 上有优势，但是因为 draft token 的串行生成，$T_{draft}$ 随draft_len 线性增长。这也导致它们的 draft_len 通常比较短
* [[DFlash Block Diffusion for Flash Speculative Decoding|DFlash]] 等基于 Diffusion LLM 的模型，所有 draft token 可以并行执行，因此可以配置比较大的draft_len，但在 draft model 的预测准确度上目前仍然不如 autogressive 方法
* Speculative Decode 的性能提升与Decode 的 batch size 密切相关，负载高峰期 bs 很大时，Speculative Decoding 有可能带来负收益，浪费计算资源。
>[!note]
>Speculative Decoding 的收益本质上来自 bs 增大过程中算子从 memory-bound 转变为 compute-bound 带来的额外性能收益


DSpark 采用了一些手段来解决上述问题
# Architecture
![[IMG-20260630145118180.png]]
 核心 Contribution 主要是两大块：
 * Semi-Autoregressive Generation：对 DFlash 等完全 parallel 的 drafter 的改进，在原有parallel block 的基础上添加了一个轻量的 sequential head 以捕获 inter-token dependency。目的是希望融合两种 drafter 的优势，在保持$T_{draft}$ 近似 draft_len 无法的情况下提升模型能力。
 * Confidence-Scheduled Verification：本质是一个 Early Rejection 的机制。添加了一个 Hardware-Aware Prefix Scheduler 来预估不同 token 被接受的概率，并根据实际的硬件负载情况决定哪些token 要参与 draft。目的是缓解高负载下由于 reject token 带来的性能损失
## Semi-Autoregressive Generation
 Figure 1 里的结构 2，Parallel Block 部分直接用了 DFlash 的实现，唯一的区别是原版 DFlash 的 anchor token 不参与 draft logits的生成，但是 DSpark的 anchor token 也负责一个 draft logits 的生成，这样，DSpark 一共只需要$\gamma - 1$ 个mask token 输入。
 文章的重点在于上面的 Sequential Block 部分，论文里对应的公式如下：
 ![[IMG-20260630190028450.png]] 这个公式体现到代码上的动作是：Sequential Block 对 Parallel Block 输出的 logits，会加上一个 bias $B_k$ ，这个 bias 与前序所有 token 有关（条件概率）。在生成 draft token 的过程中，Sequential Block 从前到后的计算每个 position 的$B_k$ ，然后加到logits 上。通过这种方式，前序的 k-1 个 token 对当前 token$x_k$ 产生了影响，也就自然的构建起了token建的 casual dependency.
 现在关键问题就变成了，$B_k$ 是如何产生的，论文里提了两种方法：Markov Head 和 RNN Head。
### Markov Head
如果限定 $x_k$只依赖$x_{k - 1}$ ，上述过程概率序列实际上等价于一个 Markov 过程。该过程对应一个状态转移矩阵 $B \in \mathbb{R}^{V \times V}$ ，其中 V 是词表的长度。对每个 draft model 生成的 token $x_{k - 1}$ ，通过以下方式计算 $B_k$ 
$$B_k = B[x_{k-1}]$$
这里类似一个 embedding 的过程，根据$x_{k - 1}$ 从转移矩阵 B（作为模型参数）中索引出一个行向量，即表示该 token 对下一个 token 的因果影响。但是上面这套流程有一个很大的问题是词表太大了，这样这个转移矩阵 B 的大小也会很大。文章中这里又一次用了 low rank factorization的机器，把大的矩阵分解成两个较小矩阵的乘积：
$$B = W_1 \times W_2$$
其中$W_1 \in \mathbb{R}^{V \times r}$ ，$W_2 \in \mathbb{R}^{r \times V}$ ，$r \ll V$  。这样，这边那个 矩阵 B 的 lookup table，实际上就变成了下面这个式子：
![[IMG-20260630193752181.png|1058]]
可以看到，$W_1$ 本质上是一个 embedding table，$W_2$ 本质上是一个 Up Projection。
### RNN Head
Markov Head只能表达前后两个 Token间的依赖关系，这与实际上 Transformer 模型的自回归过程仍然有比较大的差距。RNN Head 主要是解决这个过程。这个 Head 的基本想法就是用一个建议的 RNN Module 来根据内部状态$s_{k-1} \in \mathbb{R}^r$  ，当前 token在 W1 的 embedding 结果$z_k=W_{1}[x_{k-1}] \in \mathbb{R}^r$，以及下一个 token 的 hidden_states $h_k \in \mathbb{R}^d$，生成下一个时刻的内部状态$s_k$，以及下一个 Token 的$B_k$ ：
![[IMG-20260630194437651.png|1058]]
## Confidence-Scheduled Verification
* 不同任务的平均 accept length 不同（结构化数据，如代码和数学，通常有较高的 accept len，而网页聊天则较低）-> 需要对不同的任务设置不同的 verify length
* speculative decoding 的性能提升与负载情况息息相关 -> 需要根据当前的负载动态自适应的选择verify length
以上两个 motivation分别引出了用来选择 verify token 的两个主要 component：Confidence Head 和 Hardward-aware Scheduler.
### Confidence Head
本身比较简单，就是一个全连接层+sigmoid 激活，对每个 draft position 生成一个confidence score $c_k$ ，指示当前位置的 token 被target model接受的概率:
![[IMG-20260701190640874.png]]
这里比较特殊的是文章里提到神经网络的$c_k$ 估计往往存在 overconfident 的问题，所以设计了一套事后校准的机制（Post-hoc Calibration)。大概的思路是选择一个小的 validation  set，依次对每个位置做 grid-search，选择与该验证集实际接受情况最接近的 temperature $T_k$ ，用于对confidence head 输出的$c_k$ 进行 normalization （Sequential Temperature Scaling）。该过程发生在模型部署前的离线调优过程中，实际线上部署过程中$T_k$ 作为超参数存在，不会重复校准。所以体现在推理上其实就是多了一步 normalization。
### Hardware-aware Scheduler
对于推理服务特定的 batch size B，我们用$SPS(B)$ 表示 steps per second，即每秒的 step 数。假设我们对某个请求 r 选定的 verify length 为$l_r$ ，那么 batch size可以拆解为：
$$B = \sum_{r=1}^{R} (1 + l_r)$$
这里的 1即 bonus token。
我们用$a_{r, k}$ 表示第 r个请求中的第 k 个 position 被接受的概率，有$a_{r, k} = \prod_{i <= k} c_{r, i}$ ，这里$c_{r, i}$ 即为上面 confidence head 输出的条件概率。则系统的总吞吐实际上可以表示为：
$$\Theta = (\sum_{i = 1}^{R} (1 + \sum_{j=1}^{l_r}a_{i, j})) * SPS(B)$$
上面这个式子本质上是一个关于$l_{1} ,... l_{R}$   的函数，因此现在 Hardware-aware Scheduler 的任务就变成了一个R 个变量的最优化问题。
DSpark 这里没有真的求解这个目标函数。这里主要是由于对于任意一个请求 r，每个位置的接受概率是单调非增的（$c_{r, k} \le 1$）。这样，就可以采用贪心的策略，每次选择$a_{i, j}$ 最大的 token，代入上面$\Theta$ 的计算公式，直至找到最大的$\Theta$ 。实际上，这里的处理要更加简单，只要发现$\Theta$ 开始下降，就立即终止搜索。（non-anticipating property）
完整算法如下：
![[IMG-20260702112748225.png]]


