---
title: "Source: LLM Wiki idea"
source_type: web
source_url: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f#llm-wiki
local_ref: "[[AI-agent/LLM Wiki]]"
local_raw: ""
accessed: 2026-07-25
ingested: 2026-07-25
tags: [source, ai-agent]
aliases: []
created: 2026-07-25
---

# Source: LLM Wiki idea

## One-line summary

Karpathy 提出的 LLM 维护个人 Wiki 模式：LLM 将来源增量整合进一个持久化、相互链接的 markdown 知识库，而不是每次查询时重新检索原始文档。

## Key claims

- 传统 RAG 是 stateless 的：每次提问都要重新从原始文档中检索和拼合答案。
- LLM Wiki 是 stateful 的：知识被编译一次并持续维护，跨来源的引用和矛盾已经被标记。
- Wiki 是 LLM 生成的 markdown 文件层，位于原始来源（immutable）和 schema（行为手册）之间。
- 应用场景包括：个人成长、研究、读书、商业/团队知识、竞争分析等。
- 人类负责策划来源、提问和判断意义；LLM 负责总结、交叉引用和维护。

## Key entities

- [[entities/Karpathy|Karpathy]]

## Key concepts

- [[concepts/LLM Wiki|LLM Wiki]]
- [[concepts/RAG|RAG]]
- [[concepts/Persistent wiki|Persistent wiki]]

## Linked pages

- [[concepts/LLM Wiki|LLM Wiki]]
- [[concepts/RAG|RAG]]
- [[concepts/Persistent wiki|Persistent wiki]]
- [[entities/Karpathy|Karpathy]]
