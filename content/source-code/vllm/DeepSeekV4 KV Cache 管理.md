# KVCacheSpec
在 DeepSeek V4 中，存在以下几种 KVCacheSpec：
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