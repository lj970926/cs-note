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

| 方案 | 优点 | 缺点 |
|------|------|------|
| AtomicStampedReference | 完全解决 ABA | 内存开销大，性能较低 |
| AtomicMarkableReference | 解决部分场景 | 只能检测"是否修改过" |
| 版本号包装 | 灵活，可定制 | 需要额外编码 |
| 检测节点是否被回收 | 特定场景有效 | 适用范围有限 |

## 参考

- [Java 并发编程实战](https://jcip.net/)
- [AtomicStampedReference 文档](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/atomic/AtomicStampedReference.html)
