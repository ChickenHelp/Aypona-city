/* ---------- Quartiers & lots ---------- */
function studioIdx(bx,bz){ const a=Math.atan2(bz,bx); return Math.floor(((a+PI)/(2*PI))*5)%5; }
function districtAt(x,z){ const i=Math.round(x/BS), j=Math.round(z/BS); if(i===0&&j===0) return null; return STUDIOS[studioIdx(i*BS,j*BS)]; }
const lots=[];
for(let j=-2;j<=2;j++) for(let i=-2;i<=2;i++){
  if(!i&&!j) continue; const bx=i*BS, bz=j*BS, st=studioIdx(bx,bz);
  for(const [ox,oz] of [[-8,-8],[8,-8],[-8,8],[8,8]]) lots.push({ i:lots.length, x:bx+ox, z:bz+oz, bx, bz, st, free:true, obj:null, marker:null, kind:null, name:null });
}
const order = lots.map(l=>l.i); for(let k=order.length-1;k>0;k--){ const m=Math.floor(R()*(k+1)); [order[k],order[m]]=[order[m],order[k]]; }

const freeTex = (()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d');
  g.strokeStyle='rgba(124,200,255,.75)'; g.lineWidth=4; g.setLineDash([12,10]); g.strokeRect(6,6,116,116);
  g.fillStyle='rgba(124,200,255,.8)'; g.font='700 20px Figtree, sans-serif'; g.textAlign='center'; g.fillText('LIBRE',64,70);
  return new THREE.CanvasTexture(c); })();
const freeMat = new THREE.MeshBasicMaterial({ map:freeTex, transparent:true, depthWrite:false });
const anims=[];

/* Atelier 101 · Deneb (v2.6) : volume vitré posé à y0. Textures et matériaux partagés par (style, répétition, teinte). */
const towerMats=new Map();
function towerMesh(parent,w,h,d,tint,ti,y0=0){
  const wi=((ti|0)%WIN.length+WIN.length)%WIN.length, rx=Math.max(1,Math.round(w/8*4)/4), ry=Math.max(.5,Math.round(h/16*4)/4);
  const k=wi+'|'+rx+'|'+ry+'|'+tint.getHexString(); let side=towerMats.get(k);
  if(!side){ const t=WIN[wi].clone(); t.needsUpdate=true; t.repeat.set(rx,ry); side=new THREE.MeshBasicMaterial({ map:t, color:tint }); towerMats.set(k,side); }
  const top=lam(0x23284e);
  const m=new THREE.Mesh(boxGeo(w,h,d),[side,side,top,top,side,side]); m.position.y=y0+h/2; parent.add(m); return m;
}
/* Couronne lumineuse translucide et échafaudage (bureaux) */
function crownMat(hex){ const k='cr'+hex; if(!mats.has(k)) mats.set(k,new THREE.MeshBasicMaterial({ color:hex, transparent:true, opacity:.32, depthWrite:false, blending:THREE.AdditiveBlending })); return mats.get(k); }
const scaffoldMats=new Map(), hideMat=new THREE.MeshBasicMaterial({ visible:false });
function scaffoldMat(ry){
  const k=ry; let m=scaffoldMats.get(k); if(m) return m;
  if(!scaffoldMat.tex){ const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d');
    g.strokeStyle='#ffc857'; g.lineWidth=3; g.beginPath(); g.moveTo(1.5,0); g.lineTo(1.5,64); g.moveTo(33.5,0); g.lineTo(33.5,64); g.stroke();
    g.strokeStyle='#d9ddf5'; g.lineWidth=4; g.beginPath(); g.moveTo(0,2); g.lineTo(64,2); g.stroke();
    g.strokeStyle='rgba(200,206,240,.85)'; g.lineWidth=1.6; g.beginPath(); g.moveTo(2,4); g.lineTo(33,62); g.moveTo(34,62); g.lineTo(64,4); g.stroke();
    scaffoldMat.tex=new THREE.CanvasTexture(c); scaffoldMat.tex.wrapS=scaffoldMat.tex.wrapT=THREE.RepeatWrapping; }
  const t=scaffoldMat.tex.clone(); t.needsUpdate=true; t.repeat.set(3,ry);
  m=new THREE.MeshBasicMaterial({ map:t, alphaTest:.45, side:THREE.DoubleSide }); scaffoldMats.set(k,m); return m;
}
/* Atelier 101 · Deneb (v4.3) : domicile d'une app, lu dans spec.domicile. Forme et couleur distinctes, lisibles de loin :
   privé = losange rose (fermé), service = deux anneaux croisés cyan (relais), public = globe blanc cerclé (ouvert à tous). */
