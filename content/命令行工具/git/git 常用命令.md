---
title: "git 常用命令"
tags:
  - tool
  - git
aliases: []
created: 2026-06-26
---

* 强行将某个分支set到另一个分支
```bash
git reset --hard origin/master
```
上面的命令会把当前HEAD对应的分支指向origin/master

* 不在track某个已经添加进git的文件
```bash
git update-index --skip-worktree <file>
```
这种情况下gitignore是没用的，因为已经添加追踪，gitignore只能在不track的情况下忽略文件

* 撤销最近一次 commit，保留改动
```bash
git reset --soft HEAD~1   # 改动保留在暂存区
git reset HEAD~1          # 改动保留在工作区（默认 --mixed）
```

* 撤销最近一次 commit，并丢弃所有改动（不可逆，慎用）
```bash
git reset --hard HEAD~1
```

* 修改最近一次 commit 的内容或 message（仅限未 push）
```bash
git commit --amend
```

* 在共享分支上反做一个旧 commit（生成新的反向 commit，保留历史）
```bash
git revert <commit-hash>
```
已经 push 到共享分支的提交不要用 `reset --hard` 再 force push，会冲掉别人的工作；用 `revert` 最安全。

* 找回误删的 commit
```bash
git reflog
```
reflog 记录了 HEAD 的所有移动，几乎所有"误删"的 commit 都能在这里找到 hash 然后 `git reset` 回去。

## 查看单个文件的修改历史

查看某个文件在所有相关 commit 中的具体改动：

```bash
git log -p -- path/to/file
```

- `git log`：查看提交历史
- `-p`：显示每次提交对应的 diff
- `-- path/to/file`：将路径与 revision 参数隔开，只关注这个文件

如果文件曾经被重命名，使用：

```bash
git log --follow -p -- path/to/file
```

> [!tip]
> 想像翻时间线一样查看文件从创建到现在的修改，优先记住 `git log --follow -p -- path/to/file`。`--follow` 一次只能跟踪一个文件，并且 rename 识别是 Git 根据内容相似度推断的。

只看哪些 commit 修改过该文件，不展开 diff：

```bash
git log --follow --oneline -- path/to/file
```

再单独查看其中一次提交：

```bash
git show <commit-hash> -- path/to/file
```

查看当前每一行最后由谁、在哪个 commit 中修改：

```bash
git blame path/to/file
```

比较该文件在两个版本之间的变化：

```bash
git diff <commit1> <commit2> -- path/to/file
```

改动很多时，可以用 `tig` 交互式翻阅 commit 和 diff：

```bash
tig --follow -- path/to/file
```

在源码阅读中，这些历史证据还可用来追溯一段代码的设计动机，参见 [[其他/大型项目源码阅读方法论]]。

## Related
- [[命令行工具/git/pre-commit]]
