---
title: DFlash — Block Diffusion for Flash Speculative Decoding
tags:
  - paper
  - speculative-decoding
  - dflash
  - diffusion
  - llm-inference
---

>[!note]
>原文：https://arxiv.org/pdf/2602.06036

# Introduction
Autogressive LLM 的自回归本质在长输出场景下造成了 Decode 侧的性能瓶颈。近年来出现的 Diffusion LLM在模型能力上无法与 Autogressive 方法相比，但可以 parallel decoding 提升性能。DFlash 的 Basic Idea是用快速但质量较差的 Diffusion LLM 做 drafter，能力强的Autogressive LLM做target model，实现精度无损的性能提升。