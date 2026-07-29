---
title: Map
description: LLM Wiki 内容地图
date: 2026-07-25
tags: [meta, map]
aliases: []
---

# Map

> 本 Wiki 的入口地图。每次 ingest / query / lint 后由 LLM 更新。

## Stats

- Sources: 43
- Entities: 15
- Concepts: 64
- Syntheses: 0
- Questions: 9
- Last updated: 2026-07-29

## Meta pages

- [[AGENTS]] — LLM 行为手册 / schema
- [[CLAUDE]] — Claude Code 入口，指向 AGENTS.md
- [[README]] — 给人看的 Wiki 说明
- [[_meta/map|Map]] — 本文件：内容地图
- [[_meta/log|Log]] — 操作日志
- [[_meta/read-queue|Read Queue]] — 父路径人类笔记批量读取队列

## Sources

### Web
- [[sources/src-llm-wiki-idea|src-llm-wiki-idea]] — Karpathy 提出的 LLM Wiki 模式
- [[sources/src-intel-sdm|src-intel-sdm]] — Intel SDM，x86/x86-64 官方开发者手册
- [[sources/src-felixcloutier-x86|src-felixcloutier-x86]] — Intel SDM Vol.2 指令参考的可搜索网页版
- [[sources/src-sfinae|src-sfinae]] — cppreference 的 SFINAE 参考页

### Note
- [[sources/src-aba-problem|src-aba-problem]] — ABA 问题笔记
- [[sources/src-addresssanitizer-guide|src-addresssanitizer-guide]] — AddressSanitizer 使用指南
- [[sources/src-claude-code-loop-engineering|src-claude-code-loop-engineering]] — Claude Code Loop 工程笔记
- [[sources/src-cmake-using-dependencies|src-cmake-using-dependencies]] — CMake 使用依赖官方指南笔记
- [[sources/src-cmake-google-test|src-cmake-google-test]] — CMake 集成 Google Test 笔记
- [[sources/src-cmake-include-directory|src-cmake-include-directory]] — CMake include directory 笔记
- [[sources/src-cmake-compiler-detection|src-cmake-compiler-detection]] — CMake 判断编译器类型笔记
- [[sources/src-cpp-forwarding-reference|src-cpp-forwarding-reference]] — C++ 转发引用与引用折叠笔记
- [[sources/src-dflash|src-dflash]] — DFlash（Diffusion 投机解码）论文与 vLLM 实现笔记
- [[sources/src-gtd|src-gtd]] — GTD 任务管理方法论指南笔记
- [[sources/src-cpp17-inline-static|src-cpp17-inline-static]] — C++17 inline static 笔记
- [[sources/src-compare-exchange-weak-strong|src-compare-exchange-weak-strong]] — compare_exchange_weak vs strong 笔记
- [[sources/src-coroutine|src-coroutine]] — C++ Coroutine 笔记
- [[sources/src-crtp|src-crtp]] — C++ CRTP 笔记
- [[sources/src-cursor-agent-best-practice|src-cursor-agent-best-practice]] — Cursor Agent 最佳实践
- [[sources/src-enable-shared-from-this|src-enable-shared-from-this]] — C++ enable_shared_from_this 笔记
- [[sources/src-hermes-gateway|src-hermes-gateway]] — Hermes Gateway 笔记
- [[sources/src-integral-constant|src-integral-constant]] — C++ integral_constant 笔记
- [[sources/src-makefile|src-makefile]] — Makefile 特殊变量笔记
- [[sources/src-memory-order|src-memory-order]] — C++ memory order 笔记
- [[sources/src-mermaid-guide|src-mermaid-guide]] — Mermaid 使用指南笔记
- [[sources/src-most-vexing-parse|src-most-vexing-parse]] — C++ Most vexing parse 笔记
- [[sources/src-python-dict-key-hash-eq|src-python-dict-key-hash-eq]] — Python dict key: __hash__ 与 __eq__ 笔记
- [[sources/src-quartz-mermaid-debug|src-quartz-mermaid-debug]] — Quartz Mermaid 排错手册笔记
- [[sources/src-rust-closures|src-rust-closures]] — Rust Closures 笔记
- [[sources/src-rust-enum|src-rust-enum]] — Rust Enum 笔记
- [[sources/src-rust-generics|src-rust-generics]] — Rust Generics 笔记
- [[sources/src-rust-iterators|src-rust-iterators]] — Rust Iterators 笔记
- [[sources/src-philosophy-of-software-design|src-philosophy-of-software-design]] — 《A Philosophy of Software Design》读书笔记
- [[sources/src-linux-multithreaded-server-programming|src-linux-multithreaded-server-programming]] — 《Linux 多线程服务端编程》读书笔记
- [[sources/src-practical-vim|src-practical-vim]] — 《Practical VIM》读书笔记
- [[sources/src-procrastination-handbook|src-procrastination-handbook]] — 拖延症应对手册笔记
- [[sources/src-std-promise-future|src-std-promise-future]] — C++ std-promise 和 std-future 笔记
- [[sources/src-vim-basic-commands|src-vim-basic-commands]] — VIM 基础命令速查

