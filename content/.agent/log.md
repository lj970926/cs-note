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

## [2026-09-03] note | Claude Code 快捷键

- 新建 [[AI-agent/claude-code/Claude Code 快捷键]]：整理输入框编辑（readline/emacs 风格，Ctrl+U/K/W/Y）、发送与换行、会话控制（Esc、Ctrl+C/D/L、Shift+Tab、Ctrl+B/T）与 `#`/`!`/`@`/`/` 特殊前缀。
- 关联 [[命令行工具/shell 快捷键]] 与 [[AI-agent/claude-code/Claude Code Loop 工程：loop、goal 与 schedule]]；同步更新 `.agent/index.md`。

## [2026-09-03] note | CUDA Tiling

- 新建 [[MLSys/算子/CUDA Tiling]]：梳理 tiling 的六类作用——数据复用、工作集裁剪、IO 感知（online softmax）、并行化与延迟隐藏、coalescing、算术强度。链接到 [[paper/FlashAttention- Fast and Memory-Efficient Exact Attention with IO-Awareness]]、[[MLSys/算子/多头潜在注意力 (MLA)]]、[[MLSys/算子/Linear Attention]]、[[book-notes/Programming Massively Parallel Processors/Chapter 1 Introduction]] 等。

## [2026-09-02] note | C++ 预定义宏（__FILE__、__LINE__ 等）

- 新建 [[language/C++/C++ 预定义宏（__FILE__、__LINE__ 等）]]：标准/编译器扩展预定义宏一览，日志断言、唯一变量名拼接、条件编译等典型用法，以及 C++20 `std::source_location` 替代方案。链接到 [[source-code/folly/SCOPE_EXIT]]。

## [2026-09-01] update | 多头潜在注意力 (MLA)：Prefill 的 absorb 取舍

- 在 [[MLSys/算子/多头潜在注意力 (MLA)]] 中区分压缩 cache 写入与 attention 的 MHA / MQA 计算路径；记录长 dense Prefill 通常更适合 MHA 展开 + FlashAttention，而 Decode 更适合 absorb，Sparse / chunked Prefill 则应按 kernel benchmark 选择。

## [2026-09-01] update | 多头潜在注意力 (MLA)：显式多头 matrix absorption

- 修正 [[MLSys/算子/多头潜在注意力 (MLA)]] 的 matrix absorption 推导：按 head 切分 $W_i^{UK}$、$W_i^{UV}$ 与 $W_i^O$，明确各 head 分别吸收 Key / Value 投影，而只共享 latent cache $c^{KV}$。

## [2026-09-01] note | 多头潜在注意力 (MLA)

