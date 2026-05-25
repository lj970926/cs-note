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