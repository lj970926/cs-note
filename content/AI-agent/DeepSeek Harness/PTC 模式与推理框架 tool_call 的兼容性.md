---
title: PTC 模式与推理框架 tool_call 的兼容性
tags:
  - ai-agent
  - deepseek-harness
  - mlsys
  - inference
aliases:
  - PTC 兼容性
created: 2026-09-07
description: DSH PTC 模式（Programmatic Tool Calling）与 vLLM/SGLang 等推理框架 tool_call 解析逻辑的分层关系与兼容性分析。
---

# PTC 模式与推理框架 tool_call 的兼容性

问题：DSH 的 PTC 模式（Programmatic Tool Calling，见 [[DeepSeek Harness 四种 Agent 模式#2. PTC 模式（code）]]）和现在大模型推理框架（vLLM、SGLang 等）的 tool_call 逻辑兼容吗？

> [!note] 资料来源
> PTC 机制部分来自 [[DeepSeek Harness 四种 Agent 模式]]（整理自本机 DSH 配置）；推理框架部分是对 vLLM / SGLang tool parser、guided decoding 等公开机制的通用知识分析，**未对照框架源码逐条验证**，引用时注意区分。

## 结论：架构上兼容，因为根本不在同一层

关键是把两层拆开：

- **推理框架的 tool_call 逻辑**（vLLM 的 `--tool-call-parser`、SGLang 的 function call parser 等）做的是：按模型家族的 chat template，把模型输出文本解析成结构化的 `tool_calls`（hermes、deepseek_v3、llama3、glm4 等各种 parser）。
- **PTC** 是 harness/编排层的概念：它只改变**暴露给模型的工具数量和内容**。

从推理框架的视角看，PTC 模式下模型发出的依然是**一次普通的 tool_call**——调用一个叫 `run_code` 的工具，参数是 `{code: string, description: string}`。框架照常走 chat template → tool parser → 返回结构化结果，完全不需要知道"代码模式"的存在。编排解耦在 harness 侧的 sandbox 执行器里，不在推理路径上。

## 具体兼容点

### 1. Parser 负担反而变小

推理框架 tool parser 最头疼的是 parallel tool calls（一次输出多个调用、嵌套 JSON 的增量切分）。PTC 下只有一个工具、一次一个调用，最朴素的 hermes 式 parser 就能搞定。

### 2. 压力转移到参数内部

`code` 是一个包含整段 TypeScript 的长字符串参数：

- JSON 转义负担重（代码里大量引号、换行、反斜杠），对框架的**流式增量解析**（partial JSON parsing）要求更高；
- 单次调用失败代价更大——标准模式错一个调用只废一步，PTC 里 JSON 转义抖一下可能废掉一整段程序；
- constrained decoding（vLLM guided decoding / SGLang xgrammar）只能约束到 `{code: string}` 这层 schema，**约束不了字符串内部的 TypeScript 语法**。

### 3. 真正的瓶颈在模型权重，不在框架

推理框架无所谓，但模型是否训练过"写程序编排工具"这种格式有所谓。只在标准 multi-tool JSON 格式上做过 tool-use 后训练的模型，放进 PTC 模式很可能退化（比如试图直接调不存在的工具——DSH 里会被解析成 `UNKNOWN_TOOL`）。

### 4. 对推理性能通常友好

PTC 减少多轮 tool-calling 往返，而每多一轮都意味着整段历史重新 prefill 一次。轮次减少 → prefill 总量下降 → TTFT 层面开销减小。代价是单次 run_code 生成 token 更多，但 decode 比重复 prefill 便宜。

### 5. 用不上的框架特性

parallel tool calls、多工具 schema 的 grammar 约束这些 PTC 天然用不到——程序内的"并行"是 `Promise.all` 在 harness 侧做的，模型每轮仍只发一个调用。另外数据依赖的分支（"先看 grep 结果再决定读哪个文件"）在一段程序里表达不了，模型看不到中间结果，还是得拆成多轮 `run_code`。

## 一句话总结

**推理框架层完全兼容**——PTC 对 vLLM/SGLang 来说就是"只有一个工具的普通 tool_call"，甚至更好解析；**真正的门槛在模型侧**——得是会写程序化工具调用的模型，且长代码字符串参数对流式解析和转义鲁棒性要求更高。

## 相关笔记

- [[DeepSeek Harness 四种 Agent 模式]] —— PTC 机制本身（preset 组装、`mode: code`、`run_code` SDK）
- [[vllm 源码随手记]] —— vLLM 源码阅读枢纽页（本文的框架侧论断可在此对照源码验证）
