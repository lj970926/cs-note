---
title: ABA问题
tags:
  - cpp
  - concurrency
  - lock-free
---

# ABA 问题

## 什么是 ABA 问题？

ABA 问题是在并发编程中使用**无锁算法**（如 CAS 操作）时可能出现的一种经典问题。

### 问题描述

线程1读取了某个变量的值 A，然后被挂起。此时线程2将该变量从 A 改为 B，又改回 A。当线程1恢复执行时，它看到值仍然是 A，就认为没有被修改过，但实际上值已经被修改了。

### 问题本质

**ABA 问题的核心是：值虽然相同，但状态可能已经改变。**

## 问题演示

### 示例场景：链表删除

```
初始状态：1 → 2 → 3

线程1准备删除节点2，步骤：
1. 读取 prev = 1, curr = 2, next = 3
2. 检查 curr 是否为 2？是
3. （此时线程1被挂起）

线程2的操作：
1. 删除节点1和2
2. 删除节点3
3. 重新创建节点1和2（值相同但对象不同）
4. 链表变为：1 → 2

线程1恢复：
4. 执行 prev.next = next（即 1.next = 3）
5. 但节点3已经被删除，导致问题！
```

### C++ 实际代码示例

以下是一个在 C++ 中可能遇到 ABA 问题的代码示例：

```cpp
#include <atomic>
#include <iostream>
#include <thread>
#include <vector>

// 简单的链表节点
struct Node {
    int value;
    Node* next;
    Node(int v) : value(v), next(nullptr) {}
};

// 有问题的无锁栈实现
class BrokenLockFreeStack {
private:
    std::atomic<Node*> top_{nullptr};

public:
    void push(int value) {
        Node* new_node = new Node(value);
        Node* old_top;
        do {
            old_top = top_.load(std::memory_order_acquire);
            new_node->next = old_top;
        } while (!top_.compare_exchange_weak(old_top, new_node,
                    std::memory_order_release, std::memory_order_relaxed));
    }

    // ⚠️ 这里存在 ABA 问题！
    int pop() {
        Node* old_top;
        Node* next;
        do {
            old_top = top_.load(std::memory_order_acquire);
            if (old_top == nullptr) {
                return -1;  // 栈为空
            }
            next = old_top->next;
            // 问题：CAS 只检查指针值，不检查节点是否被回收复用
        } while (!top_.compare_exchange_weak(old_top, next,
                    std::memory_order_release, std::memory_order_relaxed));

        int value = old_top->value;
        delete old_top;  // ⚠️ 删除节点后，内存可能被复用！
        return value;
    }
};

// 用于测试的全局栈
BrokenLockFreeStack stack;

// 线程1：执行 push 和 pop 操作
void thread1_func() {
    for (int i = 0; i < 100000; ++i) {
        stack.push(1);
        stack.pop();
    }
}

// 线程2：执行 push 和 pop 操作
void thread2_func() {
    for (int i = 0; i < 100000; ++i) {
        stack.push(2);
        stack.pop();
    }
}

int main() {
    std::cout << "测试 ABA 问题..." << std::endl;
    std::cout << "注意：ABA 问题可能导致段错误或数据损坏" << std::endl;
    std::cout << "在某些系统上可能不会立即显现，但问题确实存在" << std::endl;

    // 启动多个线程并发操作
    std::vector<std::thread> threads;
    threads.emplace_back(thread1_func);
    threads.emplace_back(thread2_func);
    threads.emplace_back(thread1_func);
    threads.emplace_back(thread2_func);

    for (auto& t : threads) {
        t.join();
    }

    std::cout << "测试完成（但可能存在问题）" << std::endl;
    return 0;
}
```

### ABA 问题发生过程

```
时间线：

1. 线程1 执行 pop()，读取 top = A（节点值为 1）
2. 线程1 准备执行 CAS，但被挂起

3. 线程2 执行 pop()，弹出节点 A，delete A
4. 线程2 执行 push(2)，新分配内存，恰好复用了 A 的地址
5. 线程2 执行 pop()，弹出节点 B，delete B
6. 线程2 执行 push(1)，新分配内存，恰好复用了 A 的地址
   此时 top 指向的新节点，地址与 A 相同，但 next 指针不同！

7. 线程1 恢复执行，CAS 发现 top 仍然是 A（地址相同）
8. 线程1 执行成功，但 next 指针可能已经改变
9. 可能导致：访问已释放内存、段错误、数据损坏
```

## CAS 与 ABA 问题

### CAS 操作

CAS（Compare And Swap）是实现无锁算法的核心操作：

```java
// 伪代码
boolean compareAndSwap(AtomicReference ref, V expected, V newValue) {
    if (ref.get() == expected) {
        ref.set(newValue);
        return true;
    }
    return false;
}
```

