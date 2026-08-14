---
title: DeepSeek Harness 四种 Agent 模式
tags:
  - ai-agent
  - deepseek-harness
  - cordis
aliases:
  - DSH 四种模式
  - PTC 模式
created: 2026-08-14
description: DeepSeek Harness（DSH）中标准、PTC、极简、创造四种 Agent preset 的能力差异、机制与适用场景。
---

# DeepSeek Harness 四种 Agent 模式

DeepSeek Harness（DSH）里的四种模式，本质上是四个内置的 **agent preset（智能体预设）**。一个 preset 由一份 `agent.cordis.yml` 组装文件声明，决定这个会话挂载哪些插件、模型能看到哪些工具、收到哪些系统提示词段落，以及运行时是否能自修改。

它们不是四个不同模型，也不是四套权限模型；更像四套“Agent 能力装配方案”。底层框架是 Cordis：DSH 把工具、服务、事件、生命周期都做成插件，再按 preset 组装给会话使用。相关背景见 [[LLM Wiki]] 中“Obsidian 是 IDE，LLM 是程序员，wiki 是代码库”的插件化思路；这里则是“Harness 是运行时，preset 是装配单”。

> [!note] 资料来源
> 本文整理自本机安装的 `@deepseek-ai/dsh` 配置：`config/agent-presets/{standard,code,cordis,minimal}/agent.cordis.yml` 与 `preset.yml`，以及 `@deepseek-ai/dsh-agent-presets`、`@deepseek-ai/cordis`、`@deepseek-ai/dsh-agent-tool-presentation` 的包内 README。外部介绍参考了 [DeepSeek Harness 开发者预览版报道](https://finance.sina.cn/2026-08-14/detail-ininfrtu4259350.d.html?vt=4&wm=3200_0001&cid=79649&node_id=79649) 和 [DeepSeek Harness 完全指南](https://www.cnblogs.com/sing1ee/p/22455466)。

## 总览

| 模式     | preset id  | 一句话定位                  | 核心特征                                                  | 适合场景                            |
| ------ | ---------- | ---------------------- | ----------------------------------------------------- | ------------------------------- |
| 标准模式   | `standard` | 功能完整的编码 Agent          | 文件编辑、Shell、检索、Skills、Plan、Goal、子代理、Workflow 全都有       | 日常编码、项目修改、问题排查                  |
| PTC 模式 | `code`     | 用程序组合工具调用的编码 Agent     | 标准能力 + Code Mode SDK；模型写 TypeScript 程序批量调用工具          | 多步骤、批量、可编排的任务                   |
| 极简模式   | `minimal`  | 双工具轻量 Agent            | 只有持久 bash 与 `str_replace_editor`；无 Skills、子代理、Web、压缩等 | 最小环境、基准测试、想要极简提示词               |
| 创造模式   | `cordis`   | 能创建/调试 preset 的元 Agent | 标准能力 + Cordis 运行时工具 + preset 创作指导                     | 创建自定义 preset、试验插件、修改 Harness 组装 |

UI 上的排序是：标准、PTC、创造、极简；配置中的 `order` 分别为 1、2、4、3。

## preset 是怎么工作的

每个 preset 目录主要包含两个文件：

- `preset.yml`：展示名称、描述、排序等元信息，例如 `name: PTC 模式`。
- `agent.cordis.yml`：真正的组装文件，列出要挂载的插件行。

例如，标准模式会挂载：

- `@deepseek-ai/dsh-tool-bash`：Shell 工具；
- `@deepseek-ai/dsh-tool-fs` / `dsh-tool-fs-search`：文件读写、编辑、glob/grep；
- `@deepseek-ai/dsh-tool-skill`：Skills；
- `@deepseek-ai/dsh-plan-mode`：Plan Mode；
- `@deepseek-ai/dsh-tool-goal`：长任务目标；
- `@deepseek-ai/dsh-tool-subagent` / `dsh-tool-workflow` / `dsh-tool-ralph`：委派与工作流；
- `@deepseek-ai/dsh-tool-web`：网页搜索；
- `@deepseek-ai/dsh-compaction-basic`：上下文压缩。

DSH 的 agent preset roster 会把同一份 preset 常驻挂载一次，多个会话通过 scope 父链共享这份工具和提示词注册。会话自己的状态仍按 Session/Agent 分键保存，所以不会串扰。

一个重要产品规则是：**会话一旦开始产出内容，就不能切换 preset**。因为切换 preset 会替换模型可见的工具集，导致历史中的工具调用无法按新工具集重放。空白会话可以切换；修改默认 preset 只影响之后新建的会话。

## 1. 标准模式（standard）

标准模式是四个模式的基线，定位是“功能完整的编码 Agent”。它的 `preset.yml` 描述为：

> 功能完整的编码 Agent，支持文件编辑、Shell、文件与网页检索、Skills、计划、目标、子代理和工作流。

它提供的能力可以按层次理解：

1. **执行与编辑**：Shell、文件读写、精确编辑、glob/grep 搜索。
2. **任务管理**：todo 列表、goal 长任务、后台任务收集与终止。
3. **规划与审查**：Plan Mode 中先探索、写完整方案，再经用户批准后执行。
4. **委派与并行**：subagent、subagent fork、workflow、Ralph loop。
5. **知识扩展**：Skills、web search。
6. **上下文管理**：compaction、工具结果裁剪、`/compact`。

如果不知道该选哪个，标准模式通常是默认选择。

## 2. PTC 模式（code）

PTC 是 **Programmatic Tool Calling** 的缩写，中文可译为“程序化工具调用”。它的配置目录叫 `code`，UI 名称叫 `PTC 模式`。

它和标准模式的唯一组装差异，是多了这一段工具呈现配置：

```yaml
- id: tool-presentation
  name: '@deepseek-ai/dsh-agent-tool-presentation'
  config:
    mode: code
```

这段配置的含义不是增加一批新工具，而是改变工具的呈现方式：

- 标准模式下，模型看到每个工具的 schema，一次模型响应可以直接调用一个或多个工具；工具结果回来后，模型再决定下一步。
- PTC 模式下，模型通过一份生成的 TypeScript SDK 看到工具，直接调用其他工具会被解析为 `UNKNOWN_TOOL`；它需要写一段程序，并通过 `run_code` 执行。

因此，PTC 模式的典型形态是：

```ts
const files = await glob("**/*.md")
for (const file of files) {
  const content = await read(file)
  if (content.includes("TODO")) {
    await edit(file, ...)
  }
}
```

它把普通工具调用中的循环、条件、变量和错误处理，交给程序结构表达。潜在收益是减少多轮 tool-calling 往返，让多步操作更紧凑；代价是它更依赖模型写代码和调试 SDK 的能力，也可能让简单任务显得“绕”。

这个名字确实有点学术化：它强调的是“工具调用从逐条消息变成程序控制”，但从用户角度看，叫“代码模式 / 脚本编排模式”可能更直观。

## 3. 极简模式（minimal）

极简模式的定位是“仅提供持久 bash 与 str_replace_editor 的双工具编码 Agent”。它和标准模式不是增减几项小工具，而是大幅收窄提示词和工具面：

- persona 是完整系统提示，`complete: true`，不再叠加全局身份、Web 指引和运行时上下文；
- `includeRuntimeContext: false`，不注入运行时上下文快照；
- 不挂载 Skills、Plan Mode、Goal、Subagent、Workflow、Web Search、Ask User、Todo、Compaction；
- 文件系统使用本地 fs provider；
- 只有两个核心工具：持久 bash 和字符串替换编辑器。

持久 bash 带 PTY，状态跨命令保持；`str_replace_editor` 通过精确字符串替换编辑文件。

这个模式适合：

- 想要最小提示词、最小工具集；
- 做模型或 Agent 基准测试；
- 只需要“终端 + 编辑器”的工作流；
- 希望减少工具噪声和攻击面。

但它也意味着模型不能自己搜索网页、不能委派子代理、不能自动压缩上下文，需要用户更多地显式驱动。

## 4. 创造模式（cordis）

创造模式的目录名是 `cordis`，定位是“用于创建自定义 Agent preset”。它包含标准模式的全部能力，并额外加入：

- `@deepseek-ai/dsh-tool-cordis`：读取和操作当前 Cordis 运行时；
- preset 创作指导 persona：区分 HOST 组装与 AGENT PRESET 两个平面；
- 一份随 preset 分发的 composition authoring skill，指导如何写 `agent.cordis.yml`。

这里的 **Cordis** 是 DSH 使用的 TypeScript 插件框架，提供 Context、Service、Plugin、Fiber、Events 等机制。DSH 的工具、服务、事件监听器和生命周期清理都建立在它上面。

创造模式的 persona 会告诉 Agent：

- HOST 组装保存跨会话共享的东西，例如注册中心、沙箱、审批栈、持久化、模型路由、subagent registry；
- AGENT PRESET 保存单个会话贡献的工具、人设和提示词段落；
- 自定义 preset 应写到 `${DSH_HOME:-$HOME/.dsh}/.agent-presets/<id>/`；
- 不要直接改随安装包提供的 preset，因为升级会覆盖，且改坏 `cordis` preset 可能禁用创造模式本身。

这是四个模式里权限最高的一个。DSH 源码注释明确提醒：`cordis_mount` 会在实时运行时中执行模型写的 JavaScript，而模型写出的 composition 可能被其他会话挂载，所以应把这个模式的会话视为等同于 shell 访问权限。它适合受信任用户开发自定义 Agent，不适合处理不可信输入。

## 怎么选

- **日常写代码 / 排查问题**：选标准模式。工具最全，行为也最符合常见 coding agent 预期。
- **批量、多步骤、可程序化任务**：可以试 PTC 模式。它适合“写一段程序串起多个工具”的任务，但简单任务未必比标准模式更自然。
- **最小环境 / benchmark / 低噪声**：选极简模式。只保留 shell 和编辑器，提示词也最短。
- **想造新的 Agent preset / 调试 DSH 插件**：选创造模式。它能观察和修改运行时组装，但风险也最高。

## 一个心智模型

可以把四种模式理解成同一辆 Harness 车上的四套驾驶舱：

- 标准模式：完整仪表板，所有按钮都在；
- PTC 模式：不是多加按钮，而是给你一个脚本控制台，用程序批量按按钮；
- 极简模式：只留方向盘和档把；
- 创造模式：打开发动机盖，允许你改装驾驶舱本身。

它们共享同一套底层插件框架，差别是 preset 给会话装配哪些插件、以什么形式暴露工具，以及是否允许触碰运行时自身。
