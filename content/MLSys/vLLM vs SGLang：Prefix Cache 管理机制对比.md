---
title: "vLLM vs SGLang：Prefix Cache 管理机制对比"
tags:
  - mlsys
  - inference
  - kv-cache
  - prefix-caching
aliases:
  - vLLM 与 SGLang Prefix Cache 对比
  - Hash-based APC vs RadixAttention
  - Radix Tree
  - 基数树
created: 2026-11-13
description: 从压缩 Trie 的最长前缀匹配出发，对比 vLLM 的链式 Block Hash 与 SGLang 的 Radix Cache，记录命中粒度、淘汰、调度和压测口径。
---

# vLLM vs SGLang：Prefix Cache 管理机制对比

> [!abstract] 两种缓存索引
> vLLM 用父块哈希和当前块的 token 标识 KV Block，便于按块管理分配与回收。SGLang 用 Radix Tree 显式表示共享前缀和分支，便于按路径做匹配、引用保护和淘汰。两者都能跳过公共前缀的重复 prefill。端到端收益还取决于有效命中长度、KV 保留时间、数据搬运和调度开销。

## 1. Radix Tree 如何压缩 Trie

Trie 从根开始逐字符走边。以 `apple`、`application`、`apply` 为例，三个单词共享 `appl`，从下一个字符开始分叉。压缩 Trie 把中间没有分叉、也没有完整 key 结束的连续路径合成一条边。

```text
普通 Trie                     压缩后的 Radix Tree
root                          root
 └─ a                          └─ appl
    └─ p                          ├─ e*
       └─ p                       ├─ ication*
          └─ l                    └─ y*
             ├─ e*
             ├─ i─c─a─t─i─o─n*
             └─ y*

* 表示完整 key 的终点
```

若再插入 `app`，就将 `appl` 拆为 `app` 和 `l`，并在 `app` 的终点加上标记。若查询 `apples`，完整 key 查找会失败，但最长已存 key 前缀是 `apple`。若查询 `applaud`，能共享的路径前缀是 `appl`。在缓存里，路径前缀可以直接对应可复用的状态，即使该处没有完整请求结束。

在子边选择为常数开销的常见实现下，长度为 $L$ 的 key 在两种树上都需要至多 $O(L)$ 的字符或 token 比较。压缩主要减少节点数、指针跳转和树深度。哈希表的平均 $O(1)$ 通常指哈希值已取得后的查表次数。计算变长 key 的哈希、检查多个连续前缀块都另有成本。

## 2. SGLang 如何复用前缀 KV

对因果注意力，在模型、位置和输入计算条件一致时，同一段 token 前缀可以共享已计算的 KV。RadixAttention 把 token ID 序列组织成压缩树，路径片段关联 KV pool 中的位置。下图假设按 token 匹配，三个请求分别为 `[A B C D E]`、`[A B C D F]` 和 `[A B C G H]`。

```text
root
 └─ [A B C]
    ├─ [D]
    │  ├─ [E]
    │  └─ [F]
    └─ [G H]
```

