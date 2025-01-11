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
	void Construct() {
		buider_->BuildPart1();
		for (int i = 0; i < 4; ++i)	{
			builder_->BuildPart2();
		}
		builder_->BuildPart3();
	}
private:
	HouseBuilder* builder_;
}

int main() {

}
```


# Definition
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250112004734.png)

# 类图
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250112005000.png)