const DOMICILES={
  prive:  { nom:'privé',   hex:0xff6fae, css:'#ff6fae' },
  service:{ nom:'service', hex:0x5ef0ff, css:'#5ef0ff' },
  public: { nom:'public',  hex:0xf4f6ff, css:'#f4f6ff' },
};
const DOMGEO={};
function domSign(GL,LM,dom,x,y0,z,mast){
  const M=(rx,ry,sx,sy,sz,yy)=>new THREE.Matrix4().compose(new THREE.Vector3(x,yy,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,0)),new THREE.Vector3(sx,sy,sz));
  if(mast) LM.push([boxGeo(.2,mast,.2),T4(x,y0+mast/2,z),0x8890c0]);
  const y=y0+mast+.85;
  LM.push([boxGeo(.5,.18,.5),T4(x,y0+mast+.09,z),0x3a3f6a]); // collier du mât
  if(dom===DOMICILES.prive){
    GL.push([DOMGEO.oct||(DOMGEO.oct=new THREE.OctahedronGeometry(.7)),M(0,PI/4,1,1.35,1,y),dom.hex]);
  } else if(dom===DOMICILES.service){
    const t=DOMGEO.ring||(DOMGEO.ring=new THREE.TorusGeometry(.72,.13,6,22));
    GL.push([t,M(0,PI/4,1,1,1,y),dom.hex],[t,M(0,-PI/4,1,1,1,y),dom.hex],[DOMGEO.core||(DOMGEO.core=new THREE.SphereGeometry(.24,8,6)),M(0,0,1,1,1,y),dom.hex]);
  } else {
    GL.push([DOMGEO.globe||(DOMGEO.globe=new THREE.SphereGeometry(.52,12,8)),M(0,0,1,1,1,y),dom.hex],
            [DOMGEO.belt||(DOMGEO.belt=new THREE.TorusGeometry(.92,.09,6,24)),M(PI/2,0,1,1,1,y),dom.hex]);
  }
}
function tintOf(st, mix=.22){ return new THREE.Color(0xffffff).lerp(new THREE.Color(STUDIOS[st].hex), mix); }