新请求 `[A B C D X]` 沿 `[A B C]`、`[D]` 命中四个 token。若这四个 token 的 KV 都可用，prefill 只需为后缀 `[X]` 执行前向计算，`X` 仍会对已缓存的前缀做 attention。插入或匹配发生在压缩边中间时，可以把该边拆开并保留已有 KV 的索引。[SGLang 论文 §3](https://arxiv.org/html/2312.07104v2#S3) · [SGLang RadixCache 源码](https://github.com/sgl-project/sglang/blob/main/python/sglang/srt/mem_cache/radix_cache.py)

## 3. vLLM 如何用 Block Hash 表示同一前缀

以每块四个 token 为例，两个请求共用前八个 token，第三块各自分叉。

```text
H1  = hash(root, [A B C D], extra)
H2  = hash(H1,   [E F G H], extra)
H3a = hash(H2,   [I J K L], extra)
H3b = hash(H2,   [M N O P], extra)
```

父块哈希递归编码此前的 token。即使当前块的 token 完全相同，上游前缀不同也会产生不同的缓存键。额外信息可包含 LoRA、多模态输入的标识以及用于隔离共享范围的 `cache_salt`。查找沿连续的块哈希进行，缓存表把哈希映射到物理 KV Block。块池维护块 ID、引用计数和空闲队列，引用归零的块可以留在缓存里，直到其存储被重新分配。[vLLM APC 设计](https://docs.vllm.ai/en/latest/design/prefix_caching/)

## 4. 各自的优势和代价

| 维度 | vLLM · Hash-based APC | SGLang · Radix Cache |
| --- | --- | --- |
| 前缀关系 | 编码在父块哈希链中 | 显式表示为共享路径和分支 |
| 存储管理 | 查找与块池的分配、引用计数、回收自然衔接 | 树维护逻辑前缀，节点持有 KV pool 的索引与状态 |
| 匹配粒度 | 取决于匹配单元和实际保存的状态 | 常见 token-key 路径按 `page_size` 对齐 |
| 主要开销 | 计算块哈希、查询索引、维护块状态 | 比较 token 片段、遍历或拆分节点、更新引用状态 |

### 命中粒度

若两个请求共享 103 个 token，且都有未命中的后缀，按 16 token 完整块匹配的配置最多复用 `floor(103/16) × 16 = 96` 个 token。SGLang 普通 token-key RadixCache 在 `page_size=1` 且 KV 均可用时可匹配 103 个。更大的 page 同样会舍弃未对齐的尾部。

vLLM 文档中的 `prefix_match_unit` 可比物理块更细，前提是满足各 KV cache group 的块大小等约束。匹配边界和状态保存频率是两回事。另一个独立限制是整个 prompt 都命中时，KV cache 通常还需要留下末尾位置的前向计算，以得到首个输出 token 的 logits。[vLLM 匹配粒度配置](https://docs.vllm.ai/en/latest/features/automatic_prefix_caching/) · [SGLang RadixCache 源码](https://github.com/sgl-project/sglang/blob/main/python/sglang/srt/mem_cache/radix_cache.py) · [[source-code/vllm/vllm 源码随手记#Prefix cache 全命中时仍要重算最后一个 token]]

### 淘汰与调度

- **SGLang** 从可淘汰叶子中按策略选候选。正在使用的路径受引用保护，叶子移除后父节点可能进入候选集。这个结构适合从分支末尾向公共前缀回收，并允许在候选叶子上用 LRU、LFU 或优先级等策略。调度侧启用 LPM（Longest Prefix Match）时，等待请求可以按缓存匹配长度排序。[SGLang 淘汰策略](https://github.com/sgl-project/sglang/blob/main/docs/docs/advanced_features/radix_eviction_policy.mdx) · [SGLang 调度实现](https://github.com/sgl-project/sglang/blob/main/python/sglang/srt/managers/schedule_policy.py)
- **vLLM** 用引用计数保护在用块，并按空闲队列回收。一次释放中，靠后的块可先入队，因而比同次释放的前缀块更早被回收。vLLM 的早期设计文档还指出，在 full attention 和其文中规则下，按零引用、LRU、同时间优先长前缀处理，可得到与 RadixAttention 相同的淘汰顺序。调度侧也有可选的 cache-aware admission，可在等待队列的限定窗口内优先接纳有缓存的请求。[vLLM V1 APC 设计](https://docs.vllm.ai/en/latest/design/prefix_caching/#free) · [vLLM 早期 APC 设计](https://docs.vllm.ai/en/v0.9.0/design/automatic_prefix_caching.html) · [vLLM 调度配置](https://docs.vllm.ai/en/latest/api/vllm/config/scheduler/#vllm.config.scheduler.SchedulerConfig.cache_aware_admission_window)

## 5. 怎么压测这两个方案

| 请求分布 | 值得验证的假设 |
| --- | --- |
| 随机请求，复用率很低 | 块索引和压缩树的 CPU 查找、插入与回收成本差多少 |
| 长固定 system prompt，短差异后缀 | 两边能复用多少 token，匹配边界会损失多少尾部复用 |
| 多轮 Agent，带分支和轮间等待 | 会话历史的 KV 能保留多久，分支后缀是否频繁重算 |
| KV 容量紧张，有多个热点前缀 | 淘汰或调度策略能否减少热点重算和 TTFT 尾延迟 |

固定模型、tokenizer、请求顺序、并发和有效 KV 容量，记录实际 block、匹配单元和 page size。分开测冷启动、热缓存和高缓存压力。多级缓存还要区分 GPU 驻留命中与需要回迁的命中。

同时看每请求实际复用的 token 数、淘汰后的重算量、缓存管理 CPU 时间、调度排队时间、TTFT P50/P95/P99 和吞吐。高命中可能省下 prefill，也可能被回迁或排队成本抵消。对独立请求，块管理是否更轻量值得测量。对多轮 Agent，重点是显式前缀路径能否让需要的 KV 留到下一轮，并在高缓存压力下改善尾延迟。

相关笔记：[[paper/SGLang Efficient Execution of Structured Language Model Programs|SGLang 论文]] · [[source-code/vllm/vllm 源码随手记|vLLM 源码随手记]] · [[MLSys/LRU 抖动（LRU Thrashing）与 KV Cache|LRU 抖动与 KV Cache]] · [[MLSys/压测工具/AIPerf：压测 LLM Serving 与多轮数据集|AIPerf 多轮压测]]
