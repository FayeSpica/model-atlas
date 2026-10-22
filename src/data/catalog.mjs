import hardwareConcepts from './hardware-concepts.mjs';
import runtimeConcepts from './runtime-concepts.mjs';
import parallelConcepts from './parallel-concepts.mjs';
import generativeConcepts from './generative-concepts.mjs';
import conceptPapers from './concept-papers.mjs';
import mamba from './mamba.mjs';
import fasth3 from './fasth3-omni.mjs';
import vsa from './vsa.mjs';
import llama2 from './llama2-7b.mjs';
import attentionConcepts from './attention-concepts.mjs';
import omniModels from './omni-models.mjs';
import flint from './flint.mjs';
import qwen25vl from './qwen2-5-vl.mjs';
import qwen2 from './qwen2.mjs';
export const concepts=[...hardwareConcepts,...runtimeConcepts,...parallelConcepts,...generativeConcepts,mamba,vsa,...attentionConcepts,
{id:'attention',related:['mha','gqa','mqa','mamba','rope','kv-cache'],name:'Attention',intro:'让每个位置按内容读取其他位置的信息。',formula:'Q = XWq, K = XWk, V = XWv; A = softmax(QKᵀ / √d + mask); Y = AV',body:'Q 是当前 token 发出的查询，K 用来匹配，V 是被读取的内容。注意力矩阵的两条轴分别对应查询位置与键位置。因果语言模型屏蔽未来位置；联合扩散模型可在同一请求的多模态序列内使用非因果注意力。',question:'序列长度翻倍，完整 attention score 矩阵的元素数量如何变化？',answer:'变为四倍：矩阵从 T × T 变为 2T × 2T。实现可以避免显式保存这个矩阵，但逻辑上的配对数量仍如此。'},
{id:'rope',name:'RoPE',intro:'把位置信息写进 query 和 key 的旋转。',formula:'qᵢ′ = R(i)qᵢ; kⱼ′ = R(j)kⱼ',body:'对成对通道使用位置相关的旋转，点积因而携带相对位置信息。多模态模型还需要定义时间、空间等位置坐标；具体轴分配和频率由实现决定。RoPE 不改变 token 数量，也不负责选择可见位置。',question:'用了 RoPE 就不需要 causal mask 了吗？',answer:'仍然需要。位置表示与可见性是两件事，因果模型依然必须屏蔽未来 token。'},
{id:'moe',name:'Mixture of Experts',intro:'通过路由，为每个 token 选择部分专家网络。',formula:'y = Σₑ∈TopK(router(x)) gₑ(x) · Expertₑ(x)',body:'MoE 通常替代 Transformer block 的前馈网络。总参数量包含全部专家，单个 token 的计算只涉及被选择的专家及其他共享模块。专家选择、权重归一化和共享专家策略因模型而异。',question:'总参数量相同的两个 MoE，单 token 计算一定相同吗？',answer:'不一定。激活专家数量、专家宽度、共享专家及注意力结构都会影响计算。'},
{id:'dit',name:'Diffusion Transformer',intro:'用 Transformer 在多个噪声时间步上预测更新方向。',formula:'zₜ → DiT(zₜ, t, condition) → prediction → scheduler → zₜ₋Δ',body:'DiT 是去噪网络；scheduler 根据噪声参数化、时间步和预测更新 latent。一次网络 forward 与一次完整生成不同：完整生成通常会调用网络多次。参考条件可用掩码或其他机制保持，其处理取决于任务。',question:'50 层 DiT 和 50 个采样步是一回事吗？',answer:'不是。层数是一次 forward 的网络深度；采样步数是反复调用网络更新 latent 的次数。'},
{id:'vae',name:'VAE / latent codec',intro:'把媒体与更紧凑的 latent 表示互相转换。',formula:'media → encoder → latent → decoder → media',body:'在 latent diffusion 中，生成网络处理压缩表示，解码器将最终 latent 转回像素或波形。视频与音频可以采用不同的编解码器。文本生成的离散 token 和音频 codec token 也不能直接等同于连续 VAE latent。',question:'图里的 VAE decoder 是 Transformer 的输出投影吗？',answer:'不是。输出投影先给出 latent 空间中的预测；采样完成后，独立的媒体解码器再将最终 latent 还原成媒体。'},
{id:'kv-cache',name:'KV cache',intro:'自回归生成中复用已经计算过的 key 和 value。',formula:'K ← concat(Kcache, Knew); V ← concat(Vcache, Vnew)',body:'逐 token 解码时，历史 token 的 K/V 可以缓存，新的 query 读取历史与当前位置。prefill 一次处理提示词；decode 每次推进新 token。缓存减少重复计算，但其存储仍受序列长度、KV heads、层数和精度影响。',question:'普通完整上下文 decode 时，缓存会随生成变长吗？',answer:'会，历史 K/V 随新 token 追加。滑窗、压缩或其他特殊缓存策略可能改变增长方式。'}
].map(concept => ({...concept, papers: concept.papers || conceptPapers[concept.id] || []}));
export const models=[fasth3,llama2,...omniModels,flint,
qwen25vl,
qwen2,
{slug:'decoder-transformer',name:'Decoder-only Transformer',family:'基础结构',category:'文本生成',kind:'Autoregressive',lead:'从一个 token 的路径，理解残差流、因果注意力与逐步生成。',concepts:['attention','rope','kv-cache'],facts:['Causal attention','Residual stream','SwiGLU 示例','Prefill / decode'],scope:'教学用 pre-norm、RoPE、SwiGLU decoder 示意；并非所有 Transformer 的统一规格，不绑定特定 checkpoint。',nodes:[['Token embedding','离散编号 → 连续向量','[B, T] → [B, T, D]','tokenizer 将文本转为 ID；embedding 查表得到 D 维向量。这里不把 tokenizer 当作神经网络层。'],['因果自注意力','Norm → QKV → RoPE → attention','[B, T, D] → [B, T, D]','query 只能读取当前位置及过去位置。多 head 的结果拼接并投影回 D，随后与残差流相加。'],['前馈网络','Norm → SwiGLU → projection','D → F → D','MLP 对每个位置分别变换通道表示，再加回残差。这个示意采用 dense SwiGLU；MoE 会将该部分替换成路由与专家。'],['输出投影','Final norm → LM head','[B, T, D] → [B, T, V]','每个位置映射为词表 V 上的 logits。生成时通常使用最后有效位置的 logits 选择下一个 token。'],['采样并追加','采样 token → 下一轮 decode','新 token + 历史 KV','根据解码策略选 token，追加到序列。KV cache 复用历史 key/value；遇到停止条件才结束生成。']],sections:[['残差流贯穿整个 block','Attention 和 MLP 各自产生增量，残差连接将增量加回输入。pre-norm 指归一化出现在子层之前；其他模型可能采用不同顺序。'],['Prefill 与 decode','prefill 处理提示词的多个位置并建立 KV cache；decode 计算新位置的 query/key/value，利用历史缓存继续生成。因果 mask 保证训练与生成所要求的可见关系。'],['从基础图走向真实模型','学习真实模型时，逐项确认 norm 类型、位置编码、head 数量、KV heads、MLP 激活及是否采用 MoE。不要根据 Transformer 这个名称推断具体实现。']],question:'当 B=1、T=128、D=512、V=32,000 时，LM head 的完整 logits 形状是什么？',answer:'[1, 128, 32000]。实际生成实现可以只计算或保留需要采样的位置，避免不必要的完整输出。',sources:[['Transformer 原始论文','https://arxiv.org/abs/1706.03762'],['RoFormer / RoPE','https://arxiv.org/abs/2104.09864'],['GLU variants / SwiGLU','https://arxiv.org/abs/2002.05202']],revision:'教学示意 · 非 checkpoint 规格'}
];
export const checked='2026-10-22';
