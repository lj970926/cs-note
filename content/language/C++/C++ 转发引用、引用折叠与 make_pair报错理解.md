---
title: C++ 转发引用、引用折叠与 make_pair 报错理解
tags:
  - cpp
  - templates
  - forwarding-reference
---

## 1. 问题背景

遇到如下代码：

```cpp
table[st].push_back(make_pair<int, int>(ed, dis));
```

编译时报错：

```text
error: no matching function for call to 'make_pair'
note: candidate function template not viable: expects an rvalue for 1st argument
```

原因是：**显式指定了 `make_pair<int, int>`，导致参数类型变成 `int&&`，而 `ed` / `dis` 是左值，不能绑定到右值引用。**

正确写法一般是：

```cpp
table[st].push_back(make_pair(ed, dis));
```

更推荐：

```cpp
table[st].emplace_back(ed, dis);
```

---

## 2. 左值和右值

先区分两个概念：

```cpp
int a = 1;
```

变量 `a` 的**声明类型**是：

```cpp
int
```

但是表达式：

```cpp
a
```

是一个**左值表达式**。

因为它有名字、可以取地址，也可以出现在赋值号左边：

```cpp
a = 2;
```

而：

```cpp
1
```

是右值。

所以重点是：**模板推导时看的是表达式的值类别，而不只是变量声明类型。**

---

## 3. 什么是转发引用

转发引用是这种形式：

```cpp
template<class T>
void f(T&& x);
```

这里的 `T&&` 不一定是普通右值引用。

当满足两个条件时：

1. 形式是 `T&&`
    
2. `T` 是需要被推导的模板参数
    

那么它就是**转发引用**，也叫 forwarding reference。

它的特点是：

```cpp
int a = 1;

f(a);   // 可以接左值
f(1);   // 也可以接右值
```

---

## 4. 为什么传 `int` 变量会推导成引用

看这个函数：

```cpp
template<class T>
void f(T&& x);
```

调用：

```cpp
int a = 1;
f(a);
```

虽然变量 `a` 的声明类型是 `int`，但是表达式 `a` 是左值。

对转发引用来说，有一条特殊规则：

> 如果实参是左值，那么 `T` 会被推导成左值引用类型。

所以：

```cpp
f(a);
```

推导结果是：

```cpp
T = int&
```

于是参数类型：

```cpp
T&&
```

变成：

```cpp
int& &&
```

然后发生引用折叠：

```cpp
int& && -> int&
```

最终 `x` 的类型是：

```cpp
int&
```

所以它可以绑定到左值 `a`。

---

## 5. 引用折叠规则

引用折叠规则可以记成：

```cpp
T&  &  -> T&
T&  && -> T&
T&& &  -> T&
T&& && -> T&&
```

一句话记忆：

> 只要有一个 `&`，最后就是左值引用；只有两个都是 `&&`，最后才是右值引用。

---

## 6. 左值和右值调用时的推导区别

```cpp
template<class T>
void f(T&& x);
```

### 传左值

```cpp
int a = 1;
f(a);
```

推导过程：

```cpp
T = int&
T&& = int& &&
int& && -> int&
```

最终：

```cpp
x 的类型是 int&
```

### 传右值

```cpp
f(1);
```

推导过程：

```cpp
T = int
T&& = int&&
```

最终：

```cpp
x 的类型是 int&&
```

所以转发引用可以同时接收左值和右值。

---

## 7. 为什么手动指定模板参数会报错

看 `std::make_pair` 的形式，大概是：

```cpp
template<class T1, class T2>
std::pair<...> make_pair(T1&& x, T2&& y);
```

正常写：

```cpp
make_pair(ed, dis);
```

因为 `ed` 和 `dis` 是左值，所以推导：

```cpp
T1 = int&
T2 = int&
```

于是参数类型：

```cpp
T1&& -> int& && -> int&
T2&& -> int& && -> int&
```

所以可以接收左值。

但是你写：

```cpp
make_pair<int, int>(ed, dis);
```

这时你已经手动指定：

```cpp
T1 = int
T2 = int
```

所以参数类型直接变成：

```cpp
int&&
int&&
```

而 `ed` / `dis` 是左值，不能绑定到 `int&&`。

所以报错：

```text
expects an rvalue for 1st argument
```

本质原因是：**显式指定模板参数破坏了转发引用的自动推导能力。**

---

## 8. 为什么叫“转发”引用

转发引用常常配合 `std::forward<T>` 使用。

例如：

```cpp
void real_func(int&) {
    cout << "left value\n";
}

void real_func(int&&) {
    cout << "right value\n";
}

template<class T>
void wrapper(T&& x) {
    real_func(std::forward<T>(x));
}
```

