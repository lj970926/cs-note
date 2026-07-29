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

## [2026-07-28] ingest | Chat: DP 状态设计与转移方程技巧

**Source type**: chat
**Local raw**: [[llm-wiki/raw/chats/2026-07-28-dp-state-design-tips]]
**Trigger**: 用户要求 ingest 会话中"DP 子问题与状态转移方程构建技巧"一轮问答
**Pages created**:
- [[llm-wiki/raw/chats/2026-07-28-dp-state-design-tips|raw 聊天存档]]
- [[sources/src-dp-state-design-chat|src-dp-state-design-chat]]
- [[questions/dp-state-design-tips|DP 状态设计与转移方程技巧]]

**Pages updated**:
- [[concepts/Dynamic Programming|Dynamic Programming]] — "状态设计是难点"处链接新问答页，Sources 补充
- [[_meta/map|map]] — Stats（Sources 39→40、Questions 6→7）

**Key takeaways**:
- 状态设计核心检验：无后效性；三套路 = 前缀结构、只存影响未来的信息、状态值即优化目标。
- 转移方程通用框架：枚举到达当前状态的"最后一步决策"，比从前向后推更不易漏。
- 模式选型信号：两串对比→双序列、区间分割→区间 DP、n≤20→状压；实战路径 = 暴力递归→记忆化→填表。
- 自查四条：无后效性、完备性、顺序、边界。

**Follow-ups**:
- [ ] 各模式代表题精讲（区间 DP 分割点枚举、状压位运算、换根 DP 二次扫描、LIS 两种状态定义）。

---

## [2026-07-28] ingest | Chat: 0-1 背包贪心反例与动态规划

**Source type**: chat
**Local raw**: [[llm-wiki/raw/chats/2026-07-28-knapsack-counterexample-and-dp]]
**Trigger**: 用户要求 ingest 会话中"0-1 背包贪心反例"和"动态规划讲解 + 与贪心对比"两轮问答（[[sources/src-greedy-naming-chat|贪心命名会话]]的延续）
**Pages created**:
- [[llm-wiki/raw/chats/2026-07-28-knapsack-counterexample-and-dp|raw 聊天存档]]
- [[sources/src-knapsack-dp-chat|src-knapsack-dp-chat]]
- [[concepts/Dynamic Programming|Dynamic Programming]] — 填掉 map 中 DP 的 gap
- [[concepts/0-1 Knapsack|0-1 Knapsack]]
- [[questions/greedy-vs-dp|贪心 vs 动态规划]]

**Pages updated**:
- [[concepts/Greedy Algorithm|Greedy Algorithm]] — DP/0-1 背包改为全路径双链，Related 与 Sources 补充新页
- [[_meta/map|map]] — Stats（Sources 38→39、Concepts 59→61、Questions 5→6）；gaps 移除 `[[Dynamic Programming]]`，保留 `[[Backtracking]]`

**Key takeaways**:
- 反例：容量 10，A(6,30)/B(5,20)/C(5,20)；贪心拿性价比最高的 A 得 30，B+C 塞满得 40。根源是不可分割造成容量碎片；分数背包贪心仍最优。
- DP 中途不做不可逆选择，所有分支结果存表后取最优；适用条件 = 最优子结构 + 重叠子问题（否则是分治）。
- 关系：贪心是 DP 在贪心选择性质成立时的"豪华简化版"；DP 用时空换正确性，背包 O(nW) 为伪多项式，状态设计是难点。

**Follow-ups**:
- [ ] 任意币制找零钱贪心反例 + DP 解法（两页 follow-up 均提到，可合并整理）。
- [ ] 一维滚动数组优化与容量倒序枚举的原因。
- [ ] 交换论证证明贪心选择性质的套路。

---

## [2026-07-28] ingest | Chat: 贪心算法命名由来

**Source type**: chat
**Local raw**: [[llm-wiki/raw/chats/2026-07-28-greedy-algorithm-naming]]
**Trigger**: 用户要求 ingest 本会话中"贪心算法为啥叫贪心"的问答
**Pages created**:
- [[llm-wiki/raw/chats/2026-07-28-greedy-algorithm-naming|raw 聊天存档]] — 首个 chat 类来源，一次性归档（write-once），此后不再修改
- [[sources/src-greedy-naming-chat|src-greedy-naming-chat]]
- [[concepts/Greedy Algorithm|Greedy Algorithm]]
- [[questions/why-called-greedy|贪心算法为什么叫贪心]]

