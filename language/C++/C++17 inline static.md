```cpp
// IOHandler.h
class IOHandler {
    inline static IOHandler iohandler;  // 声明即定义
};
```

**优点**：

- 不需要在 `.cpp` 中单独定义，header-only
- `inline` 保证多个翻译单元只有一份实例，不会 ODR 违规
- 现代 C++ 项目的首选