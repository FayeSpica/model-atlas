export default {
  "slug": "llama2-7b",
  "name": "Llama-2-7B",
  "family": "Meta",
  "category": "文本生成",
  "kind": "vLLM v0.8.0",
  "architecture": "dense",
  "parameterCount": "6.74B",
  "parameterTotal": 6738415616,
  "modelId": "meta-llama/Llama-2-7b-hf",
  "lead": "32 层标准多头注意力：32 个 Q heads 分别对应 32 组 K/V，用作 MHA 的具体例子。",
  "concepts": [
      "swiglu",
    "attention",
    "mha",
    "gqa",
    "mqa",
    "rope",
    "kv-cache"
  ],
  "facts": [
    "MHA · 32Q / 32KV",
    "32 layers",
    "4,096 ctx",
    "vLLM v0.8.0"
  ],
  "scope": "以 Llama 2 7B 基础模型和 vLLM v0.8.0 的 LlamaForCausalLM 实现讲解，图中为 TP=1 的逻辑形状。规格依据 Meta 官方实现、模型卡与公开 checkpoint 参数元数据；未读取受访问控制的原始 config.json。",
  "revision": "966f933ee1cd7c9a41db60de5c7ff98657005251",
  "figure": "llama2-7b-layers",
  "figureAlt": "Llama 2 7B 的 32 层 MHA 和 Dense FFN，以及独立的 RMSNorm、QKV、RoPE、残差加法与 SwiGLU 操作",
  "figureNote": "L=32，D=4,096，F=11,008，Hq=Hkv=32，head_dim=128。参数量按 embedding、attention、FFN 与 norm 权重计算，并与公开 checkpoint 的 F16 参数计数核对。",
  "nodes": [
    [
      "词嵌入",
      "Token embedding",
      "[N] → [N,4096]",
      "按 token ID 读取隐藏向量。"
    ],
    [
      "MHA 主干",
      "32 decoder layers",
      "32Q / 32KV",
      "每个 query head 使用对应的 K/V head。"
    ],
    [
      "末尾归一化",
      "Final RMSNorm",
      "[N,4096]",
      "补齐残差加法并归一化。"
    ],
    [
      "输出头",
      "Untied LM head",
      "4096 → 32000",
      "隐藏状态投影到词表 logits。"
    ],
    [
      "采样",
      "Sampler",
      "Logits → token",
      "根据采样策略选择下一个 token。"
    ]
  ],
  "sections": [
    [
      "为什么是 MHA？",
      "num_attention_heads 与 num_key_value_heads 均为 32。第 i 个 query head 与第 i 个 K/V head 配对；每个 head 的维度为 4,096 ÷ 32 = 128。这里不是多个 Q heads 共用同一组 K/V 的 GQA，也不是全部 Q heads 共享一组 K/V 的 MQA。"
    ],
    [
      "每个 attention 子层",
      "输入先做 RMSNorm，再由融合 QKV 投影得到三份各 4,096 维的结果。Q、K 分别应用 RoPE，V 直接进入因果 MHA。32 个 head 的输出合并后，经 o_proj 回到残差宽度，并与子层输入相加；没有逐 head Q/K RMSNorm。"
    ],
    [
      "Dense SwiGLU",
      "归一化后，gate/up 投影各输出 11,008 维；gate 执行 SiLU，再与 up 逐元素相乘，down_proj 映射回 4,096 维，最后执行残差加法。图中的 × 是逐元素乘法，不是矩阵乘法。"
    ],
    [
      "MHA 与因果性是两回事",
      "MHA 描述 Q、K、V 的头部对应关系，causal mask 描述 token 之间的可见范围。Llama 2 7B 同时采用 MHA 与因果遮罩；不能把 MHA 误认为一定允许读取未来 token。"
    ],
    [
      "与 GQA 比较 KV cache",
      "在层数、序列长度、head_dim 和 dtype 相同时，KV cache 元素数为 2 × L × B × T × Hkv × head_dim。若保持 32 个 Q heads，但将 KV heads 从 32 改为 8，则逻辑 KV 存储降到四分之一；这不是把现有权重的配置直接改成 8 就能得到等价模型。"
    ],
    [
      "源码执行边界",
      "LlamaModel.forward 返回归一化后的 hidden states，compute_logits 再应用输出头。vLLM 使用融合 residual + RMSNorm 维护残差状态；图上把逻辑加法独立画出以便理解。"
    ]
  ],
  "question": "32 个 Q heads、32 个 KV heads，每 head 128 维，K 投影的输出宽度是多少？",
  "answer": "32 × 128 = 4,096。MHA 中 Q、K、V 在该规格下宽度相同；若改为 8 个 KV heads，K/V 宽度才会各为 1,024，而 Q 仍为 4,096。",
  "sources": [
    [
      "vLLM LlamaAttention / DecoderLayer / Model",
      "https://github.com/vllm-project/vllm/blob/966f933ee1cd7c9a41db60de5c7ff98657005251/vllm/model_executor/models/llama.py"
    ],
    [
      "Meta 官方模型实现",
      "https://github.com/meta-llama/llama/blob/689c7f261b9c5514636ecc3c5fefefcbb3e6eed7/llama/model.py"
    ],
    [
      "Llama 2 模型卡：7B 使用 MHA",
      "https://github.com/meta-llama/llama/blob/689c7f261b9c5514636ecc3c5fefefcbb3e6eed7/MODEL_CARD.md"
    ],
    [
      "Llama 2 论文",
      "https://arxiv.org/abs/2307.09288"
    ],
    [
      "公开 checkpoint 参数元数据",
      "https://huggingface.co/api/models/meta-llama/Llama-2-7b-hf"
    ]
  ]
};
