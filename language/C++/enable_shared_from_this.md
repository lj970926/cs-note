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
# Impl
参考Ref 3，实现包含两个部分：

1. enable_shared_from_this抽象类中需要提供一个接口，用于在shared_ptr创建对象时在enable_shared_from_this中记录下当前管理该对象的shared_ptr
2. shared_ptr初始化时，针对enable_shared_from_this需要调用其上述接口设置自身。

![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20251001234231.png)
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20251001234340.png)
# Ref
1. https://zhuanlan.zhihu.com/p/393571228
2. https://en.cppreference.com/w/cpp/memory/enable_shared_from_this.html
3. https://blog.guorongfei.com/2017/01/25/enbale-shared-from-this-implementaion/