import { useEffect, useMemo, useRef, useState } from 'react';
import { explorerModels,makeBlockGraph,makeExpertGraph,makeComponentGraph } from '../../data/model-explorer.mjs';
import './model.css';

export default function ModelExplorer({base}) {
  const [modelId,setModelId]=useState('qwen2'),[moduleId,setModuleId]=useState(null),[layerIndex,setLayer]=useState(0);
  const [selected,setSelected]=useState(null),[expert,setExpert]=useState(null),[playing,setPlaying]=useState(false),[tokens,setTokens]=useState(8);
  const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[dark,setDark]=useState(false),[isolate,setIsolate]=useState(false),[front,setFront]=useState(false);
  const host=useRef(null),sidebar=useRef(null),engine=useRef(null),pickRef=useRef(null);
  const config=explorerModels.find(model=>model.id===modelId);
  const module=config.modules.find(m=>m.id===moduleId);
  const graph=useMemo(()=>!module?config:expert!==null?makeExpertGraph(module,expert,tokens):module.layers?makeBlockGraph(module,layerIndex,tokens):makeComponentGraph(module,modelId),[modelId,moduleId,layerIndex,tokens,expert]);
  const detail=module?(graph.nodes.find(node=>node.id===selected)||null):null;
  const steps=module?graph.nodes.filter(node=>node.kind!=='weight'):config.modules;
  const current=steps.findIndex(node=>node.id===selected);
  function changeModel(id){setModelId(id);setModuleId(null);setSelected(null);setExpert(null);setLayer(0);setPlaying(false);setIsolate(false);}
  function openModule(id,index=0){setModuleId(id);setLayer(index);setSelected(null);setExpert(null);setPlaying(false);}
  function overview(){setModuleId(null);setSelected(null);setExpert(null);setPlaying(false);}
  function pick(id,index){if(!module)openModule(id,index||0);else setSelected(id);}
  pickRef.current=pick;
  function move(direction){setSelected(steps[current<0?(direction>0?0:steps.length-1):(current+direction+steps.length)%steps.length].id);}
  useEffect(()=>{
    let stopped=false;
    const params=new URLSearchParams(location.search);const requested=params.get('m');
    if(explorerModels.some(m=>m.id===requested))setModelId(requested);
    import('./tensor-scene.js').then(({createTensorScene})=>{
      if(stopped)return;
      engine.current=createTensorScene(host.current,{onPick:(id,index)=>pickRef.current(id,index),onReady:()=>setReady(true),onError:()=>{setFailed(true);setReady(true);}});
    }).catch(()=>{if(!stopped){setFailed(true);setReady(true);}});
    return()=>{stopped=true;engine.current?.dispose();engine.current=null;};
  },[]);
  useEffect(()=>{if(ready&&!failed){engine.current?.theme(dark);engine.current?.setGraph(graph);engine.current?.view(front);}},[graph,ready,failed,dark]);
  useEffect(()=>{engine.current?.highlight(selected,isolate);},[selected,isolate,graph]);
  useEffect(()=>{engine.current?.view(front);},[front]);
  useEffect(()=>{if(!playing)return;const timer=setInterval(()=>setSelected(id=>{const index=steps.findIndex(node=>node.id===id);if(index>=steps.length-1){setPlaying(false);return id;}return steps[index+1].id;}),1600);return()=>clearInterval(timer);},[playing,graph]);
  useEffect(()=>{const params=new URLSearchParams(location.search);params.set('m',modelId);history.replaceState(null,'',`${location.pathname}?${params}`);},[modelId]);
  useEffect(()=>{if(sidebar.current)sidebar.current.scrollTop=0;},[modelId,moduleId]);
  const stepName=!module?'组件导览':expert!==null?'专家内部':`第 ${layerIndex} 层 · ${module.name}`;
  return <div className={`tensor-app ${dark?'tensor-dark':''}`}>
    <aside ref={sidebar} className="tensor-sidebar">
      <header className="tensor-brand"><a href={base}><img src={`${base}favicon.svg`} width="26" height="26" alt="" aria-hidden="true"/>Model Atlas</a><span>Model explorer</span></header>
      <h1>模型结构浏览器</h1>
      <label className="tensor-model-label" htmlFor="tensor-model">模型</label><select id="tensor-model" value={modelId} onChange={e=>changeModel(e.target.value)}>{explorerModels.map(m=><option key={m.id} value={m.id}>{m.label} · {m.subtitle}</option>)}</select>
      <div className="tensor-checkpoint">{config.model.modelId||config.model.name}</div>
      <p className="tensor-summary">{config.description}</p>
      <div className="tensor-section-title">{module?'当前组件':'模型组件'}<button onClick={overview}>总览</button></div>
      {!module?<div className="tensor-module-list">{config.modules.map(m=><button key={m.id} onClick={()=>openModule(m.id)} onMouseEnter={()=>engine.current?.highlight(m.id)} onMouseLeave={()=>engine.current?.highlight(null)}><span>{m.name}<small>{m.layers?`${m.layers} layers · hidden ${m.d}`:m.shape}</small></span><b>↗</b></button>)}</div>:<>
        <div className="tensor-component-heading"><button onClick={overview}>←</button><h2>{module.name}</h2>{module.layers&&<span>{module.layers} 层</span>}</div>
        {module.layers&&<><label className="tensor-layer-label" htmlFor="tensor-layer">当前层 <strong>{layerIndex}</strong></label><input id="tensor-layer" aria-label="当前层" type="range" min="0" max={module.layers-1} value={layerIndex} onChange={e=>{setLayer(Number(e.target.value));setSelected(null);setPlaying(false);}}/><div className="tensor-layer-grid">{Array.from({length:module.layers},(_,i)=><button key={i} aria-label={`选择第 ${i} 层`} aria-pressed={layerIndex===i} onClick={()=>{setLayer(i);setSelected(null);setPlaying(false);}}>{i}</button>)}</div><div className="tensor-dims"><span>D <b>{module.d}</b></span><span>Q / KV <b>{module.h} / {module.kv}</b></span><span>head dim <b>{module.hd}</b></span><span>d_ff <b>{module.f}</b></span></div></>}
        {expert!==null&&<button className="tensor-expert-back" onClick={()=>{setExpert(null);setSelected(null);}}>← 返回 MoE 层</button>}
        <div className="tensor-ops" aria-label="操作列表">{graph.nodes.map(n=><button key={n.id} className={`kind-${n.kind}`} aria-pressed={selected===n.id} onClick={()=>{setSelected(n.id);setPlaying(false);}}><i/><span>{n.name}</span><small>{n.kind==='weight'?'W':n.kind==='activation'?'X':''}</small></button>)}</div>
      </>}
      <footer className="tensor-sidebar-footer"><a href={`${base}models/${modelId}/`}>架构说明 ↗</a><a href={`${base}concepts/`}>概念目录 ↗</a><a href="https://bbycroft.net/llm" target="_blank" rel="noopener noreferrer">Inspired by Bycroft ↗</a></footer>
    </aside>
    <main className="tensor-main">
      <div className="tensor-toolbar"><div className="tensor-breadcrumb"><button onClick={overview}>{config.label}</button>{module&&<><span>/</span><strong>{module.name}</strong>{module.layers&&<span>Layer {layerIndex}</span>}</>}</div><div className="tensor-actions"><button aria-pressed={front} onClick={()=>setFront(!front)}>正视</button><button aria-pressed={isolate} onClick={()=>setIsolate(!isolate)}>突出关联</button><button aria-label="切换画布主题" onClick={()=>setDark(!dark)}>{dark?'☀':'☾'}</button></div></div>
      <section className="tensor-viewport" aria-label="三维模型结构">
        <div ref={host} className="tensor-canvas" role="img" aria-label={`${config.label} ${module?.name||'完整组件'}三维张量结构；左侧列表提供等价键盘操作。`}/>
        {!ready&&<div className="tensor-loading" role="status">正在构建张量视图…</div>}
        {failed&&<div className="tensor-loading" role="status">当前浏览器未能启用 WebGL。可继续使用左侧组件与操作列表查看结构。</div>}
        <div className="tensor-legend"><span><i className="weight"/>权重 / 投影</span><span><i className="activation"/>激活 / token</span><span><i className="operation"/>运算</span><span><i className="experts"/>专家</span></div>
        <div className="tensor-view-controls"><button aria-label="放大张量图" onClick={()=>engine.current?.zoom(1.3)}>＋</button><button aria-label="缩小张量图" onClick={()=>engine.current?.zoom(1/1.3)}>−</button><button onClick={()=>engine.current?.home()}>适配画布</button></div>
        <div className="tensor-scope">结构视图 · 未加载权重 · 网格与几何为抽样示意</div>
        {detail&&<aside className="tensor-inspect" aria-label="选中操作详情"><button className="tensor-inspect-close" aria-label="关闭操作详情" onClick={()=>setSelected(null)}>×</button><span className="tensor-kind">{detail.kind==='weight'?'权重矩阵':detail.kind==='activation'?'中间表示':detail.kind==='experts'?'MoE 专家':'操作'}</span><h2>{detail.name}</h2><code>{detail.shape}</code><p>{detail.description||'线性投影或中间表示，沿图中连线传入后续操作。'}</p>{detail.expertDetail&&<button className="tensor-expand" onClick={()=>{setExpert(Boolean(detail.shared));setSelected(null);}}>展开专家内部 ↗</button>}<button className="tensor-focus" onClick={()=>engine.current?.focus(detail.id)}>聚焦此张量</button><a href={`${base}models/${modelId}/#sources`}>实现与 checkpoint 来源 ↗</a></aside>}
      </section>
      <footer className="tensor-timeline"><div className="tensor-timeline-heading"><strong>{stepName}</strong><span>{current<0?'选择一个节点开始':`${current+1} / ${steps.length}`}</span></div><div className="tensor-player"><button aria-label="上一个节点" onClick={()=>{setPlaying(false);move(-1);}}>←</button><button className="tensor-play" aria-label={playing?'暂停结构导览':'播放结构导览'} onClick={()=>setPlaying(!playing)}>{playing?'Ⅱ':'▶'}</button><button aria-label="下一个节点" onClick={()=>{setPlaying(false);move(1);}}>→</button><div className="tensor-progress">{steps.map((n,i)=><button key={n.id} aria-label={`导览：${n.name}`} aria-pressed={selected===n.id} className={i<=current?'passed':''} onClick={()=>{setPlaying(false);setSelected(n.id);}}/>)}</div><span className="tensor-progress-name">{steps[current]?.name||'概览'}</span></div><p>拖动旋转 · 右键平移 · 滚轮缩放。导览表示结构依赖，不模拟实际 GPU 时间或张量数值。</p></footer>
    </main>
  </div>;
}
