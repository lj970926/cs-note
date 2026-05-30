---

aliases:

- RMS Norm
- RMSNorm
- Root Mean Square Normalization tags:
- deep-learning
- normalization
- transformer created: 2026-05-30

---

# RMSNorm（Root Mean Square Normalization）

> [!abstract] 一句话概括 RMSNorm 是 [[LayerNorm]] 的简化版：去掉了**均值中心化（re-centering）**，只保留**缩放归一化（re-scaling）**。它更快、更简单，是当前主流大模型（[[LLaMA]]、[[Mistral]]、[[Gemma]]、[[T5]]）的标配。

---

## 1. 动机

[[LayerNorm]] 对每个样本在特征维度上做两件事：

1. **re-centering（中心化）**：减去均值 $\mu$，让分布以 0 为中心。
2. **re-scaling（缩放）**：除以标准差 $\sigma$，让分布方差归一。

RMSNorm 的核心观点（Zhang & Sennrich, 2019）：

> [!note] 关键假设 LayerNorm 之所以有效，主要来自 **re-scaling 不变性**，而非 re-centering。 既然中心化贡献不大，那就把它砍掉以换取**计算效率**。

---

## 2. 数学定义

### LayerNorm（对照）

$$ \bar{a}_i = \frac{a_i - \mu}{\sigma}, g_i, \qquad \mu = \frac{1}{n}\sum_{i=1}^{n} a_i, \qquad \sigma = \sqrt{\frac{1}{n}\sum_{i=1}^{n}(a_i - \mu)^2} $$

### RMSNorm

$$ \bar{a}_i = \frac{a_i}{\text{RMS}(a)}, g_i, \qquad \text{RMS}(a) = \sqrt{\frac{1}{n}\sum_{i=1}^{n} a_i^2 + \epsilon} $$

其中：

- $a \in \mathbb{R}^n$：某一层的输入向量（沿特征维 $n$）
- $g \in \mathbb{R}^n$：可学习的增益参数（gain / weight），初始化为全 1
- $\epsilon$：防止除零的小常数（典型值 $10^{-5} \sim 10^{-6}$）

> [!tip] 注意 RMSNorm **没有偏置项（bias）**，也**不减均值**。参数量比 LayerNorm 少一半（只有 $g$，没有 $\beta$）。

---

## 3. 为什么更快

|操作|LayerNorm|RMSNorm|
|---|:-:|:-:|
|计算均值 $\mu$|✅|❌|
|减均值|✅|❌|
|计算 $\sum a_i^2$|✅|✅|
|除以 scale|✅|✅|
|可学习 gain $g$|✅|✅|
|可学习 bias $\beta$|✅|❌|

原论文报告，去掉均值统计后，在不同任务上带来约 **7%–64%** 的运行时间加速，且精度基本无损。

---

## 4. PyTorch 实现

最小实现：

```python
import torch
import torch.nn as nn

class RMSNorm(nn.Module):
    def __init__(self, dim: int, eps: float = 1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))  # gain g

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (..., dim)，在最后一维归一化
        rms = x.pow(2).mean(dim=-1, keepdim=True).add(self.eps).rsqrt()
        return x * rms * self.weight
```

LLaMA 风格实现（在 float32 中计算 norm 以保证数值稳定）：

```python
class RMSNorm(nn.Module):
    def __init__(self, dim: int, eps: float = 1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def _norm(self, x):
        return x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps)

    def forward(self, x):
        # 半精度训练时先转 fp32，归一化后再转回，避免精度损失
        output = self._norm(x.float()).type_as(x)
        return output * self.weight
```

> [!warning] 实现细节
> 
> - `rsqrt`（平方根的倒数）比 `1 / sqrt` 更高效，是常见写法。
> - 混合精度训练时务必在 **fp32** 中计算 RMS，否则数值不稳定。
> - $\epsilon$ 放在根号**内**还是**外**各家实现略有差异，效果接近，但要与预训练权重保持一致。

---

## 5. 实际应用

- [[LLaMA]] / LLaMA 2 / LLaMA 3：使用 Pre-RMSNorm。
- [[Mistral]]、[[Gemma]]、[[Qwen]]：均采用 RMSNorm。
- [[T5]]：使用简化的 RMSNorm 变体（无 bias、无中心化）。

现代 Transformer 普遍采用 **Pre-Norm** 结构（归一化放在残差块**之前**），配合 RMSNorm 训练更稳定：

```
x = x + Attention(RMSNorm(x))
x = x + FFN(RMSNorm(x))
```

---

## 6. 优缺点小结

> [!success] 优点
> 
> - 计算更轻量，训练/推理更快
> - 参数更少（无 bias）
> - 在大模型上经验效果与 LayerNorm 相当甚至更好
> - 数值行为简单，易于优化（kernel fusion 友好）

> [!failure] 局限
> 
> - 去掉中心化在某些任务上可能略有影响（需具体验证）
> - 对输入分布的偏移（非零均值）不做处理，依赖网络其他部分自行调整

---

## 7. 相关笔记

- [[LayerNorm]] — RMSNorm 的前身与对照
- [[BatchNorm]] — 另一类归一化思路（沿 batch 维）
- [[Pre-Norm vs Post-Norm]]
- [[Transformer 架构]]

## 8. 参考文献

- Zhang, B., & Sennrich, R. (2019). _Root Mean Square Layer Normalization_. NeurIPS 2019.
- Touvron et al. (2023). _LLaMA: Open and Efficient Foundation Language Models_.

---

#deep-learning #normalization #transformer