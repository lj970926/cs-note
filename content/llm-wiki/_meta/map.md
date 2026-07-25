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

- Sources: 12
- Entities: 10
- Concepts: 28
- Syntheses: 0
- Questions: 0
- Last updated: 2026-07-25

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

### Note
- [[sources/src-aba-problem|src-aba-problem]] — ABA 问题笔记
- [[sources/src-addresssanitizer-guide|src-addresssanitizer-guide]] — AddressSanitizer 使用指南
- [[sources/src-claude-code-loop-engineering|src-claude-code-loop-engineering]] — Claude Code Loop 工程笔记
- [[sources/src-cpp-forwarding-reference|src-cpp-forwarding-reference]] — C++ 转发引用与引用折叠笔记
- [[sources/src-cpp17-inline-static|src-cpp17-inline-static]] — C++17 inline static 笔记
- [[sources/src-compare-exchange-weak-strong|src-compare-exchange-weak-strong]] — compare_exchange_weak vs strong 笔记
- [[sources/src-cursor-agent-best-practice|src-cursor-agent-best-practice]] — Cursor Agent 最佳实践
- [[sources/src-hermes-gateway|src-hermes-gateway]] — Hermes Gateway 笔记
- [[sources/src-philosophy-of-software-design|src-philosophy-of-software-design]] — 《A Philosophy of Software Design》读书笔记
- [[sources/src-linux-multithreaded-server-programming|src-linux-multithreaded-server-programming]] — 《Linux 多线程服务端编程》读书笔记
- [[sources/src-practical-vim|src-practical-vim]] — 《Practical VIM》读书笔记
- [[sources/src-vim-basic-commands|src-vim-basic-commands]] — VIM 基础命令速查

## Entities

- [[entities/AddressSanitizer|AddressSanitizer]] — Clang/GCC 内置的内存错误检测工具（ASan）
- [[entities/Claude Code|Claude Code]] — Anthropic 出品的 AI 编程助手/CLI 工具
- [[entities/Cursor|Cursor]] — 集成 AI Agent 的代码编辑器
- [[entities/Drew Neil|Drew Neil]] — Vim 专家，《Practical VIM》作者
- [[entities/Hermes|Hermes]] — 多平台消息接入的 AI 消息框架
- [[entities/John Ousterhout|John Ousterhout]] — 斯坦福大学计算机科学教授，《A Philosophy of Software Design》作者
- [[entities/Karpathy|Karpathy]] — AI 研究员，LLM Wiki 理念的提出者
- [[entities/Linux 多线程服务端编程|Linux 多线程服务端编程]] — 陈硕关于 C++ 多线程服务端开发的著作
- [[entities/Vim|Vim]] — 高度可扩展的模态文本编辑器
- [[entities/陈硕|陈硕]] — C++ 程序员，《Linux 多线程服务端编程》作者

## Concepts

- [[concepts/ABA Problem|ABA Problem]] — CAS 无锁操作中值相同但状态已变的经典问题
- [[concepts/AI Coding Agent|AI Coding Agent]] — 能自主理解、修改、验证代码的 AI 智能体
- [[concepts/CAS|CAS]] — 比较并交换，实现无锁算法的核心原子原语
- [[concepts/Classitis|Classitis]] — 过度拆分小类导致模块变浅、依赖增加的反模式
- [[concepts/Deep Module|Deep Module]] — 接口简单但内部实现功能丰富的模块
- [[concepts/Forwarding Reference|Forwarding Reference]] — C++ 模板中既能接收左值又能接收右值的特殊引用
- [[concepts/Hazard Pointer|Hazard Pointer]] — 无锁数据结构中安全延迟回收内存的机制
- [[concepts/Information Hiding|Information Hiding]] — 将模块的实现细节封装起来，只暴露必要接口的设计原则
- [[concepts/Inline Variable|Inline Variable]] — C++17 引入的可在头文件中定义且不会引发重复定义的全局/静态变量
- [[concepts/LLM Wiki|LLM Wiki]] — LLM 维护的通用知识库模式
- [[concepts/Lock-Free Data Structure|Lock-Free Data Structure]] — 不依赖互斥锁，通过原子操作保证线程安全的数据结构
- [[concepts/Loop Engineering|Loop Engineering]] — 用循环驱动 LLM 持续工作的方法论
- [[concepts/Memory Order|Memory Order]] — 多线程程序中内存访问操作的可见性和排序规则
- [[concepts/Memory Safety|Memory Safety]] — 程序访问内存时不会出现越界、use-after-free 等未定义行为的性质
- [[concepts/Messaging Gateway|Messaging Gateway]] — 连接 AI 系统与外部消息平台的中间服务
- [[concepts/Object Lifetime Management|Object Lifetime Management]] — 在多线程环境下安全地创建和销毁对象的问题
- [[concepts/ODR|ODR]] — C++ 的 One Definition Rule，规定实体在整个程序中只能被定义一次
- [[concepts/Perfect Forwarding|Perfect Forwarding]] — 在函数模板中保持参数原始左值/右值属性传递给另一个函数
- [[concepts/Plan Mode|Plan Mode]] — 让 AI 在动手前先产出执行计划的模式
- [[concepts/RAG|RAG]] — 检索增强生成
- [[concepts/Reference Collapsing|Reference Collapsing]] — C++ 中多个引用限定符组合时折叠为单一引用类型的规则
- [[concepts/Rules and Skills|Rules and Skills]] — 给 AI Agent 的持久化约束与领域知识配置
- [[concepts/Sanitizer|Sanitizer]] — 编译器内置的动态程序正确性检测工具族
- [[concepts/Software Complexity|Software Complexity]] — 软件系统中让开发者难以理解和修改的累积负担
- [[concepts/Spin Lock|Spin Lock]] — 通过循环 CAS 操作忙等待获取的锁
- [[concepts/Thread Safety|Thread Safety]] — 多个线程访问共享资源时程序行为正确的性质
- [[concepts/Value Category|Value Category]] — C++ 中表达式的左值/右值分类
- [[concepts/Persistent wiki|Persistent wiki]] — 持久化、复利式积累的知识库

## Syntheses

_暂无_

## Questions

_暂无_

## Orphans & gaps

_暂无_
