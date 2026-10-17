function bureauxSorted(){ return [...store.bureaux.values()].sort((a,b)=>a.id<b.id?-1:1); }
function goBureau(id){ const lot=placed.get(id); if(!lot) return; const f=lotFront(lot); closePanel(); teleport(f.x,f.z,0,f.yaw); }
function panelBureauList(){
  return { eyebrow:'Bureaux de construction', title:'Où veux-tu aller ?',
    body:[ el('div',{class:'chips'},bureauxSorted().map(b=>btn(b.id+' · '+chantier(b.chantier).nom,()=>goBureau(b.id),'small'))) ], actions:[] };
}
function panelBureau(id){
  const b=store.bureaux.get(id);
  if(!b) return { eyebrow:'Bureau', title:'Bureau fermé', body:[ el('p',{},"Ce bureau n'existe plus.") ], actions:[homeAction] };
  const c=chantier(b.chantier), team=[...store.agents.values()].filter(a=>a.bureau===id).sort((x,y)=>y.cree-x.cree);
  const pts=bureauPts(b), p=pts/CHANTIER_PTS, rate=bureauRate(b), done=Math.floor(pts/ETAPE_PTS), fin=p<1? timeToReach(b,CHANTIER_PTS) : null;
  const all=teamOf(id);
  return { eyebrow:'Bureau de construction '+id, title:c.nom,
    body:[ el('p',{},c.mission),
      el('div',{class:'group'},el('h3',{},'Avancement · '+(p>=1?'chantier terminé':fmtPct(p))),bar(p,c.css)),
      statRow([ ['Points',Math.floor(pts)+'/'+CHANTIER_PTS], ['Cadence (pts/h)',rate.toFixed(1)], ['Agents actifs',team.filter(a=>agentStatus(a)==='actif').length] ]),
      el('p',{},p>=1? 'Chantier livré. Il est prêt pour la suite de la restructuration.' : fin? 'Fin estimée le '+fmtDay(fin)+' au rythme actuel.' : rate>0? "À ce rythme, les agents auront fini leur mission avant la fin du chantier : prolonge-les ou nomme des renforts." : "Chantier à l'arrêt : aucun agent actif. Nomme un agent pour relancer la production."),
      el('div',{class:'group'},el('h3',{},'Étapes'),el('ul',{class:'steps'},(ETAPES[b.chantier]||[]).map((n,k)=>el('li',{class:k<done?'done':''},el('span',{},k<done?'✓':k===done&&p<1?'▸':'·'),(k+1)+'. '+n+(k===done&&p<1?' · en cours':''))))),
      team.length? el('div',{class:'group'},el('h3',{},'Équipe et contributions'),el('div',{class:'list'},team.map(a=>{ const r=agentRow(a); r.querySelector('.ms').textContent+=' · '+Math.floor(agentPts(a,b,Date.now(),all))+' pts'; return r; }))) : el('p',{},'Aucun agent ici pour le moment. Nomme le premier.') ],
    actions:[ { label:'Nommer un agent ici', primary:true, fn:()=>{ draft.bureau=id; openPanel(panelAgents); } }, ...(b.chantier==='store'? [{ label:'App Store', fn:()=>openPanel(panelAppStore) }] : []), homeAction ] };
}
