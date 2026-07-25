---
title: README
aliases: []
tags: []
created: 2026-07-25
---
# LLM Wiki

> 这是一个 **LLM 维护的通用知识库**。

路径名沿用 Karpathy 的 [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f#llm-wiki) 理念，但内容不限于 LLM 主题。

## 核心原则

- **不复制，只连接**：外部来源用 URL，自己的文章用双链，聊天记录本地存档。
- **LLM 维护，人审核**：LLM 负责读、总结、链接、更新；人负责策划来源和提问。
- **知识复利**：每次新增来源、每次提问，都把有价值的结果沉淀回 Wiki。

## 目录说明

- `raw/chats/`：保存 LLM 对话记录，作为后续可追溯的上下文。
- `sources/`：每个来源的摘要页，Wiki 的统一入口。
- `entities/`：人、组织、工具、项目等实体。
- `concepts/`：概念、方法、模式。
- `syntheses/`：对比、综述、分析。
- `questions/`：查询探索的结果。
- `_meta/`：`map.md` 内容地图，`log.md` 操作日志。

## 如何使用

1. 给人看：从 `[[_meta/map|map]]` 开始浏览。
2. 给 LLM 用：每次会话先读 `AGENTS.md`，再读 `map.md`。
3. 加新来源：把 URL、vault note 或聊天记录告诉 LLM，让它跑 ingest 流程。
4. 提问：直接问 LLM，有价值的答案会被保存回 Wiki。

## 起点

- [[_meta/map|Map]]
- [[_meta/log|Log]]
- [[sources/src-llm-wiki-idea|Source: LLM Wiki idea]]
