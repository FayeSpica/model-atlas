export default {
  "slug": "flint",
  "name": "flint",
  "family": "Recursive",
  "category": "文本生成",
  "kind": "Hybrid attention MoE",
  "architecture": "moe",
  "parameterCount": "40B",
  "activeParameterCount": "2.5B",
  "parameterTotal": 39785287456,
  "modelId": "RecursiveSI/flint",
  "lead": "49 层混合注意力：滑窗 RoPE 与全局 NoPE，前两层 Dense，其余层为共享专家 MoE。",
  "concepts": [
      "swiglu",
    "attention",
    "rope",
    "moe",
    "kv-cache",
    "gqa"
  ],
  "facts": [
    "49 layers",
    "32Q / 4KV",
    "262,144 ctx",
    "PR #62938"
  ],
  "revision": "826fd3fdca9b7717ca08d67196ac1dc9ca59adca",
  "figure": "flint-layer-stack",
  "figureAlt": "Flint 49 层 Attention 与 FFN 分布及 Attention、MoE、Dense 子层结构",
  "figureNote": "40B / 2.5B 为 PR 标称总参数 / 每 token 激活参数；BF16 checkpoint 参数总数为 39,785,287,456。",
  "scope": "依据 vLLM PR #62938 的固定 revision 与 RecursiveSI/flint BF16 配置绘制。展示逻辑 pre-norm 结构；融合内核、TP/EP 分片及量化存储不改变图中的子层关系。",
  "sections": [
    [
      "层分布",
      "全局注意力位于 0、1、5、9、13、17、21、25、29、33、37、41、45、48 层，不使用 RoPE；其余 35 层使用 513-token 因果滑窗和 RoPE。FFN 的第 0–1 层为 Dense SwiGLU，后 47 层为 MoE。"
    ],
    [
      "Attention 内部",
      "输入先经过 RMSNorm，再投影为 32 个 query heads 与 4 个 KV heads，每 head 128 维。Q、K 分别做逐 head RMSNorm，滑窗层随后应用 RoPE。所有层均使用 learned attention sinks，最后经 o_proj 回到 2,048 维残差流。"
    ],
    [
      "MoE 与共享专家",
      "Router 将 2,048 维输入映射为 256 个专家分数，经 sigmoid 选择 top-6 并重新归一化。每个 routed expert 使用宽度 512 的 SwiGLU；另有宽度 1,024 的 shared expert，对每个 token 执行，不参与 top-6 选择。路由专家加权结果与共享专家输出相加。"
    ],
    [
      "前两层 Dense FFN",
      "第 0、1 层没有 router。它们采用宽度 6,144 的 SwiGLU：gate/up 投影、SiLU 与逐元素乘法，再 down projection 回到残差宽度。"
    ],
    [
      "执行与逻辑结构",
      "图中的加号表示逻辑残差连接。实现可将残差加法与 RMSNorm 融合，并在小 batch 路径中融合多个算子；这并不表示网络少了某个子层。最终 RMSNorm 后使用不共享 embedding 权重的 LM head。"
    ]
  ],
  "question": "共享专家是否也需要被 top-6 选中？",
  "answer": "不需要。top-6 只从 256 个 routed experts 中选择；shared expert 对每个 token 运行，其输出再与路由专家的加权和相加。",
  "sources": [
    [
      "Flint 模型实现",
      "https://github.com/vllm-project/vllm/blob/826fd3fdca9b7717ca08d67196ac1dc9ca59adca/vllm/models/flint/model.py"
    ],
    [
      "PR #62938",
      "https://github.com/vllm-project/vllm/pull/62938"
    ],
    [
      "BF16 checkpoint 配置",
      "https://huggingface.co/RecursiveSI/flint/blob/2a247be0c0aec895ccb0ac7ca92229ec6df37288/config.json"
    ]
  ],
  "nodes": [
    [
      "词嵌入",
      "Embedding",
      "[N] → [N, 2048]",
      "将 token ID 映射为残差流。"
    ],
    [
      "混合注意力",
      "GQA + sinks",
      "32Q / 4KV",
      "滑窗 RoPE 与全局 NoPE 按层交替。"
    ],
    [
      "前馈网络",
      "Dense / MoE",
      "2048 → 2048",
      "前两层 Dense，其余层为 MoE。"
    ],
    [
      "末尾归一化",
      "RMSNorm",
      "[N, 2048]",
      "完成残差加法及归一化。"
    ],
    [
      "输出头",
      "Untied LM head",
      "2048 → 150144",
      "输出词表 logits。"
    ]
  ]
};
