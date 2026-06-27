---
title: compare_exchange_weak vs strong
tags:
  - cpp
  - concurrency
  - lock-free
---

`compare_exchange_weak` 和 `compare_exchange_strong` 都是 C++ 原子 CAS 操作：

```
bool compare_exchange_xxx(    T& expected,    T desired,    std::memory_order success,    std::memory_order failure);
```

它们都会尝试做这件事：

```
if (atomic_value == expected) {    atomic_value = desired;    return true;} else {    expected = atomic_value;    return false;}
```

区别主要在于：**weak 允许“伪失败”，strong 不允许。**

---

## 1. 共同点：失败时会改写 expected

这是很多人第一次用 CAS 容易踩的坑。

```
std::atomic<int> x{10};int expected = 5;bool ok = x.compare_exchange_strong(expected, 20);
```

因为 `x == 10`，而 `expected == 5`，CAS 失败。

失败后：

```
ok == falseexpected == 10x == 10
```

也就是说，失败时 `expected` 会被更新成当前原子变量的真实值。

---

## 2. strong：只在值真的不等时失败

```
std::atomic<int> x{0};int expected = 0;bool ok = x.compare_exchange_strong(expected, 1);
```

如果没有其他线程干扰，通常可以认为：

```
x == expected  => 成功x != expected  => 失败
```

所以 `compare_exchange_strong` 更适合只尝试一次的场景。

例如实现 `try_lock()`：

```
class SpinLock {public:    bool try_lock() noexcept {        bool expected = false;        return locked_.compare_exchange_strong(            expected,            true,            std::memory_order_acquire,            std::memory_order_relaxed        );    }    void unlock() noexcept {        locked_.store(false, std::memory_order_release);    }private:    std::atomic<bool> locked_{false};};
```

这里 `try_lock()` 语义就是“试一次”。如果锁确实是空闲的，就最好不要因为伪失败而返回失败。因此用 `strong` 更自然。

---

## 3. weak：即使值相等，也允许失败

```
std::atomic<int> x{0};int expected = 0;bool ok = x.compare_exchange_weak(expected, 1);
```

理论上可能出现：

```
x == expected，但 CAS 返回 false
```

这叫 **spurious failure**，伪失败。

为什么允许这种行为？因为一些 CPU 架构的原子操作不是单条 CAS 指令，而是类似 LL/SC：

```
load-linkedstore-conditional
```

中间只要发生一些干扰，`store-conditional` 就可能失败，即使内存里的值逻辑上没变。C++ 允许 `weak` 暴露这种失败，从而让编译器生成更轻量的代码。

---

## 4. weak 通常放在循环里

典型写法：

```
std::atomic<int> x{0};int old = x.load(std::memory_order_relaxed);while (!x.compare_exchange_weak(    old,    old + 1,    std::memory_order_release,    std::memory_order_relaxed)) {    // 注意：失败后 old 已经被更新为 x 当前值}
```

这个循环的意思是：把 `x` 原子地加一。

但实际上这个例子可以直接用：

```
x.fetch_add(1);
```

CAS 循环通常用于“新值依赖旧值”的复杂更新，比如：

```
void update_max(std::atomic<int>& max_value, int candidate) {    int old = max_value.load(std::memory_order_relaxed);    while (candidate > old &&           !max_value.compare_exchange_weak(               old,               candidate,               std::memory_order_relaxed,               std::memory_order_relaxed           )) {        // 如果 CAS 失败，old 会自动变成当前 max_value        // 然后重新判断 candidate > old    }}
```

这里用 `weak` 很合适，因为反正外面有循环，伪失败只是多转一圈。

---

## 5. 最核心对比

