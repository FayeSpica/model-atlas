export default [
  {
    "id": "gb300",
    "name": "GB300 · Grace Blackwell Ultra",
    "intro": "将 Grace CPU 与 Blackwell Ultra GPU 组成计算模块。",
    "formula": "GB300 superchip: 1 Grace CPU + 2 Blackwell Ultra GPUs; compute tray: 2 CPU + 4 GPU",
    "body": "这里按 NVIDIA GB300 NVL72 参考架构解释：一个计算托盘包含两个 GB300 superchips，即 2 个 Grace CPU 与 4 个 Blackwell Ultra GPU；整机架组合多个计算托盘与 NVLink switch trays。场景只展示单托盘的教学布局，不代表 PCB、液冷管路或连接器的精确工程模型。",
    "question": "GB300 NVL72 是否指一块有 72 个 GPU 的显卡？",
    "answer": "不是。NVL72 是机架级系统，包含 72 个 Blackwell Ultra GPU 和 36 个 Grace CPU。",
    "related": [
      "gpu",
      "hbm",
      "nvlink",
      "tensor-core"
    ],
    "sources": [
      [
        "NVIDIA 官方资料",
        "https://docs.nvidia.com/enterprise-reference-architectures/nvl72-ai-factory/latest/components.html"
      ]
    ]
  },
  {
    "id": "gpu",
    "name": "GPU execution · GPU 执行",
    "intro": "大量线程协作执行矩阵、向量与内存访问。",
    "formula": "model operators → kernels → thread blocks → SM execution",
    "body": "GPU 不只是一个算力数字。kernel 将工作分成线程块与线程，在 SM 上执行；计算吞吐、内存带宽、同步、形状和调度都可能成为瓶颈。CUDA Graphs 减少 launch 开销，FlashAttention 改善 IO，不意味着它们提高了所有算子的峰值算力。",
    "question": "GPU 利用率高就说明所有时间都在做有效矩阵乘法吗？",
    "answer": "不能据此判断，需要结合 kernel、带宽与时间线分析。",
    "related": [
      "tensor-core",
      "hbm",
      "cuda-graphs",
      "flash-attention"
    ],
    "sources": [
      [
        "NVIDIA 官方资料",
        "https://docs.nvidia.com/cuda/cuda-c-programming-guide/"
      ]
    ]
  },
  {
    "id": "hbm",
    "name": "HBM · 高带宽显存",
    "intro": "靠近 GPU 的高带宽存储，容纳权重、激活与状态。",
    "formula": "device memory ≈ weights + activations + KV / recurrent state + workspaces",
    "body": "HBM 的容量影响能放下多少数据，带宽影响数据送入计算单元的速率；容量与带宽不是同一个指标。HBM 不等于片上 SRAM 或 L2，KV cache 也不是一种专用物理显存。量化、分片与 offload 分别改变表示、设备分布与存放层级。",
    "question": "HBM 翻倍是否让所有推理吞吐翻倍？",
    "answer": "不会。吞吐还取决于带宽、计算、通信与工作负载。",
    "related": [
      "kv-cache",
      "quantization",
      "cpu-offload",
      "gpu"
    ],
    "sources": [
      [
        "NVIDIA 官方资料",
        "https://developer.nvidia.com/blog/inside-nvidia-blackwell-ultra-the-chip-powering-the-ai-factory-era"
      ]
    ]
  },
  {
    "id": "tensor-core",
    "name": "Tensor Core",
    "intro": "针对支持精度和布局执行矩阵乘加的硬件单元。",
    "formula": "D = A × B + C",
    "body": "Tensor Core 不等同整个 GPU。使用哪一种矩阵指令，取决于硬件代际、输入与累加精度、布局和 kernel。权重文件标注 FP4，并不保证任意设备或算子都能走对应 Tensor Core 快速路径。",
    "question": "所有 CUDA 算子都会使用 Tensor Core 吗？",
    "answer": "不是。许多逐元素运算、索引和数据移动使用其他执行路径。",
    "related": [
      "gpu",
      "quantization"
    ],
    "sources": [
      [
        "NVIDIA 官方资料",
        "https://developer.nvidia.com/blog/inside-nvidia-blackwell-ultra-the-chip-powering-the-ai-factory-era"
      ]
    ]
  },
  {
    "id": "nvlink",
    "name": "NVLink / NVSwitch",
    "intro": "在 GPU 等设备间提供高速互联与交换。",
    "formula": "device links → NVLink switch fabric → multi-GPU communication",
    "body": "NVLink 是互联技术，NVSwitch 用于交换连接；collective 仍需软件算法与实现来组织。GB300 的 CPU–GPU NVLink-C2C 与 GPU scale-up fabric 也要区分。多卡互联不代表所有 GPU 显存对任何程序都自动表现为一块可无代价访问的内存。",
    "question": "用了 NVLink，TP 的 all-reduce 就没有开销了吗？",
    "answer": "仍有传输、同步与算法开销，只是通信链路与拓扑发生变化。",
    "related": [
      "collectives",
      "tp",
      "usp",
      "gb300"
    ],
    "sources": [
      [
        "NVIDIA 官方资料",
        "https://docs.nvidia.com/enterprise-reference-architectures/nvl72-ai-factory/latest/components.html"
      ]
    ]
  },
  {
    "id": "pcie",
    "name": "PCIe · 主机与设备互联",
    "intro": "连接主机、加速器与外设的通用总线技术。",
    "formula": "host / device transfers → interconnect → destination memory",
    "body": "具体机器中的 CPU、GPU、NIC 与存储连接取决于拓扑。CPU offload 的传输成本要按实际链路判断；不能把 PCIe、NVLink-C2C、GPU NVLink 与跨节点网络的带宽混为一谈。",
    "question": "CPU offload 总能被异步传输完全隐藏吗？",
    "answer": "不能，要看计算与传输比例、链路和预取执行。",
    "related": [
      "cpu-offload",
      "nvlink",
      "collectives"
    ],
    "sources": [
      [
        "NVIDIA 官方资料",
        "https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/"
      ]
    ]
  }
];
