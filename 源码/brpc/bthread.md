本文基于 `src/bthread` 目录梳理 bthread 的核心实现。bthread 是 brpc 中的 M:N 用户态线程库：大量 bthread 运行在较少的 pthread worker 上，通过用户态栈切换、work stealing 和 futex-like 同步原语实现高并发调度。

## 1. 总体结构

核心文件分层如下：

| 层次 | 关键文件 | 作用 |
| --- | --- | --- |
| 对外 API | `bthread.h`, `bthread.cpp` | 提供 `bthread_start_*`, `join`, `yield`, `usleep`, mutex/cond/rwlock/semaphore/timer 等 C API |
| 全局调度控制 | `task_control.h`, `task_control.cpp` | 管理 worker pthread、`TaskGroup` 集合、work stealing、worker 唤醒、tag/concurrency |
| 单 worker 调度器 | `task_group.h`, `task_group.cpp`, `task_group_inl.h` | 每个 worker 对应一个 `TaskGroup`，持有本地运行队列并执行上下文切换 |
| bthread 元数据 | `task_meta.h` | 描述一个 bthread 的 tid、函数、参数、栈、状态、TLS、等待/睡眠信息 |
| 栈与上下文 | `stack.h`, `stack.cpp`, `stack_inl.h`, `context.h`, `context.cpp` | 分配用户态栈，封装 `make_fcontext/jump_fcontext` |
| 队列 | `work_stealing_queue.h`, `remote_task_queue.h`, `parking_lot.h` | 本地无锁 work-stealing 队列、远程加锁队列、worker park/unpark |
| 等待/唤醒基础 | `butex.h`, `butex.cpp`, `sys_futex.*` | bthread 版 futex，支持 bthread/pthread 混合等待 |
| 同步原语 | `mutex.*`, `condition_variable.*`, `rwlock.*`, `semaphore.*`, `countdown_event.*` | 基于 butex 实现常用同步原语 |
| 定时器 | `timer_thread.*` | 全局 timer pthread，支撑 `bthread_usleep`、butex 超时、用户 timer |
| 高层执行队列 | `execution_queue.*`, `execution_queue_inl.h` | MPSC 串行执行队列，按需启动执行 bthread/pthread |
| bthread TLS | `key.cpp`, `singleton_on_bthread_once.h`, `bthread_once.cpp` | bthread local storage 和 once 语义 |
| 诊断/扩展 | `task_tracer.*`, `id.*`, `fd.cpp`, `interrupt_pthread.*` | tracing、ABA-free id、fd/epoll 集成、pthread interrupt |

## 2. 核心对象关系

### `TaskControl`

`TaskControl` 是全局调度控制器，默认懒初始化在 `get_or_new_task_control()` 中完成。

主要职责：

- 创建并管理 worker pthread，入口是 `TaskControl::worker_thread()`。
- 为每个 worker 创建一个 `TaskGroup`。
- 保存按 tag 分组的 `TaskGroup` 数组：`_tagged_groups` 和 `_tagged_ngroup`。
- 实现 `steal_task()`，从同 tag 的其他 `TaskGroup` 偷取任务。
- 通过 `ParkingLot` 唤醒 idle worker：`signal_task()`。
- 支持动态增加 worker：`add_workers()`。
- 暴露 bvar 指标，如 worker 数、bthread 数、切换次数、signal 次数。

### `TaskGroup`

`TaskGroup` 是实际执行调度的对象，通常一个 worker pthread 持有一个 `TaskGroup`，并存放在线程局部变量 `tls_task_group`。

主要字段：

- `_cur_meta`：当前运行的 `TaskMeta`。
- `_main_tid` / `_main_stack`：worker pthread 的主任务，用于 idle 和回到 pthread 栈。
- `_rq`：本地 `WorkStealingQueue<bthread_t>`。
- `_remote_rq`：非本 worker 或非 worker 线程推入任务时使用的队列。
- `_pl`：所在 tag 的 `ParkingLot`，用于无任务时 park。
- `_last_context_remained`：切换完成后延迟执行的回调，用于“当前任务已挂起后再入队/释放栈/注册 sleep”等场景。

