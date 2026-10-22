export default [
  {
    "slug": "fishaudio-drama3",
    "name": "drama-3",
    "family": "Fish Audio",
    "category": "语音生成",
    "kind": "Hybrid MoE",
    "lead": "40 层混合 Gated DeltaNet / GQA 主干生成语义码，再用共享增强层和逐码本预测层补全语音。",
    "concepts": [
      "attention",
      "moe",
      "kv-cache",
      "gqa"
    ],
    "facts": [
      "40 backbone layers",
      "10 codebooks",
      "FP8 experts"
    ],
    "scope": "以 fishaudio/drama-3 固定配置及 FishOmni 实现展开。35B / 3B 是模型标称总参数 / 激活参数；不包含 codec 解码器的额外存储。主干层数与帧内码本预测深度分别展示。",
    "sections": [
      [
        "主干每四层一组",
        "第 3、7、11、…、39 层使用 full attention，其余 30 层是线性注意力 Gated DeltaNet。每层 FFN 为 MoE：256 个路由专家选 8 个，每专家宽度 512，另有宽度 512 的 gated shared expert。"
      ],
      [
        "两类注意力",
        "Gated DeltaNet 使用短卷积与递归状态，不能画成读取完整历史 KV 的 softmax attention。Full attention 使用 16Q / 2KV、head_dim 256，Q/K norm、partial RoPE 与输出门控；残差宽度仍为 2,048。"
      ],
      [
        "一帧不止一个码",
        "主干先预测 semantic band 的首个码；audio tower 有 4 个 shared enrichment layers，再有 9 个逐码本预测层，补齐总共 10 个码本。n_layer=4 不是整个 tower 只有四层。"
      ],
      [
        "从码本到波形",
        "Codec 解码器将码本帧转成音频。码本编号、码本深度和音频采样点是不同轴；tower 在帧内补码不代表时间轴前进了九帧。"
      ]
    ],
    "question": "为什么 audio tower 不能只画成 4 层？",
    "answer": "实现按 shared_enrichment_layers + num_codebooks − 1 构造，即 4 + 10 − 1 = 13 层；后九层逐码本预测。",
    "revision": "da572cddb38383deae9caef33b8d490e292ef071",
    "modelId": "fishaudio/drama-3",
    "figure": "fishaudio-drama3-layers",
    "figureAlt": "drama-3 的组件路径、层分布和内部子层",
    "figureNote": "Full GQA at layers 3, 7, …, 39; Gated DeltaNet elsewhere. Green: MoE. Gold: audio tower.",
    "sources": [
      [
        "模型实现",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/fish_omni/fish_omni_model.py"
      ],
      [
        "固定版本的权重与配置",
        "https://huggingface.co/fishaudio/drama-3/tree/e0a9218aa48888270f06ef1ed9ea67622c0e17d2"
      ],
      [
        "codebook_tower.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/fish_omni/codebook_tower.py"
      ],
      [
        "gdn.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/fish_omni/gdn.py"
      ],
      [
        "pipeline.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/fish_omni/pipeline.py"
      ]
    ],
    "nodes": [
      [
        "文本与参考音频",
        "Prompt",
        "Text / reference",
        "文字、说话人标记及参考音频形成条件。"
      ],
      [
        "混合主干",
        "40 layers",
        "hidden 2048",
        "主干沿时间生成语义码。"
      ],
      [
        "语义码",
        "Semantic head",
        "4096-code band",
        "选择当前帧语义码。"
      ],
      [
        "码本补全",
        "4 + 9 layers",
        "10 codebooks",
        "tower 补齐帧内码本。"
      ],
      [
        "音频解码",
        "Codec",
        "Codes → waveform",
        "离散码转成波形。"
      ]
    ],
    "architecture": "moe",
    "parameterCount": "35B",
    "activeParameterCount": "3B",
    "parameterLabel": "模型标称 35B 总参数 / 3B 激活参数"
  },
  {
    "slug": "yue2",
    "name": "YuE2-3B",
    "family": "Multimodal Art Projection",
    "category": "音乐生成",
    "kind": "AR + Flow Matching",
    "lead": "AR 路径生成符号计划，NAR 路径在计划条件下求解连续音频 latent，最后由立体声 VAE 解码。",
    "concepts": [
      "attention",
      "rope",
      "vae",
      "kv-cache",
      "gqa"
    ],
    "facts": [
      "28 AR + 28 NAR",
      "64-d latent",
      "48 kHz stereo"
    ],
    "scope": "以 m-a-p/YuE2-3B 与 YuE2-Vae 配置展开。3.63B 为主 checkpoint 的 safetensors 参数总数，不含独立 VAE；28 个层号各有 AR 与 NAR 权重，不是两条路径共享全部投影。",
    "sections": [
      [
        "AR 与 NAR 如何相连",
        "AR 先生成可编辑的符号计划。NAR 读取计划逐层的 K/V，并读取当前 noisy latent 的 K/V，在连续音频轴上预测更新方向。NAR 不需要把每个采样点作为离散 token 输出。"
      ],
      [
        "同层号，两套权重",
        "每个层编号同时有 self_attn/mlp 与 nar_self_attn/nar_mlp。NAR 使用独立投影和 FFN，Q/K RMSNorm 与 RoPE 后的 query 可以访问 AR 前缀和当前 latent。"
      ],
      [
        "连续空间的桥",
        "vae2llm 把 64 维 latent 投到 2,048 维；加入时间 embedding 与位置 embedding，28 层后由 llm2vae 投回 64 维。ODE 多次调用同一套 NAR 权重，不增加网络层数。"
      ],
      [
        "VAE 解码",
        "独立 YuE2-Vae 将 64 通道 latent 解码为 48 kHz 立体声音频；六级上采样 strides 为 2、2、4、4、5、6，总倍率 1,920。"
      ]
    ],
    "question": "28 层是否表示 AR 与 NAR 共用同一组 attention？",
    "answer": "不是。checkpoint 同时保存普通与 nar_ 权重；每条路径有 28 层，NAR 在每层读取 AR 条件 K/V。",
    "revision": "da572cddb38383deae9caef33b8d490e292ef071",
    "modelId": "m-a-p/YuE2-3B",
    "figure": "yue2-layers",
    "figureAlt": "YuE2-3B 的组件路径、层分布和内部子层",
    "figureNote": "AR and NAR are separate parameter paths. Repeat NAR for ODE steps; layer count stays 28.",
    "sources": [
      [
        "模型实现",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/yue2/yue2.py"
      ],
      [
        "固定版本的权重与配置",
        "https://huggingface.co/m-a-p/YuE2-3B/tree/8f24312f187763b9854adeec87e437e2b03bbff1"
      ],
      [
        "pipeline.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/yue2/pipeline.py"
      ],
      [
        "独立 VAE 配置",
        "https://huggingface.co/m-a-p/YuE2-Vae/blob/152733a19ad43aa67e367f9b5503ef8075bb5126/config.json"
      ]
    ],
    "nodes": [
      [
        "生成计划",
        "AR · 28 layers",
        "Token sequence",
        "生成符号计划。"
      ],
      [
        "条件 K/V",
        "Per-layer cache",
        "28 layer caches",
        "为 NAR 保存计划条件。"
      ],
      [
        "连续生成",
        "NAR · 28 layers",
        "64-d latent",
        "多步更新噪声 latent。"
      ],
      [
        "VAE 解码",
        "6 upsample blocks",
        "×1920",
        "还原音频时间分辨率。"
      ],
      [
        "波形输出",
        "48 kHz stereo",
        "2 channels",
        "输出左右声道。"
      ]
    ],
    "architecture": "dense",
    "parameterCount": "3.63B",
    "parameterTotal": 3630684224
  },
  {
    "slug": "minimax-music3",
    "name": "MiniMax-Music3",
    "family": "MiniMax",
    "category": "音乐生成",
    "kind": "Hybrid-LM + DiT",
    "lead": "Global LLM 沿时间规划音乐，Local decoder 补齐帧内码本；连续 hidden 条件再驱动声学 DiT 和 vocoder。",
    "concepts": [
      "attention",
      "rope",
      "dit",
      "vae",
      "mha",
      "gqa"
    ],
    "facts": [
      "36 Global + 4 Local",
      "36 acoustic DiT",
      "8 codebooks",
      "44.1 kHz stereo"
    ],
    "scope": "按 MiniMax-Music3 的 language_model、rvq_depth_decoder、condition_encoder、transformer 与 vocoder 配置分组件绘制。Global、Local 与声学 DiT 使用三套权重；不把仓库内参考实现的重复权重计作执行路径。",
    "sections": [
      [
        "两个自回归方向",
        "Global 是 36 层 Qwen3，hidden 4,096，32Q / 8KV、head_dim 128，MLP 宽度 12,288。Local 为 4 层 causal Transformer，16 heads、head_dim 256、MLP 宽度 6,144，在每帧内补齐其余七个码本。"
      ],
      [
        "合成条件不是只查码表",
        "声学 stage 消费八路 4,096 维 hidden slices；condition encoder 将它们折叠到 2,048 维并对齐 vocoder latent 的时间网格。不要把 32,768 维拼接当成 DiT hidden 宽度。"
      ],
      [
        "声学 DiT",
        "36 层 DiT 工作宽度 2,048，32 heads × 64，FFN 宽度 8,192；输入拼接 noisy latent、零块与条件，先从 2,304 维投影。双向 attention 使用 partial RoPE，FFN 是 gated SiLU。"
      ],
      [
        "音频重建",
        "Flow Matching 迭代得到 128 通道立体声 latent。解码时拆成两路 64 通道，沿 batch 合并交给 DAV/vocoder，再恢复双声道 44.1 kHz 波形。"
      ]
    ],
    "question": "为什么 Global 与 DiT 都是 36 层却不能画成同一个网络？",
    "answer": "两者的权重、输入和宽度不同：Global 沿离散时间生成，DiT 在连续 latent 上预测流场。相同层数不表示共享计算。",
    "revision": "da572cddb38383deae9caef33b8d490e292ef071",
    "modelId": "MiniMaxAI/MiniMax-Music3",
    "figure": "minimax-music3-layers",
    "figureAlt": "MiniMax-Music3 的组件路径、层分布和内部子层",
    "figureNote": "Global: 25 Hz frame axis. Local: codebook depth axis. Acoustic DiT repeats over solver steps.",
    "sources": [
      [
        "模型实现",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/minimax_music3/talker.py"
      ],
      [
        "固定版本的权重与配置",
        "https://huggingface.co/MiniMaxAI/MiniMax-Music3/tree/fbdf52fbaaca799592917417eb05f1899f1255ec"
      ],
      [
        "rvq_decoder.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/minimax_music3/rvq_decoder.py"
      ],
      [
        "dit.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/minimax_music3/dit.py"
      ],
      [
        "dav.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/minimax_music3/dav.py"
      ],
      [
        "pipeline.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/minimax_music3/pipeline.py"
      ],
      [
        "参数或权重体积的 index metadata",
        "https://huggingface.co/MiniMaxAI/MiniMax-Music3/blob/fbdf52fbaaca799592917417eb05f1899f1255ec/language_model/model.safetensors.index.json"
      ]
    ],
    "nodes": [
      [
        "音乐规划",
        "Global · 36 layers",
        "4096 hidden",
        "沿时间生成首码。"
      ],
      [
        "帧内补全",
        "Local · 4 layers",
        "8 codebooks",
        "生成其余七码与 hidden。"
      ],
      [
        "条件编码",
        "8 hidden slices",
        "32768 → 2048",
        "折叠并对齐条件。"
      ],
      [
        "声学生成",
        "DiT · 36 layers",
        "128-d latent",
        "重复 DiT 求解流场。"
      ],
      [
        "音频重建",
        "DAV / vocoder",
        "44.1 kHz",
        "解码立体声。"
      ]
    ],
    "architecture": "dense",
    "parameterCount": "Global 8.58B",
    "parameterTotal": 8584475648,
    "parameterLabel": "Global LLM：8,584,475,648 参数；不含 Local、声学 DiT 和 vocoder"
  },
  {
    "slug": "qwen3-tts",
    "name": "Qwen3-TTS-12Hz-1.7B-CustomVoice",
    "family": "Qwen",
    "category": "语音生成",
    "kind": "Dense AR + Codec",
    "lead": "Talker 沿时间生成首个语音码，Code Predictor 在帧内补齐 16 个码本，再由 12Hz tokenizer 解码为波形。",
    "concepts": [
      "attention",
      "rope",
      "kv-cache",
      "gqa"
    ],
    "facts": [
      "28 Talker + 5 Predictor",
      "16 codebooks",
      "12Hz tokenizer"
    ],
    "scope": "采用 1.7B CustomVoice 规格；1.92B 为该主 checkpoint 的 safetensors 参数总数，不包含独立 speech tokenizer。Base 的参考音频克隆输入路径与 CustomVoice 的预设说话人路径应分别理解。",
    "sections": [
      [
        "Talker 的输入",
        "文字 embedding 经投影后与语音条件组织为 Talker 输入。语言、说话人及控制 token 提供条件；28 层 Talker hidden 为 2,048，16Q / 8KV、head_dim 128，FFN 宽度 6,144。"
      ],
      [
        "Code Predictor 的深度",
        "5 层 Code Predictor hidden 为 1,024，16Q / 8KV、head_dim 128，FFN 宽度 3,072。每个时间帧由 Talker 给出首码，再预测剩余 15 级；5 是网络层数，15 是帧内预测次数。"
      ],
      [
        "从码本到声音",
        "总共 16 组码本构成一帧 codec 表示，由 12Hz speech tokenizer 的解码器转成波形。12Hz 是 codec 帧率，不是输出音频采样率。"
      ],
      [
        "部署与模型层次",
        "默认 pipeline 为 Talker → Code2Wav 两个 stage。Code Predictor 属于 Talker 内部；融合部署可将波形解码放进同一 stage，网络组件关系仍然存在。"
      ]
    ],
    "question": "Code Predictor 只有 5 层，为什么会预测 15 个后续码？",
    "answer": "同一套 5 层网络在码本深度方向重复调用；层数和预测次数是两种不同计数。",
    "revision": "da572cddb38383deae9caef33b8d490e292ef071",
    "modelId": "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
    "figure": "qwen3-tts-layers",
    "figureAlt": "Qwen3-TTS-12Hz-1.7B-CustomVoice 的组件路径、层分布和内部子层",
    "figureNote": "CustomVoice checkpoint. 28 network layers ≠ 15 codebook predictions. Tokenizer is a separate component.",
    "sources": [
      [
        "模型实现",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/qwen3_tts/qwen3_tts_talker.py"
      ],
      [
        "固定版本的权重与配置",
        "https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice/tree/0c0e3051f131929182e2c023b9537f8b1c68adfe"
      ],
      [
        "qwen3_tts_code_predictor_vllm.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/qwen3_tts/qwen3_tts_code_predictor_vllm.py"
      ],
      [
        "qwen3_tts_code2wav.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/qwen3_tts/qwen3_tts_code2wav.py"
      ],
      [
        "pipeline.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/qwen3_tts/pipeline.py"
      ]
    ],
    "nodes": [
      [
        "输入条件",
        "Text + voice",
        "Prompt",
        "文字、语言及说话人条件。"
      ],
      [
        "时间生成",
        "Talker · 28 layers",
        "2048 hidden",
        "预测当前帧首码。"
      ],
      [
        "码本补全",
        "Predictor · 5 layers",
        "15 subsequent codes",
        "帧内深度预测。"
      ],
      [
        "音频解码",
        "12Hz tokenizer",
        "16 codes / frame",
        "码本转波形。"
      ],
      [
        "输出",
        "Waveform",
        "Audio chunks",
        "按配置输出分块音频。"
      ]
    ],
    "architecture": "dense",
    "parameterCount": "1.92B",
    "parameterTotal": 1916676352
  },
  {
    "slug": "qwen-image-2-1",
    "name": "Qwen-Image-2.1",
    "family": "Qwen",
    "category": "图像生成",
    "kind": "Single-stream DiT",
    "lead": "Qwen3-VL 编码文字与参考图；32 层单流 DiT 以 block-causal attention 更新目标 latent，VAE 重建 RGBA 图像。",
    "concepts": [
      "attention",
      "rope",
      "dit",
      "vae",
      "kv-cache",
      "mha",
      "gqa"
    ],
    "facts": [
      "32 DiT layers",
      "64-d latent",
      "Block-causal",
      "RGBA"
    ],
    "scope": "依据 Qwen-Image-2.1 固定配置；图将条件编码器、生成 Transformer 与 VAE 分开。参数标签只统计生成 DiT，不包含 Qwen3-VL 和 VAE。目标 latent 不作 2×2 patch 拼接。",
    "sections": [
      [
        "条件与生成是两套网络",
        "条件编码器为 Qwen3-VL：文本主干 36 层、hidden 4,096，视觉编码器 27 层。它的 hidden states 作为 DiT 条件，不是先生成一段回答再画图。参考图还经 VAE 编码，形成单独的 latent 条件。"
      ],
      [
        "单流与 block-causal",
        "32 层 DiT hidden 为 4,096，32 heads × 128，MLP ratio 3，即宽度 12,288。文字与图像在一个序列内计算；同一图像块内部双向可见，前缀不读取后面的目标图像。"
      ],
      [
        "每个 block 的内部",
        "LayerNorm 后执行时间条件 scale 调制，再进行 QKV、Q/K RMSNorm、三轴 RoPE 与 attention，经 tanh gate 加回 residual。第二子层为相同类型的调制、SwiGLU 与 gated residual；该版本调制不含 shift。"
      ],
      [
        "为什么可以缓存前缀",
        "causal_condition=True 时，前缀不读取目标且采用固定 t=0 调制。首步保存前缀 K/V，后续采样步只更新目标 token 并读取缓存；不能仅凭文字未变就将此优化推广到任意 DiT。"
      ],
      [
        "VAE 与输出",
        "VAE latent 为 64 通道，空间压缩 16 倍，输入和输出均支持 4 通道。1024×1024 图像对应 64×64=4,096 个 unpatched 生成 token；采样完成后反归一化并解码。"
      ]
    ],
    "question": "单流为什么仍能只更新目标图像？",
    "answer": "block-causal 保持条件前缀不依赖目标，且前缀使用固定时间调制。建立前缀缓存后，只对目标执行随时间变化的层计算。",
    "revision": "da572cddb38383deae9caef33b8d490e292ef071",
    "modelId": "Qwen/Qwen-Image-2.1",
    "figure": "qwen-image-2-1-layers",
    "figureAlt": "Qwen-Image-2.1 的组件路径、层分布和内部子层",
    "figureNote": "Blue: condition encoder. Gold: generation DiT. Prefix t=0; target uses the current solver timestep.",
    "sources": [
      [
        "模型实现",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/diffusion/models/qwen_image_21/qwen_image_21_transformer.py"
      ],
      [
        "固定版本的权重与配置",
        "https://huggingface.co/Qwen/Qwen-Image-2.1/tree/d26bb61231c349cf6b7896fa83353113880e1ba3"
      ],
      [
        "pipeline_qwen_image_21.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/diffusion/models/qwen_image_21/pipeline_qwen_image_21.py"
      ],
      [
        "参数或权重体积的 index metadata",
        "https://huggingface.co/Qwen/Qwen-Image-2.1/blob/d26bb61231c349cf6b7896fa83353113880e1ba3/transformer/diffusion_pytorch_model.safetensors.index.json"
      ]
    ],
    "nodes": [
      [
        "条件编码",
        "Qwen3-VL",
        "36 text + 27 vision",
        "提取文字与图像条件。"
      ],
      [
        "参考编码",
        "VAE encoder",
        "64 channels",
        "参考图转 latent。"
      ],
      [
        "联合生成",
        "DiT · 32 layers",
        "4096 hidden",
        "目标与前缀按 block-causal 交互。"
      ],
      [
        "采样更新",
        "Euler scheduler",
        "Target latent",
        "多步更新目标，复用前缀。"
      ],
      [
        "图像解码",
        "VAE decoder",
        "RGBA",
        "输出图像。"
      ]
    ],
    "architecture": "dense",
    "parameterCount": "DiT 7.12B",
    "parameterTotal": 7115124736,
    "parameterLabel": "生成 DiT：7,115,124,736 参数；不含 Qwen3-VL 与 VAE"
  },
  {
    "slug": "minimax-h3",
    "name": "MiniMax-H3",
    "family": "MiniMax",
    "category": "视频与音频",
    "kind": "Joint DiT",
    "lead": "文本、视频、音频 token 进入 50 层联合 DiT；模态与时间条件控制每层调制，媒体 VAE 负责编码和重建。",
    "concepts": [
      "attention",
      "rope",
      "dit",
      "vae",
      "mha"
    ],
    "facts": [
      "50 DiT layers",
      "2 token refiners",
      "56 × 128 heads",
      "FL2VA / Ref2VA"
    ],
    "scope": "按 MiniMax-H3 的 FL2VA 与 Ref2VA 固定配置展开共同 DiT 结构。两者使用不同的任务权重分区；图示为 TP=1 的逻辑形状，不固定 GPU 数量、窗口长度或采样步数。",
    "sections": [
      [
        "上层组件",
        "Qwen3-VL 产生 5,120 维条件，text projection 后经过 2 层 token refiner；视频与音频分别编码到 24、32 通道 latent。视频以 1×2×2 patch 投影，每 token 输入为 96 维。"
      ],
      [
        "50 层不等于 50 步",
        "层数描述一次 DiT forward 的网络深度，solver 在多个采样步重复使用同一组权重。Turbo 等采样设置不应画成另一套层数。"
      ],
      [
        "每层 attention",
        "残差宽度 5,376；Q/K/V 各投影到 56×128=7,168，Q/K RMSNorm 与 RoPE 后，联合 attention 读取同一请求内的多模态序列，输出投影回 5,376。"
      ],
      [
        "调制与 FFN",
        "RMSNorm 后按 timestep 与模态选择 scale/shift；attention 与 SwiGLU FFN 输出分别经过 gated residual。FFN 中间宽度为 14,336；gate 参与残差增量，不等同 MoE 专家路由。"
      ],
      [
        "两类输出",
        "最终 norm 与调制后，视频 head 输出每 patch 96 维、音频 head 输出 32 维。scheduler 更新生成 latent，参考条件按任务保留；最后由两个 VAE 重建同步视频和音频。"
      ]
    ],
    "question": "为什么 attention 宽度 7,168 可以大于 residual 的 5,376？",
    "answer": "输入与输出有独立线性投影。head 数 × head_dim 决定 attention 内部宽度，o_proj 将结果映射回残差宽度。",
    "revision": "da572cddb38383deae9caef33b8d490e292ef071",
    "modelId": "MiniMaxAI/MiniMax-H3",
    "figure": "minimax-h3-layers",
    "figureAlt": "MiniMax-H3 的组件路径、层分布和内部子层",
    "figureNote": "FL2VA and Ref2VA share architectural dimensions, with separate task weights. Layers ≠ solver steps.",
    "sources": [
      [
        "模型实现",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/diffusion/models/minimax_h3/minimax_h3_transformer.py"
      ],
      [
        "固定版本的权重与配置",
        "https://huggingface.co/MiniMaxAI/MiniMax-H3/tree/42ed227ee7df40d41602854ae760620d6eb651fe"
      ],
      [
        "pipeline_minimax_h3.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/diffusion/models/minimax_h3/pipeline_minimax_h3.py"
      ],
      [
        "参数或权重体积的 index metadata",
        "https://huggingface.co/MiniMaxAI/MiniMax-H3/blob/42ed227ee7df40d41602854ae760620d6eb651fe/FL2VA/transformer/model.safetensors.index.json"
      ]
    ],
    "nodes": [
      [
        "编码条件",
        "Qwen3-VL + VAEs",
        "Text / reference",
        "按任务编码条件。"
      ],
      [
        "打包序列",
        "2 token refiners",
        "5376 hidden",
        "组织联合 token。"
      ],
      [
        "联合主干",
        "DiT · 50 layers",
        "56 × 128",
        "执行联合去噪。"
      ],
      [
        "采样更新",
        "Video / audio heads",
        "96 / 32",
        "更新生成 latent。"
      ],
      [
        "媒体解码",
        "Video + audio VAEs",
        "Frames + audio",
        "重建同步媒体。"
      ]
    ],
    "architecture": "dense",
    "parameterCount": "DiT 66.28 GB",
    "parameterLabel": "单个 FL2VA DiT checkpoint：66,280,430,144 字节；不含文本编码器及媒体 VAE，非运行显存"
  },
  {
    "slug": "qwen3-omni",
    "name": "Qwen3-Omni-30B-A3B-Instruct",
    "family": "Qwen",
    "category": "理解与语音",
    "kind": "Thinker–Talker MoE",
    "lead": "Thinker 多模态理解并生成文本，Talker 根据中间表示产生语音码，Code Predictor 补码后由 Code2Wav 输出音频。",
    "concepts": [
      "attention",
      "rope",
      "moe",
      "kv-cache",
      "gqa"
    ],
    "facts": [
      "48 Thinker + 20 Talker",
      "5 Code Predictor",
      "16 codebooks"
    ],
    "scope": "采用 Qwen3-Omni-30B-A3B-Instruct 固定配置，展示非 duplex 理解与语音生成路径。30B / A3B 是 Thinker 的命名规格，不是包括 Talker、编码器与 Code2Wav 在内的整套权重精确总数。",
    "sections": [
      [
        "Thinker 的输入与层栈",
        "视觉编码器为 27 层，音频编码器为 32 层；输出对齐到 2,048 维 Thinker。48 层 Thinker 使用 32Q / 4KV、head_dim 128 与多模态 RoPE，每层 MoE 从 128 个专家选 8 个，专家宽度 768。此规格 Thinker 无 shared expert。"
      ],
      [
        "Talker 不是文本 TTS 黑盒",
        "Talker 读取 Thinker 的文本 embedding 和指定中间 hidden states，经投影后进入 20 层 MoE 主干。hidden 1,024，16Q / 2KV、head_dim 128；每层 top-6 / 128，路由专家宽度 384，另有宽度 768 的 shared expert。"
      ],
      [
        "帧内补码",
        "Talker 预测一帧的首个码，5 层 Code Predictor 补齐剩余 15 组。Code Predictor hidden 为 1,024，16Q / 8KV、head_dim 128、FFN 宽度 3,072。16 是码本数量，不是该网络层数。"
      ],
      [
        "Code2Wav",
        "16 组码本进入 Code2Wav。其配置包含 8 层、hidden 1,024 的滑窗 Transformer，窗口 72，再通过上采样与卷积解码得到波形。"
      ],
      [
        "分支与部署",
        "Thinker 文本可以直接返回；语音分支继续通过 Talker 与 Code2Wav。默认部署为三个 stage，Code Predictor 属于 Talker 内部；stage 数不等于图中的组件数或 Transformer 总层数。"
      ]
    ],
    "question": "Thinker 与 Talker 的 MoE 是否相同？",
    "answer": "不是。Thinker 为 top-8 / 128、无共享专家；Talker 为 top-6 / 128，另有宽度 768 的共享专家，hidden 与层数也不同。",
    "revision": "da572cddb38383deae9caef33b8d490e292ef071",
    "modelId": "Qwen/Qwen3-Omni-30B-A3B-Instruct",
    "figure": "qwen3-omni-layers",
    "figureAlt": "Qwen3-Omni-30B-A3B-Instruct 的组件路径、层分布和内部子层",
    "figureNote": "30B / A3B labels the Thinker model family. Three deployment stages; Code Predictor belongs to Talker.",
    "sources": [
      [
        "模型实现",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/qwen3_omni/qwen3_omni_moe_thinker.py"
      ],
      [
        "固定版本的权重与配置",
        "https://huggingface.co/Qwen/Qwen3-Omni-30B-A3B-Instruct/tree/26291f793822fb6be9555850f06dfe95f2d7e695"
      ],
      [
        "qwen3_omni_moe_talker.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/qwen3_omni/qwen3_omni_moe_talker.py"
      ],
      [
        "qwen3_omni_moe_code_predictor_mtp.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/qwen3_omni/qwen3_omni_moe_code_predictor_mtp.py"
      ],
      [
        "qwen3_omni_code2wav.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/qwen3_omni/qwen3_omni_code2wav.py"
      ],
      [
        "pipeline.py",
        "https://github.com/vllm-project/vllm-omni/blob/da572cddb38383deae9caef33b8d490e292ef071/vllm_omni/model_executor/models/qwen3_omni/pipeline.py"
      ]
    ],
    "nodes": [
      [
        "输入编码",
        "Vision + audio",
        "27 / 32 layers",
        "媒体与文字形成 Thinker 输入。"
      ],
      [
        "理解与文本",
        "Thinker · 48 layers",
        "2048 hidden",
        "生成文本与中间表示。"
      ],
      [
        "语音首码",
        "Talker · 20 layers",
        "1024 hidden",
        "预测每帧首码。"
      ],
      [
        "码本补全",
        "Predictor · 5 layers",
        "16 codebooks",
        "帧内补齐后续码本。"
      ],
      [
        "波形解码",
        "Code2Wav",
        "8 Transformer layers",
        "输出音频。"
      ]
    ],
    "architecture": "moe",
    "parameterCount": "30B",
    "activeParameterCount": "3B",
    "parameterLabel": "Thinker 命名规格：30B 总参数 / 3B 激活参数；非整套模型总量"
  }
];
