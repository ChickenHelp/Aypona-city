/* Statut, matricule, durée */
function agentStatus(a,now=Date.now()){ if(a.statut==='révoqué') return 'révoqué'; return a.expire<=now ? 'expiré' : 'actif'; }
function remaining(a){ const ms=a.expire-Date.now(); if(ms<=0) return 'expiré'; const d=Math.floor(ms/DAY); if(d>=1) return 'reste '+d+' j'; return 'reste '+Math.max(1,Math.floor(ms/36e5))+' h'; }
function fmtDay(t){ try { return new Date(t).toLocaleDateString('fr-FR',{ day:'numeric', month:'short', year:'numeric' }); } catch(e){ return ''; } }
function nextMatricule(bureauId){
  const d=new Date(), ym=String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,'0');
  const seq=[...store.agents.keys()].reduce((m,k)=>Math.max(m,parseInt(k.slice(-4),10)||0),0)+1;
  return 'AYP-'+(bureauId||'B00')+'-'+ym+'-'+String(seq).padStart(4,'0');
}
function suggestName(){ const used=new Set([...store.agents.values()].map(a=>a.nom)); const free=NOMS.find(n=>!used.has(n)); return free || NOMS[store.agents.size%NOMS.length]+'-'+(store.agents.size+1); }
async function createAgent({ nom, role, bureau, duree }){
  if(!store.bureaux.has(bureau)){ toast("Choisis d'abord un bureau d'affectation."); return; }
  const now=Date.now(), mat=nextMatricule(bureau);
  await put('agents',mat,{ matricule:mat, nom, role, bureau, duree, cree:now, expire:now+duree*DAY, statut:'actif' });
  await archive('creation', nom+' nommé '+role.toLowerCase()+' au bureau '+bureau+' pour '+dureeLabel(duree), mat);
  logEvt('Agent '+nom+' nommé · matricule '+mat); save(); toast(nom+' nommé · matricule '+mat);
}
async function prolong(a){
  const exp=Math.max(a.expire,Date.now())+a.duree*DAY;
  await put('agents',a.matricule,{ expire:exp, statut:'actif' });
  await archive('prolongation', a.nom+' prolongé de '+dureeLabel(a.duree)+', jusqu’au '+fmtDay(exp), a.matricule);
  toast(a.nom+' prolongé jusqu’au '+fmtDay(exp));
}
async function revoke(a){
  await put('agents',a.matricule,{ statut:'révoqué', revoque:Date.now() });
  await archive('revocation', a.nom+' révoqué, matricule conservé aux archives', a.matricule);
  toast(a.nom+' révoqué');
}
async function createBureau(key){
  if(store.bureaux.size>=LOT_ORDER.length){ toast('Plus aucun terrain libre dans la ville.'); return; }
  const n=[...store.bureaux.keys()].reduce((m,k)=>Math.max(m,parseInt(k.slice(1),10)||0),0)+1, id='B'+String(n).padStart(2,'0'), c=chantier(key);
  await put('bureaux',id,{ id, chantier:key, nom:c.nom, cree:Date.now(), statut:'ouvert' });
  await archive('bureau','Bureau '+id+' · '+c.nom+' ouvert');
  logEvt('Bureau '+id+' · '+c.nom+' construit'); save(); toast('Bureau '+id+' · '+c.nom+' en construction');
}

/* Placement des bureaux : ordre fixe, du plus proche du siège au plus loin */
const LOT_ORDER = lots.slice().sort((a,b)=>(Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z)) || a.i-b.i);
const placed = new Map();
function syncWorld(){
  const bs=[...store.bureaux.values()].sort((a,b)=>a.id<b.id?-1:1);
  const want=new Map(); bs.forEach((b,k)=>{ if(LOT_ORDER[k]) want.set(b.id,LOT_ORDER[k]); });
  for(const [id,lot] of placed){ if(want.get(id)!==lot){ clearLot(lot); placed.delete(id); } }
  for(const b of bs){ const lot=want.get(b.id); if(!lot||placed.has(b.id)) continue; placeOnLot(lot,{ kind:'bureau', bureau:b },worldReady); placed.set(b.id,lot); }
  syncApps();
  syncAgents();
}

