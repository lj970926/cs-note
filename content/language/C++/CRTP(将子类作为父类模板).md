**CRTP（Curiously Recurring Template Pattern）**，奇异递归模板模式。

```cpp
template <typename Derived>
class Base {
    void foo() {
        static_cast<Derived*>(this)->bar(); // 调用子类方法
    }
};

class MyClass : public Base<MyClass> {
    void bar() { /* ... */ }
};
```

常见用途：静态多态（避免虚函数开销）、mixin、计数器等。