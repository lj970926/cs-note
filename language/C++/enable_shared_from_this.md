# Intro
C++中，一个经常遇到的场景是某个类的对象由智能指针管理，而该指针又存在许多问题，现在需要在类的内部获取一个指向该对象的智能指针：
```c++
std::shared_ptr GetSharedObject() {
	return std::shared_ptr(this);
}
```
采用类似上面的方式是存在问题的，主要原因是C++ shared_ptr的引用计数不是intrusive的，从同一个裸指针获取到的两个shared_ptr之间无法互相感知，各自维护自己独立的引用计数。回到上面的情况，这种情况下，如果该对象是被一个shared_ptr管理，则返回的shared_ptr与管理的shared_ptr之间会存在冲突。
# shared_from_this
通过引入`enable_shared_from_this` 模版里，可以解决上述问题：
```c++
class MyObject: public std::enable_shared_from_this<MyObject> {
	std::shared_ptr GetSharedObject() {
		return shared_from_this();
	}
};
```
采用类似上面的方式，可以保证所有通过`GetSharedObject`拿到的shared_ptr和管理该对象的shared_ptr共享同一组引用计数。
# Ref
https://zhuanlan.zhihu.com/p/393571228
https://en.cppreference.com/w/cpp/memory/enable_shared_from_this.html