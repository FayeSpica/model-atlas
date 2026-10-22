export default [
  {
    "id": "mha",
    "name": "Multi-Head Attention · MHA",
    "intro": "每个 Q head 都对应一组独立的 K/V heads。",
    "formula": "Hq = Hkv; headᵢ = softmax(QᵢKᵢᵀ / √d + mask)Vᵢ; Y = Concat(head₁, …, headHq)Wo",
    "body": "先从输入投影出 Q、K、V，再分别拆成多个 heads。MHA 中，每个 Q head 使用自己对应的 K head 和 V head；各 head 的 attention 结果拼接后，经输出投影回到残差宽度。",
    "sections": [
      [
        "Llama 2 7B 的具体形状",
        "Hq=Hkv=32，head_dim=128；因此 Q、K、V 的投影宽度均为 32×128=4,096。第 i 个 Q head 使用第 i 组 K/V。投影前的 RMSNorm 与逐 head Q/K norm 是不同位置的操作；此模型没有后者。"
      ],
      [
        "头部共享示意",
        "图中固定 8 个 Q heads，仅比较 K/V 的共享方式，不是具体 checkpoint 的头数。蓝色是 Q，金色是一组 K/V，连线表示对应关系。每个 Q head 分别计算 attention weights。"
      ],
      [
        "别把不同维度混为一谈",
        "MHA / GQA / MQA 描述头部共享；causal / bidirectional / sliding window 描述可见位置；RoPE 描述位置编码；FlashAttention 等描述计算实现。这些选择可以组合。"
      ],
      [
        "KV cache 的关系",
        "在 batch、层数、上下文长度、head_dim 和 dtype 都相同的前提下，逻辑 KV cache 大小正比于 Hkv：2 × L × B × T × Hkv × d_head × bytes_per_element。减少 KV heads 不等于总显存或耗时按同一比例下降。"
      ]
    ],
    "question": "Q 有 32 个头、K/V 有 8 个头，是否仍是 MHA？",
    "answer": "按通常区分三类结构的命名，这是 GQA：每 4 个 Q heads 共享一组 K/V。标准 MHA 对应 Hq=Hkv。",
    "sources": [
      [
        "Attention Is All You Need",
        "https://arxiv.org/abs/1706.03762"
      ],
      [
        "Llama 2 官方模型卡",
        "https://github.com/meta-llama/llama/blob/689c7f261b9c5514636ecc3c5fefefcbb3e6eed7/MODEL_CARD.md"
      ]
    ],
    "figure": "attention-head-sharing",
    "figureAlt": "固定 8 个 Q heads，比较 MHA 的 8 组 KV、GQA 的 2 组 KV 和 MQA 的 1 组 KV",
    "related": [
      "attention",
      "gqa",
      "mqa",
      "kv-cache"
    ]
  },
  {
    "id": "gqa",
    "name": "Grouped-Query Attention · GQA",
    "intro": "若干 Q heads 共享一组 K/V，保留多个 KV groups。",
    "formula": "1 < Hkv < Hq; group_size = Hq / Hkv; headᵢ = Attention(Qᵢ, Kgroup(i), Vgroup(i))",
    "body": "Q heads 的数量可以保持较多，K/V heads 则分成较少的组。同组的 Q heads 使用相同的 K/V，但 Q 不同，算出的 attention weights 和输出仍然可以不同。",
    "sections": [
      [
        "Qwen2 的具体例子",
        "Qwen2-7B-Instruct 有 28 个 Q heads、4 个 KV heads，每组 K/V 供 7 个 Q heads 使用；head_dim 为 128，所以 Q 宽度为 3,584，而 K、V 宽度各为 512。不能用 hidden_size 直接推断 KV 的投影宽度。"
      ],
      [
        "头部共享示意",
        "图中固定 8 个 Q heads，仅比较 K/V 的共享方式，不是具体 checkpoint 的头数。蓝色是 Q，金色是一组 K/V，连线表示对应关系。每个 Q head 分别计算 attention weights。"
      ],
      [
        "别把不同维度混为一谈",
        "MHA / GQA / MQA 描述头部共享；causal / bidirectional / sliding window 描述可见位置；RoPE 描述位置编码；FlashAttention 等描述计算实现。这些选择可以组合。"
      ],
      [
        "KV cache 的关系",
        "在 batch、层数、上下文长度、head_dim 和 dtype 都相同的前提下，逻辑 KV cache 大小正比于 Hkv：2 × L × B × T × Hkv × d_head × bytes_per_element。减少 KV heads 不等于总显存或耗时按同一比例下降。"
      ]
    ],
    "question": "32 个 Q heads、8 个 KV heads 时，每组有多少个 Q heads？",
    "answer": "32÷8=4。它们共享 K/V，但并不共享 Q，也不保证 attention weights 相同。",
    "sources": [
      [
        "GQA 论文",
        "https://arxiv.org/abs/2305.13245"
      ]
    ],
    "figure": "attention-head-sharing",
    "figureAlt": "固定 8 个 Q heads，比较 MHA 的 8 组 KV、GQA 的 2 组 KV 和 MQA 的 1 组 KV",
    "related": [
      "attention",
      "mha",
      "mqa",
      "kv-cache"
    ]
  },
  {
    "id": "mqa",
    "name": "Multi-Query Attention · MQA",
    "intro": "所有 Q heads 共享同一组 K/V。",
    "formula": "Hkv = 1; headᵢ = Attention(Qᵢ, K₁, V₁)",
    "body": "MQA 为每个 head 保留不同的 Q，但只投影和缓存一组 K/V。可以把它看作 GQA 的单个 KV group 特例。共享的是 K/V 表示，而不是把所有 attention 输出强行设为同一个值。",
    "sections": [
      [
        "单组 K/V 的含义",
        "例如 8 个 Q heads、每 head 128 维，Q 投影宽度是 1,024，而 K、V 各为 128。Falcon-7B 是实际 MQA 例子，其公开配置启用 multi_query；vLLM 对它使用单独的 falcon.py，而非 llama.py。"
      ],
      [
        "不能只修改配置转换现成模型",
        "将 MHA 的 num_key_value_heads 从 32 直接改成 1，会改变 K/V 投影矩阵的形状与权重含义。MQA / GQA 通常需要对应的模型权重或专门转换、训练过程。"
      ],
      [
        "头部共享示意",
        "图中固定 8 个 Q heads，仅比较 K/V 的共享方式，不是具体 checkpoint 的头数。蓝色是 Q，金色是一组 K/V，连线表示对应关系。每个 Q head 分别计算 attention weights。"
      ],
      [
        "别把不同维度混为一谈",
        "MHA / GQA / MQA 描述头部共享；causal / bidirectional / sliding window 描述可见位置；RoPE 描述位置编码；FlashAttention 等描述计算实现。这些选择可以组合。"
      ],
      [
        "KV cache 的关系",
        "在 batch、层数、上下文长度、head_dim 和 dtype 都相同的前提下，逻辑 KV cache 大小正比于 Hkv：2 × L × B × T × Hkv × d_head × bytes_per_element。减少 KV heads 不等于总显存或耗时按同一比例下降。"
      ]
    ],
    "question": "MQA 是否只剩一个 Q head？",
    "answer": "不是。它只有一个 KV head，仍然可以有多个 Q heads；multi-query 指多个 queries 共享同一组 K/V。",
    "sources": [
      [
        "MQA 论文",
        "https://arxiv.org/abs/1911.02150"
      ],
      [
        "Falcon-7B 配置",
        "https://huggingface.co/tiiuae/falcon-7b/blob/main/config.json"
      ]
    ],
    "figure": "attention-head-sharing",
    "figureAlt": "固定 8 个 Q heads，比较 MHA 的 8 组 KV、GQA 的 2 组 KV 和 MQA 的 1 组 KV",
    "related": [
      "attention",
      "mha",
      "gqa",
      "kv-cache"
    ]
  }
];