|项目|`compare_exchange_weak`|`compare_exchange_strong`|
|---|---|---|
|值相等时是否可能失败|可能|不会因为伪失败而失败|
|是否有 spurious failure|允许|不允许|
|适合场景|CAS 循环|单次尝试|
|常见用途|lock-free stack/queue、计数更新、自旋锁循环|`try_lock()`、状态机单次转换|
|在 x86 上差异|通常没区别|通常没区别|
|在 ARM/POWER 等架构上|可能更容易生成轻量代码|可能内部需要重试|

---

## 6. 在 spin lock 里怎么选？

### `try_lock()`：用 strong

```
bool try_lock() noexcept {    bool expected = false;    return locked_.compare_exchange_strong(        expected,        true,        std::memory_order_acquire,        std::memory_order_relaxed    );}
```

因为 `try_lock()` 只尝试一次。锁空闲却因为伪失败返回 false，不太符合直觉。

---

### `lock()` 循环：用 weak

```
void lock() noexcept {    for (;;) {        bool expected = false;        if (locked_.compare_exchange_weak(                expected,                true,                std::memory_order_acquire,                std::memory_order_relaxed)) {            return;        }    }}
```

因为外面本来就在循环，weak 的伪失败没关系。

不过上面这个版本会一直做 CAS，竞争下缓存一致性压力比较大。更好的 TTAS 写法是：

```
void lock() noexcept {    for (;;) {        while (locked_.load(std::memory_order_relaxed)) {            pause();        }        bool expected = false;        if (locked_.compare_exchange_weak(                expected,                true,                std::memory_order_acquire,                std::memory_order_relaxed)) {            return;        }    }}
```

---

## 7. failure memory order 有限制

CAS 有两个 memory order：

```
compare_exchange_weak(expected, desired, success_order, failure_order)
```

成功时发生“读 + 写”，使用 `success_order`。

失败时只发生“读”，使用 `failure_order`。

所以 `failure_order` 不能是：

```
std::memory_order_releasestd::memory_order_acq_rel
```

因为失败时没有写操作，谈不上 release。

常见组合：

```
compare_exchange_weak(    expected,    desired,    std::memory_order_acq_rel,    std::memory_order_acquire);
```

或者：

```
compare_exchange_weak(    expected,    desired,    std::memory_order_release,    std::memory_order_relaxed);
```

---

## 8. 一个重要细节：expected 每次循环要不要重置？

看场景。

### 场景 A：自旋锁，需要每轮重置

```
for (;;) {    bool expected = false;    if (locked_.compare_exchange_weak(            expected,            true,            std::memory_order_acquire,            std::memory_order_relaxed)) {        return;    }}
```

因为你每次都想比较：

```
locked_ == false ?
```

如果失败后 `expected` 被改成了 `true`，下一轮不重置的话，就会变成尝试：

```
locked_ == true ? then set true
```

这就错了。

所以 spin lock 的 CAS 循环里，`expected = false` 要在每次 CAS 前准备好。

---

### 场景 B：基于旧值更新，不要手动重置

```
int old = x.load();while (!x.compare_exchange_weak(old, old + 1)) {    // old 已经被更新为当前 x}
```

这里不要每次把 `old` 重置成最开始的值。因为失败后你正好需要用新的 `old` 计算新的 `desired`。

更严谨的写法是：

```
int old = x.load(std::memory_order_relaxed);for (;;) {    int desired = old + 1;    if (x.compare_exchange_weak(            old,            desired,            std::memory_order_release,            std::memory_order_relaxed)) {        break;    }    // CAS 失败后 old 已经变成 x 当前值}
```

---

## 9. 怎么记？

可以这样记：

```
weak：可能假失败，所以适合 while 循环里用strong：不会假失败，所以适合只试一次
```

更实用一点：

```
CAS loop     -> compare_exchange_weaksingle shot  -> compare_exchange_strongtry_lock     -> compare_exchange_stronglock loop    -> compare_exchange_weak
```

不过在 x86 上，两者通常生成一样或非常接近的代码；在可移植 C++ 里，上面这个选择习惯更合理。

## Related
- [[memory order]]
- [[ABA问题]]