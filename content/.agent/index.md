---
title: Agent Index
tags:
  - agent
  - meta
  - moc
draft: true
created: 2026-08-11
---

# Agent Index —— 笔记库目录

> 这是给 AI Agent 用的导航目录（不发布）。每页一行摘要，按主题文件夹分组。
> 回答问题前先读本文件定位相关页面，再去 Grep/Read 具体笔记。
> 新建或更新笔记后，同步修订对应条目；并在 [[log]] 追加一条记录。

链接用内容相对路径（不含 `.md`），可直接点击跳转。最近更新见 [[log]]。

---

## MLSys —— 机器学习系统 / LLM 推理训练

- [[MLSys/CUDA Graph|CUDA Graph]] —— CUDA Graph 捕获与回放，减少 kernel launch 开销
- [[MLSys/IBGDA|IBGDA]] —— IB GPU Direct Async：GPU 直接发起 RDMA 通信
- [[MLSys/UVA、UVM 与 GPUDirect RDMA|UVA / UVM / GDR]] —— 统一编址、统一内存管理与网卡直访 GPU 显存的职责边界，以及页表/VMM 底层机制
- [[MLSys/通信时间的组成与 α-β 模型|通信时间与 α-β 模型]] —— 传输时延 vs 传播时延、α-β 模型、NCCL algbw/busbw、DeepEP 两类 kernel 的分工
- [[MLSys/DeepEP normal dispatch 各 rank 不同 token 数|DeepEP normal dispatch 变长]] —— normal kernel 支持各 rank 不同 token 数，等长只是 CUDA Graph 约束
- [[MLSys/MoE matmul 计算量与 EP 收益|MoE matmul 计算量与 EP 收益]] —— MoE 计算量分析与专家并行收益估算
- [[MLSys/算子/多头潜在注意力 (MLA)|多头潜在注意力（MLA）]] —— DeepSeek 的低秩 K/V 联合压缩、matrix absorption、Decoupled RoPE 与推理 KV Cache 布局
- [[MLSys/Model Quantization|Model Quantization]] —— 模型量化总览
- [[MLSys/Recurrent Depth（深度递归）|Recurrent Depth（深度递归）]] —— 沿网络深度复用同一组参数迭代隐藏表示，并辨析与 RNN、reasoning tokens 和 Agent loop 的关系
- [[MLSys/NIXL|NIXL]] —— NVIDIA Inference Xfer Library，推理时 KV/权重传输
- [[MLSys/Models/DeepSeek R1|DeepSeek R1]] —— DeepSeek-R1 推理模型笔记
- [[MLSys/Models/Deepseek V4|DeepSeek V4]] —— DeepSeek-V4 架构笔记
- [[MLSys/PD分离/top_k_top_p sampling|PD 分离：top-k/top-p sampling]] —— PD 分离场景下的采样实现
- [[MLSys/vllm/vLLM 监控：使用 Binary 部署 Prometheus + Grafana|vLLM 监控]] —— 用二进制部署 Prometheus+Grafana 监控 vLLM

### 压测工具

- [[MLSys/压测工具/AIPerf：压测 LLM Serving 与多轮数据集|AIPerf]] —— 压测 OpenAI-compatible serving，解读 TTFT/ITL/吞吐，并梳理真实输出驱动的 multi-turn 与固定 payload 重放
- [[MLSys/算子/Warp Shuffle|Warp Shuffle]] —— CUDA warp 内寄存器数据交换、归约模式与 mask 陷阱
- [[MLSys/算子/双调排序 (Bitonic Sort)|双调排序]] —— 适合 GPU/SIMD 的固定比较网络及其双调合并过程
- [[MLSys/算子/CUDA Tiling|CUDA Tiling]] —— 分块的作用：数据复用、IO 感知（FlashAttention）、并行划分与算术强度
- [[MLSys/算子/Linear Attention|Linear Attention]] —— Qwen 的 Linear Attention / Gated DeltaNet 详解
- [[MLSys/算子/RMS Norm|RMS Norm]] —— RMSNorm 算子
- [[MLSys/算子/Rotary Embedding|Rotary Embedding]] —— RoPE 旋转位置编码
- [[MLSys/算子/行主序与列主序 (row-major 与 column-major)|行主序与列主序]] —— 矩阵在一维内存中的行/列分块布局，以及 major 命名的含义
- [[MLSys/算子/GPT-J 与 GPT-NeoX RoPE 配对布局|GPT-J / GPT-NeoX RoPE 配对布局]] —— interleaved 与 non-interleaved 的旋转维度配对 convention

