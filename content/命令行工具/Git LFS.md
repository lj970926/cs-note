---
title: Git LFS
tags:
  - tool
  - git
  - storage
aliases:
  - Git Large File Storage
created: 2026-08-25
description: Git LFS 的工作原理、日常使用、GitHub 查看方式与历史迁移注意事项
source: https://chatgpt.com/share/6a8d49fb-3080-83ee-833a-06a9c0cf26fd
---

# Git LFS

> [!abstract]
> Git LFS（Git Large File Storage）把大文件的实际内容放到独立的 LFS 存储中，Git 仓库只保存一个很小的 pointer 文件。可以把它理解为：**Git 管版本关系和元数据，LFS 管大文件内容**。

## 1. Git LFS 解决什么问题

Git 的历史会保留每个版本所引用的对象。源码和配置文件通常体积小、可压缩、易于做差异比较；模型权重、视频、音频、数据集等大型二进制文件则经常整体变化，多个版本会让仓库体积和克隆成本迅速增长。

Git LFS 将二进制内容从普通 Git 对象库中分离：

```mermaid
flowchart LR
    A[工作区中的大文件] --> B[Git LFS clean filter]
    B --> C[Git 仓库中的 pointer]
    B --> D[LFS 远端存储中的真实文件]
    C --> E[clone / checkout]
    D --> F[Git LFS smudge / pull]
    E --> G[工作区恢复真实文件]
    F --> G
```

Git 仓库中的 pointer 大致如下：

```text
version https://git-lfs.github.com/spec/v1
oid sha256:4cac19622fc3ada9c0fdeadb33f88f367b541f38b89102a3f1261ac81fd5bcb5
size 84977953
```

- `oid`：真实文件内容的 SHA-256 标识。
- `size`：真实文件的字节数。
- 工作区通常看到的仍是真实文件；clean/smudge filter 在 Git 对象和工作区内容之间转换。
- `pre-push` hook 会在推送相关 commit 前上传新的 LFS 对象。

> [!note]
> 普通 Git 的 packfile 也会压缩对象并尝试 delta，不应简单理解为“每改一次一定完整复制一份”。但对频繁变化的大型二进制文件，仓库历史仍很容易膨胀，LFS 的收益通常更明显。

## 2. 什么文件适合使用 LFS

| 适合 | 通常不适合 |
|---|---|
| 模型权重：`.pt`、`.pth`、`.safetensors` | 源码 |
| 大型数据集或归档文件 | Markdown、JSON、YAML 等文本 |
| 视频、音频、PSD 等设计文件 | 小型配置文件 |
| 游戏、图形等大型二进制资源 | 需要高效逐行 diff 的文件 |

LFS 并不会让大文件消失：每次推送一个内容不同的 LFS 文件，远端仍要存储一个新的完整对象。它主要解决的是普通 Git 仓库膨胀和大文件传输工作流的问题。

## 3. 快速上手

### 3.1 安装并初始化

```bash
# macOS
brew install git-lfs

# Ubuntu / Debian
sudo apt install git-lfs

# 为当前用户安装 Git 配置和 hooks；通常只需执行一次
git lfs install
```

确认安装：

```bash
git lfs version
```

### 3.2 配置跟踪规则

在目标仓库中执行：

```bash
git lfs track "*.safetensors"
git lfs track "*.pt"
git lfs track "weights/**/*.bin"
```

引号很重要：它防止 shell 提前展开通配符，让 Git LFS 把模式本身写入 `.gitattributes`。

生成的规则类似：

```gitattributes
*.safetensors filter=lfs diff=lfs merge=lfs -text
*.pt filter=lfs diff=lfs merge=lfs -text
weights/**/*.bin filter=lfs diff=lfs merge=lfs -text
```

`.gitattributes` 必须随仓库提交，使所有协作者和新 clone 使用相同规则：

```bash
git add .gitattributes
git add model.safetensors
git commit -m "feat: add model weights"
git push
```

之后的日常 `add`、`commit`、`push` 与普通 Git 基本一致。其他常用 Git 操作见 [[git 常用命令]]。

## 4. 克隆与下载

本机已经安装 Git LFS 时，通常直接克隆即可，真实文件会自动下载：

```bash
git clone git@github.com:owner/repository.git
```

需要显式补齐当前版本的 LFS 对象时：

```bash
git lfs pull
```

如果只想先取得 Git 历史和 pointer、暂不下载大文件：

```bash
GIT_LFS_SKIP_SMUDGE=1 git clone git@github.com:owner/repository.git

# 之后按需下载
git lfs pull
```

## 5. 查看与验证

```bash
# 查看仓库配置的 LFS 跟踪规则
git lfs track

# 查看当前 index / 工作区中的 LFS 文件
git lfs ls-files

# 查看待提交、待推送的 LFS 状态
git lfs status

# 确认某个路径实际匹配到的 attributes
git check-attr filter diff merge -- path/to/model.safetensors
```

在 GitHub 网页上：

