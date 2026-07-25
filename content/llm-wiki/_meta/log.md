---
title: Log
description: LLM Wiki 操作日志
date: 2026-07-25
tags: [meta, log]
aliases: []
---

# Log

> 按时间倒序排列。格式：`## [YYYY-MM-DD] <operation> | <title>`

---

## [2026-07-25] setup | Wiki initialization

**Trigger**: 用户决定建立通用 LLM Wiki  
**Pages created**: [[AGENTS]], [[README]], [[_meta/map|map]], [[_meta/log|log]]  
**Note**: 采用轻量模型，外部来源不本地存档，`raw/` 仅保存聊天记录。

---

## [2026-07-25] update | Add CLAUDE.md entry point

**Trigger**: 用户希望补充 CLAUDE.md 作为 Claude Code 入口，指向 AGENTS.md  
**Pages created**: [[CLAUDE]]  
**Pages updated**: [[_meta/map|map]]（新增 Meta pages 章节）

---

## [2026-07-25] ingest | LLM Wiki idea

**Source**: [LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f#llm-wiki)  
**Type**: web  
**Local ref**: [[AI-agent/LLM Wiki]]  
**Pages created**:
- [[sources/src-llm-wiki-idea|src-llm-wiki-idea]]
- [[concepts/LLM Wiki|LLM Wiki]]
- [[concepts/RAG|RAG]]
- [[concepts/Persistent wiki|Persistent wiki]]
- [[entities/Karpathy|Karpathy]]

**Key takeaways**:
- Wiki 是持久化、复利式的人工制品，区别于 RAG 的每次重新发现。
- 三层架构：Raw sources / Wiki / Schema。
- LLM 负责维护，人负责策划来源和提问。

**Follow-ups**:
- [ ] 后续加入更多关于 RAG 和 Wiki 模式对比的来源

---

## [2026-07-25] read-queue | 建立父路径人类笔记读取队列

**Trigger**: 用户设置目标，每 5 分钟读取一篇父路径下未读的人类笔记并整理 wiki
**Pages created**: [[_meta/read-queue|read-queue]]
**Total notes**: 119
**Excluded**: llm-wiki/、Excalidraw/、index.md、.claudian/
**Next**: AI-agent/claude-code/Claude Code Loop 工程：loop、goal 与 schedule.md

---

## [2026-07-25] ingest | Claude Code Loop 工程

**Source type**: note
**Local ref**: [[AI-agent/claude-code/Claude Code Loop 工程：loop、goal 与 schedule]]
**Pages created**:
- [[sources/src-claude-code-loop-engineering|src-claude-code-loop-engineering]]
- [[entities/Claude Code|Claude Code]]
- [[concepts/Loop Engineering|Loop Engineering]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- Claude Code 的 loop engineering 用循环替代逐条 prompt，四类 loop 自动化程度递增。
- `/loop` 时间驱动、`/goal` 条件驱动、`/schedule` 负责持久调度。
- 选型关键：有终点用 `/goal`，等外部变化用 `/loop`，跨关机用 `/schedule` 云端 routine。

**Follow-ups**:
- [ ] 读取 [[AI-agent/Cursor Agent Best Practice]] 时可与 Claude Code 做对比，考虑创建 syntheses/ 页。

---

## [2026-07-25] ingest | Cursor Agent Best Practice

**Source type**: note
**Local ref**: [[AI-agent/Cursor Agent Best Practice]]
**Pages created**:
- [[sources/src-cursor-agent-best-practice|src-cursor-agent-best-practice]]
- [[entities/Cursor|Cursor]]
- [[concepts/AI Coding Agent|AI Coding Agent]]
- [[concepts/Plan Mode|Plan Mode]]
- [[concepts/Rules and Skills|Rules and Skills]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- Plan Mode 先规划，复杂任务用、简单任务直接做。
- 上下文精简比堆砌更重要；对话过长应开新 session。
- Rules/Skills 要聚焦、按需迭代，避免过度优化。
- TDD 是给 Agent 可验证目标的有效方式。
- 提示具体、配置迭代、认真 review、目标可验证，是高效使用 Agent 的共性。

**Follow-ups**:
- [ ] 读到足够多 AI 工具笔记后，创建 syntheses/Claude Code vs Cursor.md 对比页。
- [ ] 下一篇：AI-agent/hermes/Hermes Gateway.md

---

## [2026-07-25] ingest | Hermes Gateway

**Source type**: note
**Local ref**: [[AI-agent/hermes/Hermes Gateway]]
**Pages created**:
- [[sources/src-hermes-gateway|src-hermes-gateway]]
- [[entities/Hermes|Hermes]]
- [[concepts/Messaging Gateway|Messaging Gateway]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- Hermes Gateway 连接微信、Telegram、Discord、Slack、WhatsApp、Email 等平台。
- macOS 上由 launchd 托管，关闭 CLI 对话后仍可运行。
- 机器休眠会导致 gateway 停止，长期稳定需部署到常在线机器。

**Follow-ups**:
- [ ] 若后续读到更多 Hermes 组件，补充 Hermes 实体页并可能创建 syntheses/ 页。
- [ ] 下一篇：AI-agent/LLM Wiki.md

---

## [2026-07-25] review | AI-agent/LLM Wiki.md

**Source type**: note
**Local ref**: [[AI-agent/LLM Wiki]]
**Action**: 与现有 web source [[sources/src-llm-wiki-idea|src-llm-wiki-idea]] 去重合并，不新建 source 页

**Pages updated**:
- [[concepts/LLM Wiki|LLM Wiki]] — 补充架构、核心操作、实用技巧
- [[_meta/read-queue|read-queue]] — 标记为已读并清理重复条目
- [[_meta/log|log]]

**Key takeaways**:
- 该笔记与 src-llm-wiki-idea 指向同一 Karpathy gist，是同一来源的本地 note 版本。
- 补充了 LLM Wiki 概念页：三层结构、Ingest/Query/Lint 三个操作、Obsidian/Dataview/Marp/qmd 等实用工具。

**Follow-ups**:
- [ ] 下一篇：book-notes/A Philosophy of Software Design.md

---

## [2026-07-25] ingest | A Philosophy of Software Design

**Source type**: note
**Local ref**: [[book-notes/A Philosophy of Software Design]]
**Pages created**:
- [[sources/src-philosophy-of-software-design|src-philosophy-of-software-design]]
- [[entities/John Ousterhout|John Ousterhout]]
- [[concepts/Software Complexity|Software Complexity]]
- [[concepts/Information Hiding|Information Hiding]]
- [[concepts/Deep Module|Deep Module]]
- [[concepts/Classitis|Classitis]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- 复杂度公式 $C = \sum c_p t_p$：复杂度与开发者在各部分花费的时间相关。
- 信息隐藏和深模块是降低复杂度的核心手段。
- Classitis 和 temporal decomposition 是常见的复杂度来源。

**Follow-ups**:
- [ ] 下一篇：book-notes/Computer Organization and Design/Chapter 3.md

---

## [2026-07-25] skip | Computer Organization and Design/Chapter 3

**Source type**: note
**Local ref**: [[book-notes/Computer Organization and Design/Chapter 3]]
**Action**: 文件内容为空，未创建 source 页，仅标记为已读

**Pages updated**:
- [[_meta/read-queue|read-queue]]
- [[_meta/log|log]]

---

## [2026-07-25] ingest | Linux 多线程服务端编程

**Source type**: note
**Local ref**: [[book-notes/Linux 多线程服务端编程 使用 muduo C++ 网络库]]
**Pages created**:
- [[sources/src-linux-multithreaded-server-programming|src-linux-multithreaded-server-programming]]
- [[entities/陈硕|陈硕]]
- [[entities/Linux 多线程服务端编程|Linux 多线程服务端编程]]
- [[concepts/Thread Safety|Thread Safety]]
- [[concepts/Object Lifetime Management|Object Lifetime Management]]
- [[concepts/Memory Order|Memory Order]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- 线程安全的对象生命期管理是 C++ 多线程服务端编程的核心难题。
- 笔记关联了 memory order 和 bthread 等主题。

**Follow-ups**:
- [ ] 读取 [[language/C++/memory order]] 和 [[source-code/brpc/bthread]] 后，可创建 syntheses/ 页整合并发主题。
- [ ] 下一篇：book-notes/Practical VIM.md

---

## [2026-07-25] ingest | Practical VIM

**Source type**: note
**Local ref**: [[book-notes/Practical VIM]]
**Pages created**:
- [[sources/src-practical-vim|src-practical-vim]]
- [[entities/Drew Neil|Drew Neil]]
- [[entities/Vim|Vim]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- 高效 Vim 的核心是构造可重复的修改。
- 操作符命令通常优于可视命令；善用 `.` 重复和 Ex 命令批量操作。

**Follow-ups**:
- [ ] 下一篇：book-notes/The Rust Programming Language.md

---

## [2026-07-25] skip | The Rust Programming Language

**Source type**: note
**Local ref**: [[book-notes/The Rust Programming Language]]
**Action**: 文件内容为空，未创建 source 页，仅标记为已读

---

## [2026-07-25] skip | neo-tree

**Source type**: note
**Local ref**: [[coding-tools/VIM使用/neo-tree]]
**Action**: 文件内容为空，未创建 source 页，仅标记为已读

---

## [2026-07-25] ingest | VIM 基础命令

**Source type**: note
**Local ref**: [[coding-tools/VIM使用/基础命令]]
**Pages created**:
- [[sources/src-vim-basic-commands|src-vim-basic-commands]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- Vim 效率来自操作符 + motion 的组合，以及 Ex 命令的批量操作。
- 普通模式、插入模式、可视模式、命令行模式各有高频技巧。

**Follow-ups**:
- [ ] 下一篇：language/C++/ABA问题.md

---

## [2026-07-25] ingest | ABA 问题

**Source type**: note
**Local ref**: [[language/C++/ABA问题]]
**Pages created**:
- [[sources/src-aba-problem|src-aba-problem]]
- [[concepts/ABA Problem|ABA Problem]]
- [[concepts/CAS|CAS]]
- [[concepts/Lock-Free Data Structure|Lock-Free Data Structure]]
- [[concepts/Hazard Pointer|Hazard Pointer]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- ABA 问题是 CAS 无锁操作中的经典陷阱：值相同但状态已变。
- 常见于无锁栈/队列，可能导致访问已释放内存。
- 解决方案：版本号、TaggedPointer、Hazard Pointer、Epoch-based Reclamation。

**Follow-ups**:
- [ ] 读取 [[language/C++/compare_exchange_weak vs strong]] 后，可整合 CAS 相关笔记。
- [ ] 下一篇：language/C++/AddressSanitizer (ASan) 使用指南.md

---

## [2026-07-25] ingest | AddressSanitizer 使用指南

**Source type**: note
**Local ref**: [[language/C++/AddressSanitizer (ASan) 使用指南]]
**Pages created**:
- [[sources/src-addresssanitizer-guide|src-addresssanitizer-guide]]
- [[entities/AddressSanitizer|AddressSanitizer]]
- [[concepts/Memory Safety|Memory Safety]]
- [[concepts/Sanitizer|Sanitizer]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- ASan 是 Clang/GCC 内置的内存错误检测器，编译加 `-fsanitize=address -g` 即可。
- 能检测越界、UAF、double-free、泄漏；不能检测数据竞争和未初始化读取。
- 报错三段式：出错点 → 释放点 → 分配点。
- ASan 与 TSan 不能同时开启，可与 UBSan 组合。

**Follow-ups**:
- [ ] 读到 ThreadSanitizer、MemorySanitizer 相关笔记后，可创建 syntheses/Sanitizers 对比页。
- [ ] 下一篇：language/C++/C++ 转发引用、引用折叠与 make_pair报错理解.md

---

## [2026-07-25] ingest | C++ 转发引用、引用折叠与 make_pair 报错理解

**Source type**: note
**Local ref**: [[language/C++/C++ 转发引用、引用折叠与 make_pair报错理解]]
**Pages created**:
- [[sources/src-cpp-forwarding-reference|src-cpp-forwarding-reference]]
- [[concepts/Forwarding Reference|Forwarding Reference]]
- [[concepts/Reference Collapsing|Reference Collapsing]]
- [[concepts/Perfect Forwarding|Perfect Forwarding]]
- [[concepts/Value Category|Value Category]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- 转发引用 `T&&` 根据实参值类别推导 `T`：左值推导为 `T&`，右值推导为 `T`。
- 引用折叠规则：只要有一个 `&` 结果就是 `&`，只有 `&& &&` 才是 `&&`。
- 手动指定模板参数会破坏转发引用推导，导致左值无法绑定到右值引用。
- `std::forward<T>(x)` 保持原始值类别；`std::move(x)` 无条件转右值。

**Follow-ups**:
- [ ] 下一篇：language/C++/C++17 inline static.md

---

## [2026-07-25] ingest | C++17 inline static

**Source type**: note
**Local ref**: [[language/C++/C++17 inline static]]
**Pages created**:
- [[sources/src-cpp17-inline-static|src-cpp17-inline-static]]
- [[concepts/Inline Variable|Inline Variable]]
- [[concepts/ODR|ODR]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- C++17 `inline static` 成员变量可在类内直接初始化，声明即定义。
- 适合 header-only 库，`inline` 保证多翻译单元只有一份实例，不违反 ODR。

**Follow-ups**:
- [ ] 下一篇：language/C++/compare_exchange_weak vs strong.md

---

## [2026-07-25] ingest | compare_exchange_weak vs strong

**Source type**: note
**Local ref**: [[language/C++/compare_exchange_weak vs strong]]
**Pages created**:
- [[sources/src-compare-exchange-weak-strong|src-compare-exchange-weak-strong]]
- [[concepts/Spin Lock|Spin Lock]]

**Pages updated**:
- [[concepts/CAS|CAS]] — 补充 weak vs strong 对比表
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- `compare_exchange_weak` 允许伪失败，适合 CAS 循环；`compare_exchange_strong` 保证值相等时成功，适合单次尝试。
- 失败时 `expected` 会被更新为当前原子值。
- `failure` memory order 不能是 release/acq_rel。

---

## [2026-07-25] stop | 批量读取任务暂停

**Trigger**: 用户要求彻底停止 goal
**Final progress**: 16 / 119 已读（103 剩余）
**Cancelled cron job**: 772e2702
**Status**: 已停止，read-queue.md 保留当前进度，后续可随时继续。

