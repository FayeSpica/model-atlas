export default [
  {
    "id": "structure",
    "name": "模型组件",
    "intro": "输入表示、归一化与子层运算",
    "concepts": [
      "vit",
      "residual",
      "rmsnorm",
      "swiglu",
      "moe",
      "mamba"
    ]
  },
  {
    "id": "attention",
    "name": "Attention 与位置编码",
    "intro": "头部共享、可见范围与执行算法",
    "concepts": [
      "attention",
      "mha",
      "gqa",
      "mqa",
      "mla",
      "cross-attention",
      "causal-attention",
      "rope",
      "flash-attention",
      "vsa"
    ]
  },
  {
    "id": "generation",
    "name": "扩散与媒体生成",
    "intro": "训练目标、求解、引导与编解码",
    "concepts": [
      "ddpm",
      "flow-matching",
      "dit",
      "vae",
      "cfg",
      "scheduler",
      "diffusion-cache"
    ]
  },
  {
    "id": "parallel",
    "name": "并行与通信",
    "intro": "切分哪些维度，以及如何交换数据",
    "concepts": [
      "dp",
      "tp",
      "pp",
      "ep",
      "sp",
      "ulysses",
      "ring-attention",
      "usp",
      "pcp",
      "dcp",
      "fsdp",
      "hsdp",
      "cfg-parallel",
      "vae-parallel",
      "collectives"
    ]
  },
  {
    "id": "runtime",
    "name": "推理调度与缓存",
    "intro": "请求执行、状态复用与多阶段编排",
    "concepts": [
      "prefill-decode",
      "kv-cache",
      "paged-attention",
      "prefix-caching",
      "continuous-batching",
      "chunked-prefill",
      "speculative-decoding",
      "cuda-graphs",
      "stage-pipeline"
    ]
  },
  {
    "id": "memory",
    "name": "精度、适配与显存",
    "intro": "表示精度、权重增量与设备存放",
    "concepts": [
      "quantization",
      "lora",
      "cpu-offload"
    ]
  },
  {
    "id": "hardware",
    "name": "计算硬件与互联",
    "intro": "计算模块、显存与设备通信链路",
    "concepts": [
      "gb300",
      "gpu",
      "hbm",
      "tensor-core",
      "nvlink",
      "pcie"
    ]
  }
];