## paper —— 论文笔记

- [[paper/A White Paper on Neural Network Quantization|A White Paper on Neural Network Quantization]] —— 神经网络量化白皮书
- [[paper/DFlash Block Diffusion for Flash Speculative Decoding|DFlash]] —— Block Diffusion 加速 Flash 投机解码
- [[paper/DSpark-Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation|DSpark]] —— 置信度调度的半自回归投机解码
- [[paper/DeepSeek-V3 Technical Report|DeepSeek-V3]] —— DeepSeek-V3 技术报告
- [[paper/Denoising Diffusion Probabilistic Models|DDPM]] —— 去噪扩散概率模型
- [[paper/FlashAttention- Fast and Memory-Efficient Exact Attention with IO-Awareness|FlashAttention]] —— IO 感知的精确注意力
- [[paper/Integer Quantization for Deep Learning Inference|Integer Quantization for Inference]] —— 推理整数量化
- [[paper/Is_Flash_Attention_Stable|Is Flash Attention Stable]] —— FlashAttention 数值稳定性分析
- [[paper/SGLang Efficient Execution of Structured Language Model Programs|SGLang]] —— 结构化语言模型程序的高效执行

## source-code —— 源码阅读

- [[source-code/Linux-0.11/系统启动|Linux 0.11 系统启动]] —— Linux 0.11 启动流程源码梳理
- [[source-code/Paddle/分布式初始化|Paddle 分布式初始化]] —— PaddlePaddle 分布式初始化流程
- [[source-code/Pytorch/CUDACachingAllocator|CUDA Caching Allocator]] —— `record_stream()` 的跨-stream显存生命周期管理、与 `wait_stream()` 的边界，以及 NCCL 通信中的 Tensor 保护
- [[source-code/Pytorch/PyTorch Dispatcher 机制|PyTorch Dispatcher 机制]] —— DispatchKeySet、优先级、redispatch、算子注册、Meta/Composite 与 Python dispatch
- [[source-code/Pytorch/PyTorch 编译框架|PyTorch 编译框架]] —— PyTorch compiler / torch.compile 结构
- [[source-code/brpc/bthread|brpc bthread]] —— brpc 的 M:N 协程 bthread 实现
- [[source-code/folly/SCOPE_EXIT|folly SCOPE_EXIT]] —— folly 作用域退出工具
- [[source-code/folly/fbstring|folly fbstring]] —— folly 字符串实现（SSO 等）
- [[source-code/uthreads/intrusive_ptr|uthreads intrusive_ptr]] —— 微线程库的侵入式智能指针
- [[source-code/uthreads/uThreads Class Diagram|uThreads Class Diagram]] —— μThreads 类图结构
- [[source-code/vllm/DBO 源码梳理|vLLM DBO]] —— Dual Batch Overlap 双微批重叠机制
- [[source-code/vllm/DeepSeekV4 KV Cache 管理|DeepSeekV4 KV Cache 管理]] —— vLLM 中 DeepSeek-V4 KV cache 管理
- [[source-code/vllm/vLLM DP 协调、CUDA Graph 与 DeepEP Low Latency|vLLM DP / CUDA Graph / DeepEP]] —— DP 协调、CUDA Graph、DeepEP 低延时路径
- [[source-code/vllm/vLLM Quantization Config、Method 与 Scheme|vLLM Quantization 类关系]] —— Config 负责模型级配置与 Method 选择，Method 接管 layer 生命周期，Scheme 是复杂后端的可选内部策略层
- [[source-code/vllm/vllm 源码随手记|vLLM 源码随手记]] —— vLLM 源码阅读杂记：KV cache 架构、prefix cache 全命中时的末 token 重算与 block 对齐约束等

## 语言

### C++

