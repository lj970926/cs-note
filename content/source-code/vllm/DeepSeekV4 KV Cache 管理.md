---
title: DeepSeekV4 KV Cache 管理
date: 2026-07-22
tags:
  - vllm
  - deepseek-v4
  - kv-cache
  - mla
  - source-reading
---

# KVCacheSpec

在 [[MLSys/Models/Deepseek V4|DeepSeek V4]] 中，存在以下几种 KVCacheSpec：
1. `DeepseekV4MLAAttention`
```python
def get_kv_cache_spec(self, vllm_config: VllmConfig) -> KVCacheSpec | None:
	if (
		self.compress_ratio <= 1
	):  # SWA part. Allocated separately as DeepseekV4SWACache.
		return None
	return MLAAttentionSpec(
		block_size=vllm_config.cache_config.block_size,
		num_kv_heads=1,
		head_size=self.head_dim,
		dtype=torch.uint8,
		compress_ratio=self.compress_ratio,
		cache_dtype_str=self.kv_cache_dtype,
		alignment=576,  # NOTE: FlashMLA requires 576B alignment
		model_version="deepseek_v4",
```
压缩后的 KV Cache，没有滑窗
2. `DeepSeekV4SWACache` 
```python
def get_kv_cache_spec(self, vllm_config: VllmConfig) -> KVCacheSpec:
	return SlidingWindowMLASpec(
		block_size=self.block_size,
		num_kv_heads=1,
		head_size=self.head_dim,
		dtype=self.dtype,
		sliding_window=self.window_size,
		cache_dtype_str=self.cache_config.cache_dtype,
		alignment=576,  # NOTE: FlashMLA requires 576B alignment
		model_version="deepseek_v4",
	)
```
未压缩的 KV Cache，有滑窗
3. `DeepseekV4IndexerCache`
```python
def get_kv_cache_spec(self, vllm_config: VllmConfig) -> KVCacheSpec:
	# head_dim already carries the fp8 scale padding
	# compress_ratio=1 for V3.2, >1 for DeepseekV4; both use the same cache layout.
	return MLAAttentionSpec(
		block_size=self.cache_config.block_size,
		num_kv_heads=1,
		head_size=self.head_dim,
		dtype=self.dtype,
		compress_ratio=self.compress_ratio,
		# DeepseekV4 aligns indexer pages to FlashMLA's 576B so they can pack with
		# the indexer's compressor state cache. V3.2 keeps the legacy layout.
		alignment=576,
	)
```
Indexer 的 Score Cache，没有滑窗
4. `CompressorStateCache`
```python
def get_kv_cache_spec(self, vllm_config: VllmConfig) -> KVCacheSpec:
	return SlidingWindowMLASpec(  # only has one vector instead of K + V
		block_size=self.block_size,
		num_kv_heads=1,
		head_size=self.state_dim,
		dtype=self.dtype,
		sliding_window=self.sliding_window,
		alignment=576,  # NOTE: FlashMLA requires 576B alignment
	)
```
Compressor 压缩 KV Cache时使用的 Score，有滑窗
# group_and_unify_kv_cache_specs
get_kv_cache_configs 中用来将上面这些 `KVCacheSpec` 分组并合并为同一的`UniformTypeKVCacheSpecs` 的函数
```python
def group_and_unify_kv_cache_specs(
    kv_cache_spec: dict[str, KVCacheSpec],
) -> list[UniformTypeKVCacheSpecs] | None:
    """
    Group the KV cache specs and unify each group into one UniformTypeKVCacheSpecs.
    Currently, this is only used for DeepseekV4.
    """
    if not any(
        isinstance(spec, SlidingWindowMLASpec) for spec in kv_cache_spec.values()
    ):
        return None

    mla_specs: dict[str, KVCacheSpec] = {}
    grouped_swa_mla_specs: dict[tuple[int, int], dict[str, KVCacheSpec]] = defaultdict(
        dict
    )
    # NOTE: Here we group SWA layers by (block_size, sliding_window), which separates
    # SWA layers, C4I+C4A layers, and C128A layers into three different groups. It can
    # be fragile with only block_size and sliding_window as keys, but fine for now.
    for name, spec in kv_cache_spec.items():
        if isinstance(spec, SlidingWindowMLASpec):
            grouped_swa_mla_specs[(spec.block_size, spec.sliding_window)][name] = spec
        elif isinstance(spec, MLAAttentionSpec):
            mla_specs[name] = spec

    assert len(mla_specs) > 0
    mla_uniform_spec = UniformTypeKVCacheSpecs.from_specs(mla_specs)
    assert mla_uniform_spec is not None

    swa_uniform_specs: list[UniformTypeKVCacheSpecs] = []
    for spec_dict in grouped_swa_mla_specs.values():
        uniform_spec = UniformTypeKVCacheSpecs.from_specs(spec_dict)
        assert uniform_spec is not None
        swa_uniform_specs.append(uniform_spec)

    return [mla_uniform_spec, *swa_uniform_specs]
```

整体逻辑比较简单，所有 `MLAAttentionSpec`  分成一组（block_size 相同），所有带滑窗的 Spec（`SlidingWindowMLASpec`)，按照(block_size, window_size)分组。这样其实整个模型会有 4 个 KVCache Group，MLA + C4A + C128A + SWA。

## 相关笔记

- [[source-code/vllm/vllm 源码随手记]]：vLLM KV Cache 整体架构与 Block 管理
- [[source-code/vllm/vLLM DP 协调、CUDA Graph 与 DeepEP Low Latency]]：vLLM 中 DeepSeek V4 相关的 DP/CUDA Graph 协同