调用：

```cpp
int a = 1;

wrapper(a); // real_func(int&)
wrapper(1); // real_func(int&&)
```

`std::forward<T>(x)` 的作用是：

> 根据 `T` 的推导结果，保留传入参数原本的左值 / 右值属性。

---

## 9. 为什么函数内部还要 `std::forward`

注意：

```cpp
template<class T>
void wrapper(T&& x) {
    real_func(x);
}
```

这里的 `x` 虽然类型可能是 `int&&`，但只要它有名字，表达式 `x` 本身就是左值。

所以：

```cpp
wrapper(1);
```

虽然外面传进来的是右值，但是函数内部：

```cpp
real_func(x);
```

会把 `x` 当左值传递。

因此：

```cpp
template<class T>
void wrapper_bad(T&& x) {
    real_func(x);
}

template<class T>
void wrapper_good(T&& x) {
    real_func(std::forward<T>(x));
}
```

区别是：

```cpp
int a = 1;

wrapper_bad(a);   // left value
wrapper_bad(1);   // left value

wrapper_good(a);  // left value
wrapper_good(1);  // right value
```

---

## 10. `std::move` 和 `std::forward` 的区别

### `std::move`

```cpp
std::move(x)
```

无条件把 `x` 转成右值。

它不管 `x` 原来是左值还是右值。

### `std::forward<T>`

```cpp
std::forward<T>(x)
```

有条件地转发：

- 如果 `T` 被推导成左值引用，例如 `int&`，那它转发成左值
    
- 如果 `T` 被推导成普通类型，例如 `int`，那它转发成右值
    

所以：

```cpp
std::move(x)
```

是无条件移动语义；

```cpp
std::forward<T>(x)
```

是保持原始值类别的完美转发。

---

## 11. 对比几种模板参数写法

```cpp
template<class T>
void f1(T x);    // 按值传递

template<class T>
void f2(T& x);   // 左值引用

template<class T>
void f3(T&& x);  // 转发引用
```

调用：

```cpp
int a = 1;

f1(a);
f2(a);
f3(a);
f3(1);
```

推导结果：

```cpp
f1(a): T = int,  x 是一份拷贝
f2(a): T = int,  x 是 int&
f3(a): T = int&, x 是 int&
f3(1): T = int,  x 是 int&&
```

最特殊的是：

```cpp
f3(a)
```

虽然 `a` 的声明类型是 `int`，但因为 `a` 是左值表达式，所以：

```cpp
T = int&
```

这是转发引用特有的推导规则。

---

## 12. 回到 `make_pair` 的例子

错误写法：

```cpp
table[st].push_back(make_pair<int, int>(ed, dis));
```

这里手动指定模板参数后：

```cpp
T1 = int
T2 = int
```

于是：

```cpp
T1&& = int&&
T2&& = int&&
```

但 `ed` / `dis` 是变量名表达式，是左值，所以不能传给 `int&&`。

正确写法：

```cpp
table[st].push_back(make_pair(ed, dis));
```

让编译器自己推导：

```cpp
T1 = int&
T2 = int&
```

最终参数类型变成：

```cpp
int&
int&
```

可以正常绑定左值。

更推荐写法：

```cpp
table[st].emplace_back(ed, dis);
```

如果 `table[st]` 的类型是：

```cpp
vector<pair<int, int>>
```

那么 `emplace_back(ed, dis)` 会直接在 vector 内部构造 `pair<int, int>`，通常比先 `make_pair` 再 `push_back` 更自然。

---

## 13. 记忆总结

### 转发引用的形式

```cpp
template<class T>
void f(T&& x);
```

其中 `T` 必须参与模板推导。

### 传左值

```cpp
int a = 1;
f(a);
```

推导成：

```cpp
T = int&
T&& = int& && = int&
```

### 传右值

```cpp
f(1);
```

推导成：

```cpp
T = int
T&& = int&&
```

### 手动指定模板参数

```cpp
f<int>(a);
```

此时没有推导：

```cpp
T = int
T&& = int&&
```

所以左值 `a` 不能绑定到 `int&&`。

---

## 14. 一句话理解

转发引用就是模板里的 `T&&`。它在自动推导时会根据实参是左值还是右值，把 `T` 推导成不同类型：

```cpp
左值 -> T = T&
右值 -> T = T
```

然后通过引用折叠，让同一个函数参数既能接左值，也能接右值。

如果再配合：

```cpp
std::forward<T>(x)
```

就可以把这个左值 / 右值属性继续传给下一个函数，这就是所谓的完美转发。