### 问题示例

```java
// 初始值: A
AtomicReference<Integer> ref = new AtomicReference<>(A);

// 线程1: 读取期望值 A
Integer expect = ref.get();  // expect = A

// 线程2: A → B → A
ref.compareAndSet(A, B);  // 成功
ref.compareAndSet(B, A);  // 成功

// 线程1: 执行 CAS
ref.compareAndSet(A, C);  // 成功！但值已经不是原来的 A 了
```

## 解决方案

### 1. 版本号（AtomicStampedReference）

使用版本号来标识每次修改，即使值相同，版本号也不同。

```java
import java.util.concurrent.atomic.AtomicStampedReference;

public class ABASolution {
    private static AtomicStampedReference<Integer> ref = 
        new AtomicStampedReference<>(1, 0);
    
    public void solve() {
        int stamp = ref.getStamp();  // 获取版本号
        Integer value = ref.getReference();
        
        // CAS 时同时检查值和版本号
        ref.compareAndSet(value, value + 1, stamp, stamp + 1);
    }
}
```

### 2. 使用标记值（AtomicMarkableReference）

使用布尔标记来检测是否被修改过。

```java
import java.util.concurrent.atomic.AtomicMarkableReference;

public class ABAMarkable {
    private static AtomicMarkableReference<Integer> ref = 
        new AtomicMarkableReference<>(1, false);
    
    public void solve() {
        boolean[] markHolder = {false};
        Integer value = ref.get(markHolder);
        boolean mark = markHolder[0];
        
        // CAS 时同时检查标记
        ref.compareAndSet(value, value + 1, mark, !mark);
    }
}
```

### 3. 自定义对象包装

将值和版本号封装在一个对象中。

```java
public class VersionedValue<T> {
    private final T value;
    private final long version;
    
    public VersionedValue(T value, long version) {
        this.value = value;
        this.version = version;
    }
    
    // getter 方法...
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        VersionedValue<?> that = (VersionedValue<?>) o;
        return version == that.version && 
               Objects.equals(value, that.value);
    }
}

// 使用
AtomicReference<VersionedValue<Integer>> ref = 
    new AtomicReference<>(new VersionedValue<>(1, 0));
```

### 4. C++ 解决方案：使用带版本号的原子操作

```cpp
#include <atomic>
#include <cstdint>

// 带版本号的指针，用于解决 ABA 问题
template<typename T>
class TaggedPointer {
private:
    // 使用 64 位：高 32 位为版本号，低 32 位为指针
    // 注意：实际项目中应使用 128 位原子操作
    std::atomic<uint64_t> data_;

public:
    TaggedPointer() : data_(0) {}
    
    TaggedPointer(T* ptr, uint32_t tag) {
        uint64_t val = (static_cast<uint64_t>(tag) << 32) | 
                       reinterpret_cast<uintptr_t>(ptr);
        data_.store(val, std::memory_order_relaxed);
    }
    
    T* get_ptr() const {
        uint64_t val = data_.load(std::memory_order_acquire);
        return reinterpret_cast<T*>(val & 0xFFFFFFFF);
    }
    
    uint32_t get_tag() const {
        uint64_t val = data_.load(std::memory_order_acquire);
        return static_cast<uint32_t>(val >> 32);
    }
    
    // CAS 操作：同时比较指针和版本号
    bool compare_exchange(T* expected_ptr, uint32_t expected_tag,
                          T* new_ptr, uint32_t new_tag) {
        uint64_t expected = (static_cast<uint64_t>(expected_tag) << 32) | 
                           reinterpret_cast<uintptr_t>(expected_ptr);
        uint64_t desired = (static_cast<uint64_t>(new_tag) << 32) | 
                          reinterpret_cast<uintptr_t>(new_ptr);
        return data_.compare_exchange_strong(expected, desired,
                    std::memory_order_release, std::memory_order_relaxed);
    }
};

// 使用示例：安全的无锁栈
template<typename T>
class SafeLockFreeStack {
private:
    struct Node {
        T value;
        Node* next;
        Node(const T& v) : value(v), next(nullptr) {}
    };
    
    TaggedPointer<Node> top_;
    uint32_t version_{0};  // 全局版本号

public:
    void push(const T& value) {
        Node* new_node = new Node(value);
        TaggedPointer<Node> old_top;
        TaggedPointer<Node> new_top;
        
        do {
            old_top = top_;
            new_top = TaggedPointer<Node>(new_node, old_top.get_tag() + 1);
            new_node->next = old_top.get_ptr();
        } while (!top_.compare_exchange(
                    old_top.get_ptr(), old_top.get_tag(),
                    new_top.get_ptr(), new_top.get_tag()));
    }
    
    bool pop(T& result) {
        TaggedPointer<Node> old_top;
        TaggedPointer<Node> new_top;
        
        do {
            old_top = top_;
            if (old_top.get_ptr() == nullptr) {
                return false;  // 栈为空
            }
            new_top = TaggedPointer<Node>(
                old_top.get_ptr()->next, 
                old_top.get_tag() + 1);
        } while (!top_.compare_exchange(
                    old_top.get_ptr(), old_top.get_tag(),
                    new_top.get_ptr(), new_top.get_tag()));
        
        result = old_top.get_ptr()->value;
        // 注意：实际项目中应使用 hazard pointer 或 epoch-based reclamation
        delete old_top.get_ptr();
        return true;
    }
};
```

