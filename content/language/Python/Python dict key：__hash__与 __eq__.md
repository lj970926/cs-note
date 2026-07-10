---
title: Python dict key：__hash__ 与 __eq__
tags:
  - Python
  - dict
  - hash
  - dataclass
---
## 核心结论

Python 的 `dict` 查找 key 时，`__hash__` 和 `__eq__` 都会用到：

```text
__hash__ -> 定位可能的位置
__eq__   -> 确认是否是同一个 key
```

`__hash__` 负责快速定位，`__eq__` 负责最终判断。只有 hash 相同并且相等比较为 `True`，dict 才认为两个 key 是同一个 key。

## 一个 key 的查找过程

假设有：

```python
d = {key_a: value}
result = d[key_b]
```

查找大致可以理解为：

1. 计算 `hash(key_b)`；
2. 根据 hash 找到候选槽位；
3. 将 `key_b` 和候选 key 比较 `key_a == key_b`；
4. 相等则返回对应 value，否则继续处理冲突或判定不存在。

因此，hash 相同不代表 key 相等，因为 hash collision（哈希冲突）是允许的：

```text
hash(a) == hash(b) 但 a == b 为 False
```

反过来必须满足：

```python
a == b  =>  hash(a) == hash(b)
```

否则 dict 可能无法正确找到 key。

## 普通对象作为 key

普通 Python 对象默认按对象身份比较：

```python
class Spec:
    def __init__(self, value):
        self.value = value

a = Spec(1)
b = Spec(1)

a == b       # False
a is b       # False
hash(a)       # 通常可用，基于对象身份
```

因此：

```python
{a: "value"}[b]  # KeyError
```

即使 `a` 和 `b` 的 field 完全相同，只要没有自定义 `__eq__`，它们也不会被认为是同一个 key。

### 默认 hash 为什么不同

普通自定义类如果没有重写 `__eq__` 和 `__hash__`，会继承 `object` 的实现。默认的 `object.__eq__` 按对象身份比较，效果类似 `a is b`；默认的 `object.__hash__` 也根据对象身份计算 hash，而不是读取 `__dict__` 中的 field。

因此下面两个对象即使 field 一样，也不是同一个 key：

```python
class Spec:
    pass

a = Spec()
b = Spec()
a.x = 1
b.x = 1

a.__dict__ == b.__dict__  # True
a == b                    # False
a is b                    # False
```

对象身份的具体 hash 实现属于 Python 实现细节。在 CPython 中通常与对象的底层身份相关，但不应该把它当作持久化 ID 使用。重要的是：同一个对象在生命周期内 hash 保持稳定，而不同对象允许发生 hash collision。

### `__dict__` 不参与默认相等判断

实例的 `__dict__` 是保存实例属性的字典。Python 默认不会自动比较两个对象的 `__dict__`：

```python
a.__dict__ == b.__dict__  # 只能说明属性内容相同
a == b                    # 仍然是 False
```

只有显式实现 `__eq__`，或者使用会生成 `__eq__` 的 `dataclass`，才会按字段值比较。`__dict__` 也不一定包含所有属性；使用 `__slots__` 的类甚至可能没有 `__dict__`。

## 自定义 `__eq__` 和 `__hash__`

如果希望对象按字段值比较，需要同时正确实现 `__eq__` 和 `__hash__`：

```python
class Spec:
    def __init__(self, value):
        self.value = value

    def __eq__(self, other):
        return isinstance(other, Spec) and self.value == other.value

    def __hash__(self):
        return hash(self.value)

a = Spec(1)
b = Spec(1)

a == b                 # True
hash(a) == hash(b)     # True
{a: "value"}[b]        # "value"
```

## `dataclass` 做了什么

`dataclass` 适合表示主要用于保存数据的类：

```python
from dataclasses import dataclass

@dataclass
class Spec:
    value: int
```

它会根据类型注解自动生成常用方法，例如：

- `__init__`
- `__repr__`
- `__eq__`

因此：

```python
Spec(1) == Spec(1)  # True
```

但普通 `dataclass` 默认不适合作为 dict key，因为它通常不可 hash：

```python
@dataclass
class Spec:
    value: int

hash(Spec(1))  # TypeError
```

如果使用：

```python
@dataclass(frozen=True)
class Spec:
    value: int
```

实例就不可修改，并且 Python 可以根据字段生成 hash，使其可以作为 dict key：

```python
a = Spec(1)
b = Spec(1)

a == b                 # True
hash(a) == hash(b)     # True
{a: "value"}[b]        # "value"
```

## 为什么 key 不能随意修改

dict 插入 key 时，会根据当时的 hash 放置它。如果 key 插入后字段发生变化，hash 可能也发生变化，但 dict 内部位置不会自动移动：

```python
@dataclass(unsafe_hash=True)
class MutableKey:
    value: int

key = MutableKey(1)
d = {key: "value"}

key.value = 2

# key 仍然在 dict 中，但可能无法通过 key 找回
```

所以作为 dict key 的对象必须满足：

- hash 在生命周期内保持不变；
- 参与 `__eq__` 的字段不要改变；
- 最好使用不可变对象，例如 `int`、`str`、`tuple` 或 `dataclass(frozen=True)`。

## vLLM 中的例子

vLLM 中会构造类似这样的分组 key：

```python
key = (full_cls_name, layer_kv_cache_spec, num_heads_q)
```

这个 tuple 本身可以作为 dict key，前提是其中的元素都可 hash。

这里的含义是：只有下面三项都相等的 layer，才会被分到同一个 attention group：

1. backend 的完整类名；
2. 当前 layer 的 `KVCacheSpec`；
3. query head 数量。

`KVCacheSpec` 使用 dataclass 风格的值语义，因此两个不同对象只要类型和字段值相同，就可以匹配上；Attention layer 对象本身则不参与这个 key 的值比较。

## `UniformTypeKVCacheSpecs` 与 key 比较

`UniformTypeKVCacheSpecs` 是一个 wrapper，里面保存多个 layer 各自的 `KVCacheSpec`：

```python
UniformTypeKVCacheSpecs(
    block_size=16,
    kv_cache_specs={
        "layer_0": spec_a,
        "layer_1": spec_b,
    },
)
```

同一个 wrapper 中的 layer 不一定拥有完全相同的 spec。代码会先根据 `layer_name` 取出对应的真实 spec：

```python
layer_kv_cache_spec = uniform_spec.kv_cache_specs[layer_name]
```

所以最终分组时比较的是每个 layer 自己的 spec，而不是简单比较外层 `UniformTypeKVCacheSpecs` 对象的身份。

## 一句话总结

```text
dict 用 hash 快速定位，用 eq 最终确认；
普通对象默认按身份比较；
dataclass 可以提供按字段比较；
frozen dataclass 还能安全地作为 dict key；
作为 key 的对象不能在插入后改变参与 hash/eq 的字段。
```
