* category: 组件协作模式
# Motivation
* 某些对象使用的算法可能比较复杂，且随输入对象的变化而改变，这种情况下如果将所有逻辑都编码到对象的方法中，将会使对象变得非常复杂，且每次有新的需求，都需要更改这部分本就十分复杂，耦合度很高的代码，破坏开闭原则
* 策略模式通过将算法与输入对象解耦，是的可以在运行时根据不同对象选择不同算法，从而有效避免上述问题
# Code demo
## native版本
```c++
enum class TexRegion {

};

class SalesOrder {

}
```
## strategy版本

# Key Point
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241231115713.png)
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241231120102.png)

* 含有许多if-else的代码通常都需要strategy，除非能确定if-else不会变化
# 类图
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241231115844.png)
