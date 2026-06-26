intrusive 容器的核心优势是：容器不分配节点，节点直接嵌在对象里。
在这个项目里，T 继承/包含 Link<T>，所以对象本身就是链表节点：
```c++
  template <typename T> class Link {
      Link* prev;
      Link* volatile next;
  };
  ```
  

  优势主要是这些：

  1. 无额外内存分配
     普通 std::list<T> 每插入一个元素通常要分配一个 list node；intrusive list 不需要，T 自己已经带了 prev/next。这对 runtime、scheduler、线程库这种底层代码
     很重要。
  2. 性能更稳定
     没有 allocator 路径，没有 malloc/free 抖动，也少了失败点。对调度队列、等待队列、ready queue 这类高频路径很有价值。
  3. 缓存局部性更好
     普通链表节点里再包一个 T，或者节点和对象分离；intrusive 容器的链指针就在对象里，少一层间接访问。
  4. 对象生命周期由外部控制
     容器只是“挂住”对象，不拥有对象。比如线程控制块、任务对象、锁等待者通常本来就有自己的生命周期，intrusive 容器很适合这种场景。
  5. 移动/转移队列便宜
     这个文件里很多操作都是拼接一段链：

     push(T& first, T& last)
     splice_back(T& first, T& last)
     transferAllFrom(...)

     这些只改几个指针，整段元素不用复制、不用分配、不用逐个搬。
  6. 可以做到非常薄
     IntrusiveStack 只有一个 head，IntrusiveQueue 只有 head/tail，IntrusiveList 只有一个 anchor。这种数据结构适合内核/运行时/并发原语内部使用。

  代价也很明显：

  - T 必须配合容器设计，不能随便塞任意类型。
  - 一个 Link<T> 同一时刻通常只能挂在一个容器里。
  - 如果要让同一个对象同时在多个队列里，需要多个 link 字段或不同 ID/tag 设计。
  - 容器不负责内存生命周期，误删对象、重复入队、忘记出队都更危险。
  - 封装性差一点，类型和容器耦合更紧。

  所以总结一下：intrusive 容器牺牲通用性和安全边界，换取无分配、低开销、可预测性能和快速拼接。在 uThreads 这种调度/并发 runtime 里，这个取舍通常是合理的。