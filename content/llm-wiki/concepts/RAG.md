---
title: RAG
tags: [concept, ai-agent]
aliases: [Retrieval-Augmented Generation, 检索增强生成]
created: 2026-07-25
---

# RAG

> 检索增强生成（Retrieval-Augmented Generation）：在查询时从文档集合中检索相关片段，再由 LLM 基于这些片段生成答案。

## Definition

RAG 是一种将外部知识注入 LLM 的架构：

1. 用户提问。
2. 系统从预存的文档集合中检索与问题相关的片段。
3. LLM 基于检索到的片段生成回答。

RAG 本身不维护跨查询的状态：每次提问都是一次独立的检索和生成过程。

## Limitations

- 每次回答都需要重新“发现”知识。
- 对需要综合多个来源的微妙问题，效果依赖检索质量和上下文长度。
- 跨来源的引用、矛盾和合成不会自动累积。

## Contrast with LLM Wiki

| 维度 | RAG | LLM Wiki |
|------|-----|----------|
| 知识状态 | Stateless | Stateful |
| 合成时机 | 查询时 | 摄入时 |
| 可追溯性 | 依赖片段 | 依赖 Wiki 页和来源页 |

## Related concepts

- [[concepts/LLM Wiki|LLM Wiki]] — 与 RAG 相对的持久化 Wiki 模式
- [[concepts/Persistent wiki|Persistent wiki]] — 持久化知识积累

## Sources

- [[sources/src-llm-wiki-idea|src-llm-wiki-idea]]
