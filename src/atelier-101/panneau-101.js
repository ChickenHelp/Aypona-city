function statRow(rows){ return el('div',{class:'stats'},rows.map(([k,v])=>el('div',{class:'stat'},el('b',{},String(v)),el('span',{},k)))); }
function atelierTeam(){ return [...store.agents.values()].filter(a=>a.bureau===ATELIER.bureau).sort((x,y)=>x.cree-y.cree); }
function panelCity(){
  const open=new Set([...store.bureaux.values()].map(b=>b.chantier)), team=atelierTeam();
  const archi=store.agents.get(ATELIER.architecte), agentsA=team.filter(a=>a.matricule!==ATELIER.architecte);
  const cmd=store.archives.filter(e=>e.type==='commande').length, liv=store.archives.filter(e=>e.type==='livraison').length;
  return { eyebrow:'Bureau 101 · 1er étage · Atelier 101', title:'Architecte de la Ville'+(archi?' · '+archi.nom:''),
    body:[ el('p',{},archi? archi.nom+' dirige l’Atelier 101. Sa mission : '+ATELIER.mission : "Le poste d'Architecte de la Ville attend sa nomination."),
      archi? el('dl',{class:'dir'},el('div',{},el('dt',{},'Matricule'),el('dd',{},archi.matricule),el('dd',{},agentStatus(archi)==='actif'?'En mission jusqu’au '+fmtDay(archi.expire):agentStatus(archi)))) : null,
      statRow([ ['Agents de l’atelier',agentsA.filter(a=>agentStatus(a)==='actif').length], ['Commandes',cmd], ['Livraisons',liv] ]),
      field('Spécialités de l’atelier', el('dl',{class:'dir'},ATELIER.specialites.map(sp=>{ const m=agentsA.filter(a=>a.specialite===sp.key&&agentStatus(a)==='actif');
        return el('div',{},el('dt',{style:'color:#ffc857'},m.length?'✓ '+m.map(a=>a.nom).join(', '):'à pourvoir'),el('dd',{},sp.nom),el('dd',{},sp.texte)); }))),
      agentsA.length? field('Équipe', el('div',{class:'list'},agentsA.map(agentRow))) : null,
      field('Bureaux de chantier', el('p',{},store.bureaux.size+' bureaux ouverts sur '+CHANTIERS.length+' chantiers.'+(open.size<CHANTIERS.length?' Il reste des chantiers à bâtir.':''))) ],
    actions: [{ label:'Règles de l’atelier', primary:true, fn:()=>openPanel(panelAtelierRegles) }]
      .concat(CHANTIERS.filter(c=>!open.has(c.key)).map(c=>({ label:'Bâtir le bureau '+c.nom, fn:()=>createBureau(c.key) })))
      .concat(store.bureaux.size? [{ label:'Visiter un bureau', fn:()=>openPanel(panelBureauList) }] : []) };
}
function panelAtelierRegles(){
  return { eyebrow:'Atelier 101 · lettre de mission', title:'Règles de l’atelier',
    body:[ el('p',{},ATELIER.mission), el('ul',{class:'log'},ATELIER.regles.map((r,k)=>el('li',{},el('time',{},String(k+1).padStart(2,'0')),el('span',{},r)))) ],
    actions:[ { label:'Retour au bureau 101', primary:true, fn:()=>openPanel(panelCity) } ] };
}
