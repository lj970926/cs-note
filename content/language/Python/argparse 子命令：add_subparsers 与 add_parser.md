---
title: argparse 子命令：add_subparsers 与 add_parser
tags:
  - Python
  - cli
aliases:
  - argparse 子命令
created: 2026-10-30
source:
  - https://docs.python.org/3.14/library/argparse.html#sub-commands
---

# argparse 子命令：add_subparsers 与 add_parser

两者是 **「一次开槽」和「多次填候选」** 的关系。注意拼写：父 parser 上是 `add_subparsers`（复数），返回的 action 上是 `add_parser`（单数）。

## 对象关系

```text
parser (ArgumentParser)
  └─ add_subparsers() → sub (_SubParsersAction)
       ├─ add_parser("analyze") → 一个新的 ArgumentParser
       └─ add_parser("report")  → 另一个新的 ArgumentParser
```

| 调用 | 做什么 | 返回什么 |
| --- | --- | --- |
| `parser.add_subparsers()` | 在父 parser 上建立子命令选择入口，创建命令名到子 parser 的映射 | `_SubParsersAction` 对象 |
| `sub.add_parser(name)` | 创建子 parser，并按命令名注册到入口 | 子命令的 `ArgumentParser` 对象 |
| `p.add_argument(...)` | 定义这个子命令接受的参数 | 对应参数的 action 对象 |

`sub` 是 action 对象，所以用它注册子命令；`p` 才是子 parser，所以在它上面继续添加参数。

## 注册所有分支，运行时选择一个

**定义阶段**：先建立入口，再逐一注册子命令。因此 `add_subparsers()` 在循环外，`add_parser(name)` 在循环内。

**解析阶段**：`parse_args()` 读到子命令名后，选择对应的子 parser，让它解析后续参数。循环注册了多少个命令，不代表一次运行会执行多少个命令。

```python
import argparse


def analyze(args):
    print(f"分析 {args.input}")


def report(args):
    print(f"生成 {args.input} 的报告")


parser = argparse.ArgumentParser(prog="app")
sub = parser.add_subparsers(dest="command", required=True)

commands = {"analyze": analyze, "report": report}
for name, handler in commands.items():
    p = sub.add_parser(name)
    p.add_argument("input")
    p.set_defaults(func=handler)

args = parser.parse_args()
args.func(args)
```

运行 `python app.py analyze data.csv` 时：

1. `analyze` 选中对应的子 parser。
2. 子 parser 把 `data.csv` 解析为 `args.input`。
3. `args.command` 为 `"analyze"`，`args.func` 为 `analyze` 函数。
4. 最后一行显式调用 `args.func(args)`，执行分析逻辑。

> [!note] 解析与执行的边界
> `set_defaults(func=handler)` 把函数对象作为默认值放入解析结果；它不会自动执行函数。执行发生在 `args.func(args)`。

## 常用参数与边界

- `required=True`：要求提供子命令；默认子命令可以省略。
- `dest="command"`：把用户选择的子命令名保存到 `args.command`；默认不保存这个名字。
- `p.set_defaults(func=handler)`：给各子命令绑定处理函数，便于统一分发。
- **同一个 parser 只能调用一次 `add_subparsers()`**，重复调用会报错。这个限制针对单个 parser；子 parser 仍然可以调用自己的 `add_subparsers()`，构建 `app remote add` 这样的多级命令。

实际 CLI 中的子命令用法，可以对照 [[Codex CLI 使用指南#恢复会话（resume）]] 中的 `codex resume`：`resume` 选择操作分支，后面的参数描述该分支的具体行为。

## 来源

- [Python 官方文档：argparse 子命令](https://docs.python.org/3.14/library/argparse.html#sub-commands)
