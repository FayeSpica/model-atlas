export default [
  {
    "id": "swiglu",
    "name": "SwiGLU",
    "intro": "将 SiLU 激活的 gate 与另一份线性投影逐元素相乘。",
    "formula": "FFN(x) = (SiLU(xWgate) ⊙ xWup) Wdown",
    "body": "SwiGLU 是 GLU 的激活变体，用于前馈网络。gate 与 up 从同一输入分别投影，gate 经过 SiLU，再与 up 逐元素相乘，down 投影回模型宽度。它不是 MoE 的专家选择器。",
    "question": "SwiGLU 的 ⊙ 是矩阵乘法吗？",
    "answer": "不是，是相同形状张量之间的逐元素乘法；线性投影中的乘法才是矩阵乘法。",
    "related": [
      "moe"
    ]
  },
  {
    "id": "ddpm",
    "name": "DDPM",
    "intro": "通过逐步加噪训练模型，学习反向去噪生成。",
    "formula": "xₜ = √ᾱₜ x₀ + √(1−ᾱₜ) ε; ε ~ N(0,I); Lsimple = E[‖ε − εθ(xₜ,t)‖²]",
    "body": "DDPM 定义离散时间的前向加噪过程，并学习反向生成过程。这里列出原论文常用的噪声预测简化目标；采样从噪声开始，按反向步骤逐渐生成数据。训练目标、网络骨干和采样器是不同选择，不能把所有 DiT 都叫作 DDPM。",
    "question": "去噪网络使用 Transformer，就一定采用 DDPM 训练目标吗？",
    "answer": "不一定。Transformer 是网络结构；它也可以预测 Flow Matching 的速度场。具体目标与采样过程需要查看模型配置和实现。",
    "related": [
      "flow-matching",
      "dit",
      "vae"
    ]
  },
  {
    "id": "flow-matching",
    "name": "Flow Matching",
    "intro": "回归概率路径上的速度场，用 ODE 将噪声分布输送到数据分布。",
    "formula": "L_CFM = E[‖vθ(xₜ,t) − uₜ(xₜ | condition)‖²]; dxₜ/dt = vθ(xₜ,t)",
    "body": "Flow Matching 是训练连续生成流的方法，通过条件概率路径构造可回归的速度目标。生成时用 ODE 求解器沿学习到的速度场积分。本页约定 t 从噪声端走向数据端；具体实现可能反转时间。",
    "sections": [
      [
        "直线路径只是一个例子",
        "若 x₀ 是噪声、x₁ 是数据，选择 xₜ=(1−t)x₀+t x₁，则该条件路径的速度为 x₁−x₀。Flow Matching 支持更一般的概率路径，并不只指这条直线。"
      ],
      [
        "网络与求解器",
        "DiT 可以作为速度场网络；Euler 等求解器负责更新状态。训练时的速度目标、时间调度与推理步数需要分别核对。"
      ]
    ],
    "question": "Flow Matching 就是 Euler 采样器吗？",
    "answer": "不是。前者规定速度场的训练目标，后者是一种数值求解方法。同一个速度场可用不同求解器积分。",
    "related": [
      "ddpm",
      "dit",
      "vae"
    ]
  }
];
