export default [
  {
    "id": "sp",
    "name": "Sequence Parallelism · SP",
    "intro": "沿序列轴分配 token 激活；具体通信方式取决于实现。",
    "formula": "X: [B,S,D] → rank r: [B,S/P,D]",
    "body": "SP 是一个有多种用法的术语。Megatron 的 SP 常指配合 TP 分摊 LayerNorm、Dropout 等区域的激活；视频扩散框架中的 SP 通常还涵盖跨设备执行 attention。不能只凭 SP 缩写判断通信或权重布局。",
    "sections": [
      [
        "vLLM-Omni 中的 SP",
        "此版本提供 Ulysses、Ring 与 AllGather 等组合路径，配置要求 sequence_parallel_size=ulysses_degree×ring_degree×allgather_degree。论文 USP 常指 Ulysses×Ring 的二维组合，不能将它与当前框架全部 SP 配置直接画等号。"
      ],
      [
        "切序列不等于独立计算",
        "本地 token 若需要读取远端 K/V，必须交换信息。只将序列切开并各自运行本地 attention 会改变模型的可见范围。"
      ],
      [
        "一个示例",
        "B=1、S=4096、D=1024、P=4 时，均匀切分后的激活为 [1,1024,1024]。是否需要 padding、哪些条件 token 复制或切分，要查看模型 hooks。"
      ]
    ],
    "question": "SP=4 是否代表四份完整独立请求？",
    "answer": "不是。SP 的多个 rank 通常共同处理同一请求的不同序列分片；DP 才把不同数据或请求分给不同副本。",
    "related": [
      "usp",
      "ulysses",
      "tp",
      "dp"
    ],
    "papers": [
      [
        "Megatron SP 参考：Reducing Activation Recomputation in Large Transformer Models",
        "https://arxiv.org/abs/2205.05198"
      ]
    ],
    "sources": [
      [
        "Omni SP 配置",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/diffusion/data.py"
      ],
      [
        "序列切分 hooks",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/diffusion/hooks/sequence_parallel.py"
      ]
    ]
  },
  {
    "id": "dp",
    "name": "Data Parallelism · DP",
    "intro": "多个模型副本处理不同数据或请求。",
    "formula": "batch = batch₀ ∪ … ∪ batchP−1; replica r processes batchᵣ",
    "body": "训练中的普通 DP 在每个副本保存模型，处理不同样本后同步梯度；推理中的 DP 主要将请求分发到独立服务副本，无需训练梯度同步。一个副本也可以由多个 TP rank 组成。",
    "sections": [
      [
        "与 TP 的区别",
        "DP 增加副本数量，TP 切分同一层的计算。示例：DP=2、每副本 TP=4，在没有其他并行轴的部署中共需 8 个 rank。"
      ],
      [
        "副本不一定是单 GPU",
        "模型副本可以跨多个设备。MoE 场景还可能把专家并行与 DP 组合，不能仅凭 DP 推断所有参数的复制方式。"
      ]
    ],
    "question": "推理 DP=2 是否自动把单个请求的权重切成两半？",
    "answer": "不会。DP 让副本处理不同请求，权重切分需 TP、FSDP/HSDP 等另外的机制。",
    "related": [
      "tp",
      "fsdp",
      "hsdp"
    ],
    "papers": [],
    "sources": [
      [
        "vLLM 并行与扩展",
        "https://docs.vllm.ai/en/latest/serving/parallelism_scaling/"
      ]
    ]
  },
  {
    "id": "dcp",
    "name": "Decode Context Parallelism · DCP",
    "intro": "沿上下文轴分摊 decode KV cache 与相应 attention 计算。",
    "formula": "context KV = KV₀ ∪ … ∪ KVP−1; attention = normalized merge(local results)",
    "body": "decode 时当前 query 需要读取已有上下文。DCP 把上下文 KV 分布到多个 rank，让它们计算局部 attention，再通过正确的 softmax 归一化合并，或使用后端指定的通信路径。它不是将新 token 分给独立模型副本。",
    "sections": [
      [
        "vLLM 的 rank 复用",
        "检查版本中，DCP 不增加进程 world size。无 PCP 时复用 TP ranks；有 PCP 时可能跨 PCP 轴或整个 TP×PCP 组。具体尺寸约束和后端支持以固定源码为准。"
      ],
      [
        "局部结果不能直接相加",
        "不同分片的 softmax 分母不同。合并通常需要局部最大值、归一化统计等信息，不能直接平均各分片独立归一化后的输出。"
      ],
      [
        "与 SP 的联系与区别",
        "两者都可能沿序列/上下文分片，但 DCP 特指 decode 上下文与 KV 的执行机制；视频扩散 SP 通常处理整段联合 attention。"
      ]
    ],
    "question": "TP=8 后再设 DCP=4，是否必然需要 32 张卡？",
    "answer": "不是。vLLM 的 DCP 复用已有并行 ranks，不应作为额外乘数直接乘入设备数量。",
    "related": [
      "tp",
      "sp",
      "kv-cache"
    ],
    "papers": [],
    "sources": [
      [
        "固定版本 ParallelConfig",
        "https://github.com/vllm-project/vllm/blob/3dc7a68ce45ce1b98c2879139465833611f117cb/vllm/config/parallel.py"
      ],
      [
        "vLLM DCP 设计说明",
        "https://vllm.ai/blog/2026-08-07-decode-context-parallelism"
      ]
    ]
  },
  {
    "id": "usp",
    "name": "Unified Sequence Parallelism · USP",
    "intro": "将 Ulysses 与 Ring 组织成两个序列并行维度。",
    "formula": "P_SP = P_Ulysses × P_Ring",
    "body": "USP 将两种通信策略组合：Ulysses 在组内用 all-to-all 交换序列与 head 布局，Ring 在另一维传递 K/V 分块并累积 attention。这样可以根据 head 数与网络拓扑选择二维分组。",
    "sections": [
      [
        "一个二维示例",
        "Ulysses=2、Ring=4，则该 USP 组有 8 个 rank。它们不是 8 个独立模型副本，而是协作处理序列。"
      ],
      [
        "不能只把 Ring 当成平均输出",
        "Ring attention 需逐块更新 softmax 归一化统计；各块局部输出的直接平均不等于完整 attention。"
      ],
      [
        "与 Omni 当前配置的边界",
        "Omni 还支持 AllGather 相关组合轴，框架总 SP 大小可能多一个因子。此处 USP 公式仅描述论文的 Ulysses×Ring 结构。"
      ]
    ],
    "question": "USP 是否是与 SP 无关的另一种模型层？",
    "answer": "不是。它是一种组合序列并行的执行方法，通常保持模型的 attention 数学语义。",
    "related": [
      "sp",
      "ulysses"
    ],
    "papers": [
      [
        "USP: A Unified Sequence Parallelism Approach for Long Context Generative AI",
        "https://arxiv.org/abs/2405.07719"
      ]
    ],
    "sources": [
      [
        "Omni parallel groups",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/diffusion/distributed/parallel_state.py"
      ],
      [
        "Ring 实现",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/diffusion/attention/parallel/ring.py"
      ]
    ]
  },
  {
    "id": "ulysses",
    "name": "DeepSpeed Ulysses",
    "intro": "用 all-to-all 在序列分片与 head 分片布局之间转换。",
    "formula": "[B,S/P,H,d] → AllToAll → [B,S,H/P,d] → Attn → AllToAll → [B,S/P,H,d]",
    "body": "每个 rank 先持有部分序列的多个 heads。第一次 all-to-all 后，每个 rank 获得完整序列的一部分 heads，执行 attention；第二次 all-to-all 将结果恢复为序列分片。公式为可均匀划分 heads 的教学布局。",
    "sections": [
      [
        "为什么要两次通信",
        "第一次让本地 heads 读取全局序列，第二次恢复后续层需要的序列布局。all-to-all 不等同于在每张卡复制所有 heads 的全部序列。"
      ],
      [
        "GQA / MQA 的约束",
        "Q 与 KV 的 head 数不同；可用并行度、复制与重排策略受后端影响。不能用 Hq 可整除就断定 KV 路径必然支持。"
      ]
    ],
    "question": "Ulysses 中的本地 attention 是否仍只看到 S/P 个 token？",
    "answer": "标准 head 转置布局下，本地负责的 heads 看到完整 S 个 token；代价是每个 rank 只负责部分 heads。",
    "related": [
      "sp",
      "usp",
      "gqa"
    ],
    "papers": [
      [
        "DeepSpeed Ulysses",
        "https://arxiv.org/abs/2309.14509"
      ]
    ],
    "sources": [
      [
        "Omni Ulysses attention",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/diffusion/attention/parallel/ulysses.py"
      ]
    ]
  },
  {
    "id": "tp",
    "name": "Tensor Parallelism · TP",
    "intro": "将同一层的权重矩阵与计算切分到多个设备。",
    "formula": "column: Yᵣ=XWᵣ; row: Y=Σᵣ XᵣWᵣ",
    "body": "TP 让多个 rank 协作计算同一层。列并行通常产生输出特征分片；行并行产生局部求和项，再通过 collective 合成所需结果。是否保留分片、all-reduce 或 reduce-scatter，由层与后续布局决定。",
    "sections": [
      [
        "FFN 中的典型组合",
        "第一个线性层按输出维切分，激活在本地执行；第二个线性层按输入维切分，随后合并部分和。不是将矩阵随意切成多份独立使用。"
      ],
      [
        "与 FSDP 的区别",
        "TP 将算子计算本身切开；FSDP 常在算子执行前聚合当前模块权重，再在各数据 rank 上执行该模块。两者通信时机与激活布局不同。"
      ]
    ],
    "question": "Row-parallel 的局部输出通常能直接拼接吗？",
    "answer": "通常不能。它们是同一输出各自贡献的部分和，需要求和；column-parallel 输出才可能对应不同特征分片。",
    "related": [
      "dp",
      "sp",
      "fsdp"
    ],
    "papers": [
      [
        "Megatron-LM",
        "https://arxiv.org/abs/1909.08053"
      ]
    ],
    "sources": [
      [
        "vLLM 并行部署",
        "https://docs.vllm.ai/en/latest/serving/parallelism_scaling/"
      ]
    ]
  },
  {
    "id": "vit",
    "name": "Vision Transformer · ViT",
    "intro": "把图像 patch 投影为 token，再用 Transformer 编码视觉内容。",
    "formula": "N=(H/P)×(W/P); patches: [B,N,P²C] → Linear → [B,N,D]",
    "body": "原始 ViT 把固定大小图像 patch 展平，经线性投影并加入位置信息；分类版本附加 class token，经过 Transformer encoder 后输出分类结果。图像尺寸须适配 patch 网格。",
    "sections": [
      [
        "与多模态视觉塔的关系",
        "视觉语言模型可使用 ViT 类视觉塔，但可能改用二维 RoPE、窗口 attention、动态分辨率、patch merger 或视频时空 patch。不能把原始 ViT 的 class token 假定为所有视觉模型共有。"
      ],
      [
        "一个形状示例",
        "224×224 RGB 图像、patch=16 时得到 14×14=196 个 patch tokens；原始分类 ViT 加 class token 后是 197 个。通道宽度 D 由模型设定。"
      ]
    ],
    "question": "视觉编码器输出 196 个 patch tokens，是否意味着语言模型一定接收 196 个视觉 token？",
    "answer": "不一定。投影、空间合并、重采样等模块可能改变 token 数量。",
    "related": [
      "attention",
      "mha"
    ],
    "papers": [
      [
        "An Image is Worth 16x16 Words",
        "https://arxiv.org/abs/2010.11929"
      ]
    ],
    "sources": []
  },
  {
    "id": "fsdp",
    "name": "Fully Sharded Data Parallel · FSDP",
    "intro": "分片保存参数；训练时还可分片梯度与优化器状态。",
    "formula": "persistent: parameter shards → AllGather(module weights) → compute → reshard",
    "body": "FSDP 按组管理参数分片，在模块需要计算时聚合所需权重。训练还涉及梯度 reduce-scatter 与分片优化器状态；推理没有反向传播和优化器步骤。分片策略、预取与是否重分片会影响瞬时内存。",
    "sections": [
      [
        "不能只按参数除以卡数估显存",
        "当前模块的完整权重、预取的权重、激活与通信缓冲仍会占用空间。常驻参数分片不代表峰值显存正好降至 1/P。"
      ],
      [
        "Omni 中的推理用途",
        "此版本 HSDP 实现调用 PyTorch fully_shard，并将参数 requires_grad 设为 False；它使用分片权重执行推理，而不是在服务请求时训练。"
      ]
    ],
    "question": "FSDP 推理需要梯度 all-reduce 吗？",
    "answer": "没有训练反向传播时不需要梯度同步，但仍可能需要权重 all-gather 等通信。",
    "related": [
      "hsdp",
      "dp",
      "tp"
    ],
    "papers": [
      [
        "PyTorch FSDP: Experiences on Scaling Fully Sharded Data Parallel",
        "https://arxiv.org/abs/2304.11277"
      ],
      [
        "相关基础：ZeRO",
        "https://arxiv.org/abs/1910.02054"
      ]
    ],
    "sources": [
      [
        "PyTorch FSDP2",
        "https://docs.pytorch.org/docs/stable/distributed.fsdp.fully_shard.html"
      ],
      [
        "Omni 分片实现",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/diffusion/distributed/hsdp.py"
      ]
    ]
  },
  {
    "id": "hsdp",
    "name": "Hybrid Sharded Data Parallel · HSDP",
    "intro": "在 shard 组内分片，在 replicate 维复制分片布局。",
    "formula": "world size = shard_size × replicate_size",
    "body": "HSDP 用二维 mesh 组合分片与复制。同一 shard 组共同保存一套模型；不同 replicate 组复制这套分片布局。常见做法是节点内分片、节点间复制，但这不是定义要求。",
    "sections": [
      [
        "2×4 mesh 示例",
        "replicate=2、shard=4 共 8 个 rank。每个 shard 组的 4 个 rank 合起来持有完整模型，共有两套复制的分片布局；不是将模型唯一地切成 8 份。"
      ],
      [
        "训练与推理",
        "训练需在分片组与复制维上正确同步梯度；推理主要聚合执行所需权重。Omni 的 HSDPInferenceConfig 将这两个维度显式暴露，不能照搬训练通信图到推理。"
      ],
      [
        "与普通 DP 的关系",
        "HSDP 的 replicate 维具有复制特征，但 shard 组内部多个 rank 协作处理模型。独立请求如何调度仍由执行框架决定，不能只看 mesh 就推断副本吞吐。"
      ]
    ],
    "question": "HSDP 的 shard=4、replicate=2 是否把每个参数只存成一份 1/8 分片？",
    "answer": "不是。分片跨 4 个 rank，分片布局再复制 2 份；临时聚合与忽略分片的参数还会影响实际存储。",
    "related": [
      "fsdp",
      "dp"
    ],
    "papers": [
      [
        "混合分片参考：PyTorch FSDP",
        "https://arxiv.org/abs/2304.11277"
      ]
    ],
    "sources": [
      [
        "PyTorch hybrid sharding",
        "https://docs.pytorch.org/docs/stable/fsdp.html"
      ],
      [
        "Omni HSDPInferenceConfig / fully_shard",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/diffusion/distributed/hsdp.py"
      ]
    ]
  }
];
