---
title: Deep Module
description: 接口简单但内部实现功能丰富的模块
date: 2026-07-25
tags: [concept, software-design, modularity]
aliases: []
---

# Deep Module

## Definition

深模块（Deep Module）是 John Ousterhout 提出的模块设计理想：接口简单、小巧，但内部封装了大量功能和复杂实现。与之相对的是浅模块（Shallow Module）——接口复杂但功能单薄。

## Why it matters

深模块让普遍性使用场景变得简单：用户只需理解少量接口，却能获得强大能力。典型例子是 Unix 文件 IO（`open`/`read`/`write`/`close`），而 Java IO 为了扩展性拆出多个类，反而增加了使用复杂度。

## Connection to other concepts

- **Information hiding**：深模块是信息隐藏的成功形态。
- **Classitis**：过度拆分小类会产生大量浅模块，破坏深模块原则。
- **Software complexity**：浅模块和接口泛滥是复杂度的主要来源之一。

## Related concepts

- [[concepts/Software Complexity|Software Complexity]]
- [[concepts/Information Hiding|Information Hiding]]
- [[concepts/Classitis|Classitis]]

## Sources

- [[sources/src-philosophy-of-software-design|src-philosophy-of-software-design]]
