> https://arxiv.org/abs/2106.08295

# Overview
Qualcomm AI Research 出品的神经网络量化综述/白皮书。系统介绍了量化的硬件背景、基础理论以及两大类算法 ——  Post-Training Quantization (PTQ) 和 Quantization-Aware Training (QAT)，并给出了经过实验验证的最佳实践 pipeline 和调试流程。可以认为是 [[Integer Quantization for Deep Learning Inference]] 的扩展和升级版，后者主要聚焦实验对比，本文则覆盖了更多算法细节（CLE、Bias Correction、AdaRound 等）。

# Quantization Fundamentals
## Hardware background
量化的本质动机来自硬件：NN 加速器的核心是 MAC（Multiply-Accumulate）单元。计算过程：
* 加载 bias 到 accumulator
* PE （processing element）做 $C_{n,m} = W_{n,m} \cdot x_m$
* accumulator 累加：$A_n = b_n + \sum_m C_{n,m}$
* 完成后 activation 写回 memory 供下一层使用

MAC 操作和 data transfer 是推理的主要能耗来源。低 bit 定点（如 INT8）不仅减少 data transfer，也大幅降低 MAC 的能耗（数字运算成本随位宽线性到二次增长）。

定点化的形式：浮点向量 $x \approx s_x \cdot x_{int}$，权重激活分别有 scale。累加可以写成：
$$\hat{A}_n = \hat{b}_n + s_w s_x \sum_m W^{int}_{n,m} x^{int}_m$$

scale 被提到累加之外，内部是纯定点 MAC。**accumulator 需要保持高位宽（典型 32-bit）防止溢出**；输出写回前 requantize 回 INT8。

## Uniform Affine Quantization
三个参数：scale $s$、zero-point $z$、bit-width $b$。
* 量化：$x_{int} = \text{clamp}(\lfloor x/s \rceil + z; 0, 2^b - 1)$
* 反量化：$x \approx s(x_{int} - z)$
* zero-point 保证真实 0 没有量化误差（对 zero padding / ReLU 重要）

存在 clipping error（超出范围被截断）和 rounding error（区间内 round 损失）的 trade-off：扩大 range 减小 clipping 但增加 rounding。

### Symmetric quantization
* $z = 0$，省去 zero-point 偏移的计算开销
* signed 适合对称分布；unsigned 适合 ReLU 等 one-tailed 分布

### Power-of-two quantizer
* $s = 2^{-k}$，scale 退化成 bit-shifting，硬件友好
* 但 scale 表达力变弱，rounding/clipping 的 trade-off 受限

## Quantization Granularity
* per-tensor：最简单，硬件普遍支持
* per-channel（特别是 weight 的 output channel）：精度更好，可以直接作为额外的 per-channel scale 整合到 MAC，几乎无开销；但 activation 的 per-channel 需要按 input channel 给 accumulator 单独 rescale，硬件支持差
* per-group：粒度更细但硬件支持有限

## Quantization Simulation
在 FP 框架里通过插入 fake quantize 节点模拟定点行为，输入输出都是 FP（只是落在量化网格上），方便用 GPU 训练验证。

### BN Folding
推理时 BN 的 affine 变换被吸收进相邻 Linear/Conv：
$$\tilde{W} = \frac{\gamma W}{\sqrt{\sigma^2 + \epsilon}}, \quad \tilde{b} = \beta - \frac{\gamma \mu}{\sqrt{\sigma^2 + \epsilon}}$$

避免额外的 scaling/offset 计算，也避免额外的量化点。

### Activation Function Fusing
要求 requantization 单元在 non-linearity 之后做。ReLU 这种可以直接通过设置 quantizer 的 min 为 0 来模拟；Swish / sigmoid 这种没硬件支持时只能在前后各插一个 quantizer 节点，对精度影响大。

### 其他层
* Max pooling：输入输出在同一 grid，不需要重新量化
* Average pooling：需要量化但可以共用 quantizer
* Element-wise add / Concat：两路输入的 grid 必须匹配，否则需要 requantize

## Practical Considerations
### Symmetric vs Asymmetric
asymmetric weight × asymmetric activation 展开会有依赖输入 x 的数据相关项，**每个 batch 都要重新计算，开销显著**。所以推荐 **asymmetric activation + symmetric weight**：avoid data-dependent term。

