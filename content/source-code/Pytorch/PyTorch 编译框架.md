---
title: PyTorch 编译框架
tags:
  - source-reading
  - mlsys
  - pytorch
  - compiler
  - build
---

## 1. 整体编译流程

```
                    ┌──────────────┐
                    │  setup.py    │
                    └──────┬───────┘
                           │ python setup.py develop / install / bdist_wheel
                           ▼
              ┌────────────────────────┐
              │ build_pytorch_libs.py  │
              └────────────┬───────────┘
                           │
               ┌───────────┴───────────┐
               ▼                       ▼
     ┌─────────────────┐    ┌─────────────────────┐
     │ cmake.generate()│    │  Environment Vars   │
     │ cmake -GNinja   │    │  USE_CUDA=1         │
     │ -D flags ...    │    │  MAX_JOBS=32        │
     └────────┬────────┘    │  DEBUG=0 ...        │
              │              └─────────────────────┘
              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 1: CMake Configure                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ├─ cmake/Dependencies.cmake  → 查找 BLAS, CUDA, NCCL..   │  │
│  │  ├─ cmake/BuildVariables.cmake → 收集源文件列表             │  │
│  │  ├─ cmake/MiscCheck.cmake     → 编译器特性检测              │  │
│  │  └─ 注册 add_custom_command (codegen 任务)                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 2: Code Generation (代码生成)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ① ATen 算子代码生成 (torchgen/gen.py)                     │  │
│  │     native_functions.yaml                                 │  │
│  │       → RegisterCPU.cpp RegisterCUDA.cpp Functions.h ...  │  │
│  │                                                           │  │
│  │  ② Autograd 代码生成 (tools/autograd/gen_autograd.py)      │  │
│  │     derivatives.yaml                                      │  │
│  │       → VariableType_*.cpp TraceType_*.cpp ...            │  │
│  │                                                           │  │
│  │  ③ Python 绑定生成 (tools/autograd/gen_autograd_python.py) │  │
│  │       → python_functions_*.cpp python_torch_functions_*   │  │
│  │                                                           │  │
│  │  ④ Unboxing / Lazy Tensor / .pyi stubs                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 3: C++ Compilation                                       │
│                                                                 │
│     c10           → libc10.so           (最小核心)             │
│     torch_cpu     → libtorch_cpu.so     (CPU算子+JIT)         │
│     torch_cuda    → libtorch_cuda.so    (CUDA算子)            │
│     torch         → libtorch.so         (伞链接库)            │
│     torch_python  → libtorch_python.so  (pybind11绑定)        │
│     torch_global_deps (MPI, MKL, CUDA 预加载)                 │
│                                                                 │
│     CPU 内核按 ISA 级别多次编译:                                 │
│       DEFAULT  →  AVX2  →  AVX512  →  VSX  →  ZVECTOR         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Phase 4: Python Packaging                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  cmake --install  →  .so 复制到 build/lib/                 │  │
│  │  setup.py build_ext  →  注册 torch._C, caffe2_pybind11..  │  │
│  │  setup.py develop    →  创建 symlink                      │  │
│  │  setup.py bdist_wheel → 打包 .whl                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. CMake 层级结构

```
CMakeLists.txt (根, ~1388行)
│
├── include(cmake/BuildVariables.cmake)     # 全局源文件列表变量
├── include(cmake/Dependencies.cmake)       # 第三方库检测
│   ├── cmake/public/cuda.cmake            # CUDA toolkit
│   ├── cmake/public/mkl.cmake             # MKL
│   ├── cmake/External/nccl.cmake          # NCCL
│   ├── cmake/External/rccl.cmake          # RCCL (ROCm)
│   └── ...更多 External/
├── include(cmake/MiscCheck.cmake)          # 编译器特性检测
├── include(cmake/Summary.cmake)            # 最终配置摘要
│
├── add_subdirectory(c10)                   → c10/
│   └── CMakeLists.txt                     → libc10.so (最小核心)
│
├── add_subdirectory(caffe2)                → caffe2/CMakeLists.txt ★主战场
│   │
│   ├── include(cmake/Codegen.cmake)       # ATen 代码生成
│   │   ├── add_custom_command: torchgen.gen (RegisterCPU.cpp...)
│   │   ├── add_custom_command: gen_unboxing (unboxing dispatch)
│   │   ├── add_custom_command: lazy ts backend
│   │   └── CPU 内核 ISA 级别复制编译 (DEFAULT/AVX2/AVX512/VSX/ZVECTOR)
│   │
│   ├── add_subdirectory(aten)             # ATen 算子库
│   ├── add_subdirectory(core)             # caffe2 核心
│   ├── add_subdirectory(serialize)        # 序列化
│   ├── add_subdirectory(utils)            # 工具
│   │
│   ├── add_custom_command:                  # Autograd + Python 代码生成
│   │   └── tools/setup_helpers/generate_code.py
│   │       ├── gen_autograd.py → VariableType_*.cpp, TraceType_*.cpp
│   │       ├── gen_autograd_python.py → python_functions_*.cpp
│   │       └── gen_annotated_fn_args.py
│   │
│   ├── add_library(torch_cpu)             # libtorch_cpu.so  (CPU 算子+JIT)
│   ├── add_library(torch_cuda)            # libtorch_cuda.so (CUDA 算子)
│   ├── add_library(torch_hip)             # libtorch_hip.so  (ROCm 算子)
│   ├── add_library(torch)                 # libtorch.so      (伞链接库)
│   ├── add_library(torch_global_deps)     # MPI, MKL, CUDA 预加载
│   │
│   └── add_subdirectory(../torch torch)   → torch/CMakeLists.txt
│       ├── add_library(torch_python)      → libtorch_python.so
│       ├── add_custom_command: pyi stubs  → __init__.pyi ...
│       └── install(TARGETS torch_python)
│
└── add_subdirectory(functorch)            → functorch/ (可选)
```

---

## 3. Codegen 两条管线

```
native_functions.yaml
tags.yaml
      │
      ├──────────────────────────────────────────────────────────┐
      │                                                          │
      ▼                                                          │
