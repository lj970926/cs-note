---
title: IILE（立即调用的 Lambda 表达式）
tags:
  - cpp
  - lambda
  - initialization
aliases:
  - Immediately Invoked Lambda Expression
  - IILE
created: 2026-08-30
---

# IILE（立即调用的 Lambda 表达式）

IILE 是 **Immediately Invoked Lambda Expression** 的缩写：定义一个 lambda 后立刻调用它。

```cpp
int value = [] {
  int x = 3;
  return x * 2;
}();
// value == 6
```

末尾的 `()` 是调用运算符；没有它时，表达式的值是 lambda 对象本身，而不是 lambda 的返回值。

## 为什么使用它

### 让复杂初始化保持 `const`

当一个值需要分支或多步计算时，普通写法往往要先声明变量、再赋值，因而无法声明为 `const`：

```cpp
std::string path;
if (use_cache) {
  path = cache_path();
} else {
  path = default_path();
}
```

IILE 将这段逻辑变回一个初始化表达式：

```cpp
const auto path = [&] {
  if (use_cache) {
    return cache_path();
  }
  return default_path();
}();
```

变量从创建开始就是完整、不可变的值，减少“未初始化”或“后来又被改写”的状态。

### 缩小中间变量与资源的作用域

只服务于初始化的中间变量无需泄漏到外层：

```cpp
const auto result = [&] {
  auto parsed = parse(input);
  return normalize(parsed);
}();
```

`parsed` 只在 lambda 内可见。这里创建的 RAII 对象也会在 lambda 返回后立即析构，适合短暂的文件、锁或临时 buffer：

```cpp
const auto text = [&] {
  std::ifstream file{name};
  return std::string{
      std::istreambuf_iterator<char>{file},
      std::istreambuf_iterator<char>{}};
}(); // file 在此处关闭
```

### 可用于要求“表达式”的位置

多行逻辑不能直接放进构造函数实参或成员初始化列表，而 IILE 的结果是一个普通表达式：

```cpp
Widget widget{[&] {
  Config config;
  config.enable_feature();
  return config;
}()};
```

### 依赖关系就地可见

捕获列表明确标出初始化依赖的外部状态：`[&]` 为按引用捕获，`[=]` 为按值捕获，`[this]` 捕获当前对象。对于一次性的局部逻辑，它通常比新增一个只使用一次的辅助函数更贴近调用点。

> [!tip]
> IILE 很适合短小、一次性、仅用于构造某个值的逻辑。若逻辑较长、需要单元测试或会在多处复用，应提取为有名字的函数；名字本身能表达业务意图。

## 与 `SCOPE_EXIT` 的区别

IILE 中的 lambda 在定义后**立即调用**，主要用于产生一个值。[[source-code/folly/SCOPE_EXIT|SCOPE_EXIT]] 也接收 lambda，但它保存 lambda，并在所在作用域退出时调用，用于清理资源。两者都利用了 lambda 的局部性，执行时机则相反。

## Related

- [[source-code/folly/SCOPE_EXIT]]
