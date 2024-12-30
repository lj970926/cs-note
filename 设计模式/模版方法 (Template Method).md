* category: 组件协作模式
# Motivation
* 稳定的整体操作结构，但各个子步骤有许多改变的需求
* 在确定稳定结构的前提下，灵活应对子步骤的变化和晚期需求
# Code demo
* library.h
```c++
class Library {
public:
    void Run() {
	    Step1()
	    if (Step2()) {
		    Step3();
	    }
		for (int i = 0; i < 4; ++i) {
			Step5();
		}
    }
	virtual ~Library() = default;
protected:
	void Step1();
	void Step3();
    void Step5();
	virtual bool Step2() = 0;
	virtual void Step() = 0;
}
```

* application.cc
```c++
#include "library.h"

class Application: public Library {
protected:
	virtual bool Step2() override;
	virtual void Step4() override;
}

int main() {
	Library* lib = new Application();
	lib->Run();
}
```

![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241230174911.png)

![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241230175114.png)
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241230175232.png)
# Definition
* 定义一个一个操作中步骤的骨架（demo中的Run方法），而将其中一些步骤的视线延迟到子类，从而使得子类可以在不改变（复用）算法结构的情况下重新定义一些关键步骤

# 设计思想
* 稳定的部分写成非虚函数，变化的部分写成虚函数