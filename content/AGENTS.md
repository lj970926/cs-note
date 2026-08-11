# content/ —— 笔记库工作指令

本文件是 `content/` 目录下的**内容层**指令，告诉 AI Agent（Claude Code 等）如何检索、引用和维护这个笔记库。

仓库级规则（Quartz 命令、git 规范、发布流程、co-author trailer、AI 提交前是否跑检查等）以父级 [`../AGENTS.md`](../AGENTS.md) 为准，本文件只补充与笔记内容相关的约定。两者冲突时，父级管"代码与发布"，本文件管"内容与笔记"。

这个 vault 采用 [LLM Wiki](AI-agent/LLM%20Wiki.md) 模式：你（Agent）是 wiki 的维护者，Obsidian 是 IDE，笔记是代码库。回答前先检索已有笔记，把有价值的成果在用户要求时沉淀回笔记。

---

## 一、回答问题前先检索（Query 工作流）

**不要凭空回答**。vault 里已有 130+ 篇笔记，回答前按下面的顺序找依据：

1. **先读 `.agent/index.md`**：这是整个 vault 的目录，每页一行摘要、按主题分组。用它快速判断该进哪个文件夹、读哪些笔记。
2. **再检索**：用 Grep/Glob 在 `content/` 下搜索关键词——中英文术语都要试（如「动态链接」和 `PLT/GOT`、「投机解码」和 `speculative decoding`），并考虑标签和 aliases。命中后用 Read 读相关段落。
3. **综合作答并引用来源**：回答里用 `[[笔记标题]]` 链接到用到的笔记（vault 用 wikilink，见下），让用户能点回原文。多个来源就列多个。
4. **没有就明说**：如果 vault 里没有相关笔记，直接告诉用户"以下是通用知识，vault 里暂无相关笔记"，**不要编造引用**。可以顺带建议是否要新建一篇笔记。

对跨多篇笔记的问题（对比、综述、演进脉络），多翻几篇再综合，这正是 wiki 模式的价值所在。

---

## 二、链接与格式约定

- **链接用 `[[wikilink]]`，不要用 markdown 链接**。vault 设置了 `useMarkdownLinks: false`，Obsidian 会在重命名时自动更新 wikilink。
  - 普通链接：`[[vllm 源码随手记]]`
  - 别名显示：`[[traits|Rust Traits]]`
  - 带路径消歧义：`[[system-programming/x86 registers]]`
  - 引用章节：`[[Mermaid 使用指南#1. 流程图（Flowchart）]]`
- **标签写在 YAML frontmatter 的 `tags:` 列表里**，不要写行内 `#tag`（vault 里行内 `#` 基本都是 `#include`、shell 注释等误匹配）。
- **`aliases` 也是链接目标**：给笔记加别名后，`[[别名]]` 就能链过来。
- frontmatter 语法参考笔记 [Obsidian Frontmatter 格式参考](obsidian-usage/Obsidian%20Frontmatter%20格式参考.md)。
- 保持 Obsidian 风味 Markdown：callouts（`> [!note]`）、wikilink、嵌入图片、Excalidraw、Mermaid 等都不要破坏。
- **保留中文文件名和文件夹名**，不要把中文标题改成英文 slug。

---

## 三、什么时候可以写笔记

**保守策略**：只有当用户**明确要求**时才写入笔记——例如"记一下"、"存成笔记"、"写成一篇"、"更新到某某笔记里"。日常回答问题时只读不写，不要自动新建或修改笔记。

写入分两种：

### 新建笔记

新笔记必须满足：

- **Frontmatter 齐全**（与 `scripts/prepare-new-content-notes.mjs` 自动补齐的字段一致，手写齐可减少脚本改动）：
  ```yaml
  ---
  title: 笔记标题              # 等于文件名（不含 .md）
  tags:                       # 块级列表，至少一个有意义的标签
    - mlsys
    - inference
  aliases: []                 # 有别名时填，否则空列表
  created: YYYY-MM-DD         # 今天的日期
  # 可选：description / source / updated / author
  ---
  ```
