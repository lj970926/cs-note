---
title: "src-dflash"
description: "DFlash 论文笔记：用 Block Diffusion drafter 做投机解码，及 vLLM 中的实现分析"
date: 2026-07-27
tags: [source, paper, speculative-decoding, diffusion, llm-inference, vllm]
source_type: note
local_ref: "[[paper/DFlash Block Diffusion for Flash Speculative Decoding]]"
aliases: []
---

# src-dflash

## One-line summary

DFlash 用快速但质量较差的 Diffusion LLM 做 drafter、能力强的自回归 LLM 做 target，实现精度无损的解码加速；核心贡献是把 target model 的 hidden state 直接注入 draft model 的 KV Cache，笔记同时分析了 vLLM 中的落地实现。

## Source

- Vault note: [[paper/DFlash Block Diffusion for Flash Speculative Decoding]]
- 原文（论文）: <https://arxiv.org/pdf/2602.06036>

## Key claims

1. 自回归 LLM 的自回归本质在长输出场景造成 decode 侧瓶颈；Diffusion LLM 能力不如 AR 模型，但可 parallel decoding。
2. DFlash 的基本思路：Diffusion LLM 做 drafter 并行起草，AR target model 验证，精度无损。
3. 主要架构贡献：把 target model 的 hidden state 直接注入 draft model 的 KV Cache。
4. Accept length 相较 EAGLE-3 提升明显。
5. vLLM 实现中，`precompute_and_store_context_kv` 把 target 上下文 hidden states 写入 draft 每层 KV Cache：流程为 rms_norm → 一次大 GEMM（所有层的 KV projection 权重拼接）→ 逐层 RMSNorm K → 融合 RoPE → `do_kv_cache_update` 逐层写 cache。
6. `context_states` 来自 target model forward 返回的 `aux_hidden_states`（所有 layer concat 到最后一维）。
7. Draft model 其余部分是普通 Transformer（双向 attention + dense MLP），无特殊设计。
8. 输入准备由 Triton kernel `copy_and_expand_dflash_inputs_kernel` 融合完成：context/query 的 positions 与 slot_mapping 计算、input_ids 准备（bonus token 直接拷贝，mask token 初始化为 `parallel_drafting_token_id`）、采样索引计算（跳过 bonus token）。
9. `parallel_drafting_token_id` 在配置里声明，训练时 Embedding 需对该 token 做特殊处理。

## Linked pages

- [[concepts/DFlash|DFlash]]
- [[concepts/Speculative Decoding|Speculative Decoding]]
- [[entities/vLLM|vLLM]]
