---
title: Test-Time Scaling
description: 推理时花更多算力换更好答案的扩展路线，RL 让长思考真正有效
date: 2026-07-29
tags: [concept, llm, reasoning, rl]
aliases: [测试时扩展, inference-time scaling, RL test-time scaling]
---

# Test-Time Scaling

## Definition

**Test-Time Scaling（测试时扩展）** 指模型训练完成后不再改动，在**推理时投入更多算力**换取更好答案的扩展路线——让模型"想久一点"。它与 train-time scaling（更多参数/数据/训练算力）相对，是 o1、DeepSeek-R1 这一代推理模型背后的核心概念。

## RL's role: 让长思考真正有效

光多生成 token 没用——普通模型想久了只会啰嗦和跑偏。**RL test-time scaling** 里的 RL 负责教会模型如何有效利用额外推理时间：

1. **可验证奖励（RLVR）**：数学、代码任务有客观对错（答案匹配、测试通过），可自动给奖励，无需人类标注
2. 用可验证奖励做强化学习，模型**自发涌现**长链思维行为：分步推理、自我质疑（"等等，这步对吗"）、回溯重试、多角度验证——DeepSeek-R1 论文的 "aha moment"
3. 训练后的模型，思维链越长答案越准——推理时间成为新的可调旋钮

标志性结果：OpenAI o1 显示准确率随 test-time compute **对数线性增长**，且在 train-time scaling 边际收益递减处仍持续上涨。

## Two ways to spend inference compute

| 方式 | 做法 | 例子 |
|---|---|---|
| **Sequential（串行）** | 更长思维链，边想边自我修正 | o1、R1 的长 CoT（RL 主要增强这条线） |
| **Parallel（并行）** | 多路采样再聚合/筛选 | best-of-N、self-consistency 多数投票、verifier/PRM 打分搜索 |

## Implications

模型能力变成**思考预算的函数**：同一模型给 100 token 和 100k token 是两个能力水平。

- **产品**：出现"思考预算"档位（low/medium/high reasoning effort）
- **成本**：贵不贵不只看模型大小，还看想多久
- **竞争**：小模型 + 长思考可打平大模型 + 短思考（R1 比 GPT-4 小得多但数学更强）

## Related concepts

- [[concepts/Speculative Decoding|Speculative Decoding]] — 方向互补：一个省推理算力，一个加推理算力
- [[concepts/Model Routing|Model Routing]] — 任务难度路由与思考预算分配是同一个问题的两面
- [[concepts/RLVR|RLVR]] — 可验证奖励强化学习（待建）
- [[concepts/Process Reward Model|Process Reward Model]] — 并行线常用的过程打分模型（待建）

## Sources

- [[sources/src-rl-test-time-scaling-chat|src-rl-test-time-scaling-chat]]
