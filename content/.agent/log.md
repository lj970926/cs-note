---
title: Agent Log
tags:
  - agent
  - meta
  - log
draft: true
created: 2026-08-11
---

# Agent Log —— 时间线

> 追加式（append-only）日志，记录 Agent 对笔记库的操作。
> 只在用户明确要求记录后才新增条目；不要改写历史记录。

| 前缀 | 含义 |
|------|------|
| `ingest` | 收录外部资料（文章/论文/网页），整理成笔记 |
| `note` | 新建一篇笔记 |
| `update` | 更新已有笔记 |
| `query` | 一次值得留痕的查询/综合（可选） |
| `lint` | 健康检查（查死链、孤儿页、矛盾等） |
| `init` | 结构/约定变更 |

> 最近 5 条：`grep "^## \[" log.md | tail -5`

---

## [2026-08-11] init | 建立 Agent 工作目录与索引

- 新增 `content/AGENTS.md`、`content/CLAUDE.md`，规定回答前先检索笔记、仅在用户明确要求时写笔记。
- 新增 `.agent/index.md`（导航目录，按主题收录全部已发布笔记的一行摘要）与本日志。
- `quartz.config.yaml` 的 `ignorePatterns` 加入 `.agent`、`AGENTS.md`、`CLAUDE.md`，移除已失效的 `llm-wiki`。
- `scripts/prepare-new-content-notes.mjs` 同步忽略这些路径，避免把 Agent 工作文件当作新笔记检查。

## [2026-08-11] update | 补充 MoE 量化粒度

- 在 [[MLSys/Model Quantization]] 的"KV Cache 量化"前新增 `MoE 量化的粒度：per-(expert, channel/block)` 小节：per-channel-per-expert 的 scale 形状 `[E, out_features]`、FP8 MoE 的 128×128 block quant、激活用 per-token-per-expert。

## [2026-08-11] note | 算法导论 (CLRS) 阅读路线

- 新增 [[book-notes/算法导论 (CLRS) 阅读路线]]：把 CLRS 35 章按"地基(Ch1–5) → 核心(Ch6–16) → 进阶图算法(Ch21–26) → 选读(Ch18–20,27–35)"四阶段组织，附阅读建议和与 LeetCode 的配合策略。
- 同步更新 `.agent/index.md` 的 book-notes 条目。

## [2026-08-12] note | DeepEP normal dispatch 各 rank 不同 token 数

- 新增 [[MLSys/DeepEP normal dispatch 各 rank 不同 token 数]]：normal(高吞吐) dispatch/combine 天然支持各 rank 不同 token 数，靠 count all-to-all/notify 协商收发布局；`num_tokens_per_rank` 等是可选预计算元信息而非等长约束；等长只在叠加 CUDA Graph 时由上层 padding 强加。
- 区分 V1 `Buffer` 与 V2 `ElasticBuffer`，并链接到 [[vLLM DP 协调、CUDA Graph 与 DeepEP Low Latency]] 说明 LL 路径的固定容量协议差异。
- 同步更新 `.agent/index.md` 的 MLSys 条目。

## [2026-08-13] note | 双调排序 (Bitonic Sort)

- 新增 [[MLSys/算子/双调排序 (Bitonic Sort)]]：整理双调序列、双调合并、伪代码、复杂度及其适合 GPU 并行执行的原因。
- 补充它与 [[top_k_top_p sampling]] 中小规模候选集排序/选择的联系，并说明 Top-k 不一定需要完整排序。
- 同步更新 `.agent/index.md` 的 MLSys 条目。

## [2026-08-13] note | Warp Shuffle

- 新增 [[MLSys/算子/Warp Shuffle]]：整理 CUDA warp 内寄存器交换机制、四类 shuffle intrinsic、warp reduce 与蝶形通信。
- 重点记录参与 mask、部分 warp、分支发散、无效来源 lane 以及 `_sync` 不等于内存屏障等易错点。
- 补充 `__shfl_xor_sync` 与 [[双调排序 (Bitonic Sort)]] 比较伙伴选择的联系，并同步更新 `.agent/index.md`。

## [2026-08-14] note | DeepSeek Harness 四种 Agent 模式

- 新增 [[AI-agent/DeepSeek Harness/DeepSeek Harness 四种 Agent 模式]]：整理标准、PTC、极简、创造四个内置 agent preset 的能力差异、Cordis/preset 机制与选型建议。
- 说明 PTC 是 Programmatic Tool Calling：通过 Code Mode SDK / TypeScript 程序组合多步工具调用。
- 同步更新 `.agent/index.md` 的 AI-agent 条目。

## [2026-08-14] note | vLLM Quantization Config、Method 与 Scheme

- 新增 [[source-code/vllm/vLLM Quantization Config、Method 与 Scheme]]：梳理 `QuantizationConfig → QuantizeMethodBase` 的通用主干，以及权重创建、加载后处理和 forward 生命周期。
- 说明 `Scheme` 不是所有量化后端共有的抽象，而是 compressed-tensors 为复用 Method 外壳、拆分具体 W/A 组合而设置的内部策略层；同时区分声明式 `QuantizationArgs` 与执行实现。
- 同步更新 `.agent/index.md` 的 source-code/vllm 条目。

## [2026-08-14] note | DSH 插件系统

