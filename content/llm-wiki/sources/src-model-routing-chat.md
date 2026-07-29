---
title: "Source: Chat Cursor / Copilot Auto 模型路由"
source_type: chat
local_raw: "[[llm-wiki/raw/chats/2026-07-29-model-routing-auto]]"
ingested: 2026-07-29
tags: [source, chat, llm, ai-coding]
aliases: []
created: 2026-07-29
---

# Source: Chat Cursor / Copilot Auto 模型路由

## One-line summary

2026-07-29 Claude Code 会话（含 Web 搜索）：Cursor Router 与 GitHub Copilot Auto 的模型路由机制——前置分类器架构、路由信号、路由模型形态与训练信号。

## Key claims

- "Auto" 的本质是调用任何模型之前先跑的前置路由分类器，不是随机选择或失败后兜底。
- Cursor Router：60 万+ 真实请求训练的分类器，以 keep rate 为奖励信号做在线 A/B；分 Intelligence / Balance / Cost 三档；路由决策计入 KV cache miss 成本。
- Copilot Auto：结合任务复杂度评估（推理深度、代码生成复杂度、工具编排需求）与系统健康度（利用率、延迟、限流）；任务感知版本只在 VS Code / CLI / GitHub.com 启用。
- 路由模型必须是便宜快速的小模型（<50ms）：主流是 BERT 级 encoder 分类器（如开源 RouteLLM），或小参数 LLM 判别，或 GBDT/矩阵分解等非 LLM 模型。
- 训练信号是蒸馏式自举：前沿大模型离线标注 + 用户行为（keep rate）在线反馈。
- 核心权衡：识别"便宜模型能搞定的任务"的准确率；误判代价是 keep rate 下降。

## Key concepts

- [[concepts/Model Routing|Model Routing]]

## Linked pages

- [[concepts/Model Routing|Model Routing]]
- [[entities/GitHub Copilot|GitHub Copilot]]
- [[entities/Cursor|Cursor]]
- [[questions/cursor-copilot-auto-routing|Cursor / Copilot 的 Auto 模型路由机制]]
