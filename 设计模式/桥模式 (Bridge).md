>[!note] category单一职责模式

# Motivation
在实际的业务中，一个类可能有多个可能得变化维度，同时为这些变化维度提供子类实现可能导致类的数量过度膨胀。
Bridge模式通过将这些不同的变化维度拆分成不同的基类，可以有效减少类的数量。这些不同的维度的基类通过组合的方式结合在一起，可以分别独立变化而不相互影响。用户代码可以在运行时灵活的装配出所需的功能

![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250104170031.png)

![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250104170048.png)
# Key points
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250104170329.png)
