>[!note] category单一职责模式

# Motivation
在实际的业务中，一个类可能有多个可能得变化维度，同时为这些变化维度提供子类实现可能导致类的数量过度膨胀。
Bridge模式通过将这些不同的变化维度拆分成不同的基类，可以有效减少类的数量。这些不同的维度的基类通过组合的方式结合在一起，可以分别独立变化而不相互影响。用户代码可以在运行时灵活的装配出所需的功能
# Code demo
```c++
class MessagerCore {
public:
	virtual void Login() = 0;
	virtual void SendMessage() = 0;
	virtual void Connect() = 0;
	virtual void ~MessagerCore() = default;
};

class Messager {
public:
	virtual void PlaySound() = 0;
	virtual void WriteText() = 0;
	virtual void DrawShape() = 0;
	virtual void SendPicture() = 0;
	void Login() { core_->Login(); }
	void Connect() { core_->Connect(); }
	void SendMessage(){ core_->SendMessage(); }
	Messager(MessagerCore* core): core_(core) {}
private:
	virtual MessagerCore*_ core_;
};

class MessagerLite: public Messager {
public:
	virtual void PlaySound() override {
		// play sound lite.
	}
	virtual void WriteText() override {
		// wirte text lite.
	}

	virtual void DrawShape() override {
		// draw shape lite.
	}

	virtual void SendPicture() override {
		// draw shape lite.
	}
	MessagerLite(MessagerCore* core): Messager(core) {}
};

class MessagerPro: public Messager {
public:
	virtual void PlaySound() override {
		// play sound pro
	}

	virtual void WriteText() override {
		// write text pro
	}

	virtual void DrawShape() override {
		// draw shape pro
	}

	virtual void SendPicture override {
		// send picture pro
	}
	MessagerPro(MessagerCore* core): Messager(core) {}
};

class PCMessagerCore: public MessagerCore {
public:
	virtual void Login() override;
	virtual void SendMessage() override;
	virtual void Connect() override;
};

class MobileMessagerCore: public MessagerCore {
public:
	virtual void Login() override;
	virtual void SendMessage() override;
	virtual void Connect() override;
};

int main() {
	auto core = new PCMessagerCore();
	auto messager = new MessagerPro(core);
	messager->Connect();
	messager->Login();
	messager->DrawShape();	
	// balabala.....
}
```
上面的例子是一个Messager类，该类主要有以下两个主要的变化维度：
* Login、Connect等功能随PC、Mobile等平台而变化
* PlaySound、DrawShape等功能随着要给用户提供服务的等级(Lite、Pro)而变化

朴素的实现将这两部分变化封装到同一个Mesager类中：
```c++
class Messager {
public:
	virtual Login() = 0;
	virtual SendMessage() = 0;
	virtual Connect() = 0;
	virtual PlaySound() =0;
	virtual DrawShape() =0;
	virtual WriteText() = 0;
	virtual SendPicture() = 0;
};
```
这种方式会导致上述两个维度的变化需要通过继承实现，从而导致对分别有M和N种变化的两个变化方向产生M * N个子类，如PCMessagerPro、MobileMessagerLite等。
而上面的Bridge模式通过将不同的变化维度拆分到不同的基类种，可以在运行时用组合代替继承，将类的数量减少到M + N。
# 类图
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250104170031.png)

![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250104170048.png)
# Key points
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250104170329.png)
# 设计思想
* 优先使用组合而不是继承
* 分离变化点
* 单一职责