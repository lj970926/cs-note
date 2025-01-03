* category：组件协作模式
# Motivation
主要用于构建对象间的通知依赖关系，即一个对象的状态发生改变，将会通知所有依赖它的对象。这里的对象依赖关系无法提前获得，而且个数也不确定，可能在运行过程中改变。
应用观察者模式实现依赖对象和非依赖对象的松耦合，体现依赖导致原则
# Code demo
```c++
class Observer {
public:
	virtual OnProgress(int val) = 0;
	virtual ~Observer() = default;
}

class ConcreteObserver1: public Observer {
public:
	virtual OnProgress(int val) override {
		std::cout << "Observer1: " << val << std::endl;
	}
}

class ConcreateObserver2: public Observer {
public:
	virtual OnProgress(int val) override {
		std::cout << "Observer2: " << val << std:endl;
	}
}

class Subject {
public:
	void DoProgress() {
		for (int i = 0; i < 100; ++i) {
			NotifyAll(i);
		}
	}
private:
	void NotifyAll(int val) {
		for (auto* observer: observers_) {
			ovserver->OnProgress();
		}
	}
	std::vector<Observer*> observers_;
}
```
# Defination
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250102214802.png)
# 类图
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250102214820.png)
# 总结
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250102215254.png)
# 设计思想
* 依赖导致：Subject不依赖具体的ConcreteObserver类，而是依赖其相对稳定的接口
* 分离变化点：Observer和Subject分别独立演进，只需要保持接口不变即可。
* 针对接口编程：Subject使用Observer接口