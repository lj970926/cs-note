---
title: 根据 PID 定位 Docker 容器  
tags:
- docker
- linux
- shell
- cgroup  
aliases:
- inspect_docker.sh
- PID 查询 Docker 容器  
created: 2026-07-01
---

# **根据 PID 定位 Docker 容器**

## **使用场景**

在 Linux 宿主机上，有时只能看到某个异常进程的 PID，但不知道它来自哪个 Docker 容器。

目标是实现：

```bash
./inspect_docker.sh <PID>
```

然后输出该进程所属 Docker 容器的：

- 容器 ID
- 容器名称
- 镜像名称
- 容器状态
- 容器主进程 PID

---

## **原理**

Linux 会通过 cgroup 管理进程所属的资源控制组。

对于指定进程，可以查看：

```bash
cat /proc/<PID>/cgroup
```

例如：

```text
0::/system.slice/docker-41cf67d9bfe15d.scope
```

或者：

```text
10:memory:/docker/41cf67d9bfe15d...
```

其中通常会包含 Docker 容器 ID。

提取出容器 ID 后，可以调用：

```bash
docker inspect <container-id>
```

查询容器的详细信息。

---

## **脚本**

文件名：

```text
inspect_docker.sh
```

```bash
#!/usr/bin/env bash

set -euo pipefail

usage() {
    echo "Usage: $0 <PID>" >&2
    exit 2
}

die() {
    echo "Error: $*" >&2
    exit 1
}

[[ $# -eq 1 ]] || usage

PID="$1"

[[ "$PID" =~ ^[0-9]+$ ]] || die "PID must be a positive integer"
[[ -d "/proc/$PID" ]] || die "process $PID does not exist or is not accessible"
command -v docker >/dev/null 2>&1 || die "docker command not found"

CGROUP_FILE="/proc/$PID/cgroup"
[[ -r "$CGROUP_FILE" ]] || die "cannot read $CGROUP_FILE"

# 支持常见的 cgroup v1 / v2 Docker 路径格式：
#
#   /docker/<container-id>
#   /system.slice/docker-<container-id>.scope
#   /docker/<container-id>/...
#
CONTAINER_ID="$(
    awk -F: '{print $3}' "$CGROUP_FILE" |
        grep -Eo 'docker[-/][0-9a-fA-F]{12,64}(\.scope)?' |
        sed -E 's#^docker[-/]##; s#\.scope$##' |
        head -n1 || true
)"

if [[ -z "$CONTAINER_ID" ]]; then
    echo "PID $PID does not appear to belong to a Docker container."
    echo
    echo "Cgroup information:"
    cat "$CGROUP_FILE"
    exit 1
fi

if ! INSPECT_OUTPUT="$(
    docker inspect \
        --format $'Container ID: {{.Id}}\nName: {{.Name}}\nImage: {{.Config.Image}}\nStatus: {{.State.Status}}\nContainer PID: {{.State.Pid}}' \
        "$CONTAINER_ID" 2>/dev/null
)"; then
    die "found container ID '$CONTAINER_ID', but docker inspect failed; check Docker permissions or namespace"
fi

echo "Host PID: $PID"
echo "$INSPECT_OUTPUT" | sed 's#Name: /#Name: #'
```

---

## **安装**

赋予执行权限：

```bash
chmod +x inspect_docker.sh
```

也可以放入 PATH：

```bash
sudo install -m 755 inspect_docker.sh /usr/local/bin/inspect-docker
```

之后可以直接使用：

```bash
inspect-docker 12345
```

---

## **使用示例**

```bash
./inspect_docker.sh 12345
```

输出示例：

```text
Host PID: 12345
Container ID: 41cf67d9bfe15d...
Name: nginx
Image: nginx:latest
Status: running
Container PID: 12301
```

---

## **手动排查方法**

### **1. 查看进程的 cgroup**

```bash
cat /proc/12345/cgroup
```

### **2. 提取 Docker 容器 ID**

常见路径形式：

```text
/docker/<container-id>
```

```text
/system.slice/docker-<container-id>.scope
```

### **3. 查询容器信息**

```bash
docker inspect <container-id>
```

只查看容器名称：

```bash
docker inspect \
  --format '{{.Name}}' \
  <container-id>
```

查看容器名称和镜像：

```bash
docker inspect \
  --format 'name={{.Name}} image={{.Config.Image}}' \
  <container-id>
```

---

## **获取进程 PID**

通过进程名称查找：

```bash
pgrep -af nginx
```

通过端口查找：

```bash
sudo ss -lntp
```

或者：

```bash
sudo lsof -i :8080
```

通过 CPU 占用查找：

```bash
top
```

```bash
ps aux --sort=-%cpu | head
```

然后将 PID 传给脚本：

```bash
inspect-docker 12345
```

---

## **注意事项**

### **必须使用宿主机 PID**

脚本接收的是宿主机视角的 PID，而不是容器内部看到的 PID。

容器内部可能看到：

```text
PID 1
```

但该进程在宿主机上可能对应：

```text
PID 12301
```

可以通过下面的命令查看容器主进程在宿主机上的 PID：

```bash
docker inspect \
  --format '{{.State.Pid}}' \
  <container>
```

### **Docker 权限**

普通用户可能没有访问 Docker daemon 的权限：

```text
permission denied while trying to connect to the Docker daemon socket
```

可以使用：

```bash
sudo ./inspect_docker.sh 12345
```

或者将用户加入 `docker` 用户组：

```bash
sudo usermod -aG docker "$USER"
```

重新登录后生效。

[!warning]  
`docker` 用户组基本等价于宿主机 root 权限，不应随意授予。

### **cgroup v1 与 cgroup v2**

不同 Linux 发行版和 Docker 配置可能使用不同的 cgroup 路径。

cgroup v1 示例：

```text
10:memory:/docker/41cf67d9bfe15d...
```

cgroup v2 示例：

```text
0::/system.slice/docker-41cf67d9bfe15d.scope
```

脚本同时兼容这两种常见格式。

### **非 Docker 运行时**

如果进程来自以下运行时，路径格式可能不同：

- containerd
- Kubernetes
- Podman
- CRI-O

例如 Kubernetes 环境中可能出现：

```text
kubepods.slice
```

Podman 环境中可能出现：

```text
libpod-<container-id>.scope
```

当前脚本只针对 Docker 路径进行匹配。

---

## **延伸命令**

查看某个容器中的所有进程：

```bash
docker top <container>
```

查看所有容器及其宿主机 PID：

```bash
docker inspect \
  --format '{{.Name}} {{.State.Pid}} {{.Config.Image}}' \
  $(docker ps -q)
```

格式化输出：

```bash
printf "%-30s %-10s %s\n" "CONTAINER" "PID" "IMAGE"

docker inspect \
  --format '{{.Name}} {{.State.Pid}} {{.Config.Image}}' \
  $(docker ps -q) |
while read -r name pid image; do
    printf "%-30s %-10s %s\n" "${name#/}" "$pid" "$image"
done
```