- 打开具体文件时，GitHub 通常会标识它由 Git LFS 存储。
- 查看仓库根目录的 `.gitattributes`，可以确认哪些路径模式被配置为 LFS。
- GitHub 没有一个特别完整的“列出本仓库全部 LFS 对象”页面；完整清单优先使用 `git lfs ls-files`。
- 用量和费用在账户的 Billing / Usage 页面查看，具体入口和额度可能随套餐调整。
- 仓库 `Settings → Archives → Include Git LFS objects in archives` 控制 ZIP、tarball 是否包含真实 LFS 对象；启用后，归档下载会计入 LFS 带宽。

## 6. 已有文件如何迁移

`git lfs track` **只影响以后经过 Git index 的内容，不会自动改写已有 commit**。迁移前先确保工作区干净，并为重要分支创建备份。

### 6.1 只转换当前版本，不改旧历史

```bash
git lfs track "*.bin" "*.pt" "*.safetensors"
git add .gitattributes
git add --renormalize .
git commit -m "chore: track large files with Git LFS"
```

这会把当前版本中匹配的文件重新加入为 LFS pointer，但旧 commit 中的普通 Git blob 仍然存在，因此不能缩小既有历史。

### 6.2 文件只在最近一个本地 commit 中，尚未 push

```bash
git lfs track "*.bin"
git add .gitattributes
git add --renormalize path/to/model.bin
git commit --amend --no-edit
```

然后用 `git lfs ls-files` 和 `git show HEAD:path/to/model.bin` 验证：前者应列出文件，后者应显示 pointer 内容。

### 6.3 改写整个历史

先检查历史中大文件的分布：

```bash
git lfs migrate info --everything
```

再迁移指定类型：

```bash
git lfs migrate import \
  --everything \
  --include="*.bin,*.pt,*.safetensors"
```

> [!danger] 历史会被重写
> `git lfs migrate import --everything` 会改变相关 commit hash。迁移已共享的仓库前必须与所有协作者协调；验证结果后还需要更新远端分支和标签，其他协作者通常应重新 clone。不要在不清楚影响范围时直接 force push。

只迁移当前分支尚未推送的 commit 时，可以不加 `--everything`；默认范围与远端 refs 有关，执行前应先用 `git lfs migrate info` 检查。

## 7. 常见坑

> [!warning] 先 commit，后 track
> 如果大文件已经作为普通 Git blob 进入历史，后来执行 `git lfs track` 并不会自动迁移旧版本。根据需求选择 `git add --renormalize` 或 `git lfs migrate import`。

> [!warning] 忘记提交 `.gitattributes`
> 本机可能看起来正常，但协作者和 CI 无法可靠地得到同一套 LFS 规则。应把 `.gitattributes` 和相关文件一起提交。

> [!warning] clone 后只看到 pointer
> 常见原因包括没有安装 Git LFS、使用了 `GIT_LFS_SKIP_SMUDGE=1`、LFS 对象没有成功上传，或托管平台的额度/权限受限。可依次检查 `git lfs version`、`git lfs pull`、`git lfs status` 和 `git lfs logs last`。

> [!warning] GitHub 配额与限制
> GitHub LFS 的免费存储、下载带宽、单文件上限和超额计费取决于账户套餐，并可能变化。大文件的每个新版本都会增加存储用量，下载真实对象会消耗仓库所有者的带宽，应以 GitHub Billing 页面和官方文档为准。

> [!danger] GitHub Pages
> GitHub 官方说明 Git LFS 不能用于 GitHub Pages。不要把网站发布所依赖的资源改成 LFS 后，期待 Pages 像普通仓库 clone 一样自动取得真实文件。

## 8. 命令速查

| 目的 | 命令 |
|---|---|
| 初始化 | `git lfs install` |
| 跟踪模式 | `git lfs track "*.bin"` |
| 取消跟踪模式 | `git lfs untrack "*.bin"` |
| 查看规则 | `git lfs track` |
| 查看 LFS 文件 | `git lfs ls-files` |
| 查看状态 | `git lfs status` |
| 拉取当前版本对象 | `git lfs pull` |
| 只下载对象 | `git lfs fetch` |
| 填充工作区文件 | `git lfs checkout` |
| 分析历史 | `git lfs migrate info --everything` |
| 迁移历史 | `git lfs migrate import --everything --include="*.bin"` |
| 查看最近错误 | `git lfs logs last` |

## 参考资料

- [原始 ChatGPT 分享对话](https://chatgpt.com/share/6a8d49fb-3080-83ee-833a-06a9c0cf26fd)
- [Git LFS 官方网站](https://git-lfs.com/)
- [Git LFS migrate 官方手册](https://github.com/git-lfs/git-lfs/blob/main/docs/man/git-lfs-migrate.adoc)
- [GitHub Docs：About Git Large File Storage](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage)
- [GitHub Docs：Configuring Git Large File Storage](https://docs.github.com/en/repositories/working-with-files/managing-large-files/configuring-git-large-file-storage)
- [GitHub Docs：Git Large File Storage billing](https://docs.github.com/en/billing/concepts/product-billing/git-lfs)
- [GitHub Docs：Managing Git LFS objects in archives](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-git-lfs-objects-in-archives-of-your-repository)
