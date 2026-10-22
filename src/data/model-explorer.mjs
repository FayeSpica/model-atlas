import { models } from './catalog.mjs';
const layer=(id,name,x,y,spec)=>({id,name,x,y,type:'decoder',...spec});
const part=(id,name,x,y,type,shape,description)=>({id,name,x,y,type,shape,description});
const qwen={layers:28,d:3584,f:18944,h:28,kv:4,hd:128,position:'RoPE',qkNorm:false};
const predictor={layers:5,d:1024,f:3072,h:16,kv:8,hd:128,position:'RoPE',qkNorm:true};
const configs=[
 {id:'qwen2',label:'Qwen2',subtitle:'7B Instruct',description:'28 层因果 GQA decoder。逻辑残差加法独立显示；vLLM 可在下一次 RMSNorm 融合执行。',modules:[
  part('embed','Token embedding',0,18,'embed','[N] → [N, 3584]','按 token ID 读取 embedding。'),layer('decoder','Decoder',0,2,qwen),part('norm','Final RMSNorm',0,-13,'norm','[N, 3584]','补齐末层残差并归一化。'),part('head','LM head',0,-21,'head','3584 → 152064','hidden states 投影到词表 logits；采样在 forward 外执行。')],edges:[['embed','decoder'],['decoder','norm'],['norm','head']]},
 {id:'qwen2-5-vl',label:'Qwen2.5-VL',subtitle:'7B Instruct',description:'视觉窗口／全局 attention 经 Patch Merger 接入语言 decoder；两套 token 序列不混用同一个长度符号。',modules:[
  part('patch','Video / image patches',-10,26,'embed','[Nv, 3×2×14×14] → [Nv,1280]','Conv3d patch embedding，时空网格由输入决定。'),layer('vision','Vision Transformer',-10,9,{type:'vision',layers:32,d:1280,f:3420,h:16,kv:16,hd:80,position:'spatial RoPE',fullLayers:[7,15,23,31]}),part('merge','2×2 Patch Merger',-10,-10,'merge','[Nv/4,5120] → [Nv/4,3584]','四个空间相邻视觉 token 拼接并投影。'),part('text','Text embedding',9,-10,'embed','[Nt] → [Nt,3584]','文本 embedding 与视觉 token 按占位位置组合。'),part('pack','Multimodal embedding',0,-20,'pack','[N,3584]','N 表示合并后的有效序列，使用 MRoPE 位置坐标。'),layer('decoder','Language decoder',0,-37,{...qwen,position:'MRoPE'}),part('head','Norm / LM output',0,-53,'head','3584 → 152064','末尾 RMSNorm 后由 LM head 输出 logits。')],edges:[['patch','vision'],['vision','merge'],['merge','pack'],['text','pack'],['pack','decoder'],['decoder','head']]},
 {id:'qwen3-tts',label:'Qwen3-TTS',subtitle:'12Hz · 1.7B CustomVoice',description:'Talker 沿时间产生首码；同一套 Code Predictor 沿码本深度补齐其余 15 组。网络层数与调用次数分开表示。',modules:[
  part('input','Text / voice conditions',0,25,'embed','Text + speaker conditioning','文本条件和说话人条件经过模型规定的投影与 embedding。'),layer('talker','Talker',0,7,{layers:28,d:2048,f:6144,h:16,kv:8,hd:128,position:'MRoPE',qkNorm:true}),part('first','First code head',0,-8,'head','Talker hidden → codebook 0','选择首码并将 hidden 条件交给 Code Predictor。'),layer('predictor','Code Predictor',0,-24,predictor),part('codes','16-code frame',0,-39,'pack','[frames,16] discrete codes','每帧首码加上 15 个后续码；Code Predictor 每次仍经过 5 层。'),part('codec','12Hz tokenizer decoder',0,-50,'codec','Codec frames → waveform','编解码器是独立组件，此视图不把它假装成通用 decoder 层。')],edges:[['input','talker'],['talker','first'],['first','predictor'],['predictor','codes'],['codes','codec']],loops:[['predictor','predictor','15 次帧内补码']]},
 {id:'qwen3-omni',label:'Qwen3-Omni',subtitle:'30B-A3B Instruct',description:'Thinker 生成文本与中间表示，语音路径继续经过 Talker、Code Predictor 和 Code2Wav。',modules:[
  part('vision','Vision encoder',-14,29,'encoder','27 layers · D=1152 → 2048','视觉编码器包含专用的视觉处理与特征合并；这里展示组件边界。'),part('audio','Audio encoder',0,29,'encoder','32 layers · D=1280','音频编码器输出对齐到 Thinker 的多模态输入。'),part('text','Text embedding',14,29,'embed','[Nt,2048]','文本 token 对应的 embedding。'),layer('thinker','Thinker',0,10,{type:'moe',layers:48,d:2048,f:768,h:32,kv:4,hd:128,position:'MRoPE',qkNorm:true,experts:128,topk:8,shared:0}),part('textout','Text output',-13,-10,'head','Thinker hidden → text logits','文本分支可直接输出；不是所有请求都需要语音。'),layer('talker','Talker',12,-12,{type:'moe',layers:20,d:1024,f:384,h:16,kv:2,hd:128,position:'MRoPE',qkNorm:false,experts:128,topk:6,shared:768}),layer('predictor','Code Predictor',12,-33,predictor),part('codec','Code2Wav',12,-49,'codec','16 codebooks → waveform','8 层、hidden 1024 的滑窗 Transformer（window 72）加上采样与卷积解码；此视图展示组件边界。')],edges:[['vision','thinker'],['audio','thinker'],['text','thinker'],['thinker','textout'],['thinker','talker'],['talker','predictor'],['predictor','codec']],loops:[['predictor','predictor','15 次帧内补码']]},
 {id:'minimax-h3',label:'MiniMax-H3',subtitle:'FL2VA / Ref2VA · Joint DiT',description:'文本与媒体 latent 在 50 层联合 DiT 中交互。参考条件保持任务约束，scheduler 在多个噪声时间点重复调用主干。',modules:[
  part('text','Qwen3-VL condition encoder',-15,31,'encoder','64 text layers · 5120 features','文本条件编码器；不把它视为 H3 的自回归输出主干。'),part('video','Video VAE encoder',0,31,'codec','Video → 24-channel latent','视频 latent 以 1×2×2 patch 输入投影，每 patch 96 维。'),part('audio','Audio VAE encoder',15,31,'codec','Audio → 32-channel latent','音频采用独立连续 latent codec。'),part('refiner','Text projection / refiners',-15,17,'encoder','5120 → 5376 · 2 refiner layers','投影后使用 2 层 token refiner；暂不展开 refiner 的专用层内结构。'),part('pack','Pack multimodal sequence',0,5,'pack','[Ntext+Nvideo+Naudio,5376]','联合打包；具体参考 mask 由 FL2VA / Ref2VA 任务定义。'),layer('dit','Joint DiT',0,-13,{type:'dit',layers:50,d:5376,f:14336,h:56,kv:56,hd:128,position:'RoPE',qkNorm:true}),part('heads','Video / audio projections',0,-31,'head','5376 → 96 (video) / 32 (audio)','末尾 RMSNorm 与调制后分别输出两类 latent 预测。'),part('solver','Scheduler step',0,-42,'solver','prediction + latent + t → updated latent','采样循环由外部 scheduler 驱动，50 层不等于 50 步。'),part('vdec','Video VAE decoder',-11,-53,'codec','Video latent → frames','重建视频。'),part('adec','Audio VAE decoder',11,-53,'codec','Audio latent → waveform','重建同步音频。')],edges:[['text','refiner'],['refiner','pack'],['video','pack'],['audio','pack'],['pack','dit'],['dit','heads'],['heads','solver'],['solver','vdec'],['solver','adec']],loops:[['solver','dit','按采样时间网格重复']]},
];
export const explorerModels=configs.map(config=>({...config,model:models.find(model=>model.slug===config.id)}));

