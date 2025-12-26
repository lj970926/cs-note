
> [!NOTE] Path
> folly/ScopeGuard.h

# Example
```c++
{
        some_resource_t resource;
        some_resource_init(resource);
        SCOPE_EXIT { some_resource_fini(resource); };

        if (!cond)
          throw 0; // the cleanup happens at end of the scope
        else
          return; // the cleanup happens at end of the scope

        use_some_resource(resource); // may throw; cleanup will happen
}
```
相当于给当前作用域注册了一个destructor，无论代码从任何路径以正常或抛异常的方式退出，SCOPE_EXIT内的代码都会调用到。
# 实现
```c++
#define SCOPE_EXIT                                        \
  auto FB_ANONYMOUS_VARIABLE_ODR_SAFE(SCOPE_EXIT_STATE) = \
      ::folly::detail::ScopeGuardOnExit() + [&]() noexcept
```

可以看到，bracket里面里面的内容实际上传给了一个lambda。
`FB_ANONYMOUS_VARIABLE_ODR_SAFE` 的实现在`folly/Preprocessor.h` ：
```c++
// FB_ANONYMOUS_VARIABLE_ODR_SAFE doesn't rely on __COUNTER__ and is safe to use
// in headers that should not violate the one-definition rule (ODR). It is
// especially useful for C++ modules that check for ODR violations.
#define FB_ANONYMOUS_VARIABLE_ODR_SAFE(str) FB_CONCATENATE(str, __LINE__)
```
这里基本上就是把传入的变量名和行号concat到一起，防止变量名冲突等问题。主要工作还是在`ScopeGuardOnExit` 里完成的。

ScopeGuardOnExit本身是一个空的枚举类，但是定义了operator+，也就是上面SCOPE_EXIT里那个和lambda加法的实现：
```c++
enum class ScopeGuardOnExit {};

template <typename FunctionType>
ScopeGuardImpl<std::decay_t<FunctionType>, true> operator+(
    detail::ScopeGuardOnExit, FunctionType&& fn) {
  return ScopeGuardImpl<std::decay_t<FunctionType>, true>(
      std::forward<FunctionType>(fn));
}
```
可以看到，这里的关键是创建了一个ScopeGuardImpl对象负责在析构时调用用户传入的代码。
