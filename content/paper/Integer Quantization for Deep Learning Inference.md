> https://arxiv.org/pdf/2004.09602

# Overview
NV的一篇关于整形量化的文章，主要是对业界主流整形量化方式的介绍及其对各类模型精度的影响。
# Affine quantization vs Sacle Quantization
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407105415.png)
## Affine Quantization:
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407105514.png)
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407105531.png)
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407105718.png)

仿射变换，适用于真值区间不对称的场景。
## Scale Quantization
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407105735.png)
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407105749.png)
只有一个scale参数，适用于真值区间对称的场景
## Comparision
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407115839.png)
如上图所示，affine quantization会带来一些额外的计算，性能不及scale quantization，且不会带来明显的精度提升，因此实际使用中主要还是scale quantization。

# Quantization Granularity
关于量化粒度，主要有以下三个级别：
* per-element：最极端的情况，tensor中的每个元素对应一度scale和bias参数，本质上是给一个tensor做elementwise的仿射变换。无法利用整形计算，无性能提升，实际很少用
* per-row/column/channel：每一行/列/channel的局部量化。对于weight,可以offline预先计算，不会有性能损失。对于activation，需要有运行时的量化与反量化，理论上会影响性能
* per-tensor：每个tensor使用一组scale/bias。对于输入数据范围比较固定的场景x和w的参数都可以offline计算。
# Calibration
讲的主要是真值量化区间$[\alpha, \beta]$ 的选择，不在该区间内的要进行截断（参考上面的映射图和clip函数）。主要有三种方式：
* Max: 按输入的最大值作为区间端点。这种方式不会有截断的数据，但由于数据范围比较广可能影响正常小数据的精度，尤其在tensor有异常大值的时候
* Entropy：按KL散度（具体咋操作没说），TensorRT的默认配置。
* Percentage:按百分比（比如99.99%)。
后两种方式都会有大值的截断，但由于数据范围变小，小数据的精度会更好。
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407142326.png)

# Post Training Quantization(PTQ)

 PTQ指训练后的模型不做任何处理直接进行量化推理的模式。本文主要是对不同模型测试不同量化配置的影响。
 * 只量化weight的实验
 ![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407170230.png)
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407170351.png)
	Conv + BN融合对量化比较敏感，per-tensor下效果很差
	文章建议对weight统一使用per-channel + max calibration

* 同时量化weight和activation
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407170613.png)
	对weight进行Max calibration在部分模型效果很差（异常极大值的影响）
	比较好的是Entropy和 > 99.9%的calibration方法
# Techniques to Recover Accuracy
这一节主要是一些提升量化精度的方法
## Partial Quantization
识别模型中的敏感层，不对这些layer进行量化。
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407173913.png)

本文提出的方法是在原始的非量化模型的基础上分别对每个layer做ablation study，看量化该层对模型的精度损失，从中选择若干layers作为量化黑名单。
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407174041.png)
实验结果显示，除了BERT，其实模型都可以在拉黑极少的层数后基本追回性能回退。对于bert，作者的解释是消融实验显示每层对精度的影响很接近，所以需要大量的unquantized layers。
## Quantization-Aware Training（QAT）
主要指对训练过程进行修改以提升量化性能的方法。文章里提的方法是fake quantization，即对要进行量化层的输入添加虚假的quantization模型量化后的精度损失。
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407181755.png)
这里主要的问题是该操作是不可微的，因此需要对方向应用STE（Straight-through Estimator）策略：
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407181922.png)
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407181947.png)
即在量化区间内的值直接传递输出的梯度，区间外的值梯度置0。
实验结果显示QAT在大多数场景下能够取得性能提升
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407182114.png)
# Recommended Workflow
主要是根据上面内容总结出的量化使用best practice
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407194502.png)
关于activation为什么用per-tensor文章里似乎没有提
![image.png](https://raw.githubusercontent.com/lj970926/image-hosting/master/images/20250407194547.png)