- **文件名用可读标题**：
  - 保留中文，可中英混排，如 `PLT-GOT-动态链接.md`、`AddressSanitizer (ASan) 使用指南.md`。
  - 设计模式等约定俗成的对照用 `中文名 (English Name).md`，如 `策略模式 (Strategy).md`。
  - **不要**日期前缀（日期放 frontmatter）、**不要** kebab-case slug。
- **放进对应主题文件夹**：`MLSys/`、`paper/`、`source-code/`、`语言/`、`设计模式/`、`命令行工具/`、`system-programming/`、`AI-agent/`、`其他/` 等。需要新建顶层文件夹时先问用户。
- **正文至少加一个有意义的 `[[wikilink]]`** 指向相关的已有笔记，把新笔记织入知识网。没有自然关联就留空，**不要凑弱链接**。链接目标必须真实存在（失效 wikilink 是 blocker，会被 `content:check-notes` 拦下）。
- **附件**放 `assets/` 下镜像路径，如 `assets/paper/<论文标题>/`、`assets/source-code/vllm/...`。正文用 `![[图片名.png]]` 嵌入。

### 更新已有笔记

- 小到补充一个段落、加一个 wikilink，大到修订摘要、补全新视角、**标注新旧资料的矛盾**（LLM Wiki 的 ingest 思路）。
- 尊重原文风格，不要把用户的文字大改成你的腔调。
- **不要批量重格式化**所有笔记；不要"顺手"重命名拼写不一致的旧文件（如 `Hwo to write a skill.md`），先问用户。

### 写完之后

1. 更新 `.agent/index.md`：新增或修订对应条目的一行摘要。
2. 在 `.agent/log.md` 追加一条记录，格式 `## [YYYY-MM-DD] note | 笔记标题`（更新用 `update`，收录外部资料用 `ingest`）。
3. 新建笔记后，可在仓库根目录跑 `npm run content:prepare-notes`（会补 frontmatter 并检查 wikilink）——但按父级约定，AI 提交前默认不主动跑 `npm run check`/`test`/`build`，除非用户要求或改动确实需要验证。

---

## 四、私有与不发布内容

`quartz.config.yaml` 的 `ignorePatterns` 已排除以下路径，它们不发布到网站：

- `private/`、`templates/`、`.obsidian/`、`.agent/`，以及根目录的 `AGENTS.md`、`CLAUDE.md`。
- frontmatter 含 `draft: true` 的笔记会被构建移除（需要时用来暂存草稿）。
- 加密页用 `password` 字段（见站点配置）。

**Agent 自己的工作文件（index、log 等）一律放 `.agent/`**，不要散落到内容目录。

---

## 五、不要做的事

- 不要编辑 `public/`（构建产物，重新 build 生成）。
- 不要删除 `.obsidian/`、`.claude/` 等工具元数据。
- 不要改 `quartz.config.yaml` 去影响发布/路由，除非用户明确要求。
- 不要在用户没要求时自动写笔记、自动建索引以外的文件。
- 不要把对话里的临时分析当成事实写进笔记——写入的内容应是经过整理、可复用的。

---

## 六、主题地图（速览）

详细目录见 [`.agent/index.md`](.agent/index.md)。主要板块：

- **MLSys/**：LLM 推理/训练——vLLM、注意力（FlashAttention/Linear/RoPE）、量化、MoE、KV cache、PD 分离、算子。
- **paper/**：论文笔记（DeepSeek-V3、FlashAttention、SGLang、DFlash/DSpark 等）。
- **source-code/**：源码阅读——vLLM、brpc、folly、Linux 0.11、PyTorch、Paddle 等。
- **语言/**：C++、Rust、Python、CMake、shell、Mermaid。
- **设计模式/**：GoF 设计模式与设计原则。
- **命令行工具/**：git、tmux、grep、ssh、uv、clang-format 等。
- **system-programming/**：x86 寄存器、PLT/GOT 动态链接、启动过程。
- **AI-agent/**：Claude Code、Cursor、skill 编写、LLM Wiki。
- **其他/**：效率方法论（GTD、深度工作）、调试思维、源码阅读方法论、生活。
