---
title: CUDACachingAllocator
tags:
  - source-reading
  - mlsys
  - cuda
  - gpu
aliases:
  - CUDA Caching Allocator
  - Tensor.record_stream
---

## `Tensor.record_stream()`：管理跨 stream 的显存生命周期

> [!important] 核心结论
> `Tensor.record_stream()` **不是用来做 CUDA stream 同步的**，而是告诉 PyTorch 的 CUDA caching allocator：这块 Tensor 的显存还在被指定 stream 使用，不要过早回收或复用。

Tensor 如果在“非创建它的 stream”上被使用，`record_stream()` 会让 allocator 延迟复用它的内存，直到该 stream 上相关工作完成。

### 1. 为什么同一个 stream 通常不需要 `record_stream()`

CUDA kernel 是异步执行的：CPU 执行到 `del x` 时，GPU 可能还在读取 `x`。

```python
x = torch.randn(1024, device="cuda")
y = x * 2
del x
```

平时这不会出问题，是因为这些操作默认处于同一个 CUDA stream。同一个 stream 内的工作按 FIFO 顺序执行：

```text
stream 0:

allocate X
    |
kernel uses X
    |
reuse X's memory
```

即使 caching allocator 很快将 `x` 的显存 block 分给另一个 Tensor，使用新 Tensor 的 GPU 操作也排在旧操作之后。因此：

> 同一个 stream 上，allocator 可以依靠 stream ordering 安全复用内存，无需 `record_stream()`。

### 2. 跨 stream 时的问题

假设 `x` 在 default stream 创建，却在 side stream `s` 上使用：

```python
s = torch.cuda.Stream()

x = torch.randn(1024, device="cuda")

s.wait_stream(torch.cuda.current_stream())

with torch.cuda.stream(s):
    y = x * 2
```

此时 CPU 继续执行：

```python
del x
z = torch.empty(1024, device="cuda")
```

`x` 的 Python 对象已经销毁。allocator 知道 `x` 在 default stream 分配，但如果没有额外信息，它不知道 stream `s` 上仍有 kernel 使用 `x`：

```text
default stream                  stream s

x memory ----+
             |
del x        |
             |                  kernel reads x
reuse as z   |                  |
write z      |                  |
             +------ RACE ------+
```

这可能导致显存过早复用和 memory corruption。

### 3. `record_stream()` 延长的是显存生命周期

正确写法：

```python
s = torch.cuda.Stream()

x = torch.randn(1024, device="cuda")

s.wait_stream(torch.cuda.current_stream())

with torch.cuda.stream(s):
    y = x * 2
    x.record_stream(s)
```

`x.record_stream(s)` 相当于告诉 allocator：

```text
虽然 x 原本属于 default stream，
但 stream s 现在也在使用它。
```

随后即使 `del x` 令 Python 引用计数归零，allocator 也会等 `s` 上相关工作完成后才允许复用这块显存：

```text
x.record_stream(s)

≈ x 的显存 lifetime 至少延长到 s 使用完 x 为止
```

这里延长的是**底层显存的 lifetime**，不是 Python Tensor 对象的 lifetime。两层生命周期彼此分离：

```text
CPU:
allocate x -> launch foo(x) -> record_stream -> del x
                                             Python 对象死亡

GPU stream s:
wait default -> foo(x) ----------------------> 真正用完显存
```

### 4. `record_stream()` 不等于 `wait_stream()`

两者解决的是不同问题：

| API | 解决的问题 | 直观含义 |
| --- | --- | --- |
| `wait_stream()` | 数据依赖、执行顺序 | 什么时候可以开始用 |
| `record_stream()` | 底层内存生命周期 | 什么时候可以回收内存 |

`wait_stream()` 保证 consumer stream 不会在 producer stream 生产完数据之前读取 Tensor：

```python
x = torch.randn(..., device="cuda")

s.wait_stream(torch.cuda.current_stream())

with torch.cuda.stream(s):
    y = x * 2
```

```text
default stream        stream s

produce x
    |
    +------wait------> consume x
```

`record_stream()` 则保证 consumer stream 尚未用完 Tensor 时，allocator 不会复用它的显存。它**不会**令 `s` 等待 `x` ready。

跨 stream 消费一个 Tensor 时，两者通常搭配出现：

```python
x = torch.randn(..., device="cuda")

# producer -> consumer：建立执行依赖
s.wait_stream(torch.cuda.current_stream())

with torch.cuda.stream(s):
    y = f(x)

    # 延长 x 的底层显存生命周期
    x.record_stream(s)
```

可以记成：

