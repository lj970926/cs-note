---
title: Classitis
description: 过度拆分小类导致模块变浅、依赖增加的反模式
date: 2026-07-25
tags: [concept, software-design, anti-pattern]
aliases: []
---

# Classitis

## Definition

Classitis 是 John Ousterhout 在《A Philosophy of Software Design》中提出的反模式：过度追求“类应该小”，导致大量浅模块彼此依赖，反而增加系统复杂度。典型例子是 Java IO：顺序读取文件需要创建多个互相嵌套的类，而 Unix IO 只需一个文件描述符。

## Why it increases complexity

- 每个小类都引入新的接口和依赖。
- 用户需要了解多个类如何组合才能完成一个常见任务。
- 信息隐藏被破坏，实现细节泄漏到类之间的接口中。

## Better approach

- 按功能和知识边界聚合相关能力。
- 追求 **Deep Module**：接口简单、内部功能丰富。
- 让普遍性使用场景尽可能简单。

## Related concepts

- [[concepts/Deep Module|Deep Module]]
- [[concepts/Software Complexity|Software Complexity]]
- [[concepts/Information Hiding|Information Hiding]]

## Sources

- [[sources/src-philosophy-of-software-design|src-philosophy-of-software-design]]
