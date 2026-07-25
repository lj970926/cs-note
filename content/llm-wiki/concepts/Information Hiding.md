---
title: Information Hiding
description: 将模块的实现细节封装起来，只暴露必要接口的设计原则
date: 2026-07-25
tags: [concept, software-design, modularity]
aliases: []
---

# Information Hiding

## Definition

信息隐藏（Information Hiding）是软件设计的核心原则：模块应当把实现细节封装在内部，只暴露最小、最稳定、最必要的接口。这样调用者无需了解内部机制即可使用模块，从而降低系统整体复杂度。

## Relationship to complexity

- **Information leaking** 是信息隐藏的反面：当接口迫使调用者了解内部实现时，复杂度外溢。
- **Temporal decomposition** 常导致信息泄漏：按时间顺序拆分相关操作，会让多个模块共享本可隐藏的内部知识（如文件格式）。

## Practices

- 按功能和知识边界划分模块，而不是按执行顺序。
- 聚合相关能力到更大的类/模块，减少用户需要调用的接口数量。
- 让普遍性使用场景尽可能简单（例如 Unix `open`/`read`/`write` 对比 Java IO 的多个类）。

## Related concepts

- [[concepts/Software Complexity|Software Complexity]]
- [[concepts/Deep Module|Deep Module]]
- [[concepts/Classitis|Classitis]]

## Sources

- [[sources/src-philosophy-of-software-design|src-philosophy-of-software-design]]
