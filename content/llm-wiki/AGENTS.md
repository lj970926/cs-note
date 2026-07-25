---
title: AGENTS
aliases: []
tags: []
created: 2026-07-25
---
# LLM Wiki Schema

> 本文件是 `llm-wiki/` 的 LLM 行为手册。每次会话开始时，LLM 应先读取本文件。

## Goal

在 Quartz vault 中维护一个 **LLM 驱动的通用知识库**。主题以技术为核心，但不限于此。核心原则：

> **不复制，只连接。**  
> 外部来源用 URL，自己的文章用双链，聊天记录本地存档。

## Directory layout

```
llm-wiki/
├── AGENTS.md                   # 本 schema 文件（人维护）
├── README.md                   # 给人看的说明（人维护）
├── raw/                        # 原始材料，LLM 只读
│   └── chats/                  # LLM 对话记录
├── _meta/
│   ├── map.md                  # 内容地图（LLM 维护）
│   └── log.md                  # 操作日志（LLM 维护）
├── sources/                    # 来源摘要页（LLM 维护）
├── entities/                   # 实体页（LLM 维护）
├── concepts/                   # 概念页（LLM 维护）
├── syntheses/                  # 综合/对比页（LLM 维护）
└── questions/                  # 查询结果页（LLM 维护）
```

### `raw/` 与 `sources/` 的区别

- `raw/`：原始材料全文。在本 Wiki 中，只保存聊天记录。
- `sources/`：来源摘要页，是 Wiki 的统一入口，指向实际来源（URL、vault note 或 `raw/` 文件）。
- **不能合并**。

## Core principles

1. **LLM 不修改 `raw/` 下的任何文件。**
2. **每个来源在 `sources/` 中都有且只有一个入口页。**
3. **概念页、实体页必须链接回 `sources/` 中的来源页。**
4. **有价值的查询结果必须保存为 `questions/` 或 `syntheses/` 页。**
5. **每次 ingest / query / lint 后更新 `map.md` 和 `log.md`。**

## Source types

| `source_type` | 实际位置 |  frontmatter 字段 |
|---------------|----------|-------------------|
| `web` | 外部网页/论文 | `source_url`, `accessed` |
| `note` | vault 内已有笔记 | `local_ref`（如 `[[path/to/note]]`） |
| `chat` | `llm-wiki/raw/chats/` | `local_raw` |

外部链接必须记录 `accessed` 日期。重要来源可手动快照到 `raw/snapshots/`，但非默认流程。

## Page types

| 目录           | 用途         | 模板要点                                     |
| ------------ | ---------- | ---------------------------------------- |
| `sources/`   | 来源摘要页      | one-line summary、key claims、linked pages |
| `entities/`  | 人、组织、工具、项目 | definition、attributes、related            |
| `concepts/`  | 概念、方法、模式   | definition、related concepts、sources      |
| `syntheses/` | 对比、综述、分析   | thesis、arguments、verdict、sources         |
| `questions/` | 查询探索结果     | question、answer、sources、follow-ups       |

## Naming conventions

- 文件名：kebab-case，空格用 `-`，如 `llm-wiki.md`。
- 来源页：前缀 `src-`，如 `src-llm-wiki-idea.md`。
- 聊天日志：`YYYY-MM-DD-<short-topic>.md`。
- WikiLinks：优先用 `[[Page Name]]`，必要时加路径 `[[path/to/Page Name]]`。

## Workflows

### Ingest

1. 确认来源类型（web / note / chat）。
2. 读取来源内容。
3. 创建或更新 `sources/src-<slug>.md`。
4. 更新或创建相关 `entities/`、`concepts/` 页。
5. 如有价值，创建 `syntheses/` 或 `questions/` 页。
6. 更新 `_meta/map.md`。
7. 追加 `_meta/log.md`。

### Query

1. 读 `map.md` 定位相关页。
2. 读相关页，综合答案。
3. 有价值的答案保存为 `questions/<slug>.md` 或 `syntheses/<slug>.md`。
4. 更新 `map.md` 和 `log.md`。

### Lint

定期执行（建议每 10 个来源或每周一次）：
- 孤立页面（无入链）
- 失效外部链接
- 矛盾声明
- 提到但未建页的概念
- `map.md` 与实际页面不一致

输出 lint 报告，更新 `map.md` 的 `Orphans & gaps`。

## Quality rules

- 每个 claim 尽量标注来源 `[[src-xxx]]`。
- 新来源与旧页矛盾时，不要直接覆盖；在相关页增加 `## Updates` 或 `## Contradictions` 章节。
- 避免孤立页面；每个新页至少被一个已有页面链接。
- 保持 frontmatter 完整，尤其是 `tags`。

## Human's role

- 策划来源、提出问题、判断重要性、确认矛盾、审核 LLM 修改。
- 通常不直接编辑 `wiki/` 下的内容页，除非纠正明显错误。
