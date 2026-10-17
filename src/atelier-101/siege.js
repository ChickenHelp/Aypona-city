/* ---------- Le Siège (accueil + 3 bureaux) ---------- */
const hqLower=new THREE.Group(), hqUpper=new THREE.Group(), hqTop=new THREE.Group(), hqRoof=new THREE.Group();
world.add(hqLower,hqUpper,hqTop,hqRoof);
function wallX(g,x1,x2,z,y0,h,mat,level,occ){ const m=box(g,x2-x1,h,.4,(x1+x2)/2,y0+h/2,z,mat); if(level!==null) collide(x1,x2,z-.25,z+.25,level); if(occ) occluders.push(m); return m; }
function wallZ(g,z1,z2,x,y0,h,mat,level,occ){ const m=box(g,.4,h,z2-z1,x,y0+h/2,(z1+z2)/2,mat); if(level!==null) collide(x-.25,x+.25,z1,z2,level); if(occ) occluders.push(m); return m; }
const SOLID=lam(0x3b4072), TRIM=glow(0x7cc8ff);
const recep = { x:0, z:-2.4 };
(function buildHQ(){
  // Rez-de-chaussée
  box(hqLower,28,.1,20,0,.12,0,lam(0x3a3768));
  wallX(hqLower,-14,14,-10,0,5,SOLID,0,true);
  wallZ(hqLower,-10,10,-14,0,5,SOLID,0,true); wallZ(hqLower,-10,10,14,0,5,SOLID,0,true);
  wallX(hqLower,-14,-3,10,0,5,glassMat,0); wallX(hqLower,3,14,10,0,5,glassMat,0);
  box(hqLower,6,1,.5,0,4.5,10,SOLID); box(hqLower,6.4,.12,.6,0,3.95,10.05,TRIM);
  // comptoir d'accueil
  box(hqLower,8,1.1,1.2,0,.55,-1,lam(0x5cb4ff)); box(hqLower,8.2,.1,1.4,0,1.15,-1,lam(0xeef0ff));
  collide(-4,4,-1.6,-.4,0);
  const rp=person(0xff8a65); rp.position.set(recep.x,0,recep.z); hqLower.add(rp); recep.npc=rp;
  const sLogo=label('AYPONA CITY · ACCUEIL','#7cc8ff',.03); sLogo.position.set(0,3.4,-9.4); hqLower.add(sLogo);
  // salon d'attente
  box(hqLower,1.8,.8,5,-11.5,.4,4,lam(0x6a5acd)); collide(-12.4,-10.6,1.5,6.5,0);
  box(hqLower,1.8,.8,5,-11.5,.4,-5,lam(0x6a5acd)); collide(-12.4,-10.6,-7.5,-2.5,0);
  box(hqLower,2,.5,2,-8.6,.25,4,lam(0x2a2f58)); collide(-9.6,-7.6,3,5,0);
  tree(hqLower,-12.5,8.5,.7); tree(hqLower,12.5,-8.5,.7); tree(hqLower,-12.5,-8.5,.7);
  // Ascenseur (même position aux deux niveaux)
  for(const [dx,dz] of [[-1.7,-1.7],[1.7,-1.7],[-1.7,1.7],[1.7,1.7]]) box(hqLower,.18,10,.18,11+dx,5,6+dz,lam(0xb7c0ff));
  const ring0=new THREE.Mesh(new THREE.TorusGeometry(1.3,.08,8,32),glow(0x7cc8ff)); ring0.rotation.x=-PI/2; ring0.position.set(11,.2,6); hqLower.add(ring0);
  const sEl=label('Ascenseur','#7cc8ff',.025); sEl.position.set(11,3.6,6); hqLower.add(sEl);
  // Plaza devant
  tree(world,-8,13.5,1); tree(world,8,13.5,1); tree(world,-13,14,.9); tree(world,13,14,.9);
  const sHQ=label('SIÈGE AYPONA','#ffc857',.05); sHQ.position.set(0,18.4,0); hqRoof.add(sHQ);

  // 1er étage
  box(hqUpper,28,.3,20,0,4.9,0,lam(0x34305e));
  wallX(hqUpper,-14,14,-10,5,5,SOLID,1,true);
  wallZ(hqUpper,-10,10,-14,5,5,SOLID,1,true); wallZ(hqUpper,-10,10,14,5,5,SOLID,1,true);
  wallX(hqUpper,-14,14,10,5,5,glassMat,1);
  box(hqUpper,28.4,.14,.5,0,5.05,10.05,TRIM);
  const ring1=new THREE.Mesh(new THREE.TorusGeometry(1.3,.08,8,32),glow(0x7cc8ff)); ring1.rotation.x=-PI/2; ring1.position.set(11,5.12,6); hqUpper.add(ring1);
  const sEl1=label('Ascenseur','#7cc8ff',.025); sEl1.position.set(11,8.6,6); hqUpper.add(sEl1);
  // cloisons des bureaux
  const xs=[-14,-6.67,.67,8];
  OFFICES.forEach((o,k)=>{ o.x1=xs[k]; o.x2=xs[k+1]; o.cx=(xs[k]+xs[k+1])/2; });
  let cursor=-14;
  OFFICES.forEach(o=>{ wallX(hqUpper,cursor,o.cx-1.1,-2,5,4,frostMat,1); cursor=o.cx+1.1; });
  wallX(hqUpper,cursor,8,-2,5,4,frostMat,1);
  [-6.67,.67,8].forEach(x=>wallZ(hqUpper,-10,-2,x,5,4,frostMat,1));
  OFFICES.forEach(o=>{
    box(hqUpper,o.x2-o.x1-.4,.04,7.6,o.cx,5.07,-6,lam(new THREE.Color(o.hex).multiplyScalar(.45).getHex()));
    box(hqUpper,3.2,.9,1.2,o.cx,5.45,-6.6,lam(0xeef0ff)); collide(o.cx-1.6,o.cx+1.6,-7.2,-6,1);
    const scr=box(hqUpper,1.6,.9,.06,o.cx,6.4,-6.9,glow(o.hex));
    const p=person(o.hex); p.position.set(o.cx,5,-8.2); hqUpper.add(p); o.npc=p;
    const s=label(o.no+' · '+o.role,o.css,.02); s.position.set(o.cx,8.5,-1.6); hqUpper.add(s);
    interacts.push({ type:'point', x:o.cx, z:-5.2, level:1, r:2.4, label:'Entrer au bureau '+o.no+' · '+o.role, act:o.open });
  });
  // accessoires propres à chaque bureau
  const c0=OFFICES[0]; for(let k=0;k<6;k++) box(hqUpper,.5,.4+((k*37)%9)/6,.5,c0.cx-2.2+(k%3)*.7,5.5+((k*37)%9)/12,-3.4-Math.floor(k/3)*.7,glow(k%2?0xffc857:0xa4d6ff));
  box(hqUpper,2.4,.7,1.6,c0.cx-1.5,5.35,-3.8,lam(0x2a2f58));
  const c1=OFFICES[1]; box(hqUpper,4,2.2,.1,c1.cx,7,-9.75,glow(0x10132e));
  for(let r=0;r<3;r++) for(let q=0;q<5;q++) box(hqUpper,.5,.5,.06,c1.cx-1.4+q*.7,6.3+r*.7,-9.68,glow(STUDIOS[(r+q)%5].hex));
  /* Atelier 101 · Deneb (v4.3) : poste « Aypona OS » du bureau 102, près de l'entrée, écran tourné vers la porte.
     Socle mat, écran d'accueil d'Aypona OS (icônes aux 5 couleurs de studio), liseré, anneau au sol et bandeau lumineux
     à la couleur du bureau. L'interaction ouvre le panneau existant du bureau 102 (panelOS) : aucune logique du système ici. */
  { const PX=c1.x1+1.25, PZ=-3.35, Y1=5, H2=c1.hex;
    const sc=document.createElement('canvas'); sc.width=256; sc.height=176; const q=sc.getContext('2d');
    const gr=q.createLinearGradient(0,0,0,176); gr.addColorStop(0,'#1b2350'); gr.addColorStop(1,'#0c1030'); q.fillStyle=gr; q.fillRect(0,0,256,176);
    q.fillStyle='rgba(255,255,255,.55)'; q.fillRect(14,10,30,4); q.fillRect(212,10,30,4);
    q.font='700 22px Figtree, system-ui, sans-serif'; q.fillStyle='#eef0ff'; q.textBaseline='middle'; q.fillText('Aypona',18,36); q.fillStyle='#5cb4ff'; q.fillText('OS',106,36);
    for(let r=0;r<2;r++) for(let k=0;k<5;k++){ rr(q,18+k*46,56+r*44,32,32,9); q.fillStyle=STUDIOS[(k+r*2)%5].css; q.fill(); }
    rr(q,40,146,176,22,11); q.fillStyle='rgba(255,255,255,.14)'; q.fill();
    for(let k=0;k<4;k++){ rr(q,54+k*40,150,14,14,4); q.fillStyle=STUDIOS[(k+1)%5].css; q.fill(); }
    const st=new THREE.CanvasTexture(sc); st.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    const pg=new THREE.Group(); pg.position.set(PX,Y1,PZ); pg.rotation.y=PI/7; hqUpper.add(pg);
    box(pg,.9,.12,.7,0,.06,0,lam(0x2a2f58));                       // pied
    box(pg,.26,1.05,.26,0,.62,-.05,lam(0x3b4072));                 // colonne
    const head=new THREE.Group(); head.position.set(0,1.55,0); head.rotation.x=-.32; pg.add(head);
    box(head,1.5,1.06,.12,0,0,-.04,lam(0x23284e));                 // cadre
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.36,.935),new THREE.MeshBasicMaterial({ map:st })); screen.position.z=.025; head.add(screen);
    box(head,1.56,.05,.14,0,.555,-.04,glow(H2)); box(head,1.56,.05,.14,0,-.555,-.04,glow(H2)); // liserés
    box(pg,1.2,.08,.08,0,2.24,-.12,glow(H2));                      // bandeau lumineux au-dessus
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.85,.05,6,28),glow(H2)); ring.rotation.x=-PI/2; ring.position.set(PX,Y1+.11,PZ); hqUpper.add(ring);
    const sOS=label('Aypona OS','#5cb4ff',.016); sOS.position.set(PX,Y1+3.05,PZ); hqUpper.add(sOS);
    collide(PX-.5,PX+.5,PZ-.42,PZ+.42,1);
    interacts.push({ type:'point', x:PX+.55, z:PZ+.95, level:1, r:1.6, label:'Ouvrir Aypona OS', act:()=>openPanel(panelOS) }); }
  const c2=OFFICES[2]; c2.orbs=[]; for(let k=0;k<3;k++){ const s=new THREE.Mesh(new THREE.SphereGeometry(.25,12,8),glow(STUDIOS[k+2].hex)); s.position.set(c2.cx-1.5+k*1.5,7.3,-4); hqUpper.add(s); c2.orbs.push(s); }
  tree(hqUpper,-12.5,8.5,.6); tree(hqUpper,6.5,8.5,.6);
  box(hqUpper,4,.5,1.2,-4,5.25,7,lam(0x6a5acd)); collide(-6,-2,6.4,7.6,1);
  const s1=label('1er étage · Bureaux des architectes','#eef0ff',.022); s1.position.set(-4,8.4,9.4); hqUpper.add(s1);

  // Toit
  box(hqRoof,28.4,.4,20.4,0,15.2,0,lam(0x2a2f58)); box(hqRoof,28.6,.2,20.6,0,15.45,0,TRIM);
  box(hqRoof,.25,4,.25,10,17.4,-6,lam(0x8890c0));
  const beacon=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8),glow(0xffc857)); beacon.position.set(10,19.6,-6); hqRoof.add(beacon);

  // 2e étage : la Présidence
  const T=hqTop, Y=10, GOLD=0xffc857;
  box(T,28,.3,20,0,Y-.1,0,lam(0x2f2b55));
  wallX(T,-14,14,-10,Y,5,SOLID,2,true);
  wallZ(T,-10,10,-14,Y,5,SOLID,2,true); wallZ(T,-10,10,14,Y,5,SOLID,2,true);
  wallX(T,-14,14,10,Y,5,glassMat,2);
  box(T,28.4,.14,.5,0,Y+.05,10.05,glow(GOLD));
  for(const [dx,dz] of [[-1.7,-1.7],[1.7,-1.7],[-1.7,1.7],[1.7,1.7]]) box(T,.18,5,.18,11+dx,Y+2.5,6+dz,lam(0xb7c0ff));
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(1.3,.08,8,32),glow(0x7cc8ff)); ring2.rotation.x=-PI/2; ring2.position.set(11,Y+.12,6); T.add(ring2);
  const sEl2=label('Ascenseur','#7cc8ff',.025); sEl2.position.set(11,Y+3.6,6); T.add(sEl2);
  // Bureau du Président (cloison dépolie, porte au centre)
  wallX(T,-14,-7.1,-1,Y,4,frostMat,2); wallX(T,-4.9,2,-1,Y,4,frostMat,2); wallZ(T,-10,-1,2,Y,4,frostMat,2);
  box(T,15.6,.04,8.6,-6,Y+.07,-5.5,lam(0x4a3a2a));
  box(T,5,1,1.6,-6,Y+.5,-6.4,lam(0x6b4a2e)); box(T,5.2,.1,1.8,-6,Y+1.03,-6.4,lam(0xeef0ff)); collide(-8.5,-3.5,-7.2,-5.6,2);
  box(T,6,2.6,.1,-6,Y+2.6,-9.75,glow(0x10132e));
  const scr=label(PRESIDENCE.termine? 'MANDAT '+PRESIDENCE.mandat+' TERMINÉ · PLACE AU PRÉSIDENT '+PRESIDENCE.suivant : 'MANDAT '+PRESIDENCE.mandat+' · PROMPT '+PRESIDENCE.used+'/'+PRESIDENCE.quota,'#ffc857',.022); scr.position.set(-6,Y+2.6,-9.5); T.add(scr);
  box(T,.12,3.4,.12,-10.5,Y+1.7,-9,lam(0x8890c0)); box(T,1.4,.9,.04,-9.8,Y+3,-9,glow(GOLD));
  const pres=person(GOLD,0xd9a77f); pres.position.set(-6,Y,-8.2); T.add(pres); PRESIDENCE.npc=pres;
  box(T,.9,.18,.9,-6,Y+2.42,-8.2,glow(GOLD));
  if(PRESIDENCE.termine){ box(T,1.1,.7,1.1,-2.2,Y+.35,-8.2,lam(0x2a2f58)); box(T,1.1,1.3,.2,-2.2,Y+1.3,-8.75,lam(0x2a2f58)); box(T,.9,.06,.06,-2.2,Y+1.9,-8.62,glow(0xffc857));
    const sII=label('Fauteuil du Président '+PRESIDENCE.suivant,'#eef0ff',.016); sII.position.set(-2.2,Y+2.7,-8.2); T.add(sII); }
  const sP=label('Bureau du Président du siège','#ffc857',.02); sP.position.set(-6,Y+4.3,-1.4); T.add(sP);
  interacts.push({ type:'point', x:-6, z:-4.3, level:2, r:2.4, label:'Rencontrer le Président du siège', act:()=>openPanel(panelPresident) });
  // Registre de passation (pupitre + livre lumineux)
  box(T,1.2,1.2,.9,7,Y+.6,-6,lam(0x5a3d2e)); collide(6.4,7.6,-6.45,-5.55,2);
  const book=box(T,1.3,.08,.9,7,Y+1.25,-6,glow(0xfff1c9)); book.rotation.x=-.25; PRESIDENCE.book=book;
  box(T,.06,.1,.9,7,Y+1.3,-6,lam(0x6b4a2e));
  const sR=label('Registre de passation','#ffc857',.02); sR.position.set(7,Y+3.2,-6); T.add(sR);
  interacts.push({ type:'point', x:7, z:-4.2, level:2, r:2.4, label:'Lire le registre de passation', act:()=>openPanel(panelRegistry) });
  // Salle du conseil : table ronde, une chaise par architecte + celle du Président
  const tbl=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,.16,28),lam(0xeef0ff)); tbl.position.set(-4,Y+1,5); T.add(tbl);
  const foot=new THREE.Mesh(new THREE.CylinderGeometry(.4,.6,1,12),lam(0x3b4072)); foot.position.set(-4,Y+.5,5); T.add(foot);
  collide(-6.6,-1.4,2.4,7.6,2);
  [...OFFICES.map(o=>o.hex),GOLD].forEach((c,k)=>{ const a=k*PI/2+PI/4; box(T,.9,.9,.9,-4+Math.cos(a)*3.5,Y+.45,5+Math.sin(a)*3.5,lam(c)); });
  const holo=new THREE.Mesh(new THREE.OctahedronGeometry(.55),glow(0x7cc8ff)); holo.position.set(-4,Y+2.1,5); T.add(holo); PRESIDENCE.holo=holo;
  interacts.push({ type:'point', x:-4, z:1.2, level:2, r:2.4, label:'Réunir le conseil du siège', act:()=>openPanel(panelCouncil) });
  tree(T,12.5,-8.5,.6); tree(T,-12.5,8.5,.6);
  const s2=label('2e étage · Présidence','#ffc857',.022); s2.position.set(4,Y+3.4,9.4); T.add(s2);
})();
/* Atelier 101 · Altaïr (v4.2) : état du Bureau du courrier en 3D, rafraîchi depuis la collection courrier (lecture seule) */
const courrierRoom={ sig:'' };
const BROOMS = [
  { key:'archives', name:'Archives des applications', x1:-14, x2:-4.5, css:'#ffc857', hex:0xffc857 },
  { key:'maj', name:'Salle des mises à jour', x1:-4.5, x2:3.5, css:'#4fe0a8', hex:0x4fe0a8 },
  { key:'courrier', name:'Bureau du courrier', x1:3.5, x2:14, css:'#b392ff', hex:0xb392ff },
];
(function buildBasement(){
  const B=basement, Y=-5, CON=lam(0x2b2f52), PART=lam(0x353a63);
  box(B,28,.2,20,0,Y-.1,0,lam(0x22264a));
  wallX(B,-14,14,-10,Y,4.6,CON,-1); wallX(B,-14,14,10,Y,4.6,CON,-1);
  wallZ(B,-10,10,-14,Y,4.6,CON,-1); wallZ(B,-10,10,14,Y,4.6,CON,-1);
  box(B,28,.12,.3,0,Y+4.5,9.7,glow(0x7cc8ff)); box(B,28,.12,.3,0,Y+4.5,-9.7,glow(0x7cc8ff));
  BROOMS.forEach(r=>{ r.cx=(r.x1+r.x2)/2; });
  let cur=-14; BROOMS.forEach(r=>{ wallX(B,cur,r.cx-1.1,-2,Y,4.2,PART,-1); cur=r.cx+1.1; }); wallX(B,cur,14,-2,Y,4.2,PART,-1);
  [-4.5,3.5].forEach(x=>wallZ(B,-10,-2,x,Y,4.2,PART,-1));
  BROOMS.forEach(r=>{
    box(B,r.x2-r.x1-.4,.04,7.6,r.cx,Y+.03,-6,lam(new THREE.Color(r.hex).multiplyScalar(.28).getHex()));
    box(B,2.2,.12,.12,r.cx,Y+2.6,-1.8,glow(r.hex));
    const s=label(r.name,r.css,.02); s.position.set(r.cx,Y+3.4,-1.6); B.add(s);
  });
  // Archives : rayonnages + classeurs colorés par studio
  const A=BROOMS[0], files=[];
  [[-9.3,A.x1+.4,A.x2-.4],[-6.2,A.x1+1.2,A.x2-2.6]].forEach(([z,x1,x2])=>{
    const w=x2-x1, cx=(x1+x2)/2;
    box(B,w,2.8,.8,cx,Y+1.4,z,lam(0x4a3f3a)); collide(x1,x2,z-.45,z+.45,-1);
    for(let lv=0;lv<3;lv++) for(let k=0;k<Math.floor(w/.42);k++){
      const bh=.5+((k*7+lv*3)%4)*.06;
      files.push([x1+.25+k*.42,Y+.35+lv*.9+bh/2,z+(z<-8?.12:0),bh,STUDIOS[(k+lv)%5].hex]);
    }
  });
  // Atelier 101 · Rigel (v2.11) : les classeurs en un seul InstancedMesh (hauteur par l'échelle, couleur par instance)
  const fm=new THREE.InstancedMesh(boxGeo(.3,1,.62),new THREE.MeshBasicMaterial({ color:0xffffff }),files.length);
  const fq=new THREE.Quaternion(), fv=new THREE.Vector3(), fs=new THREE.Vector3(), fx=new THREE.Matrix4(), fc=new THREE.Color();
  files.forEach(([x,y,z,bh,hex],i)=>{ fx.compose(fv.set(x,y,z),fq,fs.set(1,bh,1)); fm.setMatrixAt(i,fx); fm.setColorAt(i,fc.setHex(hex)); });
  fm.instanceMatrix.needsUpdate=true; fm.instanceColor.needsUpdate=true; fm.frustumCulled=false; B.add(fm);
  interacts.push({ type:'point', x:A.cx, z:-3.6, level:-1, r:2.4, label:'Consulter les archives', act:()=>openPanel(panelArchives) });
  // Mises à jour : mur d'écrans + terminal
  const M=BROOMS[1];
  box(B,6.6,3,.12,M.cx,Y+2.2,-9.7,glow(0x0f1a2e));
  for(let k=0;k<6;k++) box(B,1.2+((k*5)%4)*1.1,.22,.06,M.cx-2.7+((1.2+((k*5)%4)*1.1)/2),Y+3.3-k*.42,-9.62,glow(k===0?0x4fe0a8:0x5cb4ff));
  box(B,2.6,1,1,M.cx,Y+.5,-6.4,lam(0xeef0ff)); collide(M.cx-1.3,M.cx+1.3,-6.9,-5.9,-1);
  box(B,1.4,.8,.06,M.cx,Y+1.45,-6.75,glow(0x4fe0a8));
  interacts.push({ type:'point', x:M.cx, z:-4.4, level:-1, r:2.4, label:'Voir les mises à jour', act:()=>openPanel(panelUpdates) });
  // Bureau du courrier (décret n°3 du mandat III, ancienne salle vide)
  const V=BROOMS[2];
  /* Atelier 101 · Altaïr (v4.2) : aménagement du Bureau du courrier.
     Mur de casiers au fond : un casier par dossier (PRESIDENT, FONDATEUR, puis les agents des bureaux 101 à 103),
     qui s'allume en violet quand un pli l'attend. Guichet, table de tri, tube pneumatique vers les étages. */
  const CY=Y, VIO=0xb392ff;
  box(B,9.6,3.4,.5,V.cx,CY+1.9,-9.55,lam(0x2a2550));                       // meuble de casiers
  box(B,9.8,.14,.6,V.cx,CY+3.65,-9.5,glow(VIO));                            // corniche lumineuse
  const COLS=8, ROWS=3, cw=1.08, ch=.92, cells=[];
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) cells.push([V.cx-(COLS-1)*cw/2+c*cw, CY+.9+r*1.0]);
  const cellM=new THREE.InstancedMesh(boxGeo(cw*.86,ch*.8,.12),new THREE.MeshBasicMaterial({ color:0xffffff }),cells.length);
  const cq=new THREE.Quaternion(), cv=new THREE.Vector3(), cs=new THREE.Vector3(1,1,1), cmx=new THREE.Matrix4(), cc=new THREE.Color();
  cells.forEach(([x,y],i)=>{ cmx.compose(cv.set(x,y,-9.26),cq,cs); cellM.setMatrixAt(i,cmx); cellM.setColorAt(i,cc.setHex(0x1b1f44)); });
  cellM.instanceMatrix.needsUpdate=true; cellM.instanceColor.needsUpdate=true; cellM.frustumCulled=false; B.add(cellM);
  // pastilles « pli en attente » au bas de chaque casier
  const tabM=new THREE.InstancedMesh(boxGeo(cw*.5,.1,.06),new THREE.MeshBasicMaterial({ color:0xffffff }),cells.length);
  cells.forEach(([x,y],i)=>{ cmx.compose(cv.set(x,y-ch*.33,-9.18),cq,cs); tabM.setMatrixAt(i,cmx); tabM.setColorAt(i,cc.setHex(0x2a2f58)); });
  tabM.instanceMatrix.needsUpdate=true; tabM.instanceColor.needsUpdate=true; tabM.frustumCulled=false; B.add(tabM);
  collide(V.cx-4.9,V.cx+4.9,-10,-9.2,-1);
  // guichet en verre dépoli
  box(B,5.2,1.05,.9,V.cx,CY+.52,-7.1,lam(0x3b3570)); box(B,5.4,.08,1.05,V.cx,CY+1.08,-7.1,lam(0xeef0ff));
  box(B,5.2,.9,.06,V.cx,CY+1.55,-6.68,frostMat); box(B,5.3,.06,.1,V.cx,CY+2.02,-6.68,glow(VIO));
  collide(V.cx-2.6,V.cx+2.6,-7.6,-6.6,-1);
  const sGu=label('Guichet du courrier','#b392ff',.016); sGu.position.set(V.cx,CY+2.45,-6.7); B.add(sGu);
  // table de tri, avec piles de plis
  box(B,2.6,.75,1.4,V.cx+3.6,CY+.38,-4.2,lam(0x2f2b55)); box(B,2.7,.06,1.5,V.cx+3.6,CY+.78,-4.2,lam(0x5a4f9a));
  for(let k=0;k<5;k++){ const n=1+(k*3)%4; for(let j=0;j<n;j++){ const e=box(B,.5,.04,.34,V.cx+2.7+k*.45,CY+.84+j*.045,-4.2+((k*7)%3-1)*.25,lam(j%2?0xeef0ff:0xe4dcff)); e.rotation.y=(k*.37+j*.2)%.6-.3; } }
  collide(V.cx+2.3,V.cx+4.9,-4.9,-3.5,-1);
  // tube pneumatique vers les étages, avec une capsule qui monte quand des plis attendent
  const tube=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,4.6,16,1,true),new THREE.MeshLambertMaterial({ color:0xc8d0ff, transparent:true, opacity:.28, depthWrite:false, side:THREE.DoubleSide }));
  tube.position.set(V.x2-.8,CY+2.3,-8.6); B.add(tube);
  for(const yy of [.25,4.35]){ const ring=new THREE.Mesh(new THREE.TorusGeometry(.32,.05,6,18),glow(VIO)); ring.rotation.x=PI/2; ring.position.set(V.x2-.8,CY+yy,-8.6); B.add(ring); }
  const capsule=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.42,12),glow(0xffc857)); capsule.position.set(V.x2-.8,CY+.5,-8.6); B.add(capsule);
  collide(V.x2-1.15,V.x2-.45,-8.95,-8.25,-1);
  courrierRoom.cellM=cellM; courrierRoom.tabM=tabM; courrierRoom.capsule=capsule; courrierRoom.y0=CY; courrierRoom.n=cells.length;
  interacts.push({ type:'point', x:V.cx, z:-5, level:-1, r:3, label:'Ouvrir le Bureau du courrier', act:()=>openPanel(panelCourrier) });
  // Ascenseur
  for(const [dx,dz] of [[-1.7,-1.7],[1.7,-1.7],[-1.7,1.7],[1.7,1.7]]) box(B,.18,4.6,.18,11+dx,Y+2.3,6+dz,lam(0xb7c0ff));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.3,.08,8,32),glow(0x7cc8ff)); ring.rotation.x=-PI/2; ring.position.set(11,Y+.08,6); B.add(ring);
  const se=label('Ascenseur','#7cc8ff',.025); se.position.set(11,Y+3.6,6); B.add(se);
  const sc=label('Sous-sol · Archives, mises à jour et courrier','#eef0ff',.022); sc.position.set(-4,Y+3.6,9.3); B.add(sc);
  box(B,4,.5,1.2,-4,Y+.25,6.5,lam(0x6a5acd)); collide(-6,-2,5.9,7.1,-1);
})();
interacts.push({ type:'point', x:0, z:1, level:0, r:3, label:'Parler à la réceptionniste', act:()=>openPanel(panelReception) });
[-1,0,1,2].forEach(lv=>interacts.push({ type:'point', x:11, z:6, level:lv, r:1.9, label:'Prendre l’ascenseur', act:()=>openPanel(panelElevator) }));

