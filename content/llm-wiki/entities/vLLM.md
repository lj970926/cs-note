---
title: vLLM
description: 高吞吐 LLM 推理引擎，实现了 DFlash 等投机解码方法
date: 2026-07-27
tags: [entity, llm-inference, inference-engine]
aliases: []
---

# vLLM

## Definition

vLLM 是开源的高吞吐 LLM 推理与服务引擎，以 PagedAttention 的 KV Cache 分页管理著称。仓库：<https://github.com/vllm-project/vllm>。

## Attributes

- **Speculative decoding 框架**：`vllm/v1/spec_decode/` 下的 `SpecDecodeBaseProposer` 定义了 proposer 通用流程，具体方法（如 [[concepts/DFlash|DFlash]] 的 `dflash.py`）通过重写输入准备等钩子接入。
- **DFlash 支持**：模型侧 `qwen3_dflash.py` 提供 `precompute_and_store_context_kv`，把 target 的 hidden states 融合投影后写入 draft 各层 KV Cache；框架侧用 Triton kernel 融合输入准备。
- **Hidden state 透传**：`gpu_model_runner.py` 的 model forward 可返回 `aux_hidden_states`（各层中间表示），供投机解码 drafter 使用。

## Related

- [[concepts/DFlash|DFlash]]
- [[concepts/Speculative Decoding|Speculative Decoding]]

## Sources

- [[sources/src-dflash|src-dflash]]