```text
wait_stream   = execution dependency
record_stream = memory lifetime dependency
```

### 5. creation stream 与 foreign stream user

allocator 会把 allocation 与其创建 stream 联系起来。只要 Tensor 始终在该 stream 上使用，就能依靠 FIFO 顺序安全复用，无需每次释放都执行代价高昂的全局同步。

可以把 allocator 的 block 粗略理解为：

```cpp
struct Block {
    void* ptr;
    Stream creation_stream;
    Set<Stream> stream_uses;
};
```

执行：

```python
x.record_stream(s1)
```

近似于：

```cpp
block.stream_uses.insert(s1);
```

Tensor 被释放时，如果 `stream_uses` 非空，allocator 会跟踪相关 stream 的完成状态，暂缓将 block 放回可复用的 free list。真实实现更复杂，并会引入额外的事件管理和查询成本，因此 `record_stream()` 不是越多越好。

规律是：

> Tensor 在非 creation/allocation stream 上被异步使用时，需要管理这次跨-stream使用的内存生命周期：要么调用 `record_stream()`，要么通过 stream/event 同步自行保证 allocator 安全。

这个规律也适用于反向场景：如果 `y` 在 side stream 创建，随后由 default stream 消费，那么 default stream 就是 `y` 的 foreign stream user。

```python
s = torch.cuda.Stream()

s.wait_stream(torch.cuda.current_stream())

with torch.cuda.stream(s):
    y = expensive_op(x)

current = torch.cuda.current_stream()
current.wait_stream(s)
y.record_stream(current)

z = y * 2
```

### 6. PyTorch 通信中的用途与调用位置

PyTorch 通信经常运行在独立的 NCCL stream 上，而参与通信的 Tensor 通常在用户的 compute stream 上分配或生产。因此，通信场景本质上是典型的 foreign stream use。

#### 6.1 哪些通信内存需要保护

`record_stream()` 需要保护的不是某一种 collective，而是 **NCCL stream 尚未完成读写的所有 allocation**：

| 对象 | 典型场景 | NCCL 的访问方式 |
| --- | --- | --- |
| 输入 buffer | `all_reduce`、`reduce_scatter`、`send`、MoE dispatch | 读取或原地读写 |
| 输出 buffer | `all_gather`、`reduce_scatter`、`all_to_all`、`recv` | 写入 |
| 原地 buffer | `all_reduce(x)` | 同时作为输入和输出 |
| 内部临时 buffer | flatten、coalescing、padding、分片、dtype conversion | 取决于具体实现 |

例如异步通信已经下发，但 Python 引用提前消失：

```python
work = dist.all_reduce(x, async_op=True)
del x
```

如果没有额外的生命周期保护，NCCL stream 可能仍在读写 `x`，而 caching allocator 已把同一块显存交给其他 Tensor。类似风险会出现在 DDP gradient bucket、FSDP flat parameter/gradient shard、MoE all-to-all buffer 等通信计算重叠场景。

完整的通信依赖包含两部分：

```text
compute stream 产生数据
        |
        | event / wait：保证数据 ready
        v
NCCL stream 读写数据
        |
        | record_stream / 保留强引用：保证显存仍有效
        v
通信结束后才允许复用显存
```

只有 `record_stream()`，不能阻止 NCCL 读取尚未生产完成的数据；只有 producer-consumer stream wait，又不能阻止 CPU 引用提前消失后 allocator 复用显存。

#### 6.2 应该在通信 kernel 下发后调用吗

推荐写法是放在通信 kernel 下发之后，语义最直观：

```python
with torch.cuda.stream(comm_stream):
    launch_communication(x)
    x.record_stream(comm_stream)
```

但是这不是硬性时序要求。下面的顺序也可以：

```python
with torch.cuda.stream(comm_stream):
    x.record_stream(comm_stream)
    launch_communication(x)
```

因为 `record_stream()` 不是“记录刚才那个 kernel 的完成点”，而是把 `comm_stream` 登记为这块 allocation 的使用者。真正准备回收 Tensor 时，allocator 才会在 recorded stream 上建立完成追踪。只要通信 kernel 已经按 host 顺序进入同一条 stream，stream FIFO 会形成：

```text
comm stream:

communication kernel
        |
allocator completion event
        |
显存允许复用
```

正确性需要同时满足：

1. 登记的是实际执行通信的 stream；
2. Tensor 在通信 kernel 下发前仍然存活；
3. 在 Tensor 可能被释放前完成 `record_stream()`。

因此，“kernel 下发后、Tensor 释放前”是最清晰的调用位置，但真正关键的是 **foreign stream 登记必须发生在 allocator 可能回收显存之前**。

