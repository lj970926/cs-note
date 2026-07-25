---
title: Read Queue
description: 父路径人类笔记批量读取队列，LLM 维护
date: 2026-07-25
tags: [meta, queue]
aliases: []
---

# Read Queue

> 目标：每 5 分钟从 `/Users/lijin23/code/quartz/content` 选一篇未读的人类笔记进行 ingest，直到所有页面都读完或读到 100 篇。
> 排除：llm-wiki/、Excalidraw/、index.md、.claudian/ 等元数据或配置文件。

## Stats

- Total: 119
- Read: 16
- Remaining: 103
- Last updated: 2026-07-25

## Read

- [x] AI-agent/claude-code/Claude Code Loop 工程：loop、goal 与 schedule.md → [[sources/src-claude-code-loop-engineering|src-claude-code-loop-engineering]]
- [x] AI-agent/Cursor Agent Best Practice.md → [[sources/src-cursor-agent-best-practice|src-cursor-agent-best-practice]]
- [x] AI-agent/hermes/Hermes Gateway.md → [[sources/src-hermes-gateway|src-hermes-gateway]]
- [x] AI-agent/LLM Wiki.md → 与现有 [[sources/src-llm-wiki-idea|src-llm-wiki-idea]] 合并，补充 [[concepts/LLM Wiki|LLM Wiki]] 细节
- [x] book-notes/A Philosophy of Software Design.md → [[sources/src-philosophy-of-software-design|src-philosophy-of-software-design]]
- [x] book-notes/Computer Organization and Design/Chapter 3.md → 空文件，跳过
- [x] book-notes/Linux 多线程服务端编程 使用 muduo C++ 网络库.md → [[sources/src-linux-multithreaded-server-programming|src-linux-multithreaded-server-programming]]
- [x] book-notes/Practical VIM.md → [[sources/src-practical-vim|src-practical-vim]]
- [x] book-notes/The Rust Programming Language.md → 空文件，跳过
- [x] coding-tools/VIM使用/neo-tree.md → 空文件，跳过
- [x] coding-tools/VIM使用/基础命令.md → [[sources/src-vim-basic-commands|src-vim-basic-commands]]
- [x] language/C++/ABA问题.md → [[sources/src-aba-problem|src-aba-problem]]
- [x] language/C++/AddressSanitizer (ASan) 使用指南.md → [[sources/src-addresssanitizer-guide|src-addresssanitizer-guide]]
- [x] language/C++/C++ 转发引用、引用折叠与 make_pair报错理解.md → [[sources/src-cpp-forwarding-reference|src-cpp-forwarding-reference]]
- [x] language/C++/C++17 inline static.md → [[sources/src-cpp17-inline-static|src-cpp17-inline-static]]
- [x] language/C++/compare_exchange_weak vs strong.md → [[sources/src-compare-exchange-weak-strong|src-compare-exchange-weak-strong]]

## Queue

