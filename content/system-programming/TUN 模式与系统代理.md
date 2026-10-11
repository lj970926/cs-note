---
title: TUN 模式与系统代理
tags:
  - networking
  - proxy
  - system-programming
aliases:
  - TUN 模式
created: 2026-10-11
description: 用虚拟网卡理解 TUN 模式，并区分流量接管方式与规则、全局代理策略。
---

# TUN 模式与系统代理

## TUN 是什么

在 Clash / Mihomo 等代理客户端中，**TUN 模式通过虚拟网卡接收系统路由过来的 IP 数据包，再交给代理软件处理**。应用不需要主动配置 HTTP / SOCKS 代理。

TUN 是网络层（三层）虚拟接口，读写的是 **IP 数据包**；与它常一起出现的 TAP 是二层虚拟接口，读写的是以太网帧。虚拟接口把内核网络栈与用户态程序连接起来：内核发往接口的数据包可以由程序读取，程序也可以向接口写入接收到的数据包。[Linux 内核文档](https://docs.kernel.org/networking/tuntap.html)

## 与系统代理的区别

“系统代理”通常是在操作系统中设置 HTTP / HTTPS / SOCKS 代理地址。应用需要读取并遵守这些设置；部分程序有自己的代理配置，部分程序直接连接目标地址。

```text
系统代理：应用 → 遵守代理设置 → 代理软件 → 目标服务

TUN 模式：应用 → 系统网络栈 → 路由到虚拟网卡 → 代理软件
                                                    ├→ 直连目标服务
                                                    └→ 代理节点 → 目标服务
```

| 对比项 | 系统代理 | TUN 模式 |
| --- | --- | --- |
| 流量如何进入代理软件 | 应用主动连接代理地址 | 系统将 IP 包路由到虚拟网卡 |
| 应用需要支持代理吗 | 需要支持相应代理设置或协议 | 无需主动使用 HTTP / SOCKS 代理 |
| 接管范围 | 遵守代理设置的应用流量 | 被路由到 TUN 的流量 |

例如，浏览器可能遵守系统代理，但某个命令行工具或游戏直接联网。将相关流量路由到 TUN 后，代理软件就可以接管这些流量。是否覆盖具体应用、TCP / UDP 或 IPv6，仍取决于客户端、路由和协议配置。

Mihomo 的 `auto-route` 可以自动设置路由，将流量导向 TUN；也可以配置路由排除范围。因此，**仅创建一张 TUN 网卡，并不会自动接管所有流量**。[Mihomo TUN 文档](https://wiki.metacubex.one/en/config/inbound/tun/)

## TUN 不等于全局代理

这是两个不同维度：

- **TUN / 系统代理**：流量如何进入代理软件。
- **规则 / 全局模式**：流量进入代理软件后，如何选择出口。

> [!important]
> 开启 TUN，也可以继续使用规则模式：例如国内网站直连，其他网站按规则走代理节点。流量经过代理软件处理，不代表一定经过远端代理节点。

## 与 SSH 动态转发的联系

[[SSH 端口转发#动态(SOCKS)端口转发]] 中的 `ssh -D` 会创建一个 SOCKS 代理端口，应用需要通过 SOCKS 协议使用它。它本身不会创建 TUN 网卡，也不会自动接管系统的 IP 流量。两者分别体现了“应用主动使用代理”和“系统通过虚拟网卡导入流量”的区别。

## 参考资料

- [Linux 内核：Universal TUN/TAP device driver](https://docs.kernel.org/networking/tuntap.html)
- [Mihomo：TUN 入站配置](https://wiki.metacubex.one/en/config/inbound/tun/)
