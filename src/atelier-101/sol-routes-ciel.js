/* ---------- Sol, routes, lampadaires ---------- */
const BS = 44, RL = [-110,-66,-22,22,66,110];
const ground = new THREE.Mesh(new THREE.PlaneGeometry(700,700), lam(0x161a35)); ground.rotation.x=-PI/2; world.add(ground);
(function roads(){
  const c=document.createElement('canvas'); c.width=8; c.height=64; const g=c.getContext('2d'); g.fillStyle='#e9ecff'; g.fillRect(0,0,8,32);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(1,46);
  const m=new THREE.MeshBasicMaterial({ map:t, transparent:true, opacity:.55, alphaTest:.1 });
  const hide = new THREE.MeshBasicMaterial({ transparent:true, opacity:0 });
  for(const v of RL){
    const a=new THREE.Mesh(new THREE.PlaneGeometry(.35,272),m); a.rotation.x=-PI/2; a.position.set(v,.02,0); world.add(a);
    const b=new THREE.Mesh(new THREE.PlaneGeometry(.35,272),m); b.rotation.x=-PI/2; b.rotation.z=PI/2; b.position.set(0,.02,v); world.add(b);
  }
  for(let i=-2;i<=2;i++) for(let j=-2;j<=2;j++){
    box(world,32,.12,32,i*BS,.06,j*BS, lam(i===0&&j===0?0x2e3360:0x252a4c));
  }
  for(const x of RL) for(const z of RL){
    const px=x+6.6, pz=z+6.6;
    box(world,.22,6,.22,px,3,pz,lam(0x3a3f6a));
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8),glow(0xffe0a3)); bulb.position.set(px,6.2,pz); world.add(bulb);
  }
  /* Atelier 101 (v2.4) · chaussées : bandes d'asphalte sombre sous les marquages (12 plans, sans collision) */
  const asph=lam(0x0f1229);
  for(const v of RL){
    const a=new THREE.Mesh(new THREE.PlaneGeometry(11.4,272),asph); a.rotation.x=-PI/2; a.position.set(v,.012,0); world.add(a);
    const b=new THREE.Mesh(new THREE.PlaneGeometry(272,11.4),asph); b.rotation.x=-PI/2; b.position.set(0,.011,v); world.add(b);
  }
  /* Atelier 101 (v2.4) · lumière des lampadaires : flaques au sol + halos, 2 draw calls pour les 36 lampes */
  const gc=document.createElement('canvas'); gc.width=gc.height=64; const gg=gc.getContext('2d');
  const rg=gg.createRadialGradient(32,32,0,32,32,32); rg.addColorStop(0,'rgba(255,226,170,1)'); rg.addColorStop(.35,'rgba(255,200,130,.45)'); rg.addColorStop(1,'rgba(255,190,120,0)');
  gg.fillStyle=rg; gg.fillRect(0,0,64,64); const gt=new THREE.CanvasTexture(gc);
  const pos=[]; for(const x of RL) for(const z of RL) pos.push([x+6.6,z+6.6]);
  const poolGeo=new THREE.PlaneGeometry(13,13); poolGeo.rotateX(-PI/2);
  const pools=new THREE.InstancedMesh(poolGeo,new THREE.MeshBasicMaterial({ map:gt, transparent:true, opacity:.6, depthWrite:false, blending:THREE.AdditiveBlending, fog:false }),pos.length);
  const mtx=new THREE.Matrix4(); pos.forEach(([x,z],k)=>{ mtx.makeTranslation(x,.16,z); pools.setMatrixAt(k,mtx); }); pools.instanceMatrix.needsUpdate=true; pools.frustumCulled=false; world.add(pools);
  const hp=new Float32Array(pos.length*3); pos.forEach(([x,z],k)=>{ hp[k*3]=x; hp[k*3+1]=6.2; hp[k*3+2]=z; });
  const hg=new THREE.BufferGeometry(); hg.setAttribute('position',new THREE.Float32BufferAttribute(hp,3));
  world.add(new THREE.Points(hg,new THREE.PointsMaterial({ map:gt, size:4.2, sizeAttenuation:true, transparent:true, opacity:.75, depthWrite:false, blending:THREE.AdditiveBlending, color:0xffe2aa })));
})();
/* Atelier 101 (v2.4) · ciel de nuit : dôme en dégradé avec halo d'horizon violet et lune. Dans world, donc absent du sous-sol. */
(function sky(){
  const c=document.createElement('canvas'); c.width=4; c.height=512; const g=c.getContext('2d');
  const gr=g.createLinearGradient(0,0,0,512);
  gr.addColorStop(0,'#03041a'); gr.addColorStop(.30,'#080b2a'); gr.addColorStop(.43,'#141640');
  gr.addColorStop(.485,'#3a2768'); gr.addColorStop(.5,'#1a1a46'); gr.addColorStop(1,'#1a1a46');
  g.fillStyle=gr; g.fillRect(0,0,4,512);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(520,32,20),new THREE.MeshBasicMaterial({ map:new THREE.CanvasTexture(c), side:THREE.BackSide, fog:false, depthWrite:false }));
  dome.renderOrder=-1; world.add(dome);
  const mc=document.createElement('canvas'); mc.width=mc.height=128; const m=mc.getContext('2d');
  const mr=m.createRadialGradient(64,64,0,64,64,64); mr.addColorStop(0,'rgba(255,248,230,1)'); mr.addColorStop(.22,'rgba(255,244,220,1)'); mr.addColorStop(.26,'rgba(200,190,255,.35)'); mr.addColorStop(1,'rgba(160,150,255,0)');
  m.fillStyle=mr; m.fillRect(0,0,128,128);
  const moon=new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(mc), fog:false, depthWrite:false, transparent:true }));
  moon.position.set(-190,230,-330); moon.scale.set(70,70,1); world.add(moon);
})();
// étoiles
(function stars(){ const n=600, p=new Float32Array(n*3); const r=rng(9);
  for(let i=0;i<n;i++){ const th=r()*PI*2, ph=r()*PI*.42; const d=420; p[i*3]=Math.cos(th)*Math.sin(ph)*d; p[i*3+1]=Math.cos(ph)*d*.6+40; p[i*3+2]=Math.sin(th)*Math.sin(ph)*d; }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  world.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xdfe4ff,size:1.4,fog:false})));
})();
function tree(parent,x,z,s=1){ box(parent,.3*s,1.4*s,.3*s,x,.7*s,z,lam(0x5a3d2e)); const c=new THREE.Mesh(new THREE.ConeGeometry(1.3*s,3*s,7),lam(0x2f8f6a)); c.position.set(x,2.8*s,z); parent.add(c); }

