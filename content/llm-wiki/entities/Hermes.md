---
title: Hermes
description: 一个支持多平台消息接入的 AI 消息框架/工具
date: 2026-07-25
tags: [entity, project, messaging, ai-agent]
aliases: []
---

# Hermes

## Definition

Hermes 是一个支持多平台消息接入的 AI 消息框架或工具，通过 Gateway 组件连接微信、Telegram、Discord、Slack、WhatsApp、Email 等外部消息平台，使 AI Agent 能够收发消息。

## Known components

| 组件 | 说明 |
|---|---|
| Hermes Gateway | 连接外部消息平台的后台服务，由 `launchd` 在 macOS 上托管 |
| Weixin adapter | 基于 iLink Bot API 的微信接入适配器 |

## Related

- [[sources/src-hermes-gateway|src-hermes-gateway]]
- [[concepts/Messaging Gateway|Messaging Gateway]]
