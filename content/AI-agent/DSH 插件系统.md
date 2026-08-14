---
title: DSH 插件系统
tags:
  - ai-agent
  - dsh
  - plugin
  - cordis
created: 2026-08-14
updated: 2026-08-14
source: 基于本机 DSH v0.1.0-rc.6 的 npm 安装包探索整理
---

# DSH 插件系统

> [!abstract] 一句话概括
> DSH（DeepSeek Harness）基于 [Cordis](https://cordis.zone/) 做插件化：每个功能是一个 npm 包，通过 **profile** 把若干"组合包（bundle）"和用户 patch 叠加成一棵 Loader entry 树。Node 侧和浏览器侧各有一个插件面，浏览器插件以**懒加载 CJS factory** 形式注入，可以改 UI、挂服务、加工具。

---

## 目录

- [[#1. 安装形态与路径|1. 安装形态与路径]]
- [[#2. Cordis 的基本概念|2. Cordis 的基本概念]]
- [[#3. Profile：组合包 + Patch|3. Profile：组合包 + Patch]]
- [[#4. Dual-face 插件：Node 半 / Client 半|4. Dual-face 插件]]
- [[#5. dsh.client 约定与浏览器模块表|5. dsh.client 约定]]
- [[#6. HMR：client 插件热更新|6. HMR]]
- [[#7. 写一个第三方插件需要什么|7. 写一个第三方插件]]
- [[#8. dsh plugin 命令|8. dsh plugin 命令]]
- [[#9. 探索过程中的关键文件速查|9. 关键文件速查]]

---

## 1. 安装形态与路径

本机装的是 npx 拉的 npm 包（不是源码 checkout）：

- DSH 启动器包：`~/.npm/_npx/<hash>/node_modules/@deepseek-ai/dsh/`
- 所有 `@deepseek-ai/dsh-*` 子包平铺在同一个 `node_modules/@deepseek-ai/`
- Profile 根：`$DSH_HOME/profiles/<name>/`（本机 `$DSH_HOME=~/.dsh`）
  - `package.json`：声明 `dsh.profile.bundles`
  - `cordis.yml`：profile 根（空数组）
  - `cordis.patch.yml`：用户自己的 patch 层
  - `node_modules/`：通过 `dsh plugin add` 装的第三方插件
- 会话/存储：`~/.dsh/sessions/`、`~/.dsh/storages/`、`~/.dsh/attachments/`

> [!warning] npx 缓存目录不能直接改源码
> `~/.npm/_npx/.../node_modules/@deepseek-ai/` 下全是打包后的 `lib/*.js`，没有 `apps/web`、没有 `pnpm run dev:web`。系统提示里那句话——"client-plugin HMR receiver is active, but bundles rebuild only while `pnpm run dev:web` is running from this same checkout"——**在 npx 安装形态下是不成立的**：没有 watcher 就没有 rebuilt 帧，HMR SSE 通道空转。要热更新必须 clone 源码或自己起 tsdown watch。

---

## 2. Cordis 的基本概念

DSH 复用的是 [Cordis](https://github.com/cordisjs/cordis)（Koishi 团队出的插件框架）。核心三件套：

- **Context（ctx）**：依赖注入容器，服务通过 `ctx.set('name', impl)` 注册，通过插件的 `static inject = [...]` 声明依赖。
- **Service**：ctx 上的具名对象（如 `ctx.webServer`、`ctx.loader`、`ctx.logger`），其他插件按名注入。
- **Plugin / Entry / Fiber**：插件是一个 `(ctx, config) => void` 函数或带 `apply/inject/name` 的对象；Loader 为每个 entry 维护一个 fiber，热更就是重建 fiber。

`@cordisjs/plugin-loader` 负责加载 entry 树，entry options 字段：

| 字段 | 作用 |
|---|---|
| `id` | 稳定 id，用于 update/remove |
| `name` | Loader 要 import 的模块名 |
| `config` | 传给插件的配置 |
| `disabled` | 停止并阻止启动 |
| `inject` | 该 entry 额外的服务依赖 |
| `group` | 把 entry 标记为 group，config 即子 entry 列表 |

API：`loader.create/update/remove/resolve/await/locate`。

---

## 3. Profile：组合包 + Patch

一个 profile 目录里：

```jsonc
// package.json
{
  "private": true,
  "dependencies": {},
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app"
      ]
    }
  }
}
```

配置树从空根开始，按顺序叠加：

1. `dsh.profile.bundles` 中各 bundle 自带的 `cordis.patch.yml`
2. profile 自己的 `cordis.patch.yml`
3. `$DSH_HOME/cordis.patch.yml`（home 级覆盖）
4. `--patch` 指定的额外 overlay

> [!note] bundle = 一组 entry 的批量插入
> 例如 `@deepseek-ai/dsh-base` 的 `cordis.patch.yml` 一次性 `insert:` 了 `timer`/`hmr`/`llm`/`session`/`bash-sandbox`/`agent`/... 几十个基础服务；`@deepseek-ai/dsh-web-app` 在此之上再插 webserver、apiproxy、全部 client UI 插件。bundle 本质上就是一个发布版本化的 patch 文件。

### Patch YAML 语法

是顶层数组，每项是一个 loader patch entry：

```yaml
# 插入新 entry
- insert:
    - id: my-plugin
      name: my-plugin-package
      config:
        foo: bar

# 按 id 改已有 entry 的 config（整体替换 config，不是 merge）
- id: tools
  config:
    mode: code

# 禁用
- id: hmr
  disabled: true
```

支持 `!!js <expression>` 写 JS 表达式（环境变量、`dshHomePath(...)` 等 helper），用于 config 里不能写死的值。

---

## 4. Dual-face 插件：Node 半 / Client 半

DSH 把一个包切成"两半"：

- **Node 半**：包根 `main`/`exports["."]`，在 dsh host 进程里跑，能访问 fs、child_process、webserver、loader 等；负责提供服务、扫描 client bundle、注入 boot manifest。
- **Client 半**：`exports["./client"]`，在浏览器里跑，改 React UI、订阅 SSE、调用 RPC。

同一个包可以两边都有（dual-face），通过相同的入口 id 关联：

```jsonc
// package.json
{
  "name": "@deepseek-ai/dsh-client-hmr",
  "main": "lib/index.js",
  "exports": {
    ".": "./lib/index.js",
    "./client": "./lib/client.js"
  },
  "dsh": {
    "client": {
      "platform": "web",
      "inject": [],
      "immediately": true
    }
  }
}
```

- `dsh.client.platform`：必须是 `"web"` 才会被扫进浏览器 roster。
- `dsh.client.inject`：这个 client 插件在浏览器里需要的其他 client 模块（会作为前置依赖加载）。
- `dsh.client.immediately`：在 cordis 起来之前就执行（kernel 级插件用，如 modules、connection、runtime、hmr）。

普通 UI 插件（如 `dsh-client-ui-cordis`）只写 `inject`、不标 `immediately`，等 cordis 框架就绪后再挂载。

---

## 5. dsh.client 约定与浏览器模块表

client 端有一套和 Node 类似的 mini 模块系统（`@deepseek-ai/dsh-client-modules`）：

1. **扫描**：Node 侧 `ClientModuleRegistry` 监听 loader 的 `internal/plugin` 事件，对每个启用且未禁用的 entry：
   - `require.resolve(`${name}/package.json`)`
   - 读 `dsh.client` 字段，检查 `platform === 'web'`
   - 解析 `exports["./client"]` 拿到 client bundle 路径
   - 对文件内容做短 hash 当 `rev`
2. **下发**：通过 `tapIndex` 在 HTML 里注入 `window.__DSH_BOOT__`，包含 `{ rev, entries: [{id, rev, inject[], immediately}] }`；同时注册 `/plugins/<id>/client.js?rev=...` 路由提供 bundle 本体。
3. **浏览器加载**：bundle 必须以这一行开头（**factory 形态 CJS**）：
   ```js
   window.__ModuleLoader__.load({
     id: "@deepseek-ai/dsh-client-hmr",
     factory: (require) => {
       var module = { exports: {} };
       var exports = module.exports;
       // ... 插件体 ...
       return module.exports;
     }
   });
   ```
   - 脚本执行时只**注册 factory**，不立即执行；
   - `factory(require)` 在 materialize 时才跑，`require` 走浏览器里的模块表，能 `require("react")`、`require("@deepseek-ai/dsh-client-runtime")` 等已注册模块；
   - `id` 和包名必须一致，`./client` 与 bare id 解析到同一份 exports。

> [!tip] 为什么是 factory-form CJS
> 因为脚本是用 `<script>` 经典标签异步加载的，没法用 ESM 的静态 import；factory 闭包让所有副作用（CSS 注入、DOM 监听、React 组件注册）都延迟到 materialize 时，并能正确处理递归依赖。

client 插件通过 `inject` 拿到 ctx 上的服务。例如 `dsh-client-ui-cordis`：

```js
const name = "client-ui-cordis";
const inject = [
  "@deepseek-ai/dsh-client-runtime",
  "@deepseek-ai/dsh-client-connection",
  // ...
];
function apply(ctx) {
  // ctx.slots.register(...) 注册 React 组件到具名 slot
}
```

UI 层有一套 **Slot 系统**（`@deepseek-ai/dsh-client-ui-slots`）：shell 在布局里留了具名插槽（conversation view、sidebar、settings 面板、message action 等），第三方插件用 `register({name, children?, store?, inject?}, Component)` 把 React 组件挂进去。Chain 类型 slot 还支持按 `select` 自提名做 keyed 路由。

---

## 6. HMR：client 插件热更新

`@deepseek-ai/dsh-client-hmr`（默认在 web profile 里被 `dsh-web-app` 置为 `disabled: true`，见其 patch 注释 "TODO: Re-enable shared HMR for Web after its reload lifecycle is tested"）工作流程：

1. 浏览器订阅 `GET /plugins/events` SSE。
2. Node 侧用一个 interval 对 boot graph 里所有 bundle 文件 stat + 内容 hash，发现 rev 变了就广播 `{type:"rebuilt", id}`。
3. 浏览器收到后串行执行：
   - `modules.invalidate(id)` 清掉旧 factory + 缓存
   - `modules.prefetch(id)` 加载新脚本并注册新 factory（旧 fiber 仍在服务）
   - `registry.delete(runtime.callback)` 先摘回调（避免 dispose 触发自禁用分支）
   - drain 旧 fiber 的 inertia
   - 删除 `entry.fiber`，移除该插件拥有的 `<style data-plugin>` 标签
   - `entry.refresh()` 重新 import 并挂载
   - `fiber.await()` 抛启动错误

被依赖的 provider 换了，Cordis 会按 activation epoch 级联刷新所有 dependent，不需要客户端算依赖图。

> [!warning] 触发 HMR 需要有东西在写 bundle 文件
> Node 侧不感知构建过程，它只是轮询文件。所以只要有 `tsdown --watch`（或 `pnpm run dev:web`）在产出 `lib/client.js`，就会自动热更——没有 watcher，SSE 帧永远不会来。

---

## 7. 写一个第三方插件需要什么

最小的 client-only 插件骨架：

```
my-dsh-plugin/
├── package.json
├── lib/
│   └── client.js      # 编译产物（factory 形态）
└── README.md
```

`package.json`：

```jsonc
{
  "name": "my-dsh-plugin",
  "version": "0.1.0",
  "type": "module",
  "main": "lib/index.js",
  "exports": {
    ".": "./lib/index.js",
    "./client": "./lib/client.js"
  },
  "dsh": {
    "client": {
      "platform": "web",
      "inject": [
        "@deepseek-ai/dsh-client-runtime",
        "@deepseek-ai/dsh-client-connection"
      ]
    }
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "@deepseek-ai/cordis": "^4.0.1"
  }
}
```

`lib/index.js`（Node 半，可空）：

```js
export const name = "my-dsh-plugin";
export function apply(ctx) {
  ctx.logger.info("my-dsh-plugin host half loaded");
}
```

`lib/client.js`（浏览器半，**必须是 factory 包裹**）：

```js
window.__ModuleLoader__.load({
  id: "my-dsh-plugin",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    const react = require("react");
    // ... 插件逻辑，例如挂 MutationObserver、注册 slot ...
    exports.name = "my-dsh-plugin";
    exports.inject = ["@deepseek-ai/dsh-client-runtime"];
    exports.apply = (ctx) => {
      ctx.logger.info("hello from client plugin");
    };
    return module.exports;
  }
});
```

然后在 profile 里启用：

```bash
dsh plugin --profile web add .        # 或 file:/path/to/my-dsh-plugin
```

再编辑 `~/.dsh/profiles/web/cordis.patch.yml`：

```yaml
- insert:
    - id: my-dsh-plugin
      name: my-dsh-plugin
```

重启 `dsh web` 即生效。源码开发时跑 `tsdown --watch` 会让 HMR 自动接手（前提是把 profile patch 里 `hmr` 的 `disabled: true` 覆盖为启用，或直接在本地源码里改）。

---

## 8. dsh plugin 命令

`dsh plugin --profile <name> <pnpm args>` 本质上是把参数转发给 profile 目录里的 `pnpm`：

```bash
dsh plugin --profile web add some-npm-pkg
dsh plugin --profile web add file:./local-plugin
dsh plugin --profile web remove some-npm-pkg
dsh plugin --profile web ls
```

它只负责把包装进 `~/.dsh/profiles/web/node_modules/`；**是否启用**还要在 `cordis.patch.yml` 里 insert entry 或修改某 entry 的 `disabled`。

调试用：

```bash
dsh --profile web --dump-default-config   # 不启动，打印 bundle 叠加后的默认树
dsh --profile web --dump-config           # 再叠加用户 patch 后的最终树
```

---

## 9. 探索过程中的关键文件速查

| 文件 | 作用 |
|---|---|
| `@deepseek-ai/dsh/package.json` | 启动器声明，所有 `dsh-*` 子包依赖列表 |
| `@deepseek-ai/dsh/README.zh.md` | CLI/profile/patch 层叠加规则官方说明 |
| `@deepseek-ai/dsh-base/cordis.patch.yml` | 基础 bundle：默认启用的几十项服务清单 |
| `@deepseek-ai/dsh-web-app/cordis.patch.yml` | web bundle：webserver、apiproxy、全部 `dsh.client` 浏览器 roster |
| `@deepseek-ai/dsh-client-modules/lib/index.js` | Node 半：扫描 `dsh.client`、生成 `__DSH_BOOT__`、serve `/plugins/<id>/client.js` |
| `@deepseek-ai/dsh-client-modules/lib/client.js` | 浏览器半：lazy-CJS 模块表，`window.__ModuleLoader__` |
| `@deepseek-ai/dsh-client-hmr/lib/client.js` | HMR 浏览器侧：SSE → invalidate/prefetch → fiber swap |
| `@deepseek-ai/dsh-client-hmr/lib/index.js` | HMR Node 侧：stat+hash 轮询、广播 rebuilt 帧 |
| `@deepseek-ai/dsh-client-ui-slots/lib/index.js` | Slot 注册核心：`register({name, ...}, Component)` 装饰 API |
| `@deepseek-ai/dsh-client-ui-cordis/lib/client.js` | 一个完整的 UI 插件样例（注册 Tool 卡片视图） |
| `@deepseek-ai/cordis-plugin-loader/README.md` | Cordis Loader entry options 与 API 参考 |
| `~/.dsh/profiles/web/` | web profile 目录，`cordis.patch.yml` 是用户写自定义 entry 的地方 |

---

## 延伸阅读

- [[DeepSeek Harness 四种 Agent 模式]]：上层 product preset，决定哪些工具/能力打开
- [[LLM Wiki]]：本 vault 采用的笔记方法论
- 源码：<https://github.com/deepseek-ai/deepseek-harness>
- Cordis：<https://github.com/cordisjs/cordis>
