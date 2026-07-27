---
title: DFlash
description: 用 Block Diffusion LLM 做 drafter 的投机解码方法，核心是把 target hidden state 直接注入 draft 的 KV Cache
date: 2026-07-27
tags: [concept, speculative-decoding, diffusion, llm-inference, vllm]
aliases: []
---

# DFlash

## Definition

DFlash（Block Diffusion for Flash Speculative Decoding）是一种 [[concepts/Speculative Decoding|speculative decoding]] 方法：用快速但质量较差的 [[Diffusion LLM]] 做 drafter 并行起草候选 token，由能力强的自回归 target model 验证，实现精度无损的解码加速。论文：<https://arxiv.org/pdf/2602.06036>。

## Architecture

核心贡献：**把 target model 的 hidden state 直接注入 draft model 的 KV Cache**——draft 不再是盲猜，而是基于 target 的内部表示起草，因此 accept length 相较 [[EAGLE|EAGLE-3]] 提升明显。draft model 的其余部分是普通 Transformer（双向 attention + dense MLP）。

## vLLM 实现要点

实现在 [[entities/vLLM|vLLM]] 的 `vllm/v1/spec_decode/dflash.py` 与模型文件 `qwen3_dflash.py` 中，整体流程与 `SpecDecodeBaseProposer` 差异不大，关键步骤：

- **上下文 KV 预填充**（`precompute_and_store_context_kv`）：把 target 各层 `aux_hidden_states` 在最后一维 concat 成 `context_states`，然后 rms_norm → **一次大 GEMM**（所有层的 KV projection 权重预先拼接）→ 逐层 RMSNorm K → 融合 RoPE → `do_kv_cache_update` 逐层写入 KV Cache。因 context shape 与 query 不同，该路径不走常规 forward，专门为减少 torch op 数量做了融合。
- **输入准备**（Triton kernel `copy_and_expand_dflash_inputs_kernel`）：单 kernel 融合完成 context/query positions 与 slot_mapping 计算、input_ids 准备（bonus token 直接拷贝，mask token 填 `parallel_drafting_token_id`）、采样索引（跳过 bonus token）。
- **`parallel_drafting_token_id`**：配置声明的 mask token，训练时 Embedding 对其做特殊处理。

## Related concepts

- [[concepts/Speculative Decoding|Speculative Decoding]]
- [[Diffusion LLM]]
- [[EAGLE]]
- [[entities/vLLM|vLLM]]

## Sources

- [[sources/src-dflash|src-dflash]]
