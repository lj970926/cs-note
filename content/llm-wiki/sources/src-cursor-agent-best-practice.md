---
title: "src-cursor-agent-best-practice"
description: "Cursor Agent Best Practice 笔记摘要"
date: 2026-07-25
tags: [source, cursor, ai-agent, best-practice]
source_type: note
local_ref: "[[AI-agent/Cursor Agent Best Practice]]"
aliases: []
---

# src-cursor-agent-best-practice

## One-line summary

[[entities/Cursor|Cursor]] 官方总结的 Agent 最佳实践：用 Plan Mode 先规划、保持上下文精简、动态迭代 Rules/Skills、用 TDD 给出可验证目标、云端 Agent 处理长任务。

## Source

- Vault note: [[AI-agent/Cursor Agent Best Practice]]
- Original web: https://cursor.com/cn/blog/agent-best-practices

## Key claims

1. 让 Agent 写代码前先用 Plan Mode 生成计划；复杂任务才需要详细计划，简单改动可直接交给 Agent。
2. 上下文质量比数量更重要：只引用确定相关的文件，不确定就让 Agent 自己搜索；对话过长时该开新 session。
3. Rules 应聚焦、少变、多用文件引用；只在 Agent 反复犯同样错误时才新增规则。Skills 按需加载，但 frontmatter 会进初始上下文，需保持精简。
4. TDD 是典型 AI 开发流程：先写测试→确认失败→写实现→跑测试→迭代，直到通过。
5. 云端 Agent 可在远程沙箱中持续工作，完成后打开 PR 并通知用户。
6. 最大化利用 Agent 的开发者：提示具体、配置迭代、认真 review、目标可验证、把 Agent 当作协作者。

## Linked pages

- [[entities/Cursor|Cursor]]
- [[concepts/AI Coding Agent|AI Coding Agent]]
- [[concepts/Plan Mode|Plan Mode]]
- [[concepts/Rules and Skills|Rules and Skills]]