export function makeBlockGraph(module, layerIndex=0, tokens=8) {
  if(!module.layers) return null;
  const {d,f,h,kv,hd}=module;
  const N=module.type==='vision'?'Nv':'N';
  const nodes=[],edges=[];
  const fmt=n=>n.toLocaleString('en-US');
  const add=(id,name,x,y,shape,kind,description,extra={})=>{const node={id,name,x,y,shape,kind,description,...extra};nodes.push(node);return id;};
  const edge=(from,to,relation='data')=>edges.push({from,to,relation});
  const act=(id,name,x,y,width=d,description='')=>add(id,name,x,y,`[${N}, ${fmt(width)}]`,'activation',description,{width,tokens});
  const op=(id,name,x,y,description,shape=`[${N}, ${fmt(d)}]`)=>add(id,name,x,y,shape,'operation',description,{width:d,tokens});
  const weight=(id,name,x,y,input,output,description)=>add(id,name,x,y,`[${fmt(input)}, ${fmt(output)}]`,'weight',description,{width:output,input});
  act('input','Input hidden states',0,40,d,'本层输入；N 是序列长度符号，场景只抽样绘制少量网格。');
  op('norm1',module.type==='vision'?'RMSNorm':'Input RMSNorm',0,34,'沿特征维归一化；逻辑结构采用 pre-norm。');edge('input','norm1');
  let start='norm1';
  if(module.type==='dit'){
    op('scale1','Time / modality scale',0,29,'timestep 与模态条件选择的 scale。');op('shift1','Time / modality shift',0,24,'对归一化结果施加 shift。');edge(start,'scale1');edge('scale1','shift1');start='shift1';
  }
  const top=module.type==='dit'?17:26;
  for(const [id,x,count] of [['q',-9,h],['k',0,kv],['v',9,kv]]){
    weight(`w${id}`,`W${id.toUpperCase()}`,x+3.2,top+2,d,count*hd,'逻辑线性权重；实现可把 Q/K/V 融合成一份投影。');
    act(id,`${id.toUpperCase()} projection`,x,top,count*hd,`${count} heads × ${hd}；Q、K、V 分别显示。`);edge(start,id);edge(`w${id}`,id,'weight');
  }
  let q='q',k='k';let qy=top-6;
  if(module.qkNorm){op('qnorm','Q RMSNorm',-9,qy,'逐 query head RMSNorm。',`[${N}, ${h}, ${hd}]`);op('knorm','K RMSNorm',0,qy,'逐 key head RMSNorm。',`[${N}, ${kv}, ${hd}]`);edge(q,'qnorm');edge(k,'knorm');q='qnorm';k='knorm';qy-=6;}
  op('qrope',`Q ${module.position||'RoPE'}`,-9,qy,'对 Q 的位置通道应用旋转。',`[${N}, ${h}, ${hd}]`);op('krope',`K ${module.position||'RoPE'}`,0,qy,'对 K 的位置通道应用旋转；V 不经过 RoPE。',`[${N}, ${kv}, ${hd}]`);edge(q,'qrope');edge(k,'krope');
  const ay=qy-8;
  const full=module.type==='vision'&&module.fullLayers?.includes(layerIndex);
  add('attention',module.type==='vision'?(full?'Full spatial MHA':'Window MHA'):(h===kv?'MHA':'GQA'),0,ay,`Q: ${h} × ${hd}; KV: ${kv} × ${hd}`,'attention',module.type==='vision'?`第 ${layerIndex} 层采用${full?'完整空间':'窗口'} attention。`:'每个 query head 对可见 keys 计算 softmax 后读取 values。',{width:h*hd,tokens});
  edge('qrope','attention');edge('krope','attention');edge('v','attention');
  weight('wo','Wo',6,ay-5,h*hd,d,'将多 head 输出映射回 residual 宽度。');act('oproj','o_proj',0,ay-7,d);edge('attention','oproj');edge('wo','oproj','weight');
  let attnEnd='oproj',next=ay-13;
  if(module.type==='dit'){op('attngate','Attention residual gate',7,next,'从模态与时间条件读取 residual gate。');add('attnmul','×',0,next,'elementwise','multiply','逐元素缩放 attention 增量。');edge('oproj','attnmul');edge('attngate','attnmul');attnEnd='attnmul';next-=6;}
  add('res1','+',0,next,`[${N}, ${fmt(d)}]`,'add','Attention 结果与本层输入做残差加法。');edge(attnEnd,'res1');edge('input','res1','residual');
  op('norm2','Post-attention RMSNorm',0,next-6,'FFN 前归一化。');edge('res1','norm2');let ffStart='norm2';next-=13;
  if(module.type==='dit'){op('scale2','FFN time / modality scale',0,next,'对 FFN 输入施加 scale。');op('shift2','FFN time / modality shift',0,next-6,'对 FFN 输入施加 shift。');edge(ffStart,'scale2');edge('scale2','shift2');ffStart='shift2';next-=13;}
  if(module.type==='moe'){
    weight('router','Router linear',-6,next,d,module.experts,'选择路由专家的 logits。');edge(ffStart,'router');op('rsoftmax','Router softmax',-6,next-6,'对专家 logits 归一化。',`[${N}, ${module.experts}]`);op('topk',`Top-${module.topk}`, -6,next-12,'选择路由专家；不是所有专家都执行。',`[${N}, ${module.topk}]`);op('renorm','Renormalize weights',-6,next-18,'对选中路由权重再归一化。',`[${N}, ${module.topk}]`);edge('router','rsoftmax');edge('rsoftmax','topk');edge('topk','renorm');
    add('expert','Routed SwiGLU experts',-6,next-25,`${module.topk} / ${module.experts}; d_ff=${f}`,'experts','点击“专家内部”可单独查看一个专家的 gate、up、SiLU、× 和 down 操作。',{width:f,tokens,expertDetail:true,topk:module.topk});edge('renorm','expert');edge(ffStart,'expert');
    op('weighted','Weighted expert sum',0,next-33,'按 router 权重对专家输出求和。');edge('expert','weighted');ffStart='weighted';next-=40;
    if(module.shared){add('shared','Shared SwiGLU expert',9,next+15,`d_ff=${module.shared}`,'experts','每 token 执行的共享专家；与 routed experts 相加。',{width:module.shared,expertDetail:true,shared:true});edge('norm2','shared');add('sharedadd','+',0,next,'routed + shared','add','相加路由与共享专家输出。');edge('shared','sharedadd');edge('weighted','sharedadd');ffStart='sharedadd';next-=7;}
  } else {
    const gateX=-6,upX=6;
    weight('wg','Wgate',gateX-4,next+2,d,f,'SwiGLU gate 投影。');weight('wu','Wup',upX+4,next+2,d,f,'SwiGLU up 投影。');act('gate','gate_proj',gateX,next,f);act('up','up_proj',upX,next,f);edge(ffStart,'gate');edge(ffStart,'up');edge('wg','gate','weight');edge('wu','up','weight');
    op('silu','SiLU',gateX,next-6,'仅 gate 路径执行 SiLU。',`[${N}, ${fmt(f)}]`);edge('gate','silu');add('multiply','×',0,next-12,`[${N}, ${fmt(f)}]`,'multiply','SiLU(gate) 与 up 逐元素相乘。');edge('silu','multiply');edge('up','multiply');weight('wd','Wdown',7,next-18,f,d,'将 FFN 中间宽度映射回 residual。');act('down','down_proj',0,next-20,d);edge('multiply','down');edge('wd','down','weight');ffStart='down';next-=27;
  }
  if(module.type==='dit'){op('ffgate','FFN residual gate',7,next,'FFN 输出的条件 residual gate。');add('ffmul','×',0,next,'elementwise','multiply','gate 逐元素缩放 FFN 增量。');edge(ffStart,'ffmul');edge('ffgate','ffmul');ffStart='ffmul';next-=7;}
  add('res2','+',0,next,`[${N}, ${fmt(d)}]`,'add','FFN 增量与 attention 后 residual 相加。');edge(ffStart,'res2');edge('res1','res2','residual');act('output','Output hidden states',0,next-7,d,'逻辑 block 输出；vLLM 的融合 residual+norm 可以改变物理执行边界。');edge('res2','output');
  return {nodes,edges};
}

