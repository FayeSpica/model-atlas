export default {
  "slug": "fasth3-omni",
  "name": "FastH3-Omni-8-Step-V1",
  "family": "FastVideo",
  "category": "视频与音频",
  "kind": "Joint DiT · PDD",
  "lead": "参考条件音视频生成：50 层联合 DiT，结合 VSA 选块注意力与 PDD 输出头，执行 8 次 Transformer 求值。",
  "concepts": [
      "swiglu",
    "vsa",
    "attention",
    "mha",
    "dit",
    "rope",
    "vae"
  ],
  "facts": [
    "50 DiT layers",
    "8 forwards",
    "PDD · 32 heads",
    "VSA · tile 128",
    "BF16"
  ],
  "scope": "固定到指定 BF16 checkpoint 的 transformer_ref/config.json 与 fastvideo_inference.json，按 FastVideo 的 Ref2VA PDD 实现绘制。共享文本编码器、tokenizer 和媒体 VAE 来自 MiniMax-H3；不混用 Preview、V2、FP8 或 NVFP4 版本。",
  "sections": [
    [
      "输入与共享组件",
      "文本条件经 5,120→5,376 投影与 2 层 token refiner。参考视频和音频先经共享 VAE 编码；生成目标与固定参考按顺序打包，参考区域不会像目标 latent 一样被 flow 更新。"
    ],
    [
      "VSA 在哪里",
      "每个 DiT block 的 Q/K/V 保留 56 个 128 维 heads，即 MHA 的头部配置。Q/K RMSNorm 和 RoPE 后进入 VIDEO_SPARSE_ATTN_H3；VSA 改变 token 块的可见范围，不改变 KV heads 数量。"
    ],
    [
      "128-token tiles 与区域选块",
      "发布配置使用 4×4×8 的时空 tile，vsa_sparsity=0.9，参考视频 ref_keep_rate=0.1，policy=p2_multi_region。对每个视频 query tile、每个 head，在各视频区域分别进行 top-k。非视频 query 保持 dense；默认 exempt 策略保留非视频 keys。实际保留数量受取整、区域边界与 dense overrides 影响。"
    ],
    [
      "稀疏细算与压缩补充",
      "池化后的 Q/K 计算 tile scores，选中的块用原始 Q/K/V 做细粒度 attention。另一路对池化 V 做压缩 attention，将结果广播回 token，经 to_gate_compress 产生的逐通道 gate 相乘，再与稀疏结果相加。这个 gate 不是 MoE router，源码此处没有额外 sigmoid。"
    ],
    [
      "PDD：32 组头，8 次求值",
      "pdd_steps=32 扩展视频和音频输出投影，分别有 32×96 与 32×32 个输出通道；它们对应细时间网格的区间方向，不是 attention heads。采样索引为 0、4、8、12、16、20、24、28、32，形成 8 个跨度，guidance_scale=1.0。"
    ],
    [
      "权重范围",
      "index metadata 的 total_size=70,142,174,464 字节，只统计此 transformer_ref 的 tensor payload。共享文本编码器、视频与音频 VAE 另行加载；该数字不能当作参数个数或运行显存。"
    ]
  ],
  "question": "8 次 Transformer 求值，是否意味着只有 8 层 DiT 或 8 个 attention heads？",
  "answer": "不是。每次求值经过 50 层 DiT，每层有 56 个 attention heads；PDD 的 32 组输出头又是另一个维度，用于细时间网格区间。",
  "revision": "fa2d1324c60050cd65209c6aaeac470e7fb412f5",
  "modelId": "FastVideo/FastVideo-FastH3-Omni-8-Step-V1",
  "figure": "fasth3-omni-layers",
  "figureAlt": "FastH3 Omni 的 50 层主干、VSA attention、SwiGLU 和 32 组 PDD 输出头",
  "figureNote": "D=5,376 · 56×128 attention · F=14,336 · 2 token refiners。50 层是网络深度，8 forwards 是采样调用次数，32 是 PDD 细网格的输出头数。",
  "sources": [
    [
      "FastVideo DiT 实现",
      "https://github.com/hao-ai-lab/FastVideo/blob/fa2d1324c60050cd65209c6aaeac470e7fb412f5/fastvideo/models/dits/minimax_h3.py"
    ],
    [
      "VSA-H3 后端",
      "https://github.com/hao-ai-lab/FastVideo/blob/fa2d1324c60050cd65209c6aaeac470e7fb412f5/fastvideo/attention/backends/video_sparse_attn_h3.py"
    ],
    [
      "PDD 训练与输出布局",
      "https://github.com/hao-ai-lab/FastVideo/blob/fa2d1324c60050cd65209c6aaeac470e7fb412f5/fastvideo/train/models/minimax_h3/minimax_h3_pdd.py"
    ],
    [
      "模型卡",
      "https://huggingface.co/FastVideo/FastVideo-FastH3-Omni-8-Step-V1/blob/53e0d26a1691aa473b6262d8196a8feb2c297df0/README.md"
    ],
    [
      "Transformer 配置",
      "https://huggingface.co/FastVideo/FastVideo-FastH3-Omni-8-Step-V1/blob/53e0d26a1691aa473b6262d8196a8feb2c297df0/transformer_ref/config.json"
    ],
    [
      "推理契约",
      "https://huggingface.co/FastVideo/FastVideo-FastH3-Omni-8-Step-V1/blob/53e0d26a1691aa473b6262d8196a8feb2c297df0/fastvideo_inference.json"
    ],
    [
      "权重体积",
      "https://huggingface.co/FastVideo/FastVideo-FastH3-Omni-8-Step-V1/blob/53e0d26a1691aa473b6262d8196a8feb2c297df0/transformer_ref/diffusion_pytorch_model.safetensors.index.json"
    ]
  ],
  "nodes": [
    [
      "编码条件",
      "Shared encoders",
      "Text / references",
      "加载共享组件并编码参考。"
    ],
    [
      "打包序列",
      "2 token refiners",
      "D = 5376",
      "保持参考顺序。"
    ],
    [
      "联合主干",
      "50-layer VSA DiT",
      "56 × 128",
      "选块细算与压缩补充。"
    ],
    [
      "PDD 采样",
      "32 output heads",
      "8 forwards",
      "按细网格跨度更新目标。"
    ],
    [
      "媒体解码",
      "Video / audio VAE",
      "Video + audio",
      "解码同步媒体。"
    ]
  ],
  "architecture": "dense",
  "parameterCount": "DiT 70.14 GB",
  "parameterLabel": "transformer_ref tensor payload：70,142,174,464 字节；不含共享编码器和 VAE，非运行显存"
};