#### 6.3 `ProcessGroupNCCL` 当前主要保留 Tensor 强引用

对于普通：

```python
work = dist.all_reduce(x, async_op=True)
```

用户通常不应该手动猜测并调用：

```python
x.record_stream(some_stream)
```

原因是 `ProcessGroupNCCL` 使用内部 NCCL stream，用户持有的 current stream 不一定是实际通信 stream。当前 PyTorch 实现主要通过 `WorkNCCL` 的 `TensorShelf` 保存输入、输出和 coalescing 临时 Tensor 的强引用，直到用户 stream 已经等待 NCCL stream，再释放这些引用：

```text
发起 async collective
        |
WorkNCCL / TensorShelf 保存参与通信的 Tensor
        |
NCCL stream 执行通信
        |
work.wait()：用户 stream 等待 NCCL stream
        |
清空 TensorShelf
        |
allocator 可以复用显存
```

这与 `record_stream()` 解决的是同一个 allocator safety 问题，但机制不同：

| 方案 | 生命周期保护方式 | 特点 |
| --- | --- | --- |
| `record_stream()` | allocator 跟踪 foreign stream，并用 event 延迟复用 | 通用、简单，但有额外事件管理和查询成本 |
| 保存 Tensor 强引用 | 通信完成前不让引用计数归零 | 生命周期显式，可统一随 `WorkNCCL` 释放 |
| 显式双向同步 | 释放前让 allocation stream 等待 comm stream | 控制精细，但调用方必须掌握完整依赖 |

所以阅读 PyTorch 通信源码时，未看到大量 `recordStream()` 调用，并不意味着不存在跨-stream生命周期问题；它可能已经由 `WorkNCCL` 保存引用处理。只有自己管理 comm stream 或自定义通信 kernel 时，才更常显式写：

```python
with torch.cuda.stream(comm_stream):
    custom_communication(x)
    x.record_stream(comm_stream)
```

### 7. 不调用 `record_stream()` 的替代方案

如果能够完整控制 Tensor 的生命周期，也可以在真正释放 Tensor 之前，把 side stream 的工作显式同步回 creation stream：

```python
with torch.cuda.stream(s0):
    x = ...

s1.wait_stream(s0)

with torch.cuda.stream(s1):
    use(x)

# s0 可以继续执行其他工作
do_other_work()

# 释放 x 前，将 s1 的使用同步回 creation stream
s0.wait_stream(s1)
del x
```

```text
s0                    s1

create x
   |
   +----wait---------> use x
   |                    |
other work              |
   |                    |
   +<----wait------------+
   |
free/reuse x
```

此时 allocator 不需要额外记录 foreign stream，因为 `x` 被释放前，creation stream 已经等待 side stream 使用完成。

在 NCCL、FSDP、通信计算重叠以及 inference runtime 中，常见两种取舍：

```text
简单、安全                           精细、可控
record_stream()  <-------------->  explicit event/wait
```

前者更容易正确管理异步生命周期；后者可以更精确地控制同步和 memory reuse，但要求调用方真正掌握所有 stream 依赖。[[source-code/vllm/DBO 源码梳理|vLLM DBO]] 中的计算/通信 stream 切换和 event 同步就是相关场景。

### 8. 最简心智模型

看到：

```python
tensor.record_stream(stream)
```

可以直接翻译为：

```text
Allocator，这个 tensor 即使马上在 CPU 侧失去所有引用，
stream 仍可能异步使用它的显存；stream 用完前不要复用这块内存。
```

而：

```python
stream.wait_stream(other)
```

表示：

```text
这个 stream 后面提交的任务，必须等待 other 当前已经提交的任务执行完。
```

## 参考资料

- [torch.Tensor.record_stream](https://docs.pytorch.org/docs/stable/generated/torch.Tensor.record_stream.html)
- [CUDA semantics: CUDA streams](https://docs.pytorch.org/docs/stable/notes/cuda.html#cuda-streams)
- [ProcessGroupNCCL source](https://github.com/pytorch/pytorch/blob/main/torch/csrc/distributed/c10d/ProcessGroupNCCL.cpp)
- [FSDP & CUDACachingAllocator: an outsider newb perspective](https://dev-discuss.pytorch.org/t/fsdp-cudacachingallocator-an-outsider-newb-perspective/1486)
- [ZeRO-Infinity: Breaking the GPU Memory Wall for Extreme Scale Deep Learning](https://arxiv.org/pdf/2103.13630.pdf)

## Related

- [[CUDA Graph]]
- [[source-code/vllm/DBO 源码梳理]]
