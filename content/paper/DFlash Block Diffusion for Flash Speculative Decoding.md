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
 模型的其他部分整体乏善可陈，就是一个很普通的 Transformer 模型(双向 Attention + Dense MLP)。
## Framework
DFlash 的核心流程在这个[dflash.py](https://github.com/vllm-project/vllm/blob/6deb05e0e4f6c298a60975f188cd044773ae6dec/vllm/v1/spec_decode/dflash.py) 中（这里只看 model_runner V1 的逻辑，V2 有另外一个 speculator）。dflash的整体流程与`SpecDecodeBaseProposer` 中的区别不是很大（详见[[vllm 源码随手记]]）。下面是几个关键的步骤
### context_hidden_state 捕获
在[gpu_model_runner.py](https://github.com/vllm-project/vllm/blob/ee0da84ab9e04ac7610e28580af62c365e898389/vllm/v1/worker/gpu_model_runner.py#L5108) 里，aux_hidden_states 作为 model forward 的结果返回，这里在 propose 之前把所有 layer 的 aux_hidden_states concat 到一起，构成`precompute_and_store_context_kv` 的context_states输入：
```python
def propose_draft_token_ids(
        self,
        scheduler_output: "SchedulerOutput",
        sampled_token_ids: torch.Tensor | list[list[int]],
        sampling_metadata: SamplingMetadata,
        hidden_states: torch.Tensor,
        sample_hidden_states: torch.Tensor,
        aux_hidden_states: list[torch.Tensor] | None,
        spec_decode_metadata: SpecDecodeMetadata | None,
        common_attn_metadata: CommonAttentionMetadata,
        slot_mappings: dict[str, torch.Tensor] | list[dict[str, torch.Tensor]] | None,
    ) -> list[list[int]] | torch.Tensor:
	    ......
	    ......
		if self.use_aux_hidden_state_outputs:
			assert aux_hidden_states is not None
			target_hidden_states = torch.cat(
				[h[:total_num_tokens] for h in aux_hidden_states], dim=-1
			)
		else:
			target_hidden_states = hidden_states[:total_num_tokens]
```
### 输入准备
DFlash重写了`SpecDecodeBaseProposer` 中用于准备输入的 [set_inputs_first_pass](https://github.com/vllm-project/vllm/blob/ee0da84ab9e04ac7610e28580af62c365e898389/vllm/v1/spec_decode/dflash.py#L95)  方法。 其中的关键是`copy_and_expand_dflash_inputs_kernel` 这个trition 算子：

```python
@triton.jit
def copy_and_expand_dflash_inputs_kernel(
    # Inputs
    next_token_ids_ptr,  # [num_reqs]
    target_positions_ptr,  # [num_context]
    # Outputs
    out_input_ids_ptr,  # [num_query_total] (output)
    out_context_positions_ptr,  # [num_context] (output)
    out_query_positions_ptr,  # [num_query_total] (output)
    out_context_slot_mapping_ptr,  # [num_context] (output)
    out_query_slot_mapping_ptr,  # [num_query_total] (output)
    out_token_indices_ptr,  # [num_reqs * num_speculative_tokens] (output)
    # Block table
    block_table_ptr,  # [max_reqs, max_blocks]
    block_table_stride,  # stride of block_table dim 0 (in elements)
    # Metadata
    query_start_loc_ptr,  # [num_reqs + 1]
    num_rejected_tokens_ptr,  # [num_reqs] or null (0) when not padded
    # Scalars
    parallel_drafting_token_id,  # tl.int32
    block_size,  # tl.int32
    num_query_per_req,  # tl.int32
    num_speculative_tokens,  # tl.int32
    total_input_tokens,  # tl.int32
    BLOCK_SIZE: tl.constexpr,
    HAS_NUM_REJECTED: tl.constexpr = False,
):
    """
    Fused kernel for DFlash first-pass input setup.

    Per request, this kernel:
      1. Copies context positions from target_positions to
         out_context_positions.
      2. Computes query positions (last_target_pos + 1 + offset) and writes
         them to out_query_positions.
      3. Writes input_ids for query tokens: [next_token, mask, mask, ...].
      4. Computes slot_mapping for context and query positions into separate
         buffers via block_table lookup.
      5. Writes token_indices_to_sample for the mask (speculative) tokens.
    """
    req_idx = tl.program_id(axis=0)
    block_idx = tl.program_id(axis=1)

    # Load context token range for this request
    ctx_start = tl.load(query_start_loc_ptr + req_idx)
    ctx_end = tl.load(query_start_loc_ptr + req_idx + 1)
    num_ctx = ctx_end - ctx_start
    total_tokens = num_ctx + num_query_per_req

    j = block_idx * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE)
    in_bounds = j < total_tokens
    is_ctx = j < num_ctx
    is_query = (~is_ctx) & in_bounds
    query_off = j - num_ctx  # offset within query portion (0-indexed)

    # --- Positions ---
    # Context: load from target_positions
    ctx_pos_idx = tl.minimum(ctx_start + j, total_input_tokens - 1)
    ctx_pos = tl.load(target_positions_ptr + ctx_pos_idx, mask=is_ctx, other=0)

    # Query: last_valid_pos + 1 + query_off
    # In padded mode, ctx_end includes rejected tokens; use valid_ctx_end
    # to find the last accepted context position.
    if HAS_NUM_REJECTED:
        num_rejected = tl.load(num_rejected_tokens_ptr + req_idx)
        valid_ctx_end = ctx_end - num_rejected
    else:
        valid_ctx_end = ctx_end
    last_pos = tl.load(target_positions_ptr + valid_ctx_end - 1)
    query_pos = last_pos + 1 + query_off

    positions = tl.where(is_ctx, ctx_pos, query_pos)

    # Context and query positions go to separate buffers.
    ctx_pos_out = ctx_start + j
    tl.store(out_context_positions_ptr + ctx_pos_out, ctx_pos, mask=is_ctx)
    query_out = req_idx * num_query_per_req + query_off
    tl.store(out_query_positions_ptr + query_out, query_pos, mask=is_query)

    # --- Slot mapping (block_table lookup for all positions) ---
    block_num = positions // block_size
    # # Clamp block_number to avoid OOB when position is at max
    block_num = tl.minimum(block_num, block_table_stride - 1)
    block_id = tl.load(
        block_table_ptr + req_idx * block_table_stride + block_num,
        mask=in_bounds,
        other=0,
    ).to(tl.int64)
    slot = block_id * block_size + (positions % block_size)
    tl.store(out_context_slot_mapping_ptr + ctx_pos_out, slot, mask=is_ctx)
    tl.store(out_query_slot_mapping_ptr + query_out, slot, mask=is_query)

    # --- Input IDs (query tokens only) ---
    bonus_token = tl.load(next_token_ids_ptr + req_idx)
    is_bonus = is_query & (query_off == 0)
    input_id = tl.where(is_bonus, bonus_token, parallel_drafting_token_id)
    tl.store(out_input_ids_ptr + query_out, input_id, mask=is_query)

    # --- Token indices to sample (mask tokens, skip the bonus token) ---
    is_sample = is_query & (query_off > 0)
    sample_out_idx = req_idx * num_speculative_tokens + (query_off - 1)
    tl.store(
        out_token_indices_ptr + sample_out_idx,
        query_out,
        mask=is_sample,
    )
```

比较复杂的一个函数。整体上讲做了下面几件事情：
1. 准备该 step 的 context_slot_mapping(context_state 的KV写入位置) 和query_slot_mapping（其他 query token 的 KV写入位置）
2. context_positions和 query_position计算
3. input_id 准备：bonus_token 直接拷贝，mask token 初始化为`parallel_drafting_token_id` (在配置里声明，Embedding 在训练时需要对这个 token_id 做特殊处理)。
4. sample_token_idx 的计算：主要是bonus token 不采样，需要跳过。