- [ ] language/C++/Coroutine.md
- [ ] language/C++/CRTP(将子类作为父类模板).md
- [ ] language/C++/C++ 转发引用、引用折叠与 make_pair报错理解.md
- [ ] language/C++/C++17 inline static.md
- [ ] language/C++/compare_exchange_weak vs strong.md
- [ ] language/C++/Coroutine.md
- [ ] language/C++/CRTP(将子类作为父类模板).md
- [ ] language/C++/enable_shared_from_this.md
- [ ] language/C++/integral_constant.md
- [ ] language/C++/memory order.md
- [ ] language/C++/Most vexing parse.md
- [ ] language/C++/std-promise 和 std-future.md
- [ ] language/CMake/General Rules for Using Depencies.md
- [ ] language/CMake/Google Test.md
- [ ] language/CMake/include directory.md
- [ ] language/CMake/判断编译器类型.md
- [ ] language/Makefile.md
- [ ] language/mermaid/Mermaid 使用指南.md
- [ ] language/mermaid/Quartz Mermaid 排错手册.md
- [ ] language/Python/Python dict key：__hash__与 __eq__.md
- [ ] language/rust/closure.md
- [ ] language/rust/enum.md
- [ ] language/rust/generics.md
- [ ] language/rust/iterators.md
- [ ] language/rust/more-about-cargo.md
- [ ] language/rust/pattern-matching.md
- [ ] language/rust/traits.md
- [ ] language/rust/use-and-mod.md
- [ ] language/rust/visibility.md
- [ ] language/shellscript/shell expansion.md
- [ ] MLSys/CUDA Graph.md
- [ ] MLSys/IBGDA.md
- [ ] MLSys/Model Quantization.md
- [ ] MLSys/Models/DeepSeek R1.md
- [ ] MLSys/Models/Deepseek V4.md
- [ ] MLSys/MoE matmul 计算量与 EP 收益.md
- [ ] MLSys/NIXL.md
- [ ] MLSys/PD分离/top_k_top_p sampling.md
- [ ] MLSys/vllm/vLLM 监控：使用 Binary 部署 Prometheus + Grafana.md
- [ ] MLSys/算子/RMS Norm.md
- [ ] MLSys/算子/Rotary Embedding.md
- [ ] obsidian-usage/Mermaid Zoom 插件.md
- [ ] obsidian-usage/Obsidian Callout 语法.md
- [ ] obsidian-usage/Obsidian Frontmatter 格式参考.md
- [ ] obsidian-usage/Obsidian 快捷键大全.md
- [ ] paper/A White Paper on Neural Network Quantization.md
- [ ] paper/DeepSeek-V3 Technical Report.md
- [ ] paper/Denoising Diffusion Probabilistic Models.md
- [ ] paper/DFlash Block Diffusion for Flash Speculative Decoding.md
- [ ] paper/DSpark-Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation.md
- [ ] paper/Integer Quantization for Deep Learning Inference.md
- [ ] paper/Is_Flash_Attention_Stable.md
- [ ] paper/SGLang Efficient Execution of Structured Language Model Programs.md
- [ ] source-code/brpc/bthread.md
- [ ] source-code/folly/fbstring.md
- [ ] source-code/folly/SCOPE_EXIT.md
- [ ] source-code/Linux-0.11/系统启动.md
- [ ] source-code/Paddle/分布式初始化.md
- [ ] source-code/Pytorch/CUDACachingAllocator.md
- [ ] source-code/Pytorch/PyTorch 编译框架.md
- [ ] source-code/uthreads/intrusive_ptr.md
- [ ] source-code/uthreads/uThreads Class Diagram.md
- [ ] source-code/vllm/DBO 源码梳理.md
- [ ] source-code/vllm/DeepSeekV4 KV Cache 管理.md
- [ ] source-code/vllm/vLLM DP 协调、CUDA Graph 与 DeepEP Low Latency.md
- [ ] source-code/vllm/vllm 源码随手记.md
- [ ] STM32/STM32G474RE 与 NUCLEO-G474RE 文档索引.md
- [ ] system-programming/macOS 下使用 QEMU 学习 RISC-V：安装环境并跑通 riscv-test.md
- [ ] system-programming/PLT-GOT-动态链接.md
- [ ] system-programming/x86 registers.md
- [ ] website/Makefile tutorial.md
- [ ] website/vllm/reference.md
- [ ] website/计算机启动过程.md
- [ ] 编译相关/GCC Warning Options.md
- [ ] 命令行工具/clang-format.md
- [ ] 命令行工具/git 常用命令.md
- [ ] 命令行工具/grep.md
- [ ] 命令行工具/LD Flag.md
- [ ] 命令行工具/objdump.md
- [ ] 命令行工具/pre-commit.md
- [ ] 命令行工具/shell 快捷键.md
- [ ] 命令行工具/SSH 端口转发.md
- [ ] 命令行工具/tmux 快捷键.md
- [ ] 命令行工具/uv.md
- [ ] 命令行工具/wget.md
- [ ] 其他/About Me.md
- [ ] 其他/Debug 时如何不被思维定势影响.md
- [ ] 其他/Hwo to write a skill.md
- [ ] 其他/vscode 快捷键.md
- [ ] 其他/反查 root 进程背后的真人.md
- [ ] 其他/根据 PID 定位 Docker 容器.md
- [ ] 其他/快速上手编程语言.md
- [ ] 其他/自然码双拼键位.md
- [ ] 设计模式/策略模式 (Strategy).md
- [ ] 设计模式/代理模式 (Proxy).md
- [ ] 设计模式/工厂模式 (Factory).md
- [ ] 设计模式/构建器 (Builder).md
- [ ] 设计模式/观察者模式 (Observer or Event).md
- [ ] 设计模式/门面模式 (Facade).md
- [ ] 设计模式/模版方法 (Template Method).md
- [ ] 设计模式/桥模式 (Bridge).md
- [ ] 设计模式/设计原则.md
- [ ] 设计模式/适配器 (Adaptor).md
- [ ] 设计模式/享元模式 (Flyweight).md
- [ ] 设计模式/原型模式 (Prototype).md
- [ ] 设计模式/装饰器模式(Decorator).md
- [ ] 生活/NuPhy Halo65 灯光调节.md
- [ ] 生活/如何快速摆脱内耗.md
