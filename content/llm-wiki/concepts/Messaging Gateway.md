---
title: Messaging Gateway
description: 连接 AI 系统与外部消息平台的中间服务
date: 2026-07-25
tags: [concept, messaging, gateway, ai-agent]
aliases: []
---

# Messaging Gateway

## Definition

Messaging Gateway 是连接 AI 系统与外部消息平台（微信、Telegram、Discord、Slack、WhatsApp、Email 等）的中间服务。它负责协议适配、消息收发和连接保活，使 AI Agent 能够以统一方式与用户在不同平台交互。

## Key concerns

- **平台适配**：不同平台协议不同（Bot API、long-polling、webhook 等）。
- **进程托管**：生产环境通常以后台服务运行（如 macOS 的 `launchd`、Linux 的 systemd）。
- **可用性**：依赖主机在线；机器休眠或关机时服务中断。
- **部署选择**：本地运行方便开发；长期稳定运行应部署到常在线服务器。

## Examples

- [[entities/Hermes|Hermes]] Gateway

## Related

- [[sources/src-hermes-gateway|src-hermes-gateway]]
- [[entities/Hermes|Hermes]]
