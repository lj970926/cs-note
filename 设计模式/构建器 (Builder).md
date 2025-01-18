>[!note] category: 对象创建模式


# Motivation
* 某些类(通常是继承自同一个接口的多个子类)的创建过程可能很复杂，在这个复杂的过程中，流程是稳定的，但每个步骤所执行的内容随子类的不同而具有很大的差异
* Builder模式通过将对象构建的过程抽象出Director(稳定的流程)和Builder(步骤的实现)，来简化类的实现，并且将变化的步骤和不变的流程分离，提高代码服用

# Code Demo
```c++
class House {
public:
	virtual Method() = 0;
	virtual ~House() = default;
};

class StoneHouse: public House {
public:
	virtual Method() override {
		
	}
}

class HouseBuilder {
public:
	virtual void BuildPart1() = 0;
	virtual void BuildPart2() = 0;
	virtual void BuildPart3() = 0;
	House* GetResult() {
		return house_;
	}
protected:
	House* house_;
};

class StoneHouseBuilder: public HouseBuilder {
public:
	virtual BuildPart1() override {

	}	

	virtual BuildPart2() override {
	
	}

	virtual BuildPart3() override {

	}
}

class HouseDirector {
public:
	House* Construct() {
		buider_->BuildPart1();
		for (int i = 0; i < 4; ++i)	{
			builder_->BuildPart2();
		}
		builder_->BuildPart3();
		return builder_->GetResult();
	}
private:
	HouseBuilder* builder_;
}

int main() {
	HouseBuilder*builder = new StoneHouseBuilder()
	HouseDirector director(builder);
	House* house = director.Construct();
	house->MethodA();
}
```


# Definition
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250112004734.png)

# 类图
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250112005000.png)
# 设计思想
* 单一职责：将对象的创建和对象本身的职责分离
* 分隔变化点：将易变的各个子步骤实现和稳定的构建流程分离，从而可以在子步骤变化时无需修改Director
* 开闭原则：新的Product只需要在Builder接口的基础上扩展出新的类，而无需修改director的内部实现
# 总结
* Builder模式在设计思想上与Template Method非常接近，将对象创建的通用模版抽象到Director中。不同的是Director时通过组合Builder而不是让子类继承并实现虚方法来提供构建对象所需的各个子步骤的实现
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250112114620.png)
