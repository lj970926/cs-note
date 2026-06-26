>[!note] category: 接口隔离模式
# Motivation
* 一个子系统内部类之间的耦合关系可能非常复杂，如果让用户直接依赖这个子系统中的各个类，难免会收到这些紧耦合关系的影响。
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250118122923.png)
设计一个专门用作接口的Facade对象，屏蔽内部的复杂耦合关系
# Code demo
Facade模式的代码结构没有固定的代码格式，本质上时设计原则和思想的一种表达。
# Definition
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250118123138.png)
# 类图
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250118123306.png)
Key point
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250118123447.png)
* 分隔变化点：内部子系统的变化不会影响Facade提供接口的稳定性
* 接口隔离原则