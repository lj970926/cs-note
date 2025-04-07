> https://arxiv.org/pdf/2004.09602

# Overview
NV的一篇关于整形量化的文章，主要是对业界主流整形量化方式的介绍及其对各类模型精度的影响。
# Affine quantization vs Sacle Quantization
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407105415.png)
## Affine Quantization:
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407105514.png)
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407105531.png)
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407105718.png)

仿射变换，适用于真值区间不对称的场景
## Scale Quantization
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407105735.png)
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407105749.png)
只有一个scale参数，适用于真值区间对称的场景
# Quantization Granularity
关于量化粒度，主要有以下三个级别：
* per-element：最极端的情况，tensor中的每个元素对应一度scale和bias参数，本质上是给一个tensor做elementwise的仿射变换。无法利用整形计算，无性能提升，实际很少用
* per-row/column/channel：每一行/列/channel的局部量化。对于weight,可以offline预先计算，不会有性能损失。对于activation，需要有运行时的量化与反量化，理论上会影响性能
* per-tensor：每个tensor使用一组scale/bias
