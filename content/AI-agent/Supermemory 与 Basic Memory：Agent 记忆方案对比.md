---
title: Supermemory 与 Basic Memory：Agent 记忆方案对比
tags:
  - ai-agent
  - memory
  - knowledge-management
aliases:
  - Supermemory vs Basic Memory
  - Agent 记忆方案对比
created: 2026-10-22
---

> [!note] 资料
> - Supermemory：https://github.com/supermemoryai/supermemory · https://supermemory.ai/docs
> - Basic Memory：https://github.com/basicmachines-co/basic-memory · https://docs.basicmemory.com
>
> 基于 2026-10 的仓库 README 与官方文档整理。未实际跑通两者功能，检索质量与性能结论引用各自官方口径。

# 一句话结论

两者都叫「Agent 记忆」，但解决的是不同问题：

- **Supermemory** 是**记忆引擎 / Memory API**——把对话丢进去，它自动抽取事实、维护画像。面向做产品的开发者，天生多租户。
- **Basic Memory** 是**可读的知识库 + MCP 桥**——AI 和你一起往 Markdown 文件里写结构化笔记，用索引建图。面向个人/小团队，数据在自己磁盘上。

> 比喻：Supermemory 是「给 AI 装大脑，你只管喂」；Basic Memory 是「给 AI 一支笔和一个笔记本，你们一起写」。

更本质的分野是**记忆从哪来**：Supermemory 是**隐式**（自动抽取），Basic Memory 是**显式**（Agent 主动写）。这决定了后面几乎所有差异。

# Supermemory：隐式抽取的记忆引擎

## 核心能力

| 能力          | 说明                                                          |
| ----------- | ----------------------------------------------------------- |
| Memory（记忆图） | 从对话抽事实、建实体关系图、矛盾消解、过期自动遗忘、事实版本化                             |
| SuperRAG    | 托管 RAG：切块 + 嵌入 + 混合检索，适合知识库文档                               |
| Profiles    | 自动维护 `static`（长期事实）+ `dynamic`（近期动态），无需查询即可注入 system prompt |

关键概念：**Memory ≠ RAG**。RAG 是无状态文档切片，对所有人返回同样结果；Memory 跟踪「关于某个实体的事实如何随时间变化」。

## 数据模型（v5 API）

| 概念 | 说明 |
|---|---|
| `namespace` | 隔离边界，等价于 v3/v4 的 container tag。**SDK 里是第一个参数，REST 里在 URL 路径上** |
| `id` | 文档标识。稳定 id 是增量计费的前提——同一 id 重写只计新增/变更 token |
| `taskType` | `memory`（全流程抽取，适合对话/个人上下文） vs `superrag`（只切块嵌入，便宜约 5 倍） |
| `dreaming` | `dynamic`（默认，批量成记忆，新 namespace 可能几分钟搜不到） vs `instant`（立即可用，每文档多 1 个 operation） |
| `searchMode` | `hybrid`（默认，记忆+切片）/ `memories`（图，可带 `include.related`）/ `chunks`（纯 RAG） |

核心调用就四组：

```text
POST /ns/{namespace}/document     # 写入
POST /ns/{namespace}/search       # searchMode: hybrid | memories | chunks
POST /ns/{namespace}/profile      # 画像，无 query 参数
DELETE /ns/{namespace}/memories   # 按 id 或语义遗忘
```

写入是**异步**的：`add` 只返回 `queued`，搜索前要轮询到 `system.status === "done"`。

## 接入面

- API/SDK：`supermemory`（npm / pypi，v5 起 namespace 为第一参数）
- MCP：`https://mcp.supermemory.ai/mcp`，OAuth，工具为 `search_memory` / `get_profile` / `add_memory` / `forget_memory` / `list_*` / `who_am_i`
- 各客户端插件：Claude Code、Codex、Cursor、OpenCode、OpenClaw、Hermes
- 框架包：AI SDK、OpenAI、Mastra、VoltAgent、LangChain/LangGraph、CrewAI、Agno
- 自托管：单二进制 / Docker，`localhost:6767`，数据在 `~/.supermemory`，默认本地嵌入 `Xenova/bge-base-en-v1.5`
- 连接器：Drive / Gmail / Notion / OneDrive / GitHub / S3 / Web Crawler / Granola
- 多模态：PDF（含 OCR）、图片、视频转写、代码 AST 切块
- SMFS：把记忆挂成文件系统让 Agent 直接 grep，标称省 3 倍 token

⚠️ **API 版本坑**：README 示例仍是 v3/v4 写法（`containerTag`、`add({...})`），v5 是破坏性变更。抄示例前先确认 SDK 版本 ≥ 5，旧代码用 `npx supermemory@latest migrate`。

# Basic Memory：文件优先的可读知识库

## 架构

```
Markdown 文件（唯一真源）
      ↕ 文件监听 / 同步
SQLite 或 Postgres（二级索引：图结构 + 全文/向量索引）
      ↕
MCP Server（stdio / https）
      ↕
Claude / Codex / Cursor / ChatGPT / Obsidian
```

