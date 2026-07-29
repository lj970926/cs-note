---
title: "Cursor / Copilot 的 Auto 模型路由机制"
date: 2026-07-29
tags: [question, llm, ai-coding]
aliases: []
created: 2026-07-29
---

# Cursor / Copilot 的 Auto 模型路由机制

## Question

像 Cursor、Copilot 这种模型选择里的 "Auto" 一般是怎么做路由的？评估会用 AI 完成吗，通常是什么模型？

## Answer

"Auto" 的本质是**调用任何模型之前先跑的前置路由分类器**，详见 [[concepts/Model Routing|Model Routing]]。要点：

- **Cursor Router**：60 万+ 真实请求训练的分类器，按 query、上下文、任务复杂度/领域前置选模型；奖励信号是 keep rate；分 Intelligence / Balance / Cost 三档；路由计入 KV cache miss 成本
- **Copilot Auto**：任务复杂度评估（推理深度、工具编排需求等）+ 系统健康度（利用率、限流）双信号；任务感知版仅 VS Code / CLI / GitHub.com，JetBrains 等只有健康度层
- **路由模型形态**：受 <50ms 延迟与极低成本约束，主流是 BERT 级 encoder 分类器（如开源 RouteLLM），或小参数 LLM 判别，或非 LLM 的 GBDT/矩阵分解
- **训练信号**：蒸馏式自举——前沿大模型离线标注 + 用户行为（keep rate）在线反馈

## Sources

- [[sources/src-model-routing-chat|src-model-routing-chat]]

## Follow-ups

- 开源路由方案（RouteLLM、Martian 等）的具体实现与效果对比
- 路由器的 cache 亲和策略具体怎么实现（"自然缓存边界"指什么）
- 路由器自身的评估方法论：除了 keep rate 还有哪些离线指标
