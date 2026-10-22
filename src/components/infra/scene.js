import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createInfraScene(container, stations, { onSelect, onProject, onReady, onError }) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch { onError(); return { dispose() {}, focus() {}, reset() {} }; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
  const home = new THREE.Vector3(11, 6.5, 16);
  camera.position.copy(home);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 11; controls.maxDistance = 33;
  controls.minPolarAngle = .3; controls.maxPolarAngle = Math.PI * .47;
  const ambient = new THREE.HemisphereLight('#849ab3', '#101319', 1.45);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#d5e4f5', 2.2);
  sun.position.set(-5, 14, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: .5, far: 40 });
  sun.shadow.bias = -.0006;
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#98baff', 2); rim.position.set(6, 5, -7); scene.add(rim);
  const objects = new Map();
  const pickables = [];
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .55, metalness: .15, ...extra });
  const navy = mat('#222d38'), dark = mat('#101820'), silver = mat('#768897', {metalness:.75,roughness:.3}), wood = mat('#30343a'), cream = mat('#4f5d66');
  const glow = color => mat(color, { emissive: color, emissiveIntensity: .75 });
  function box(parent, x,y,z,w,h,d,material, id) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
    mesh.position.set(x,y,z); mesh.castShadow = true; mesh.receiveShadow = true;
    if(id) { mesh.userData.station = id; pickables.push(mesh); }
    parent.add(mesh); return mesh;
  }
  function cylinder(parent,x,y,z,r,h,material,rot=0,id) {
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,32),material);
    mesh.position.set(x,y,z); mesh.rotation.x=rot; mesh.castShadow=true;mesh.receiveShadow=true;
    if(id){mesh.userData.station=id;pickables.push(mesh);}parent.add(mesh);return mesh;
  }
  function line(points,color,width=.025) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,40,width,6,false),mat(color));scene.add(mesh);return mesh;
  }
  function station(id) { const group=new THREE.Group();scene.add(group);objects.set(id,group);return group; }
  const floorMat = mat('#111820', {metalness:.6,roughness:.36});
  box(scene,0,-.28,0,70,.4,70,floorMat);
  box(scene,0,-.03,-2,12,.12,10,mat('#1c252e',{metalness:.65,roughness:.35}));
  const grid=new THREE.GridHelper(60,40,'#263542','#1d2832');grid.position.y=-.065;scene.add(grid);
  for(const x of [-11,11]) {
    for(const z of [-12,-8,-4]) {
      box(scene,x,4,z,.7,8,.55,navy);
      box(scene,x*.97,3.8,z,.06,3.6,.18,glow('#76a7ba'));
    }
  }
  for(const z of [-12,-8,-4]) {
    box(scene,0,8,z,22.5,.35,.5,navy);
    box(scene,0,7.78,z,6,.05,.24,glow('#d3c4a6'));
  }
  box(scene,0,4,-14,20,8,.4,dark);
  for(const x of [-7,-3,3,7]) box(scene,x,3.4,-13.76,.08,5,.03,glow('#5b8395'));
  for(const x of [-5.8,5.8]) {
    box(scene,x,.015,1,.055,.025,19,glow('#6c9eaf'));
    for(let z=-7;z<9;z+=1.4)box(scene,x+(x<0?-.35:.35),.015,z,.5,.026,.12,mat('#8d7455'));
  }
  const keySpot=new THREE.SpotLight('#c9e6ff',95,30,Math.PI*.23,.6,1.7);keySpot.position.set(1,8,2);keySpot.target.position.set(0,1,-3);scene.add(keySpot,keySpot.target);
  const warmSpot=new THREE.SpotLight('#f1a567',65,25,Math.PI*.23,.7,1.7);warmSpot.position.set(-7,5,4);warmSpot.target.position.set(-2,0,0);scene.add(warmSpot,warmSpot.target);
  // Serving cluster: visible GPU modules, status LEDs and ventilated fronts.
  const rack=station('runtime');
  for(const x of [-1.65,0,1.65]) {
    box(rack,x,1.55,-3.6,1.4,3.1,1.5,dark,'runtime');
    box(rack,x,3.14,-3.6,1.46,.1,1.56,silver,'runtime');
    for(let i=0;i<6;i++) {
      const y=.32+i*.43;
      box(rack,x,y,-2.81,1.22,.32,.12,navy,'runtime');
      for(let j=0;j<5;j++)box(rack,x-.45+j*.16,y,-2.73,.07,.17,.025,silver,'runtime');
      box(rack,x+.46,y,-2.71,.06,.06,.03,glow('#74d9ae'),'runtime');
    }
  }
  // Model assembly platform, transparent tensor layers and input blocks.
  const lab=station('structure');
  box(lab,-4.55,.38,.15,2.5,.75,2.8,cream,'structure');
  box(lab,-4.55,.81,.15,2.6,.14,2.9,dark,'structure');
  for(let i=0;i<5;i++) {
    box(lab,-4.55,1.05+i*.27,.15,1.35,.1,1.55,mat(i%2?'#a28bd4':'#78c2dd',{transparent:true,opacity:.8,metalness:.3}),'structure');
    for(const dx of [-.48,.48])box(lab,-4.55+dx,1.02+i*.27,.15,.07,.25,.07,silver,'structure');
  }
  for(let i=0;i<3;i++)box(lab,-5.35+i*.38,.97,1.15,.25,.22,.25,glow('#b58cec'),'structure');
  // Attention desk: Q/K/V matrices shown on a screen; companion GPU board.
  const desk=station('attention');
  box(desk,-1.2,.95,3.55,4.2,.16,1.7,wood,'attention');
  for(const x of [-3, .6])for(const z of [2.9,4.2])box(desk,x,.43,z,.12,.9,.12,navy,'attention');
  box(desk,-1.65,1.45,3.25,.12,.8,.12,silver,'attention');
  box(desk,-1.65,1.9,3.22,2.15,1.2,.13,dark,'attention');
  const screenCanvas=document.createElement('canvas');screenCanvas.width=640;screenCanvas.height=350;
  const ctx=screenCanvas.getContext('2d');
  ctx.fillStyle='#0d2334';ctx.fillRect(0,0,640,350);ctx.fillStyle='#9ee0f7';ctx.font='24px monospace';ctx.fillText('ATTENTION / Q · K · V',30,48);
  for(let i=0;i<12;i++)for(let j=0;j<12;j++){ctx.fillStyle=`rgba(98,192,232,${j<=i?.2+(i+j)%5*.15:.04})`;ctx.fillRect(35+j*24,80+i*18,20,14);}
  ctx.fillStyle='#a7d8c6';ctx.font='18px monospace';ctx.fillText('softmax(QKᵀ)',360,150);ctx.fillText('× V',400,195);
  const texture=new THREE.CanvasTexture(screenCanvas);texture.colorSpace=THREE.SRGBColorSpace;
  box(desk,-1.65,1.9,3.298,1.99,1.05,.013,new THREE.MeshBasicMaterial({map:texture}),'attention');
  box(desk,-1.4,1.06,3.96,1.5,.08,.45,navy,'attention');
  for(let i=0;i<12;i++)box(desk,-2.02+i*.115,1.11,3.98,.08,.025,.28,silver,'attention');
  box(desk,.1,1.1,3.4,.8,.14,.9,mat('#487a65'),'attention');
  box(desk,.1,1.23,3.4,.43,.14,.43,silver,'attention');
  // Open GB300 compute tray: two teaching modules, each with one CPU and two GPUs.
  const compute=station('hardware');
  compute.position.z=5.2;
  const pcb=mat('#245447',{metalness:.4,roughness:.5});
  const copper=mat('#a87d4d',{metalness:.8,roughness:.27});
  box(compute,0,.25,1.15,5.5,.5,3.25,dark,'hardware');
  box(compute,0,.56,1.15,5.3,.12,3.1,silver,'hardware');
  box(compute,0,.65,1.15,5.05,.06,2.85,pcb,'hardware');
  for(const x of [-2.68,2.68])box(compute,x,.8,1.15,.12,.45,3.25,silver,'hardware');
  for(const side of [-1,1]) {
    const cx=side*1.3;
    box(compute,cx,.78,.23,.63,.14,.58,navy,'hardware');
    box(compute,cx,.88,.23,.52,.09,.47,silver,'hardware');
    for(const offset of [-.55,.55]) {
      const gx=cx+offset;
      box(compute,gx,.78,1.35,.89,.18,1.05,navy,'hardware');
      box(compute,gx,.91,1.35,.73,.1,.86,copper,'hardware');
      box(compute,gx,.99,1.35,.55,.08,.64,silver,'hardware');
      for(const dx of [-.33,.33])for(const dz of [-.35,0,.35])box(compute,gx+dx,.89,1.35+dz,.12,.08,.19,dark,'hardware');
      compute.add(line([[gx,1.06,1.35],[gx,1.13,2.2],[cx,1.13,2.5],[cx,1.13,2.68]],'#ac8b62',.045));
    }
    for(let i=0;i<6;i++)box(compute,cx-.85+i*.32,.75,2.2,.2,.12,.4,dark,'hardware');
    box(compute,cx,.76,-.16,1.9,.09,.055,glow('#a2bf6b'),'hardware');
  }
  const badgeCanvas=document.createElement('canvas');badgeCanvas.width=1024;badgeCanvas.height=160;
  const badge=badgeCanvas.getContext('2d');badge.fillStyle='#15201e';badge.fillRect(0,0,1024,160);badge.fillStyle='#c6e0a0';badge.font='bold 62px monospace';badge.fillText('GB300',35,75);badge.fillStyle='#91a6a2';badge.font='25px monospace';badge.fillText('GRACE BLACKWELL ULTRA / COMPUTE TRAY',35,125);
  const badgeTex=new THREE.CanvasTexture(badgeCanvas);badgeTex.colorSpace=THREE.SRGBColorSpace;
  box(compute,0,.36,2.79,3.8,.46,.018,new THREE.MeshBasicMaterial({map:badgeTex}),'hardware');
  // Media studio: projection screen with discrete frames and waveform.
  const media=station('generation');
  box(media,3.65,.55,3.4,2.5,1.1,1.8,cream,'generation');
  box(media,3.65,1.18,3.4,2.7,.15,2,wood,'generation');
  box(media,3.65,1.94,3.08,2.55,1.38,.16,dark,'generation');
  for(let i=0;i<3;i++) {
    box(media,2.85+i*.8,2.03,3.18,.7,.74,.03,mat(['#d6a76e','#82b5bf','#ab9bc5'][i]),'generation');
    box(media,2.85+i*.8,1.58,3.18,.7,.035,.03,glow('#e9b66d'),'generation');
  }
  cylinder(media,4.28,1.43,3.83,.25,.23,dark,Math.PI/2,'generation');
  for(let i=0;i<9;i++)box(media,2.65+i*.14,1.35,3.98,.07,.08+(i%4)*.045,.12,glow('#d6b27a'),'generation');
  // Network cabinet: switch ports, two stacked switches, colored cable routes.
  const fabric=station('parallel');
  box(fabric,4.65,.85,-1.85,2.2,1.7,2,navy,'parallel');
  for(let row=0;row<3;row++) {
    box(fabric,4.65,.42+row*.46,-.8,2,.34,.14,silver,'parallel');
    for(let i=0;i<8;i++)box(fabric,3.85+i*.22,.42+row*.46,-.7,.13,.12,.04,dark,'parallel');
  }
  for(let i=0;i<3;i++)line([[4.3+i*.15,.3,-.68],[4.3+i*.15,.12,.1],[2.6,.1,.4],[2.6,.1,-2.5],[1.65,.4,-2.75]],['#63acb2','#d5a65b','#a58bbf'][i],.027);
  // Weight vault: storage cartridges and a host-memory tray.
  const vault=station('memory');
  box(vault,-4.7,.68,-3.6,2.1,1.36,1.7,silver,'memory');
  for(let i=0;i<4;i++) {
    box(vault,-5.38+i*.45,.7,-2.69,.33,1.04,.12,navy,'memory');
    box(vault,-5.38+i*.45,1.03,-2.6,.2,.05,.03,glow('#d889ad'),'memory');
  }
  rack.scale.y=1.5;
  const selectionRing = new THREE.Mesh(new THREE.RingGeometry(.95,1.02,64),new THREE.MeshBasicMaterial({color:'#80c9f3',transparent:true,opacity:.9,side:THREE.DoubleSide}));
  selectionRing.rotation.x=-Math.PI/2;selectionRing.visible=false;selectionRing.position.y=.025;scene.add(selectionRing);
  let destination=null, frame, disposed=false, down=null;
  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
  const positions = new Map(stations.map(s=>[s.id,new THREE.Vector3(...s.position)]));
  function hit(event) {
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickables,false)[0]?.object.userData.station;
  }
  function pointerDown(event){down=[event.clientX,event.clientY];destination=null;}
  function pointerUp(event){if(down&&Math.hypot(event.clientX-down[0],event.clientY-down[1])<5){const id=hit(event);if(id)onSelect(id);}down=null;}
  function pointerMove(event){renderer.domElement.style.cursor=hit(event)?'pointer':'grab';}
  renderer.domElement.addEventListener('pointerdown',pointerDown);
  renderer.domElement.addEventListener('pointerup',pointerUp);
  renderer.domElement.addEventListener('pointermove',pointerMove);
  const resize=new ResizeObserver(()=>{const {width,height}=container.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();});resize.observe(container);
  scene.background=new THREE.Color('#060a0f');scene.fog=new THREE.Fog('#060a0f',18,43);
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const render=()=>{
    if(disposed)return;
    if(destination){controls.target.lerp(destination.target,reduce?1:.075);camera.position.lerp(destination.camera,reduce?1:.075);if(camera.position.distanceTo(destination.camera)<.015)destination=null;}
    controls.update();renderer.render(scene,camera);
    const rect=container.getBoundingClientRect();
    onProject(stations.map(s=>{const p=positions.get(s.id).clone();p.y+=.65;p.project(camera);return {id:s.id,x:(p.x+1)*rect.width/2,y:(1-p.y)*rect.height/2,visible:p.z<1&&Math.abs(p.x)<1&&Math.abs(p.y)<1};}));
    frame=requestAnimationFrame(render);
  };render();onReady();
  return {
    focus(id){const pos=positions.get(id);if(!pos)return;const target=pos.clone();target.y=Math.min(target.y,1.5);const offset=(id==='hardware'?new THREE.Vector3(4.5,8,10):camera.position.clone().sub(controls.target)).normalize().multiplyScalar(id==='hardware'?13:12);destination={target,camera:target.clone().add(offset)};selectionRing.position.set(pos.x,.025,pos.z);selectionRing.material.color.set(stations.find(s=>s.id===id).color);selectionRing.visible=true;},
    reset(){destination={target:new THREE.Vector3(0,1,0),camera:home.clone()};selectionRing.visible=false;},
    zoom(amount){const offset=camera.position.clone().sub(controls.target);offset.multiplyScalar(amount);offset.clampLength(11,33);camera.position.copy(controls.target).add(offset);destination=null;},
    dispose(){disposed=true;cancelAnimationFrame(frame);resize.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointermove',pointerMove);scene.traverse(obj=>{obj.geometry?.dispose();if(obj.material){for(const m of Array.isArray(obj.material)?obj.material:[obj.material]){m.map?.dispose();m.dispose();}}});renderer.dispose();renderer.domElement.remove();},
  };
}