设计原则是 **file-first**：数据库只是索引，删掉可以重建；所有知识都在标准 Markdown 里，随时 `cp -r` 备份、用 Git 版本化。

## 知识格式

从 Markdown 的模式里解析出图结构，不需要 JSON schema：

- **Entity**：一篇笔记（frontmatter 里可用 `permalink` 显式指定路径）
- **Observation**：`- [category] 事实内容 #tag`
- **Relation**：`- requires [[Proper Grinding Technique]]`
- **Tag**：frontmatter 或 observation 内联

```markdown
## Observations

- [principle] 咖啡萃取有固定顺序：先酸、再糖、最后苦味 #extraction
- [method] 手冲通常更干净、风味更分明 #clarity

## Relations

- requires [[Proper Grinding Technique]]
- affects [[Flavor Extraction]]
```

## MCP 工具面

| 类别     | 工具                                                                                        |
| ------ | ----------------------------------------------------------------------------------------- |
| 内容     | `write_note` `read_note` `edit_note` `move_note` `delete_note` `read_content` `view_note` |
| 检索     | `search_notes` `recent_activity` `list_directory`                                         |
| 知识图    | `build_context`（遍历 `memory://` 链接）                                                        |
| 项目     | `list_memory_projects` `create_memory_project` `delete_project` `list_workspaces`         |
| Schema | `schema_infer` `schema_validate` `schema_diff`                                            |
| 兼容/诊断  | `search` `fetch` `basic_memory_diagnostics`                                               |
|        |                                                                                           |

每个工具带 MCP 行为注解（`readOnlyHint` / `destructiveHint` / `idempotentHint`），支持渐进式工具发现，避免 Agent 靠试错烧 context。

## 接入面

- 只有 **MCP**（+ Cloud HTTP），没有官方 SDK
- 客户端：Claude Desktop、Claude Code、Codex、Cursor、VS Code、ChatGPT（Custom GPT actions）、Obsidian
- Claude Code 插件：`bm install claude-code`，带 session-start briefing、**pre-compaction checkpoint**、`/basic-memory:remember` 等命令
- Cloud：$15/月（锁价），内置跨设备同步（rclone）、快照备份、Teams 共享工作区
- 本地：`uv tool install basic-memory --prerelease=allow`，Python 3.12+，默认目录 `~/basic-memory`

⚠️ **安装坑**：必须带 `--prerelease=allow`，否则 `uv` 会因为 FastMCP 4 pre-release 依赖而静默装旧版本。

# 逐项对照

| 维度      | Supermemory                                   | Basic Memory                           |
| ------- | --------------------------------------------- | -------------------------------------- |
| 存储模型    | 托管记忆图（不透明），可自托管                               | Markdown 文件为真源，数据库只是索引                 |
| 人类可读/可改 | 只能通过 console/API 看，改不了                        | 任何编辑器可读可改，Obsidian 直接出图                |
| 写入方式    | 丢对话，自动抽取                                      | Agent 主动 `write_note` 写结构化笔记           |
| 检索      | 混合检索 + 记忆图关系边 + 自动重排                          | FTS + 本地向量（FastEmbed）+ `memory://` 图遍历 |
| 记忆演化    | 自动矛盾消解、过期遗忘、版本化                               | **无自动遗忘**，靠人和 Agent 维护 wiki 卫生         |
| 用户画像    | 一等公民，`profile.static/dynamic`                 | 无此原语，需自己约定格式                           |
| 多租户     | `namespace` 原生隔离，适合 SaaS                      | project = 本地目录，不适合多租户                  |
| 多模态     | PDF/OCR/图片/视频/代码                              | 纯文本 Markdown                           |
| 外部数据源   | Drive/Gmail/Notion/GitHub/S3/Web 连接器          | 无内置连接器，靠 Git/Syncthing/Obsidian        |
| 本地运行    | 单二进制 / Docker                                 | `uv tool install`，Python 3.12+         |
| 跨设备同步   | 云端天然支持                                        | 本地手动；Cloud 才有内置同步                      |
| 协议      | MIT                                           | AGPL-3.0                               |
| 价格      | 按量：Free $5 额度/月，Pro $19，Max $100，Scale $399   | 本地永久免费；Cloud $15/月                     |
| 生态声量    | 31k star，基准评测（LongMemEval/LoCoMo/ConvoMem #1） | 2.3k commit 活跃，专注 MCP 生态               |

# 各自优劣

## Supermemory 的优势

- **零建模成本**：不需要设计「怎么记」，是给已有产品加记忆的最低摩擦路径。
- **自动记忆维护**是真差异点：矛盾消解、时效过期、版本历史——Basic Memory 完全没有这一层。
- **多租户是一等公民**，做 SaaS 直接能用。
- **完整上下文栈**：连接器 + 多模态 + RAG + 画像一站式。
- **上下文成本极低**：标称 95% Recall@15 只占约 720 token（对比全量历史减少 99.4%），profile 约 50ms。
- **MIT 协议**，商业集成无法律顾虑。

