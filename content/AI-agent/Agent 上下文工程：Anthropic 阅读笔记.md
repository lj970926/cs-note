---
title: Agent 上下文工程：Anthropic 阅读笔记
tags:
  - ai-agent
  - context-engineering
  - harness-engineering
aliases:
  - Effective context engineering for AI agents
created: 2026-11-19
source: https://www.anthropic.com/research/effective-context-engineering-for-ai-agents
description: Anthropic 上下文工程阅读笔记，涵盖提示词与工具设计、按需检索，以及长任务中的压缩、外置状态和子 Agent。
---

Anthropic Engineering · 2025-09-29 · [Effective context engineering for AI agents](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents)

> [!abstract] 核心观点
> 在 Agent 的每一轮工具调用之后，都可以重新决定下一轮推理需要看到哪些信息。上下文工程的目标是让模型拿到足够完成当前步骤的高价值信息，同时减少无关历史和工具输出对注意力的占用。

## 上下文工程在管什么

提示词工程关注指令的表达和组织。上下文工程管理的是模型每轮看到的全部输入，包括系统指令、工具定义、检索结果和对话历史。Agent 会不断生成新的中间结果，同一段信息可能对当前步骤有用，到了下一阶段就可以只保留结论或来源位置。

原文用 **context rot** 描述长上下文中的取用质量下降。信息即使还在窗口里，模型也可能更难准确找到它，或把它与其他线索联系起来。上下文预算因此既关系到能装多少 token，也关系到模型能否稳定用好这些 token。

## 决定哪些信息进入上下文

- **系统提示词**写清目标、约束和期望产出，给 Agent 留出根据现场信息调整做法的空间。先用能表达任务要求的提示词测试，再按实际失败补指令和示例。
- **工具**需要有明确的用途、参数和返回值。减少职责重叠，让 Agent 容易选对工具，也让工具尽量只返回下一步需要的信息。
- **示例**选能代表预期行为的典型场景，用少量有差异的例子说明怎样判断和输出。

运行时可以给 Agent 文件路径、查询或链接作为线索，让它在需要时再读取细节。原文以 Claude Code 为例，说明如何组合预先加载的项目指引与按需执行的文件搜索。这种混合方式让 Agent 起步时有足够的方向，又能逐步缩小阅读范围。按需探索会增加工具调用和延迟，效果取决于信息能否被定位，以及工具提供的线索是否清楚。

## 长任务中的三种做法

| 做法 | 操作 | 适用场景 |
| --- | --- | --- |
| 上下文压缩（compaction） | 将旧对话整理为可继续工作的摘要，保留已做决定、关键实现细节和未解决问题。可先评估关键事实的保留率，再删减冗余。 | 需要延续同一条对话和推理主线 |
| 结构化笔记（structured note-taking） | 把里程碑、依赖、当前状态和下一步写到窗口外，后续按需读回。 | 分阶段推进，或需要跨会话恢复 |
| 子 Agent（subagents） | 给各子任务独立上下文，主 Agent 收回精炼结果并综合判断。 | 有多个相对独立、适合并行探索的方向 |

三者可以组合。以跨会话的仓库迁移为例，主 Agent 读取项目规则和迁移计划，再按需查看相关模块。可让子 Agent 分头梳理各模块的调用方，把结论和文件位置交回主 Agent。迁移决策、验证结果和剩余工作记在进度文件里。对话压缩时，摘要保留当前阶段、阻塞点和进度文件路径，后续可以从文件恢复细节。

## 相关笔记

- [[AI-agent/Agent Harness 文章收集|Agent Harness 文章收集]] 汇集原文及 Anthropic 多 Agent 研究系统的案例。
- [[AI-agent/Harness Engineering：以 Agent 为中心的工程实践|Harness Engineering：以 Agent 为中心的工程实践]] 讨论怎样用仓库索引和分层文档支持按需阅读。
- [[AI-agent/Subagent 的好处与适用边界|Subagent 的好处与适用边界]] 补充上下文隔离的收益与协调成本。
