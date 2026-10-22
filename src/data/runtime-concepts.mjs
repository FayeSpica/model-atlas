export default [
  {
    "id": "rmsnorm",
    "name": "RMSNorm",
    "intro": "按均方根缩放特征，不减去均值。",
    "formula": "y = x / √(mean(x²)+ε) ⊙ γ",
    "body": "RMSNorm 沿指定特征维归一化。它与 LayerNorm 的核心区别是通常不做均值中心化；norm 的维度与位置必须从实现判断。输入 RMSNorm 与逐 head Q/K RMSNorm 作用于不同张量。",
    "question": "RMSNorm 会让输出均值一定为零吗？",
    "answer": "不会，它没有减去均值。",
    "related": [
      "swiglu",
      "attention"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm/blob/3dc7a68ce45ce1b98c2879139465833611f117cb/vllm/model_executor/layers/layernorm.py"
      ]
    ],
    "papers": [
      [
        "Root Mean Square Layer Normalization",
        "https://arxiv.org/abs/1910.07467"
      ]
    ]
  },
  {
    "id": "residual",
    "name": "Residual connection · 残差连接",
    "intro": "将子层产生的增量加回输入。",
    "formula": "y = x + F(x)",
    "body": "残差加法要求相加张量具有兼容形状。pre-norm 常写成 x+F(Norm(x))；vLLM 可把 residual add 与下一次 RMSNorm 融合，逻辑上的加法仍存在。带 gate 的残差还会先缩放增量。",
    "question": "融合 add+norm 后，残差连接消失了吗？",
    "answer": "没有，融合改变 kernel 边界，不改变所实现的逻辑运算。",
    "related": [
      "rmsnorm",
      "swiglu"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm/blob/3dc7a68ce45ce1b98c2879139465833611f117cb/vllm/model_executor/layers/layernorm.py"
      ]
    ],
    "papers": []
  },
  {
    "id": "cross-attention",
    "name": "Cross-Attention",
    "intro": "query 与 key/value 来自不同序列。",
    "formula": "Q=XWq; K=CWk; V=CWv; Y=softmax(QKᵀ/√d)V",
    "body": "例如文本 query 读取视觉条件。cross-attention 不等于将所有模态拼成一个序列做 self-attention；两者的投影来源与可见范围不同。",
    "question": "把图像和文本 token 拼在一起做 self-attention，就是 cross-attention 吗？",
    "answer": "不是。cross-attention 的 Q 与 KV 来自不同输入流。",
    "related": [
      "attention",
      "vit"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://arxiv.org/abs/1706.03762"
      ]
    ],
    "papers": [
      [
        "Attention Is All You Need",
        "https://arxiv.org/abs/1706.03762"
      ]
    ]
  },
  {
    "id": "causal-attention",
    "name": "Causal / sliding-window attention",
    "intro": "用 mask 规定 query 可以读取哪些位置。",
    "formula": "causal: j≤i; causal window: max(0,i−W+1)≤j≤i",
    "body": "因果 mask 禁止读取未来位置；因果滑窗进一步限制历史范围。这里 W 包含当前位置，不同实现可能用不同窗口参数约定。MHA/GQA 是头共享方式，RoPE 是位置编码，不能替代 mask。",
    "question": "GQA 一定是因果注意力吗？",
    "answer": "不是，头共享与可见位置是独立选择。",
    "related": [
      "attention",
      "gqa",
      "rope"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm/blob/3dc7a68ce45ce1b98c2879139465833611f117cb/vllm/model_executor/layers/attention/attention.py"
      ]
    ],
    "papers": []
  },
  {
    "id": "flash-attention",
    "name": "FlashAttention",
    "intro": "通过分块与在线 softmax 减少 attention 的显存读写。",
    "formula": "Attention(Q,K,V) with tiled online softmax",
    "body": "标准 dense FlashAttention 计算完整 attention 的数学结果，避免物化完整 score 矩阵。它不自动把 attention 变为线性复杂度，也不等于 VSA 的内容选块；浮点顺序变化仍可能产生数值差异。",
    "question": "用了 FlashAttention，就只计算部分 token 对吗？",
    "answer": "标准 dense 版本不是，减少的是中间存储与 IO。",
    "related": [
      "attention",
      "vsa"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://arxiv.org/abs/2205.14135"
      ]
    ],
    "papers": [
      [
        "FlashAttention",
        "https://arxiv.org/abs/2205.14135"
      ]
    ]
  },
  {
    "id": "mla",
    "name": "Multi-head Latent Attention · MLA",
    "intro": "用低维 latent 表示压缩 KV，并结合独立的位置分量。",
    "formula": "hidden → KV latent; query / key also carry positional components",
    "body": "MLA 见 DeepSeek-V2。它并非把 KV heads 改成一个的 MQA；推理可利用 latent 缓存与投影吸收，具体缓存布局和 attention 后端必须匹配。这里解释机制，不绑定所有 DeepSeek 版本的维度。",
    "question": "MLA 等于 MQA 吗？",
    "answer": "不是。前者涉及低秩 latent 与位置分量，后者描述共享一组 K/V heads。",
    "related": [
      "gqa",
      "mqa",
      "kv-cache"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm/blob/3dc7a68ce45ce1b98c2879139465833611f117cb/vllm/model_executor/models/deepseek_v2.py"
      ]
    ],
    "papers": [
      [
        "DeepSeek-V2",
        "https://arxiv.org/abs/2405.04434"
      ]
    ]
  },
  {
    "id": "ring-attention",
    "name": "Ring Attention",
    "intro": "在设备间传递 KV 块，累积各块 attention。",
    "formula": "local Q × rotating KV blocks → online softmax merge",
    "body": "每个设备保留本地 query，依次处理环上传来的 KV 块。需维护全局归一化统计，不能对每块 softmax 后直接求平均。它是执行与通信方式，不要求把可见范围改成局部窗口。",
    "question": "Ring 是否只允许读取相邻设备的 token？",
    "answer": "不是，完成所需环路后可读取分布在所有参与设备上的 KV。",
    "related": [
      "sp",
      "usp",
      "ulysses"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/diffusion/attention/parallel/ring.py"
      ]
    ],
    "papers": [
      [
        "Ring Attention",
        "https://arxiv.org/abs/2310.01889"
      ]
    ]
  },
  {
    "id": "pp",
    "name": "Pipeline Parallelism · PP",
    "intro": "将不同层分配给顺序执行的设备阶段。",
    "formula": "layers₀ → activation → layers₁ → … → output",
    "body": "单个 microbatch 按层顺序穿过 pipeline；多个 microbatch 可交错执行以提高利用率。vLLM-Omni 的跨模型 stage 编排与单个 DiT 内部按 block 切分的 PP 不是同一边界。",
    "question": "PP 是否把同一层矩阵切开？",
    "answer": "不是，那是 TP 的典型职责。PP 主要切模型深度。",
    "related": [
      "tp",
      "dp",
      "stage-pipeline"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/docs/user_guide/diffusion/parallelism/pipeline_parallel.md"
      ]
    ],
    "papers": []
  },
  {
    "id": "ep",
    "name": "Expert Parallelism · EP",
    "intro": "将 MoE 专家分布到不同 rank，按路由交换 token。",
    "formula": "route → dispatch → local experts → combine",
    "body": "EP 通常需要 token dispatch 与结果 combine，可能使用 all-to-all。总专家数、每 token top-k、共享专家及负载分布决定计算与通信；EP 不意味着每个 token 都经过全部设备的专家。",
    "question": "EP 与 MoE top-k 是同一个参数吗？",
    "answer": "不是。EP 是设备分布，top-k 是每 token 激活的专家数。",
    "related": [
      "moe",
      "dp",
      "collectives"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/docs/user_guide/diffusion/parallelism/expert_parallel.md"
      ]
    ],
    "papers": []
  },
  {
    "id": "collectives",
    "name": "Collective communication · 集合通信",
    "intro": "跨 rank 交换、聚合或重分布张量。",
    "formula": "AllGather: shards→full; ReduceScatter: sum→shards; AllReduce: sum→all; AllToAll: redistribute",
    "body": "all-gather 拼接分片，all-reduce 聚合对应位置，reduce-scatter 聚合后分发分片，all-to-all 让各 rank 向其他 rank 发送不同块。通信原语不决定业务语义，必须同时说明张量轴、重复数据与归一化方式。",
    "question": "all-gather 和 all-reduce 能直接互换吗？",
    "answer": "不能，一个收集不同分片，一个归约对应元素。",
    "related": [
      "tp",
      "ulysses",
      "fsdp"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://docs.pytorch.org/docs/stable/distributed.html"
      ]
    ],
    "papers": []
  },
  {
    "id": "pcp",
    "name": "Prefill Context Parallelism · PCP",
    "intro": "在 prefill 阶段分摊长提示词的上下文计算。",
    "formula": "prompt context → multiple ranks → distributed prefill",
    "body": "PCP 针对提示词处理阶段，DCP 针对 decode 上下文。固定 vLLM 配置中 PCP 是实际 world-size 维度，DCP 可复用现有 rank；各后端支持的组合与尺寸约束并不相同。",
    "question": "PCP 与 DCP 都能当作额外卡数乘数吗？",
    "answer": "不能。此版本 PCP 扩展 world size，DCP 不额外扩展。",
    "related": [
      "dcp",
      "prefill-decode",
      "sp"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm/blob/3dc7a68ce45ce1b98c2879139465833611f117cb/vllm/config/parallel.py"
      ]
    ],
    "papers": []
  },
  {
    "id": "cfg",
    "name": "Classifier-Free Guidance · CFG",
    "intro": "组合有条件与无条件预测，调节条件引导。",
    "formula": "prediction = uncond + s × (cond − uncond)",
    "body": "这里采用常见 guidance scale 约定，s=1 返回 conditional prediction。实际模型可用负提示替代空条件，也可蒸馏 guidance；不能据名称假定始终运行两次网络。",
    "question": "guidance scale=1 时，上式还需要 uncond 结果吗？",
    "answer": "代数上不需要，但执行路径是否省略由实现决定。",
    "related": [
      "cfg-parallel",
      "ddpm",
      "flow-matching"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/docs/user_guide/diffusion/parallelism/cfg_parallel.md"
      ]
    ],
    "papers": [
      [
        "Classifier-Free Diffusion Guidance",
        "https://arxiv.org/abs/2207.12598"
      ]
    ]
  },
  {
    "id": "cfg-parallel",
    "name": "CFG Parallelism",
    "intro": "将 CFG 两路预测放到不同设备执行后合并。",
    "formula": "GPU₀: cond; GPU₁: uncond → CFG combine",
    "body": "CFG 并行切的是条件分支，不是序列、head 或层。只在实际计算多分支时有意义；已蒸馏且只执行单路预测的配置不应机械增加 CFG 并行度。",
    "question": "8 步蒸馏模型一定适合 CFG=2 吗？",
    "answer": "不一定，要确认是否存在独立的 conditional/unconditional 两路求值。",
    "related": [
      "cfg",
      "sp",
      "dp"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/docs/user_guide/diffusion/parallelism/cfg_parallel.md"
      ]
    ],
    "papers": []
  },
  {
    "id": "scheduler",
    "name": "Diffusion scheduler / solver",
    "intro": "根据网络预测与时间调度更新生成状态。",
    "formula": "x_next = SolverStep(x,t,model_prediction,schedule)",
    "body": "scheduler 可管理噪声水平、时间步与求解公式；Euler、DDIM 等的约定不同。必须核对网络预测的是噪声、数据还是速度，并核对时间方向。改变步数不等于改变网络层数。",
    "question": "同一个 DiT 能随意换 scheduler 吗？",
    "answer": "不能。预测参数化、时间网格和训练约定必须兼容。",
    "related": [
      "dit",
      "ddpm",
      "flow-matching"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/diffusion/models/minimax_h3/pipeline_minimax_h3.py"
      ]
    ],
    "papers": []
  },
  {
    "id": "diffusion-cache",
    "name": "Diffusion cache · 扩散计算复用",
    "intro": "跨采样步复用部分网络计算，减少重复执行。",
    "formula": "current step → reuse decision → cached residual or fresh compute",
    "body": "TeaCache 等依据变化量决定是否复用缓存。它与自回归 KV cache 的语义不同，通常引入近似；误差、阈值与校准依赖模型和步数。少步蒸馏下可跳过的工作可能很少。",
    "question": "TeaCache 与 KV cache 都是严格相同的复用吗？",
    "answer": "不是。TeaCache 类跨步近似复用与历史 KV 的复用边界不同。",
    "related": [
      "kv-cache",
      "scheduler",
      "dit"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/docs/user_guide/diffusion/cache_acceleration/teacache.md"
      ]
    ],
    "papers": []
  },
  {
    "id": "vae-parallel",
    "name": "VAE parallelism / tiling",
    "intro": "将媒体编解码的空间等工作分配给多个设备或分块执行。",
    "formula": "latent tiles → decode → overlap / boundary handling → media",
    "body": "空间分片与 tiling 需处理卷积感受野和边界；不能简单各自解码后无条件拼接。VAE 并行与 DiT 的 SP 是不同组件上的执行策略，模型支持与输出误差应分别验证。",
    "question": "DiT 已经 SP=4，VAE 就自动并行了吗？",
    "answer": "不一定。它们是独立组件与配置。",
    "related": [
      "vae",
      "sp"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/docs/user_guide/diffusion/parallelism/vae_parallelism.md"
      ]
    ],
    "papers": []
  },
  {
    "id": "prefill-decode",
    "name": "Prefill / decode",
    "intro": "提示词批量建缓存，然后逐步生成新 token。",
    "formula": "prompt → prefill KV → decode token → append KV → repeat",
    "body": "prefill 通常处理提示词的多个位置，decode 使用缓存处理新位置。两阶段的计算形状与瓶颈不同；单次总耗时不能代替 TTFT、token 间延迟等指标。",
    "question": "KV cache 建好后 decode 是否不再需要计算新的 K/V？",
    "answer": "仍需计算当前新 token 的 K/V，并加入缓存。",
    "related": [
      "kv-cache",
      "dcp",
      "pcp"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm/blob/3dc7a68ce45ce1b98c2879139465833611f117cb/docs/serving/parallelism_scaling.md"
      ]
    ],
    "papers": []
  },
  {
    "id": "paged-attention",
    "name": "PagedAttention",
    "intro": "用逻辑块到物理块映射管理 KV 存储。",
    "formula": "logical KV blocks → block table → physical cache blocks",
    "body": "PagedAttention 允许非连续物理内存存放序列 KV，减少碎片并支持块级共享。它是缓存布局与 attention 访问机制，不是按内容丢弃 token 的稀疏 attention，也不自动减少每个 token 的 KV 表示维度。",
    "question": "PagedAttention 是否让 query 只看少数 KV blocks？",
    "answer": "不是，普通完整上下文仍需读取有效上下文，分页改变存放和访问方式。",
    "related": [
      "kv-cache",
      "prefix-caching",
      "flash-attention"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm/blob/3dc7a68ce45ce1b98c2879139465833611f117cb/docs/design/paged_attention.md"
      ]
    ],
    "papers": [
      [
        "Efficient Memory Management for Large Language Model Serving with PagedAttention",
        "https://arxiv.org/abs/2309.06180"
      ]
    ]
  },
  {
    "id": "prefix-caching",
    "name": "Prefix caching · 前缀缓存",
    "intro": "多个请求复用匹配前缀已计算的 KV blocks。",
    "formula": "matching prefix blocks → reuse KV; remaining tokens → compute",
    "body": "前缀复用要求 token、模型条件与缓存键等兼容。不能仅凭文本看起来相同就共享多模态或不同 LoRA 的结果。它主要减少匹配部分的 prefill，不能消除后续 decode。",
    "question": "命中前缀缓存是否让整条回复不用生成？",
    "answer": "不会，只复用兼容的已计算前缀状态。",
    "related": [
      "kv-cache",
      "paged-attention",
      "prefill-decode"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm/blob/3dc7a68ce45ce1b98c2879139465833611f117cb/docs/features/automatic_prefix_caching.md"
      ]
    ],
    "papers": []
  },
  {
    "id": "continuous-batching",
    "name": "Continuous batching",
    "intro": "在迭代边界动态加入和移除请求。",
    "formula": "schedule iteration → execute tokens → update requests → reschedule",
    "body": "服务引擎不必等待整个静态 batch 的所有请求同时结束，完成的请求可释放位置，新请求可加入。受 token budget、KV 容量、优先级和执行图形状等约束，并不意味着任意请求都立刻执行。",
    "question": "continuous batching 是否等于把请求全部拼成同一上下文？",
    "answer": "不是。每个请求保持自己的序列、mask 与缓存。",
    "related": [
      "prefill-decode",
      "chunked-prefill",
      "paged-attention"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm/blob/3dc7a68ce45ce1b98c2879139465833611f117cb/vllm/v1/core/sched/scheduler.py"
      ]
    ],
    "papers": []
  },
  {
    "id": "chunked-prefill",
    "name": "Chunked prefill",
    "intro": "把长提示词拆成多个调度迭代处理。",
    "formula": "long prompt → chunk₀ → chunk₁ → … → prefill complete",
    "body": "分块可让长 prefill 与 decode 工作共享调度预算。各块仍需遵守因果关系与既有 KV；它不等于将块当作独立请求，也不等于 DCP 的跨设备上下文分片。",
    "question": "chunked prefill 一定使用多个 GPU 吗？",
    "answer": "不需要，它首先是调度与执行粒度策略。",
    "related": [
      "prefill-decode",
      "continuous-batching",
      "dcp"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm/blob/3dc7a68ce45ce1b98c2879139465833611f117cb/vllm/v1/core/sched/scheduler.py"
      ]
    ],
    "papers": []
  },
  {
    "id": "speculative-decoding",
    "name": "Speculative decoding · 推测解码",
    "intro": "先提出多个候选 token，再用目标模型验证。",
    "formula": "draft candidates → target verification → accept / correct → continue",
    "body": "草稿来源可以是小模型或其他机制。正确的随机采样校正可保持目标分布，但这不是“候选全都接受”；加速取决于接受率与草稿和验证成本。具体 greedy 与随机验证路径不同。",
    "question": "候选被拒绝后能直接丢掉校正继续采样吗？",
    "answer": "不能。要按对应验证算法处理拒绝与后续采样。",
    "related": [
      "prefill-decode",
      "kv-cache"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm/blob/3dc7a68ce45ce1b98c2879139465833611f117cb/vllm/v1/spec_decode"
      ]
    ],
    "papers": [
      [
        "Fast Inference from Transformers via Speculative Decoding",
        "https://arxiv.org/abs/2211.17192"
      ]
    ]
  },
  {
    "id": "cuda-graphs",
    "name": "CUDA Graphs",
    "intro": "捕获并重放 GPU 执行，减少重复 CPU launch 开销。",
    "formula": "warmup → capture compatible execution → replay",
    "body": "CUDA Graph 复用已捕获的执行依赖，需要稳定的内存与受支持形状。动态请求可借助 bucket、padding 或部分 capture 适配；图重放不减少模型理论计算量，也不等于缓存网络输出。",
    "question": "CUDA Graph 是否避免每个 token 的矩阵乘法？",
    "answer": "不是，它主要减少执行提交开销，算子仍运行。",
    "related": [
      "continuous-batching",
      "chunked-prefill"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm/blob/3dc7a68ce45ce1b98c2879139465833611f117cb/docs/design/cuda_graphs.md"
      ]
    ],
    "papers": []
  },
  {
    "id": "quantization",
    "name": "Quantization · 量化",
    "intro": "用低精度表示权重、激活或 KV，以降低存储和部分计算成本。",
    "formula": "q = clamp(round(x / scale)); x̂ = scale × q",
    "body": "weight-only、W8A8、FP8、FP4 与 KV quantization 是不同方案。scale 粒度、零点、打包格式与 kernel 必须匹配；低精度文件变小不保证任意硬件都更快，也不保证误差可忽略。",
    "question": "INT4 权重是否说明 attention Q/K/V 也以 INT4 计算？",
    "answer": "不一定。weight-only 与激活、attention 的精度需要分别确认。",
    "related": [
      "kv-cache",
      "lora",
      "cpu-offload"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/docs/user_guide/quantization/overview.md"
      ]
    ],
    "papers": []
  },
  {
    "id": "lora",
    "name": "LoRA · Low-Rank Adaptation",
    "intro": "用低秩矩阵表示对基础权重的增量。",
    "formula": "W′ = W + (α/r) BA",
    "body": "LoRA 通常冻结基础权重，训练较小的 A/B。运行时可动态应用适配器，也可在兼容精度与布局下合并。融合 QKV、分片 TP 和打包量化权重需要明确对应关系，不能按名称直接拼接矩阵。",
    "question": "LoRA rank 就是 TP rank 吗？",
    "answer": "不是。前者是低秩分解维度，后者通常指分布式进程编号。",
    "related": [
      "tp",
      "quantization"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/docs/user_guide/diffusion/lora.md"
      ]
    ],
    "papers": [
      [
        "LoRA: Low-Rank Adaptation of Large Language Models",
        "https://arxiv.org/abs/2106.09685"
      ]
    ]
  },
  {
    "id": "cpu-offload",
    "name": "CPU offload",
    "intro": "将暂时不用的权重等状态放在 CPU，需要时再传回设备。",
    "formula": "CPU resident weights → transfer / prefetch → GPU compute → release",
    "body": "offload 通过主机内存与传输换取设备显存。按模块或层预取需要正确的生命周期管理；异步传输不代表必然隐藏通信，也不等同参数分片。",
    "question": "offload 与 HSDP 是否都是相同的权重分片？",
    "answer": "不是。offload 改变存放层级，HSDP 改变设备组中的分片和复制方式，可按支持情况组合。",
    "related": [
      "hsdp",
      "quantization"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/docs/user_guide/diffusion/cpu_offload.md"
      ]
    ],
    "papers": []
  },
  {
    "id": "stage-pipeline",
    "name": "Omni stage pipeline",
    "intro": "将不同模型或生成组件组织成有数据依赖的执行阶段。",
    "formula": "encoder / thinker → intermediate payload → generator / decoder",
    "body": "Omni stage 可包含不同模型、资源与输出模态。它不同于把同一个 Transformer 按层切开的 PP；中间 payload 的 schema、请求对应关系、传输方式与终止传播都是执行契约。流式输出还需要处理块顺序和背压。",
    "question": "Thinker→Talker 两个 stage 是否说明使用了模型层内 PP=2？",
    "answer": "不是。跨组件编排与层内 pipeline parallel 是两个层次。",
    "related": [
      "pp",
      "vae",
      "continuous-batching"
    ],
    "sources": [
      [
        "实现或官方说明",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/docs/design/feature/omni_connectors/stage_payload.md"
      ]
    ],
    "papers": []
  }
];
