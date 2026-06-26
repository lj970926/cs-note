>[!note] category: 组件协作模式
# Motivation
* 某些对象使用的算法可能比较复杂，且随输入对象的变化而改变，这种情况下如果将所有逻辑都编码到对象的方法中，将会使对象变得非常复杂，且每次有新的需求，都需要更改这部分本就十分复杂，耦合度很高的代码，破坏开闭原则
* 策略模式通过将算法与输入对象解耦，是的可以在运行时根据不同对象选择不同算法，从而有效避免上述问题
# Code demo
不同国家的税率计算方式可能不同，SalesOrder类需要根据TaxBase种类的不同，对不同国家应用不同的算法。
## native版本
```c++
enum class TaxBase {
	CN_Tax,
	US_Tax,
	GM_Tax,
};

class SalesOrder {
private:
	TexBase tax;
public:
	 double CalculateTax() {
		 if (tax == CN_Tax) {
			 // do calc CN
		 } else if (tax == US_Tax) {
			 // do calc US
		 } else if (tax == GM_Tax) {
			 // do calc GM
		 }
	 }

};
```
上述代码的主要问题是CalculateTax中的if-else结构，不仅使代码较为复杂，且当新增国家时，该if-else结构也要对应更新，违反开闭原则。当代码中有许多类似的if-else结构时，严重影响可维护性
## strategy版本
```c++
class TaxStrategy {
public:
    virtual double CalcTax(Context context) = 0;
	virtual ~TaxStrategy() = default;
};

class CNTaxStrategy: public TaxStrategy {
public:
	virtual double CalcTax(Context context) override {
		// do calc CN
	}
};

class USTaxStrategy: public TaxStrategy {
public:
	virtual double CalcTax(Context context) override {
		// do calc US
	}
};

class GMTaxStrategy: public TaxStrategy {
public:
	virtual double CalcTax(Context context) override {
		// do calc GM
	}
};

class SalesOrder {
private:
	TaxStrategy* strategy_;
public:
	SaleOrder(StrategyFactory* factory) {
		strategy = factory->GetStrategy();
	}
	double CalculateTax() {
		Context context;
		return strategy->CalcTax(context);
	}
};
```
strategy 模式将每个国家的Tax计算抽象到单独的类中，SalesOrder中可以利用多态在运行时动态选择要执行的具体算法。这里的strategy是通过抽象工厂创建的。通过指定抽象工厂的类型，可以实现不同国家的税率计算。

这种写法大大简化了`CalculateTax`的实现，且在新增国家时只需要在TaxStrategy的基础上扩展出新的Class，无需需改这部分代码，体现了开闭原则 

# Key Point
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241231115713.png)
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241231120102.png)

* 含有许多if-else的代码通常都需要strategy，除非能确定if-else不会变化
# 类图
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241231115844.png)