- [[language/C++/ABA问题|ABA 问题]] —— 无锁编程中的 ABA 问题
- [[language/C++/AddressSanitizer (ASan) 使用指南|AddressSanitizer 使用指南]] —— ASan 内存错误检测
- [[language/C++/C++ 转发引用、引用折叠与 make_pair报错理解|转发引用 / 引用折叠]] —— 转发引用、引用折叠与 make_pair 报错
- [[language/C++/C++17 inline static|C++17 inline static]] —— inline 静态成员
- [[language/C++/C++ 预定义宏（__FILE__、__LINE__ 等）|C++ 预定义宏]] —— __FILE__/__LINE__/__func__ 与 C++20 source_location
- [[language/C++/CRTP(将子类作为父类模板)|CRTP]] —— 奇异递归模板模式
- [[language/C++/Coroutine|C++ Coroutine]] —— C++20 协程
- [[language/C++/IILE（立即调用的 Lambda 表达式）|IILE]] —— 将多步局部逻辑封装为立即求值的初始化表达式
- [[language/C++/Most vexing parse|Most vexing parse]] —— 最令人头疼的语法解析
- [[language/C++/compare_exchange_weak vs strong|compare_exchange weak/strong]] —— CAS weak 与 strong 的区别
- [[language/C++/enable_shared_from_this|enable_shared_from_this]] —— 安全获取 this 的 shared_ptr
- [[language/C++/integral_constant|integral_constant]] —— 类型萃取基础构件
- [[language/C++/memory order|memory order]] —— 内存序与原子（枢纽页）
- [[language/C++/std-promise 和 std-future|std::promise / std::future]] ——  promise/future 异步取值

### Rust

- [[language/rust/closure|closure]] —— 闭包与 trait 捕获
- [[language/rust/enum|enum]] —— 枚举与模式匹配
- [[language/rust/generics|generics]] —— 泛型
- [[language/rust/iterators|iterators]] —— 迭代器
- [[language/rust/more-about-cargo|more about cargo]] —— cargo 进阶
- [[language/rust/pattern-matching|pattern matching]] —— 模式匹配
- [[language/rust/traits|traits]] —— trait 系统
- [[language/rust/use-and-mod|use and mod]] —— 模块与路径
- [[language/rust/visibility|visibility]] —— 可见性

### Python / CMake / Make / Shell / Mermaid

- [[language/Python/Python dict key：__hash__与 __eq__|Python dict key]] —— dict key 的 __hash__/__eq__
- [[language/Python/Python __new__ 方法|Python __new__ 方法]] —— 对象创建与初始化的分工；不可变类型子类与实例复用
- [[language/CMake/General Rules for Using Depencies|CMake 依赖使用通则]] —— CMake 依赖管理一般规则
- [[language/CMake/Google Test|Google Test]] —— GTest 集成
- [[language/CMake/include directory|include directory]] —— include 目录处理与 PUBLIC/INTERFACE/PRIVATE 传播范围
- [[language/CMake/判断编译器类型|判断编译器类型]] —— CMake 判断编译器
- [[language/Makefile|Makefile]] —— Makefile 基础
- [[language/shellscript/shell expansion|shell expansion]] —— shell 展开（通配/参数/命令替换）
- [[language/shellscript/一行执行多个命令|一行执行多个命令]] —— ;、&&、||、&、| 等命令连接符的区别
- [[language/mermaid/Mermaid 使用指南|Mermaid 使用指南]] —— Mermaid 画图语法（流程图等）
- [[language/mermaid/Quartz Mermaid 排错手册|Quartz Mermaid 排错手册]] —— Quartz 中 Mermaid 渲染问题排查

## 算法 —— 算法与数据结构

- [[算法/单调栈|单调栈]] —— 单调栈的适用题型、识别特征、维护方式与常用模板

## 设计模式

- [[设计模式/设计原则|设计原则]] —— SOLID 等设计原则（枢纽页）
- [[设计模式/享元模式 (Flyweight)|享元模式]] —— Flyweight
- [[设计模式/代理模式 (Proxy)|代理模式]] —— Proxy
- [[设计模式/原型模式 (Prototype)|原型模式]] —— Prototype
- [[设计模式/工厂模式 (Factory)|工厂模式]] —— Factory
- [[设计模式/构建器 (Builder)|构建器]] —— Builder
- [[设计模式/桥模式 (Bridge)|桥模式]] —— Bridge
- [[设计模式/模版方法 (Template Method)|模版方法]] —— Template Method
- [[设计模式/策略模式 (Strategy)|策略模式]] —— Strategy
- [[设计模式/装饰器模式(Decorator)|装饰器模式]] —— Decorator
- [[设计模式/观察者模式 (Observer or Event)|观察者模式]] —— Observer / Event
- [[设计模式/适配器 (Adaptor)|适配器]] —— Adaptor
- [[设计模式/门面模式 (Facade)|门面模式]] —— Facade

