---
title: Python Dict Key
description: Python 字典中 key 的相等性、哈希约束与可哈希对象的要求
date: 2026-07-25
tags: [concept, python, dict, hash]
aliases: []
---

# Python Dict Key

## Definition

在 Python 中，`dict` 使用**哈希表**实现。查找 key 时，先调用 `hash(key)` 定位候选槽位，再用 `==` 与槽位中的候选 key 比较，最终确认是否命中。因此，一个对象能作为 `dict` 的 key，必须满足**可哈希（hashable）**的条件。

## Lookup process

对于 `d[key_b]`：

1. 计算 `hash(key_b)`。
2. 根据 hash 找到候选槽位。
3. 用 `key_b == candidate` 比较候选 key。
4. 相等则返回对应 value；否则继续处理冲突或判定不存在。

## Hashability contract

一个可哈希对象必须满足：

- `__hash__` 返回一个整数，且在对象生命周期内保持不变。
- 若 `a == b`，则必须 `hash(a) == hash(b)`。
- 参与 `__eq__` 比较的字段在对象作为 dict key 期间不可变。

## Default object behavior

普通自定义类继承自 `object`：

- `__eq__` 按对象身份比较（类似 `a is b`）。
- `__hash__` 也基于对象身份，而不是 `__dict__` 内容。

因此两个字段完全相同的对象，默认也不是同一个 key。

## Custom equality and hash

```python
class Spec:
    def __init__(self, value):
        self.value = value

    def __eq__(self, other):
        return isinstance(other, Spec) and self.value == other.value

    def __hash__(self):
        return hash(self.value)
```

## Dataclass as key

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Spec:
    value: int

a = Spec(1)
b = Spec(1)
{a: "value"}[b]  # "value"
```

- 普通 `@dataclass` 默认不可 hash（因为字段可变）。
- `@dataclass(frozen=True)` 生成 `__hash__`，实例不可变，可安全作为 key。
- `@dataclass(unsafe_hash=True)` 允许可变对象生成 hash，但插入后修改字段会破坏 dict 查找。

## Best practices

- 优先使用内置不可变类型作为 key：`int`、`str`、`tuple`（元素也需可哈希）、`frozenset`。
- 需要自定义值语义时，同时实现 `__eq__` 和 `__hash__`。
- 使用 `frozen=True` dataclass 表示不可变值对象。

## Related concepts

- [[concepts/Python Dataclass|Python Dataclass]] — Python 数据类的用法与语义
- [[concepts/Hashable Object|Hashable Object]] — 可哈希对象的通用定义
- [[concepts/Python Tuple|Python Tuple]] — 常用作复合 key 的不可变序列

## Sources

- [[sources/src-python-dict-key-hash-eq|src-python-dict-key-hash-eq]]
