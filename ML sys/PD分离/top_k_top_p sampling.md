# greedy sampling
选择`softmax(logits)` 中概率最大的token：
```python
out = torch.argmax(probs, dim=-1)
```
这种方式对相同的输入prompt产生相同的输出，不具有任何随机性。模型训练时通常采用这种方式，推理过程很少用。
# top_k_top_p sampling
目前各推理框架使用的主要sampling方式，这里以sglang中的`top_k_top_p_min_p_sampling_from_probs_torch` 为例:（实际情况下通常做成一个融合算子，这里是为了方便阐述流程）：
```python
def top_k_top_p_min_p_sampling_from_probs_torch(
    probs: torch.Tensor,
    top_ks: torch.Tensor,
    top_ps: torch.Tensor,
    min_ps: torch.Tensor,
    need_min_p_sampling: bool,
):
    """A top-k, top-p and min-p sampling implementation with native pytorch operations."""
    # token 按照probs从大到小排序
    probs_sort, probs_idx = probs.sort(dim=-1, descending=True)
    # 求和，为了top_p sampling
    probs_sum = torch.cumsum(probs_sort, dim=-1)
    # topk sampling，对于每行只保留前topk各token
    probs_sort[
        torch.arange(0, probs.shape[-1], device=probs.device).view(1, -1)
        >= top_ks.view(-1, 1)
    ] = 0.0
    # top_p sampling，从高到底向最终采样集合中添加token，直到sum(probs)超过top_p
    probs_sort[(probs_sum - probs_sort) > top_ps.view(-1, 1)] = 0.0

    if need_min_p_sampling:
        min_p_thresholds = probs_sort[:, 0] * min_ps
        probs_sort[probs_sort < min_p_thresholds.view(-1, 1)] = 0.0
	# 根据top_k_top_p之后的renorm概率分布，每行采样一个token作为该请求的输出token
    sampled_index = torch.multinomial(probs_sort, num_samples=1)
    # int32 range is enough to represent the token ids
    probs_idx = probs_idx.to(torch.int32)
    batch_next_token_ids = torch.gather(probs_idx, dim=1, index=sampled_index).view(-1)
    return batch_next_token_ids
```

主要包括以下几个流程：

1. 处理temperature
```python
probs /= temperature
```
temperature大时，最终得到的probs会偏小，上述top_p sampling会选择数量更多的token进入最终的采样过程，最终得到的结果也就更多样化，但也更有可能采样到概率较低的，不准确的token。temperature小时则相反
2. top_k sampling：对每行保留概率前topk个token，其余概率置0
3. top_p sampling：从高概率token开始，将token依次加入被选择的集合中，直到选择token的概率总和超过top_p，其余未选中token概率置0。这里使用的是temperature处理过的probs
4. sampling：通过`torch.multinomial` 从top_k_top_p过程得到的最终概率分布中随机采样一个token。
采用这种方式，多次运行会输出不同的token，且概率分布符合主模型的logits输出。

# Ref
https://www.ibm.com/docs/en/watsonx/saas?topic=prompts-model-parameters-prompting
https://docs.pytorch.org/docs/stable/generated/torch.multinomial.html