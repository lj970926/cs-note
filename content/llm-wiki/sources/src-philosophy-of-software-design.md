---
title: "src-philosophy-of-software-design"
description: "《A Philosophy of Software Design》读书笔记摘要"
date: 2026-07-25
tags: [source, book, software-design]
source_type: note
local_ref: "[[book-notes/A Philosophy of Software Design]]"
aliases: []
---

# src-philosophy-of-software-design

## One-line summary

[[entities/John Ousterhout|John Ousterhout]] 在《A Philosophy of Software Design》中提出：软件设计的核心敌人是复杂度，而对抗复杂度的关键是**信息隐藏**与**深模块（deep modules）**。

## Source

- Vault note: [[book-notes/A Philosophy of Software Design]]
- Book: *A Philosophy of Software Design* by John Ousterhout

## Key claims

1. 复杂度公式：$C = \sum_{p}{c_{p}t_{p}}$ —— 某部分的复杂度乘以开发者在该部分花费的时间。
2. Classitis：过度拆分小类会破坏深模块原则，增加依赖和使用难度。
3. 信息隐藏是降低复杂度的主要手段；信息泄漏会让用户被迫了解内部实现。
4. Temporal decomposition（按时间顺序拆分）容易导致信息泄漏，应按功能和知识划分模块。
5. 聚合相关能力到更大的类可以提升信息隐藏度，减少用户需要调用的接口数量。

## Linked pages

- [[entities/John Ousterhout|John Ousterhout]]
- [[concepts/Software Complexity|Software Complexity]]
- [[concepts/Information Hiding|Information Hiding]]
- [[concepts/Deep Module|Deep Module]]
