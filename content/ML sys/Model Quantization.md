# Concept
在大模型里，我们关心的是把 FP16/BF16 的权重 / 激活 / KV cache 映射到更低位宽（INT8, INT4, FP8, NF4 …）的整数或低精度浮点上，以此降低显存占用、提升带宽利用率，并在支持低精度算力的硬件上加速 GEMM。

## 基本映射方式
给定浮点张量 $x \in [\alpha, \beta]$，目标位宽 $b$，量化的核心就是确定 **scale** $s$ 和 **zero-point** $z$：

- **对称量化（symmetric）**：$z=0$，$s = \max(|\alpha|, |\beta|) / (2^{b-1}-1)$
  $$x_q = \text{clip}\left(\text{round}(x / s),\ -2^{b-1},\ 2^{b-1}-1\right)$$
- **非对称量化（asymmetric）**：$s = (\beta-\alpha)/(2^b-1)$，$z = \text{round}(-\alpha/s)$
  $$x_q = \text{clip}\left(\text{round}(x/s) + z,\ 0,\ 2^b-1\right)$$

反量化：$\hat{x} = s \cdot (x_q - z)$。

权重分布大致以 0 为中心，常用对称；激活有偏（尤其 ReLU/GeLU 之后）时非对称更合适。

## 量化粒度（Granularity）
- **per-tensor**：整个张量一个 scale，最省但精度差
- **per-channel / per-axis**：weight 的 output channel 上一组 scale，是 W8A8 最常见的粒度
- **per-group**：把一行权重每 $g$ 个元素分一组（如 GPTQ/AWQ 常用 g=128），W4 几乎必备
- **per-token**：激活按 token 单独算 scale（SmoothQuant 用），动态计算

## 几个正交分类维度
| 维度 | 选项 |
|---|---|
| 训练阶段 | **PTQ**（Post-Training）/ **QAT**（Quantization-Aware Training） |
| 量化对象 | **Weight-only**（W4/W8） / **Weight-Activation**（W8A8、W4A8 等） / **KV-cache only** |
| 激活 scale | **static**（离线 calibration 出来）/ **dynamic**（runtime per-token 算） |
| 数据类型 | INT8 / INT4 / FP8 (E4M3, E5M2) / FP4 / NF4 / MXFP4 |

> [!note] LLM 上 PTQ 几乎是主流
> 7B 以上模型重训成本高，绝大多数生产方案是 PTQ + 少量 calibration data，只有对精度极敏感（如 W4A4）时才上 QAT。

# 常见量化算法

## LLM.int8() — outlier 拆分
- 论文：https://arxiv.org/abs/2208.07339
- **观察**：LLM 激活里存在少量 outlier channel（数值比其他大 1~2 个数量级），直接量化会让其他 channel 的 scale 被拉爆。
- **做法**：把激活按 channel 拆成两部分
  - outlier channel：保持 FP16 做 matmul
  - 其余 channel：vector-wise INT8 量化做 matmul，再反量化加回 FP16 结果
- **特点**：W8A8、零精度损失、第一个让 OPT-175B 跑在单机上的方案，但 outlier 路径拖慢推理。

## SmoothQuant — 把激活的难度搬到权重
- 论文：https://arxiv.org/abs/2211.10438
- **观察**：激活难量化是因为 outlier channel，但权重分布平坦、好量化。
- **做法**：引入逐通道平滑系数 $s$，对激活除以 $s$、对权重乘以 $s$，数学上等价：
  $$Y = (X \cdot \text{diag}(s)^{-1}) \cdot (\text{diag}(s) \cdot W)$$
  $s_j = \max(|X_j|)^\alpha / \max(|W_j|)^{1-\alpha}$，常取 $\alpha=0.5$。
- **效果**：让 W8A8 per-tensor / per-token 静态量化变得可行，几乎零精度损失。

## GPTQ — 基于 Hessian 的逐列量化
- 论文：https://arxiv.org/abs/2210.17323
- **思路**：把权重量化建模为 layer-wise 重建误差最小化：
  $$\min_{\hat{W}}\ \|WX - \hat{W}X\|_F^2$$
  借鉴 OBS（Optimal Brain Surgeon），用 $H = 2XX^T$ 的 Cholesky 分解，按列量化并把误差补偿到后续列上。