### Per-tensor vs Per-channel
weight per-channel 已经成为常见做法（不增加 MAC 内部成本，只多一个 per-channel scale）；activation per-channel 硬件支持差，一般不用。

# Post-Training Quantization (PTQ)
PTQ 不需要训练 pipeline 和标注数据，最多需要一小份 calibration set。

## Quantization Range Setting
weight 一般不需要 calibration data，activation 需要少量 batch。
* **Min-max**：取 tensor 的 min/max，无 clipping 但对 outlier 极敏感
* **MSE**：minimize $\|V - \hat{V}(q_{min}, q_{max})\|_F^2$，对 outlier 更鲁棒
* **Cross-entropy**：特别适合分类网络最后一层的 logits，保留 top-k 的顺序信息
* **BN-based**：用 BN 的 $\beta \pm \alpha \gamma$ 作为 activation range，data-free

实验结论：高 bit 时 MSE 和 min-max 接近，低 bit 时 MSE 显著更好；最后一层 logits 用 cross-entropy 最佳。

## Cross-Layer Equalization (CLE)
**问题**：depth-wise separable 层 + BN folding 后，per-output-channel 的 weight 范围差异极大（见 MobileNetV2），per-tensor 量化几乎失效。
**思路**：利用 ReLU / piece-wise linear 的 positive scaling equivariance：$f(sx) = sf(x)$。对连续两层做 reparameterization：
$$\tilde{W}^{(2)} = W^{(2)} S, \tilde{W}^{(1)} = S^{-1} W^{(1)}$$
**最优 scale**：$s_i = \frac{1}{r_i^{(2)}} \sqrt{r_i^{(1)} r_i^{(2)}}$，使两层 dynamic range 对齐。

### Absorbing high biases
CLE 后有些 channel 的 bias 变大导致 activation 的 dynamic range 也很广。可以利用 ReLU 的性质把大 bias 吸收到下一层：$\tilde{b}^{(1)} = b^{(1)} - c$, $\tilde{b}^{(2)} = W^{(2)}c + b^{(2)}$，其中 $c_i = \max(0, \beta_i - 3\gamma_i)$（用 BN 参数估计 99.865% 区间下界）。

实验：MobileNetV2 INT8 从 0.12% 提升到 70.92%，甚至超过 per-channel quantization。

## Bias Correction
量化误差通常是有偏的：$\mathbb{E}[\hat{W} x] \neq \mathbb{E}[Wx]$，深度可分离层尤其严重（只有 9 个元素的 3x3 kernel）。
* **Empirical**：用 calibration data 算 $\mathbb{E}[\hat{W} x] - \mathbb{E}[Wx]$
* **Analytic**：用 BN 参数 + ReLU 假设解析推导 $\mathbb{E}[x]$，data-free

修正项可以直接吸收到 bias，无推理开销。MobileNetV2 单独 bias correction 就能从 0.12% 升到 52.02%。

## AdaRound
**问题**：weight 量化默认 round-to-nearest，单层 MSE 最优但不是 task loss 最优。
**推导**：
* task loss 用二阶 Taylor 近似 → Hessian QUBO 问题（NP-hard，且 Hessian 不可算）
* 用 local MSE 近似：$\arg\min_{\Delta W} \mathbb{E}[(\Delta W^{(\ell)}_{k,:} x^{(\ell-1)})^2]$
* 用连续松弛 + 正则化约束到 0/1：$\tilde{W} = s \cdot \text{clamp}(\lfloor W/s \rfloor + h(V); n, p)$
* 最终目标加入 activation function：$\|f_a(Wx) - f_a(\tilde{W}\hat{x})\|_F^2 + \lambda f_{reg}(V)$
* 只需要少量无标签数据，无 hyperparameter，无 end-to-end fine-tuning

ResNet18 4-bit 量化，AdaRound 比 round-to-nearest 提升 10%+。