### `TaskMeta`

`TaskMeta` 是 bthread 的运行时元数据，通过 `butil::ResourcePool<TaskMeta>` 分配，`bthread_t` 由版本号和资源池 slot 组成：

```cpp
bthread_t = (version << 32) | slot
```

主要字段：

- `tid`：bthread id。
- `fn`, `arg`：用户入口函数和参数。
- `stack`：当前绑定的 `ContextualStack`。
- `attr`：栈类型、flags、tag 等属性。
- `version_butex`：join/生命周期判断使用的 butex；任务结束时 version 自增并唤醒 joiner。
- `current_waiter`, `current_sleep`：当前是否阻塞在 butex 或 sleep，供 interrupt/stop 唤醒。
- `stop`, `interrupted`, `about_to_quit`：停止、中断、延迟调度标记。
- `local_storage`：bthread TLS，调度切换时与 `tls_bls` 同步。

## 3. worker 启动与主循环

典型初始化路径：

1. 用户首次调用 `bthread_start_*`。
2. `bthread.cpp` 中 `get_or_new_task_control()` 创建全局 `TaskControl`。
3. `TaskControl::init()` 创建全局 `TimerThread`，再创建指定数量 worker pthread。
4. 每个 worker 进入 `TaskControl::worker_thread()`。
5. worker 创建自己的 `TaskGroup`，设置 `tls_task_group = g`。
6. worker 调用 `g->run_main_task()` 进入调度循环。

`TaskGroup::run_main_task()` 的核心逻辑：

```text
while (wait_task(&tid)) {
    sched_to(&g, tid)
    if 当前不是 main task:
        task_runner()
}
```

`wait_task()` 会先尝试从 `_remote_rq` 或其他 group steal 任务；没有任务时在 `ParkingLot` 上等待。`ParkingLot` 本质上用 futex 等待 `_pending_signal` 变化，`TaskControl::signal_task()` 负责唤醒 worker。

## 4. 创建 bthread

### API 分流

`bthread_start_urgent()`：

- 如果当前线程已经是 worker 且 tag 匹配，调用 `TaskGroup::start_foreground()`。
- foreground 会切换到新任务，让新任务更快开始执行。
- 如果当前不是 worker，则退化为从 `TaskControl` 选择一个 group 并远程入队。

`bthread_start_background()`：

- 如果当前是 worker 且 tag 匹配，调用 `TaskGroup::start_background<false>()` 入本地队列。
- 如果当前不是 worker，调用 `start_from_non_worker()`，选择一个 group 后 `start_background<true>()` 入远程队列。

### 元数据初始化

创建流程中会：

1. 从 `ResourcePool<TaskMeta>` 获取 `TaskMeta`。
2. 重置 `sleep_failed/stop/interrupted/about_to_quit` 等状态。
3. 保存用户 `fn/arg/attr`。
4. 生成 `tid = make_tid(*version_butex, slot)`。
5. 递增全局和 tag 维度的 bthread 计数。
6. 将任务放入本地或远程 runqueue。

### foreground 的特殊点

`start_foreground()` 不只是入队，它会：

- 把当前 bthread 通过 `_last_context_remained` 安排为“切换后再重新入队”。
- 直接 `sched_to()` 新 bthread。

这样避免“先把新任务入队，再由调度器 pop 出来”的额外开销，也能提升新任务启动及时性。

## 5. 调度与上下文切换

调度入口主要有：

- `TaskGroup::sched()`：当前任务让出，选择下一个任务。
- `TaskGroup::sched_to()`：直接切换到指定任务。
- `TaskGroup::ending_sched()`：当前任务结束时选择下一任务，必要时复用当前栈。
- `TaskGroup::yield()`：把当前任务重新入队后调度。
- `TaskGroup::exchange()`：把当前任务入队并切到指定任务，butex wake 常用。

选取下一个任务的顺序：

1. 从当前 group 的 `_rq` pop。
2. 从 `_remote_rq` pop。
3. 从同 tag 的 priority queue 或其他 group steal。
4. 没有任务则切回 `_main_tid`。

