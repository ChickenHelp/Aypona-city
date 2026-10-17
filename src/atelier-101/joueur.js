/* ---------- Joueur ---------- */
const player = { pos:new THREE.Vector3(0,0,15), level:0, face:PI, vel:new THREE.Vector2() };
const avatar = person(0x7cc8ff, 0xe8b894); scene.add(avatar);
const halo=new THREE.Mesh(new THREE.RingGeometry(.65,.85,28),new THREE.MeshBasicMaterial({color:0x7cc8ff,transparent:true,opacity:.7,side:THREE.DoubleSide})); halo.rotation.x=-PI/2; scene.add(halo);
const cam = { yaw:0, pitch:.42, zoom:1 };
const camPos = new THREE.Vector3(0,8,26);
const ray = new THREE.Raycaster();

function resolve(p, level){
  const r=.5;
  for(const c of colliders){
    if(c.level!==level) continue;
    const cx=clamp(p.x,c.minX,c.maxX), cz=clamp(p.z,c.minZ,c.maxZ);
    const dx=p.x-cx, dz=p.z-cz, d2=dx*dx+dz*dz;
    if(d2<r*r){
      if(d2>1e-8){ const d=Math.sqrt(d2); p.x=cx+dx/d*r; p.z=cz+dz/d*r; }
      else { const l=p.x-c.minX, rt=c.maxX-p.x, t=p.z-c.minZ, b=c.maxZ-p.z, m=Math.min(l,rt,t,b);
        if(m===l) p.x=c.minX-r; else if(m===rt) p.x=c.maxX+r; else if(m===t) p.z=c.minZ-r; else p.z=c.maxZ+r; }
    }
  }
  p.x=clamp(p.x,-132,132); p.z=clamp(p.z,-132,132);
}
const insideHQ = () => Math.abs(player.pos.x)<14 && Math.abs(player.pos.z)<10;