- 新增 [[MLSys/算子/多头潜在注意力 (MLA)]]：整理 DeepSeek MLA 的 K/V 低秩联合压缩、matrix absorption 与 Decoupled RoPE，并从推理引擎视角说明 `$[c^{KV}, k^R]$` KV Cache 布局和 HBM 带宽收益。
- 关联 [[DeepSeek R1]]、[[DeepSeek-V3 Technical Report]]、[[Rotary Embedding]]、[[source-code/vllm/DeepSeekV4 KV Cache 管理]] 与 [[Model Quantization#KV Cache 量化]]；同步更新 `.agent/index.md`。

## [2026-09-01] note | 行主序与列主序 (row-major 与 column-major)

- 新增 [[MLSys/算子/行主序与列主序 (row-major 与 column-major)]]：解释 `major` 指外层、变化较慢的高位维度，而非重要性；给出两种布局的线性偏移公式、连续访问方向和常见语言约定。
- 关联 [[Warp Shuffle]]，说明矩阵布局会影响 GPU 内存访问及布局重排；同步更新 `.agent/index.md`。

---

## [2026-08-25] ingest | Git LFS

- 基于 ChatGPT 分享对话整理 [[命令行工具/git/Git LFS]]，并结合 Git LFS、GitHub 官方文档核对关键行为。
- 覆盖 pointer/LFS 存储机制、安装与跟踪、克隆与验证、GitHub 查看入口、现有文件与历史迁移，以及 GitHub Pages、配额和历史重写等注意事项。
- 链接到 [[命令行工具/git/git 常用命令]]，并同步更新 `.agent/index.md` 的命令行工具条目。

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

## [2026-08-20] update | CUDACachingAllocator：Tensor.record_stream

- 扩写 [[source-code/Pytorch/CUDACachingAllocator]]，整理 `Tensor.record_stream()` 在跨 CUDA stream 使用中的显存生命周期管理作用。
- 区分 `wait_stream()` 的执行依赖与 `record_stream()` 的内存生命周期依赖，并补充 creation stream、foreign stream user、allocator block 心智模型及显式 event/wait 替代方案。
- 关联 [[source-code/vllm/DBO 源码梳理]]，同步更新 `.agent/index.md` 摘要。

## [2026-08-20] update | CUDACachingAllocator：通信场景

- 补充 `record_stream()` 对 NCCL 输入、输出、原地及临时通信 buffer 的生命周期保护，并说明执行依赖与 allocator safety 必须分别处理。
- 说明通信 kernel 下发后调用最直观，但本质是登记 foreign stream，而不是记录某个 kernel 的完成点。
- 记录当前 `ProcessGroupNCCL` 主要通过 `WorkNCCL` / `TensorShelf` 保存 Tensor 强引用来替代直接 `recordStream()` 的实现，并同步更新 `.agent/index.md`。

## [2026-08-20] update | git 常用命令：追踪单个文件历史

- 在 [[命令行工具/git/git 常用命令]] 中补充 `git log --follow -p -- path/to/file` 主用法，以及 `show`、`blame`、`diff` 和 `tig` 的配套用法。
- 记录 `--follow` 的单文件限制和 rename 相似度推断边界，关联 [[其他/大型项目源码阅读方法论]]，并同步更新 `.agent/index.md`。

## [2026-08-26] update | Git 笔记目录整理

- 将 [[命令行工具/git/Git LFS]]、[[命令行工具/git/git 常用命令]] 和 [[命令行工具/git/pre-commit]] 移至 `命令行工具/git/` 子目录。
- 同步更新 `.agent/index.md` 与相关 wikilink。

## [2026-08-28] update | Claude Code Loop 工程：后台运行

- 在 [[AI-agent/claude-code/Claude Code Loop 工程：loop、goal 与 schedule]] 补充 `claude --bg`、`/background` / `/bg`、`claude agents`、attach/logs/stop 的后台会话工作流。
- 区分后台会话、后台 Bash 命令（`Ctrl+B` / `/tasks`）、`/loop`、云端 routine 与 `tmux` 的适用边界，补充后台权限限制和官方文档链接。
- 同步更新 `.agent/index.md` 条目。

## [2026-08-30] note | IILE（立即调用的 Lambda 表达式）

- 新增 [[language/C++/IILE（立即调用的 Lambda 表达式）]]：说明 IILE 的语法、立即调用时机，以及将多步初始化保持为 `const` 表达式的用途。
- 记录其在收紧中间变量/RAII 资源作用域、构造函数实参等表达式位置和就地表达依赖方面的优势，并说明何时应改用命名函数。
- 与 [[source-code/folly/SCOPE_EXIT]] 互链，区分立即执行与作用域退出时执行。
- 同步更新 `.agent/index.md` 的 C++ 条目。

## [2026-09-03] update | Vim 基础命令：重构

- 重构 [[coding-tools/VIM使用/基础命令]]：按模式与功能分组改为表格，清理 Obsidian 反斜杠转义残留（`\^`、`\<C-a\>` 等）并改用行内代码。
- 修正事实错误：数字减一为 `<C-x>`（原文误作 `<C-b>`）；表达式寄存器为 `<C-r>=`；`:[range]t{address}` 是复制而非移动。
- 修正错别字（插入「模式」、address、删除缓冲区等），补全 `q:` 条目，并补充 `hjkl`/`w`/`gg`/`dd`/`yy`/`p`/`u` 等基础命令。
- 同步更新 `.agent/index.md` 摘要。

## [2026-09-03] note | Programming Massively Parallel Processors 第二章

- 新增 [[book-notes/Programming Massively Parallel Processors/Chapter2 Data parallel computing]]：记录 CUDA 的 grid/block/thread 两级线程层级、`gridDim`/`blockDim` 的含义，以及 block 固定大小与边界线程处理。
- 说明 block 是 SM 调度单位、线程通常按 warp 执行，并关联 [[book-notes/Programming Massively Parallel Processors/Chapter 1 Introduction]] 的 GPU 线程化模型。
- 同步更新 `.agent/index.md` 的 book-notes 条目。

## [2026-09-04] update | Programming Massively Parallel Processors 第二章：SPMD 与 SIMD

- 在 [[book-notes/Programming Massively Parallel Processors/Chapter2 Data parallel computing]] 中补充 SPMD 与 SIMD 的定义、对比表和核心区别：同一程序不等于同一时刻执行同一条指令。
- 补充 CUDA 3.0 及之后每个 block 最多 1024 个线程、部分更早版本最多 512 个线程的历史版本说明，并同步更新 `.agent/index.md` 摘要。

## [2026-09-04] update | Programming Massively Parallel Processors 第二章：Block size 与 warp 对齐

- 补充 block 线程总数通常选择为 32 的倍数，以免最后一个 warp 出现未使用的 lane。
- 辨析“每个维度都是 32 的倍数”的误读，以 `dim3(16, 16)` 和 `dim3(32, 8)` 说明真正参与 warp 划分的是各维度乘积，并记录 block size 还受内存访问、资源用量和 occupancy 影响。
- 关联 [[MLSys/算子/Warp Shuffle]]，同步更新 `.agent/index.md` 摘要。

## [2026-09-04] update | Programming Massively Parallel Processors 第二章：CUDA 内建坐标变量

- 补充 `blockDim`、`blockIdx`、`threadIdx` 的类型、含义、取值范围及 `x`/`y`/`z` 分量，并明确它们是 kernel 内建变量而非操作系统环境变量。
- 通过一维数组与二维图像示例说明全局线程坐标、向上取整的 grid size 和边界检查，并补充相关的 `gridDim` 与 `warpSize`。
- 同步更新 `.agent/index.md` 摘要。

## [2026-09-04] update | Programming Massively Parallel Processors 第二章：内建变量的硬件实现

- 补充 CUDA 内建坐标变量从 CUDA C++、NVVM、PTX special register 到 SASS `S2R` 的降低路径，以及 `threadIdx`/`blockDim`/`blockIdx`/`gridDim` 与 `%tid`/`%ntid`/`%ctaid`/`%nctaid` 的对应关系。
- 说明这些值来自 kernel launch 与 CTA/thread 调度状态，不是内存变量或通常意义上的编译时常量；同时区分 PTX 保证的特殊寄存器接口与未公开保证的芯片物理实现。
- 添加 PTX 与 SASS 形式示例、NVIDIA PTX ISA 官方参考，并同步更新 `.agent/index.md` 摘要。
