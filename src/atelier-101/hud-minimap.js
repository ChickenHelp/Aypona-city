/* ---------- HUD (Atelier 101 · Electra, v2.9) : bas du bloc du haut → --hud-top, pour que le toast ne le recouvre jamais ---------- */
(function hudTop(){ const app=$('#app'), els=[$('.brand'),$('#mapWrap')];
  const upd=()=>{ const b=Math.max(...els.map(e=>e.getBoundingClientRect().bottom)); if(b>0) app.style.setProperty('--hud-top',Math.round(b+8)+'px'); };
  upd(); addEventListener('resize',upd); if(window.ResizeObserver){ const ro=new ResizeObserver(upd); els.forEach(e=>ro.observe(e)); } })();

/* ---------- Minimap ----------
   Atelier 101 · Electra (v2.9) : carte centrée sur le joueur, nord en haut, fenêtre de 150 m.
   Fond dessiné une fois à 2 px/m (544 px pour la ville), bureaux à la couleur de leur chantier avec un liseré clair,
   joueur au centre : flèche de marche + cône de la caméra. */
const mm=$('#minimap'), mg=mm.getContext('2d'); let mapDirty=true; const MPX=2, MB=272*MPX, MVIEW=150, MS=264/MVIEW;
const mapBase=document.createElement('canvas'); mapBase.width=mapBase.height=MB;
const W2M=v=>(v+136)*MPX;
function drawMapBase(){
  const g=mapBase.getContext('2d'), P=MPX; g.clearRect(0,0,MB,MB); g.fillStyle='#10132e'; g.fillRect(0,0,MB,MB);
  // îlots, teintés très légèrement à la couleur du studio du quartier
  for(let i=-2;i<=2;i++) for(let j=-2;j<=2;j++){ g.fillStyle='#262a4c'; g.fillRect(W2M(i*BS-16),W2M(j*BS-16),32*P,32*P);
    if(i||j){ g.globalAlpha=.1; g.fillStyle=STUDIOS[studioIdx(i*BS,j*BS)].css; g.fillRect(W2M(i*BS-16),W2M(j*BS-16),32*P,32*P); g.globalAlpha=1; } }
  lots.forEach(l=>{
    if(l.free){ g.strokeStyle='rgba(124,200,255,.3)'; g.lineWidth=1.5; g.setLineDash([4,3]); g.strokeRect(W2M(l.x-5),W2M(l.z-5),10*P,10*P); g.setLineDash([]); return; }
    if(l.kind==='bureau'){ const c=chantier(l.chantier).css, s=11*P; rr(g,W2M(l.x)-s/2,W2M(l.z)-s/2,s,s,4); g.fillStyle=c; g.fill(); g.lineWidth=2.5; g.strokeStyle='#eef0ff'; g.stroke(); return; }
    g.fillStyle = l.kind==='filler'?'#4a4f7a': l.kind==='parc'?'#2d7a55': l.kind==='maison'?'#c65b4a' : STUDIOS[l.st].css;
    const s=(l.kind==='filler'?8:10)*P; g.fillRect(W2M(l.x)-s/2,W2M(l.z)-s/2,s,s); });
  g.fillStyle='#eef0ff'; g.fillRect(W2M(-14),W2M(-10),28*P,20*P); g.fillStyle='#ffc857'; g.fillRect(W2M(-14),W2M(-10),28*P,3);
  mapDirty=false;
}
function drawMap(){
  if(mapDirty) drawMapBase();
  const S=MS, cx=132, cy=132, px=player.pos.x, pz=player.pos.z, half=MVIEW/2, toC=(wx,wz)=>[cx+(wx-px)*S, cy+(wz-pz)*S];
  mg.fillStyle='#0b0e26'; mg.fillRect(0,0,264,264);
  mg.drawImage(mapBase,W2M(px-half),W2M(pz-half),MVIEW*MPX,MVIEW*MPX,0,0,264,264);
  agents.forEach(a=>{ const [x,y]=toC(a.pos.x,a.pos.z); if(x<-6||y<-6||x>270||y>270) return;
    mg.fillStyle=a.active?a.col.css:'#6a6f99'; mg.strokeStyle='#0b0e26'; mg.lineWidth=2; mg.beginPath(); mg.arc(x,y,5,0,7); mg.stroke(); mg.fill(); });
  // cône de la caméra (là où l'on regarde)
  const va=Math.atan2(-Math.cos(cam.yaw),-Math.sin(cam.yaw));
  const cg=mg.createRadialGradient(cx,cy,6,cx,cy,70); cg.addColorStop(0,'rgba(124,200,255,.42)'); cg.addColorStop(1,'rgba(124,200,255,0)');
  mg.fillStyle=cg; mg.beginPath(); mg.moveTo(cx,cy); mg.arc(cx,cy,70,va-.55,va+.55); mg.closePath(); mg.fill();
  // joueur : halo + grande flèche de marche
  mg.fillStyle='rgba(124,200,255,.22)'; mg.beginPath(); mg.arc(cx,cy,17,0,7); mg.fill();
  mg.save(); mg.translate(cx,cy); mg.rotate(-player.face+PI); mg.fillStyle='#7cc8ff'; mg.strokeStyle='#0b0e26'; mg.lineWidth=3; mg.lineJoin='round';
  mg.beginPath(); mg.moveTo(0,-15); mg.lineTo(10,10); mg.lineTo(0,5); mg.lineTo(-10,10); mg.closePath(); mg.stroke(); mg.fill(); mg.restore();
  // repère nord
  mg.fillStyle='rgba(11,14,38,.75)'; mg.beginPath(); mg.arc(132,16,12,0,7); mg.fill();
  mg.fillStyle='#ffc857'; mg.font='700 15px Figtree, system-ui, sans-serif'; mg.textAlign='center'; mg.textBaseline='middle'; mg.fillText('N',132,17);
}