## Standard PTQ Pipeline
![image|60](https://i.imgur.com/pipeline-placeholder.png)

推荐顺序：
1. CLE 预处理（depth-wise separable 模型必须）
2. 加 quantizer：weight symmetric + per-channel，activation asymmetric
3. weight range setting：layer-wise MSE
4. 如果有 calibration data → AdaRound；否则 → Bias Correction
5. activation range setting：MSE 或 BN-based

实验结果（W8A8）所有模型损失 <0.7%；W4A8 在 MobileNetV2/EfficientNet lite 等 depth-wise 模型上 per-tensor 损失较大，per-channel 可弥补。

## Debugging Flow
当 PTQ 效果不佳时的诊断流程：
1. FP32 sanity check：把 quantizer 设为 32-bit 应该完全等价
2. 分别只量化 weight / 只量化 activation 看主要损失来源
3. weight 问题 → CLE / per-channel / Bias Correction / AdaRound
4. activation 问题 → 换 range setting / 调整 CLE
5. 逐层分析：只量化一层看每层敏感度
6. 可视化分布找问题（如 BERT 的 per-token activation 异常）
7. 仍解决不了 → QAT

# Quantization-Aware Training (QAT)
低 bit （特别是 activation 4-bit）时 PTQ 不够，需要训练时模拟量化噪声让网络学会适应。

## Simulating Quantization for Backward Path
quantize 中的 round 操作梯度处处为 0 / undefined。用 **STE（Straight-Through Estimator）** 把 round 的梯度近似为 1：
$$\frac{\partial \hat{x}_i}{\partial x_i} = \begin{cases} 1 & q_{min} \leq x_i \leq q_{max} \\ 0 & \text{otherwise} \end{cases}$$

区间内梯度直通，区间外置 0（被 clamp 截断）。

进一步可以学习 quantization parameters（scale、zero-point）。对 scale 求导：
$$\frac{\partial \hat{x}_i}{\partial s} = \begin{cases} -x_i/s + \lfloor x_i/s \rceil & \text{in range} \\ n \text{ or } p & \text{out of range} \end{cases}$$

zero-point 在 round 之外，做 STE 即可。

## BN Folding and QAT
QAT 中如何处理 BN 是个细节问题：
1. **Static folding**：训练前把 BN 固化到 weight，再训练。最简单且效果好。
2. **Double forward** (Jacob et al.)：训练时同时更新 BN running stats 并矫正，复杂且不一定更好。
3. **Per-channel + keep BN unfolded**：BN scaling 直接吸收到 per-channel scale 里，简洁优雅。

实验显示 static folding 与 double forward 性能相近，前者更简单。

## Initialization for QAT
* **Range init**：MSE 初始化的起点 accuracy 远高于 min-max，但训练几个 epoch 后 gap 缩小。低 bit 时影响更明显。
* **CLE init**：对没有 CLE 就训不起来的模型（如 MobileNetV2 per-tensor）是必须的；其他情况只小幅提升。

结论：good init 加快收敛，但训练充分后影响有限。

## Standard QAT Pipeline
1. CLE （depth-wise 模型必须）
2. 加 quantizer：symmetric weight + asymmetric activation，per-channel 可选
3. Range estimation：layer-wise MSE 初始化
4. Learnable quantization parameters：scale / zero-point 设为可学习。SGD 时 quantizer 的 lr 要降低；Adam/RMSProp 可避免调 lr。
5. 训练

## Experiments
* W8A8 / W4A8 在 ResNet / Inception 上能达到甚至超过 FP32
* MobileNetV2 / EfficientNet lite 等 depth-wise 模型 W4A4 仍有挑战，但 per-channel 可拉近差距
* BERT W8A8 GLUE 损失 <1%；W4A8 也基本可用；W4A4 显著掉点

# Summary
* PTQ 是 8-bit 量化的首选方案，本文 pipeline 在大部分模型上 W8A8 损失 <1%，W4A8 也可接受
* QAT 处理 4-bit activation 这种激进场景，accuracy 更好但需要训练成本和标注数据
* depth-wise separable 是量化的主要难点：BN folding 后 channel 间 range 极不均，需要 CLE / per-channel / bias correction 等技巧组合
* 关键 trick 总结：CLE（balance ranges）、Bias Correction（修正期望偏移）、AdaRound（最优 rounding）、STE（让 quantize 可微）、static BN folding