function placeOnLot(lot, spec, animate){
  const g=new THREE.Group(); g.position.set(lot.x,0,lot.z); world.add(g);
  const o={ group:g, colls:[], inters:[], meshes:[] };
  const st=STUDIOS[lot.st]; let h=spec.h||20;
  if(spec.kind==='app' || spec.kind==='filler' || spec.kind==='tour'){
    const w = spec.kind==='app'?10 : spec.kind==='tour'?9 : (spec.w||9);
    if(spec.kind==='app'){
      // Atelier 101 · Deneb (v2.6) : 2 ou 3 volumes en gradins selon la hauteur, liseré au studio à chaque retrait
      const tiers = h>=24 ? [[.46,w],[.32,w*.8],[.22,w*.6]] : [[.62,w],[.38,w*.74]];
      let y=0; const tint=tintOf(lot.st,.25), t0=spec.t||0;
      // Atelier 101 · Rigel (v2.11) : flancs des gradins seuls (1 draw call par gradin) ; dessus des gradins, liserés,
      // porte et toit fusionnés en 2 maillages par tour (lumineux / mat). o.meshes et l'occlusion caméra inchangés.
      const GL=[], LM=[];
      tiers.forEach(([f,tw],k)=>{ const th=k===tiers.length-1 ? h-y : Math.round(h*f*2)/2;
        const m=towerMesh(g,tw,th,tw,tint,t0+k*4,y); m.geometry=sideGeo(tw,th,tw); o.meshes.push(m);
        LM.push([boxGeo(tw,th,tw),T4(0,y+th/2,0),0x23284e,12,12]); y+=th;
        GL.push([boxGeo(tw+.3,.4,tw+.3),T4(0,y-.2,0),st.hex]); });
      const top=tiers[tiers.length-1][1], roof=((spec.name||'').length+h)%2;
      // Atelier 101 · Deneb (v4.3) : signe de domicile (spec.domicile facultatif : 'prive', 'service', 'public'), fusionné aux lumineux, 0 draw call en plus
      const dom=DOMICILES[spec.domicile];
      if(roof){ // antenne décalée, feu rouge au sommet (remplacé par la balise de domicile si le champ est là)
        LM.push([boxGeo(1.4,1.2,1.4),T4(top*.22,h+.6,-top*.22),0x3a3f6a],[boxGeo(.22,6.5,.22),T4(top*.22,h+3.25,-top*.22),0x8890c0]);
        if(dom) domSign(GL,LM,dom,top*.22,h+6.5,-top*.22,0);
        else GL.push([PGEO.tip||(PGEO.tip=new THREE.SphereGeometry(.32,8,6)),T4(top*.22,h+6.6,-top*.22),0xff5d73]);
      } else { // toit-terrasse : garde-corps en verre dépoli et kiosque éclairé (mât et balise de domicile sur le kiosque si le champ est là)
        box(g,top+.1,.9,top+.1,0,h+.45,0,frostMat); GL.push([boxGeo(top*.36,1.5,top*.36),T4(-top*.18,h+.75,top*.18),st.hex]);
        if(dom) domSign(GL,LM,dom,-top*.18,h+1.5,top*.18,5);
      }
      GL.push([boxGeo(4,2.6,.3),T4(0,1.3,w/2+.1),st.hex]); // porte
      { const mg=new THREE.Mesh(mergeColored(GL),vcMat('b')), ml=new THREE.Mesh(mergeColored(LM),vcMat('l')); ml.renderOrder=1; g.add(mg,ml); } // dessus des gradins dessinés après les liserés coplanaires, comme avant
    } else {
      const m=towerMesh(g,w,h,w,tintOf(lot.st, spec.kind==='filler'?.08:.25),spec.t||0); o.meshes.push(m);
      if(spec.kind!=='filler'){ box(g,w+.3,.5,w+.3,0,h-.25,0,glow(st.hex)); }
    }
    if(spec.kind==='tour'){ box(g,.3,6,.3,0,h+3,0,lam(0x8890c0)); const tip=new THREE.Mesh(new THREE.SphereGeometry(.4,8,6),glow(0xff5d73)); tip.position.y=h+6.2; g.add(tip); }
    if(spec.kind==='app'){
      const s=label(spec.name, st.css); s.position.y=h+2.6; g.add(s);
      o.inters.push({ type:'box', minX:lot.x-w/2, maxX:lot.x+w/2, minZ:lot.z-w/2, maxZ:lot.z+w/2, level:0, r:2.4, label:'Visiter '+spec.name, act:()=>openPanel(()=>panelApp(lot)) });
    }
    o.colls.push(collide(lot.x-w/2,lot.x+w/2,lot.z-w/2,lot.z+w/2,0));
  } else if(spec.kind==='bureau'){
    const c=chantier(spec.bureau.chantier); h=14;
    // Atelier 101 · Deneb (v2.6) : socle 11×11, corps en retrait 9×9, couronne lumineuse, échafaudage tant que la grue est là
    const tint=new THREE.Color(0xffffff).lerp(new THREE.Color(c.hex),.32), SH=4.5, CH=1.4;
    o.meshes.push(towerMesh(g,11,SH,11,tint,3,0));
    box(g,11.4,.3,11.4,0,SH+.1,0,glow(c.hex));
    o.meshes.push(towerMesh(g,9,h-SH-CH,9,tint,2,SH));
    box(g,9.6,CH,9.6,0,h-CH/2,0,crownMat(c.hex)); box(g,9.7,.3,9.7,0,h-CH,0,glow(c.hex)); box(g,9.7,.35,9.7,0,h-.17,0,glow(c.hex));
    box(g,4,3,.3,0,1.5,5.6,glow(c.hex));
    const sh=h-SH, sm=scaffoldMat(Math.round(sh/3.3*2)/2), sg=boxGeo(10,sh,10);
    const scaf=new THREE.Mesh(sg,[sm,sm,hideMat,hideMat,sm,sm]); scaf.position.y=SH+sh/2; g.add(scaf);
    o.crane=[ box(g,.5,10,.5,4.5,h+5,4.5,lam(0xffc857)), box(g,12,.45,.45,.5,h+10,4.5,lam(0xffc857)), box(g,.08,4,.08,-4.5,h+8,4.5,lam(0xeef0ff)), box(g,.8,.6,.8,-4.5,h+5.8,4.5,lam(0x8890c0)), scaf ];
    box(g,9.4,.8,.2,0,7,4.62,glow(0x10132e)); o.fill=box(g,9,.5,.22,0,7,4.68,glow(c.hex)); o.fill.scale.x=.001;
    o.signY=h+12.6; o.lastTxt=null;
    const bid=spec.bureau.id;
    o.inters.push({ type:'box', minX:lot.x-5.5, maxX:lot.x+5.5, minZ:lot.z-5.5, maxZ:lot.z+5.5, level:0, r:2.4, label:'Entrer au bureau '+bid+' · '+c.nom, act:()=>openPanel(()=>panelBureau(bid)) });
    o.colls.push(collide(lot.x-5.5,lot.x+5.5,lot.z-5.5,lot.z+5.5,0));
    lot.chantier=spec.bureau.chantier; spec.name=bid; lot.obj=o; setTimeout(updateProduction,0);
  } else if(spec.kind==='maison'){
    h=5; const m=box(g,9,5,7,0,2.5,0,lam(0xe9d8c4)); o.meshes.push(m);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(6.6,3.2,4),lam(0xc65b4a)); roof.position.y=6.6; roof.rotation.y=PI/4; roof.scale.z=.78; g.add(roof);
    box(g,1.4,2.4,.2,0,1.2,3.55,lam(0x5a3d2e)); box(g,1.6,1.2,.2,-2.8,2.8,3.55,glow(0xffd88f)); box(g,1.6,1.2,.2,2.8,2.8,3.55,glow(0xffd88f));
    o.colls.push(collide(lot.x-4.5,lot.x+4.5,lot.z-3.5,lot.z+3.5,0));
  } else if(spec.kind==='parc'){
    h=4; const p=box(g,13,.16,13,0,.14,0,lam(0x2d7a55)); o.meshes.push(p);
    tree(g,-4,-4,1.2); tree(g,4,-3.5,1); tree(g,-3.5,4,1.1); tree(g,4.5,4.2,1.3);
    const pond=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.2,.1,20),lam(0x3c8fd6)); pond.position.y=.25; g.add(pond);
  }
  if(lot.marker) lot.marker.visible=false;
  o.inters.forEach(x=>interacts.push(x));
  o.meshes.forEach(m=>occluders.push(m));
  if(animate){ g.position.y=-h-8; anims.push({ g, t:0, dur:1.6, from:-h-8 }); }
  lot.obj=o; lot.free=false; lot.kind=spec.kind; lot.name=spec.name||null; mapDirty=true;
  return o;
}
function clearLot(lot){
  const o=lot.obj; if(!o) return; world.remove(o.group);
  // Atelier 101 · Altaïr (v2.8) : libère seulement les panneaux (sprites), propres à chaque bâtiment ; matériaux et géométries de façade sont partagés
  o.group.traverse(m=>{ if(m.isSprite){ const sm=m.material; if(sm.map) sm.map.dispose(); sm.dispose(); } });
  o.colls.forEach(c=>{ const k=colliders.indexOf(c); if(k>=0) colliders.splice(k,1); });
  o.inters.forEach(c=>{ const k=interacts.indexOf(c); if(k>=0) interacts.splice(k,1); });
  o.meshes.forEach(c=>{ const k=occluders.indexOf(c); if(k>=0) occluders.splice(k,1); });
  lot.obj=null; lot.free=true; lot.kind=null; lot.name=null; if(lot.marker) lot.marker.visible=true; mapDirty=true;
}

