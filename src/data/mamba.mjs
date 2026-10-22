export default {
  "id": "mamba",
  "name": "Mamba · Selective SSM",
  "intro": "用输入相关的状态更新选择保留哪些历史信息，而不是逐项读取历史 KV。",
  "formula": "Δₜ = softplus(WΔ rₜ + bΔ); Āₜ = exp(Δₜ A); hₜ = Āₜ ⊙ hₜ₋₁ + (Δₜ Bₜ) ⊙ uₜ; yₜ = Cₜ hₜ + D ⊙ uₜ",
  "body": "Mamba 是以选择性状态空间模型为核心的序列架构。当前输入决定 Δ、B、C，从而控制状态如何衰减、写入和读出。上式对应官方 Mamba-1 单步实现的离散更新，省略 batch、通道与状态维的广播；不是所有 SSM 的统一离散化公式。",
  "figure": "mamba-mechanism",
  "figureAlt": "Mamba-1 的输入投影、因果卷积、选择性状态更新和 SiLU 门控，以及独立的乘法与加法",
  "related": [
    "attention",
    "kv-cache"
  ],
  "sections": [
    [
      "先看一个 token",
      "输入投影拆出内容流与门控流。内容流经过 depthwise causal Conv1d 和 SiLU，再产生 Δ、B、C；SSM 读写状态，输出叠加 D×u，乘上 SiLU(z)，最后投影回模型宽度。图中是 mixer 内部，不包含外层 block 的 norm 与 residual。"
    ],
    [
      "selective 选择的是什么",
      "A 与 D 是学习得到的参数；Δ、B、C 随输入 token 变化。Δ 调整衰减与写入尺度，B 控制写入，C 控制读出。它不是 top-k 选专家，也不是 VSA 选择视频块。"
    ],
    [
      "与 Attention 的区别",
      "普通完整上下文 Attention 让当前 query 与历史 keys 匹配，读取各位置的 values。Mamba 将历史累积进状态，再读取该状态；纯 Mamba-1 mixer 没有 Q/K/V 头，也不应标成 MHA、GQA 或 MQA。"
    ],
    [
      "缓存里有什么",
      "单步推理维护两份缓存：conv_state 保存短卷积所需的最近输入，ssm_state 保存递归状态。固定模型与 batch 下，两者尺寸不随已经生成的 token 数增长；这不意味着状态能无损保存任意长历史，也不代表整个请求只占固定显存。"
    ],
    [
      "串行递归与并行扫描",
      "decode 可以逐 token 更新状态。训练或 prefill 的整段输入可用 selective scan 计算，递归公式并不要求所有阶段都按 Python 循环串行运行。中间激活与训练内存仍取决于序列长度和实现。"
    ],
    [
      "Mamba-1、Mamba-2 与混合模型",
      "本页依据原始 Mamba-1。Mamba-2 使用 SSD 形式，不能把两者内部操作照搬。混合模型可同时含 Attention 与递归层；框架中的状态缓存管理类名称也不能单独证明具体模型采用原始 Mamba。"
    ]
  ],
  "question": "Mamba 没有不断追加的 KV cache，是否意味着它不需要推理状态？",
  "answer": "仍需要。Mamba-1 维护卷积缓存与 SSM 状态，随着新 token 原地更新；它们不是按每个历史 token 追加的 K/V。",
  "sources": [
    [
      "Mamba-1 官方实现与状态缓存",
      "https://github.com/state-spaces/mamba/blob/e9594ce1c732d97440f0332fdc43170a2294dbfa/mamba_ssm/modules/mamba_simple.py"
    ],
    [
      "Mamba 论文",
      "https://arxiv.org/abs/2312.00752"
    ],
    [
      "Mamba-2 / SSD 论文",
      "https://arxiv.org/abs/2405.21060"
    ]
  ]
};
