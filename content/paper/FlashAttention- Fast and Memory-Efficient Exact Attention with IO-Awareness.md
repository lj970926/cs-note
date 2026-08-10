>[!note] https://arxiv.org/pdf/2205.14135

# Overview
Flash Attention 初版论文，最主要的 contribution 是借助 online softmax，无需维护完整的$QK^{T}$ 矩阵，从而节省了显存和 SRAM->HBM 的拷贝开销，后者是传统 Attention 实现的主要瓶颈。
* 传统的 Attention 算法：大量的 HBM <-> SRAM 拷贝
![[IMG-20260809222135052.png]]
* FA 流程图
![[IMG-20260809221738286.png]]

主要的计算过程如上图所示，外层循环加载$K$ 和$V$ 的分块，内层循环加载$Q$ 的分块，计算局部的 Attention 结果后，写回 HBM。这里通过 online softmax 机制，每行记录当前的attn score 最大值,当算出更大的值时，动态更新局部结果。
# Online Softmax
核心是利用$e^a \times e^b = e^{a+b}$  
![[IMG-20260809230709476.png]]
![[IMG-20260809230652906.png]]
# 完整算法
![[IMG-20260809230514590.png]]