**Pages updated**:
- [[_meta/map|map]] — Stats（Sources 37→38、Concepts 58→59、Questions 4→5）；新增 Chat 来源分区；新增 `[[Dynamic Programming]]`、`[[Backtracking]]` 待建 gap

**Key takeaways**:
- "贪心"命名 = 短视（每步只取局部最优，不考虑后续影响）+ 不回头（无回溯，与 Backtracking 对比）。
- 贪心正确的前提：贪心选择性质 + 最优子结构；正例 Huffman/MST/活动选择，反例 0-1 背包。
- 这是 Wiki 首个 chat 类来源；按 schema 在 `raw/chats/` 建立原始存档，source 页用 `local_raw` 指向。AGENTS 中"LLM 不修改 raw/"按"归档后不再修改"理解，一次性创建归档属于 ingest 流程的一部分。

**Follow-ups**:
- [ ] 贪心选择性质的证明套路（交换论证、归纳法）可整理为 concept 或 question 页。
- [ ] 任意币制找零钱反例 + DP 解法，可在建 `[[Dynamic Programming]]` 页时一并处理。

---

## [2026-07-27] ingest | GTD - Getting Things Done

**Source type**: note
**Local ref**: [[其他/GTD - Getting Things Done]]
**Trigger**: 用户要求 ingest 该笔记；GTD 此前作为 gap 被 [[concepts/Procrastination|Procrastination]] 引用
**Pages created**:
- [[sources/src-gtd|src-gtd]]
- [[concepts/GTD|GTD]]
- [[entities/David Allen|David Allen]]

**Pages updated**:
- [[_meta/map|map]] — gaps 中移除 `[[GTD]]`（已建页），新增 `[[番茄工作法]]`、`[[Eisenhower 矩阵]]`

**Key takeaways**:
- GTD 核心：大脑是用来思考的不是用来记忆的；Open Loop 外化到可信赖系统以消除焦虑。
- 五步流程 Capture→Clarify→Organize→Reflect→Engage；Weekly Review 是发动机，本质是重建对系统的信任。
- 与 Procrastination 概念页形成互链：GTD 对应"混沌型"拖延的解法。
- 新增实体页 David Allen（GTD 提出者）。

**Follow-ups**:
- [ ] `[[深度工作]]`、`[[原子习惯]]`、`[[番茄工作法]]`、`[[Eisenhower 矩阵]]` 仍为 gap；vault 中若出现对应笔记可建页。
- [ ] 拖延手册书单中的《微习惯》《自控力》若后续有读书笔记，可补充 Procrastination 页。

---

## [2026-07-27] ingest | DFlash: Block Diffusion for Flash Speculative Decoding

**Source type**: note
**Local ref**: [[paper/DFlash Block Diffusion for Flash Speculative Decoding]]
**Trigger**: 用户要求 ingest 该论文笔记
**Pages created**:
- [[sources/src-dflash|src-dflash]]
- [[concepts/DFlash|DFlash]]
- [[concepts/Speculative Decoding|Speculative Decoding]]
- [[entities/vLLM|vLLM]]

**Pages updated**:
- [[_meta/map|map]]

**Key takeaways**:
- DFlash 用 Diffusion LLM 做 drafter、AR LLM 做 target，实现精度无损加速；核心是把 target hidden state 直接注入 draft 的 KV Cache，accept length 明显优于 EAGLE-3。
- vLLM 实现：`precompute_and_store_context_kv` 将所有层 KV projection 权重拼成一次大 GEMM，配合融合 RMSNorm/RoPE 与逐层 `do_kv_cache_update`。
- 输入准备由 Triton kernel 融合：positions/slot_mapping/input_ids（bonus + mask token）/采样索引一次完成。
- 这是 Wiki 首个 LLM 推理方向来源，新建了 Speculative Decoding 概念页与 vLLM 实体页作为该领域的挂点。

**Follow-ups**:
- [ ] `[[EAGLE]]`、`[[Diffusion LLM]]` 已登记为 gap，后续读到相关来源可建页。
- [ ] 若 ingest 更多 vLLM 源码笔记（如 [[vllm 源码随手记]]），可充实 vLLM 实体页与 spec decode 框架细节。

---

## [2026-07-27] ingest | 拖延症应对手册

**Source type**: note
**Local ref**: [[其他/拖延症应对手册]]
**Trigger**: 用户要求 ingest 该笔记
**Pages created**:
- [[sources/src-procrastination-handbook|src-procrastination-handbook]]
- [[concepts/Procrastination|Procrastination]]

