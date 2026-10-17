/* Agents en mission : ils tournent autour de leur bureau */
const agentObjs = new Map(); let agents = [];
function syncAgents(){
  const now=Date.now(), live=new Set();
  for(const a of store.agents.values()){
    if(agentStatus(a,now)!=='actif') continue;
    const lot=placed.get(a.bureau); if(!lot) continue;
    live.add(a.matricule);
    let o=agentObjs.get(a.matricule);
    if(!o){
      const c=chantier((store.bureaux.get(a.bureau)||{}).chantier), g=new THREE.Group();
      const core=new THREE.Mesh(new THREE.SphereGeometry(.7,18,12),new THREE.MeshBasicMaterial({color:c.hex}));
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.1,.07,8,30),new THREE.MeshBasicMaterial({color:0xeef0ff,transparent:true,opacity:.8}));
      g.add(core,ring); const s=label(a.nom,c.css,.022); s.position.y=1.9; g.add(s); world.add(g);
      o={ name:a.nom, col:c, g, core, ring, lot, active:true, ang:Math.random()*PI*2, t:Math.random()*10, pos:new THREE.Vector3(lot.x,3,lot.z) };
      agentObjs.set(a.matricule,o);
    }
    o.data=a; o.lot=lot;
  }
  for(const [m,o] of agentObjs) if(!live.has(m)){ world.remove(o.g); agentObjs.delete(m); }
  agents=[...agentObjs.values()];
}