`sched_to(TaskMeta*)` 做的事情：

- 保存当前 `errno` 和部分 TLS。
- 统计 CPU time 和切换次数。
- 切换 `tls_bls`，使 bthread local storage 跟随 bthread。
- 如目标任务还没有栈，则按 `attr.stack_type` 获取栈；失败时降级为 pthread stack。
- 调用 `jump_stack(cur_meta->stack, next_meta->stack)` 进行用户态上下文切换。
- 切回来后执行 `_last_context_remained` 回调。
- 恢复 `errno`。

`_last_context_remained` 是理解 bthread 调度的关键。很多操作必须等“当前 bthread 已经不在运行”之后才能做，例如：

- 把刚让出的当前任务重新入队。
- 释放已经结束任务的栈和 `TaskMeta`。
- 注册 sleep timer。
- 把等待 butex 的 waiter 插入等待队列。

## 6. 栈管理

`ContextualStack` 包含：

- `bthread_fcontext_t context`
- `StackType stacktype`
- `StackStorage storage`

栈类型包括：

- `STACK_TYPE_MAIN`：worker pthread 主栈。
- `STACK_TYPE_PTHREAD`：直接运行在 pthread 栈上。
- `STACK_TYPE_SMALL`
- `STACK_TYPE_NORMAL`
- `STACK_TYPE_LARGE`

`stack.cpp` 中默认大小：

- small：32KB
- normal：1MB
- large：8MB

`allocate_stack_storage()` 默认使用 `mmap` 分配栈并设置 guard page；`guard_page_size=0` 时退化为 `malloc`。栈对象会被缓存，small/normal 栈有每线程缓存上限。

上下文切换底层使用 `context.h/context.cpp` 提供的 `bthread_make_fcontext()` 和 `bthread_jump_fcontext()`，按平台选择对应汇编实现。

## 7. runqueue 与 work stealing

### `WorkStealingQueue`

`WorkStealingQueue<T>` 是 Chase-Lev 风格的 bounded deque：

- owner 线程 `push/pop` 操作 `_bottom`。
- thief 线程 `steal` 操作 `_top`。
- 最后一个元素通过 CAS 竞争。

约束：

- `push()` 不可与另一个 `push()` 或 `pop()` 并发。
- `pop()` 不可与另一个 `pop()` 或 `push()` 并发。
- `steal()` 可以与 `push/pop/steal` 并发。

这正好匹配 `TaskGroup`：本 worker 独占本地队列底部，其他 worker 从顶部 steal。

### `RemoteTaskQueue`

非 owner 线程向某个 `TaskGroup` 投递任务时使用 `_remote_rq`。它是一个 `BoundedQueue` 加 mutex，设计上依赖“非 worker 随机选 group”来分散竞争。

### priority queue

如果开启 `FLAGS_enable_bthread_priority_queue`，带 `BTHREAD_GLOBAL_PRIORITY` 的任务会进入 `TaskControl::_priority_queues[tag]`。`steal_task()` 会先尝试从 priority queue steal。

## 8. sleep、interrupt 和 stop

### `bthread_usleep`

如果当前是普通 bthread，`bthread_usleep()` 走 `TaskGroup::usleep()`：

1. 构造 `SleepArgs`。
2. 通过 `_last_context_remained` 延迟调用 `_add_sleep_event()`。
3. 当前 bthread `sched()` 让出。
4. 切换完成后 `_add_sleep_event()` 在 timer thread 中注册超时回调。
5. timeout 到期后 `ready_to_run_from_timer_thread()` 把 bthread 远程入队。

如果当前不是 bthread 或当前是 pthread-mode task，则直接调用系统 `usleep()`。

### interrupt

`bthread_interrupt(tid)` 最终进入 `TaskGroup::interrupt()`：

- 若目标在 butex 上等待，取出 `current_waiter`，从 butex 队列移除并唤醒。
- 若目标在 sleep，取出 `current_sleep`，从 TimerThread unschedule，成功后重新入队。
- 设置 `interrupted = true`，使下一次阻塞操作能感知中断。

