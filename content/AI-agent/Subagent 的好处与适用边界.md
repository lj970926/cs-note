---
title: Subagent 的好处与适用边界
tags:
  - ai-agent
  - subagent
  - multi-agent
aliases:
  - 为什么用 Subagent
  - 子代理的好处
created: 2026-09-07
description: 大模型 Agent 委派 subagent 的核心收益是上下文隔离，顺带获得并行性、故障隔离与模型异构；同时记录其代价与适用边界。
---

# Subagent 的好处与适用边界

> [!abstract] 一句话
> subagent 的本质是**用「上下文隔离」换「主 agent 的专注力」**，顺便获得并行性、故障隔离和模型异构——和操作系统用进程隔离保护内核是同一个思想。

## 主要好处

### 1. 保护主上下文（最核心的收益）

主 agent 的上下文是最稀缺的资源。探索性工作（grep 一堆文件、读源码、翻网页）会产生大量中间噪音，如果都在主对话里做，上下文会迅速膨胀并积累无关信息。[[Cursor Agent Best Practice]] 里有两点直接相关：

- 包含不相关内容「对 AI 的伤害可能比缺乏上下文更大」；
- 过长对话会让 Agent 失去焦点、被噪音分散注意力。

subagent 在自己的独立上下文里干活，**只把最终结论带回主对话**——中间几十次工具调用的输出根本不会进入主上下文。这比事后做 compaction（上下文压缩）更干净：压缩是有损的，而委派是从源头不让噪音进来。

### 2. 并行加速

多个相互独立的子任务可以同时派出去跑（多文件审计、多角度调研、方案 A/B 验证），wall-clock 时间从串行求和变成近似取最大值。这就是 [[DeepSeek Harness 四种 Agent 模式]] 里「委派与并行」能力层（subagent / fork / workflow / Ralph）存在的意义。

### 3. 规避长上下文劣化

[[Claude Code Loop 工程：loop、goal 与 schedule|Claude Code Loop 工程]] 里有个观察：单 session 长上下文会随运行时间累积劣化，所以无人值守长跑反而适合「fresh context + 状态外置」的循环。subagent 每次都是新鲜上下文，没有历史包袱，也不会被主对话里之前的错误假设「锚定」——这对验证类任务（让一个干净的 agent 复核结论）尤其有价值。

### 4. 角色与模型异构

每个子任务可以用不同的 system prompt（审查者、研究员、测试编写者），甚至不同的模型/供应商——重活给强模型，简单检索给便宜模型，成本和效果分别调优。

### 5. 故障隔离与可控性

一个 subagent 跑偏、失败或超时，只影响那一个分支，主 agent 拿到空结果后可以换策略重试，主循环状态不被污染。subagent 通常还可以被单独中断、追加指令、继续追问，形成可操纵的执行单元。

### 6. 主 agent 的认知简化

主 agent 只需做编排：拆任务、写自包含的 prompt、收结果、综合。相当于软件里的「函数封装」——每个 subagent 是有明确输入输出的过程，主流程读起来像伪代码。

## 代价与适用边界

- **上下文不共享**：subagent 看不到主对话，prompt 必须自包含，写 prompt 本身有成本；高度交互、需要频繁对齐的任务不适合委派。
- **只有结果回流**：中间过程丢失，如果需要的是「过程」（比如学习它怎么探索的），委派反而不合适。
- **协调开销**：一两个小任务直接自己做更快；委派适合「够重、够独立」的任务块。

## 相关笔记

- [[Cursor Agent Best Practice]]：上下文管理与并行运行 Agent 的实践建议
- [[DeepSeek Harness 四种 Agent 模式]]：标准模式中「委派与并行」能力层的定位
- [[Claude Code Loop 工程：loop、goal 与 schedule|Claude Code Loop 工程]]：fresh context 循环与长上下文劣化
- [[普通对话与 Deep Research：从 Agent 架构理解差异|普通对话与 Deep Research]]：另一种「主 agent 编排研究闭环」的形态
