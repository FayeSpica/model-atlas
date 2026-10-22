export default {
  "slug": "qwen2",
  "name": "Qwen2",
  "family": "Qwen",
  "category": "文本生成",
  "kind": "vLLM v0.8.0",
  "lead": "沿源码展开 QKV、RoPE、SwiGLU，以及融合 RMSNorm 的双状态残差流。",
  "concepts": [
    "attention",
    "rope",
    "kv-cache"
  ],
  "facts": [
    "Dense decoder",
    "GQA / RoPE",
    "Fused residual + RMSNorm",
    "vLLM v0.8.0"
  ],
  "scope": "仅画指定版本 qwen2.py 的 Qwen2ForCausalLM 路径；不假定具体 checkpoint 的层数和 head 数。默认 causal，省略 embedding-model pooling。图中张量为 TP=1 的逻辑形状。",
  "revision": "966f933ee1cd7c9a41db60de5c7ff98657005251",
  "figure": "qwen2-v080",
  "figureTitle": "Qwen2 源码结构与双状态残差流",
  "figureAlt": "Qwen2 整体模型、融合残差 Decoder Layer、QKV 与 RoPE Attention、SwiGLU MLP 的源码架构图",
  "figureNote": "N 是本次调用处理的 token 数，D 是 hidden_size，F 是 intermediate_size；Hq / Hkv 分别是 query / KV head 数，d = D / Hq。L、D、F 和 head 数均由配置决定。",
  "nodes": [
    [
      "词嵌入",
      "VocabParallelEmbedding",
      "[N] → [N, D]",
      "Qwen2Model 在首个 PP rank 执行 embedding；若传入 inputs_embeds，则直接使用给定向量。N 是当前调用中展平的 token 数，不必写成固定的 batch × sequence。"
    ],
    [
      "Decoder 层栈",
      "L × Qwen2DecoderLayer",
      "(hidden_states, residual)",
      "每层依次执行 input_layernorm、self_attn、post_attention_layernorm 和 mlp。融合 norm 维护独立 residual；返回的 hidden_states 是 MLP 输出，尚未完成该 MLP 的残差加法。"
    ],
    [
      "末尾归一化",
      "Final RMSNorm",
      "[N, D] → [N, D]",
      "最后一个 PP rank 的 model.norm(hidden_states, residual) 补上最后一个 MLP 的残差，并归一化。Qwen2ForCausalLM.forward 到此返回 hidden states，不直接返回 logits。"
    ],
    [
      "词表投影",
      "compute_logits()",
      "选中位置 → [N_selected, V]",
      "独立调用 LogitsProcessor 和 lm_head 得到词表 logits。若 tie_word_embeddings=True，lm_head 复用 embed_tokens；否则创建 ParallelLMHead。"
    ],
    [
      "采样",
      "sample()",
      "Logits → next token",
      "sample 调用 sampler 选择下一个 token。后续将 token 再送入模型的生成循环由外部运行时驱动，不在这个 forward 中。"
    ]
  ],
  "sections": [
    [
      "先看三个调用边界",
      "Qwen2ForCausalLM.forward 只调用 Qwen2Model 并返回 hidden states。compute_logits 才应用词表输出头，sample 再执行采样。把三个函数合在一条图中是为了说明生成路径，并不表示一次 forward 内部执行了全部步骤。"
    ],
    [
      "为什么返回两个张量？",
      "第一层 residual=None 时，先保存输入为 r，再对输入做 RMSNorm。后续层先把上一层尚未累加的 MLP 输出加进 r，再归一化。attention 后的 post_attention_layernorm 同时执行 r = r + attention_output 和 RMSNorm(r)。本层 MLP 输出与 r 分开返回；最后一个 MLP 的加法由 final norm 完成。这种执行方式保留了 pre-norm 残差结构的逻辑。"
    ],
    [
      "Attention：一次投影，三条分支",
      "QKVParallelLinear 将 Q/K/V 合并投影，且 bias=True；随后按 q_size、kv_size、kv_size 拆分。positions 只参与 Q、K 的 RoPE，V 不做旋转。Attention 后经不带 bias 的 RowParallelLinear 输出投影回 D。此实现没有逐 head Q/K RMSNorm；Hkv 小于 Hq 时是 GQA。"
    ],
    [
      "KV cache 属于哪个对象？",
      "qwen2.py 中的 self.attn(q, k, v) 委托公共 Attention 层。该层从 forward context 获取 attention metadata，并使用绑定的逐层 KV cache 调用后端。图上是逻辑读写关系；具体缓存写入和读取由所选后端完成，不能从这个文件推断固定的物理布局。"
    ],
    [
      "MLP：dense SwiGLU",
      "MergedColumnParallelLinear 合并 gate_proj 与 up_proj，输出两份 F 维表示。SiluAndMul 计算 SiLU(gate) ⊙ up，再由 down_proj 映射回 D；两个投影都不带 bias。这里没有 router 或 experts。"
    ],
    [
      "并行与配置的边界",
      "TP 按 head 划分 query；KV heads 足够多时分片，少于 TP ranks 时复制。PP 只执行本 rank 的 layer 区间，传递 hidden_states 和 residual。图以 TP=1 展示逻辑形状。另有 is_causal=False 的 ENCODER_ONLY 分支，不能把本文件支持的所有模型都称为因果模型。"
    ]
  ],
  "question": "为什么 Qwen2DecoderLayer.forward 的最后没有写 hidden_states += residual？",
  "answer": "它把 MLP 输出和 residual 分开返回。下一层 input_layernorm(hidden_states, residual) 会融合执行加法与归一化；最后一层则交给 Qwen2Model.norm 完成。因此残差并未丢失，而是推迟到下一个融合 norm。",
  "sources": [
    [
      "Qwen2Model / DecoderLayer / Attention / MLP",
      "https://github.com/vllm-project/vllm/blob/966f933ee1cd7c9a41db60de5c7ff98657005251/vllm/model_executor/models/qwen2.py"
    ],
    [
      "融合 RMSNorm 的 residual 语义",
      "https://github.com/vllm-project/vllm/blob/966f933ee1cd7c9a41db60de5c7ff98657005251/vllm/model_executor/layers/layernorm.py"
    ],
    [
      "Attention 的 context 与 KV cache",
      "https://github.com/vllm-project/vllm/blob/966f933ee1cd7c9a41db60de5c7ff98657005251/vllm/attention/layer.py"
    ]
  ]
};
