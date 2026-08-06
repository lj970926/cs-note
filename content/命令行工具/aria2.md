---
title: "aria2"
tags:
  - tool
  - shell
---

aria2 是一款轻量级的多协议、多来源下载工具，支持 HTTP/HTTPS、FTP、SFTP、BitTorrent 和 Metalink。最大特点是支持**多线程分片下载**，网络不好或下载海外大文件时通常比 `wget`、`curl` 快很多。

# 安装

```bash
brew install aria2          # macOS
sudo apt install aria2      # Ubuntu / Debian
sudo yum install aria2      # CentOS / RHEL
```

# 基础用法

最常用的多线程下载组合：

```bash
aria2c -x 16 -s 16 -k 1M -c "URL"
```

| 参数 | 作用 |
| --- | --- |
| `-x, --max-connection-per-server=<N>` | 单服务器最大连接数，默认 1，最大 16 |
| `-s, --split=<N>` | 文件分片数，用 N 个线程下载 |
| `-k, --min-split-size=<SIZE>` | 每个分片的最小大小，如 `1M`、`512K` |
| `-c, --continue` | 断点续传，下载中断后可接着下 |
| `-d, --dir=<DIR>` | 指定下载目录 |
| `-o, --out=<FILE>` | 指定保存的文件名 |
| `-i, --input-file=<FILE>` | 从文件中批量读取 URL 下载 |
| `-j, --max-concurrent-downloads=<N>` | 批量下载时同时进行的任务数 |
| `--file-allocation=none` | 不预分配磁盘空间，机械盘/小文件可加快启动 |
| `--max-tries=0` | 无限重试 |
| `--retry-wait=<SEC>` | 重试等待秒数 |
| `--console-log-level=warn` | 减少日志输出 |

> `-x` 的上限是 16。如果服务器对单 IP 限速，调大线程数效果有限，需要换镜像或走代理。

# 常见场景

## 断点续传

中断后重新执行同样的命令即可，`-c` 会自动续传：

```bash
aria2c -c -x 16 -s 16 "URL"
```

## 多镜像同时下载

如果同一文件有多个镜像地址，把多个 URL 一起传入，aria2 会同时从多个源拉取并合并：

```bash
aria2c -x 16 -s 16 "URL1" "URL2" "URL3"
```

## 批量下载

把 URL 按行写入 `urls.txt`，并发下载：

```bash
aria2c -i urls.txt -j 8 -c
```

`-j 8` 表示同时下载 8 个文件。

## 走代理

```bash
# HTTP 代理
aria2c --all-proxy="http://127.0.0.1:7890" "URL"

# 或通过环境变量
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
aria2c -x 16 -s 16 -c "URL"
```

## 下载 BT / 磁力链接

```bash
aria2c /path/to/file.torrent
aria2c "magnet:?xt=urn:btih:..."
```

# 配置文件

可以把常用选项写入 `~/.aria2/aria2.conf`，避免每次敲一长串参数：

```conf
continue=true
max-connection-per-server=16
split=16
min-split-size=1M
max-concurrent-downloads=8
max-tries=0
retry-wait=5
file-allocation=none
console-log-level=warn
```

命令行参数会覆盖配置文件中的同名项。

# 网络不好时的建议

- 优先用 `-x 16 -s 16 -c`，断点续传 + 多线程是最直接的提速手段。
- 海外资源走代理（`--all-proxy`）或换国内镜像。
- 大文件加 `--max-tries=0 --retry-wait=5`，让它自动重连直到下完。
- 机械盘可加 `--file-allocation=none`，避免预分配空间时卡顿。
- 如果服务器严格限速单连接，多线程帮助不大，考虑换源或换时段下载。

# Related

- [[wget]]
- [[SSH 端口转发]]
