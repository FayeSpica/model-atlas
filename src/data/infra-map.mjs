export const stations = [
  { id: 'hardware', name: 'GB300 计算托盘', label: 'Grace Blackwell Ultra', color: '#a6c96b', position: [0, 1.45, 6.35], description: '2 个 Grace CPU、4 个 Blackwell Ultra GPU。打开计算托盘，探索计算、显存与互联。', concepts: ['gb300','gpu','hbm','tensor-core','nvlink','pcie'] },
  { id: 'structure', name: '模型实验台', label: 'Model lab', color: '#bc89ed', position: [-4.5, 1.8, 0.1], description: '从 token 和子层运算，走进模型内部。', concepts: ['vit', 'residual', 'rmsnorm', 'swiglu', 'moe', 'mamba'] },
  { id: 'attention', name: 'Attention 工作站', label: 'Attention desk', color: '#64bfe7', position: [-1.5, 1.5, 3.6], description: 'query 如何读取信息，以及这些计算如何落到 kernel。', concepts: ['attention', 'mha', 'gqa', 'mqa', 'mla', 'cross-attention', 'causal-attention', 'rope', 'flash-attention', 'vsa'] },
  { id: 'generation', name: '媒体生成台', label: 'Media studio', color: '#e7ad66', position: [3.7, 1.8, 3.2], description: '从噪声到图像、视频和声音。', concepts: ['ddpm', 'flow-matching', 'dit', 'vae', 'cfg', 'scheduler', 'diffusion-cache'] },
  { id: 'parallel', name: '分布式交换机', label: 'Fabric', color: '#75ccae', position: [4.5, 2, -1.5], description: '切分数据、矩阵、序列和状态，再通过通信协作。', concepts: ['dp', 'tp', 'pp', 'ep', 'sp', 'ulysses', 'ring-attention', 'usp', 'pcp', 'dcp', 'fsdp', 'hsdp', 'cfg-parallel', 'vae-parallel', 'collectives'] },
  { id: 'runtime', name: '推理服务机柜', label: 'Serving rack', color: '#7e9eeb', position: [0, 4.1, -3.4], description: '请求如何排队、执行和复用状态。', concepts: ['prefill-decode', 'kv-cache', 'paged-attention', 'prefix-caching', 'continuous-batching', 'chunked-prefill', 'speculative-decoding', 'cuda-graphs', 'stage-pipeline'] },
  { id: 'memory', name: '权重与存储', label: 'Weight vault', color: '#dd86aa', position: [-4.7, 1.4, -3.4], description: '权重精度、适配器与显存之间的取舍。', concepts: ['quantization', 'lora', 'cpu-offload'] },
];
export const trails = [
  { id: 'llm', name: '一次语言模型请求', steps: ['rmsnorm','attention','swiglu','prefill-decode','kv-cache','paged-attention','continuous-batching'] },
  { id: 'media', name: '一次音视频生成', steps: ['flow-matching','dit','cfg','scheduler','vae','sp','vsa'] },
  { id: 'scale', name: '把模型放到多张卡', steps: ['quantization','tp','collectives','sp','ulysses','usp','hsdp','cpu-offload'] },
];
