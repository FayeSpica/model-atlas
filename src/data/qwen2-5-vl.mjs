export default {
  "slug": "qwen2-5-vl",
  "name": "Qwen2.5-VL-7B-Instruct",
  "family": "Qwen",
  "category": "视觉理解",
  "kind": "Vision–Language",
  "architecture": "dense",
  "parameterCount": "8.29B",
  "parameterTotal": 8292166656,
  "modelId": "Qwen/Qwen2.5-VL-7B-Instruct",
  "lead": "窗口视觉 Transformer、2×2 Patch Merger 与采用 MRoPE 的 Qwen2 语言模型。",
  "concepts": [
    "vit",
      "swiglu",
    "attention",
    "rope",
    "kv-cache",
    "mha",
    "gqa"
  ],
  "facts": [
    "32 vision blocks",
    "28 decoder layers",
    "MRoPE",
    "vLLM v0.8.0"
  ],
  "scope": "基于 Qwen/Qwen2.5-VL-7B-Instruct 的配置，按 vLLM v0.8.0 实现讲解。8.29B 是全部 safetensors 参数量，包含视觉部分；名称中的 7B 是规格名。图中使用 TP=1 逻辑维度，省略设备放置和量化。",
  "figure": "qwen2-5-vl-layer-stack",
  "figureAlt": "Qwen2.5-VL 的 32 层视觉与 28 层语言模型分布，以及视觉 Block、Patch Merger、语言 Decoder 内部结构",
  "figureNote": "视觉宽度 1,280、16 heads、head dim 80、MLP 中间宽度 3,420。语言宽度 3,584、28 query / 4 KV heads、head dim 128、MLP 中间宽度 18,944。MRoPE section 为 [16, 24, 24]。",
  "revision": "966f933ee1cd7c9a41db60de5c7ff98657005251",
  "nodes": [
    [
      "视觉输入",
      "动态分辨率 + Conv3d",
      "[patches, 3 × 2 × 14 × 14] → [Nv, 1280]",
      "预处理将图像或视频整理为 patch；时间 patch 为 2，空间 patch 为 14×14。Conv3d 将 patch 映射到 1,280 维。"
    ],
    [
      "视觉编码",
      "32 × VisionBlock",
      "[Nv, 1280] → [Nv, 1280]",
      "第 7、15、23、31 层在每个时间网格片内执行全局视觉注意力，其余层按空间窗口分组。MLP 使用带 bias 的 SwiGLU。"
    ],
    [
      "Patch Merger",
      "2×2 空间合并",
      "[Nv, 1280] → [Nv/4, 3584]",
      "每个视觉 token 先 RMSNorm，再将相邻 2×2 token 拼接为 5,120 维，经过 Linear、GELU、Linear 得到 3,584 维输出。"
    ],
    [
      "多模态序列",
      "视觉 embedding 替换占位位置",
      "[text + visual positions, 3584]",
      "视觉向量写入输入序列中 image/video token 的对应位置。语言主干使用普通自注意力共同处理文本与视觉 token，不是额外增加一个 cross-attention 模块。"
    ],
    [
      "语言生成",
      "28 × Qwen2 decoder + LM head",
      "Hidden states → vocabulary logits",
      "语言侧采用 causal GQA、MRoPE 和 dense SwiGLU。生成经过末尾 RMSNorm、词表投影和采样；KV cache 服务于语言侧自回归解码。"
    ]
  ],
  "sections": [
    [
      "两套层栈，职责不同",
      "视觉模型有 32 个 Block；语言模型有 28 个 Decoder Layer。视觉注意力使用窗口与全局两种分组，语言注意力则是因果 GQA。不要把视觉窗口层和语言 KV cache 混为一谈。"
    ],
    [
      "视觉窗口与全局层",
      "配置中的 fullatt_block_indexes=[7,15,23,31] 使用零基索引。vLLM 为普通视觉层传入窗口 cu_seqlens，为这四层传入按 grid_t 分片的 cu_seqlens；因此这里的全局是当前时间网格片的完整空间范围，并非视频所有时间片一起做全局注意力。112 像素窗口对应最多 8×8 个 14×14 patch。"
    ],
    [
      "视觉 Block 也采用 RMSNorm 与 SwiGLU",
      "虽然 Block 构造函数的默认 norm 是 LayerNorm，实际 VisionTransformer 传入的是 RMSNorm。视觉 Attention 使用 16 个 head，每个 80 维；MLP 执行 gate_proj→SiLU，与 up_proj 逐元素相乘，再 down_proj 回到 1,280 维。两个子层都有残差。"
    ],
    [
      "Patch Merger 不等于池化",
      "先对每个视觉 token 做 RMSNorm，再拼接 2×2 空间邻居，得到 4×1,280=5,120 维向量。Merger 的 MLP 为 5,120→5,120→3,584，中间激活是 GELU；这里不是视觉 Block 中的 SwiGLU。合并后通过逆窗口索引恢复对应顺序。"
    ],
    [
      "视觉 token 如何进入语言模型",
      "merge_multimodal_embeddings 将视觉向量写到文本序列的图像／视频占位位置，随后调用 Qwen2 语言模型。语言层没有独立 cross-attention。文本与视觉位置通过 MRoPE 的时间、高度、宽度坐标表达；语言输出仍是词表 logits。"
    ]
  ],
  "question": "一个视觉网格在进入 Merger 前有 256 个 token，合并后 token 数和每个 token 的维度分别是多少？",
  "answer": "2×2 空间合并将 token 数降为 64。每组先拼成 5,120 维，再经 Merger MLP 投影为 3,584 维，因此输出是 [64, 3584]。",
  "sources": [
    [
      "视觉模型、Patch Merger 与多模态输入合并",
      "https://github.com/vllm-project/vllm/blob/966f933ee1cd7c9a41db60de5c7ff98657005251/vllm/model_executor/models/qwen2_5_vl.py"
    ],
    [
      "语言 Decoder 实现",
      "https://github.com/vllm-project/vllm/blob/966f933ee1cd7c9a41db60de5c7ff98657005251/vllm/model_executor/models/qwen2.py"
    ],
    [
      "权重配置与总参数量",
      "https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct/tree/cc594898137f460bfe9f0759e9844b3ce807cfb5"
    ]
  ]
};
