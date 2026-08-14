---
title: PyTorch Dispatcher 机制
tags:
  - source-reading
  - mlsys
  - pytorch
  - dispatcher
aliases:
  - PyTorch Dispatch 机制
  - Torch Dispatcher
created: 2026-08-14
---

> [!abstract] 核心结论
> PyTorch Dispatcher 是一张以 **operator + DispatchKey** 为索引的多实现函数表。一次算子调用会从 Tensor 和线程上下文构造 `DispatchKeySet`，选择当前最高优先级的实现；Autocast、Autograd、Functionalize 等功能型 wrapper 处理完自己的逻辑后再 **redispatch**，逐层剥离 key，最终落到 CPU、CUDA、Meta 等 backend kernel。

## 1. 从 `torch.add` 看整体调用链

```python
z = torch.add(x, y)
```

`torch.add` 最终对应一个带 overload 的 ATen operator：

```text
aten::add.Tensor
```

- `aten`：namespace
- `add`：operator name
- `Tensor`：overload name

例如，下面两个调用可能对应不同 overload：

```python
torch.add(tensor, tensor)  # aten::add.Tensor
torch.add(tensor, 3.0)     # aten::add.Scalar
```

高度简化后的调用链是：

```text
torch.add(x, y)
    ↓ Python 参数解析
aten::add.Tensor
    ↓ Dispatcher 构造 DispatchKeySet
功能型 wrapper（Autocast / Autograd / Functionalize ...）
    ↓ redispatch
backend kernel（CPU / CUDA / Meta ...）
```

Python binding 概念上类似：

```cpp
Tensor python_torch_add(PyObject* args) {
    Tensor self = parse_tensor(args[0]);
    Tensor other = parse_tensor(args[1]);

    // call() 进入 Dispatcher，而不是直接调用 CPU/CUDA kernel。
    return at::_ops::add_Tensor::call(
        self,
        other,
        /* alpha = */ 1
    );
}
```