## 命令行工具

- [[命令行工具/LD Flag|LD Flag]] —— 链接器标志
- [[命令行工具/SSH 端口转发|SSH 端口转发]] —— 本地/远程/动态端口转发
- [[命令行工具/aria2|aria2]] —— 多线程下载工具
- [[命令行工具/clang-format|clang-format]] —— C/C++ 代码格式化
- [[命令行工具/git/Git LFS|Git LFS]] —— 大文件的 pointer/LFS 存储机制、日常使用、GitHub 查看方式与历史迁移
- [[命令行工具/git/git 常用命令|git 常用命令]] —— git 常用操作，包括用 log/follow/blame/diff 追踪单个文件的修改历史
- [[命令行工具/git/PR Review：单栏与双栏 diff 的选择|PR Review：单栏与双栏 diff 的选择]] —— 按屏幕宽度与改动类型选择 Unified/Split，以及复杂重构的上下文阅读习惯
- [[命令行工具/grep|grep]] —— 文本搜索
- [[命令行工具/objdump|objdump]] —— 目标文件反汇编
- [[命令行工具/git/pre-commit|pre-commit]] —— git pre-commit 钩子
- [[命令行工具/shell 快捷键|shell 快捷键]] —— 命令行快捷键
- [[命令行工具/tmux 快捷键|tmux 快捷键]] —— tmux 操作速查
- [[命令行工具/uv|uv]] —— uv Python 包管理器
- [[命令行工具/wget|wget]] —— 下载工具

## system-programming —— 系统编程

- [[system-programming/PLT-GOT-动态链接|PLT/GOT 动态链接]] —— PLT/GOT 与延迟绑定
- [[system-programming/macOS 下使用 QEMU 学习 RISC-V：安装环境并跑通 riscv-test|QEMU 学 RISC-V]] —— macOS 下 QEMU+RISC-V 环境
- [[system-programming/x86 registers|x86 registers]] —— x86-64 寄存器

## AI-agent —— AI 助手与工作流

- [[AI-agent/LLM Wiki|LLM Wiki]] —— Karpathy 的 LLM 维护个人知识库模式（本指令的方法论来源）
- [[AI-agent/普通对话与 Deep Research：从 Agent 架构理解差异|普通对话与 Deep Research]] —— 从研究型 Agent 的规划—检索—评估—综合闭环解释两者差异，并给出任务选型
- [[AI-agent/Subagent 的好处与适用边界|Subagent 的好处与适用边界]] —— 上下文隔离是核心收益，顺带获得并行、故障隔离与模型异构；附代价与适用边界
- [[AI-agent/DeepSeek Harness/DeepSeek Harness 四种 Agent 模式|DeepSeek Harness 四种 Agent 模式]] —— 标准、PTC、极简、创造四个 preset 的能力差异与选型
- [[AI-agent/DeepSeek Harness/DSH 插件系统|DSH 插件系统]] —— Cordis profile/bundle/patch、dual-face 插件、dsh.client 模块表与 HMR 机制
- [[AI-agent/DeepSeek Harness/PTC 模式与推理框架 tool_call 的兼容性|PTC 与推理框架 tool_call 兼容性]] —— PTC 对 vLLM/SGLang 只是普通单工具调用，真正门槛在模型侧训练格式
- [[AI-agent/Cursor Agent Best Practice|Cursor Agent Best Practice]] —— Cursor Agent 工作流最佳实践
- [[AI-agent/AI 代码 Review 策略|AI 代码 Review 策略]] —— AI 产出超过人工审查带宽时的四层分流：可验证信号、独立 agent 评审、计划前置拦截、高危人读
- [[AI-agent/claude-code/Claude Code Loop 工程：loop、goal 与 schedule|Claude Code Loop 工程]] —— loop/goal/schedule 与后台会话、后台命令的用法和选型
- [[AI-agent/claude-code/Claude Code 快捷键|Claude Code 快捷键]] —— 输入框编辑（Ctrl+U/K/W）、会话控制（Esc、Shift+Tab）与特殊前缀（#/!/@//）
- [[AI-agent/hermes/Hermes Gateway|Hermes Gateway]] —— Hermes 网关

## book-notes —— 读书笔记

