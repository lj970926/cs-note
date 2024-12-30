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