### Chat
- [[sources/src-greedy-naming-chat|src-greedy-naming-chat]] — 会话：贪心算法命名由来（首个 chat 类来源）
- [[sources/src-knapsack-dp-chat|src-knapsack-dp-chat]] — 会话：0-1 背包贪心反例与动态规划讲解
- [[sources/src-dp-state-design-chat|src-dp-state-design-chat]] — 会话：DP 状态设计与转移方程技巧
- [[sources/src-bash-multiline-chat|src-bash-multiline-chat]] — 会话：bash 脚本中执行临时多行命令的方式
- [[sources/src-model-routing-chat|src-model-routing-chat]] — 会话：Cursor / Copilot Auto 模型路由机制（含 Web 搜索）
- [[sources/src-rl-test-time-scaling-chat|src-rl-test-time-scaling-chat]] — 会话：RL test-time scaling 是什么

## Entities

- [[entities/AddressSanitizer|AddressSanitizer]] — Clang/GCC 内置的内存错误检测工具（ASan）
- [[entities/Claude Code|Claude Code]] — Anthropic 出品的 AI 编程助手/CLI 工具
- [[entities/Cursor|Cursor]] — 集成 AI Agent 的代码编辑器
- [[entities/David Allen|David Allen]] — 生产力顾问，GTD 方法论提出者
- [[entities/Drew Neil|Drew Neil]] — Vim 专家，《Practical VIM》作者
- [[entities/Felix Cloutier|Felix Cloutier]] — x86 指令速查站 felixcloutier.com/x86 维护者
- [[entities/GitHub Copilot|GitHub Copilot]] — GitHub 出品的 AI 编程助手，多模型 + Auto 路由
- [[entities/Hermes|Hermes]] — 多平台消息接入的 AI 消息框架
- [[entities/Intel|Intel]] — x86 架构定义者，Intel SDM 手册发布方
- [[entities/John Ousterhout|John Ousterhout]] — 斯坦福大学计算机科学教授，《A Philosophy of Software Design》作者
- [[entities/Karpathy|Karpathy]] — AI 研究员，LLM Wiki 理念的提出者
- [[entities/Linux 多线程服务端编程|Linux 多线程服务端编程]] — 陈硕关于 C++ 多线程服务端开发的著作
- [[entities/Vim|Vim]] — 高度可扩展的模态文本编辑器
- [[entities/vLLM|vLLM]] — 高吞吐 LLM 推理引擎，实现了 DFlash 等投机解码
- [[entities/陈硕|陈硕]] — C++ 程序员，《Linux 多线程服务端编程》作者

## Concepts

