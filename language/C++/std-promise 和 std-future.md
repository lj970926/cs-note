`std::promise` 和 `std::future` 是 C++11 提供的一对“一次性”异步结果传递机制：**生产者通过 `promise` 写入结果，消费者通过 `future` 读取结果**。它们共享同一块状态（shared state），完成一次跨线程的“值/异常 + 同步”传递。

```
producer thread                 consumer thread
   promise.set_value(x)  ───►    future.get()  得到 x
```

---

## 1. 三个核心概念

- **shared state（共享状态）**：堆上分配的一块内存，保存「结果 / 异常」以及「是否就绪」的标志，还带同步原语。`promise` 和它对应的 `future` 都指向这块状态。
- **`std::promise<T>`**：写入端。负责往 shared state 里 `set_value` 或 `set_exception`。
- **`std::future<T>`**：读取端。`get()` 会阻塞，直到 shared state 就绪，然后取出结果（或重新抛出异常）。

一个 `promise` 只能通过 `get_future()` 拿到 **一个** `future`，结果只能被 `get()` 取走一次。这就是“一次性”的含义。

---

## 2. 最小例子

```
#include <future>
#include <thread>
#include <iostream>

void worker(std::promise<int> p) {
    // ... 做一些计算
    p.set_value(42);              // 写入结果，唤醒等待方
}

int main() {
    std::promise<int> p;
    std::future<int> f = p.get_future();   // 先拿 future

    std::thread t(worker, std::move(p));    // promise 只能 move，不能 copy

    std::cout << f.get() << "\n";           // 阻塞直到 set_value，输出 42
    t.join();
}
```

要点：

- `promise` 不可拷贝，只能 `std::move`。
- `get_future()` 一般在启动线程**之前**调用，避免竞态。
- `f.get()` 阻塞等待。

---

## 3. 传递异常

`promise` 不仅能传值，也能传异常，这是它相比裸 `condition_variable` 的一大优势。

```
void worker(std::promise<int> p) {
    try {
        throw std::runtime_error("boom");
    } catch (...) {
        p.set_exception(std::current_exception());
    }
}

// 消费者侧：
try {
    int v = f.get();          // 这里会重新抛出 runtime_error
} catch (const std::exception& e) {
    std::cout << e.what();    // boom
}
```

`set_exception` 接受一个 `std::exception_ptr`，通常配合 `std::current_exception()` 使用。

---

## 4. 几个容易踩的坑

### 4.1 重复设置会抛异常

对同一个 `promise` 调用两次 `set_value`/`set_exception`，第二次抛 `std::future_error`，错误码 `promise_already_satisfied`。

### 4.2 promise 析构时没设值 → broken_promise

如果 `promise` 在没有 `set_value`/`set_exception` 的情况下被销毁，shared state 会被存入一个 `broken_promise` 异常，等待方的 `get()` 会抛 `std::future_error(broken_promise)`。这样消费者不会永久卡死。

```
{
    std::promise<int> p;
    std::future<int> f = p.get_future();
    // p 在这里析构，且从未 set_value
}                              // f.get() 会抛 broken_promise
```

### 4.3 future.get() 只能调用一次

`get()` 会把结果从 shared state 中**移出**，并使 `future` 失效（`valid() == false`）。再次调用 `get()` 是未定义行为（实现上通常抛 `no_state`）。

如果需要多个线程/多次读取同一个结果，用 `std::shared_future`（见第 6 节）。

---

## 5. wait / wait_for / wait_until

`future` 除了 `get()`，还有几个只等待、不取值的接口：

```
f.wait();                                  // 阻塞直到就绪
f.wait_for(std::chrono::seconds(1));       // 最多等 1 秒
f.wait_until(deadline);                    // 等到某个时间点
```

`wait_for` / `wait_until` 返回 `std::future_status`：

|状态|含义|
|---|---|
|`ready`|结果已就绪，可以 `get()`|
|`timeout`|超时，还没就绪|
|`deferred`|结果由一个 deferred 的 `std::async` 任务提供，尚未运行|

典型轮询写法：

```
while (f.wait_for(std::chrono::milliseconds(100)) != std::future_status::ready) {
    // 干点别的，或者检查取消标志
}
int v = f.get();
```

---

## 6. std::future vs std::shared_future

|对比项|`std::future`|`std::shared_future`|
|---|---|---|
|可拷贝|否（只能 move）|是|
|`get()` 次数|一次|多次|
|多线程同时读|不行|可以（多个副本各自 get）|
|获取方式|`promise.get_future()`|`future.share()` 或直接构造|

当“一个结果要被多个消费者读取”时，用 `shared_future`：

```
std::promise<int> p;
std::shared_future<int> sf = p.get_future().share();

// 多个线程都可以持有 sf 的副本并各自 get()
auto a = std::async(std::launch::async, [sf]{ return sf.get() + 1; });
auto b = std::async(std::launch::async, [sf]{ return sf.get() + 2; });
```

注意：`shared_future::get()` 返回的是 `const T&`（对非 void、非引用类型），多次调用拿到的是同一个值。

---

## 7. 和 std::async / std::packaged_task 的关系

`promise` 是最底层、最手动的写入端。上层有两个更方便的封装，它们都产出 `future`：

- **`std::async`**：直接跑一个函数并返回 `future`，框架内部帮你管理 `promise`。
```
std::future<int> f = std::async(std::launch::async, []{ return 42; });
```
- **`std::packaged_task`**：把一个可调用对象包装成“调用即写入 shared state”，常用于线程池里把任务和结果解耦。
```
std::packaged_task<int()> task([]{ return 42; });
std::future<int> f = task.get_future();
std::thread(std::move(task)).join();      // 调用 task() 即写入结果
```

选择顺序（从高到低封装）：

```
能用 std::async 就用 std::async
需要把任务塞进线程池 → std::packaged_task
需要完全手动控制“何时、由谁写入结果” → std::promise
```

---

## 8. 一个常见用法：等待子线程完成 + 拿返回值

裸 `std::thread` 没法直接返回值，`promise`/`future` 正好补上这个缺口：

```
std::promise<std::string> p;
auto f = p.get_future();

std::thread t([pr = std::move(p)]() mutable {
    pr.set_value(load_config());   // 把返回值通过 promise 送出去
});

std::string cfg = f.get();          // 主线程拿到子线程的“返回值”
t.join();
```

---

## 9. 怎么记？

```
promise  = 写入端（生产者）：set_value / set_exception
future   = 读取端（消费者）：get / wait
两者共享一块 shared state，传一次值/异常 + 一次同步
```

更实用一点：

```
只读一次               -> std::future
多人/多次读            -> std::shared_future
跑个函数拿结果         -> std::async
任务进线程池           -> std::packaged_task
手动控制写入时机       -> std::promise
```

记几个异常：

```
重复 set            -> promise_already_satisfied
没 set 就析构        -> broken_promise
get 第二次          -> no_state（future 已失效）
```

---

## 相关

- [[memory order]]
- [[Coroutine]]
