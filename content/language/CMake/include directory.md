---
title: "include directory"
tags:
  - cmake
---

假设你的头文件在项目根目录的 `include/` 文件夹下，可以这样写：

**写法一（全局生效）：**

```cmake
include_directories(${CMAKE_SOURCE_DIR}/include)
```

**写法二（推荐，现代 CMake，只对特定 target 生效）：**

```cmake
target_include_directories(your_target_name PRIVATE ${CMAKE_SOURCE_DIR}/include)
```

常用变量：

- `${CMAKE_SOURCE_DIR}` — 项目根目录（最顶层 `CMakeLists.txt` 所在目录）
- `${CMAKE_CURRENT_SOURCE_DIR}` — 当前 `CMakeLists.txt` 所在目录
- `${PROJECT_SOURCE_DIR}` — 当前项目目录（`project()` 命令所在位置）

## `PUBLIC` / `PRIVATE` / `INTERFACE` 传播范围

`target_include_directories()` 的关键字是"依赖传播范围"（visibility scope），同时控制两件事：当前 target 自己编译时用不用这些路径，以及**链接了它的其他 target 是否继承**这些路径。

| 关键字 | 自己编译时用 | 传播给依赖我的 target | 典型场景 |
|---|---|---|---|
| `PRIVATE` | ✅ | ❌ | 内部实现细节（只有 `.cpp` 里才用到的头文件） |
| `INTERFACE` | ❌ | ✅ | 纯头文件库（header-only，没有 `.cpp`） |
| `PUBLIC` | ✅ | ✅ | 公开 API 的头文件（`.h` 里就 `#include` 的东西） |

举例：

```cmake
add_library(mylib src/mylib.cpp)
target_include_directories(mylib PUBLIC ${CMAKE_SOURCE_DIR}/include)

add_executable(app main.cpp)
target_link_libraries(app PRIVATE mylib)
```

- 编译 `mylib.cpp` 时 `-I include` 生效（PUBLIC 包含"自己用"）。
- 编译 `app` 时，即使 `app` 自己没写 `target_include_directories`，CMake 也会自动把 `include/` 加进去——因为 `app` 链接了 `mylib`，而 `mylib` 把这个目录标记为 PUBLIC（会传播）。
- 如果改成 `PRIVATE`，`app` 里 `#include "mylib/xxx.h"` 就会报找不到头文件。

经验法则：`.h`（公开头文件）里 `#include` 的路径用 `PUBLIC`；只有 `.cpp` 内部用的用 `PRIVATE`；整个库只有头文件的用 `INTERFACE`。

同样的机制对 `target_link_libraries`、`target_compile_definitions`、`target_compile_options` 也适用，是现代 CMake "target 为中心"依赖管理的核心。

## Related
- [[General Rules for Using Depencies]]
