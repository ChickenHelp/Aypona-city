/* ---------- Boucle ---------- */
let snapCam=true, lastWhere='', mapT=0, tAll=0, expT=5;
const tmpV=new THREE.Vector3();
const occ={ k:0, d:-1, ok:false, b:-1, lift:0 }, tmpOff=new THREE.Vector3();
function update(dt){
  tAll+=dt;
  const pad=readPad(); const pb=[];
  let mx=0,my=0,run=false,lx=0,ly=0;
  if(pad){
    for(let i=0;i<pad.buttons.length;i++) pb[i]=pressed(pad,i);
    const ax=pad.axes; const ix=dz(ax[0]||0), iy=dz(ax[1]||0), rx=dz(ax[2]||0), ry=dz(ax[3]||0);
    if(ix||iy||rx||ry||pb.some(Boolean)) setMode('pad');
    mx+=ix; my+=-iy; lx=rx; ly=ry; run = pb[7]||pb[10];
  }
  const edge=i=>pb[i]&&!padPrev[i];
  const introOpen=!$('#intro').hidden;
  if(introOpen){ if(edge(0)||edge(9)) closeIntro(); }
  else if(!panel.hidden){
    navCool-=dt;
    if(pad){
      const v=(pb[13]?1:0)-(pb[12]?1:0) || (pb[15]?1:0)-(pb[14]?1:0) || (Math.abs(pad.axes[1]||0)>.6?Math.sign(pad.axes[1]):0);
      if(v && navCool<=0){ setFocus(focusIdx+v); navCool=.18; } if(!v) navCool=0;
      if(edge(0)){ const f=focusables()[focusIdx]; if(f){ if(f.tagName==='INPUT') f.focus(); else f.click(); } }
      if(edge(1)) closePanel();
    }
  } else {
    if(edge(0)) doInteract();
    if(edge(9)) $('#intro').hidden=false;
    if(keys.has('w')||keys.has('z')||keys.has('arrowup')) my+=1;
    if(keys.has('s')||keys.has('arrowdown')) my-=1;
    if(keys.has('a')||keys.has('q')||keys.has('arrowleft')) mx-=1;
    if(keys.has('d')||keys.has('arrowright')) mx+=1;
    if(keys.has('shift')) run=true;
    if(stick.id!==null){ mx+=stick.x; my+=-stick.y; if(Math.hypot(stick.x,stick.y)>.92) run=true; }
  }
  padPrev=pb;

  cam.yaw-=lx*2.6*dt; cam.pitch=clamp(cam.pitch+ly*1.6*dt,.08,1.25);
  const mag=Math.min(1,Math.hypot(mx,my));
  const fx=-Math.sin(cam.yaw), fz=-Math.cos(cam.yaw), rx=-fz, rz=fx;
  let vx=(fx*my+rx*mx), vz=(fz*my+rz*mx); const vl=Math.hypot(vx,vz);
  const speed=(run?13:6.5);
  if(vl>.001){ vx=vx/vl*speed*mag; vz=vz/vl*speed*mag; }
  player.pos.x+=vx*dt; player.pos.z+=vz*dt;
  resolve(player.pos,player.level); resolve(player.pos,player.level);
  if(vl>.05){ const target=Math.atan2(vx,vz); let d=target-player.face; d=Math.atan2(Math.sin(d),Math.cos(d)); player.face+=d*Math.min(1,dt*12); }
  const moving=vl>.05&&mag>.05;
  // Atelier 101 · Mira (v2.7) : marche articulée, amplitude et cadence suivent la vitesse, retour au repos en douceur
  const ud=avatar.userData, spd=moving? Math.hypot(vx,vz) : 0;
  ud.amp+=((moving? (run?1:.62)*mag : 0)-ud.amp)*Math.min(1,dt*9);
  ud.ph=(ud.ph+dt*spd*1.2)%(PI*2);
  const bob=posePerson(avatar,ud.ph,ud.amp,tAll);
  avatar.position.set(player.pos.x, player.level*5 + bob, player.pos.z);
  avatar.rotation.y=player.face;
  halo.position.set(player.pos.x,player.level*5+.18,player.pos.z);

  // découpe du siège
  const under=player.level===-1;
  world.visible=!under; basement.visible=under;
  const inside=under||insideHQ();
  hqUpper.visible = !(inside && player.level===0);
  hqTop.visible = !(inside && player.level<2);
  hqRoof.visible = !inside;

  // caméra
  const target=tmpV.set(player.pos.x, player.level*5+1.7, player.pos.z);
  let pitch=cam.pitch, dist=(inside?8:11)*cam.zoom;
  if(inside) pitch=Math.max(pitch,.82);
  // Atelier 101 · Altaïr (v2.8) : quand un mur passe derrière le joueur, la caméra monte et regarde par-dessus au lieu de se coller à son dos
  else if(occ.lift>.001) pitch+=Math.max(0,1.3-pitch)*occ.lift;
  const off=new THREE.Vector3(Math.sin(cam.yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(cam.yaw)*Math.cos(pitch));
  // Atelier 101 · Rigel (v2.5) : raycast d'occlusion une image sur deux, la dernière distance est gardée entre deux
  if(!inside){ occ.k=(occ.k+1)&3;
    if(occ.k===0 || !occ.ok){ const bp=cam.pitch; tmpOff.set(Math.sin(cam.yaw)*Math.cos(bp),Math.sin(bp),Math.cos(cam.yaw)*Math.cos(bp)); ray.set(target,tmpOff); ray.far=dist; const hb=ray.intersectObjects(occluders,false)[0]; occ.b = hb? hb.distance : -1; }
    if(occ.k===2 || !occ.ok){ ray.set(target,off); ray.far=dist; const hit=ray.intersectObjects(occluders,false)[0]; occ.d = hit? Math.max(2.2,hit.distance-.6) : -1; occ.ok=true; }
    occ.lift+=(((occ.b>0 && occ.b<dist*.6)?1:0)-occ.lift)*Math.min(1,dt*3.5);
    if(occ.d>0) dist=Math.min(dist,occ.d); }
  else { occ.ok=false; occ.lift=0; }
  const desired=target.clone().addScaledVector(off,dist);
  if(snapCam){ camPos.copy(desired); snapCam=false; } else camPos.lerp(desired,Math.min(1,dt*9));
  camera.position.copy(camPos); camera.lookAt(target);

  // agents
  agents.forEach((a,k)=>{
    a.t+=dt; a.ang+=dt*.35; a.ring.rotation.x=PI/2+Math.sin(a.t)*.4; a.ring.rotation.y+=dt*1.5;
    const r=8.6+(k%3)*.5; a.pos.set(a.lot.x+Math.cos(a.ang)*r,3,a.lot.z+Math.sin(a.ang)*r);
    a.g.position.set(a.pos.x, 3+Math.sin(a.t*2)*.35, a.pos.z);
  });
  expT-=dt; if(expT<=0){ expT=5; syncAgents(); updateProduction(); }
  // Atelier 101 · Altaïr (v4.2) : casiers du courrier allumés selon les plis à lire, capsule du tube pneumatique
  if(basement.visible && courrierRoom.cellM){
    const ids=courrierIds().map(x=>x[0]), cnt=ids.map(id=>aLire(id)), sig=cnt.join(',');
    if(sig!==courrierRoom.sig){ courrierRoom.sig=sig; const cc=new THREE.Color();
      for(let i=0;i<courrierRoom.n;i++){ const used=i<ids.length, n=used?cnt[i]:0;
        courrierRoom.cellM.setColorAt(i,cc.setHex(!used?0x15183a: n? 0x6b4fc9 : 0x262a55));
        courrierRoom.tabM.setColorAt(i,cc.setHex(!used?0x1b1f44: n? 0xffc857 : 0x3fbf6a)); }
      courrierRoom.cellM.instanceColor.needsUpdate=true; courrierRoom.tabM.instanceColor.needsUpdate=true; }
    const busy=cnt.some(n=>n>0), cap=courrierRoom.capsule;
    cap.visible=busy; if(busy){ const u=(tAll*.35)%1; cap.position.y=courrierRoom.y0+.5+u*3.6; }
  }
  OFFICES[2].orbs.forEach((o,k)=>{ o.position.y=7.3+Math.sin(tAll*2+k)*.25; });
  if(recep.npc && hqLower.visible){ recep.npc.rotation.y=Math.sin(tAll*.5)*.3; posePerson(recep.npc,0,0,tAll*1.1+.7); } // Atelier 101 · Altaïr (v2.8)
  OFFICES.forEach(o=>{ if(o.npc){ o.npc.rotation.y=Math.sin(tAll*.6+o.cx)*.25; posePerson(o.npc,0,0,tAll+o.cx); } });
  PRESIDENCE.npc.rotation.y=Math.sin(tAll*.4)*.2; posePerson(PRESIDENCE.npc,0,0,tAll*.9+1.3); PRESIDENCE.holo.rotation.y+=dt*1.2; PRESIDENCE.holo.position.y=12.1+Math.sin(tAll*1.6)*.15;

  // chantiers
  for(let k=anims.length-1;k>=0;k--){ const an=anims[k]; an.t+=dt; const p=Math.min(1,an.t/an.dur), e=1-Math.pow(1-p,3); an.g.position.y=an.from*(1-e); if(p>=1) anims.splice(k,1); }

  // prompt
  if(panel.hidden && !introOpen){ current=findInteract(); const pr=$('#prompt'); if(current){ $('#promptText').textContent=current.label; pr.hidden=false; } else pr.hidden=true; }

  // HUD
  const st=districtAt(player.pos.x,player.pos.z);
  const where = inside ? (under? 'Siège · Sous-sol' : player.level===2? 'Siège · Présidence (2e)' : player.level? 'Siège · 1er étage' : 'Siège · Accueil (RDC)') : st? 'Quartier '+st.name : 'Place du Siège';
  if(where!==lastWhere){ lastWhere=where; $('#where').textContent=where; $('#whereDot').style.background = st&&!inside? st.css : '#7cc8ff'; }
  mapT-=dt; if(mapT<=0){ drawMap(); mapT=.1; }
}
let last=performance.now();
function frame(now){ const raw=(now-last)/1000; const dt=Math.min(.05,raw); last=now; adaptRes(raw); update(dt); renderer.render(scene,camera); requestAnimationFrame(frame); }

function start(){ initCity(); initStore(); updateProduction(); drawMap(); requestAnimationFrame(frame); setTimeout(()=>$('#btnStart').focus({preventScroll:true}),50); }
start();