**Pages updated**:
- [[_meta/map|map]]

**Key takeaways**:
- 拖延是情绪管理问题而非时间管理问题；先诊断类型（完美主义/瘫痪/混沌）再对症用药。
- 阻力 90% 集中在启动：两分钟规则、缩小到不可能失败、五秒启动法。
- 环境设计替代意志力；拖延后不自责（自责制造下一次拖延）。
- 该笔记创建于 2026-07-27，不在 read-queue 快照内，队列无需更新。

**Follow-ups**:
- [ ] 源笔记中 [[GTD]]、[[深度工作]]、[[原子习惯]] 标记为"待建"，若 vault 后续出现对应笔记可建 concept 页并回填链接。

---

## [2026-07-27] ingest | SFINAE

**Source type**: web
**Source URL**: <https://en.cppreference.com/w/cpp/language/sfinae.html>
**Context**: 用户阅读 [[concepts/Integral Constant|Integral Constant]] 时询问 SFINAE 的含义与读法
**Pages created**:
- [[sources/src-sfinae|src-sfinae]]
- [[concepts/SFINAE|SFINAE]]

**Pages updated**:
- [[_meta/map|map]]

**Key takeaways**:
- SFINAE：函数模板重载决议中替换失败的候选被静默剔除，只有全部失败才报错。
- 只保护替换阶段（签名/返回类型等直接上下文）；函数体或深层实例化出错仍是硬错误。
- `std::enable_if` 是最常见应用；C++20 concepts 是更直观的替代。
- 读作 "sfin-ay" /ˈsfɪneɪ/。

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


---

## [2026-07-26] ingest | Intel SDM

**Source type**: web
**Source URL**: https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html
**Trigger**: 用户问 "x86 的手册在哪里"，随后要求 ingest
**Pages created**:
- [[sources/src-intel-sdm|src-intel-sdm]]
- [[entities/Intel|Intel]]
- [[concepts/x86-64|x86-64]]

**Pages updated**:
- [[_meta/map|map]]

**Key takeaways**:
- Intel SDM 分四卷：Vol.1 基础架构、Vol.2 指令参考、Vol.3 系统编程、Vol.4 MSR。
- 查单条指令可用 felixcloutier.com/x86 网页版，比翻 PDF 快。
- x86-64 / long mode 为 AMD 原创扩展，查 `syscall` 等可对照 AMD64 手册。

---

## [2026-07-26] query | 如何阅读 Intel SDM

**Trigger**: 用户问：有体系结构基础但不熟 x86，怎么读 SDM
**Pages created**:
- [[questions/how-to-read-intel-sdm|如何阅读 Intel SDM]]

**Pages updated**:
- [[_meta/map|map]]

**Key takeaways**:
- SDM 是参考手册不是教科书，不要线性读；Vol.1 第 3 章是唯一需要通读的部分。
- 两条 track：读编译器输出（felixcloutier + Optimization Manual）、OS 开发（Vol.3 分页/中断/内存序）。
- 微架构细节在 Optimization Reference Manual，不在 SDM。

---

## [2026-07-26] ingest | felixcloutier.com/x86

**Source type**: web
**Source URL**: https://www.felixcloutier.com/x86/
**Trigger**: 用户表示这个网站不错，要求正式收录
**Pages created**:
- [[sources/src-felixcloutier-x86|src-felixcloutier-x86]]
- [[entities/Felix Cloutier|Felix Cloutier]]

**Pages updated**:
- [[sources/src-intel-sdm|src-intel-sdm]] — 关联资源改为双链
- [[concepts/x86-64|x86-64]] — 查表与 Sources 增加新来源
- [[_meta/map|map]]

**Key takeaways**:
- felixcloutier.com/x86 是 Intel SDM Vol.2 的可搜索网页镜像，查单条指令的主力工具。
- 二手镜像来源，权威语义仍以 SDM 原文为准。

---

## [2026-07-26] query | Linux 进程地址空间布局

**Trigger**: 用户提问 "linux的进程地址空间长啥样？"
**Source**: 无外部来源，基于通用系统知识回答
**Pages created**:
- [[questions/linux-process-address-space|Linux 进程地址空间布局]]

**Pages updated**:
- [[_meta/map|map]]

