---
aliases: []
tags: []
created: 2026-06-10
---

# Obsidian Frontmatter 格式参考

Frontmatter 是 YAML 格式的元数据块，放在 Markdown 文件的最顶部，用 `---` 包裹。Obsidian 会自动识别并用于搜索、插件查询、图表关系等。

---

## 基本语法

```yaml
---
key: value
---
```

- 必须在文件**第一行**（前面不能有空行）
- 用 `---` 开头和结尾
- 内部遵循 [YAML 语法](https://yaml.org/)

---

## 常用字段类型

### 1. 字符串

```yaml
title: 我的笔记
author: "张三"
status: draft
```

单行字符串不需要引号；含特殊字符（`:`、`#`、`[`等）时加引号。

### 2. 数字

```yaml
rating: 5
priority: 3
```

### 3. 布尔值

```yaml
published: true
archived: false
```

### 4. 日期

```yaml
created: 2026-06-10        # 标准格式，推荐
due: 2026-12-31
```

Dataview 插件可识别这种 `YYYY-MM-DD` 格式并支持日期比较查询。

### 5. 列表（数组）

```yaml
# 多行写法（推荐）
tags:
  - daily
  - project
  - idea

# 单行写法
tags: [daily, project, idea]
```

### 6. 别名

```yaml
aliases:
  - 短名称
  - 英文名
  - Old Title
```

Obsidian 会将 aliases 也纳入链接搜索，`[[短名称]]` 能跳转到本笔记。

### 7. 嵌套对象

```yaml
related:
  - "[[笔记A]]"
  - "[[笔记B]]"

meta:
  source: https://example.com
  author: 张三
```

### 8. 嵌套列表对象

```yaml
people:
  - name: 张三
    role: PM
  - name: 李四
    role: Engineer
```

Dataview 支持 `FLATTEN people` 来查询嵌套字段。

---

## Obsidian 特有字段

| 字段 | 用途 | 示例 |
|------|------|------|
| `aliases` | 笔记别名，用于搜索和链接 | `aliases: [MCU, 微控制器]` |
| `tags` | 标签（和 `#tag` 等价） | `tags: [cs/os, linux]` |
| `cssclass` | 控制笔记渲染样式 | `cssclass: wide-page` |
| `publish` | Obsidian Publish 控制 | `publish: true` |
| `position` | Canvas（白板）专用 | 内部使用 |

---

## Dataview 常用属性模式

```yaml
---
status: active          # ongoing / done / abandoned
priority: high          # low / medium / high / critical
rating: 4               # 1-5 星
created: 2026-01-15
updated: 2026-06-10
due: 2026-07-01
project: "[[项目X]]"
area: work              # work / personal / study
type: note              # note / article / paper / meeting
source: "https://..."
---
```

配合 Dataview 查询示例：

```dataview
TABLE status, due, priority
FROM #project
WHERE status != "done"
SORT due ASC
```

---

## 层级标签（嵌套标签）

```yaml
tags:
  - mlsys/inference
  - mlsys/training
  - cs/os/linux
```

Obsidian 和 Dataview 都支持层级标签：搜索 `#mlsys` 会匹配所有 `mlsys/` 下的子标签。

---

## 注意事项

1. **YAML 大小写敏感**：`Tags` 和 `tags` 是不同的 key
2. **列表项含特殊字符要加引号**：
   ```yaml
   related:
     - "[[笔记含:冒号]]"    # 冒号需要引号
     - "[[普通笔记]]"       # 纯文本无需引号
   ```
3. **不要用 Tab 缩进**：YAML 只认空格（通常 2 格）
4. **空值**：`key:` 表示 null，`key: ""` 表示空字符串
5. **多文档分隔**：同一个 YAML 块中不要出现 `---`（会被误判为结束标记）
6. **字段名建议全小写**：Obsidian 内建字段均为小写，自定义字段保持一致更规范

---

## 一个完整的模板

```yaml
---
title: 笔记标题
aliases:
  - 别名A
  - 别名B
tags:
  - permanent-note
  - cs/network
created: 2026-06-10
updated: 2026-06-10
status: active
priority: medium
rating: 4
source: "https://example.com/article"
related:
  - "[[相关笔记1]]"
  - "[[相关笔记2]]"
cssclass: wide-page
---
```