export function makeExpertGraph(module, shared=false, tokens=8){
  const d=module.d,f=shared?module.shared:module.f;
  const nodes=[
    {id:'input',name:'Expert input',x:0,y:20,kind:'activation',shape:`[N, ${d}]`,width:d,tokens,description:'单个专家收到路由给它的 token；N 为该专家的 token 数。'},
    {id:'gate',name:'gate_proj',x:-6,y:12,kind:'weight',shape:`[${d}, ${f}]`,width:f,input:d,description:'gate 线性投影。'},
    {id:'up',name:'up_proj',x:6,y:12,kind:'weight',shape:`[${d}, ${f}]`,width:f,input:d,description:'up 线性投影。'},
    {id:'silu',name:'SiLU',x:-6,y:4,kind:'operation',shape:`[N, ${f}]`,description:'gate 路径激活。'},
    {id:'multiply',name:'×',x:0,y:-4,kind:'multiply',shape:`[N, ${f}]`,description:'逐元素相乘。'},
    {id:'down',name:'down_proj',x:0,y:-12,kind:'weight',shape:`[${f}, ${d}]`,width:d,input:f,description:'投影回模型宽度。'},
    {id:'output',name:'Expert output',x:0,y:-20,kind:'activation',shape:`[N, ${d}]`,width:d,tokens,description:'一个专家的输出；外部再应用 router 权重与专家求和。'},
  ];return {nodes,edges:[['input','gate'],['input','up'],['gate','silu'],['silu','multiply'],['up','multiply'],['multiply','down'],['down','output']].map(([from,to])=>({from,to,relation:'data'}))};
}