**Key takeaways**:
- x86-64 48 位 VA：低地址 text/data/bss，中间 heap 向上、mmap 区向下，顶部用户栈；上半部为内核空间。
- VMA 是管理单位，page fault 惰性分配物理页；ASLR 随机化各段基址。
- Follow-up：VMA/demand paging 可建独立 concept 页。

---

## [2026-07-26] query | 栈段的权限

**Trigger**: 用户追问 "stack 这个 segment 的权限是啥？"
**Source**: 无外部来源，基于通用系统知识回答
**Pages updated**:
- [[questions/linux-process-address-space|Linux 进程地址空间布局]] — 新增"栈的权限"小节

**Key takeaways**:
- 用户栈为 `rw-`（NX），权限由 ELF `PT_GNU_STACK` 决定，`-z execstack` 可改可执行栈。
- grow-down（`VM_GROWSDOWN`）是隐藏属性；线程栈在 mmap 区且带 `PROT_NONE` guard page。

---

## [2026-07-26] query | 查看栈权限的命令

**Trigger**: 用户追问 "有什么命令可以看吗？readelf 可以吗？或者 objdump"
**Source**: 无外部来源，基于通用系统知识回答
**Pages updated**:
- [[questions/linux-process-address-space|Linux 进程地址空间布局]] — 新增"查看权限的命令"小节

**Key takeaways**:
- 静态：`readelf -lW | grep GNU_STACK`（标准）；`objdump -p` 也可，但 `-S`/`-h` 看 section 看不到。
- 动态：`/proc/<pid>/maps`、`pmap -X`。

---

## [2026-07-26] query | GDB 查看地址空间/栈

**Trigger**: 用户追问 "gdb有啥东西可以看吗？"
**Source**: 无外部来源，基于通用系统知识回答
**Pages updated**:
- [[questions/linux-process-address-space|Linux 进程地址空间布局]] — "查看权限的命令"新增 GDB 小节

**Key takeaways**:
- `info proc mappings` 是调试器内嵌版 /proc/pid/maps，直接显示各段 Perms。
- 配合 `info frame`、`x/32gx $rsp` 做栈分析；GDB 默认禁用 ASLR 便于调试复现。

---

## [2026-07-26] query | 基于栈溢出的代码注入

**Trigger**: 用户提问 "基于 stack overflow 的 code injection 一般是怎么做的？代码注入到哪里呀？"
**Source**: 无外部来源，基于通用系统安全知识回答
**Pages created**:
- [[questions/stack-based-code-injection|基于栈溢出的代码注入]]

**Pages updated**:
- [[_meta/map|map]]
- [[questions/linux-process-address-space|Linux 进程地址空间布局]] — Follow-ups 增加互链

**Key takeaways**:
- 注入位置 = 溢出的缓冲区本身（通常栈上），覆盖 return address 引入执行流，NOP sled 解决地址不确定性。
- 防御进化链：NX → ret2libc；ASLR → 信息泄露 + ROP；canary；PIE。

---

## [2026-07-26] query | 拿 shell 有什么用

**Trigger**: 用户追问 "拿shell有啥用呢？"
**Source**: 无外部来源，基于通用系统安全知识回答
**Pages updated**:
- [[questions/stack-based-code-injection|基于栈溢出的代码注入]] — 新增"为什么经典 payload 是拿 shell"小节

**Key takeaways**:
- shell = 目标进程权限的交互式操作权；setuid root 目标给出 root shell。
- shell 是 foothold 里程碑，之后是提权、持久化、横向移动；payload 也可以是 bind/reverse shell 或 dropper。

---

## [2026-07-26] query | NX bit 与 ASLR 是什么

**Trigger**: 用户追问 "NX bit和ASLR都是啥？"
**Source**: 无外部来源，基于通用系统安全知识回答
**Pages created**:
- [[concepts/NX Bit|NX Bit]]
- [[concepts/ASLR|ASLR]]

**Pages updated**:
- [[_meta/map|map]] — Concepts 50→52
- [[questions/stack-based-code-injection|基于栈溢出的代码注入]] — Sources 链接新概念页

**Key takeaways**:
- NX = PTE 硬件不可执行位，实现 W^X，堵死数据区代码注入，催生 ret2libc/ROP。
- ASLR = 各段基址随机化（PIE 才可随机化代码段），局限：只动基址、熵有限、信息泄露可破。
- 两者互补：NX 消灭注入，ASLR 消灭复用所需的地址知识。

---

## [2026-07-27] query | all-gather 的 algbw 和 busbw 怎么算

