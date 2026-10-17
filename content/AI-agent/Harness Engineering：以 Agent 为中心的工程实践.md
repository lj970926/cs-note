---
title: Harness Engineering：以 Agent 为中心的工程实践
tags:
  - ai-agent
  - workflow
  - harness-engineering
aliases:
  - AI 工作流学习
  - AI Pipeline 工作流学习
created: 2026-10-18
description: 学习搭建 AI pipeline 工作流的目标、初步思路与待探索问题，以 Harness Engineering 为阅读起点。
---

# Harness Engineering：以 Agent 为中心的工程实践

## 当前目标

最近在学习如何搭建 AI 相关的 pipeline 工作流，希望理解如何把模型、工具、上下文和验证机制组织成一个能够持续完成任务的流程。

> [!note] 学习起点
> 从 OpenAI 的 Harness Engineering 文章开始，关注工程师如何设计环境、表达任务意图，以及建立让 Agent 能够判断结果并继续改进的反馈循环。具体实践场景尚待确定。

## 初步思路

可以先用下面这个流程拆解一个小任务；这是待实践的学习框架：

```text
明确目标与验收条件
    → 收集必要上下文
    → 模型执行并调用工具
    → 检查产物与验证结果
    → 根据反馈修正，或满足条件后结束
```

- **上下文**：让 Agent 能找到需要的资料。保持入口简短，通过索引指向具体文档，可联系 [[LLM Wiki]] 的目录与知识组织方式。
- **验证**：为结果提供可检查的证据，例如测试、引用或格式检查，可参考 [[AI 代码 Review 策略]]。
- **状态与终止**：记录已完成内容、失败原因和下一步，明确何时重试、何时停止，可参考 [[Claude Code Loop 工程：loop、goal 与 schedule]]。
- **任务拆分**：遇到足够独立的任务时，再考虑委派与并行；其收益和协调成本见 [[Subagent 的好处与适用边界]]。

## 待探索

- [ ] 选择一个小场景：编码与调试、文章与论文整理，或模型工程流程。
- [ ] 明确每一步的输入、输出，以及哪些步骤由代码控制、哪些交给模型判断。
- [ ] 跑通一次完整流程，记录人工介入的位置和失败案例。
- [ ] 补上失败处理、重试上限与日志，再评估是否需要更复杂的编排。

## 参考资料

- [Harness engineering: leveraging Codex in an agent-first world（英文原文）](https://openai.com/index/harness-engineering/)
- [Harness Engineering（中文版）](https://openai.com/zh-Hans-CN/index/harness-engineering/)