- **特点**：weight-only、INT4/INT3、per-group（常 g=128）、calibration 只需几百条样本、对 7B 模型几分钟到几十分钟搞定，是 GGUF/llama.cpp 4-bit 模型的事实标准之一。

## AWQ — Activation-aware Weight Quantization
- 论文：https://arxiv.org/abs/2306.00978
- **观察**：不是所有权重都同等重要——**激活大的通道对应的权重更重要**（只保护 1% 的 salient weight 就能挽回大部分精度）。
- **做法**：不像 LLM.int8() 那样把这部分保留 FP16，而是给每个 input channel 找一个缩放因子 $s$，对权重乘 $s$、对激活除 $s$（同 SmoothQuant 的等价变换），让 salient 通道的权重被放大 → 量化时占据更多比特 → 减小误差。$s$ 通过 grid search 找。
- **特点**：W4A16、no reorder（对推理 kernel 友好）、精度优于 GPTQ，TensorRT-LLM / vLLM 都有专用 kernel。

## SpQR — Sparse-Quantized Representation
- 论文：https://arxiv.org/abs/2306.03078
- **做法**：把权重分成"普通部分（3~4 bit 量化）+ 极少量 outlier（FP16 稀疏存储）"，配合 group scale 也做二级量化。
- **特点**：进一步逼近 FP16 精度，平均位宽 < 4 bit。

## QLoRA — 4-bit + LoRA 微调
- 论文：https://arxiv.org/abs/2305.14314
- 三件套：
  1. **NF4（NormalFloat 4）**：假定权重服从 $\mathcal{N}(0,1)$，把 16 个码字放在标准正态的等分位数上，对正态权重信息论最优。
  2. **Double Quantization**：把 NF4 用的 per-group FP32 scale 再做一次 8-bit 量化，平均每参数再省 ~0.37 bit。
  3. **Paged Optimizer**：用 NVIDIA unified memory 防止长序列 OOM。
- **特点**：让 65B 模型 LoRA 微调能塞进单卡 48G，并不是为了推理加速。

## FP8 — 硬件原生低精度浮点
- Hopper / Ada / Blackwell 硬件原生支持，两种格式：
  - **E4M3**（4 位 exp / 3 位 mantissa）：动态范围小，精度高，常用于 weight 和 forward activation
  - **E5M2**（5 位 exp / 2 位 mantissa）：动态范围大，精度低，常用于 gradient
- 相比 INT8 不需要 calibration outlier 处理，per-tensor scale + amax tracking 即可，是目前生产推理（TensorRT-LLM、vLLM、SGLang）的主流 W8A8 路线。
- 进一步有 **FP4（MXFP4 等微缩放格式）**，Blackwell 起原生支持。

## KV Cache 量化
长上下文场景下 KV cache 占用 >> 权重，单独量化非常划算。
- **per-token + per-head** INT8 / INT4 较常见
- 难点：K 的某些 head 存在 outlier channel（和激活类似），需要类似 SmoothQuant 的旋转 / 重排（如 KIVI、KVQuant）。
- 注意 K 和 V 的分布不同，通常分开处理。

# 选型速查
| 场景 | 推荐 |
|---|---|
| 单卡塞下大模型 + 精度优先 | W4A16，AWQ 或 GPTQ |
| 吞吐优先 + 有 H100/H800 | FP8 (W8A8)，TensorRT-LLM / SGLang |
| 长上下文推理 | 在上面基础上加 KV cache INT8/INT4 |
| 微调 65B+ | QLoRA (NF4) |
| 仍要 GPU 老卡 + 极致显存 | GPTQ INT4 + llama.cpp / GGUF |

# 参考
- A Survey of Quantization Methods for Efficient Neural Network Inference (https://arxiv.org/abs/2103.13630)
- A Survey on Model Compression for Large Language Models (https://arxiv.org/abs/2308.07633)
- 相关算子见 [[Rotary Embedding]]
