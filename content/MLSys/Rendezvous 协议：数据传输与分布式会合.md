---
title: Rendezvous 协议：数据传输与分布式会合
tags:
  - mlsys
  - distributed
  - communication
aliases:
  - Rendezvous 协议
  - 会合协议
created: 2026-10-15
---

# Rendezvous 协议：数据传输与分布式会合

Rendezvous 意为“会合”。共同思想是：**先让参与双方或多方协调好，再开始后续操作。** 在 MPI / UCX 中，它通常指数据传输协议；在 PyTorch / torchrun 中，它通常指分布式任务启动时的会合机制。

## MPI / UCX：先握手，再传主体数据

假设进程 A 要给 B 发送一个 100 MB 的张量。典型的发送方推送流程可以示意为：

```text
发送方 A                         接收方 B
   │ ── 我要发 100 MB（RTS）──────→ │
   │                               │ 匹配接收请求、准备接收缓冲区
   │ ←── 准备好了（CTS / RTR）───── │
   │ ═══════ 传输实际数据 ════════→ │
```

RTS 通常指 Request To Send；CTS / RTR 表示允许发送或已准备接收。报文名称和具体步骤取决于实现。

关键是：**先交换少量控制信息，接收请求匹配后才传主体数据**，避免大消息先到达后还需要临时存放、再搬到最终接收缓冲区。[UCX 官方说明](https://openucx.github.io/ucx/api/latest/html/group___u_c_t___t_a_g.html)

> [!note] 示意图不是所有实现的固定流程
> 也可以由接收方通过 RDMA Read 拉取数据。Rendezvous 描述协调方式，RDMA 描述数据搬运机制，两者可以组合；不能把 Rendezvous 简单等同于某一种 RDMA 操作。

### 与 Eager 的区别

| 对比项 | Eager | Rendezvous |
| --- | --- | --- |
| 基本做法 | 不等待匹配接收请求，直接发送主体数据 | 先协调接收，再传主体数据 |
| 接收请求尚未准备好 | 可能需要临时缓冲 | 主体数据暂不发送 |
| 主要取舍 | 减少握手等待，但可能增加缓冲和拷贝 | 增加协调开销，但有利于直接传入接收缓冲区 |
| 常见适用范围 | 小消息 | 大消息 |

类比：Eager 是“直接把快递寄过去”；Rendezvous 是“先电话确认你能收这件大件，再安排运输”。

结合 [[通信时间的组成与 α-β 模型]] 理解：小消息对固定开销敏感，额外握手可能得不偿失；大消息的缓冲和搬运成本更突出，先协调更可能划算。**具体切换阈值取决于实现、硬件和传输路径，不存在统一的消息大小界线。**

## PyTorch / torchrun：先把参与者集合起来

如果看到 `rdzv_backend`、`rdzv_endpoint` 等名称，这里的 Rendezvous 指任务启动或恢复时的协调，主要解决：

- 谁参与本次任务，以及每个参与者的 rank。
- 大家对成员集合达成一致，并共同决定何时开始或恢复。
- 提供共享 Store，交换后续初始化需要的信息。

PyTorch Elastic 还支持在节点故障、成员变化后重新会合。因此，它包含成员发现、一致性和同步等职责，不能只理解成一次普通 barrier。[PyTorch 官方说明](https://docs.pytorch.org/docs/stable/elastic/rendezvous.html)

这里的会合服务负责组织任务；训练张量的后续通信由初始化后的通信后端承担。

## 如何从上下文判断

- 和 **Eager、消息大小、接收缓冲区、RDMA** 一起出现：通常是数据传输协议。
- 和 **torchrun、rdzv、任务成员、rank** 一起出现：通常是分布式启动协调。

两者共享“先协调”的思想，但协调的对象不同：前者围绕一次消息传输，后者围绕一次任务的参与成员。

## 参考

- [UCX — UCT Tag matching operations](https://openucx.github.io/ucx/api/latest/html/group___u_c_t___t_a_g.html)
- [PyTorch — Rendezvous](https://docs.pytorch.org/docs/stable/elastic/rendezvous.html)
