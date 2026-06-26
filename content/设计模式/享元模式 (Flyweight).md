>[!note]  category: 对象性能模式

# Motivation
* 一些系统在运行过程中可能产生大量的小对象（比如有些数据类型将int、float等基础数据类型抽象为对象），这些小对象可能严重提升系统的内存占用
* Flyweight通过对象池来同一管理这些对象，在系统不同地方需要相同对象时返回共享的对象。只有当用户请求的对象不存在时才创建新的对象，从而最大化程度的减少开销。
# Code Demo
```c++
class Font {
public:
	Font(std::string key): key_(key) {}
	virtual ~Font() = default;
private:
	std::string key_;	
}

class FontFactory: {
public:
	Font* GetFont(const std::string& key) {
		if (font_pool_.count(key)) {
			return font_pool_[key];
		} else {
			font_pool_[key] = new Font(key);
			return font_pool_[key];
		}
	}
private:
	std::unordered_map<std::string, Font*> font_pool_;
}
```
# 类图

![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250112121537.png)
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250112124957.png)
# 设计思想
* Flyweight的设计思想实质上就是值各种池，用于实现对象共享，减少创建的对象的数量，提升性能
# Keypoint
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250112125246.png)
