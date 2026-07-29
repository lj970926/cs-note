---
title: Model Routing
description: 在调用 LLM 前用前置分类器为每个请求选择最合适模型的机制
date: 2026-07-29
tags: [concept, llm, ai-coding, inference]
aliases: [模型路由, LLM Router, Auto model selection]
---

# Model Routing

## Definition

**Model Routing（模型路由）** 是在调用任何 LLM 之前，先用一个前置分类器/路由器分析请求，并为其选择最合适模型的机制。它是 Cursor "Auto"、GitHub Copilot "Auto model selection" 等产品功能背后的共同架构——不是随机选择，也不是失败后才切换的 fallback 链。

## Architecture

```
用户请求 → 路由分类器（前置）→ 选中的模型
              ↑
   信号：prompt 内容、上下文、任务复杂度、
        各模型实时负载/限流状态、成本、缓存命中率
```

## Routing signals

| 信号 | 说明 | 使用方 |
|---|---|---|
| 任务复杂度/领域 | 推理深度、代码生成复杂度、后端 vs UI、工具编排需求 | Cursor、Copilot（VS Code/CLI） |
| 系统健康度 | 各模型实时利用率、延迟、限流状态 | Copilot（所有 IDE） |
| 成本 | 简单任务给便宜模型，贵模型留给难题 | 两者 |
| 缓存亲和 | 会话中途换模型导致 KV cache miss，计入路由成本 | 两者 |
| 策略约束 | 订阅档位、管理员禁用列表、数据驻留 | Copilot |

## The router model itself

路由器在每次请求的关键路径上，因此模型形态受硬约束：**延迟 <50ms、成本比大/小模型差价低一个数量级、输出只需离散决策**。常见形态：

1. **小型 encoder 分类器（最主流）** — BERT/DeBERTa 级 encoder 微调，前向几毫秒；开源代表 RouteLLM
2. **小参数 LLM 判别** — 1B–8B 模型以分类 prompt 或 logit 比较输出难度分，泛化更好
3. **非 LLM 轻量模型** — GBDT、矩阵分解 + 人工特征

## Training signals

训练数据靠**蒸馏式自举**：

- **离线**：前沿大模型当 judge，标注历史请求"小模型能不能搞定"
- **在线**：用户行为当奖励——keep rate（代码是否被保留）、是否重试/纠正、是否切模型。Cursor Router 明确披露用 60 万+ 请求训练、数百万次在线 A/B 评估

## Key trade-off

核心权衡是**识别"便宜模型能搞定的任务"的准确率**：误判（难题给了小模型）的代价是 keep rate 下降，所以路由器的在线评估投入远大于路由策略本身的复杂度。

## Real-world implementations

- **Cursor Router** — 前置分类器 + Intelligence/Balance/Cost 三档优化目标，缓存感知 [[entities/Cursor]]
- **Copilot Auto** — 任务评估 + 系统健康度双信号，任务感知版仅 VS Code/CLI/GitHub.com [[entities/GitHub Copilot]]

## Related concepts

- [[concepts/AI Coding Agent|AI Coding Agent]] — 模型路由是 AI 编程工具控制成本/质量的关键基础设施
- [[concepts/Test-Time Scaling|Test-Time Scaling]] — 路由的"任务难度"维度与思考预算分配本质上是同一个问题

## Sources

- [[sources/src-model-routing-chat|src-model-routing-chat]]
