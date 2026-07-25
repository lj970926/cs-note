---
title: LLM Wiki
tags: [concept, ai-agent]
aliases: []
created: 2026-07-25
---

# LLM Wiki

> 由 LLM 维护的通用知识库模式：LLM 将来源增量整合进持久化、相互链接的 markdown 文件，而不是每次查询时重新检索原始文档。

## Definition

LLM Wiki 是一种知识工作流，其核心特征包括：

1. **持久化知识层**：原始来源被读取、提取并整合进一个结构化的 markdown 文件集合。
2. **增量维护**：每新增一个来源，LLM 会更新相关实体页、概念页和合成页。
3. **交叉引用**：概念、实体和来源之间通过 WikiLinks 相互连接。
4. **LLM 维护，人审核**：LLM 承担总结、链接、格式维护等重复工作；人负责策划来源、提问和判断意义。

## Architecture

Karpathy 提出三层结构：

1. **Raw sources（原始资料）**：人筛选收集的源文档，不可变，是事实源头。
2. **Wiki**：LLM 生成的 markdown 层，包含摘要、实体页、概念页、综合论述等，由 LLM 全权维护。
3. **Schema**：告诉 LLM 如何维护 wiki 的配置/行为手册（如 CLAUDE.md、AGENTS.md）。

## Core operations

- **Ingest（收录）**：读新资料 → 写摘要页 → 更新实体/概念页 → 追加日志。
- **Query（查询）**：在 wiki 中搜索相关页并综合答案；有价值的答案可归档为新页面。
- **Lint（健康检查）**：定期检查矛盾、过时论断、孤儿页、缺失交叉引用等。

## Practical tips

- 把 wiki 当作 markdown git 仓库，天然获得版本历史和协作能力。
- 用 Obsidian Web Clipper 快速收集网页资料。
- 用图谱视图观察页面连接结构，识别枢纽和孤儿。
- 可搭配 Dataview 对 frontmatter 做动态查询。
- 大型 wiki 可引入本地搜索工具（如 qmd）辅助检索。

## LLM Wiki vs RAG

| 维度 | RAG | LLM Wiki |
|------|-----|----------|
| 知识状态 | Stateless | Stateful |
| 每次查询 | 重新检索 + 拼合 | 读取已维护的 Wiki 页 |
| 跨来源合成 | 查询时临时进行 | 已经被整合进页面 |
| 维护成本 | 低（不维护） | 由 LLM 承担 |

## Related concepts

- [[concepts/RAG|RAG]] — 检索增强生成
- [[concepts/Persistent wiki|Persistent wiki]] — 持久化、复利式知识积累

## Sources

- [[sources/src-llm-wiki-idea|src-llm-wiki-idea]]
