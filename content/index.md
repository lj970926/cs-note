---
title: Welcome
---

# Hi, I'm lj970926 👋

This is my engineering notebook and digital garden, where I collect what I learn about systems engineering, machine learning systems, source-code reading, and everyday developer tools. I use it to leave a trail for questions I want to revisit: which abstractions are worth unpacking, which performance problems need measurement, and which engineering trade-offs deserve a second look.

I mainly work with **C++** and **Python**. C++ keeps me close to performance, memory, concurrency, and runtime behavior, while Python helps me move quickly across the machine learning ecosystem. I am also exploring **Rust**, especially its approach to safety and expressiveness in systems programming.

My current focus is **Machine Learning Systems**, especially LLM training, inference, and serving. I care about how systems make large models faster, more efficient, and more reliable in practice. I read projects such as **vLLM**, **SGLang**, **PaddlePaddle**, and **PyTorch**, and I try to connect papers, implementation details, and experiments into one working mental model.

## What You'll Find Here

This garden is mostly about the systems side of software and machine learning:

- **[[ML sys/|Machine learning systems]]**: notes on LLM training, inference, and serving.
- **[[源码/|Source-code reading]]**: implementation notes from projects like vLLM, brpc, folly, PaddlePaddle, and Linux 0.11.
- **[[language/|Programming languages]]**: notes on C++, Python, Rust, and more.
- **Systems programming**: notes on concurrency, coroutines, async patterns, network programming, and more.
- **[[命令行工具/|Engineering tools and workflow]]**: practical references for Vim, tmux, git, shell, CMake, and debugging habits.

## How I Write

Not every note here is a polished tutorial. Some are markers left behind during source-code reading, some are clues from debugging sessions, and some are attempts to move an idea from “I think I get it” to “I can explain, reproduce, and modify it.” I prefer starting from concrete problems: read the code, run experiments, look at the metrics, and then rebuild the abstraction from the ground up.

If these notes help you avoid a small detour, or make one more layer of a complex system visible, then they have already done something useful.

## Browse by Topic

- [[设计原则|Design Patterns]] — creational, structural, and behavioral patterns in C++
- [[The Rust Programming Language|Rust]] — ownership, closures, enums, pattern matching, and modules
- [[A White Paper on Neural Network Quantization|Quantization]] — model quantization techniques and papers
- [[vllm 源码随手记|LLM Serving]] — vLLM, SGLang, and inference optimization
- [[bthread|Concurrency]] — C++ memory models, lock-free programming, and async patterns
- [[Practical VIM|Tools & Workflow]] — Vim, tmux, git, shell, and developer productivity

## Elsewhere

You can also find my projects and experiments on [GitHub](https://github.com/lj970926). My public repositories include this note site, along with code related to C++ concurrency, Rust, interpreters, HTTP servers, deep learning, and algorithm practice.
