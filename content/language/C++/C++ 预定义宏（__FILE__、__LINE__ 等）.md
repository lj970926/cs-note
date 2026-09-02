---
title: C++ 预定义宏（__FILE__、__LINE__ 等）
tags:
  - cpp
aliases:
  - __FILE__
  - __LINE__
  - 预定义宏
created: 2026-09-02
---

# C++ 预定义宏（`__FILE__`、`__LINE__` 等）

由**预处理器**在编译期自动展开的标准宏，常用于日志、断言、错误定位。

## 常用标准预定义宏

| 宏 | 展开结果 | 示例 |
| --- | --- | --- |
| `__FILE__` | 当前源文件路径（字符串字面量） | `"/home/user/main.cpp"` |
| `__LINE__` | 当前行号（十进制整数） | `42` |
| `__func__`（C++11/C99） | 当前函数名（字符串） | `"main"` |
| `__DATE__` / `__TIME__` | 编译日期 / 时间 | `"Mar 5 2026"` / `"14:30:00"` |
| `__cplusplus` | C++ 标准版本号 | `201703L`（C++17） |
| `__STDC_VERSION__` | C 标准版本号（仅 C） | `201112L` |

## 编译器扩展宏（GCC/Clang/MSVC）

- `__PRETTY_FUNCTION__`（GCC/Clang）：带**完整签名**的函数名，如 `void MyClass::foo(int)`，比 `__func__` 信息多，调试时很好用。
- `__GNUC__`、`_MSC_VER`：编译器版本判断。

## 典型用法

### 1. 日志 / 断言定位错误（最常见）

```cpp
#define LOG(msg) \
    std::cerr << "[" << __FILE__ << ":" << __LINE__ << "] " << msg << std::endl;

#define CHECK(cond) \
    do { if (!(cond)) { LOG("check failed: " #cond); std::abort(); } } while (0)
```

调用 `CHECK(ptr != nullptr)` 出错时会打印出具体文件和行号，方便定位。

### 2. 生成唯一变量名

用 `__LINE__` 拼接，避免宏展开后名字冲突。folly 的 SCOPE_EXIT 就是这么做的（见 [[source-code/folly/SCOPE_EXIT|SCOPE_EXIT]]）：

```cpp
#define CONCAT_(a, b) a##b
#define CONCAT(a, b)  CONCAT_(a, b)   // 两层间接才能让 __LINE__ 先展开
#define UNIQUE_VAR(name) CONCAT(name, __LINE__)

int UNIQUE_VAR(tmp) = 0;  // 展开成 int tmp42 = 0;
```

> [!note] 为什么要两层 CONCAT
> `##` 会阻止参数展开，直接 `a##__LINE__` 得到的是字面 `a__LINE__`；多包一层让 `__LINE__` 先替换成行号再拼接。

### 3. 条件编译 / 版本适配

```cpp
#if __cplusplus >= 201703L
    // 使用 C++17 的 if constexpr
#endif
```

## 注意点

- 展开的是**编译时**信息，不是运行时变量——`__LINE__` 指宏**使用处**所在的行号。
- `__FILE__` 展开的是编译时传给编译器的路径，不同构建方式下可能是绝对或相对路径；想要干净的短路径可用 `__builtin_FILE()`（Clang）或由构建系统裁剪。
- C++20 提供了更现代、类型更安全的替代品 `std::source_location`（`<source_location>`），新项目优先考虑：

```cpp
#include <source_location>

void log(const std::source_location& loc = std::source_location::current()) {
    std::cout << loc.file_name() << ":" << loc.line()
              << " in " << loc.function_name() << "\n";
}
```
