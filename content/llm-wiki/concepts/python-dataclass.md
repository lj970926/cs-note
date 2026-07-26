---
title: Python Dataclass
description: Python 中通过装饰器自动生成数据类常用方法（__init__、__repr__、__eq__ 等）的机制
date: 2026-07-25
tags: [concept, python, dataclass, oop]
aliases: []
---

# Python Dataclass

## Definition

**Dataclass** 是 Python 3.7 起通过 `dataclasses` 模块提供的语法糖。用 `@dataclass` 装饰类后，Python 会根据类型注解自动生成 `__init__`、`__repr__`、`__eq__` 等样板方法，减少数据容器类的 boilerplate。

## Basic usage

```python
from dataclasses import dataclass

@dataclass
class Spec:
    value: int

s = Spec(1)
print(s)          # Spec(value=1)
Spec(1) == Spec(1) # True
```

## Common parameters

| 参数 | 作用 |
|------|------|
| `frozen=True` | 实例不可变，自动生成 `__hash__`，可作为 dict/set key |
| `unsafe_hash=True` | 即使可变也生成 `__hash__`（不推荐） |
| `eq=True` | 生成 `__eq__`（默认开启） |
| `repr=True` | 生成 `__repr__`（默认开启） |
| `order=True` | 生成比较方法（`__lt__` 等），按字段顺序 |

## Mutable vs immutable

```python
@dataclass
class MutableSpec:
    value: int

hash(MutableSpec(1))  # TypeError

@dataclass(frozen=True)
class ImmutableSpec:
    value: int

hash(ImmutableSpec(1))  # OK
```

## Relationship with dict keys

- 普通 `@dataclass` 默认不可 hash，不能作为 `dict` key。
- `@dataclass(frozen=True)` 自动满足 hashability contract，可安全作为 key。
- 使用 `unsafe_hash=True` 后若修改字段，会导致 dict 查找失败。

## Related concepts

- [[concepts/Python Dict Key|Python Dict Key]] — dict key 的哈希与相等性要求
- [[concepts/Value Object|Value Object]] — 按值而非身份标识的对象

## Sources

- [[sources/src-python-dict-key-hash-eq|src-python-dict-key-hash-eq]]
