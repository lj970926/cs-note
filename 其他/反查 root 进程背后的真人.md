---

title: 反查 root 进程背后的真人 aliases:

- 谁在用 root 跑程序
- root 进程溯源 tags:
- linux
- troubleshooting
- ops
- process created: 2026-06-02

---

# 反查 root 进程背后的真人

> [!abstract] 场景 某台共享服务器上有人用 **root** 跑程序，与自己的程序冲突（端口 / GPU / 文件锁 / 同名进程）。想查出"是谁"。

> [!important] 关键前提 对方用 root 跑，进程属主就是 `root`，光看进程归属永远只显示 `root`。 真正要做的是：把 **root 进程** 反查到背后那个 **真人**。 多数命令需要 `root` 或 `sudo` 权限。

---

## 1. 先定位冲突的进程

```bash
ps -ef | grep <你的程序关键字>

# 端口冲突
sudo ss -lntp | grep <端口>
sudo lsof -i :<端口>
```

拿到 **PID** 后，看启动时间、命令行、工作目录：

```bash
ps -o pid,ppid,user,lstart,cmd -p <PID>
sudo ls -l /proc/<PID>/cwd                      # 工作目录，常藏用户名
sudo cat /proc/<PID>/environ | tr '\0' '\n'     # 环境变量
```

> [!tip] 最直接的线索 `/proc/<PID>/environ` 里的 **`SUDO_USER`** 往往就是答案——它记录了"是谁 sudo 切到 root 的"。 `cwd` 指向 `/home/zhangsan/...` 这类路径，也基本能锁定人。

---

## 2. 追溯父进程链

root 进程通常是某个用户 `sudo` 或登录后启动的。顺着 **PPID** 往上爬，常能爬到一个非 root 的登录 shell：

```bash
pstree -aps <PID>
```

---

## 3. 查登录与提权记录

```bash
who                                    # 当前在线的人
last | head                            # 登录历史 (/var/log/wtmp)
last -i | head                         # 带登录 IP

sudo grep -i sudo /var/log/auth.log    # Debian / Ubuntu
sudo grep -i sudo /var/log/secure      # RHEL / CentOS
```

> [!note] 对时间 按进程的启动时间，去 `auth.log` / `secure` 里对一下： 谁在那个时间点 sudo 了什么，基本就出来了。

---

## 4. 如果是容器或 systemd 服务

```bash
sudo systemctl status <PID>     # 反查是哪个 service 单元拉起来的
cat /proc/<PID>/cgroup          # 看是不是某个容器 / 用户 slice
```

---

## 5. 现实提醒

> [!warning] 直接登录 root 的情况 若对方是 **直接以 root 登录**（而非 sudo 提权），`SUDO_USER` 为空。 此时主要靠：
> 
> - `cwd` 工作目录
> - 登录 IP（`last -i`）
> - 登录时间

> [!success] 最稳妥的做法 别只当侦探。查到大概是谁之后，直接在团队群 @ 一下或找管理员协调资源。 **抢占 / 杀掉对方进程前，先确认不会搞坏别人正在跑的任务。**

---

## 速查表

|目的|命令|
|---|---|
|找进程|`ps -ef \| grep <关键字>`|
|端口占用|`sudo ss -lntp \| grep <端口>` / `sudo lsof -i :<端口>`|
|看 sudo 来源|`sudo cat /proc/<PID>/environ \| tr '\0' '\n'`|
|工作目录|`sudo ls -l /proc/<PID>/cwd`|
|父进程链|`pstree -aps <PID>`|
|在线用户|`who`|
|登录历史 + IP|`last -i`|
|提权记录|`grep -i sudo /var/log/{auth.log,secure}`|
|service 来源|`systemctl status <PID>`|

## 相关

- [[Linux 进程管理]]
- [[共享服务器使用规范]]