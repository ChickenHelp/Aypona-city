/* ---------- Three.js ---------- */
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
// Atelier 101 (v2.4) : résolution plafonnée à 1,5× sur écran tactile pour garder la fluidité sur téléphone
const COARSE = matchMedia('(pointer:coarse)').matches;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, COARSE?1.5:1.75));
// Atelier 101 · Rigel (v2.5) : résolution adaptative, pixelRatio descend à 1 si < 40 img/s en moyenne pendant 2 s, sans jamais remonter
const perf = { acc:0, n:0, low:0, done: renderer.getPixelRatio()<=1 };
function adaptRes(dt){
  if(perf.done || dt>.25) return; // onglet en pause ou gros à-coup : ignoré
  perf.acc+=dt; perf.n++;
  if(perf.acc<.5) return;
  const fps=perf.n/perf.acc; perf.acc=0; perf.n=0;
  perf.low = fps<40 ? perf.low+.5 : 0;
  if(perf.low>=2){ perf.done=true; renderer.setPixelRatio(Math.min(1, renderer.getPixelRatio())); resize(); }
}
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1030);
// brouillard accordé au halo d'horizon du ciel (Atelier 101, v2.4)
scene.fog = new THREE.Fog(0x1a1a46, 70, 240);
const world = new THREE.Group(); scene.add(world);
const basement = new THREE.Group(); basement.visible=false; scene.add(basement);
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 700);
function resize(){ const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

scene.add(new THREE.HemisphereLight(0x9aa8ff, 0x1a1530, 0.95));
const sun = new THREE.DirectionalLight(0xffd6b0, 0.55); sun.position.set(60,100,40); scene.add(sun);

const mats = new Map();
function lam(c){ const k='l'+c; if(!mats.has(k)) mats.set(k,new THREE.MeshLambertMaterial({color:c})); return mats.get(k); }
function glow(c){ const k='b'+c; if(!mats.has(k)) mats.set(k,new THREE.MeshBasicMaterial({color:c})); return mats.get(k); }
const glassMat = new THREE.MeshLambertMaterial({ color:0x9fd8ff, transparent:true, opacity:.2, depthWrite:false });
const frostMat = new THREE.MeshLambertMaterial({ color:0xc8d0ff, transparent:true, opacity:.5, depthWrite:false });
// Atelier 101 · Rigel (v2.5) : cache de géométries, une seule BoxGeometry par dimensions (w,h,d)
const boxGeos = new Map();
function boxGeo(w,h,d){ const k=w+'|'+h+'|'+d; let g=boxGeos.get(k); if(!g){ g=new THREE.BoxGeometry(w,h,d); boxGeos.set(k,g); } return g; }
function box(parent,w,h,d,x,y,z,mat){ const m=new THREE.Mesh(boxGeo(w,h,d),mat); m.position.set(x,y,z); parent.add(m); return m; }
/* Atelier 101 · Rigel (v2.11) : passe draw calls.
   mergeColored() fusionne des pièces opaques en une seule géométrie à couleurs par sommet : vcMat('b') rend
   comme glow(c), vcMat('l') comme lam(c), sans changement visuel. Les copies temporaires sont libérées,
   jamais les géométries ni les matériaux partagés. sideGeo() : flancs seuls d'une boîte (1 groupe au lieu de 6). */
const vcMats={};
function vcMat(k){ return vcMats[k] || (vcMats[k] = k==='b' ? new THREE.MeshBasicMaterial({ vertexColors:true }) : new THREE.MeshLambertMaterial({ vertexColors:true })); }
const T4=(x,y,z)=>new THREE.Matrix4().makeTranslation(x,y,z);
function mergeColored(parts){
  const pos=[], nor=[], col=[], c=new THREE.Color();
  for(const [geo,mtx,hex,from=0,cnt] of parts){
    const g=geo.index? geo.toNonIndexed() : geo.clone(); if(mtx) g.applyMatrix4(mtx);
    const P=g.attributes.position, N=g.attributes.normal, end=cnt!=null? from+cnt : P.count; c.setHex(hex);
    for(let i=from;i<end;i++){ pos.push(P.getX(i),P.getY(i),P.getZ(i)); nor.push(N.getX(i),N.getY(i),N.getZ(i)); col.push(c.r,c.g,c.b); }
    g.dispose();
  }
  const out=new THREE.BufferGeometry();
  out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); out.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); out.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  out.computeBoundingSphere(); return out;
}
const sideGeos=new Map();
function sideGeo(w,h,d){
  const k=w+'|'+h+'|'+d; let g=sideGeos.get(k); if(g) return g;
  const b=boxGeo(w,h,d), I=b.index.array; g=new THREE.BufferGeometry();
  for(const n in b.attributes) g.setAttribute(n,b.attributes[n]);
  g.setIndex([...I.slice(0,12),...I.slice(24,36)]); g.addGroup(0,24,0); // faces +x, -x, +z, -z ; dessus et dessous partent dans la fusion
  g.parameters=b.parameters; g.computeBoundingSphere(); sideGeos.set(k,g); return g;
}

/* Collisions, interactions, occlusion caméra */
const colliders = [], interacts = [], occluders = [];
function collide(minX,maxX,minZ,maxZ,level){ const c={minX,maxX,minZ,maxZ,level}; colliders.push(c); return c; }

/* Textures */
/* Atelier 101 · Deneb (v2.6) : fenêtres fines et variées. 128×256 px = 8 × 16 unités de façade.
   Trois écritures (grille à meneaux, bandeaux filants, meurtrières) × deux tirages = 6 textures.
   Les étages entièrement allumés et les vitrages éteints varient d'un étage à l'autre. */
