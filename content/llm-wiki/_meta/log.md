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

## [2026-07-25] ingest | Rust Iterators

**Source type**: note
**Local ref**: [[language/rust/iterators]]
**Pages created**:
- [[sources/src-rust-iterators|src-rust-iterators]]
- [[concepts/Rust Iterator|Rust Iterator]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- Rust 迭代器基于 `Iterator` trait，核心是 `next` 方法。
- `iter()` / `iter_mut()` / `into_iter()` 分别返回不可变引用、可变引用、所有权。
- 迭代器是惰性的：`map`/`filter` 等适配器需要 `collect`/`sum`/`for_each` 等消费适配器触发执行。
- 闭包常与适配器组合构建转换流水线。

---

## [2026-07-25] ingest | Rust Generics

**Source type**: note
**Local ref**: [[language/rust/generics]]
**Pages created**:
- [[sources/src-rust-generics|src-rust-generics]]
- [[concepts/Rust Generics|Rust Generics]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- Rust 泛型把具体类型抽象为类型参数，可用于函数、结构体、枚举、方法。
- trait bound 约束泛型可进行的操作；长 bound 用 `where` 子句更清晰。
- 单态化在编译期展开为具体类型代码，零运行时开销，但增加编译时间和二进制体积。

---

## [2026-07-25] ingest | Rust Enum

**Source type**: note
**Local ref**: [[language/rust/enum]]
**Pages created**:
- [[sources/src-rust-enum|src-rust-enum]]
- [[concepts/Rust Enum|Rust Enum]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- Rust enum 是标签联合体，变体可携带不同类型/数量的数据。
- `Option<T>` 用 `Some(T)`/`None` 表达可空值，是 Rust 类型系统核心。
- `match` 要求穷尽（exhaustive），保证每个变体都被处理。

---

## [2026-07-25] ingest | Rust Closures

**Source type**: note
**Local ref**: [[language/rust/closure]]
**Pages created**:
- [[sources/src-rust-closures|src-rust-closures]]
- [[concepts/Rust Closure|Rust Closure]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- Rust 闭包可捕获外部环境，捕获方式分不可变借用、可变借用、`move` 获取所有权。
- 闭包自动实现 `Fn`/`FnMut`/`FnOnce`；所有闭包至少实现 `FnOnce`，关系为 `Fn` ⊂ `FnMut` ⊂ `FnOnce`。
- API 根据调用次数选择 trait bound：`unwrap_or_else` → `FnOnce`，`sort_by_key` → `FnMut`。
- `move` 常用于线程等闭包比当前作用域活得更久的场景。

**Follow-ups**:
- [ ] 下一篇：language/rust/enum.md

---

## [2026-07-25] ingest | Python dict key：__hash__ 与 __eq__

**Source type**: note
**Local ref**: [[language/Python/Python dict key：__hash__与 __eq__]]
**Pages created**:
- [[sources/src-python-dict-key-hash-eq|src-python-dict-key-hash-eq]]
- [[concepts/Python Dict Key|Python Dict Key]]
- [[concepts/Python Dataclass|Python Dataclass]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- dict 查找先用 `__hash__` 定位，再用 `__eq__` 确认；hash 相同且相等才认为是同一 key。
- 普通对象默认按身份比较；自定义值语义需同时实现 `__eq__` 和 `__hash__`。
- `@dataclass(frozen=True)` 可安全作为 dict key；`unsafe_hash=True` 在可变对象上危险。
- 作为 key 的对象插入后不能修改参与 hash/eq 的字段。

**Follow-ups**:
- [ ] 下一篇：language/rust/closure.md

---

## [2026-07-25] ingest | Quartz Mermaid 排错手册

**Source type**: note
**Local ref**: [[language/mermaid/Quartz Mermaid 排错手册]]
**Pages created**:
- [[sources/src-quartz-mermaid-debug|src-quartz-mermaid-debug]]

**Pages updated**:
- [[concepts/Mermaid|Mermaid]] — 补充 Quartz 集成排查、classDiagram 陷阱、检查清单
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- Quartz 中 Mermaid 经 Markdown → HTML code 块 → 浏览器 `mermaid.run()` 三层转换。
- 排查以浏览器实际渲染为准；`mermaid.parse()` 通过不代表 `mermaid.run()` 成功。
- classDiagram 常见坑：空 `{}`、自定义 stereotype、反向虚线实现箭头、复杂类型签名。
- 成功标准：`document.querySelectorAll("svg[aria-roledescription=error]").length === 0`。

**Follow-ups**:
- [ ] 下一篇：language/Python/Python dict key：__hash__与 __eq__.md

---

## [2026-07-25] ingest | Mermaid 使用指南

**Source type**: note
**Local ref**: [[language/mermaid/Mermaid 使用指南]]
**Pages created**:
- [[sources/src-mermaid-guide|src-mermaid-guide]]
- [[concepts/Mermaid|Mermaid]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- Mermaid 是基于文本的图表工具，支持流程图、时序图、类图、状态图、饼图、甘特图、ER 图、思维导图、象限图、Git 图。
- 类图中组合/聚合/关联/依赖对应不同的 C++ 实现方式。
- Obsidian 原生支持，复杂图表可配合 Excalidraw 或 Mermaid Live Editor。

**Follow-ups**:
- [ ] 下一篇：language/mermaid/Quartz Mermaid 排错手册.md

---

## [2026-07-25] ingest | Makefile

**Source type**: note
**Local ref**: [[language/Makefile]]
**Pages created**:
- [[sources/src-makefile|src-makefile]]
- [[concepts/Makefile|Makefile]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- Makefile 通过 target/prerequisite/recipe 规则描述构建过程。
- 常用自动变量：`$@` 目标、`$^` 所有依赖、`$<` 第一个依赖、`$?` 新于目标的依赖。
- `.PHONY` 声明不产生产物的伪目标。

**Follow-ups**:
- [ ] 下一篇：language/mermaid/Mermaid 使用指南.md

---

## [2026-07-25] ingest | 判断编译器类型

**Source type**: note
**Local ref**: [[language/CMake/判断编译器类型]]
**Pages created**:
- [[sources/src-cmake-compiler-detection|src-cmake-compiler-detection]]
- [[concepts/CMake Compiler Detection|CMake Compiler Detection]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- `CMAKE_CXX_COMPILER_ID` 在 `project()` 之后可用，常见值：`GNU`、`Clang`、`AppleClang`、`MSVC`。
- `MATCHES "Clang"` 同时匹配 Clang 与 AppleClang；`STREQUAL` 精确匹配。
- `CMAKE_CXX_COMPILER_VERSION` 配合 `VERSION_GREATER_EQUAL` 做版本判断。

**Follow-ups**:
- [ ] 下一篇：language/Makefile.md

---

## [2026-07-25] ingest | include directory

**Source type**: note
**Local ref**: [[language/CMake/include directory]]
**Pages created**:
- [[sources/src-cmake-include-directory|src-cmake-include-directory]]

**Pages updated**:
- [[concepts/CMake Dependency Management|CMake Dependency Management]] — 补充 include directories 与常用路径变量
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- `target_include_directories` 是现代 CMake 推荐的目标级头文件路径设置方式。
- 常用变量：`CMAKE_SOURCE_DIR`、`CMAKE_CURRENT_SOURCE_DIR`、`PROJECT_SOURCE_DIR`。

**Follow-ups**:
- [ ] 下一篇：language/CMake/判断编译器类型.md

---

## [2026-07-25] ingest | Google Test

**Source type**: note
**Local ref**: [[language/CMake/Google Test]]
**Pages created**:
- [[sources/src-cmake-google-test|src-cmake-google-test]]
- [[concepts/Google Test|Google Test]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- Google Test 是 C++ 主流单元测试框架，gtest 管断言/夹具/参数化，gmock 管 Mock。
- CMake 中可通过 `find_package(GTest)` 或 `FetchContent` 引入，再用 `enable_testing()` + `add_test()` 注册 CTest。
- 测试目标应独立，链接 `GTest::gtest_main` 等导入目标。

**Follow-ups**:
- [ ] 下一篇：language/CMake/include directory.md

---

## [2026-07-25] ingest | General Rules for Using Dependencies

**Source type**: note
**Local ref**: [[language/CMake/General Rules for Using Depencies]]
**Pages created**:
- [[sources/src-cmake-using-dependencies|src-cmake-using-dependencies]]
- [[concepts/CMake Dependency Management|CMake Dependency Management]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- 现代 CMake 推荐通过导入目标（imported targets）使用依赖，而非手动拼接变量。
- `find_package` 是定位外部库的主要入口；`FetchContent` / `ExternalProject` 用于构建时获取依赖。
- `PRIVATE`/`PUBLIC`/`INTERFACE` 精确控制依赖的传递性。

**Follow-ups**:
- [ ] 下一篇：language/CMake/Google Test.md
- [ ] 后续读取其他 CMake 笔记时可补充 CMake 概念总页。

---

## [2026-07-25] ingest | std-promise 和 std-future

**Source type**: note
**Local ref**: [[language/C++/std-promise 和 std-future]]
**Pages created**:
- [[sources/src-std-promise-future|src-std-promise-future]]
- [[concepts/Promise and Future|Promise and Future]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- `std::promise` 是写入端，`std::future` 是读取端，二者共享 shared state。
- `promise` 不可拷贝，`future::get()` 只能调用一次；多次读取用 `std::shared_future`。
- 可传递异常；未 set 就析构会触发 `broken_promise`。
- 选择层级：`std::async` > `std::packaged_task` > `std::promise`。

**Follow-ups**:
- [ ] 下一篇：language/CMake/General Rules for Using Depencies.md
- [ ] 后续读到 std::async、packaged_task 相关内容时可进一步补充 Promise and Future 概念页。

---

## [2026-07-25] ingest | Most vexing parse

**Source type**: note
**Local ref**: [[language/C++/Most vexing parse]]
**Pages created**:
- [[sources/src-most-vexing-parse|src-most-vexing-parse]]
- [[concepts/Most Vexing Parse|Most Vexing Parse]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- `TimeKeeper time_keeper(Timer());` 会被解析为函数声明，而非对象初始化。
- 原因是 C++ 语法在对象初始化与函数声明冲突时优先按函数声明解析。
- 解决方案：使用 `{}` 花括号初始化、额外括号或具名变量。

**Follow-ups**:
- [ ] 下一篇：language/C++/std-promise 和 std-future.md

---

## [2026-07-25] ingest | memory order

**Source type**: note
**Local ref**: [[language/C++/memory order]]
**Pages created**:
- [[sources/src-memory-order|src-memory-order]]

**Pages updated**:
- [[concepts/Memory Order|Memory Order]] — 补充 seq_cst/relaxed/acquire-release 示例、as-if 规则、release sequence
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- `seq_cst` 提供全局一致顺序但开销最大；`relaxed` 只保证原子性，允许重排。
- `acquire/release` 成对使用可建立 happens-before，是性能与正确性的常用折中。
- 单线程内 as-if 规则隐藏重排；多线程下必须通过同步原语建立顺序。
- Release sequence 让 release 写的同步效力可穿透后续 RMW 接力；C++20 收窄为仅 RMW。

**Follow-ups**:
- [ ] 下一篇：language/C++/Most vexing parse.md
- [ ] 后续读取 [[language/C++/compare_exchange_weak vs strong]] 时可与 CAS/memory order 主题整合。

---

## [2026-07-25] ingest | integral_constant

**Source type**: note
**Local ref**: [[language/C++/integral_constant]]
**Pages created**:
- [[sources/src-integral-constant|src-integral-constant]]
- [[concepts/Integral Constant|Integral Constant]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- `std::integral_constant` 把编译期常量及其类型信息封装成类型，用于模板元编程。
- `std::true_type` / `std::false_type` 是其最常用的 bool 特化别名。
- 常与 type traits 结合，把布尔或整数结果编码到类型中参与重载/特化。

**Follow-ups**:
- [ ] 下一篇：language/C++/memory order.md

---

## [2026-07-25] ingest | enable_shared_from_this

**Source type**: note
**Local ref**: [[language/C++/enable_shared_from_this]]
**Pages created**:
- [[sources/src-enable-shared-from-this|src-enable-shared-from-this]]
- [[concepts/enable_shared_from_this|enable_shared_from_this]]
- [[concepts/Smart Pointer|Smart Pointer]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- 在类内部直接 `std::shared_ptr<T>(this)` 会创建独立引用计数，导致与外部管理者冲突。
- 继承 `std::enable_shared_from_this<Derived>` 后，通过 `shared_from_this()` 可安全获取共享引用计数的 shared_ptr。
- 实现上基类保存 weak_ptr，shared_ptr 首次接管对象时写入控制块信息。

**Follow-ups**:
- [ ] 下一篇：language/C++/integral_constant.md

---

## [2026-07-25] ingest | CRTP

**Source type**: note
**Local ref**: [[language/C++/CRTP(将子类作为父类模板)]]
**Pages created**:
- [[sources/src-crtp|src-crtp]]
- [[concepts/CRTP|CRTP]]
- [[concepts/Static Polymorphism|Static Polymorphism]]
- [[concepts/Mixin|Mixin]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- CRTP 让派生类将自身作为模板参数传给基类，实现编译期静态多态。
- 通过 `static_cast<Derived*>(this)` 调用派生类方法，避免虚函数开销。
- 常见用途：静态多态、Mixin 组合、对象计数器、访问者模式等。

**Follow-ups**:
- [ ] 下一篇：language/C++/enable_shared_from_this.md
- [ ] 队列中仍存在重复条目（如 C++ 转发引用、C++17 inline static、compare_exchange_weak vs strong 已在 Read 中但 Queue 里仍有未勾选项），后续可考虑清理。

---

## [2026-07-25] ingest | Coroutine

**Source type**: note
**Local ref**: [[language/C++/Coroutine]]
**Pages created**:
- [[sources/src-coroutine|src-coroutine]]
- [[concepts/Coroutine|Coroutine]]

**Pages updated**:
- [[_meta/map|map]]
- [[_meta/read-queue|read-queue]]

**Key takeaways**:
- C++ 协程是一种可在阻塞点挂起、将控制权交还调用方，并在稍后恢复执行的函数抽象。
- C++20 通过 `co_await`、`co_yield`、`co_return` 在语言层面支持协程。
- 协程是协作式调度，切换开销通常低于内核线程。

**Follow-ups**:
- [ ] 下一篇：language/C++/CRTP(将子类作为父类模板).md
- [ ] 队列中存在重复条目（如 Coroutine、CRTP），后续批量读取时可考虑清理。

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

