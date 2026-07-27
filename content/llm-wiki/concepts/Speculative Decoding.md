---
title: Speculative Decoding
description: 用小而快的 drafter 提议候选 token、大 target model 并行验证，实现精度无损的 LLM 解码加速
date: 2026-07-27
tags: [concept, llm-inference, decoding]
aliases: [投机解码, 投机采样]
---

# Speculative Decoding

## Definition

Speculative decoding（投机解码）是一种 LLM 推理加速范式：用一个**快速但质量较差的 drafter** 一次提议多个候选 token，再用**能力强的 target model** 一次前向并行验证这些候选，接受与 target 分布一致的前缀。由于最终输出分布完全由 target model 决定，加速是**精度无损**的。

## 为什么需要

自回归 LLM 逐 token 解码，长输出场景下 decode 侧是性能瓶颈——每步前向只产出一个 token，算力利用率低。投机解码把"逐 token 串行"变成"起草案 + 批量验证"，用一次 target 前向产出多个被接受的 token。

## 关键指标与要素

- **Accept length（接受长度）**：每次验证平均接受的 draft token 数，直接决定加速比，是衡量投机解码方法的核心指标。
- **Drafter 的成本-质量权衡**：drafter 越快、与 target 分布越一致，收益越大。常见 drafter 形态：
  - 自回归小模型（含 [[EAGLE]] 这类复用 target hidden state 的轻量 drafter）
  - Diffusion LLM：能力不及 AR 模型，但天然支持 parallel decoding，一次起草一整块（见 [[concepts/DFlash|DFlash]]）
- **Draft 与 target 的信息通道**：drafter 能看到多少 target 的信息（如 hidden states）直接影响接受率。

## Related concepts

- [[concepts/DFlash|DFlash]]
- [[EAGLE]]
- [[Diffusion LLM]]

## Sources

- [[sources/src-dflash|src-dflash]]