- [[concepts/0-1 Knapsack|0-1 Knapsack]] — 物品不可分割的背包问题；贪心因容量碎片失效的典型反例
- [[concepts/ABA Problem|ABA Problem]] — CAS 无锁操作中值相同但状态已变的经典问题
- [[concepts/All-Gather|All-Gather]] — 把各 rank 分片聚合到所有 rank 的集合通信原语，含 algbw/busbw 口径
- [[concepts/ASLR|ASLR]] — 地址空间布局随机化，每次启动随机偏移各段基址
- [[concepts/AI Coding Agent|AI Coding Agent]] — 能自主理解、修改、验证代码的 AI 智能体
- [[concepts/CAS|CAS]] — 比较并交换，实现无锁算法的核心原子原语
- [[concepts/Classitis|Classitis]] — 过度拆分小类导致模块变浅、依赖增加的反模式
- [[concepts/CMake Compiler Detection|CMake Compiler Detection]] — 在 CMake 中识别 C/C++ 编译器类型与版本的方法
- [[concepts/CMake Dependency Management|CMake Dependency Management]] — 在 CMake 项目中查找、引入和传播外部依赖的方法与最佳实践
- [[concepts/Coroutine|Coroutine]] — 可在执行过程中挂起并恢复的函数/控制流抽象
- [[concepts/CRTP|CRTP]] — C++ 中通过模板继承实现静态多态的惯用法
- [[concepts/Deep Module|Deep Module]] — 接口简单但内部实现功能丰富的模块
- [[concepts/Dynamic Programming|Dynamic Programming]] — 重叠子问题各解一次并存表、由子问题答案拼出最优解的算法范式
- [[concepts/DFlash|DFlash]] — 用 Diffusion LLM 做 drafter、把 target hidden state 注入 draft KV Cache 的投机解码方法
- [[concepts/enable_shared_from_this|enable_shared_from_this]] — 在对象内部安全获取管理自身的 shared_ptr 的 C++ 机制
- [[concepts/Forwarding Reference|Forwarding Reference]] — C++ 模板中既能接收左值又能接收右值的特殊引用
- [[concepts/Google Test|Google Test]] — C++ 主流单元测试框架及其在 CMake 中的集成方式
- [[concepts/GTD|GTD]] — David Allen 的任务管理方法论：外化一切悬而未决，五步流程闭环
- [[concepts/Greedy Algorithm|Greedy Algorithm]] — 每步取局部最优且不回头、靠贪心选择性质保证全局最优的算法范式
- [[concepts/Hazard Pointer|Hazard Pointer]] — 无锁数据结构中安全延迟回收内存的机制
- [[concepts/Heredoc|Heredoc]] — Shell 中把多行文本原样传给命令 stdin 的重定向语法，定界符加引号阻止展开
- [[concepts/Information Hiding|Information Hiding]] — 将模块的实现细节封装起来，只暴露必要接口的设计原则
- [[concepts/Inline Variable|Inline Variable]] — C++17 引入的可在头文件中定义且不会引发重复定义的全局/静态变量
- [[concepts/Integral Constant|Integral Constant]] — C++ 中把编译期常量及其类型信息封装成类型的模板元编程工具
- [[concepts/LLM Wiki|LLM Wiki]] — LLM 维护的通用知识库模式
- [[concepts/Lock-Free Data Structure|Lock-Free Data Structure]] — 不依赖互斥锁，通过原子操作保证线程安全的数据结构
- [[concepts/Loop Engineering|Loop Engineering]] — 用循环驱动 LLM 持续工作的方法论
- [[concepts/Memory Order|Memory Order]] — 多线程程序中内存访问操作的可见性和排序规则
- [[concepts/Memory Safety|Memory Safety]] — 程序访问内存时不会出现越界、use-after-free 等未定义行为的性质
- [[concepts/Messaging Gateway|Messaging Gateway]] — 连接 AI 系统与外部消息平台的中间服务
- [[concepts/Mixin|Mixin]] — 通过继承组合可复用功能单元的设计方式
- [[concepts/Most Vexing Parse|Most Vexing Parse]] — C++ 中对象初始化被误解析为函数声明的语法歧义
- [[concepts/Model Routing|Model Routing]] — 调用 LLM 前用前置分类器为请求选模型的机制，Cursor Router / Copilot Auto 背后的架构
- [[concepts/NX Bit|NX Bit]] — 硬件级页不可执行位，实现 W^X 策略
- [[concepts/Mermaid|Mermaid]] — 基于文本语法的图表绘制工具，可从 Markdown 代码块生成多种图表
- [[concepts/Makefile|Makefile]] — GNU Make 使用的基于规则的构建描述文件
- [[concepts/Object Lifetime Management|Object Lifetime Management]] — 在多线程环境下安全地创建和销毁对象的问题
- [[concepts/ODR|ODR]] — C++ 的 One Definition Rule，规定实体在整个程序中只能被定义一次
- [[concepts/Perfect Forwarding|Perfect Forwarding]] — 在函数模板中保持参数原始左值/右值属性传递给另一个函数
- [[concepts/Plan Mode|Plan Mode]] — 让 AI 在动手前先产出执行计划的模式
- [[concepts/Promise and Future|Promise and Future]] — C++ 中用于跨线程一次性传递异步结果与同步状态的标准机制
- [[concepts/Python Dataclass|Python Dataclass]] — Python 中通过装饰器自动生成数据类常用方法（__init__、__repr__、__eq__ 等）的机制
- [[concepts/Python Dict Key|Python Dict Key]] — Python 字典中 key 的相等性、哈希约束与可哈希对象的要求
- [[concepts/RAG|RAG]] — 检索增强生成
- [[concepts/Reference Collapsing|Reference Collapsing]] — C++ 中多个引用限定符组合时折叠为单一引用类型的规则
- [[concepts/Rules and Skills|Rules and Skills]] — 给 AI Agent 的持久化约束与领域知识配置
- [[concepts/Sanitizer|Sanitizer]] — 编译器内置的动态程序正确性检测工具族
- [[concepts/SFINAE|SFINAE]] — C++ 模板规则：替换失败不是错误，失败候选从重载集合中被剔除
- [[concepts/Software Complexity|Software Complexity]] — 软件系统中让开发者难以理解和修改的累积负担
- [[concepts/Speculative Decoding|Speculative Decoding]] — drafter 提议 + target 并行验证的无损解码加速范式
- [[concepts/Spin Lock|Spin Lock]] — 通过循环 CAS 操作忙等待获取的锁
- [[concepts/Static Polymorphism|Static Polymorphism]] — 在编译期而非运行期实现的多态行为
- [[concepts/Rust Closure|Rust Closure]] — Rust 中携带外部环境、由编译器推断并实现 Fn/FnMut/FnOnce trait 的匿名函数
- [[concepts/Rust Enum|Rust Enum]] — Rust 中可携带数据的标签联合体枚举类型
- [[concepts/Rust Generics|Rust Generics]] — Rust 中通过类型参数消除重复、结合 trait bound 约束并在编译期单态化的泛型机制
- [[concepts/Rust Iterator|Rust Iterator]] — Rust 中基于 Iterator trait 的惰性遍历、消费适配器与迭代器适配器组合机制
- [[concepts/Smart Pointer|Smart Pointer]] — 封装裸指针、自动管理生命周期的 C++ 指针类型
- [[concepts/Thread Safety|Thread Safety]] — 多个线程访问共享资源时程序行为正确的性质
- [[concepts/Test-Time Scaling|Test-Time Scaling]] — 推理时花更多算力换更好答案，RL（RLVR）让长思考真正有效
- [[concepts/x86-64|x86-64]] — 由 AMD 定义、Intel 采用的 64 位 x86 指令集架构
- [[concepts/Value Category|Value Category]] — C++ 中表达式的左值/右值分类
- [[concepts/Persistent wiki|Persistent wiki]] — 持久化、复利式积累的知识库
- [[concepts/Procrastination|Procrastination]] — 拖延是情绪管理问题，按三型诊断、五层应对

