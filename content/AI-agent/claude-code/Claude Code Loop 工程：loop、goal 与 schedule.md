---
title: Claude Code Loop 工程：/loop、/goal 与 /schedule
tags:
  - claude-code
  - agent
  - loop-engineering
  - 工具链
created: 2026-07-25
updated: 2026-11-17
aliases: []
---



> [!abstract] 一句话总结
> `/loop`、`/goal`、`/schedule` 是 Claude Code "loop engineering"（循环工程）的三个核心原语，让 Claude 不用逐条 prompt、自己持续干活；`/background` / `claude --bg` 则能把整个会话脱离终端持续执行。
> **核心区别只有一句话：`/loop` 由时钟驱动，`/goal` 由完成条件驱动，`/schedule` 是正式的调度系统（可跨 session / 跨关机存活），后台会话则适合一次性的长任务。**

---

## 0. 背景：什么是 Loop Engineering

Anthropic 在 2026 年 6-7 月官方提出 "loop engineering" 概念：不再逐条 prompt 驱动 Claude，而是设计**循环**——由系统自动发起下一步、自动判断何时停止。

官方把 loop 分为四类（自动化程度从低到高）：

| 类型 | 触发方式 | 停止条件 | 适用场景 |
|---|---|---|---|
| **Turn-based** | 人工逐条 prompt | 每个 turn 结束即停 | 日常交互 + 显式验证步骤 |
| **Goal-based** | 上一个 turn 一结束 | 模型确认条件满足 | 有可验证终点的实质工作（`/goal`） |
| **Time-based** | 时间间隔到达 | 手动停止或工作完成 | 轮询、周期检查（`/loop` / `/schedule`） |
| **Proactive** | 事件或 schedule 触发，无实时人工 | 每次任务目标达成即退出 | 长时间无人值守任务流（以上原语的组合） |

> [!tip] Boris Cherny（Claude Code 负责人）的观点
> 他已经不再直接 prompt Claude，而是设计 loop 来 prompt 模型并决定后续动作。工程师的职责从"写代码"转向"设计验证和停止条件"。

---

## 1. /loop —— 定时重复执行

### 基本用法

```bash
/loop 5m check if the deployment finished and tell me what happened
```

- 每 5 分钟重新触发一次这个 prompt，直到按 `Esc` 停掉
- 不给间隔时，Claude 根据"有没有新动静"自己决定下一次唤醒时机（1 分钟～1 小时）
- 底层实现：转成 schedule（session 级定时任务），自 v2.1.72 起可用

### 关键特性

- **活在终端 session 里，关了终端就死**。要关机后还能跑的定时任务用 `/schedule`（云端 routine）
- 限制：每个 session 最多 50 个任务、7 天过期、最小间隔 1 分钟、只在 session 空闲时触发
- **Jitter（抖动）**：为避免所有 session 同一时刻打 API，周期任务最多可延迟 30 分钟触发（间隔小于 1 小时的最多延迟半个间隔）
- **Fallback wakeup**：自节奏模式下，如果一轮结束后 Claude 既没有重排期也没有调用停止机制，会自动安排约 20 分钟后再检查一次

### 适合场景

轮询类工作——盯 CI、看 PR review 反馈、部署进度监控。**触发靠节奏、不靠完成度**的事。

---

## 2. /goal —— 干到条件满足为止

### 基本用法

```bash
/goal All tests pass and the final `npm test` result is shown in the conversation, or stop after 20 turns
```

给出完成条件后，Claude 会在当前会话里跨轮工作。自 v2.1.139 起可用。

### 机制上值得注意的三点

1. **由另一次模型调用判断是否达标**。底层是会话级的 Stop hook。每轮结束时，Claude Code 将目标和对话记录交给评估模型（默认 Claude Haiku）。尚未达标就把理由交给 Claude，进入下一轮。达标则清除目标并记为成功，判定目标无法达成则清除并记为失败。可通过 `ANTHROPIC_DEFAULT_HAIKU_MODEL` 指定小模型，该设置也影响 Claude Code 中其他使用小模型的功能。

