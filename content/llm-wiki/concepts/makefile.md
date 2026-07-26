---
title: Makefile
description: GNU Make 使用的基于规则的构建描述文件
date: 2026-07-25
tags: [concept, makefile, build-system]
aliases: [Make]
---

# Makefile

## Definition

**Makefile** 是 GNU Make 工具读取的构建描述文件，它通过声明「目标（target）— 依赖（prerequisite）— 配方（recipe）」规则，自动化完成编译、链接、打包等构建任务。Make 根据文件时间戳判断哪些目标需要重新生成。

## Basic syntax

```make
 target: prerequisites
\trecipe
```

- **target**：要生成的文件或伪目标（如 `clean`、`all`）。
- **prerequisites**：生成 target 所需的源文件或其他 target。
- **recipe**：Shell 命令，必须以 Tab 开头。

## Common automatic variables

| 变量 | 含义 |
|------|------|
| `$@` | 当前规则的目标名 |
| `$^` | 所有依赖（去重） |
| `$<` | 第一个依赖 |
| `$?` | 比目标新的所有依赖 |
| `$*` | 匹配模式中 `%` 的部分 |

## Pattern rules

```make
%.o: %.c
\t$(CC) $(CFLAGS) -c $< -o $@
```

## Phony targets

不对应真实文件的命令目标，应声明为 `.PHONY`：

```make
.PHONY: clean all
```

## Related concepts

- [[concepts/Build System|Build System]] — 编译、链接、测试等构建流程的自动化工具
- [[concepts/CMake|CMake]] — 跨平台构建系统生成器
- [[concepts/CMake Dependency Management|CMake Dependency Management]]

## Sources

- [[sources/src-makefile|src-makefile]]
- [[language/Makefile tutorial]]