## Syntheses

_暂无_

## Questions

- [[questions/allgather-bandwidth|All-Gather 的算法带宽与总线带宽]] — algbw = S/t，busbw = algbw × (n-1)/n 的推导
- [[questions/how-to-read-intel-sdm|如何阅读 Intel SDM]] — 面向有体系结构基础者的 SDM 阅读路线
- [[questions/linux-process-address-space|Linux 进程地址空间布局]] — x86-64 进程虚拟地址空间的典型布局
- [[questions/stack-based-code-injection|基于栈溢出的代码注入]] — stack smashing 原理、注入位置与防御进化
- [[questions/why-called-greedy|贪心算法为什么叫贪心]] — "贪心"命名由来：短视、不回头的局部最优决策风格
- [[questions/greedy-vs-dp|贪心 vs 动态规划]] — 0-1 背包贪心反例与贪心/DP 的系统对比
- [[questions/dp-state-design-tips|DP 状态设计与转移方程技巧]] — 前缀结构、枚举最后一步、模式选型与自查清单
- [[questions/bash-multiline-command|Bash 脚本中执行临时多行命令的方式]] — heredoc / bash -c / ANSI-C 引号 / 命令分组 / 临时文件的选型
- [[questions/cursor-copilot-auto-routing|Cursor / Copilot 的 Auto 模型路由机制]] — 前置分类器架构、路由信号、路由模型形态与训练信号

## Orphans & gaps

- `[[concepts/Template Metaprogramming]]` 与 `[[concepts/Type Traits]]` 被 [[concepts/Integral Constant|Integral Constant]]、[[concepts/SFINAE|SFINAE]] 等页引用，但尚未建页。
- `[[深度工作]]`、`[[原子习惯]]` 被 [[concepts/Procrastination|Procrastination]] 引用（源笔记中标记为"待建"），尚无对应来源与页面；`[[GTD]]` 已于 2026-07-27 建页。
- `[[番茄工作法]]`、`[[Eisenhower 矩阵]]` 被 [[concepts/GTD|GTD]] 引用，但尚未建页。
- `[[EAGLE]]`、`[[Diffusion LLM]]` 被 [[concepts/DFlash|DFlash]]、[[concepts/Speculative Decoding|Speculative Decoding]] 引用，但尚未建页。
- `[[NCCL]]`、`[[Ring All-Reduce]]` 被 [[concepts/All-Gather|All-Gather]] 引用，但尚未建页。
- `[[Backtracking]]` 被 [[concepts/Greedy Algorithm|Greedy Algorithm]]、[[concepts/Dynamic Programming|Dynamic Programming]] 引用，但尚未建页。
- `[[concepts/ANSI-C Quoting]]`、`[[concepts/Command Grouping]]` 被 [[concepts/Heredoc|Heredoc]] 引用，但尚未建页。
- `[[concepts/RLVR]]`、`[[concepts/Process Reward Model]]` 被 [[concepts/Test-Time Scaling|Test-Time Scaling]] 引用，但尚未建页。