中断是“持久”的：目标当前没阻塞时也会记住，下次阻塞检查后返回 `EINTR` 或 `ESTOP`。

### stop

`bthread_stop(tid)` 只是：

1. 设置 `TaskMeta::stop = true`。
2. 调用 `bthread_interrupt(tid)`。

它不会强杀 bthread，用户代码仍需在阻塞返回或主动检查 `bthread_stopped()` 后自行退出。

## 9. butex：bthread 的 futex 基础

butex 是 bthread 同步原语的基础，外部看到的是一个 32-bit 整数指针。内部结构 `Butex` 包含：

- `value`：用户可见的 32-bit 原子值。
- `waiters`：等待队列。
- `waiter_lock`：保护等待队列。

等待者分两类：

- `ButexBthreadWaiter`：普通 bthread，等待时会让出 worker。
- `ButexPthreadWaiter`：pthread 或 pthread-mode bthread，等待时使用系统 futex 阻塞 pthread。

`butex_wait()` 流程：

1. 若 `value != expected`，立即返回 `EWOULDBLOCK`。
2. 若当前不是普通 bthread，走 `butex_wait_from_pthread()`。
3. 若是普通 bthread，构造栈上 `ButexBthreadWaiter`。
4. 设置 `TaskMeta::current_waiter`，用于 interrupt。
5. 通过 `_last_context_remained` 在切走后把 waiter 挂入 butex 队列。
6. 当前 bthread `sched()` 让出。
7. 被 wake/timeout/interrupt 重新调度后，根据 waiter 状态返回。

`butex_wake()` 会：

- 从等待队列取出 waiter。
- 如果是 pthread waiter，用 futex 唤醒。
- 如果是 bthread waiter，将其 `TaskMeta` 放回合适的 `TaskGroup` runqueue。
- 如果唤醒目标与当前 worker 同 tag，可能用 `TaskGroup::exchange()` 直接切换，减少延迟。

`butex_requeue()` 用于 condition variable broadcast：唤醒一个等待者，把剩余等待者从 cond 的 butex 队列迁移到 mutex 的 butex 队列，避免惊群。

## 10. mutex 和 condition variable

### mutex

`bthread_mutex_t` 内部核心是一个 butex：

- `0` 表示未锁。
- `BTHREAD_MUTEX_LOCKED` 表示已锁且无竞争者。
- 其他状态表示已锁且可能有等待者。

加锁：

1. `bthread_mutex_lock()` 先尝试 CAS fast path。
2. 失败后进入 `mutex_lock_contended_impl()`，在 butex 上等待。

解锁：

1. 清 owner。
2. `exchange(0)` 释放锁。
3. 如果之前状态表明有等待者，则 `butex_wake()` 唤醒一个。

`mutex.cpp` 还包含 contention profiler 和 pthread mutex hook 逻辑，用于采样锁竞争热点。

### condition variable

`bthread_cond_t` 内部包含：

- 绑定的 mutex 指针。
- 一个 seq butex。

`cond_wait()`：

1. 读取当前 seq。
2. 绑定 mutex。
3. 解锁 mutex。
4. 在 seq butex 上等待。
5. 被唤醒后重新加锁 mutex。

`cond_signal()` 对 seq 自增并 wake 一个 waiter。`cond_broadcast()` 对 seq 自增并 `butex_requeue()`，把等待者迁移到 mutex 的 butex 上。

## 11. TimerThread

`TimerThread` 是一个全局 pthread，负责执行到期回调。典型使用场景：

- `bthread_usleep`
- butex timeout
- `bthread_timer_add/del`
- 延迟删除 `TaskGroup`

实现要点：

- 定时任务按 bucket 分片，`schedule()` 根据 pthread id hash 到 bucket，降低锁竞争。
- timer thread 周期性从所有 bucket 拉取任务，放入按 `run_time` 排序的 min-heap。
- 通过 `_nearest_run_time` 和 futex `_nsignals` 让新插入的更早任务能唤醒 timer thread。
- `TaskId` 同样由 version 和 resource slot 组成。
- `unschedule()` 只更新 version，不立即回收任务；真正回收由 timer thread 拉取任务后完成。