- [[book-notes/A Philosophy of Software Design|A Philosophy of Software Design]] —— Ousterhout 软件设计哲学
- [[book-notes/Computer Organization and Design/Chapter 3|Computer Organization and Design Ch.3]] —— 计算机组成与设计 第3章
- [[book-notes/Linux 多线程服务端编程 使用 muduo C++ 网络库|Linux 多线程服务端编程 (muduo)]] —— muduo 网络库读书笔记
- [[book-notes/Programming Massively Parallel Processors/Chapter 1 Introduction|Programming Massively Parallel Processors Ch.1]] —— CPU/GPU 设计取舍、GPU 架构、Amdahl 定律与 CUDA 并行编程定位
- [[book-notes/Programming Massively Parallel Processors/Chapter2 Data parallel computing|Programming Massively Parallel Processors Ch.2]] —— CUDA 线程层级与内建变量、block 顺序不可假设与硬件可扩展性、loop parallelism 与调度自由、PTX 特殊寄存器、函数限定符、SPMD/SIMD 及 warp 对齐
- [[book-notes/Practical VIM|Practical VIM]] —— Vim 实践
- [[book-notes/The Rust Programming Language|The Rust Programming Language]] —— Rust 官方书（枢纽页）
- [[book-notes/算法导论 (CLRS) 阅读路线|算法导论 (CLRS) 阅读路线]] —— CLRS 分阶段阅读路线与 LeetCode 配合策略

## obsidian-usage —— Obsidian 元笔记

- [[obsidian-usage/Obsidian Frontmatter 格式参考|Frontmatter 格式参考]] —— YAML frontmatter 字段与写法
- [[obsidian-usage/Obsidian Callout 语法|Callout 语法]] —— callout 标注块语法
- [[obsidian-usage/Obsidian 快捷键大全|快捷键大全]] —— Obsidian 快捷键
- [[obsidian-usage/Mermaid Zoom 插件|Mermaid Zoom 插件]] —— Mermaid 缩放插件

## coding-tools —— 开发工具

- [[coding-tools/VIM使用/基础命令|Vim 基础命令]] —— 按模式分组的 Vim 命令速查表（移动/编辑/可视/命令行/缓冲区）
- [[coding-tools/VIM使用/neo-tree|neo-tree]] —— neo-tree 文件树

## 编译相关

- [[编译相关/GCC Warning Options|GCC Warning Options]] —— GCC 警告选项

## website —— 本站/Quartz 相关

- [[website/Makefile tutorial|Makefile tutorial]] —— 写给本站的 Makefile 教程
- [[website/vllm/reference|vLLM reference]] —— vLLM 参考
- [[website/计算机启动过程|计算机启动过程]] —— 计算机启动过程（站点页）

## STM32 —— 嵌入式

- [[STM32/STM32G474RE 与 NUCLEO-G474RE 文档索引|STM32G474RE 文档索引]] —— STM32G474RE / NUCLEO 板文档索引

## 其他 —— 方法论 / 效率 / 杂项

- [[其他/大型项目源码阅读方法论|大型项目源码阅读方法论]] —— 读大项目源码的方法
- [[其他/Debug 时如何不被思维定势影响|Debug 不被思维定势影响]] —— 调试心态
- [[其他/GTD - Getting Things Done|GTD]] —— Getting Things Done 任务管理法
- [[其他/快速上手编程语言|快速上手编程语言]] —— 学新语言的方法
- [[其他/拖延症应对手册|拖延症应对手册]] —— 应对拖延
- [[其他/About Me|About Me]] —— 个人简介
- [[其他/vscode 快捷键|vscode 快捷键]] —— VS Code 快捷键
- [[其他/Hwo to write a skill|Hwo to write a skill]] —— 如何写 skill（文件名拼写待确认，勿擅改）
- [[其他/反查 root 进程背后的真人|反查 root 进程背后的真人]] —— 进程归属排查
- [[其他/根据 PID 定位 Docker 容器|根据 PID 定位 Docker 容器]] —— PID 到容器的定位
- [[其他/自然码双拼键位|自然码双拼键位]] —— 双拼键位图

## 生活

- [[生活/NuPhy Halo65 灯光调节|NuPhy Halo65 灯光调节]] —— 键盘灯光设置
- [[生活/如何快速摆脱内耗|如何快速摆脱内耗]] —— 心理调节

## 站点入口

- [[index|Welcome]] —— 站点首页