### 5. C++ 更优雅的方案：Hazard Pointer

Hazard Pointer 是一种内存回收机制，可以完全避免 ABA 问题：

```cpp
#include <atomic>
#include <vector>
#include <thread>

// Hazard Pointer 的简化实现概念
class HazardPointer {
private:
    // 每个线程有一个 hazard pointer
    static thread_local std::atomic<void*> hazard_ptr_;
    
    // 全局待回收列表
    static std::vector<void*> retire_list_;
    static std::atomic<int> retire_count_;

public:
    // 保护指针
    static void protect(void* ptr) {
        hazard_ptr_.store(ptr, std::memory_order_seq_cst);
    }
    
    // 取消保护
    static void unprotect() {
        hazard_ptr_.store(nullptr, std::memory_order_seq_cst);
    }
    
    // 检查指针是否被保护
    static bool is_protected(void* ptr) {
        return hazard_ptr_.load(std::memory_order_seq_cst) == ptr;
    }
    
    // 回收内存（简化版）
    static void retire(void* ptr) {
        retire_list_.push_back(ptr);
        retire_count_++;
        
        // 当退休列表达到阈值时，清理未被保护的指针
        if (retire_count_ >= 100) {
            scan_and_reclaim();
        }
    }
    
    static void scan_and_reclaim() {
        std::vector<void*> new_retire_list;
        for (void* ptr : retire_list_) {
            if (!is_protected(ptr)) {
                delete static_cast<char*>(ptr);  // 实际应调用正确的删除器
            } else {
                new_retire_list.push_back(ptr);
            }
        }
        retire_list_ = std::move(new_retire_list);
        retire_count_ = retire_list_.size();
    }
};
```

## 实际应用中的 ABA 问题

### 1. 无锁栈（Lock-Free Stack）

```java
public class LockFreeStack<T> {
    private final AtomicReference<Node<T>> top = new AtomicReference<>();
    
    public void push(T value) {
        Node<T> newHead = new Node<>(value);
        Node<T> oldHead;
        do {
            oldHead = top.get();
            newHead.next = oldHead;
        } while (!top.compareAndSet(oldHead, newHead));
    }
    
    public T pop() {
        Node<T> oldHead = top.get();
        Node<T> newHead;
        do {
            if (oldHead == null) return null;
            newHead = oldHead.next;
        } while (!top.compareAndSet(oldHead, newHead));
        return oldHead.value;
    }
    
    private static class Node<T> {
        final T value;
        Node<T> next;
        Node(T value) { this.value = value; }
    }
}
```

### 2. 无锁队列（Lock-Free Queue）

无锁队列的实现也需要注意 ABA 问题，特别是在处理 head 和 tail 指针时。

## 总结

| 方案 | 优点 | 缺点 | 适用语言 |
|------|------|------|----------|
| AtomicStampedReference | 完全解决 ABA | 内存开销大，性能较低 | Java |
| AtomicMarkableReference | 解决部分场景 | 只能检测"是否修改过" | Java |
| 版本号包装 | 灵活，可定制 | 需要额外编码 | Java/C++ |
| TaggedPointer | 高效，完全解决 | 需要 128 位原子操作支持 | C++ |
| Hazard Pointer | 完全解决，性能好 | 实现复杂，需要全局协调 | C++ |
| Epoch-based Reclamation | 高效，适合读多写少 | 实现复杂 | C++ |
| 检测节点是否被回收 | 特定场景有效 | 适用范围有限 | C++/Java |

## Related
- [[memory order]]
- [[compare_exchange_weak vs strong]]

## 参考

- [Java 并发编程实战](https://jcip.net/)
- [AtomicStampedReference 文档](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/atomic/AtomicStampedReference.html)
- [C++ Concurrency in Action](https://www.manning.com/books/c-plus-plus-concurrency-in-action)
- [Hazard Pointers: Safe Memory Reclamation for Lock-Free Data Structures](https://www.cs.rochester.edu/u/michael/PODC2004.pdf)
- [ABA 问题详解（中文）](https://zhuanlan.zhihu.com/p/348644459)
