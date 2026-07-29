---
title: "Chat: Cursor / Copilot 的 Auto 模型路由是怎么做的"
date: 2026-07-29
tags: [raw, chat, llm, ai-coding]
aliases: []
---

# Chat: Cursor / Copilot 的 Auto 模型路由是怎么做的

> 2026-07-29 Claude Code 会话存档（含 Web 搜索补充）。本文件为原始材料，归档后不再修改。

## Q1

像 cursor、copilot 这种模型选择里那个 auto 一般是怎么做路由的？

## A1

两家的 "Auto" 本质上是同一个东西：**一个在调用任何模型之前先跑的路由器/分类器**，而不是简单地随机挑一个或失败后兜底。

### 通用架构

```
用户请求 → 路由分类器（前置）→ 选中的模型
              ↑
   信号：prompt 内容、上下文、任务复杂度、
        各模型实时负载/限流状态、成本、缓存命中率
```

### Cursor（Cursor Router）

Cursor 官方在 2026 年把 Auto 升级为 **Cursor Router**：

- 前置分类器：在调用模型前分析 query、可用上下文、任务复杂度和任务领域（后端逻辑 vs UI 活儿），主动选择而不是失败后切换
- 训练数据：60 万+ 真实请求训练，线上 A/B 评估数百万次路由；奖励信号是 "keep rate"——生成的代码是否被保留、用户是否不再纠正 agent
- 三档优化档位：Intelligence（质量优先）/ Balance / Cost
- 缓存感知：会话中途换模型导致 KV cache miss，路由决策把这部分成本算进去
- 路由目标：简单任务给便宜模型，UI/品味敏感的给界面能力强的模型，长程推理给前沿模型

### GitHub Copilot（Auto model selection）

结合两类信号：

1. 任务评估：推理深度、代码生成复杂度、bug 诊断难度、工具编排需求（VS Code、Copilot CLI、GitHub.com Chat 上的"任务感知"版本）
2. 系统健康度：各模型实时利用率、延迟、限流状态（JetBrains 等 IDE 目前只有这一层）

约束：只在订阅档位包含、管理员策略未禁用的模型里选；付费用户用 Auto 有 10% premium request 折扣；沿"自然缓存边界"路由减少 cache miss。

### 行业通用做法

| 组件 | 作用 | 例子 |
|---|---|---|
| 启发式规则 | 兜底，按 prompt 长度/工具调用数等硬特征分流 | 短补全 → 小模型 |
| 学习型分类器 | 预测任务难度/领域，前置路由 | Cursor Router、开源的 RouteLLM |
| 容量/限流感知 | 避开排队和限流，保证可用性 | Copilot 的 health 信号 |
| 缓存亲和 | 同一会话尽量不换模型，避免 cache miss | 两家都明确提到 |
| Fallback 链 | 主模型失败/超时时降级 | 与前置路由互补，不是替代 |

核心权衡：把便宜模型能解决的任务识别出来的准确率——误判代价是用户满意度下降（keep rate 掉）。

### 参考来源

- Introducing Cursor Router — cursor.com/blog/router
- About Copilot auto model selection — docs.github.com/copilot/concepts/auto-model-selection
- Auto model selection now routes based on your task in VS Code — github.blog/changelog/2026-05-20
- Copilot CLI auto model selection routes based on task — github.blog/changelog/2026-07-01

## Q2

这个评估会用 AI 来完成吗？通常是什么样的模型？

## A2

会用，而且几乎一定是 AI——纯规则搞不定"这个任务难不难"这种判断。但路由位的模型和干活位的模型设计要求完全相反。

### 路由模型的核心约束

路由器加在每次请求的关键路径上，必须：

- 延迟极低（最好 <50ms）
- 成本极低（比大/小模型差价低一个数量级以上）
- 输出极简（一个离散决策或复杂度分数，不需要生成能力）

### 典型的模型形态

1. **小型 encoder 分类器（最主流）**：BERT/DeBERTa 级 encoder 微调成打分器，前向几毫秒，CPU 也能跑。开源 RouteLLM 是这个路线；Cursor 的"60 万+ 请求训练的 classifier"大概率也是这种形态。
2. **小参数生成式 LLM 做判别**：1B–8B 小模型以分类 prompt 或 logit 比较输出难度分，泛化更好，能处理长上下文路由特征。
3. **非 LLM 轻量模型**：GBDT、矩阵分解 + 人工特征（prompt 长度、会话统计、embedding 相似度）。

### 训练信号

- 离线：前沿大模型当 judge 标注历史请求"小模型能不能搞定"，生成训练集
- 在线：用户行为当奖励——keep rate、是否重试/纠正、是否切换模型（Cursor 明确用了在线 A/B + keep rate）

整体是蒸馏式自举结构：大模型离线标注 + 用户行为在线反馈 → 训练便宜分类器 → 分类器决定哪些请求值得大模型出手。

### 在线路由 vs 离线评估

| 环节 | 模型 | 原因 |
|---|---|---|
| 在线路由（每次请求都跑） | 小 encoder / 小 LM | 延迟、成本约束 |
| 离线训练数据标注 | 前沿大模型 | 质量优先，跑批无延迟压力 |
| 线上效果评估 | 混合 | 用户行为 + 大模型抽样质检 |
