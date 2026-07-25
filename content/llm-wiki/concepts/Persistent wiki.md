---
title: Persistent wiki
tags: [concept, ai-agent]
aliases: [持久化 Wiki, 复利式知识库]
created: 2026-07-25
---

# Persistent wiki

> 一种持久化、复利式积累的知识库：知识被编译一次并持续维护，而不是每次使用时重新推导。

## Definition

Persistent wiki 强调知识库的**状态性**：

- 新知识被整合进已有结构，而不是孤立存放。
- 跨来源的引用、矛盾和合成在摄入阶段就被处理。
- 每次新增来源都会让整个 Wiki 变得 richer，而不是更臃肿。

## Why it matters

传统知识管理（如笔记本、标签系统、RAG）的问题在于：

- 知识之间缺乏显式连接。
- 每次使用都需要重新组织和拼合。
- 维护负担随规模增长而超线性增加。

Persistent wiki 通过 LLM 自动化维护，把维护成本降下来，让知识能够复利增长。

## Related concepts

- [[concepts/LLM Wiki|LLM Wiki]] — LLM 维护的 persistent wiki 实现
- [[concepts/RAG|RAG]] — stateless 的替代方案

## Sources

- [[sources/src-llm-wiki-idea|src-llm-wiki-idea]]
