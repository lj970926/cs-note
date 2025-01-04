>[!note] category：对象创建模式

# Motivation
与Factory比较类似，但主要针对的时要创建的对象比较复杂的场景(即创建对象的接口比较复杂）。让用户代码直接使用某个已经创建好的对象拷贝出所需的对象。
# Code demo
```C++
class Object {
public:
	virtual void DoProgress() = 0;
	virtual ~Object() = default;
	virtual Object* clone() = 0;
}

class ConcreteObject1: public Object {
public:
	virtual void DoProgress override;
	virtual Object* clone() {
		return new ConcreteObject1();
	}
}

class ConcreateOjbect2: public Object {
public:
	virtual void DoProgress override;
	virtual Object* clone() {
		return new ConcreteObject2();
	}
}

class Client {
public:
	void Process() {
		Object* obj = prototype_->clone();
		obj->DoProgress();
	}
	Client(Object* proto): prototype_(proto) {}
private:
	Object* prototype_;
}
```
与Facory类似，但将去掉了Factory，在Object里加了个clone方法，调用拷贝构造函数初始化一个新的对象
# Keypoint
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250104235951.png)
# 类图
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250105000226.png)
# Summary
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250105000559.png)
