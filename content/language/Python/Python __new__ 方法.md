---
title: Python __new__ 方法
tags:
  - Python
  - object-model
  - magic-method
aliases: []
created: 2026-08-15
---

## 核心结论

`__new__` 负责**创建并返回实例对象**；`__init__` 则在对象已经创建后，负责**初始化实例状态**。

调用 `Class(*args, **kwargs)` 时，可将过程理解为：

```text
__new__(cls, *args, **kwargs)  ->  得到实例
__init__(self, *args, **kwargs) -> 初始化实例
```

一般自定义类只需要实现 `__init__`。只有需要控制对象创建本身时，才需要重写 `__new__`。

## 基本示例

```python
class User:
    def __new__(cls, *args, **kwargs):
        print("创建对象")
        return super().__new__(cls)

    def __init__(self, name):
        print("初始化对象")
        self.name = name


user = User("Alice")
# 创建对象
# 初始化对象
```

`super().__new__(cls)` 最终会调用 `object.__new__(cls)`，为普通类分配一个 `cls` 类型的实例。

> [!warning] `__init__` 不一定执行
> 如果 `__new__` 返回的不是 `cls` 的实例，Python 不会调用该类的 `__init__`。

```python
class Demo:
    def __new__(cls):
        return 42

    def __init__(self):
        print("不会执行")


Demo()  # 42
```

## 什么时候需要 `__new__`

### 继承不可变内置类型

`int`、`str`、`tuple` 等对象的值在创建后不能原地修改。因此，子类需要在 `__new__` 中先生成带目标值的对象：

```python
class DoubleInt(int):
    def __new__(cls, value):
        return super().__new__(cls, value * 2)


DoubleInt(3)  # 6
```

在 `__init__` 中再修改 `int` 的值是不可能的，因为该对象已创建且不可变。

### 控制实例复用

`__new__` 可以决定是否创建新对象，例如实现单例或缓存。不过这种模式需要谨慎：共享实例也会共享可变状态。

```python
class Singleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance


Singleton() is Singleton()  # True
```

即使返回了已有实例，`__init__` 默认仍会在每次调用类时执行；若不希望重复初始化，需要额外用标记控制。

## 与其他特殊方法的关系

`__new__` 是 Python 对象模型的一部分，关注的是“对象从哪里来”；`__init__` 关注“对象拿到后如何设置”。对象的相等性和可哈希性则由 `__eq__`、`__hash__` 等方法决定，见 [[Python dict key：__hash__与 __eq__]]。

| 方法 | 职责 | 常见返回值 |
| --- | --- | --- |
| `__new__(cls, ...)` | 创建对象 | `cls` 的实例（或其他对象） |
| `__init__(self, ...)` | 初始化已存在的对象 | 必须返回 `None` |
| `__repr__(self)` | 定义调试展示 | 字符串 |
| `__eq__(self, other)` | 定义相等比较 | `True` / `False` / `NotImplemented` |

