---
title: "Python dict key：__hash__ 与 __eq__"
description: Python dict key 查找中 __hash__ 与 __eq__ 的作用及 dataclass 作为 key 的笔记摘要
source_type: note
local_ref: "[[language/Python/Python dict key：__hash__与 __eq__]]"
date: 2026-07-25
tags: [source, python, dict, hash, dataclass]
aliases: []
---

# Python dict key：__hash__ 与 __eq__

> Source: [[language/Python/Python dict key：__hash__与 __eq__]]

## One-line summary

Python `dict` 查找 key 时先用 `__hash__` 定位候选槽位，再用 `__eq__` 最终确认身份；作为 key 的对象需保证 hash 不变且 `a == b ⇒ hash(a) == hash(b)`。

## Key claims

- `__hash__` 用于快速定位，`__eq__` 用于最终判断；只有 hash 相同且 `__eq__` 为 `True` 才认为是同一个 key。
- 普通 Python 对象默认按对象身份比较，`__dict__` 内容相同也不代表 `==`。
- 自定义值语义需同时实现 `__eq__` 和 `__hash__`，并保证相等对象 hash 相同。
- `dataclass` 自动生成 `__eq__`；`@dataclass(frozen=True)` 还会生成 `__hash__`，可安全作为 dict key。
- 作为 key 的对象插入后不能修改参与 hash/eq 的字段，否则会导致 dict 无法找回。

## Related pages

- [[concepts/Python Dict Key|Python Dict Key]]
- [[concepts/Python Dataclass|Python Dataclass]]
- [[concepts/Hashable Object|Hashable Object]]

## Reference

- [Python docs — object.__hash__](https://docs.python.org/3/reference/datamodel.html#object.__hash__)
- [Python docs — dataclasses](https://docs.python.org/3/library/dataclasses.html)
