# 2.1 Complexity Defined
* ### 软件复杂度公式
	$C = \sum_{p}{c_{p}t_{p}}$
	
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241212153540.png)
# 4.6 Classitis
以Java为代表的许多编程语言倡导class should be small，然而这会导致软件复杂度大幅增加，原因在于其破坏了本文深模块的原则，过度封装的class实际上并未带来很大的信息隐藏，反而增加了彼此之前的依赖和用户的使用难度。作者将这种现象称为classitis.

![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241213102421.png)

上面的Jave IO例子可以很好的概况这一点。为了顺序读取文件数据，用户需要创建三个Class，且每个class要依赖上一个class并在其基础上扩展功能。相较之下，Unix的文件IO接口只需要open打开一个文件描述符即可read/write数据。

接口设计需要让普遍性的使用场景尽可能简单
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241213104018.png)

# 5.1 Information hiding

![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241213113403.png)
# 5.2 Information leaking
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241216001727.png)
# 5.3 Temporal decomposition
指把按时间顺序发生的多个相关事件拆分到多个不同类中去，从而导致information leakage。例如，对于读-修改-写文件这一事件序列，拆分成三个不同的类来做，就引入了类之间对于文件格式等信息的依赖，导致information leakage.

解决办法是不要把文件的读写拆成多个类，所有文件操作共同抽象成一个大类（类似4.6节的classitis)

![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20241216122032.png)
当设计模块时，从功能和knowledge来划分而非时间上的先后。