- 新增 [[AI-agent/DeepSeek Harness/DSH 插件系统]]：基于本机 `@deepseek-ai/dsh@0.1.0-rc.6` npm 包探索整理。
- 覆盖 Cordis 基础概念、profile/bundle/patch 三层叠加、dual-face 插件（Node 半 `exports["."]` + Client 半 `exports["./client"]`）、`dsh.client` 字段约定、`window.__ModuleLoader__` factory-form CJS 模块表、client UI slot 系统、HMR 流程与触发条件。
- 给出第三方 client-only 插件骨架与 `dsh plugin --profile web add` 启用方式，并列了关键源码文件速查表。
- 在 [[DeepSeek Harness 四种 Agent 模式]] 的延伸阅读里加上互链；同步更新 `.agent/index.md`。

## [2026-08-14] update | DeepSeek Harness 内容归档

- 将 [[AI-agent/DeepSeek Harness/DeepSeek Harness 四种 Agent 模式]] 与 [[AI-agent/DeepSeek Harness/DSH 插件系统]] 迁入 `AI-agent/DeepSeek Harness/` 独立目录，便于后续集中收录 DSH 相关笔记。
- 同步更新 `.agent/index.md` 中的导航路径。

## [2026-08-14] note | PyTorch Dispatcher 机制

- 新增 [[source-code/Pytorch/PyTorch Dispatcher 机制]]：以 `torch.add` 和自定义 `mylib::scaled_add` 为主线，梳理 operator schema、DispatchKeySet、优先级选择与 redispatch 调用链。
- 补充 CPU/CUDA/Meta/Composite 注册、C++ `TORCH_LIBRARY_IMPL`、fallback/fallthrough、boxed/unboxed、`TorchDispatchMode`、`__torch_dispatch__` 及 Dispatcher 与 DispatchStub 的区别。
- 同步更新 `.agent/index.md` 的 source-code/Pytorch 条目。

## [2026-08-15] note | 单调栈

- 新增 [[算法/单调栈]]：整理单调栈的适用题型、识别特征、单调性维护、常用 C++ 模板，以及它与单调队列、堆、区间数据结构的区别。
- 同步更新 `.agent/index.md` 的算法条目。

## [2026-08-15] update | 算法目录

- 新建 `算法/` 目录，将 [[算法/单调栈]] 作为算法与数据结构笔记的归档位置。
- 删除旧路径的迁移提示文件，[[算法/单调栈]] 作为唯一正文。

## [2026-08-15] note | Python __new__ 方法

- 新增 [[language/Python/Python __new__ 方法]]：说明 `__new__` 创建实例、`__init__` 初始化实例的调用顺序，以及 `__new__` 返回非本类实例时 `__init__` 不执行的规则。
- 补充不可变内置类型子类和单例/实例复用两类使用场景，并链接到 [[Python dict key：__hash__与 __eq__]]。
- 同步更新 `.agent/index.md` 的 Python 条目。

## [2026-08-17] note | 一行执行多个命令

- 新增 [[language/shellscript/一行执行多个命令]]：整理 `;`、`&&`、`||`、`&`、`|` 等命令连接符的语义，以及 `{}` 与 `()` 分组的区别。
- 链接到 [[shell expansion]]，并同步更新 `.agent/index.md` 的 shell 条目。

## [2026-08-17] note | Programming Massively Parallel Processors 第一章

- 新增 [[book-notes/Programming Massively Parallel Processors/Chapter 1 Introduction]]：整理 CPU multicore 与 GPU many-core 的设计取舍、典型 CUDA GPU 架构、GPU 适用场景、Amdahl 定律、内存带宽瓶颈、CPU/GPU 异构协作，以及 MPI/OpenMP/CUDA/OpenCL 的定位。
- 标注 G80/GT200 数字为历史背景，并链接到 [[MLSys/算子/Warp Shuffle]] 与 [[MLSys/CUDA Graph]] 作为后续延伸阅读。
- 同步更新 `.agent/index.md` 的 book-notes 条目。

## [2026-08-17] update | Programming Massively Parallel Processors 第一章：SP 与 warp

- 在 [[book-notes/Programming Massively Parallel Processors/Chapter 1 Introduction]] 的 GPU 架构小节补充 SP、thread、warp、lane 的层次关系。
- 说明 G80/GT200 中 8 SP 与 32-thread warp 的关系、warp 调度和 latency hiding，并强调 SP 与线程不是固定一一绑定。

## [2026-08-18] note | GPT-J 与 GPT-NeoX RoPE 配对布局

- 新增 [[MLSys/算子/GPT-J 与 GPT-NeoX RoPE 配对布局]]：记录 GPT-J/interleaved 与 GPT-NeoX/non-interleaved 的维度配对、`rotate` 结果及对应实现开关。
- 说明两者共享同一 RoPE 二维旋转数学形式，但训练和推理必须使用一致的 tensor layout；补充 `rotary_dim` 的作用。
- 同步更新 `.agent/index.md` 的 MLSys 条目。

## [2026-08-19] note | UVA、UVM 与 GPUDirect RDMA

- 新增 [[MLSys/UVA、UVM 与 GPUDirect RDMA]]：以“地址怎么表示 / 数据放在哪 / 数据怎么跨机器搬”区分 UVA、UVM 与 GDR，说明其数据路径、API 和 NCCL 语境。
- 关联 [[IBGDA]] 与 [[NIXL]]，并同步更新 `.agent/index.md` 的 MLSys 条目。

## [2026-08-19] update | UVA、UVM 与 GPUDirect RDMA：底层机制

- 补充 UVA 的 VA 划分、CPU/GPU 各自页表与 TLB 翻译、`cudaMalloc` 映射、pinned host memory、P2P 映射，以及它与 UVM 页迁移的边界。
- 说明 64 位 VA 的容量与“预留 VA 不等于分配物理内存”，记录 CUDA VMM 的 `cuMemAddressReserve()` / `cuMemMap()` 分离模型；同步更新 `.agent/index.md` 摘要。