function windowTex(seed){
  const c=document.createElement('canvas'); c.width=128; c.height=256; const g=c.getContext('2d'); const r=rng(seed*7919+13);
  const style=seed%3;
  g.fillStyle='#171b3c'; g.fillRect(0,0,128,256);
  const LIT=['#ffd88f','#ffe3ad','#ffcf7a','#a4d6ff','#c4e4ff','#ffa8d4'];
  const pane=floorMode=>{ const v=r(); if(floorMode===2) return LIT[(r()*3)|0]; if(floorMode===1 ? v<.82 : v<.5) return v<.25?'#1f2347':v<.6?'#262b52':'#2c3260'; return LIT[(r()*LIT.length)|0]; };
  for(let fy=0;fy<256;fy+=32){
    const fm = r()<.12 ? 2 : r()<.3 ? 1 : 0; // 2 : étage allumé en entier, 1 : étage presque éteint
    g.fillStyle='#232853'; g.fillRect(0,fy+30,128,2); // dalle d'étage
    if(style===0){ // grille à meneaux
      for(let x=0;x<128;x+=16){ g.fillStyle=pane(fm); g.fillRect(x+3,fy+6,10,20); g.fillStyle='rgba(20,24,56,.55)'; g.fillRect(x+7.5,fy+6,1,20); g.fillRect(x+3,fy+15,10,1); }
    } else if(style===1){ // bandeaux filants
      g.fillStyle='#202550'; g.fillRect(0,fy+9,128,14);
      for(let x=0;x<128;){ const n=1+((r()*4)|0), col=pane(fm); for(let k=0;k<n&&x<128;k++,x+=8){ g.fillStyle=col; g.fillRect(x+1,fy+10,6,12); } }
    } else { // meurtrières
      for(let x=0;x<128;x+=8){ g.fillStyle=pane(fm); g.fillRect(x+2,fy+4,3,24); }
    }
  }
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy()); return t;
}
const WIN = [windowTex(1),windowTex(2),windowTex(3),windowTex(4),windowTex(5),windowTex(6)];
function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.lineTo(x+w-r,y); g.quadraticCurveTo(x+w,y,x+w,y+r); g.lineTo(x+w,y+h-r); g.quadraticCurveTo(x+w,y+h,x+w-r,y+h); g.lineTo(x+r,y+h); g.quadraticCurveTo(x,y+h,x,y+h-r); g.lineTo(x,y+r); g.quadraticCurveTo(x,y,x+r,y); g.closePath(); }
function label(text, color='#7cc8ff', scale=.035){
  const c=document.createElement('canvas'), g=c.getContext('2d'); const font='700 46px Figtree, system-ui, sans-serif';
  g.font=font; const w=Math.ceil(g.measureText(text).width)+60; c.width=w; c.height=84;
  g.font=font; rr(g,3,3,w-6,78,39); g.fillStyle='rgba(12,14,38,.82)'; g.fill(); g.lineWidth=5; g.strokeStyle=color; g.stroke();
  g.fillStyle='#ffffff'; g.textBaseline='middle'; g.fillText(text,30,45);
  const t=new THREE.CanvasTexture(c); t.minFilter=THREE.LinearFilter;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({ map:t, transparent:true, depthWrite:false, fog:true }));
  s.scale.set(w*scale, 84*scale, 1); LABELS.add(s); return s;
}
/* Atelier 101 · Electra (v2.9) : étiquettes 3D.
   1) Les étiquettes d'un étage du siège ne s'affichent que si le joueur est à cet étage, ou dehors à moins de 30 m.
   2) Aucune étiquette n'est coupée par le bord haut de l'écran : elle glisse vers le bas, ou s'efface si son ancre est trop loin au-dessus
      ou si elle est plus large que 80 % de l'écran (vue de trop près).
   Réglé juste avant chaque rendu (scene.onBeforeRender), après la mise à jour des matrices. */
const LABELS=new Set(), _lp=new THREE.Vector3(), _lu=new THREE.Vector3(), LABEL_NEAR=30, LABEL_TOP=.985;
function labelFloor(s){ for(let o=s.parent;o;o=o.parent){ if(o===scene) return { in:true, f:null };
  if(o===hqLower) return lf(o,0); if(o===hqUpper) return lf(o,1); if(o===hqTop) return lf(o,2); }
  return { in:false }; }
function lf(o,f){ let p=o.parent; while(p&&p!==scene) p=p.parent; return { in:p===scene, f }; }
scene.onBeforeRender=function(r,sc,cam){
  const outside = player.level===0 && !insideHQ();
  for(const s of LABELS){
    const L=labelFloor(s); if(!L.in){ LABELS.delete(s); continue; }
    _lp.setFromMatrixPosition(s.matrixWorld);
    let vis=true;
    if(L.f!==null) vis = outside ? Math.hypot(_lp.x-player.pos.x,_lp.z-player.pos.z)<LABEL_NEAR : player.level===L.f;
    s.center.y=.5;
    if(vis){
      _lu.set(0,1,0).applyQuaternion(cam.quaternion).multiplyScalar(s.scale.y).add(_lp);
      _lp.project(cam); _lu.project(cam);
      const H=_lu.y-_lp.y; // hauteur de l'étiquette en coordonnées écran (-1..1)
      // trop proche : plus large que 80 % de l'écran, elle serait coupée de toute façon → masquée
      if(H*(s.scale.x/s.scale.y)/cam.aspect>1.6) vis=false;
      else if(_lp.z<1 && H>0){ const top=_lp.y+H*.5;
        if(top>LABEL_TOP){ const c=1-(LABEL_TOP-_lp.y)/H; if(c>2.5) vis=false; else s.center.y=c; } }
    }
    s.visible=vis;
  }
};

