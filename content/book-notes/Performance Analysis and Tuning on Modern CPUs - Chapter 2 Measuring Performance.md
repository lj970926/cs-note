---
title: Performance Analysis and Tuning on Modern CPUs - Chapter 2 Measuring Performance
tags:
  - book
  - performance
  - cpu
  - optimization
aliases:
  - Performance Analysis and Tuning on Modern CPUs 第二章
  - Modern CPUs Ch.2
created: 2026-10-08
source: "Denis Bakhvalov, Performance Analysis and Tuning on Modern CPUs (2nd ed.), Chapter 2"
---

# Performance Analysis and Tuning on Modern CPUs —— Chapter 2 Measuring Performance

> 本章笔记随阅读进度增长，目前收录 §2.5 的一个问答。前一章见 [[Performance Analysis and Tuning on Modern CPUs - Chapter 1 Introduction|Modern CPUs Ch.1]]。

## Q&A：关机后高精度计时器怎么"保持增长"？

书中 §2.5 写道：

> System-wide high-resolution timer: this is a system timer that is typically implemented as a simple count of the number of ticks that have transpired since an arbitrary starting date, called the epoch[^epoch]. This clock is monotonic; i.e., it always goes up.

[^epoch]: 书中脚注 31 指的 epoch 是 Unix epoch（1970-01-01 00:00:00 UT）。注意 "epoch" 在这里只是"计数的起始基准点"，并不等同于日历时间，详见下文。

**简短回答：关机时它并不"保持增长"——计数器确实停了。** 这段描述容易让人误解，需要区分几种"时钟"：

1. **单调时钟（如 Linux 的 `CLOCK_MONOTONIC`）**：这类 "system-wide high-resolution timer" 通常基于 TSC（Time Stamp Counter）或 HPET 等硬件计数器，只在 CPU 通电运行时才递增。关机后计数器冻结，重启后从某个基准点重新开始计。它的语义本来就是"自系统启动以来经过的时间"，**不保证跨重启连续**。
2. **墙上时间（wall time，如 `CLOCK_REALTIME`）**：日历时间（"自 1970 年 1 月 1 日以来多少秒"）。它在关机时由两个机制接力维持：
   - **RTC（实时时钟）**：主板上有一颗纽扣电池供电的独立时钟芯片（以前是 CMOS 时钟，现在多由 UEFI/SoC 集成），关机时继续走时；开机时操作系统读取 RTC，作为墙上时间的初始基准。
   - **NTP 网络校时**：联网后系统把时间同步到精确时间源，修正 RTC 的漂移。

关机到开机的时间"看起来"没断，实际是接力：

```text
关机：TSC 冻结，RTC 靠电池继续走
   ↓
开机：OS 读 RTC（+ NTP 校准）→ 设定墙上时间的基准点
   ↓
运行时：墙上时间 = 启动时基准 + TSC 等计数器累计的偏移
```

这也解释了两个常见现象：

- 拔掉电池、断网且 RTC 不准的机器，重启后时间可能跳变甚至回拨。
- 程序测量耗时时应该用**单调时钟**（`std::chrono::steady_clock`、`CLOCK_MONOTONIC`），因为墙上时间可能被 NTP 调整或被管理员改时间，而单调时钟不受此类跳变影响。这正是书中讨论高精度计时器时强调单调性的原因。

### 补充：两种计时器在书中的定位

书中 §2.5 介绍的两种计时器选择原则是"按被测事件的时长选"：

| 计时器 | 访问方式 | 访问延迟 | 适用场景 |
| --- | --- | --- | --- |
| System timer | `clock_gettime` 系统调用 / `std::chrono::steady_clock` | 约 500 ns | 微秒以上、乃至长时间的测量 |
| TSC | `__rdtsc`（x86）/ `CNTVCT_EL0`（ARM） | 约 5 ns（20 个 CPU 周期） | 纳秒到约一分钟的短事件 |

TSC 单调、速率恒定（不随 CPU 频率变化），每颗 CPU 各自计数，但现代平台上各 CPU 的 TSC 已保持一致。

### 辨析：两种计时器其实是同一个计数器

书里把两种计时器并列介绍，容易读成"两套机制"。但在现代 x86/Linux 上，**两者计数机制上是同一类东西，前者通常直接建立在后者之上**——区别在抽象层次和读取成本，不在计数器本身。

**机制上的关系**：Linux 有个 clocksource 机制，启动时探测可用的硬件计数器，优先选 TSC（要求所有核的 TSC 同步、且频率不变，即 invariant TSC），退而求其次才是 HPET、ACPI PM timer。也就是说，`clock_gettime` 背后读的还是 TSC 那串 tick，只是内核把它**换算成纳秒**、加上启动时刻的偏移，再通过 vDSO/syscall 暴露出来。书中说 system timer "consistent between all CPUs、independent of CPU frequency"——这恰恰是因为内核**校验过 TSC 满足这些条件才选它做 clocksource**，否则就不会选。

**一句话总结**：同一个计数器，两条读取路径。`__rdtsc` 是"绕过 OS 直接看原始计数器"，省掉换算和接口开销；system timer 是"经过 OS 包装的标准读法"，慢一点但跨平台、单位统一。

**注意书里的措辞**：system timer 的 "nanosecond resolution" 指**分辨率/粒度**是纳秒，不代表**精度**是纳秒——实际精度受 clocksource 更新和换算误差限制，所以测量几十纳秒的事件不可靠，这正是推荐短事件用 RDTSC 的原因。

## 来源

- Denis Bakhvalov, *Performance Analysis and Tuning on Modern CPUs*, Second Edition, Chapter 2 "Measuring Performance", §2.5 "Software and Hardware Timers", PDF pp. 33–34。
