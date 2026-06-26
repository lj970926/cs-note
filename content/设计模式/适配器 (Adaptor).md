>[!note] catetory: 接口隔离模式
# Motivation
* 老接口放到新的使用环境中使用
# Code Demo
```c++
// 新接口
class Target {
public:
	virtual void Process() = 0;
	virtual ~Target{} = default;
};
class Adapter: public Target {
public:
	virtual void Process() override {
		// do some task
		adaptee_->OldProcess1();
        apaptee_->OldProcess2();
	}
private:
	Adaptee* adaptee_;
};
// 老接口
class Adaptee {
public:
	virtual void OldProcess1() = 0;
	virtual void OldProcess2() = 0;
	virtual ~Adaptee() = default;
}

class ConcreateAdaptee;

int main() {
	Adaptee* adaptee = new ConcreteAdaptee();
	Target* adapter = new Adapter(adaptee);
	adapter->Process();
}
```
# Definition
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250118130809.png)
# 类图
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250118130857.png)
