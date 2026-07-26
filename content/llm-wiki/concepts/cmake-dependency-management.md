---
title: CMake Dependency Management
description: 在 CMake 项目中查找、引入和传播外部依赖的方法与最佳实践
date: 2026-07-25
tags: [concept, cmake, build-system]
aliases: []
---

# CMake Dependency Management

## Definition

**CMake Dependency Management** 指在 CMake 项目中声明、查找、引入和传播外部库或工具的方法与最佳实践。现代 CMake 强调通过**导入目标（imported targets）**和**传递性使用要求（transitive usage requirements）**来管理依赖，而不是依赖全局变量或手动指定头文件/库路径。

## Core mechanisms

### find_package

`find_package(<PackageName>)` 是定位已安装依赖的主要方式。成功后通常会创建导入目标，例如 `Boost::filesystem`、`OpenSSL::SSL`。

```cmake
find_package(Boost 1.70 REQUIRED COMPONENTS filesystem)
target_link_libraries(my_app PRIVATE Boost::filesystem)
```

### Imported targets

导入目标代表外部构建产物。它们携带属性：

- `INTERFACE_INCLUDE_DIRECTORIES`：头文件搜索路径
- `INTERFACE_LINK_LIBRARIES`：链接依赖
- `INTERFACE_COMPILE_DEFINITIONS`：编译宏
- `INTERFACE_COMPILE_OPTIONS`：编译选项

### Transitivity keywords

| 关键字 | 含义 |
|--------|------|
| `PRIVATE` | 仅当前目标使用，不传递给依赖者 |
| `PUBLIC` | 当前目标使用，也传递给依赖者 |
| `INTERFACE` | 不用于当前目标构建，仅传递给依赖者 |

### Include directories

头文件搜索路径可通过全局或目标级命令设置：

| 命令 | 作用范围 | 推荐度 |
|------|----------|--------|
| `include_directories(...)` | 当前目录及以下所有目标 | 旧式，不推荐 |
| `target_include_directories(target SCOPE ...)` | 仅指定目标，支持传递性 | 推荐 |

```cmake
target_include_directories(my_app PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)
```

常用路径变量：

- `${CMAKE_SOURCE_DIR}`：最顶层 `CMakeLists.txt` 所在目录
- `${CMAKE_CURRENT_SOURCE_DIR}`：当前 `CMakeLists.txt` 所在目录
- `${PROJECT_SOURCE_DIR}`：`project()` 命令所在目录

### FetchContent and ExternalProject

- **`FetchContent`**：在**配置时**拉取依赖源码，并立即 `add_subdirectory`，适合把依赖作为项目一部分构建。
- **`ExternalProject`**：在**构建时**拉取、配置、构建依赖，适合大型或需要独立构建的外部项目。

## Best practices

- 优先使用导入目标，避免手动拼接 `<Pkg>_LIBRARIES` / `<Pkg>_INCLUDE_DIRS`。
- 用 `target_link_libraries` 的 `PRIVATE`/`PUBLIC`/`INTERFACE` 精确控制依赖传播。
- 为依赖版本和查找路径提供缓存变量或预设（preset），提升可复现性。

## Related concepts

- [[concepts/Build System|Build System]] — 编译、链接、测试等构建流程的自动化工具
- [[concepts/CMake|CMake]] — 跨平台构建系统生成器
- [[concepts/Make|Make]] — 基于规则的构建工具

## Sources

- [[sources/src-cmake-using-dependencies|src-cmake-using-dependencies]]