2. **评估模型根据对话里的证据判断**。它无法自行跑测试或读文件，所以完成条件可以要求 Claude 把测试结果、失败数量或退出码展示在对话里。

3. **轮数或时长可以写进条件**。例如 `or stop after 20 turns`，由 Claude 报告进度，评估模型据此判断。连续多轮没有工具调用时，Claude Code 也可能暂停循环并保留目标。

### 适合场景

有可测量终点的重活：迁移模块直到所有调用点编译通过、清完一个 issue 队列、重构到文件低于某个行数上限。

### Ralph Loop 与 /goal 的区别

Ralph Loop 把「Agent 结束一轮后，用户再发消息催它继续」自动化。比如 Claude 修了 10 个失败测试里的 6 个就汇报进度，循环可以自动发起下一轮。

- **Geoffrey Huntley 的原版**用 Bash 循环，每轮重新启动 Agent。各轮使用新的对话上下文，代码、Git diff 和进度文件留在工作目录里，供下一轮接着做。外层脚本可加测试验收与轮数上限。[Huntley 原文](https://ghuntley.com/ralph/)
- **Claude Code 的 `/ralph-loop` 插件**在当前会话续跑。用户用 `--completion-promise "DONE"` 约定标记，由干活的 Claude 在回复里输出 `<promise>DONE</promise>`。Stop hook 匹配到标记就结束循环。没匹配到就重送原提示词，达到 `--max-iterations` 设置的上限也会停。[插件说明](https://claude.com/marketplace/plugins/ralph-loop) · [Stop hook 源码](https://github.com/anthropics/claude-plugins-official/blob/main/plugins/ralph-loop/hooks/stop-hook.sh)
- **`/goal`** 也在当前会话续跑。如果 Claude 修了 6 个就误报 `DONE`，插件会接受这个标记。若 `/goal` 的评估模型从对话里看到还有 4 个失败，就会说明原因并让 Claude 继续。[Claude Code 官方文档](https://code.claude.com/docs/en/goal#how-evaluation-works)

[[KDA：Agent 驱动的 CUDA Kernel 开发工作流]] 里的 RLCR 则在 Claude 尝试结束时调用 Codex 独立评审，并把未通过的意见交回原会话。

---

## 3. /schedule —— 定时任务管理入口

让 prompt 或任务在未来某个时间点（或周期性）自动运行。处理的是 `/loop` 和 `/goal` 解决不了的问题：**session 存活时间和持久性**。

### 两类定时任务

#### 3.1 Session 内定时任务（cron 工具）

```bash
/schedule "every day at 9am check my email and summarize anything urgent"
```

- 最小粒度 1 分钟，只在 session 空闲时触发（不打断正在跑的 turn）
- 7 天硬上限到期；session 重启后可恢复
- 限制：每 session 最多 50 个、每项目最多 25 个
- 任务定义存在项目目录下，**team 成员 checkout 同一份配置即可共享**
- 需要 Claude Code v2.1.72+

#### 3.2 云端 Routine（OAuth 用户可用，research preview）

- 跑在 Anthropic 云端，**电脑关机、终端关掉也照样执行**
- 触发方式：schedule、API 调用、GitHub 事件
- 有每日运行上限（发布时参考值：Pro 5 次/天、Max 15 次/天、Team/Enterprise 25 次/天，**以 `claude.ai/settings/usage` 页面为准**，官方文档已不再印固定数字）
- 走订阅额度

### 管理子命令（增删改查）

```bash
/schedule "every day at 9am triage new issues"   # 创建
/schedule list                                   # 查看所有任务
/schedule update <task> "change to 8am"          # 修改
/schedule disable <task>                         # 暂停（不删）
/schedule enable <task>                          # 恢复
/schedule delete <task>                          # 删除
/schedule run <task>                             # 立即手动触发一次（测试用）
```

> [!warning] `disable` vs `delete`
> 暂停用 `disable`（可随时恢复），确定不要了才 `delete`。

---

## 4. 后台运行整个 Claude Code 会话

后台会话适合一次性的长任务：它是独立于终端的 Claude Code 进程，终端断开后仍会继续运行；和 `/loop` 的周期性触发、`/schedule` 的定时触发不是一回事。

### 启动、脱离与管理

从 shell 直接启动：

```bash
claude --bg "运行测试并修复失败项"
```

已在交互会话中时，用以下任一命令脱离（可额外发送一条指令）：

```text
/background 继续完成任务并运行测试
/bg
```

常用管理命令：

```bash
claude agents       # 总览后台会话及状态
claude attach <id>  # 在当前终端重新接入
claude logs <id>    # 查看近期输出
claude stop <id>    # 停止会话；记录与工作树仍保留
```

`claude agents`（Agent View）里可查看 Working / Needs Input / Idle / Completed / Failed 状态，并能直接回复或重新接入。任务完成且无人连接约一小时后，进程会被回收；会话记录仍在，下次 attach 时可从原有状态恢复。

> [!warning] 后台权限边界
> 后台 agent 没有交互式审批通道：需要新授权的工具调用会自动拒绝。涉及删除、推送、发布或外部消息时，先在前台授予合适权限，或等它提示后 attach 回去处理。

### 只把命令放到后台

这和后台会话不同。Claude Code 内的 Bash 命令可以异步运行，让主对话继续：直接要求 Claude "在后台运行"，或在运行中的 Bash 调用上按 `Ctrl+B`。用 `/tasks` 查看、接入或停止当前会话的后台任务。

- 在 tmux 中，`Ctrl+B` 是 tmux 前缀，需连续按两次 `Ctrl+B` 才会传给 Claude Code。
- 后台 Bash 任务会在 Claude Code 退出时自动清理；它不适合需要跨终端存活的服务。
- 若只是希望传统终端进程持续存活，`tmux` 仍然合适，见 [[命令行工具/tmux 快捷键]]。

### 实现机制：底下是个按需 supervisor，不是 disown（逆向分析）

社区逆向（[how-claude-code-works ch.21](https://github.com/Windy3f3f3f3f/how-claude-code-works/blob/main/en/docs/21-background-fleet.md)，基于 v2.1.88 泄露源码 + 2.1.202 二进制字符串）表明，关终端不死的原因不是简单的 `nohup`/进程组脱离，而是有一个 **per-user 的 supervisor 守护进程**接管了后台会话的生命周期：

- **按需启动、闲置自退**：第一次 `/bg` 或 `claude agents` 时才拉起；没有后台会话要管时自动退出（"nothing holding this daemon open"）。on-demand 起的实例不会顶掉正在管事的 daemon。
- **缩小版 systemd**：约 80 个 `tengu_bg_*` 事件名暴露了完整能力——worker 崩溃自动 respawn（带防重入确认）、孤儿进程 adopt 回 roster、内存紧张 retire 不重要的 worker、预热 spare worker 池省冷启动。
- **Attach 走 PTY 转发**：`claude attach` 是接管一个活进程的所有权（非恢复状态文件），因此与 `--resume` 互斥——同一 session 不能在两处同时被接管。
- **平台适配**：macOS 上有 `_daemon_macos_aqua_wrap`，daemon 不依赖图形会话存活。
- **总开关**：`CLAUDE_CODE_DISABLE_AGENT_VIEW=1`（managed settings 可统一关闭）能一次性关掉 `--bg`/`/background`/daemon 整套。

> [!warning] 证据边界
> session 内层（subagent 默认后台、`run_in_background`、task-notification 回调）在泄露源码里逐行可读；但 supervisor 的内部状态机只有二进制字符串依据，事件触发条件、roster 格式、PTY 传输协议均为推断层，非官方文档。

### 选型补充

| 需求 | 首选 |
| --- | --- |
| 一次性长任务，想释放当前终端 | `claude --bg` 或 `/background` |
| 当前会话内并发跑测试、dev server 等命令 | `Ctrl+B` / `/tasks` |
| 当前会话中周期性检查 CI、部署等外部状态 | `/loop` |
| 电脑关闭后仍须按计划运行 | `/schedule` 云端 routine |
| 单纯保持一个传统 shell 进程存活 | `tmux` |

---

## 5. 开启与停止：速查

### 各原语的控制方式

| 原语                        | 开启                   | 停止                                                       |
| ------------------------- | -------------------- | -------------------------------------------------------- |
| `/loop`                   | 带间隔运行即生效             | `Esc`；prompt 里自带 until 条件；关 session                      |
| `/goal`                   | 一条命令，session 级立即生效   | 评估模型判断达标或无法达成，满足条件中写明的停止条款，或手动 `/goal clear` |
| `/schedule`（session cron） | `/schedule "..."` 创建 | `disable` / `delete`；7 天自动过期；关 session                   |
| `/schedule`（云端 routine）   | `/schedule` 创建       | **必须**用 `disable` / `delete`，关终端不影响                      |

### 统一急停手段

- **Esc**：打断当前 turn（对 `/loop` 也是停止循环的常规方式）
- **退出 session**：清掉所有 session 作用域的东西（loop、goal、session 内 cron）——**云端 routine 除外**
- 云端 routine 是唯一"关了终端还活着"的，别忘了去 `/schedule` 里停

---

## 6. 可观测性：怎么查看当前 session 里活跃的东西

| 原语 | 查看方式 | 常驻状态显示 |
|---|---|---|
| `/goal` | 无参敲 `/goal` | ✅ `◎ /goal active` 指示器（实时显示运行时长） |
| `/schedule` | `/schedule list` | ❌ |
| `/loop` | 无参敲 `/loop` | ❌（已知缺陷，见下） |

### `/goal` 无参时的 status 输出

- 当前条件原文
- 已运行时长
- 已评估 turn 数
- 当前 token 消耗
- **评估器最近一次给出的理由**（"为什么还没达标"——判断它在稳步推进还是空转烧 token 的最快方式）

> [!bug] 已知坑：/loop 的可观测性最差
> loop 不出现在状态栏和 Ctrl+T 任务列表里（GitHub issue #31933）。有人 `/loop 5m /clear` 之后界面上完全看不出 loop 还活着，5 分钟后上下文被意外清掉。
> **目前现实：自己开了几个 loop 要自己记着，忘了就敲 `/loop` 查一下。**

### 辅助视图

- **Ctrl+T**：切换任务列表，看进行中的后台任务（不覆盖 loop）
- **`claude agents`（Agent View）**：跨 session 总仪表盘，看每个后台 session 是 Working / Needs Input / Idle / Completed / Failed

---

## 7. 对比速查表

| | `/goal` | `/loop` | Stop hook | `/schedule`（云端） |
|---|---|---|---|---|
| 下一 turn 何时开始 | 上一 turn 一结束 | 时间间隔到了 | 上一 turn 结束 | 云端定时触发 |
| 何时停止 | 模型确认条件满足 | 你手动停 | 你的脚本/prompt 决定 | 单次跑完或禁用 |
| 适合 | 有可验证终点的实质工作 | 轮询、周期检查 | 确定性自定义检查 | 关机后也要跑的活 |
| 存活范围 | session | session | session | 云端（跨关机） |

### 选型决策

- 有可验证终点（测试全绿、队列清空、分数达标）→ **`/goal`**
- 等外部系统变化（CI、部署、review）→ **`/loop`**
- 要在关机后运行（每日 triage、夜间检查）→ **`/schedule` 云端 routine**
- 完全自定义的确定性检查 → **Stop hook**

> [!warning] 最常见的误用
> 把 `/loop` 用在有终点的工作上：它只会按钟点盲目重跑，永远不知道自己早干完了，白白烧 turn。
> 把 `/goal` 用在等外部变化上：条件永远不可能靠 Claude 自己变真，空转到天荒地老。

---

## 8. 组合用法：Proactive Loop

三个原语可以组合成完整的无人值守工作流。官方博客的示例：

```plaintext
/schedule every hour: check #project-feedback for bug reports.
/goal: don't stop until every report found this run is triaged, actioned, and responded to.
When fixing a bug, use a workflow to explore three solutions in parallel worktrees
and have a judge adversarially review them.
```

组合链条：

1. **`/schedule`** 定时触发 routine 拉新报告
2. **`/goal`** 定义"做完"长什么样，**skills** 记录如何验证
3. **Dynamic workflows** 编排 agent 去 triage、修复、review
4. **Auto mode** 让 routine 不停下来要权限

---

## 9. 实践建议清单

- [ ] **条件必须可验证**："`npm test` 全绿且 `git status` 干净" ✅，"改进一下代码" ❌
- [ ] **永远加 turn 上限**：`or stop after N turns` 不是装饰
- [ ] **要求 Claude 在对话中展示验证证据**（评估器只能读 transcript）
- [ ] 无人值守时配合 **worktree / 分支隔离**改动
- [ ] 跑无人值守 goal 时定期敲 `/goal` 看评估器最近理由
- [ ] 明确审批边界：merge / deploy / publish / send / delete / 花钱之前要人工确认
- [ ] 把进度写到文件或 PR comment，让下一个 turn 有持久状态
- [ ] 开了几个 `/loop` 自己记着（可观测性缺陷）

---

## 10. 官方文档与延伸阅读

### 官方文档（code.claude.com）

- [Scheduled tasks（/loop、cron 工具、定时任务）](https://code.claude.com/docs/en/scheduled-tasks)
- [Keep Claude working toward a goal（/goal）](https://code.claude.com/docs/en/goal)
- [Routines（云端定时自动化）](https://code.claude.com/docs/en/routines)
- [Agent view（后台会话的启动、监控与重新接入）](https://code.claude.com/docs/en/agent-view)
- [Interactive mode（后台 Bash 命令与 `Ctrl+B`）](https://code.claude.com/docs/en/interactive-mode)
- [Changelog（功能更新最先同步的地方）](https://code.claude.com/docs/en/changelog)
- [Agent SDK：How the agent loop works（底层 agent loop 机制）](https://code.claude.com/docs/en/agent-sdk/agent-loop)

### 官方博客（claude.com）

- [Loop engineering: Getting started with loops](https://claude.com/blog/getting-started-with-loops)（四种 loop 类型的官方定位）
- [Introducing routines in Claude Code](https://claude.com/blog/introducing-routines-in-claude-code)
- [Building verification loops in Claude Code with skills](https://claude.com/blog/building-verification-loops-in-claude-code-with-skills)

### 社区深度分析

- [Addy Osmani: Loop Engineering](https://addyosmani.com/blog/loop-engineering/)（Codex vs Claude Code 原语对比）
- [The Ralph Loop and /goal: What Claude Code Actually Automated](https://ranjankumar.in/ralph-loop-claude-code-goal-autonomous-coding)（/goal 的机制批评）
- [When to use /goal vs. /loop in Claude Code](https://desktheory.com/workflows/goal-vs-loop-claude-code)
- [Claude Code /loop vs /goal: When to Use Each Agent Loop](https://ailooplibrary.com/claude-code-loop/)

> [!info] 时效性提醒
> `/schedule` 云端 routine、Dynamic workflows 等均为 research preview，限制和行为可能随时变化。以 [Changelog](https://code.claude.com/docs/en/changelog) 和 `claude.ai/settings/usage` 页面为准。

---

## 相关笔记

- [[Cursor Agent Best Practice]]——另一种 Agent 工作流的最佳实践

### 待写

- Claude Code 常用命令速查
- vLLM Profiling 工作流
- AI 编程工具链评估