## Supermemory 的劣势

- **黑盒**：看不到也改不了它到底记了什么，排错只能翻 API。
- **记忆污染不可控**：自动抽取会把噪声固化，需要调 `metadata` / profile buckets / `signalExtraction`。
- **异步时序**：默认 `dynamic` 下新 namespace 画像可能空几分钟；`add` 的 `queued` ≠ 可检索。
- **数据出境**：默认上传对话（含工具输出），密钥过滤层官方明说不能覆盖所有情况，且只管 capture 不管 recall。
- **成本不可预测**：按 token 计费，重度用插件很快耗尽额度；必须靠稳定 `id` 和 `dreaming` 设置省钱。
- **锁定风险**：记忆存在它家，导出能力有限，不像 Markdown 可以随时拷走。

## Basic Memory 的优势

- **数据绝对主权**：`cp -r` 即完整备份，Git 可版本化，格式永续可读。
- **人机同源**：AI 写的你能审、能改、能拒绝——记忆系统里稀缺的性质。
- **Obsidian 天然兼容**：wikilink / frontmatter / graph view 全通，可挂到已有 vault。
- **结构化程度可控**：observation + relation 语法比纯文本有序，比 JSON schema 轻；还有 schema 工具做治理。
- **完全免费、可离线、air-gapped**。
- **工具设计对 Agent 友好**：行为注解 + 渐进式发现。
- **本质是 [[LLM Wiki]] 模式的开箱实现**：同样是 Markdown + 约定 + Git，但多了图索引、语义检索和 MCP 工具面。

## Basic Memory 的劣势

- **不会「自动记住」**：Agent 没被指示去写就什么都没记。记忆质量直接等于你的提示词质量。
- **没有画像原语**：做个性化产品时 `profile.static/dynamic` 这类即用接口缺失。
- **没有自动遗忘/矛盾消解**：同一事实写两遍或写矛盾了，不会合并；长期使用必然积累垃圾。
- **检索质量不如专用引擎**：本地 FastEmbed 够用，但和专门调过的混合检索 + 重排不在一个档次（可选 cross-encoder 重排默认关闭）。
- **多模态基本为零**。
- **部署摩擦**：Python 3.12+、`uv`、`--prerelease=allow`。
- **AGPL-3.0**：若嵌入对外网络服务，需开源衍生作品。
- **不适合多租户**。

# 怎么选

选 **Supermemory**：

- 做面向终端用户的产品，需要 per-user 隔离和画像
- 不想设计记忆模型，要「丢进去它自己会」
- 需要 Gmail/Drive/Notion 连接器或多模态文档
- 需要跨设备、跨客户端共享记忆，且接受数据在云上
- 在意 MIT 的商业自由度

选 **Basic Memory**：

- 想把记忆当长期资产：能读、能改、能审、能发布
- 已经在用 Obsidian，几乎没有迁移成本
- 单机 / 个人 / 小团队，不需要多租户
- 在意成本（永久免费）或需要离线 / 内网
- 愿意在「记什么、怎么记」上花心思，不要黑盒自动化

真正的分水岭：

> 你更怕「**它偷偷记错了什么**」（→ Basic Memory），还是更怕「**它什么都没记住**」（→ Supermemory）？

# 组合用法

两者都走 MCP，可以共存，各管一段：

- **Basic Memory 当长期知识层**：架构决策、项目笔记、可发布内容 → Markdown，人可读、可审、进 vault。
- **Supermemory 当会话记忆层**：短期偏好、跨会话「上次聊到哪」→ 自动抽取，不污染笔记库。

这也对应 [[Harness Engineering：以 Agent 为中心的工程实践]] 里状态与上下文的分层：可审计的长期状态放文件，易变的会话状态交给托管记忆。

# 与本 vault 的关系

本笔记库本身就是 [[LLM Wiki]] 模式（Obsidian 是 IDE，Agent 是维护者，笔记是代码库），而 Basic Memory 几乎是这个模式的**产品化实现**：同样的「Markdown 即真源 + 索引 + 语义检索」，额外提供 MCP 工具面和关系图解析。

因此对当前工作流而言：

- Basic Memory 的增量价值在**语义召回**和**自动建图**，而不是理念——理念已经在这套 `AGENTS.md` + `.agent/index.md` 里了。
- Supermemory 的增量价值在**自动抽取**，解决「模型懒，不提醒就不记」的问题，代价是让渡部分记忆控制权。

# 待确认

- 两者检索质量的实际差异（官方基准 vs 自建数据集）未验证；Supermemory 提供 MemoryBench 可做横向评测。
- 自托管 Supermemory 与企业版的功能差距（官方明确 local 版是给 builder 的，企业级另售）。
- Basic Memory 在数百篇以上笔记规模的索引性能与检索退化情况。
