---
title: Software Complexity
description: 软件系统中让开发者难以理解和修改的累积负担
date: 2026-07-25
tags: [concept, software-design, complexity]
aliases: []
---

# Software Complexity

## Definition

软件复杂度是软件系统中使开发者难以理解、修改和维护的累积负担。John Ousterhout 在《A Philosophy of Software Design》中给出公式：

$$C = \sum_{p}{c_{p}t_{p}}$$

其中 $c_p$ 是某部分的复杂度，$t_p$ 是开发者在该部分花费的时间。

## Symptoms and causes

- **Classitis**：过度追求小类，导致接口和依赖激增，破坏信息隐藏。
- **Information leaking**：模块暴露内部实现细节，迫使调用者了解不该了解的知识。
- **Temporal decomposition**：按事件发生的先后顺序拆分模块，而非按功能和知识边界拆分，导致相关逻辑分散。

## Mitigation

- **Information hiding**：把实现细节藏在模块内部，暴露最小、最稳定的接口。
- **Deep modules**：小接口背后封装大量功能和复杂实现，降低用户认知负担。
- **按功能/知识划分模块**，而非按时间顺序。

## Related concepts

- [[concepts/Information Hiding|Information Hiding]]
- [[concepts/Deep Module|Deep Module]]
- [[concepts/Classitis|Classitis]]

## Sources

- [[sources/src-philosophy-of-software-design|src-philosophy-of-software-design]]
