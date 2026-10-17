/* ---------- Ville vidée (restructuration) ---------- */
function initCity(){
  lots.forEach(l=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(13,13),freeMat); m.rotation.x=-PI/2; m.position.set(l.x,.14,l.z); world.add(m); l.marker=m; });
  state.built=[]; state.removed=[]; save();
}
function lotFront(lot){ const sz=Math.sign(lot.z-lot.bz)||1; return { x:lot.x, z:lot.z+sz*7.4, yaw: sz>0?0:PI }; }

