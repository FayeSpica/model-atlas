export default {
  "id": "vsa",
  "name": "Video Sparse Attention · VSA",
  "intro": "先用 tile 摘要选择视频块，再对选中的原始 token 计算 attention。",
  "formula": "S = Pool(Q) Pool(K)ᵀ / √d; M = TopK_region(S); O = SparseAttn(Q,K,V;M) + G ⊙ Broadcast(softmax(S) Pool(V))",
  "body": "这里以 FastVideo 的 H3 后端解释 VSA。视频 token 按时空 tile 重排；每个 query tile 和 head 根据内容选择 key tiles。选块在低分辨率摘要上进行，细粒度 attention 仍使用原始 Q/K/V。压缩分支用池化值补充全局信息。",
  "figure": "vsa-mechanism",
  "figureAlt": "VSA 的池化打分、分区域 top-k、稀疏 attention 和门控压缩补充",
  "related": [
    "attention",
    "mha",
    "dit"
  ],
  "sections": [
    [
      "tile 不是一个 attention head",
      "tile 是时间与空间上的 token 分组，head 是通道分组。FastH3 Omni 的 tile_size=128 对应 4×4×8；56 个 attention heads 各自计算 tile 选择。VSA 可与 MHA 并存。"
    ],
    [
      "H3 的多模态边界",
      "每个参考视频与生成视频拥有独立的选块区域。文本、音频与图像参考属于非视频段，段之间不混成一个 tile。非视频 query 保持 dense；exempt 模式让视频 query 保留非视频 keys。"
    ],
    [
      "逐通道 gate 与压缩路径",
      "to_gate_compress 从输入 hidden states 投影出 gate。压缩结果广播到对应 tile 的 token，再做逐元素乘法与加法。公式描述该 H3 实现，不能假定所有 VSA 实现都采用相同 gate 或前缀策略。"
    ],
    [
      "稀疏率与保留率",
      "该 checkpoint 的生成视频 sparsity=0.9，参考视频 keep_rate=0.1。它们描述视频 tile 预算，不能解释成整个多模态矩阵恰好省去 90% 计算，更不直接等于端到端提速。"
    ],
    [
      "与滑窗、少步采样的区别",
      "滑窗按位置限定邻域；VSA 按内容选择 tile，可以连接远处区域。少步采样减少 DiT 调用次数，VSA 减少每次调用内的部分 attention 配对。两者作用在不同维度。"
    ]
  ],
  "question": "sparsity=0.9 是否代表完整生成一定快 10 倍？",
  "answer": "不是。还包括非视频 dense attention、池化打分、压缩补充、投影、FFN、VAE 和调度开销；tile 数量也有取整与边界处理。",
  "sources": [
    [
      "FastVideo VSA-H3 实现",
      "https://github.com/hao-ai-lab/FastVideo/blob/fa2d1324c60050cd65209c6aaeac470e7fb412f5/fastvideo/attention/backends/video_sparse_attn_h3.py"
    ],
    [
      "模型侧 gate 投影",
      "https://github.com/hao-ai-lab/FastVideo/blob/fa2d1324c60050cd65209c6aaeac470e7fb412f5/fastvideo/models/dits/minimax_h3.py"
    ],
    [
      "固定推理契约",
      "https://huggingface.co/FastVideo/FastVideo-FastH3-Omni-8-Step-V1/blob/53e0d26a1691aa473b6262d8196a8feb2c297df0/fastvideo_inference.json"
    ],
    [
      "VSA 论文",
      "https://arxiv.org/abs/2505.13389"
    ]
  ]
};