这里的 `at::_ops::add_Tensor` 等代码大部分由 `native_functions.yaml` 生成，参见 [[source-code/Pytorch/PyTorch 编译框架#3. Codegen 两条管线|PyTorch 编译框架：Codegen 两条管线]]。

## 2. Dispatcher 的三块核心数据

### 2.1 Operator schema：算子是什么

Schema 描述算子的名字、overload、参数和返回值：

```text
aten::add.Tensor(
    Tensor self,
    Tensor other,
    *,
    Scalar alpha=1
) -> Tensor
```

它相当于函数声明，不包含具体 CPU/CUDA 实现。

### 2.2 DispatchKey：按什么维度选择实现

常见 key 可以分成几类：

| 类别 | 示例 | 作用 |
| --- | --- | --- |
| backend | `CPU`、`CUDA`、`MPS`、`Meta` | 选择运行设备或抽象 backend |
| layout | `SparseCPU`、`SparseCUDA`、`QuantizedCPU` | 选择特殊 Tensor 表示 |
| 功能层 | `AutogradCPU`、`AutogradCUDA`、`AutocastCUDA` | 在 backend kernel 外增加横切能力 |
| 变换/扩展 | `Functionalize`、`Python` 等 | 支持编译、Tensor subclass、mode 等 |

一个 Tensor 不是只携带一个 key，而是携带一个 `DispatchKeySet`。

### 2.3 Dispatch table：某个 key 对应哪个实现

逻辑上，每个 operator 都有一张表：

| DispatchKey | `aten::add.Tensor` 的实现 |
| --- | --- |
| `CPU` | CPU add kernel |
| `CUDA` | CUDA add kernel |
| `Meta` | 只计算输出元数据的 kernel |
| `AutogradCPU` | Autograd wrapper |
| `AutogradCUDA` | Autograd wrapper |
| `AutocastCUDA` | AMP wrapper |
| `SparseCPU` | Sparse add kernel |

可以把注册表抽象成：

```cpp
dispatch_table["aten::add.Tensor"] = {
    CPU:          add_cpu,
    CUDA:         add_cuda,
    Meta:         add_meta,
    AutogradCPU:  add_autograd,
    AutogradCUDA: add_autograd,
    AutocastCUDA: add_autocast,
};
```

## 3. DispatchKeySet 从哪里来

Tensor 自身携带 backend、layout、Autograd 等相关 key：

```python
import torch

x = torch.randn(3)
print(torch._C._dispatch_key_set(x))
```

可能输出：

```text
DispatchKeySet(CPU, ADInplaceOrView, AutogradCPU, AutocastCPU)
```

CUDA Tensor：

```python
x = torch.randn(
    3,
    device="cuda",
    requires_grad=True,
)

print(torch._C._dispatch_key_set(x))
```

可能输出：

```text
DispatchKeySet(CUDA, ADInplaceOrView, AutogradCUDA, AutocastCUDA)
```

最终用于一次调用的 key set 还会受到线程局部状态（TLS）影响。概念代码如下：

```cpp
DispatchKeySet compute_dispatch_key_set(Arguments args) {
    DispatchKeySet ks;

    // 合并所有 Tensor 参数携带的 key。
    for (const Tensor& tensor : tensor_arguments(args)) {
        ks |= tensor.key_set();
    }

    // Autocast、Python mode 等上下文可以在 TLS 中启用 key。
    ks |= tls_included_keys();

    // wrapper redispatch 时可通过 TLS 或显式 keyset 排除当前层。
    ks -= tls_excluded_keys();

    return ks;
}
```

> [!note]
> `_dispatch_key_set`、`_dispatch_dump_table` 等以下划线开头的接口主要用于内部调试，具体名称和输出可能随 PyTorch 版本变化。

## 4. 选择 kernel 的核心逻辑

Dispatcher 不只是检查“输入是不是 CUDA”，而是从当前 `DispatchKeySet` 中选择优先级最高的 key：

```cpp
Result dispatch(
    OperatorHandle op,
    DispatchKeySet keyset,
    Arguments args
) {
    DispatchKey key = keyset.highestPriorityTypeId();
    KernelFunction kernel = op.dispatchTable().lookup(key);
    return kernel.call(args);
}
```

因此，当 CUDA Tensor 同时涉及 Autocast 和 Autograd 时，第一次选中的可能是功能型 wrapper，而不是 `CUDA` kernel。

具体 key 的集合和优先级属于实现细节，应以当前 PyTorch 的 `DispatchKey.h` 和实际 dispatch table 为准，不要把某一版本的完整顺序硬编码成长期不变的规则。

## 5. Redispatch：逐层剥洋葱

### 5.1 Autocast wrapper

Autocast kernel 通常不完成最终运算，而是转换输入 dtype，再排除当前 key 并继续分发：

```cpp
Tensor autocast_add(
    DispatchKeySet keyset,
    const Tensor& x,
    const Tensor& y
) {
    Tensor cast_x = cast_if_needed(x);
    Tensor cast_y = cast_if_needed(y);

    return redispatch(
        keyset.remove(DispatchKey::AutocastCUDA),
        cast_x,
        cast_y
    );
}
```

### 5.2 Autograd wrapper

Autograd 层负责建立反向传播信息，然后把真实 forward 计算交给下一层：

```cpp
Tensor autograd_add(
    DispatchKeySet keyset,
    const Tensor& x,
    const Tensor& y
) {
    auto grad_fn = create_add_backward_node(x, y);

    Tensor result = redispatch(
        keyset.remove(DispatchKey::AutogradCUDA),
        x,
        y
    );

    attach_grad_fn(result, grad_fn);
    return result;
}
```

### 5.3 Backend kernel

最后才落到真正访问数据并启动计算的 kernel：

```cpp
Tensor add_cuda(
    const Tensor& x,
    const Tensor& y
) {
    Tensor result = allocate_cuda_output(x);

    launch_add_cuda_kernel(
        x.data_ptr(),
        y.data_ptr(),
        result.data_ptr(),
        x.numel()
    );

    return result;
}
```

完整过程可以表示为：

```text
keyset = {CUDA, AutogradCUDA, AutocastCUDA}
                    │
                    ▼
             AutocastCUDA
                    │ remove AutocastCUDA
                    ▼
keyset = {CUDA, AutogradCUDA}
                    │
                    ▼
              AutogradCUDA
                    │ remove AutogradCUDA
                    ▼
keyset = {CUDA}
                    │
                    ▼
                CUDA kernel
```

实际调用包含哪些 wrapper 取决于 operator、Tensor 和运行上下文；上图表达的是 redispatch 模式，而不是所有算子的固定调用栈。

### 5.4 为什么必须排除当前 key

如果 wrapper 不排除自己，直接普通调用同一个算子：

```cpp
// 错误示意：可能再次命中 autocast_add，造成无限递归。
Tensor autocast_add(const Tensor& x, const Tensor& y) {
    return at::add(x, y);
}
```

正确做法是使用带剩余 keyset 的 redispatch，或者使用相应 guard 临时排除当前 key。

## 6. 用 Python 注册一个可分发算子

下面定义：

```text
mylib::scaled_add(x, y, alpha) = x + alpha * y
```

### 6.1 注册 schema

```python
import torch

definition = torch.library.Library(
    "mylib",
    "DEF",
)

definition.define(
    "scaled_add("
    "Tensor x, "
    "Tensor y, "
    "float alpha"
    ") -> Tensor"
)
```

此时只有算子声明；直接用 CPU/CUDA Tensor 调用时，Dispatcher 还找不到对应 kernel。

### 6.2 注册 CPU kernel

```python
cpu_impl = torch.library.Library(
    "mylib",
    "IMPL",
    "CPU",
)

def scaled_add_cpu(x, y, alpha: float):
    print("running CPU implementation")
    return x + alpha * y

cpu_impl.impl(
    "scaled_add",
    scaled_add_cpu,
)
```

调用：

```python
x = torch.tensor([1.0, 2.0])
y = torch.tensor([3.0, 4.0])

out = torch.ops.mylib.scaled_add(
    x,
    y,
    0.5,
)

print(out)
```

预期：

```text
running CPU implementation
tensor([2.5000, 4.0000])
```

对应流程：

```text
torch.ops.mylib.scaled_add
    ↓ 输入 key set 包含 CPU
查找 (mylib::scaled_add, CPU)
    ↓
scaled_add_cpu
```

### 6.3 注册 CUDA kernel

```python
cuda_impl = torch.library.Library(
    "mylib",
    "IMPL",
    "CUDA",
)

def scaled_add_cuda(x, y, alpha: float):
    print("running CUDA implementation")
    return x + alpha * y

cuda_impl.impl(
    "scaled_add",
    scaled_add_cuda,
)
```

测试：

```python
x = torch.tensor([1.0, 2.0], device="cuda")
y = torch.tensor([3.0, 4.0], device="cuda")

out = torch.ops.mylib.scaled_add(
    x,
    y,
    0.5,
)
```

这里的示例 kernel 用 Python 编写，内部 `x + alpha * y` 仍会继续调用 ATen CUDA 算子；真实扩展可以在注册的 C++ wrapper 中启动自定义 CUDA kernel。

> [!warning]
> `Library` 对象需要保持存活。若对象生命周期结束，其注册也可能随之注销，不要只在一个立即返回的局部函数中创建这些对象。

## 7. Meta dispatch：只计算输出元数据

编译器经常不希望执行真实 CPU/CUDA 计算，只需要知道输出的 shape、stride、dtype、device 和 alias 信息。

```python
meta_impl = torch.library.Library(
    "mylib",
    "IMPL",
    "Meta",
)

def scaled_add_meta(x, y, alpha: float):
    if x.shape != y.shape:
        raise RuntimeError(
            "x and y must have the same shape"
        )

    return torch.empty_like(
        x,
        device="meta",
    )

meta_impl.impl(
    "scaled_add",
    scaled_add_meta,
)
```

测试：

```python
x = torch.empty((2, 3), device="meta")
y = torch.empty((2, 3), device="meta")

out = torch.ops.mylib.scaled_add(
    x,
    y,
    0.5,
)

print(out.shape)   # torch.Size([2, 3])
print(out.device)  # meta
```

这条路径没有真实数据：

```text
输入 DispatchKeySet 包含 Meta
          ↓
(mylib::scaled_add, Meta)
          ↓
scaled_add_meta
          ↓
只创建输出元数据
```

现代 Python custom operator API 也提供 `torch.library.register_fake()` 注册 Fake/Meta 行为；这里直接注册 `Meta` 是为了直观展示 operator-key 对。

## 8. Composite kernel：让内部算子继续分发

`x + alpha * y` 本身不读取设备指针，只组合已有 PyTorch 算子，因此可以注册成通用 composite implementation：

```python
composite_impl = torch.library.Library(
    "mylib",
    "IMPL",
    "CompositeImplicitAutograd",
)

def scaled_add_composite(x, y, alpha: float):
    return x + alpha * y

composite_impl.impl(
    "scaled_add",
    scaled_add_composite,
)
```

CPU 输入：

```text
mylib::scaled_add
    ↓ CompositeImplicitAutograd
aten::mul → CPU kernel
aten::add → CPU kernel
```

CUDA 输入：

```text
mylib::scaled_add
    ↓ CompositeImplicitAutograd
aten::mul → CUDA kernel
aten::add → CUDA kernel
```

Composite 不是“不 dispatch”，而是当前算子不直接依赖 backend，由其调用的下层 ATen 算子继续正常 dispatch。

- `CompositeImplicitAutograd`：实现由其他可微 ATen 算子组成，通常可从内部算子自动得到 Autograd 行为。
- `CompositeExplicitAutograd`：实现可跨 backend 使用，但训练支持通常需要显式 Autograd 公式或注册。

## 9. C++ 注册方式

Python 中的 `Library("mylib", "DEF")` 和 `Library("mylib", "IMPL", "CPU")`，在 C++ 中对应 `TORCH_LIBRARY` 与 `TORCH_LIBRARY_IMPL`：

```cpp
#include <torch/library.h>

torch::Tensor scaled_add_cpu(
    const torch::Tensor& x,
    const torch::Tensor& y,
    double alpha
) {
    return x + alpha * y;
}

TORCH_LIBRARY(mylib, m) {
    m.def(
        "scaled_add("
        "Tensor x, "
        "Tensor y, "
        "float alpha"
        ") -> Tensor"
    );
}

TORCH_LIBRARY_IMPL(mylib, CPU, m) {
    m.impl(
        "scaled_add",
        TORCH_FN(scaled_add_cpu)
    );
}
```

CUDA 注册：

```cpp
torch::Tensor scaled_add_cuda(
    const torch::Tensor& x,
    const torch::Tensor& y,
    double alpha
) {
    // 实际项目中可在此调用自定义 CUDA kernel。
    return x + alpha * y;
}

TORCH_LIBRARY_IMPL(mylib, CUDA, m) {
    m.impl(
        "scaled_add",
        TORCH_FN(scaled_add_cuda)
    );
}
```

二者职责不同：

```text
TORCH_LIBRARY
    → 定义 operator schema

TORCH_LIBRARY_IMPL
    → 给特定 DispatchKey 注册 kernel
```

内置 ATen 算子也是相同原理，只是大量声明和注册由 codegen 生成。`native_functions.yaml → RegisterCPU.cpp / RegisterCUDA.cpp` 的编译关系见 [[source-code/Pytorch/PyTorch 编译框架#5. 输入 → 输出 一览|PyTorch 编译框架：输入与产物]]。

## 10. Kernel、fallback 与 fallthrough

### 10.1 Kernel

为具体的 operator-key pair 注册实现：

```text
(aten::add.Tensor, CUDA) → add_cuda
```

### 10.2 Backend fallback

为一个 key 注册适用于大量 operator 的默认处理：

```text
(*, MyBackend) → my_backend_fallback
```

新 backend 可以在缺少专用 kernel 时统一报错、降级或转到其他实现。通用 fallback 常使用 boxed 调用，因为它需要面对不同 schema 的 operator。

### 10.3 Fallthrough

当前 key 不做任何工作，直接继续选择下一个 key：

```cpp
while (true) {
    DispatchKey key = keyset.highest_priority_key();
    Kernel kernel = op.lookup(key);

    if (kernel.is_fallthrough()) {
        keyset.remove(key);
        continue;
    }

    return kernel.call(args);
}
```

Fallthrough 避免为大量“不需要本层处理”的 operator 分别注册空 wrapper。

## 11. Boxed 与 unboxed dispatch

### 11.1 Unboxed

参数是正常、确定的 C++ 类型：

```cpp
Tensor kernel(
    const Tensor& x,
    int64_t dim
);
```

优点是类型明确、调用开销小，适合性能关键路径。

### 11.2 Boxed

参数和返回值统一装进类似栈的容器：

```cpp
void kernel(Stack* stack);
```

适合：

- 不预先知道 schema 的通用 backend fallback
- 跨大量 operator 的统一拦截
- 需要统一 ABI 的动态调用

可以粗略理解为：

```text
unboxed：针对某个函数签名编译好的直接调用
boxed：统一 ABI 下的动态参数打包调用
```

## 12. 用 TorchDispatchMode 观察 ATen 调用

Python 侧可以用 `TorchDispatchMode` 拦截 ATen operator：

```python
import torch
from torch.utils._python_dispatch import TorchDispatchMode


class LoggingMode(TorchDispatchMode):
    def __torch_dispatch__(
        self,
        func,
        types,
        args=(),
        kwargs=None,
    ):
        if kwargs is None:
            kwargs = {}

        print(f"dispatch: {func}")
        result = func(*args, **kwargs)
        print(f"result: {result}")
        return result
```

使用：

```python
x = torch.tensor([1.0, 2.0])
y = torch.tensor([3.0, 4.0])

with LoggingMode():
    z = torch.add(x, y)
```

可能输出：

```text
dispatch: aten.add.Tensor
result: tensor([4., 6.])
```

`result = func(*args, **kwargs)` 表示把调用继续交给下一层。PyTorch 会管理当前 mode 的重入状态，避免这行代码立刻再次进入同一个 mode。

它也可以用于观察高层 Python 代码被拆成了哪些 ATen operator：

```python
with LoggingMode():
    x = torch.randn(2, 3)
    y = torch.relu(x)
    z = y.sum(dim=1)
```

可能看到：

```text
aten.randn.default
aten.relu.default
aten.sum.dim_IntList
```

## 13. `__torch_function__` 与 `__torch_dispatch__`

### 13.1 `__torch_function__`

它是较高层的 Python API 覆盖机制，主要根据 Python 函数和参数类型拦截行为。

### 13.2 `__torch_dispatch__`

它更靠近 ATen/C++ Dispatcher，收到的通常是：

```text
aten.add.Tensor
aten.mm.default
aten.view.default
```

常见用途包括：

- Tensor subclass
- FakeTensor、Proxy/Tracing Tensor
- 日志和 profiling Tensor
- 分布式 Tensor
- 自定义存储语义

简化后的层次关系：

```text
torch.add
   ↓
__torch_function__ 层
   ↓
ATen operator
   ↓
C++ Dispatcher / Python key
   ↓
__torch_dispatch__ 层
   ↓
CPU/CUDA kernel
```

Tensor subclass 的实现通常需要执行：

```text
unwrap subclass
    ↓
redispatch 到普通 Tensor
    ↓
得到普通结果
    ↓
wrap 回 subclass
```

如果把仍是自定义 subclass 的参数直接重新传给同一 operator，可能重新命中自己并无限递归。

## 14. `torch.compile` 为什么依赖 dispatch

`torch.compile` 等图模式工具需要在不执行真实计算的情况下理解：

- 输出 shape、stride、dtype 和 device
- alias/view 关系
- 是否为 inplace 操作
- 如何把复合算子 decomposition 成基础算子

因此会使用 Meta/FakeTensor、Functionalization、decomposition 和 Python dispatch mode 等机制。

这说明 Dispatcher 不只是“CPU/CUDA 二选一”，还是 eager、Autograd、AMP、Tensor subclass 与 PyTorch 编译栈之间的总交换机。

## 15. Dispatcher 与 DispatchStub 不同

PyTorch 源码中还可能看到：

```cpp
DECLARE_DISPATCH(..., add_stub);
REGISTER_DISPATCH(add_stub, &add_kernel);
```

这通常是另一个层次：

```text
PyTorch Dispatcher
    ↓ 选择 CPU backend
CPU implementation
    ↓ DispatchStub 根据 CPU capability
AVX512 / AVX2 / DEFAULT implementation
```

区别是：

| 机制 | 负责选择什么 |
| --- | --- |
| Dispatcher | CPU/CUDA/Meta、layout、Autograd、Autocast 等语义 |
| DispatchStub | 已选 CPU 后，再选择 AVX2/AVX512 等 ISA 实现 |

CPU kernel 按 ISA 级别多次编译的构建关系见 [[source-code/Pytorch/PyTorch 编译框架#1. 整体编译流程|PyTorch 编译框架：整体编译流程]]。

## 16. 调试速查

查看 Tensor 的 key set：

```python
print(torch._C._dispatch_key_set(x))
```

查看 operator 的完整 dispatch table：

```python
print(
    torch._C._dispatch_dump_table(
        "aten::add.Tensor"
    )
)
```

检查是否为某个 key 注册了 kernel：

```python
print(
    torch._C._dispatch_has_kernel_for_dispatch_key(
        "aten::add.Tensor",
        "CUDA",
    )
)
```

源码阅读时可沿以下路径追踪：

```text
operator schema / native_functions.yaml
    ↓
生成的 at::_ops::<op>::call
    ↓
c10 Dispatcher / OperatorEntry
    ↓
dispatch table 中当前最高优先级 key
    ↓
wrapper 或 backend kernel
    ↓
必要时继续追 DispatchStub / CUDA kernel
```

## 17. 最小心智模型

整个机制可以浓缩成：

```cpp
Result call_operator(
    Operator op,
    Arguments args
) {
    DispatchKeySet ks =
        collect_keys_from_tensors(args)
        | tls_included_keys();

    ks -= tls_excluded_keys();

    while (true) {
        DispatchKey key = ks.highest_priority_key();
        Kernel kernel = op.lookup(key);

        if (kernel.is_fallthrough()) {
            ks.remove(key);
            continue;
        }

        return kernel(args, ks);
    }
}
```

其中有两类 kernel：

```cpp
// 最终 backend 实现。
Result cuda_kernel(Arguments args) {
    launch_cuda_kernel();
    return result;
}

// 功能型 wrapper。
Result autograd_wrapper(
    Arguments args,
    DispatchKeySet ks
) {
    prepare_autograd();

    Result result = redispatch(
        ks.remove(AutogradCUDA),
        args
    );

    finish_autograd(result);
    return result;
}
```

> [!summary]
> 每个 operator 拥有一张按 `DispatchKey` 索引的实现表。Dispatcher 从 Tensor 与线程上下文构造 `DispatchKeySet`，选择最高优先级实现；功能型 wrapper 处理 Autograd、Autocast、Functionalize、Python mode 等逻辑并 redispatch，直到落到 CPU、CUDA、Meta 等 backend kernel。

## 参考资料

- [Extending PyTorch](https://docs.pytorch.org/docs/stable/notes/extending.html)
- [Registering a Dispatched Operator in C++](https://docs.pytorch.org/tutorials/advanced/dispatcher)
- [Extending dispatcher for a new backend in C++](https://docs.pytorch.org/tutorials/advanced/extend_dispatcher.html)
- [Operator Registration](https://docs.pytorch.org/docs/stable/accelerator/operators.html)
- [ATen native README](https://github.com/pytorch/pytorch/blob/main/aten/src/ATen/native/README.md)

