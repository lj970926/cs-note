---
title: LRU 抖动（LRU Thrashing）与 KV Cache
tags:
  - mlsys
  - inference
  - kv-cache
  - caching
aliases:
  - LRU thrashing
  - LRU 抖动
  - 缓存颠簸
created: 2026-09-16
---

# LRU 抖动（LRU Thrashing）与 KV Cache

> **LRU thrashing**：缓存放不下当前活跃工作集（working set）时，LRU 不断淘汰「马上又会访问」的数据；缓存持续换入换出，却几乎没有命中收益。

## 最小例子

缓存容量为 3，对象访问序列不断循环：

```text
A → B → C → D → A → B → C → D → ...
```

前三次访问后，缓存中有 `A B C`。之后每次访问的对象都恰好是最早进入、因而刚被 LRU 淘汰的那个：

```text
访问 D: 淘汰 A，缓存 [B C D]
访问 A: 淘汰 B，缓存 [C D A]
访问 B: 淘汰 C，缓存 [D A B]
访问 C: 淘汰 D，缓存 [A B C]
```

因此循环稳定后：

```text
hit rate     ≈ 0
eviction rate 很高
cache churn  很严重
```

关键不在于缓存是否「看起来很大」，而在于它是否能容纳访问模式的活跃工作集：

```text
Working Set Size > Cache Capacity
```

特别是工作集只略大于缓存、访问又近似均匀循环时，LRU 的退化会十分陡峭。例如容量为 100 GB、活跃工作集为 105 GB，若持续顺序循环访问这 105 GB，缓存占工作集约 95% 也不代表命中率约为 95%；每一项仍可能在下一轮访问前恰好被淘汰。

## 映射到 LLM 的 KV Cache

假设 GPU KV Cache 最多保留 100 个 session，但系统有 120 个持续活跃的长对话，且请求均匀轮转：

```text
S1 → S2 → ... → S120 → S1 → S2 → ...
```

若用简单 LRU 管理已释放但可复用的 session / prefix KV：

```text
S101 到来
  → 淘汰 S1 的 KV

下一轮 S1 到来
  → KV miss，需要重新 prefill
  → 为 S1 腾位置，又淘汰另一个很快会被访问的 session
```

于是形成反馈环：

```text
evict KV → prefill/recompute → 占用 KV → evict 其他 KV → ...
```

这就是 **KV Cache thrashing**。它不仅意味着命中率下降，还把原先可以复用的计算转回 prefill，并可能进一步放大 GPU 计算、PCIe / 网络传输及调度压力。与 [[source-code/vllm/vllm 源码随手记]] 中的 `BlockPool`、prefix-cache block 复用相对应：被驱逐的 cached block 不再能为后续请求提供命中。

> [!warning] 容量跨过工作集临界点时，性能可能非线性退化
>
> 缓存从「恰好能装下 120 个活跃 session」变成「只能装下 119 个」，容量本身只少了一点；但对于均匀轮转的请求，这一点足以从高复用状态切到反复驱逐/重算状态。因此 TTFT、prefill 计算量、传输流量和吞吐都可能出现悬崖式变化。

## 观察信号

- cache hit rate 持续下降，接近 0；
- eviction / swap / reload 频率显著上升；
- prefill token 数与 prefill compute 增加，而 decode 业务量未相应增长；
- TTFT 变长、尾延迟恶化、吞吐下降；
- 使用分层 KV cache 时，GPU ↔ CPU、SSD 或远端缓存的传输流量上升。

这些指标应结合活跃工作集和访问分布解读：随机或高度倾斜的访问仍可能让 LRU 工作良好；最危险的是容量略小于工作集且访问近似均匀轮转的模式。

## 缓解方向

1. **增大有效缓存容量**：让 hot working set 尽可能完整地驻留。
2. **改善时间局部性**：调度时连续处理同一 session、共享 prefix 或同一租户的请求，避免严格 round-robin。
3. **分层缓存**：GPU miss 后可从 CPU、SSD 或远端 KV 恢复，而不必完整 recompute；[[MLSys/NIXL]] 所处理的推理 KV / 权重传输就是这类系统能力的基础之一。
4. **使用成本感知的驱逐策略**：除 recency 外，考虑访问频率、KV 大小、恢复成本、剩余 TTL 或 session 优先级。
5. **admission control**：不让短暂、低复用价值的内容挤占高价值的热 KV。
6. **session affinity / sticky routing**：多实例场景中让同一 session 尽量回到原实例，避免跨实例导致的冷启动与重复缓存。

## 一句话

> **LRU thrashing = 工作集放不下时，LRU 反复淘汰下一刻又要使用的数据；缓存忙于换入换出，命中却几乎没有收益。**

## 相关笔记

- [[source-code/vllm/vllm 源码随手记]]：vLLM 的 KV Cache 架构、BlockPool 与 prefix cache。
- [[source-code/vllm/DeepSeekV4 KV Cache 管理]]：vLLM 中 DeepSeek-V4 的 KV Cache 分组、布局和分配。
- [[MLSys/NIXL]]：推理场景的 KV / 权重传输库。
