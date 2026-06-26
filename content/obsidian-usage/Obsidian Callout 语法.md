---
title: Obsidian Callout 语法
description: Obsidian 中 Callout（标注框）的完整语法参考
tags:
  - obsidian
  - markdown
---

# Obsidian Callout 语法

## 基本格式

```markdown
> [!type] 可选标题
> 内容正文
> 支持多行
```

- `type` 决定样式和图标（`note`、`tip`、`warning` 等）
- 标题可省略，省略后只显示内容区域
- 内容支持标准 Markdown（列表、代码块、链接等）

## 所有内置类型

| 类型         | 用途     | 别名                     |
| ---------- | ------ | ---------------------- |
| `note`     | 普通笔记   | `see also`             |
| `abstract` | 摘要/概览  | `summary`, `tldr`      |
| `info`     | 信息说明   | —                      |
| `todo`     | 待办事项   | —                      |
| `tip`      | 提示/技巧  | `hint`, `important`    |
| `success`  | 成功/通过  | `check`, `done`        |
| `question` | 疑问/问题  | `help`, `faq`          |
| `warning`  | 警告     | `caution`, `attention` |
| `failure`  | 失败/错误  | `fail`, `missing`      |
| `danger`   | 危险/严重  | `error`                |
| `bug`      | Bug 标记 | —                      |
| `example`  | 示例     | —                      |
| `quote`    | 引用     | `cite`                 |

每个类型会自动显示对应的图标和颜色。

## 折叠控制

在类型后加 `-` 可默认折叠，加 `+` 可默认展开（用户可手动切换）：

```markdown
> [!tip]- 点击展开查看详情
> 默认隐藏的内容

> [!info]+ 默认展开
> 可手动收起
```

## 自定义标题

```markdown
> [!note] 我的自定义标题
> 正文内容
```

## 嵌套 Callout

```markdown
> [!note] 外层
> > [!tip] 内层
> > 嵌套内容
```

## 实际用法示例

### 警告提醒

```markdown
> [!warning] 注意
> 此操作不可逆，请提前备份数据。
```

### 待办事项

```markdown
> [!todo] 还需要做的事
> - [ ] 补充 API 文档
> - [ ] 添加单元测试
```

### 引用笔记

```markdown
> [!quote] 来源：《思考快与慢》
> 我们的大脑有两种思维模式：系统1是快速直觉的，系统2是慢速理性的。
```

---

> [!tip]
> 在 Obsidian 中输入 `>` 后按空格，编辑器会自动提示 Callout 类型补全。
