>[!note] category: 接口隔离模式


# Motivaton
* 实际情况下，使用某个类可能很难
	* 有些类型接口可能比较复杂，需要Client写大量样板代码
	* 有些类由于安全原因，难以直接访问
	* 分布式环境下其他机器上的类有时候难以访问
* Proxy模式通过建立一个继承相同接口的Proxy对象，即屏蔽了实际类的访问细节，又向用户屏蔽了二者的差异，使用户类可以像使用Real subject一样使用Proxy。
# Definition
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250118124352.png)
# Code Demo
```c++
class Subject {
public:
	virtual void process() = 0;
	virtual ~Subject() = default;
private:
};

class RealSubject: public Subject {
public:
	virtual void process() override {
		// do some task
	}
};

class SubjectProxy: public Subject {
public:
	virtual void process() override {
		// do some additional task
		real_subject_->process();
		// do_some_addtional_task
	}
private:
	Subject* real_subject_;
};

int main() {
	Subject* real_subject = new RealSubject();
    Subject* proxy = new SubjectProxy(real_subject);
    proxy->process();
}
```
# 类图
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250118124419.png)
# Key point
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250118125826.png)
* Proxy的一个鲜明特征是Proxy对象和Real subject使用的接口是一致的，从而对Client屏蔽二者的差异