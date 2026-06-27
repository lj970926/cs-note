---
title: "uv"
tags:
  - tool
  - python
---

uv 是 astral 用 Rust 写的 Python 包/项目管理工具，定位是 `pip` + `venv` + `pipx` + `pyenv` + `poetry` 的合集，速度比 pip 快一个数量级。官方文档：https://docs.astral.sh/uv/

# 安装
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh # 官方脚本，装到 ~/.local/bin
pip install uv                                  # 或者用 pip 装
uv self update                                  # 升级 uv 自身
```

# 环境管理（类似 conda create、conda activate）
https://docs.astral.sh/uv/pip/environments/

```bash
uv venv # 使用默认env
uv venv name #使用name指定的env，不存在就创建
source .venv/bin/activate #激活环境，只有这一步之后才能正常使用python
```
* 也可以指定 Python 版本创建：
```bash
uv venv --python 3.11   # 没装的话 uv 会自动下载该版本
```

# 包管理（兼容 pip）
`uv pip` 是 pip 的 drop-in 替换，命令几乎一致，但快很多。它操作的是当前激活的 venv。
```bash
uv pip install numpy            # 安装
uv pip install -r requirements.txt
uv pip install -e .             # 以可编辑方式安装当前项目
uv pip uninstall numpy
uv pip list                     # 列出已安装的包
uv pip freeze > requirements.txt
```

# 项目管理（类似 poetry，推荐用法）
基于 `pyproject.toml` + `uv.lock` 管理依赖，不需要手动 `source activate`，uv 自动维护项目级的 `.venv`。
```bash
uv init myproj        # 新建项目，生成 pyproject.toml
uv add numpy          # 添加依赖，自动写入 pyproject.toml 并更新 uv.lock
uv add pytest --dev   # 添加到开发依赖组
uv remove numpy       # 移除依赖
uv sync               # 按 uv.lock 把环境同步到一致状态（clone 项目后第一步）
uv lock               # 只重新解析依赖、更新 uv.lock，不装包
```
* `uv.lock` 是跨平台锁文件，记录精确版本和 hash，要提交进 git；`.venv` 不要提交。
* `uv add` / `uv sync` 都会自动创建并使用项目根目录下的 `.venv`，无需手动激活。

# 运行代码
`uv run` 会确保环境已按 lock 文件同步，然后在该环境里执行命令，省去手动激活。
```bash
uv run python main.py
uv run pytest
uv run --with rich python script.py   # 临时附加一个依赖运行，不写进 pyproject
```

# Python 版本管理（类似 pyenv）
```bash
uv python install 3.12      # 下载安装指定版本
uv python list              # 列出可用 / 已安装版本
uv python pin 3.11          # 在当前项目固定版本，写入 .python-version
```

# 临时运行工具（类似 pipx）
`uvx` 是 `uv tool run` 的简写，在隔离环境里跑命令行工具，用完即走，不污染当前环境。
```bash
uvx ruff check .            # 临时拉起 ruff 跑一次
uv tool install ruff        # 把工具长期安装到全局，之后可直接用 ruff
uv tool list                # 查看已安装的全局工具
```

# 常用技巧
* 国内换源（清华镜像），可写进环境变量或 `pyproject.toml`：
```bash
export UV_DEFAULT_INDEX="https://pypi.tuna.tsinghua.edu.cn/simple"
```
* 缓存管理：
```bash
uv cache clean    # 清空全局缓存
uv cache dir      # 查看缓存目录
```
* 从 `requirements.txt` 迁移到项目模式：`uv add -r requirements.txt`。