export function makeComponentGraph(module,modelId){
  const nodes=[],edges=[];
  const node=(id,name,x,y,shape,kind,description)=>nodes.push({id,name,x,y,shape,kind,description});
  const edge=(from,to)=>edges.push({from,to,relation:'data'});
  if(module.type==='merge'){
    node('input','Visual tokens',0,20,'[Nv,1280]','activation','视觉编码器的 token 表示。');
    node('norm','RMSNorm',0,13,'[Nv,1280]','operation','先沿特征维归一化。');
    node('concat','2×2 token concatenation',0,6,'[Nv/4,5120]','operation','每四个空间相邻 token 合并通道。');
    node('linear1','Linear',0,-1,'5120 → 5120','weight','第一层线性投影。');
    node('gelu','GELU',0,-8,'[Nv/4,5120]','operation','合并 MLP 的激活。');
    node('linear2','Linear',0,-15,'5120 → 3584','weight','投影到语言模型宽度。');
    node('output','Restore spatial ordering',0,-22,'[Nv/4,3584]','activation','恢复 token 的顺序，准备填入视觉占位位置。');
    for(const [a,b] of [['input','norm'],['norm','concat'],['concat','linear1'],['linear1','gelu'],['gelu','linear2'],['linear2','output']])edge(a,b);
  }else if(module.id==='heads'&&modelId==='minimax-h3'){
    node('norm','Final RMSNorm',0,20,'[N,5376]','operation','对联合 hidden states 做末尾归一化。');node('scale','Final scale',0,13,'[N,5376]','operation','末尾时间与模态调制的 scale。');node('shift','Final shift',0,6,'[N,5376]','operation','末尾时间与模态调制的 shift。');node('video','Video projection',-7,-4,'5376 → 96','weight','只读视频 token，输出每 patch 96 维。');node('audio','Audio projection',7,-4,'5376 → 32','weight','只读音频 token，输出每 token 32 维。');edge('norm','scale');edge('scale','shift');edge('shift','video');edge('shift','audio');
  }else if(module.id==='head'&&modelId==='qwen2-5-vl'){
    node('norm','Final RMSNorm',0,8,'[N,3584]','operation','语言 decoder 的末尾归一化。');node('head','LM head',0,-2,'3584 → 152064','weight','映射到词表 logits。');edge('norm','head');
  }else{
    node('component',module.name,0,0,module.shape||'',module.type==='norm'?'operation':module.type==='head'?'weight':'activation',module.description||'此视图展示组件边界。');
  }
  return {nodes,edges};
}
