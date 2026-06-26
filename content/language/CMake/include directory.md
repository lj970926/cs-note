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