**Trigger**: 用户提问 "all-gather算法的算法带宽和总线带宽分别怎么算？"
**Source**: 无外部来源，基于 NCCL-tests 通行口径整理
**Pages created**:
- [[concepts/All-Gather|All-Gather]]
- [[questions/allgather-bandwidth|All-Gather 的算法带宽与总线带宽]]

**Pages updated**:
- [[_meta/map|map]] — Concepts 57→58，Questions 3→4；新增 NCCL / Ring All-Reduce 待建 gap

**Key takeaways**:
- algbw = S/t；busbw = algbw × (n-1)/n，来自 ring 上每 rank 实际传输 (n-1)·S/n 字节。
- 修正因子对照：All-Reduce 2(n-1)/n，Reduce-Scatter 同 All-Gather，Broadcast/Reduce 为 1。

---

## [2026-07-29] ingest | chat: bash 脚本中执行临时多行命令

**Trigger**: 用户要求 ingest 本次会话中关于 "bash 脚本里执行一个临时的多行命令" 的问答
**Source type**: chat
**Pages created**:
- [[llm-wiki/raw/chats/2026-07-29-bash-multiline-command|raw chat 存档]]
- [[sources/src-bash-multiline-chat|src-bash-multiline-chat]]
- [[concepts/Heredoc|Heredoc]]
- [[questions/bash-multiline-command|Bash 脚本中执行临时多行命令的方式]]

**Pages updated**:
- [[_meta/map|map]] — Sources 40→41，Concepts 61→62，Questions 7→8；新增 ANSI-C Quoting / Command Grouping 待建 gap

**Key takeaways**:
- Heredoc 定界符加引号（`<<'EOF'`）才阻止 `$` 展开，是"原样执行"的关键；忘加引号是最常见的坑。
- 选型：喂解释器用 heredoc、远程用 `$'\n'` 或 `ssh host bash -s`、统一重定向用 `{ }`、传参复用定义函数。
- `<<-` 只剥行首 Tab 不剥空格，允许内容缩进书写。

---

## [2026-07-29] ingest | chat: Cursor / Copilot Auto 模型路由

**Trigger**: 用户要求 ingest 会话中关于模型路由的两段问答（Auto 怎么路由 + 路由评估用什么模型）
**Source type**: chat（含 Web 搜索补充）
**Pages created**:
- [[llm-wiki/raw/chats/2026-07-29-model-routing-auto|raw chat 存档]]
- [[sources/src-model-routing-chat|src-model-routing-chat]]
- [[concepts/Model Routing|Model Routing]]
- [[entities/GitHub Copilot|GitHub Copilot]]
- [[questions/cursor-copilot-auto-routing|Cursor / Copilot 的 Auto 模型路由机制]]

**Pages updated**:
- [[_meta/map|map]] — Sources 41→43（含下方 RL TTS），Entities 14→15，Concepts 62→64，Questions 8→9

**Key takeaways**:
- "Auto" = 调用任何模型前的前置分类器，非随机选择或 fallback 链。
- 路由模型受 <50ms 延迟/极低成本约束，主流是 BERT 级 encoder 分类器；训练靠大模型离线标注 + keep rate 在线反馈的蒸馏式自举。
- Cursor Router（60 万+ 请求训练、三档优化、缓存感知）与 Copilot Auto（任务评估 + 健康度双信号）是同一架构的两个实例。

---

## [2026-07-29] ingest | chat: RL test-time scaling

**Trigger**: 用户要求 ingest 会话中关于 RL test-time scaling 的问答
**Source type**: chat
**Pages created**:
- [[llm-wiki/raw/chats/2026-07-29-rl-test-time-scaling|raw chat 存档]]
- [[sources/src-rl-test-time-scaling-chat|src-rl-test-time-scaling-chat]]
- [[concepts/Test-Time Scaling|Test-Time Scaling]]

**Pages updated**:
- [[_meta/map|map]] — 新增 RLVR / Process Reward Model 待建 gap

**Key takeaways**:
- RL（可验证奖励 RLVR）教会模型把更长思考时间转化为更准答案，推理算力成为继参数、数据后的第三条扩展轴。
- 串行线（长 CoT，o1/R1，RL 主战场）vs 并行线（best-of-N、self-consistency、PRM 搜索）。
- 模型能力 = 思考预算的函数；与 [[concepts/Speculative Decoding|Speculative Decoding]] 方向互补（一个省推理算力，一个加推理算力）。
