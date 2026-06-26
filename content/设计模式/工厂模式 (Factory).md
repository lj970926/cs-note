>[!note] category: 对象创建模式

# 简单工厂模式
最朴素的想法，提供一个函数根据用户传入的参数创建对象。所创建的对象有公共的基类
```c++
std::shared_ptr<Product> GetProdect(std::string arg) {
	if (arg == "1") {
		return std::make_shared<ConcreateProduct1>();
	} else if (arg == "2") {
		return std::make_shared<ConcreateProduct2>();
	} else {
		throw("Unknown args");
	}
}
```
# 工厂方法模式
简单工厂模式对每个新的子类都需要一个新的分支，违反了开闭原则。工厂方法模式通过把工厂类也层次化，对每中产品子类都提供一个工厂子类负责创建对应子类。这样当添加新的产品子类时只需要扩展出一个新的工厂子类即可，无需改动现有逻辑。
```c++
class Product {
}

class ConcreteProduct1: public Product {

}

class ConcreateProduct2: public Product {

}

class Factory {
	virtual Product* getProduct() = 0;
}

class ConcreteFactory1: public Factory {
	virtual Product* getProduct() {
		return new ConcreteProduct1();
	}
}

class ConcreteFactory2: public Factory {
	virtual Product* getProduct() {
		return new ConcreteProduct2();
	}
}
```
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250104231128.png)

# 抽象工厂模式
主要用于解决由于系统中概念交织导致工厂数量指数级膨胀的问题。
众所周知，国内知名的电器厂有海尔、海信(姑且就认为是2个)，电器厂会生产电视机、电冰箱、空调(姑且就认为是3种产品)。

- 使用工厂方法模式：工厂方法模式中每个工厂只生产一类产品，那么就必须要有`海尔电视机厂`、`海尔电冰箱厂`、`海尔空调厂`、`海信电视机厂`、`海信电冰箱厂`、`海信空调厂`
- 使用抽象工厂模式：抽象工厂中每个工厂生产由多种产品组成的"产品族"，那么就只需要有`海尔工厂`、`海信工厂`就够了，每个工厂可生产自家的电视机、电冰箱、空调。

由此看出使用`抽象工厂模式`极大地减少了系统中类的个数。
```java
public abstract class AbstractFactory {

    public abstract AbstractProductA createProductA();

    public abstract AbstractProductB createProductB();

    public abstract AbstractProductC createProductC();
}

public class ConcreteFactory1 extends AbstractFactory {
    @Override
    public AbstractProductA createProductA() {
        return new ConcreteProductA1();
    }

    @Override
    public AbstractProductB createProductB() {
        return new ConcreteProductB1();
    }

    @Override
    public AbstractProductC createProductC() {
        return new ConcreteProductC1();
    }
}
```
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250104234121.png)

# 设计思想
* 开闭原则：工厂方法模式新类型的支持可以通过拓展实现，无需像简单工厂一样修改if-else
* 依赖倒置：用户代码依赖抽象的Factory接口，而不是具体的类
* 封装变化点