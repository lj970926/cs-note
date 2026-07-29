---
title: "Source: Chat RL Test-Time Scaling"
source_type: chat
local_raw: "[[llm-wiki/raw/chats/2026-07-29-rl-test-time-scaling]]"
ingested: 2026-07-29
tags: [source, chat, llm, reasoning, rl]
aliases: []
created: 2026-07-29
---

# Source: Chat RL Test-Time Scaling

## One-line summary

2026-07-29 Claude Code 会话：解释 RL test-time scaling——用强化学习（RLVR）教会模型把更长推理时间转化为更准答案，使推理算力成为继参数、数据之后的第三条扩展轴。

## Key claims

- Test-time scaling 与 train-time scaling 相对：模型训练后不动，推理时花更多算力换更好答案。
- RL 的作用是教会模型有效利用额外推理时间；可验证奖励（RLVR，数学答案匹配/代码测试通过）让长链思维行为（自我质疑、回溯、多角度验证）自发涌现，如 DeepSeek-R1 的 "aha moment"。
- OpenAI o1 的标志性结果：准确率随 test-time compute 对数线性增长，且在 train-time scaling 收益递减处仍持续上涨。
- 两种花算力的姿势：串行（更长 CoT，RL 主要增强这条线）与并行（best-of-N、self-consistency、PRM 打分搜索）。
- 模型能力变成思考预算的函数：同一模型 100 token 与 100k token 预算是两个能力水平；小模型 + 长思考可打平大模型 + 短思考。

## Key concepts

- [[concepts/Test-Time Scaling|Test-Time Scaling]]

## Linked pages

- [[concepts/Test-Time Scaling|Test-Time Scaling]]
