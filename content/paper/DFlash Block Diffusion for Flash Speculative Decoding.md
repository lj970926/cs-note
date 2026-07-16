---
title: DFlash — Block Diffusion for Flash Speculative Decoding
tags:
  - paper
  - speculative-decoding
  - dflash
  - diffusion
  - llm-inference
---

>[!note]
>原文：https://arxiv.org/pdf/2602.06036

# Introduction
Autogressive LLM 的自回归本质在长输出场景下造成了 Decode 侧的性能瓶颈。近年来出现的 Diffusion LLM在模型能力上无法与 Autogressive 方法相比，但可以 parallel decoding 提升性能。DFlash 的 Basic Idea是用快速但质量较差的 Diffusion LLM 做 drafter，能力强的Autogressive LLM做target model，实现精度无损的性能提升。

# Architecture
![[IMG-20260716111547451.png]]
主要 Contribution 在于把 Target Model的 hidden state 直接注入 Draft Model 的 KV Cache 里。
# Evaluation
## Accept length
![[IMG-20260716111748758.png]]
相较 Eagle 3 提升明显
# 代码

>[!note] 这里选择是 vllm 中 DFlash 相关的代码
## Draft Model
vllm 中的 [qwen3_dflash.py](https://github.com/vllm-project/vllm/blob/62215e72c6ff4979009c27aa95f7449213007f8f/vllm/model_executor/models/qwen3_dflash.py)
### KVCache 填充
通过 `precompute_and_store_context_kv` ，将 target model 的上下文注入 KV Cache：（在框架的[build_model_inputs_first_pass](https://github.com/vllm-project/vllm/blob/ee0da84ab9e04ac7610e28580af62c365e898389/vllm/v1/spec_decode/dflash.py#L259)过程中调用）
```python
def precompute_and_store_context_kv(
        self,
        context_states: torch.Tensor,
        context_positions: torch.Tensor,
        context_slot_mapping: torch.Tensor | None = None,
    ) -> None:
	"""Precompute K/V for context states write them into each layer's KV cache.

	Input context states are projected to K/V, normed, and have RoPE applied.
	Since the context shape is different than the query shape, we can't rely on the
	regular forward pass to apply torch.compile and CUDA graphs to this section.
	As such, this function is optimized to minimize the number of torch ops present:
	we use fused vLLM kernels for RMSNorm and RoPE, fuse the GEMM into one
	large projection, and avoid cloning buffers (with .contiguous()) where possible.

	When context_slot_mapping is None (e.g. during dummy_run) only
	the computation runs, and no K/V is written to cache.
	"""
	if not hasattr(self, "_num_attn_layers"):
		logger.warning_once(
			"DFlash buffer initialization was skipped. If dummy weights are not "
			"in use, this may indicate an error in weight loading."
		)
		self._build_fused_kv_buffers()

	num_ctx = context_states.shape[0]
	L = self._num_attn_layers
	kv = self._kv_size
	hd = self._head_dim
	nkv = self._num_kv_heads

	# --- Fused KV projection (one GEMM for all layers) ---
	normed_context_states = torch.empty_like(context_states)
	ops.rms_norm(
		normed_context_states,
		context_states,
		self._hidden_norm_weight,
		self._rms_norm_eps,
	)
	all_kv_flat = F.linear(
		normed_context_states, self._fused_kv_weight, self._fused_kv_bias
	)
	# Single contiguous copy that separates K/V and transposes to
	# layer-major layout.  Result: [2, L, num_ctx, nkv, hd] contiguous.
	# Indexing dim-0 gives contiguous [L, num_ctx, nkv, hd] for K and V.
	all_kv = (
		all_kv_flat.view(num_ctx, L, 2, nkv, hd).permute(2, 1, 0, 3, 4).contiguous()
	)
	all_k = all_kv[0]  # [L, num_ctx, nkv, hd], contiguous
	all_v = all_kv[1]  # [L, num_ctx, nkv, hd], contiguous

	# --- Per-layer RMSNorm K (3D: [num_ctx, nkv, hd] per layer) ---
	all_k_normed = torch.empty_like(all_k)
	for i in range(L):
		ops.rms_norm(
			all_k_normed[i],
			all_k[i],
			self._k_norm_weights[i],
			self._rms_norm_eps,
		)

	# --- Fused RoPE across all layers ---
	# View as [L * num_ctx, kv] so RoPE sees one big batch (no copy).
	# In-place RoPE: pass K as the "query" arg with key=None.
	all_k_flat = all_k_normed.view(L * num_ctx, kv)
	positions_repeated = context_positions.repeat(L)
	cos_sin_cache = self._rope_cos_sin_cache
	if cos_sin_cache.dtype != all_k_flat.dtype:
		cos_sin_cache = cos_sin_cache.to(dtype=all_k_flat.dtype)
	ops.rotary_embedding(
		positions_repeated,
		all_k_flat,
		None,
		self._rope_head_size,
		cos_sin_cache,
		self._rope_is_neox,
	)

	if context_slot_mapping is None:
		return

	# --- Per-layer cache insert ---
	all_k_final = all_k_flat.view(L, num_ctx, nkv, hd)
	for i in range(L):
		attn = self._attn_layers[i]
		kv_cache = attn.kv_cache
		attn.impl.do_kv_cache_update(
			attn,
			all_k_final[i],
			all_v[i],
			kv_cache,
			context_slot_mapping,
		)
```
rms_norm + linear + norm + rotary+kv_write(`do_kv_cache_update`)。 注意由于每个 layer 有单独的 qkv_proj 负责将 context hidden state 转成 KV Cache，这里先对所有 FC 的 weights 做了拼接，然后通过一次大的 FC 拿到所有Layer 的 KV Cache。
