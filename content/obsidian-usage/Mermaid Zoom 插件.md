---
title: "Mermaid Zoom 插件"
tags:
  - obsidian
  - tool
---

# Mermaid Zoom 插件

Obsidian 社区插件，为 Mermaid 图表添加缩放和平移功能。

GitHub：[xiaozhuang0433/mermaid-zoom](https://github.com/xiaozhuang0433/mermaid-zoom)

## 安装

1. 从 [Releases](https://github.com/xiaozhuang0433/mermaid-zoom/releases) 下载最新版本
2. 解压到 `<vault>/.obsidian/plugins/mermaid-zoom/`
3. 设置 → 第三方插件，启用 "Mermaid Zoom"

## 操作方式

| 操作 | 方式 |
|------|------|
| 缩放 | 鼠标悬停在图上，滚轮滚动 |
| 拖拽平移 | 鼠标点击拖拽 |
| 全屏 | 点击图表右下角 `⛶` 按钮 |

图表右下角会出现 4 个控制按钮：`+` 放大、`-` 缩小、`⟲` 重置、`⛶` 全屏。

## 修改最大缩放倍率

默认缩放范围为 10%–500%，在插件源码 `main.ts` 中硬编码：

```typescript
private readonly defaultMinScale = 0.1;   // 10%
private readonly defaultMaxScale = 5;     // 500%
private readonly defaultScale = 1;        // 100%
```

缩放时通过 `Math.max / Math.min` 强制夹住，没有用户可配置的设置项。

要修改最大缩放倍率，直接编辑 vault 中的插件文件：

```
<vault>/.obsidian/plugins/mermaid-zoom/main.js
```

搜索 `maxScale` 或 `defaultMaxScale`，把 `5` 改成想要的值（如 `10` = 1000%），然后重新加载插件。

> ⚠️ 插件更新会覆盖修改，需重新改一次。
