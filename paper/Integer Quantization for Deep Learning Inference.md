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