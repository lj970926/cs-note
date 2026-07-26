---
title: Quartz Mermaid 排错手册
description: Quartz v5 中 Mermaid 11.4.0 渲染失败的排查笔记摘要
source_type: note
local_ref: "[[language/mermaid/Quartz Mermaid 排错手册]]"
date: 2026-07-25
tags: [source, mermaid, quartz, debug]
aliases: []
---

# Quartz Mermaid 排错手册

> Source: [[language/mermaid/Quartz Mermaid 排错手册]]

## One-line summary

记录 Quartz v5 中 Mermaid 11.4.0 渲染失败（`Syntax error in text / mermaid version 11.4.0`）的排查流程、classDiagram 常见陷阱与 Quartz 侧注意事项。

## Key claims

- Mermaid 在 Quartz 中经过三层：Markdown 代码块 → HTML `<code class="mermaid">` → 浏览器 `mermaid.run()`。
- `mermaid.parse()` 通过不代表浏览器里 `mermaid.run()` 能成功，应以真实浏览器表现为准。
- classDiagram 常见坑：空 `{}`、自定义 stereotype、反向虚线实现箭头、复杂类型签名。
- 排查时应检查 Markdown 原文、抓完整 `Runtime.exceptionThrown`、验证 `svg[aria-roledescription=error]` 数量为 0。
- Quartz 侧应避免对已被渲染成 SVG 的节点重复调用 `mermaid.run()`。

## Related pages

- [[concepts/Mermaid|Mermaid]]
- [[sources/src-mermaid-guide|src-mermaid-guide]]
- [[language/mermaid/Mermaid 使用指南]]

## Reference

- [Mermaid Documentation](https://mermaid.js.org/)
- [Quartz Documentation](https://quartz.jzhao.xyz/)
