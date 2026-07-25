---
title: "src-hermes-gateway"
description: "Hermes Gateway 笔记摘要"
date: 2026-07-25
tags: [source, hermes, gateway, messaging, ai-agent]
source_type: note
local_ref: "[[AI-agent/hermes/Hermes Gateway]]"
aliases: []
---

# src-hermes-gateway

## One-line summary

[[entities/Hermes|Hermes]] Gateway 是连接外部消息平台的后台服务，由 `launchd` 托管，核心可用性取决于 gateway 进程在线且机器不休眠。

## Source

- Vault note: [[AI-agent/hermes/Hermes Gateway]]

## Key claims

1. Gateway 负责接入微信、Telegram、Discord、Slack、WhatsApp、Email 等平台。
2. macOS 上通常由 `launchd` 托管，关闭 Hermes CLI 对话后 gateway 仍可继续运行。
3. 机器休眠（合盖、关机）会导致 gateway 停止，微信 channel 离线。
4. 常用命令：`install` / `setup` / `start` / `restart` / `status` / `stop` / `run`。
5. 提高稳定性思路：禁止休眠、仅显示器睡眠、或部署到常在线机器。

## Linked pages

- [[entities/Hermes|Hermes]]
- [[concepts/Messaging Gateway|Messaging Gateway]]
