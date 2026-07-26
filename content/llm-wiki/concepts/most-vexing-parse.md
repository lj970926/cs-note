---
title: Most Vexing Parse
description: C++ 中对象初始化被误解析为函数声明的语法歧义
date: 2026-07-25
tags: [concept, cpp, parsing]
aliases: []
---

# Most Vexing Parse

## Definition

**Most vexing parse** 是 C++ 语法中的一个经典歧义：某些看起来像变量初始化的写法，实际上会被编译器解析为**函数声明**。这个名称由 Standard C++ 委员会成员提出，用来形容它既常见又容易让人困惑。

## Classic example

```cpp
class Timer {};
class TimeKeeper {
public:
    TimeKeeper(Timer t);
};

TimeKeeper time_keeper(Timer());
```

很多开发者期望这行代码创建一个 `TimeKeeper` 对象，并用一个 `Timer` 临时对象初始化它。但根据 C++ 语法规则，它实际上等价于：

```cpp
TimeKeeper time_keeper(Timer (*)());
```

即声明了一个名为 `time_keeper` 的函数，它接收一个「返回 `Timer` 的无参函数指针」作为参数，并返回 `TimeKeeper`。

## Why it happens

C++ 中，函数参数可以写成带括号的形式。当编译器在「对象初始化」和「函数声明」之间做选择时，会优先按**函数声明**解析。因此 `Timer()` 被解释为参数类型（函数指针），而不是临时对象。

## How to avoid it

### 1. 花括号初始化（C++11 起推荐）

```cpp
TimeKeeper time_keeper{Timer()};
```

### 2. 额外括号

```cpp
TimeKeeper time_keeper((Timer()));
```

### 3. 使用命名变量

```cpp
Timer timer;
TimeKeeper time_keeper(timer);
```

## Related concepts

- [[concepts/Value Category|Value Category]] — C++ 表达式左值/右值分类
- [[concepts/Direct Initialization|Direct Initialization]] — 直接初始化语法

## Sources

- [[sources/src-most-vexing-parse|src-most-vexing-parse]]
