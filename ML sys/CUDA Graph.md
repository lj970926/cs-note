<iframe src="https://docs.pytorch.org/docs/stable/notes/cuda.html#cuda-graphs" allow="fullscreen" allowfullscreen="" style="height:100%;width:100%; aspect-ratio: 16 / 9; "></iframe>

https://docs.pytorch.org/docs/stable/notes/cuda.html#cuda-graphs
# Highlight
1. CUDA graph每次replay对每个kernel使用相同的参数。对于指针参数而言，这意味这每次replay使用相同的tensor
2. Pytorch Caching Allocator内部对每个CUDA Graph维护了一个private memory pool，所有分配的中间显存都会加入memory pool中，待CUDA Graph销毁时一起释放，避免CUDA graph使用的显存被其他操作分走造成显存问题。
3. CUDA Graph relay过程中，只是单纯的下发kernel，不会执行任何CPU操作，如果模型正常执行中使用了一些和kernel耦合度较高的CPU操作（比如通信库中的一些buffer切换的工作），会导致精度问题
4. CUDA Graph默认也会capture与被capture stream交互的stream（即存在event_wait）。