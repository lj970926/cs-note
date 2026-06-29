---
title: Hermes Gateway
aliases: []
tags:
  - hermes
  - gateway
  - messaging
  - ai-agent
created: 2026-06-29
---
# Hermes Gateway

## 1. Gateway 是什么

Hermes gateway 是负责连接外部消息平台的后台服务，可以接入：
- Weixin（微信 / iLink）
- Telegram
- Discord
- Slack
- WhatsApp
- Email
- 以及其他 Hermes 支持的平台

在 macOS 上，gateway 通常由 `launchd` 托管。

这意味着：
- 关掉当前 Hermes CLI 对话，gateway 一般还会继续运行
- 只要电脑没有休眠或关机，微信 channel 通常还能继续工作
- 如果电脑进入系统休眠，gateway 基本就不能继续处理消息

## 2. 睡眠与微信 channel

### 可以工作的情况
- 关闭当前终端对话
- 锁屏
- 仅显示器熄灭，但系统没有 sleep

### 大概率不能工作的情况
- Mac 进入系统休眠
- 合上 MacBook 盖子后进入睡眠
- 关机

原因：
- Weixin 适配器依赖 iLink Bot API
- Hermes 通过 long-polling 持续和平台通信
- 一旦机器 sleep，本机 Hermes/gateway 基本就停止运行，连接会中断

结论：
- 想让微信 channel 持续在线，关键不是“对话窗口开着”，而是“gateway 进程在线且机器没睡”

## 3. Gateway 常用管理命令

### 查看帮助
```bash
hermes gateway --help
```

### 前台运行（适合调试）
```bash
hermes gateway run
```

### 启动后台服务
```bash
hermes gateway start
```

### 停止后台服务
```bash
hermes gateway stop
```

### 重启后台服务
```bash
hermes gateway restart
```

### 查看状态
```bash
hermes gateway status
```

### 安装后台服务
```bash
hermes gateway install
```

### 卸载后台服务
```bash
hermes gateway uninstall
```

### 查看所有 profile 的 gateway 状态
```bash
hermes gateway list
```

### 配置消息平台
```bash
hermes gateway setup
```

### 清理旧版遗留服务定义
```bash
hermes gateway migrate-legacy
```

### 注册 relay connector
```bash
hermes gateway enroll
```

## 4. macOS 上推荐的使用方式

典型工作流：

### 第一次安装/配置
```bash
hermes gateway install
hermes gateway setup
hermes gateway start
```

### 日常查看状态
```bash
hermes gateway status
```

### 修改配置后重启
```bash
hermes gateway restart
```

### 如果服务定义和当前安装版本不一致
```bash
hermes gateway start
```

说明：
- `start` 不只是“启动”，也常用于刷新/重新注册当前安装对应的 service 定义

## 5. 实用判断

### 关掉当前 Hermes 对话后，微信还能不能收到消息？
通常可以，只要：
- gateway 还在运行
- 电脑没有 sleep

### 电脑休眠后还能不能收到？
通常不行。

### 想要更稳定怎么办？
有三种思路：
1. 插电时禁止系统休眠
2. 只允许显示器睡，不让系统睡
3. 把 Hermes/gateway 部署到一直在线的机器（VPS / 小主机 / 服务器）

## 6. 常用排查命令

### 看 gateway 状态
```bash
hermes gateway status
```

### 查看 Hermes 总状态
```bash
hermes status --all
```

## 7. 一句话总结

- 关掉当前聊天窗口，不等于 gateway 停止
- Mac 休眠，gateway 基本就停了
- 真正影响可用性的核心是：gateway 是否在线 + 机器是否在运行
