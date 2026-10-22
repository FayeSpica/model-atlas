import { useEffect, useRef, useState } from 'react';
import { stations, trails } from '../../data/infra-map.mjs';
import './infra.css';

export default function InfraMap({ concepts, base }) {
  const viewport=useRef(null), engine=useRef(null), labels=useRef(new Map());
  const [stationId,setStation]=useState(null), [conceptId,setConcept]=useState(null);
  const [trailId,setTrail]=useState('all'), [ready,setReady]=useState(false), [failed,setFailed]=useState(false);
  const catalog=new Map(concepts.map(c=>[c.id,c]));
  const station=stations.find(s=>s.id===stationId);
  const concept=catalog.get(conceptId);
  const trail=trails.find(t=>t.id===trailId);
  function chooseStation(id) {setStation(id);setConcept(null);}
  function chooseConcept(id) {setStation(stations.find(s=>s.concepts.includes(id)).id);setConcept(id);}
  function reset(){setStation(null);setConcept(null);setTrail('all');engine.current?.reset();}
  useEffect(()=>{
    let cancelled=false;
    import('./scene.js').then(({createInfraScene})=>{
      if(cancelled)return;
      engine.current=createInfraScene(viewport.current,stations,{
        onSelect:chooseStation,onReady:()=>setReady(true),onError:()=>{setFailed(true);setReady(true);},
        onProject:positions=>{for(const p of positions){const element=labels.current.get(p.id);if(element){element.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-100%)`;element.style.visibility=p.visible?'visible':'hidden';}}},
      });
    }).catch(()=>{if(!cancelled){setFailed(true);setReady(true);}});
    return()=>{cancelled=true;engine.current?.dispose();engine.current=null;};
  },[]);
  useEffect(()=>{if(stationId&&ready)engine.current?.focus(stationId);},[stationId,ready]);
  return <div className="infra-map">
    <header className="lab-brand"><a href={base}>MODEL<br/>ATLAS<span>AI INFRA / EXPLORER</span></a></header>
    <nav className="lab-menu" aria-label="实验室分区"><span className="lab-menu-label">选择区域</span>{stations.map((s,i)=><button key={s.id} aria-pressed={stationId===s.id} onClick={()=>chooseStation(s.id)}><small>{String(i+1).padStart(2,'0')}</small>{s.name}<b>{s.concepts.length}</b></button>)}<a href={`${base}concepts/`}>全部概念 ↗</a></nav>
    <div className="lab-top-right"><span><i/> LAB ONLINE</span><a href={`${base}browse/`}>模型目录 ↗</a><a href={`${base}concepts/`}>概念目录 ↗</a></div>
    <div className={`infra-workspace ${station?'has-selection':''}`}>
      <div className="infra-scene-panel">
        <div className="infra-scene" ref={viewport} role="img" aria-label="可旋转的三维 AI 计算机房。使用左侧分区按钮也可访问全部知识点。" />
        {!ready&&<div className="infra-loading" role="status"><span/>正在搭建实验室…</div>}
        {failed&&<div className="infra-fallback"><strong>使用知识导航探索</strong><p>当前设备未能启用 3D，全部内容仍可通过下方分区访问。</p></div>}
        {!failed&&<div className="infra-hotspots" aria-label="场景知识入口">{stations.map(s=><button key={s.id} ref={el=>{if(el)labels.current.set(s.id,el);else labels.current.delete(s.id);}} style={{'--station-color':s.color}} className={`infra-hotspot ${stationId===s.id?'selected':''} ${trail&&!s.concepts.some(id=>trail.steps.includes(id))?'muted':''}`} aria-pressed={stationId===s.id} onClick={()=>chooseStation(s.id)}><span className="infra-hotspot-dot"/><span>{s.name}</span><b>＋</b></button>)}</div>}
        <div className="infra-scene-tools"><span>{failed?'知识入口始终可用':'拖动旋转 · 滚轮缩放 · 点击设备'}</span><div><button aria-label="放大场景" disabled={failed||!ready} onClick={()=>engine.current?.zoom(.88)}>＋</button><button aria-label="缩小场景" disabled={failed||!ready} onClick={()=>engine.current?.zoom(1.14)}>−</button><button onClick={reset}>全景</button></div></div>
        <div className="infra-floor-label" aria-hidden="true">MODEL ATLAS / LAB 01</div>
      </div>
      <aside className="infra-inspector" inert={!station} aria-label="知识点详情" aria-live="polite">
        <button className="lab-close" aria-label="关闭知识面板" onClick={reset}>×</button>
        {concept?<><div className="infra-panel-kicker"><button onClick={()=>setConcept(null)}>← {station.name}</button><span>知识点</span></div><h2>{concept.name}</h2><p>{concept.intro}</p><div className="infra-formula"><code>{concept.formula}</code></div><p className="infra-detail-copy">{concept.body}</p><a className="infra-open" href={`${base}concepts/${concept.id}/`}>阅读完整概念 <span>↗</span></a>{concept.papers?.slice(0,2).map(([name,url])=><a className="infra-paper" key={url} href={url} target="_blank" rel="noopener noreferrer">{name}<span>arXiv ↗</span></a>)}{concept.related?.length>0&&<div className="infra-related"><h3>接着看</h3>{concept.related.map(id=><button key={id} onClick={()=>chooseConcept(id)}>{catalog.get(id)?.name}<span>→</span></button>)}</div>}</>:station?<><div className="infra-panel-kicker"><span style={{color:station.color}}>{station.label}</span><span>{station.concepts.length} 个概念</span></div><h2>{station.name}</h2><p>{station.description}</p><div className="infra-topic-list">{station.concepts.map((id,i)=><button key={id} className={trail?.steps.includes(id)?'on-trail':''} onClick={()=>setConcept(id)}><span className="infra-topic-number">{String(i+1).padStart(2,'0')}</span><span><strong>{catalog.get(id).name}</strong><small>{catalog.get(id).intro}</small></span><span>↗</span></button>)}</div></>:<><div className="infra-panel-kicker"><span>探索实验室</span><span>{stations.length} 个区域</span></div><h2>从一台设备开始。</h2><p>点击机柜、屏幕或实验台，查看它背后的模型与系统知识。</p><div className="infra-room-key">{stations.map(s=><button key={s.id} onClick={()=>chooseStation(s.id)}><i style={{background:s.color}}/><span>{s.name}<small>{s.label}</small></span><b>{s.concepts.length}</b></button>)}</div><p className="infra-caption">设备是知识导航的空间隐喻，不代表固定部署拓扑或执行顺序。</p></>}
      </aside>
    </div>
    <footer className="lab-bottom"><div className="lab-path-select"><label htmlFor="lab-path">学习路径</label><select id="lab-path" value={trailId} onChange={event=>{const id=event.target.value;setTrail(id);if(id!=='all')chooseConcept(trails.find(t=>t.id===id).steps[0]);}}><option value="all">自由探索</option>{trails.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div><span className="lab-hint">拖动旋转 / 滚轮缩放 / 点击探索</span><button onClick={reset}>重置视角 ↗</button></footer>
    {trail&&<section className="infra-trail-sequence" aria-label="路径知识点"><h2>{trail.name}</h2><div>{trail.steps.map((id,i)=><button key={id} aria-pressed={conceptId===id} onClick={()=>chooseConcept(id)}><small>{i+1}</small>{catalog.get(id).name.split(' · ')[0]}{i<trail.steps.length-1&&<span aria-hidden="true">→</span>}</button>)}</div><p>建议阅读顺序；多个并行策略不一定同时启用。</p></section>}
  </div>;
}
