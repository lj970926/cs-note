---
title: Quartz Mermaid 排错手册
tags:
  - tool
  - markdown
  - quartz
  - debug
---

# Quartz Mermaid 排错手册

这篇记录一次 Quartz v5 里 Mermaid 11.4.0 渲染失败的排查过程。以后如果页面上只看到 `Syntax error in text / mermaid version 11.4.0`，可以按这里的顺序排。

相关笔记：[[Mermaid 使用指南]]、[[vllm 源码随手记]]。

## 先分清是哪一层的问题

Mermaid 在 Quartz 里大概经过三层：

1. Markdown 原文里的 `mermaid` 代码块。
2. Quartz build 生成的 HTML 里的 `<code class="mermaid">`。
3. 浏览器加载 Mermaid ESM 后调用 `mermaid.run({ nodes })`，把代码块替换成 SVG。

只跑 Node 里的 `mermaid.parse()` 不够。它可能返回 OK，但浏览器里的 `mermaid.run()` 仍然报错。真正可信的是在浏览器里对页面 DOM 跑同版本 Mermaid。

## 本地复现工具

可以在临时目录安装同版本 Mermaid，不污染仓库依赖：

```bash
mkdir -p /private/tmp/mermaid-debug
cd /private/tmp/mermaid-debug
npm install mermaid@11.4.0 jsdom@24
```

如果要验证 Quartz 页面本身，优先用真实浏览器或 headless Chrome 打开本地页面，再抓控制台异常。Quartz 页面使用的是 CDN 上的：

```text
https://cdnjs.cloudflare.com/ajax/libs/mermaid/11.4.0/mermaid.esm.min.mjs
```

## 排查顺序

1. 先跑一次 Quartz build，确认不是 Markdown/Quartz 构建失败：

```bash
NODE_OPTIONS=--max-old-space-size=4096 node quartz/bootstrap-cli.mjs build
```

2. 在 `public/` 里查生成的 Mermaid 代码块是否还是原文：

```bash
rg -n "code class=\"mermaid\"|Syntax error in text" public
```

3. 用浏览器实际加载页面，检查 `<code class="mermaid">` 是否变成错误 SVG：

```js
[...document.querySelectorAll("code.mermaid")].map((node, i) => ({
  i,
  processed: node.getAttribute("data-processed"),
  hasSvg: !!node.querySelector("svg"),
  isError: !!node.querySelector("[aria-roledescription=error]"),
  text: node.innerText.slice(0, 120),
  svgAria: node.querySelector("svg")?.getAttribute("aria-roledescription"),
}))
```

4. 如果页面已经被错误 SVG 替换，不要再拿 `innerText` 去 parse。那时 `innerText` 已经是 `Syntax error in text`。要么从 Markdown 原文读，要么阻断 Mermaid CDN 后读取原始 DOM。

5. 抓完整 `Runtime.exceptionThrown`。Mermaid 的错误 SVG 只显示泛泛的 `Syntax error`，真正有用的是异常里的 `message`，通常会包含 `Parse error on line ... got ...`。

## Mermaid 11.4.0 classDiagram 的坑

这次踩到的坑主要都在 `classDiagram`：

- 空 class block 不稳定：

```text
classDiagram
  class EmptyClass
```

不要写成：

```text
classDiagram
  class EmptyClass {
  }
```

- 自定义 stereotype 容易炸，比如 `<<example>>`、`<<external>>`、`<<PluggableLayer>>`。
- 即使是 `<<abstract>>`、`<<interface>>`、`<<enumeration>>`，在 Quartz 的浏览器 `run()` 路径里也可能被解析成奇怪的 HTML 片段，后续关系行继续报错。
- 反向虚线实现箭头这类写法不稳，比如 `<|..`、`..|>`。如果只是表达依赖/实现关系，用普通依赖箭头更稳：

```text
classDiagram
  HMACapableConnector --> SupportsHMA : implements
```

- Python 类型标注、`*args`、`**kwargs`、`tuple[...]`、`| None` 等放进 class member 里容易触发 parser 边界问题。为了发布稳定，类图里建议写简化签名：

```text
+apply(layer, x, topk_weights, topk_ids, rest)
+forward(args, kwargs)
```

## Quartz 侧也要注意

Quartz 的 Mermaid 脚本会在页面事件里调用 `mermaid.run({ nodes })`。如果同一个 Mermaid 节点已经被渲染成 SVG，再被当作源码重新处理，就会把错误放大成“两个图都错”。更稳的策略是：

- 在第一次渲染前缓存原始 Mermaid 文本。
- 重绘时先恢复原始文本，再移除 `data-processed`。
- 避免对同一批 Mermaid 节点重复挂过多事件触发。

这次在 Quartz 构建资源时加了一个很窄的补丁，只针对 Mermaid inline script 生效，不碰其他插件脚本。

## 可复用检查清单

- [ ] `npm` 临时装的是页面使用的同版本 Mermaid。
- [ ] 检查 Markdown 原文，而不是错误 SVG 的 `innerText`。
- [ ] 用浏览器里的 `mermaid.run()` 复现，而不是只用 `parse()`。
- [ ] 抓完整 console exception，不只看页面上的错误图。
- [ ] classDiagram 里去掉空 `{}`、stereotype、复杂类型签名。
- [ ] 改完后跑 `npx quartz build` 或等价 build。
- [ ] 用真实页面验证 `svg[aria-roledescription=error]` 数量为 0。

## 最小成功标准

浏览器里跑：

```js
document.querySelectorAll("svg[aria-roledescription=error]").length
```

结果应该是 `0`。如果还不是 0，继续从 exception 里的 line/token 往回定位。
