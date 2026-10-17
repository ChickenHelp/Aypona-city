/* ---------- Personnages ---------- */
/* Atelier 101 · Mira (v2.7) : personnages articulés. Même hauteur (≈ 2,5), face vers +z.
   Hanches à y .98 (cuisses, puis genoux à -.48), épaules à y 1,9 dans le torse. Géométries partagées entre tous
   les personnages ; les pivots sont exposés dans g.userData.limbs et animés par posePerson(). */
const PGEO={};
// Atelier 101 · Rigel (v2.11) : bras + main fusionnés (même pivot de l'épaule), une géométrie par couple chemise/peau
function armHandGeo(color,skin){ const G=personGeo(), k=color+'|'+skin; let g=G.armHands.get(k);
  if(!g){ g=mergeColored([[G.arm,null,color],[G.hand,null,skin]]); G.armHands.set(k,g); } return g; }
function personGeo(){
  if(PGEO.ok) return PGEO; PGEO.ok=true;
  const B=(w,h,d,x,y,z)=>{ const b=new THREE.BoxGeometry(w,h,d); b.translate(x,y,z); return b; };
  PGEO.thigh=B(.27,.5,.3,0,-.24,0);
  PGEO.shin=B(.23,.46,.26,0,-.22,0);
  PGEO.foot=B(.25,.12,.4,0,-.44,.07);
  PGEO.hips=B(.68,.28,.42,0,0,0);
  PGEO.chest=new THREE.CylinderGeometry(.4,.36,1.0,14); PGEO.chest.translate(0,.55,0);
  PGEO.head=new THREE.SphereGeometry(.32,16,12);
  PGEO.arm=B(.19,.84,.21,0,-.4,0);
  PGEO.hand=new THREE.SphereGeometry(.11,8,6); PGEO.hand.translate(0,-.88,0);
  PGEO.visor=B(.42,.1,.08,0,.04,.29);
  // Atelier 101 · Rigel (v2.11) : tibia + pied fusionnés (même pivot du genou), 1 draw call au lieu de 2
  PGEO.shinFoot=mergeColored([[PGEO.shin,null,0x22264a],[PGEO.foot,null,0x14173a]]);
  PGEO.armHands=new Map();
  return PGEO;
}
function person(color, skin=0xf1c7a5){
  const G=personGeo(), g=new THREE.Group();
  const M=(geo,mat,parent)=>{ const m=new THREE.Mesh(geo,mat); parent.add(m); return m; };
  const pants=lam(0x22264a), shoe=lam(0x14173a), shirt=lam(color), skinM=lam(skin);
  const hips=M(G.hips,pants,g); hips.position.y=.98;
  const leg=x=>{ const hip=new THREE.Group(); hip.position.set(x,.98,0); g.add(hip); M(G.thigh,pants,hip);
    const knee=new THREE.Group(); knee.position.y=-.48; hip.add(knee); M(G.shinFoot,vcMat('l'),knee); return [hip,knee]; };
  const [legL,kneeL]=leg(.19), [legR,kneeR]=leg(-.19);
  const torso=new THREE.Group(); torso.position.y=.98; g.add(torso);
  const chest=M(G.chest,shirt,torso);
  const arm=(x,side)=>{ const sh=new THREE.Group(); sh.position.set(x,.92,0); sh.rotation.z=side*.1; torso.add(sh); M(armHandGeo(color,skin),vcMat('l'),sh); return sh; };
  const armL=arm(.5,1), armR=arm(-.5,-1);
  const head=new THREE.Group(); head.position.y=1.22; torso.add(head); M(G.head,skinM,head); M(G.visor,glow(0x10132e),head);
  g.userData.limbs={ legL, legR, kneeL, kneeR, armL, armR, torso, chest, head };
  g.userData.ph=0; g.userData.amp=0;
  return g;
}
/* Pose d'un personnage. ph : phase du pas (rad), a : amplitude 0 (repos) à 1 (course), t : horloge de la respiration.
   La respiration s'efface quand le personnage marche. Renvoie le petit rebond vertical du pas. */
function posePerson(p, ph, a, t){
  const L=p.userData.limbs; if(!L) return 0;
  const s=Math.sin(ph), c=Math.cos(ph), A=a*.95, b=Math.sin(t*1.8)*(1-Math.min(1,a*2));
  L.legL.rotation.x=-s*A; L.legR.rotation.x=s*A;
  L.kneeL.rotation.x=Math.max(0,c)*A*1.4; L.kneeR.rotation.x=Math.max(0,-c)*A*1.4;
  L.armL.rotation.x=s*A*.85; L.armR.rotation.x=-s*A*.85;
  L.armL.rotation.z=.1+b*.03; L.armR.rotation.z=-.1-b*.03;
  L.torso.rotation.x=Math.max(0,a-.6)*.35;
  L.torso.position.y=.98+b*.018;
  L.chest.scale.set(1+b*.02,1,1+b*.035);
  L.head.rotation.x=-b*.03;
  return Math.abs(c)*.08*a;
}

