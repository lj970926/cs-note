>[!note] category：单一职责模式
# Motivation
在某些情况下可能过度使用继承拓展类的功能，从而导致子类数量的急剧膨胀，比如下面这个`Stream`的例子，FileStream、NetworkStream、MemoryStream分别继承Stream的抽象，并提供内存流、网络流、文件流的实现。
现在需要给上述三个Stream是提供加密和Buffer缓冲的功能。一个可能的做法是直接在上面三个Stream上扩展出`CryptoFileStream`、`CryptoNetworkStream` 等类，如下图所示：
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250102223050.png)
然而，这种做法的会导致类数量的急剧膨胀，假设要给N个类提供M个不同方面的功能，则共会有M \* N 个类被创建出来。这还是没考虑M个功能的相互组合（这种情况下可能是阶乘级别的增长）。
Decorator模式使用组合而不是继承来实现上面的需求。在Decorator模式中，单独实现`CryptoStream` 等类实现加密等功能，这些不同方面的功能类将会持有Stream类型的指针，并在这些Stream成员的Read、Write基础上实现所需的功能，通过在运行时构造传入不同的底层Stream类型，可以实现不同基础Stream的加密功能。通过这种方式，需要实现的类的数量由M \* N 减少为M + N，如下图所示。
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250104012349.png)
同时，由于这些类都要持有Stream类型的指针，从Stream上又抽象出了一个单独的Decorator接口完成Stream指针的管理。
# Code Demo
```c++
class Stream {
public:
	virtual void Read() = 0;
	virtual void Write() = 0;
	virtual void Seek() = 0;
	virtual ~Stream() = default;
}

class FileStream: public Stream {
public:
	virtual void Read() override;
	virtual void Write() override;
	virtual void Seed() override;
}

class MemoryStream: public Stream {
public:
	virtual void Read() override;
	virtual void Write() override;
	virtual void Seed() override;
}

class NetworkStream: public Stream {
public:
	virtual void Read() override;
	virtual void Write() override;
	virtual void Seed() override;
}

class DecoratorStream: public {
public:
	virtual void Read() = 0;
	virtual void Write() = 0;
	virtual void Seek() = 0;
	DecoratorStream(Stream* stream): stream_(stream) {}
private
	Stream* stream;
}

// 装饰器本身也是一种Stream，可以实现与其他Stream的等价替换
class CryptoStream: public DecoratorStream {
public:
	virtual void Read() override {
		stream->Read();
		// do crypto
	}
	virtual void Write() override;
	virtual void Seed() override;
	CryptoStream(stream): DecoratorStream(stream) {}
}

class BufferStream: public DecoratorStream {
public:
	virtual void Read() override {
		stream->Read();
		// do buffer
	}
	virtual void Write() override;
	virtual void Seed() override;
	BufferoStream(stream): DecoratorStream(stream) {}
}

int main() {
Stream* base_stream = new FileStream();
// 通过运行时装配实现CryptoFileStream等价的功能
Stream* stream = new CryptoStream(base_stream);
}
```
# 类图
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250104005414.png)
# 设计原则
* 优先使用组合而非继承
* 针对接口而非实现编程：Decorator类在抽象的Stream接口上进行操作，而非继承模式下以来具体的父类。
# Key point
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250104005558.png)
* Decorator模式的一个突出的特征是Decorator既继承自接口又通过组合的方式使用另一个接口的实现类。