Timer callback 必须短小，因为同一时刻只有 timer thread 一个线程执行到期回调。

## 12. ExecutionQueue

`ExecutionQueue` 是一个 wait-free MPSC 串行执行队列。它没有常驻消费者；生产者提交任务时，如果发现队列从空变非空，就负责启动一个执行 bthread/pthread/executor。

关键点：

- `_head.exchange(node)` 实现多生产者入队。
- 第一个把空队列变非空的生产者获得执行权。
- 执行端批量迭代任务，通过 `TaskIterator` 交给用户回调。
- 支持 high priority 任务，高优任务会优先于普通 pending 任务执行。
- `execution_queue_stop()` 设置 stopped，并在引用释放到 0 后提交 stop task。
- `execution_queue_join()` 等待 `_join_butex` 版本变化。

它适合把多线程并发提交的任务串行化处理，避免用户自己维护消费线程。

## 13. 生命周期与 join

bthread 结束发生在 `TaskGroup::task_runner()`：

1. 执行用户函数 `fn(arg)`，或捕获 `ExitException` 实现 `bthread_exit()`。
2. 清理 bthread TLS。
3. 清理 span/rpcz 相关 local storage。
4. 持有 `version_lock`，递增 `version_butex`。
5. `butex_wake_except(version_butex, 0)` 唤醒所有 joiner。
6. 递减 bthread 计数。
7. 设置 `_last_context_remained = _release_last_context`，在切走后释放栈和归还 `TaskMeta`。
8. 调用 `ending_sched()` 切到下一个任务。

`bthread_join(tid)` 只是等待目标 `TaskMeta::version_butex` 与 tid 中 version 不再相等。返回值当前总是设为 `NULL`，源码中 `thread_return` 没有保存。

## 14. tag 与并发度

bthread 支持 tag 维度的 worker 分组：

- `bthread_attr_t::tag` 指定任务所属 tag。
- `TaskControl` 为每个 tag 保存独立 group 数组、parking lot、priority queue、bvar。
- `TaskControl::steal_task()` 只在当前 worker 的 tag 内 steal。
- `bthread_setconcurrency_by_tag()` 可给指定 tag 增加 worker。

注意当前实现只支持增加并发度，不支持在创建 bthread 后减少 worker 数。`bthread_setconcurrency()` 中如果目标值小于当前 concurrency 会返回 `EPERM`。

## 15. 推荐阅读路径

如果要继续深入源码，建议按下面顺序读：

1. `bthread.cpp`：理解 API 如何映射到内部对象。
2. `task_control.cpp`：理解 worker 创建、`TaskGroup` 管理和 work stealing。
3. `task_group.cpp`：重点看 `run_main_task()`、`sched_to()`、`task_runner()`、`start_foreground/background()`。
4. `work_stealing_queue.h` 和 `remote_task_queue.h`：理解任务队列并发约束。
5. `stack.*`、`context.*`：理解用户态栈和上下文切换。
6. `butex.cpp`：理解 bthread 阻塞、唤醒、timeout、interrupt 的核心机制。
7. `mutex.cpp`、`condition_variable.cpp`：看 butex 如何构建同步原语。
8. `timer_thread.cpp`：理解 sleep/timeout 的统一来源。
9. `execution_queue.*`：理解基于 bthread 的高层串行执行抽象。

## 16. 几个关键设计点

- bthread 是协作式调度，不会强制抢占正在运行的用户代码。
- 用户态上下文切换发生在显式阻塞、yield、任务结束或 foreground start 等路径。
- worker pthread 不忙等：无任务时通过 `ParkingLot` futex park。
- 本地队列优化 owner push/pop，跨 worker 通过 steal 平衡负载。
- 非 worker 创建任务走 remote queue，避免破坏 owner-only 队列约束。
- butex 同时支持 bthread 和 pthread 等待，因此同步原语可在混合线程模型下使用。
- `bthread_stop()` 是协作式停止，只设置 stop flag 并 interrupt，不负责终止用户函数。
- `TaskMeta::version_butex` 同时解决 join 和 ABA 问题：旧 tid 的 version 不匹配时视为不存在。

