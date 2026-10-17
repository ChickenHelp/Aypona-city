function agentRow(a){
  const s=agentStatus(a), c=a.bureau===ATELIER.bureau? { css:'#ffc857' } : CONSEIL[a.bureau]? { css:(OFFICES.find(o=>o.no===a.bureau)||{}).css||'#ffc857' } : chantier((store.bureaux.get(a.bureau)||{}).chantier);
  return el('div',{class:'agent'},
    el('i',{class:'dot',style:'background:'+c.css}),
    el('span',{},el('span',{class:'nm'},a.nom),' ',el('span',{class:'pill '+(s==='actif'?'on':'off')},s==='actif'?remaining(a):s)),
    el('span',{class:'ms'},a.matricule+' · '+a.role+' · bureau '+a.bureau),
    el('span',{class:'bt'}, s!=='révoqué'? btn('Prolonger',()=>prolong(a),'small') : null, s==='actif'? btn('Révoquer',()=>revoke(a),'small') : null));
}
const draft = { nom:'', role:ROLES[1], bureau:null, duree:30 };
function chipPick(list,cur,set){ return el('div',{class:'chips'},list.map(([v,l])=>btn((v===cur?'● ':'')+l,()=>{ set(v); renderPanel(); },'small'+(v===cur?' primary':'')))); }
function field(title,...kids){ return el('div',{class:'group'},el('h3',{},title),...kids); }
function panelAgents(){
  const bs=bureauxSorted();
  if(!draft.bureau || !store.bureaux.has(draft.bureau)) draft.bureau = bs[0] ? bs[0].id : null;
  const all=[...store.agents.values()].sort((a,b)=>b.cree-a.cree), act=all.filter(a=>agentStatus(a)==='actif').length;
  if(!bs.length) return { eyebrow:'Bureau 103 · 1er étage', title:'Manager des agents',
    body:[ el('p',{},"Aucun bureau de construction n'est ouvert. Un agent est toujours affecté à un bureau : l'architecte de la ville (bureau 101) doit d'abord en bâtir un.") ],
    actions:[ { label:'Aller voir le bureau 101', primary:true, fn:()=>openPanel(panelCity) } ] };
  const create=async()=>{ const nom=(draft.nom.trim()||suggestName()).slice(0,16); draft.nom=''; await createAgent({ nom, role:draft.role, bureau:draft.bureau, duree:draft.duree }); refreshPanel(); };
  const input=el('input',{ type:'text', maxlength:'16', placeholder:'Nom, ex. '+suggestName(), autocomplete:'off' }); input.value=draft.nom;
  input.addEventListener('input',()=>{ draft.nom=input.value; });
  input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); input.blur(); create(); } e.stopPropagation(); });
  return { eyebrow:'Bureau 103 · 1er étage', title:'Manager des agents'+(store.agents.get(CONSEIL['103'].architecte)?' · '+store.agents.get(CONSEIL['103'].architecte).nom:''),
    body:[ conseilHead('103'), el('p',{},"Je nomme les agents qui construisent le nouvel Aypona OS. Chaque agent reçoit un matricule, une durée d'utilisation et une fiche aux archives du sous-sol. À la fin de sa durée, il quitte le chantier mais sa fiche reste."),
      statRow([ ['Agents actifs',act], ['Matricules émis',all.length], ['Bureaux',bs.length] ]),
      field('Nom', el('div',{class:'form'}, input, btn('Nom au hasard',()=>{ draft.nom=suggestName(); renderPanel(); },'small'))),
      field('Rôle', chipPick(ROLES.map(r=>[r,r]),draft.role,v=>draft.role=v)),
      field("Bureau d'affectation", chipPick(bs.map(b=>[b.id,b.id+' · '+chantier(b.chantier).nom]),draft.bureau,v=>draft.bureau=v)),
      field("Durée d'utilisation", chipPick(DUREES,draft.duree,v=>draft.duree=v)),
      el('p',{},'Matricule attribué : ',el('b',{style:'color:var(--warm);font-family:var(--mono)'},nextMatricule(draft.bureau)),' · fin de mission le '+fmtDay(Date.now()+draft.duree*DAY)+'.'),
      all.length? field('Effectif', el('div',{class:'list'},all.map(agentRow))) : null ],
    actions:[ { label:"Nommer l'agent", primary:true, fn:create } ] };
}
function panelAgent(mat){
  const a=store.agents.get(mat); if(!a) return { eyebrow:'Agent', title:'Agent introuvable', body:[], actions:[homeAction] };
  const s=agentStatus(a), c=chantier((store.bureaux.get(a.bureau)||{}).chantier);
  const acts=[]; if(s!=='révoqué') acts.push({ label:'Prolonger de '+dureeLabel(a.duree), primary:true, fn:()=>prolong(a) }); if(s==='actif') acts.push({ label:'Révoquer', fn:()=>revoke(a) }); acts.push(homeAction);
  return { eyebrow:'Agent · matricule '+a.matricule, title:a.nom,
    body:[ el('dl',{class:'dir'},
      el('div',{},el('dt',{},'Rôle'),el('dd',{},a.role),el('dd',{},'Bureau '+a.bureau+' · '+c.nom)),
      el('div',{},el('dt',{},'Durée'),el('dd',{},dureeLabel(a.duree)),el('dd',{},'Nommé le '+fmtDay(a.cree)+' · fin le '+fmtDay(a.expire))),
      el('div',{},el('dt',{},'Travail'),el('dd',{},(store.bureaux.get(a.bureau)? Math.floor(agentPts(a,store.bureaux.get(a.bureau),Date.now(),teamOf(a.bureau))) : 0)+' points apportés au chantier'),el('dd',{},'Cadence de base '+(store.bureaux.get(a.bureau)? agentRate(a,store.bureaux.get(a.bureau)).toFixed(1) : '1')+' pt/h'+((AFFINITE[(store.bureaux.get(a.bureau)||{}).chantier]||[]).includes(a.role)?', bonus de spécialité':'')+'.')),
      el('div',{},el('dt',{},'Statut'),el('dd',{},s==='actif'?'En mission, '+remaining(a):s),el('dd',{},'Fiche enregistrée aux archives du sous-sol.'))) ],
    actions:acts };
}
