import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const palette={activation:0xd9ad59,weight:0x73a8d5,operation:0xb5bbc1,attention:0xdba36d,experts:0xb49bd2,add:0xd9c39d,multiply:0x9ac2a3,encoder:0x82b3bc,codec:0x9bc3a0,embed:0xd7b275,head:0x81b3ce,pack:0xa2b8bf,solver:0xb8a0cc};
export function createTensorScene(host,{onPick,onError,onReady,onHover}) {
  let renderer;
  try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}catch{onError();return {dispose(){},setGraph(){},highlight(){},home(){},zoom(){},view(){}};}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor('#f7f8fa');renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-30,30,30,-30,.1,1000);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=true;controls.screenSpacePanning=true;controls.minZoom=.15;controls.maxZoom=14;
  controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
  scene.add(new THREE.HemisphereLight(0xffffff,0xbac4d1,2.6));const light=new THREE.DirectionalLight(0xffffff,2.1);light.position.set(-20,40,60);scene.add(light);
  const root=new THREE.Group();scene.add(root);
  const pickables=[],materials=[],labels=[],nodeCenters=new Map();let graph=null,frame,dead=false,destination=null,homeState=null,dark=false;
  const reuse=new Map();
  function gridTexture(color){const key=color.toString();if(reuse.has(key))return reuse.get(key);const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=new THREE.Color(color).getStyle();ctx.fillRect(0,0,256,128);ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=1;for(let x=0;x<=256;x+=16){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,128);ctx.stroke();}for(let y=0;y<=128;y+=16){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;reuse.set(key,texture);return texture;}
  function text(parent,lines,x,y,z,width=9,size=26){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=lines.length>1?150:88;const ctx=canvas.getContext('2d');
    ctx.textAlign='center';ctx.textBaseline='middle';lines.forEach((line,i)=>{let fontSize=(i===0?size:size-5)*2.2;ctx.font=`${i===0?'500':'400'} ${fontSize}px Inter, Arial, sans-serif`;if(ctx.measureText(line).width>710){fontSize*=710/ctx.measureText(line).width;ctx.font=`${i===0?'500':'400'} ${fontSize}px Inter, Arial, sans-serif`;}ctx.fillStyle=dark?(i===0?'#e4eaf1':'#8f9dac'):(i===0?'#293747':'#718096');ctx.fillText(line,384,lines.length>1?36+i*75:44);});
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthTest:false}));sprite.position.set(x,y,z);sprite.scale.set(width,width*canvas.height/768,1);parent.add(sprite);labels.push(sprite);return sprite;
  }
  function matrix(parent,id,x,y,z,w,h,depth,kind){
    const color=palette[kind]||palette.operation;const material=new THREE.MeshStandardMaterial({color:0xffffff,map:gridTexture(color),roughness:.7,metalness:.05,transparent:true,opacity:.94});const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,depth),material);mesh.position.set(x,y,z);mesh.userData.id=id;parent.add(mesh);pickables.push(mesh);materials.push({id,material,baseOpacity:.94});
    const outline=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:dark?0x667b8e:0x7590a6,transparent:true,opacity:.38}));mesh.add(outline);return mesh;
  }
  function connector(points,relation='data',ids=[]){const color=relation==='residual'?0xc4944f:relation==='weight'?0x7ea7c8:0x8d9eaa;const curve=new THREE.CurvePath();for(let i=1;i<points.length;i++)curve.add(new THREE.LineCurve3(points[i-1],points[i]));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(30)),new THREE.LineBasicMaterial({color,transparent:true,opacity:.65}));line.userData.edge=ids;root.add(line);const end=points.at(-1),before=points.at(-2),direction=end.clone().sub(before).normalize();const arrow=new THREE.Mesh(new THREE.ConeGeometry(.13,.5,6),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.75}));arrow.position.copy(end.clone().sub(direction.clone().multiplyScalar(.25)));arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);root.add(arrow);}
  function disposeRoot(){while(root.children.length){const obj=root.children.pop();obj.traverse(item=>{item.geometry?.dispose();if(item.material){for(const m of Array.isArray(item.material)?item.material:[item.material]){if(m.map&&!Array.from(reuse.values()).includes(m.map))m.map.dispose();m.dispose();}}});obj.parent=null;}pickables.length=0;materials.length=0;labels.length=0;nodeCenters.clear();}
  function fit(){const bounds=new THREE.Box3().setFromObject(root);const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());const aspect=host.clientWidth/Math.max(1,host.clientHeight);const height=Math.max(size.y+10,(size.x+12)/aspect);camera.top=height/2;camera.bottom=-height/2;camera.left=-height*aspect/2;camera.right=height*aspect/2;camera.zoom=1;camera.position.copy(center).add(new THREE.Vector3(15,9,90));controls.target.copy(center);camera.updateProjectionMatrix();homeState={center:center.clone(),position:camera.position.clone()};destination=null;controls.update();}
  function setGraph(next,options={}){
    disposeRoot();graph=next;
    if(next.modules){
      for(const m of next.modules){
        const x=m.x,y=m.y;const group=new THREE.Group();root.add(group);const color=m.type==='moe'?'experts':m.type==='dit'?'attention':m.type;
        if(m.layers){
          const pitch=Math.min(.38,10/m.layers),height=m.layers*pitch;
          for(let i=0;i<m.layers;i++){
            const yy=y+height/2-i*pitch;
            const mesh=matrix(group,m.id,x,yy,0,5.4,.13,2.8,'activation');mesh.userData.layer=i;
            const ff=matrix(group,m.id,x+4.2,yy,-1,2.4,.13,2.8,color==='experts'?'experts':'weight');ff.userData.layer=i;
            if(i===0||i===m.layers-1||i%8===7)text(group,[String(i)],x-3.1,yy,1.6,1.25,29);
          }
          text(group,[m.name,`${m.layers} layers · D ${m.d} · ${m.h}Q / ${m.kv}KV`],x+1.3,y+height/2+2.4,2,12,34);
          nodeCenters.set(m.id,new THREE.Vector3(x+1.3,y,1));
        }else{
          matrix(group,m.id,x,y,0,6.2,1.5,2.5,color);text(group,[m.name,m.shape],x,y+2.3,1.5,13,31);nodeCenters.set(m.id,new THREE.Vector3(x,y,1));
        }
      }
      for(const [a,b] of next.edges){const from=nodeCenters.get(a),to=nodeCenters.get(b);const sourceModule=next.modules.find(m=>m.id===a),targetModule=next.modules.find(m=>m.id===b);const sy=sourceModule.layers?Math.min(10,sourceModule.layers*.38)/2+1:1.2,ty=targetModule.layers?Math.min(10,targetModule.layers*.38)/2+1:1.2;const p=from.clone().add(new THREE.Vector3(0,-sy,0)),q=to.clone().add(new THREE.Vector3(0,ty,0));connector([p,new THREE.Vector3(p.x,(p.y+q.y)/2,1),new THREE.Vector3(q.x,(p.y+q.y)/2,1),q],'data',[a,b]);}
      for(const [a,b,title] of next.loops||[]){const p=nodeCenters.get(a),q=nodeCenters.get(b),rail=Math.max(p.x,q.x)+10;connector([p.clone().add(new THREE.Vector3(3,0,0)),new THREE.Vector3(rail,p.y+(a===b?5:0),0),new THREE.Vector3(rail,q.y,0),q.clone().add(new THREE.Vector3(4,0,0))],'residual',[a,b]);text(root,[title],rail+2,(p.y+q.y)/2,1,10,26);}
    }else{
      const split=next.nodes.findIndex(n=>n.id==='norm2');
      const shift=split>=0?34-next.nodes[split].y:0;
      if(split>=0){text(root,['Attention sublayer'],0,34,2,15,34);text(root,['FFN / MoE sublayer'],46,34,2,15,34);}
      for(const [index,n] of next.nodes.entries()){
        const second=split>=0&&index>=split;
        const x=(n.x+(second?40:0))*1.15,y=(n.y+(second?shift:0))*.7,z=n.kind==='weight'?-2:1;
        const w=n.kind==='weight'?Math.min(4.4,2.2+Math.log2(Math.max(n.width||1,2))/7):n.kind==='experts'?6.8:n.kind==='attention'?6:n.kind==='activation'?5.5:4;
        if(n.kind==='add'||n.kind==='multiply'){
          const sphere=new THREE.Mesh(new THREE.SphereGeometry(.65,20,14),new THREE.MeshStandardMaterial({color:palette[n.kind],roughness:.6,transparent:true,opacity:1}));sphere.position.set(x,y,z);sphere.userData.id=n.id;root.add(sphere);pickables.push(sphere);materials.push({id:n.id,material:sphere.material,baseOpacity:1});text(root,[n.name],x,y,z+1,2,54);
        }else {
          matrix(root,n.id,x,y,z,w,n.kind==='weight'?2.3:1.15,n.kind==='weight'?.5:1.1,n.kind);
          text(root,[n.name,n.shape],x,y+1.8,z+1,9.5,n.kind==='weight'?26:29);
        }
        if(n.kind==='experts'){
          for(let i=0;i<16;i++){const cell=new THREE.Mesh(new THREE.BoxGeometry(.27,.22,.2),new THREE.MeshBasicMaterial({color:i<Math.min(n.topk||1,16)?0x735b9d:0xd2c7e1}));cell.position.set(x-2.4+(i%8)*.67,y-.22+Math.floor(i/8)*.5,z+.7);root.add(cell);}
        }
        nodeCenters.set(n.id,new THREE.Vector3(x,y,z));
      }
      for(const {from,to,relation} of next.edges){const p=nodeCenters.get(from),q=nodeCenters.get(to);if(!p||!q)continue;if(relation==='residual'){const rail=to==='res2'?30:-20;connector([p.clone().add(new THREE.Vector3(-2.7,0,0)),new THREE.Vector3(rail,p.y,1),new THREE.Vector3(rail,q.y,1),q.clone().add(new THREE.Vector3(-.8,0,0))],relation,[from,to]);}else if(relation==='weight'){connector([p.clone(),q.clone()],relation,[from,to]);}else{const a=p.clone().add(new THREE.Vector3(0,-.7,.3)),b=q.clone().add(new THREE.Vector3(0,.8,.3));connector([a,new THREE.Vector3(a.x,(a.y+b.y)/2,1),new THREE.Vector3(b.x,(a.y+b.y)/2,1),b],relation,[from,to]);}}
    }
    fit();if(options.selected)highlight(options.selected);
  }
  function highlight(id,isolated=false){const neighbors=new Set([id]);for(const e of graph?.edges||[]){const from=Array.isArray(e)?e[0]:e.from,to=Array.isArray(e)?e[1]:e.to;if(from===id||to===id){neighbors.add(from);neighbors.add(to);}}
    for(const item of materials){const active=!id||neighbors.has(item.id);item.material.opacity=active?item.baseOpacity:isolated?.07:.25;item.material.emissive?.setHex(item.id===id?0x334e63:0x000000);item.material.emissiveIntensity=.18;}
  }
  let down=null;const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  function pick(e){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(pickables,false)[0]?.object;}
  const onDown=e=>{down=[e.clientX,e.clientY];destination=null;};
  const onUp=e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<5){const obj=pick(e);if(obj)onPick(obj.userData.id,obj.userData.layer);}down=null;};
  const onMove=e=>{const obj=pick(e);renderer.domElement.style.cursor=obj?'pointer':'grab';onHover?.(obj?.userData.id||null);};
  renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointerup',onUp);renderer.domElement.addEventListener('pointermove',onMove);
  const resize=new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);if(homeState)fit();});resize.observe(host);
  const render=()=>{if(dead)return;if(destination){controls.target.lerp(destination.target,.1);camera.position.lerp(destination.position,.1);if(controls.target.distanceTo(destination.target)<.02)destination=null;}controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(render);};render();onReady();
  return {setGraph,highlight,home:fit,
    focus(id){const point=nodeCenters.get(id);if(!point)return;destination={target:point.clone(),position:point.clone().add(new THREE.Vector3(8,6,90))};camera.zoom=Math.min(4,Math.max(1.7,camera.zoom));camera.updateProjectionMatrix();},
    zoom(factor){camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,.15,14);camera.updateProjectionMatrix();},
    view(front){if(!homeState)return;camera.position.copy(controls.target).add(front?new THREE.Vector3(0,0,90):new THREE.Vector3(15,9,90));controls.update();},
    theme(value){dark=value;renderer.setClearColor(dark?'#111923':'#f7f8fa');},
    dispose(){dead=true;cancelAnimationFrame(frame);resize.disconnect();controls.dispose();disposeRoot();for(const t of reuse.values())t.dispose();renderer.dispose();renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointerup',onUp);renderer.domElement.removeEventListener('pointermove',onMove);renderer.domElement.remove();},
  };
}
