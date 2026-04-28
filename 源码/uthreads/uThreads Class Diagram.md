This diagram focuses on the core runtime, synchronization, scheduler, and
network I/O classes. The active `Scheduler` class is selected at compile time by
`SCHEDULERNO`; when it is not defined, `Scheduler_02.h` is used.

```mermaid
classDiagram
    direction LR

    class Link~T~ {
        -Link* prev
        -Link* next
    }

    class IntrusiveList~T~ {
        -Link~T~ anchor
        +empty() bool
        +push_back(T&)
        +pop_front() T*
        +remove(T&) T*
    }

    class IntrusiveQueue~T~ {
        -T* head
        -T* tail
        +empty() bool
        +push(T&)
        +pop() T*
        +transferAllFrom(IntrusiveQueue&)
    }

    class IntrusiveStack~T~ {
        -T* head
        +empty() bool
        +push(T&)
        +pop() T*
    }

    class BlockingMPSCQueue~T~ {
        -Link~T~* head
        -Link~T~ stub
        -atomic~Link~T~*~ tail
        +push(T&) bool
        +pop() T*
    }

    class uThread {
        -Cluster* currentCluster
        -kThread* homekThread
        -vaddr stackPointer
        -vaddr stackBottom
        -size_t stackSize
        -UTVar* utvar
        -uint64_t uThreadID
        -Mutex joinMtx
        -ConditionVariable joinWait
        -Semaphore afterJoin
        +create(size_t, bool) uThread*
        +create(bool) uThread*
        +start(const Cluster&, ptr_t, ptr_t, ptr_t, ptr_t) void
        +yield() void
        +terminate() void
        +migrate(Cluster*) void
        +resume() void
        +join() bool
        +detach() void
        +currentUThread() uThread*
    }

    class kThread {
        -Cluster* localCluster
        -Scheduler* scheduler
        -KTVar* ktvar
        -uThread* currentUT
        -uThread* mainUT
        -thread::id threadID
        -thread threadSelf
        +kThread(Cluster&)
        +getThreadNativeHandle()
        +getID() thread::id
        +currentkThread() kThread*
        +getTotalNumberOfkThreads() uint
    }

    class Cluster {
        -Scheduler* scheduler
        -ClusterVar* clustervar
        -atomic~size_t~ ktLast
        -atomic_uint numberOfkThreads
        -vector~kThread*~ ktVector
        -uint64_t clusterID
        +Cluster()
        +getDefaultCluster() Cluster&
        +getID() uint64_t
        +getNumberOfkThreads() size_t
    }

    class Scheduler {
        -semaphore sem
        -BlockingMPSCQueue~uThread~ runQueue
        +schedule(uThread*, kThread&) void
        +schedule(uThread*) void
        +nonBlockingSwitch(kThread&) uThread*
        +blockingSwitch(kThread&) uThread*
        +getScheduler(Cluster&) Scheduler*
    }

    class UTVar
    class KTLocal
    class KTVar
    class ClusterVar

    class uThreadCache {
        -mutex mtx
        -IntrusiveStack~uThread~ stack
        -size_t count
        -size_t size
        +push(uThread*) ssize_t
        +pop() uThread*
    }

    class BlockingQueue {
        -IntrusiveList~uThread~ queue
        +empty() bool
        +suspend(mutex&) bool
        +suspend(Mutex&) bool
        +signal(mutex&) bool
        +signal(Mutex&) bool
        +signalAll(Mutex&) void
    }

    class Mutex {
        #mutex lock
        #BlockingQueue bq
        #uThread* owner
        +acquire() bool
        +release() void
    }

    class OwnerLock {
        -mword counter
        +acquire() mword
        +release() mword
    }

    class ConditionVariable {
        -BlockingQueue bq
        +wait(Mutex&) void
        +signal(Mutex&) void
        +signalAll(Mutex&) void
        +empty() bool
    }

    class Semaphore {
        -Mutex mutex
        -BlockingQueue bq
        -mword counter
        +P() bool
        +V() void
    }

    class uThreadPool {
        -atomic_uint totalnumuThreads
        -atomic_uint idleuThreads
        -Mutex mutex
        -ConditionVariable cv
        -task queue taskList
        +uThreadExecute(funcvoid1_t, void*, Cluster&) void
    }

    class PollData {
        -uThread* rut
        -uThread* wut
        -bool closing
        -bool opened
        -bool isBlockingOnRead
        -int fd
    }

    class PollCache {
        #IntrusiveQueue~PollData~ cache
        #mutex mtx
        #getPollData() PollData*
        #pushPollData(PollData*) void
    }

    class IOPoller {
        -int epoll_fd
        -epoll_event* events
        -IOHandler& ioh
        -_Open(int, PollData&) int
        -_Close(int) int
        -_Poll(int) ssize_t
    }

    class IOHandler {
        -size_t unblockCounter
        -atomic_flag isPolling
        -semaphore sem
        -kThread ioKT
        -PollCache pollCache
        -IOPoller poller
        +open(PollData&) void
        +close(PollData&) int
        +wait(PollData&, int) void
        +poll(int, int) ssize_t
        +nonblockingPoll() ssize_t
        +reset(PollData&) void
    }

    class Connection {
        -PollData* pd
        -int fd
        +Connection()
        +Connection(int)
        +Connection(int, int, int)
        +accept(Connection*, sockaddr*, socklen_t*) int
        +accept(sockaddr*, socklen_t*) Connection*
        +socket(int, int, int) int
        +listen(int) int
        +bind(sockaddr*, socklen_t) int
        +connect(sockaddr*, socklen_t) int
        +recv(void*, size_t, int) ssize_t
        +send(void*, size_t, int) ssize_t
        +read(void*, size_t) ssize_t
        +write(void*, size_t) ssize_t
        +blockOnRead() void
        +blockOnWrite() void
        +close() int
        +getFd() int
    }

    class semaphore {
        -sem_t sem_
        +wait() void
        +trywait() bool
        +timedwait(timespec&) bool
        +post() void
    }

    uThread --|> Link~uThread~
    kThread --|> Link~kThread~
    PollData --|> Link~PollData~

    Link~T~ <.. IntrusiveList~T~
    Link~T~ <.. IntrusiveQueue~T~
    Link~T~ <.. IntrusiveStack~T~
    Link~T~ <.. BlockingMPSCQueue~T~

    Cluster "1" o-- "*" kThread : ktVector
    Cluster "1" *-- "1" Scheduler
    Cluster "1" *-- "1" ClusterVar
    Cluster ..> IOHandler : friends/uses

    kThread "1" --> "1" Cluster : localCluster
    kThread "1" --> "1" Scheduler
    kThread "1" --> "1" uThread : currentUT
    kThread "1" *-- "1" uThread : mainUT
    kThread "1" *-- "1" KTVar

    uThread "1" --> "1" Cluster : currentCluster
    uThread "1" --> "0..1" kThread : homekThread
    uThread "1" *-- "1" UTVar
    uThread "1" *-- "1" Mutex : joinMtx
    uThread "1" *-- "1" ConditionVariable : joinWait
    uThread "1" *-- "1" Semaphore : afterJoin
    uThread ..> uThreadCache : cached by

    Scheduler "1" *-- "1" semaphore
    Scheduler "1" *-- "1" BlockingMPSCQueue~uThread~
    Scheduler ..> IOHandler : polls
    Scheduler ..> uThread : schedules
    Scheduler ..> kThread : switches

    uThreadCache "1" *-- "1" IntrusiveStack~uThread~

    BlockingQueue "1" *-- "1" IntrusiveList~uThread~
    BlockingQueue ..> uThread : blocks/resumes
    Mutex "1" *-- "1" BlockingQueue
    Mutex "1" --> "0..1" uThread : owner
    OwnerLock --|> Mutex
    ConditionVariable "1" *-- "1" BlockingQueue
    Semaphore "1" *-- "1" Mutex
    Semaphore "1" *-- "1" BlockingQueue
    uThreadPool "1" *-- "1" Mutex
    uThreadPool "1" *-- "1" ConditionVariable
    uThreadPool ..> uThread : creates tasks
    uThreadPool ..> Cluster : execute on

    PollCache "1" *-- "1" IntrusiveQueue~PollData~
    IOPoller "1" --> "1" IOHandler
    IOHandler "1" *-- "1" kThread : ioKT
    IOHandler "1" *-- "1" PollCache
    IOHandler "1" *-- "1" IOPoller
    IOHandler "1" *-- "1" semaphore
    IOHandler ..> PollData : opens/waits/resets
    IOHandler ..> uThread : unblocks
    Connection "1" --> "1" PollData
    Connection ..> IOHandler : nonblocking IO
    PollData "1" --> "0..2" uThread : rut/wut
```

## Notes

- `Scheduler_01.h`, `Scheduler_02.h`, `Scheduler_03.h`, and `Scheduler_04.h`
  all define a class named `Scheduler`. `src/runtime/schedulers/Scheduler.h`
  picks exactly one of them with `SCHEDULERNO`; the diagram shows the default
  `Scheduler_02.h` shape.
- `OwnerLock` inherits from `Mutex` with protected inheritance in the code.
- `IOHandler` is implemented as a singleton-like static handler in the current
  source (`IOHandler::iohandler`) and owns an I/O `kThread`, `PollCache`, and
  Linux `IOPoller`.
- `Link<T>` must be the first base/member layout element for intrusive
  containers to reinterpret objects safely, as noted in
  `IntrusiveContainers.h`.
