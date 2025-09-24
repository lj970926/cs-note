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