┌──────────────────────────┐                                     │
│  管线 A: ATen 算子代码生成  │                                     │
│  python -m torchgen.gen  │                                     │
│  (cmake/Codegen.cmake)   │                                     │
│                          │                                     │
│  输出:                    │                                     │
│  ├─ RegisterCPU.cpp      │                                     │
│  ├─ RegisterCUDA.cpp     │                                     │
│  ├─ Functions.h/cpp      │                                     │
│  ├─ Operators.h          │                                     │
│  ├─ TensorBody.h         │                                     │
│  ├─ Declarations.yaml    │                                     │
│  └─ ...                  │                                     │
└──────────────────────────┘                                     │
                                                                 │
      ┌──────────────────────────────────────────────────────────┘
      │
      ▼
derivatives.yaml ──────┐
deprecated.yaml ───────┤
                       ▼
┌───────────────────────────────────────┐
│  管线 B: Autograd + Python 绑定代码生成 │
│  tools/setup_helpers/generate_code.py │
│  (caffe2/CMakeLists.txt)             │
│                                       │
│  输出:                                │
│  ├─ VariableType_*.cpp  (自动微分)     │
│  ├─ TraceType_*.cpp     (JIT 追踪)    │
│  ├─ Functions.cpp       (反向节点)     │
│  ├─ python_functions_*.cpp            │
│  ├─ python_torch_functions_*.cpp      │
│  └─ ...                              │
└───────────────────────────────────────┘
```

---

## 4. 产物与 Python 模块的映射

```
C++ 产物                     Python 访问入口
─────────                    ────────────────
libc10.so                    无 (纯 C++ 层)
libtorch_cpu.so              import torch (通过 libtorch_python 间接)
libtorch_cuda.so             import torch (CUDA 算子)
libtorch.so                  import torch (伞链接)
libtorch_python.so           torch._C          ← pybind11 绑定
caffe2_pybind11_state.so     caffe2.python.    ← 已废弃路径
libtorch_global_deps.so      RTLD_GLOBAL 预加载 (MPI, MKL, CUDA 等)
```

---

## 5. 输入 → 输出 一览

| 输入文件                    | 输出产物                                               |
| ----------------------- | -------------------------------------------------- |
| `native_functions.yaml` | `RegisterCPU.cpp`, `Functions.h`, `Operators.h`... |
| `derivatives.yaml`      | `VariableType_*.cpp`, `TraceType_*.cpp`            |
| `deprecated.yaml`       | 废弃算子警告代码                                           |
| `tags.yaml`             | 算子标签分类                                             |
| ATen 模板 (`.h`, `.cpp`)  | 展开为具体类型的 C++ 代码                                    |
| `build_variables.bzl`   | 源文件列表 (CMake + Bazel 共用)                           |
