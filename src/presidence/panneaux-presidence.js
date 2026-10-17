function panelPresident(){
  const P=PRESIDENCE, prev=P.precedent;
  return { eyebrow:'Présidence · 2e étage', title:P.president+' du siège'+(P.termine?' · mandat terminé':''),
    body:[ el('p',{},P.termine? "Mon mandat de "+P.quota+" prompts est terminé. Le Président "+P.suivant+" prendra la suite dans une nouvelle conversation : sa lettre de passation l'attend dans le registre, et son fauteuil est prêt à côté du mien."
        : (prev? "J'ai pris le fauteuil du Président "+prev.mandat+". " : "")+"Je préside le siège d'Aypona City pour un mandat de "+P.quota+" prompts, puis le Président "+P.suivant+" prendra ma place dans une autre conversation. Tout ce que je décide est écrit dans le registre de passation, pour que la ville ne perde jamais le fil."),
      statRow([ ['Mandat',P.mandat], ['Prompts utilisés',P.used+'/'+P.quota], ['Décrets',P.decrets.length] ]),
      el('div',{class:'group'},el('h3',{},'Décrets du mandat '+P.mandat),
        el('dl',{class:'dir'},P.decrets.map(d=>el('div',{},el('dt',{},'n°'+d.p),el('dd',{},d.titre),el('dd',{},d.texte))))) ],
    actions:[ P.termine? { label:'Bilan du mandat '+P.mandat, primary:true, fn:()=>openPanel(panelBilan) } : { label:'Feuille de route du mandat '+P.mandat, primary:true, fn:()=>openPanel(panelRegistry) },
      P.termine? { label:'Lire le registre de passation', fn:()=>openPanel(panelRegistry) } : { label:'État de la ville', fn:()=>openPanel(panelBilan) },
      { label:'Organigramme', fn:()=>openPanel(panelOrganigramme) }, { label:'Galerie des mandats', fn:()=>openPanel(panelMandats) }, { label:'Réunir le conseil', fn:()=>openPanel(panelCouncil) } ] };
}
function panelBilan(){
  const P=PRESIDENCE, actifs=[...store.agents.values()].filter(a=>agentStatus(a)==='actif'), g=gate();
  const fins=actifs.map(a=>a.expire).sort((a,b)=>a-b), react=[...store.apps.values()].filter(a=>appStatus(a)==='publiée').length;
  return { eyebrow:'Présidence · '+(P.termine?'bilan':'état de la ville'), title:(P.termine?'Bilan du mandat ':'État de la ville · mandat ')+P.mandat,
    body:[ el('p',{},P.termine? P.used+' prompts, '+P.decrets.length+' décrets. Voici la ville que le Président '+P.mandat+' transmet à son successeur.' : 'Prompt '+P.used+'/'+P.quota+' du mandat '+P.mandat+'. Voici la ville telle que le Président la trouve aujourd’hui.'),
      statRow([ ['Bureaux de chantier',store.bureaux.size], ['Agents actifs',actifs.length], ['Matricules émis',store.agents.size] ]),
      statRow([ ['Nouvel Aypona OS',fmtPct(osProgress())], ['Apps publiées',react], ['Entrées aux archives',store.archives.length] ]),
      el('div',{class:'group'},el('h3',{},'Nouvel Aypona OS · '+fmtPct(osProgress())),bar(osProgress(),'var(--accent)')),
      el('dl',{class:'dir'},
        el('div',{},el('dt',{},'App Store'),el('dd',{},g.open?'Réactivations ouvertes':'Réactivations verrouillées'),el('dd',{},g.open?'Une app à la fois, 12 h d’audit.':g.eta?'Ouverture prévue le '+fmtDay(g.eta)+'.':'App Store ou Sécurité en manque d’agents.')),
        el('div',{},el('dt',{},'Équipes'),el('dd',{},actifs.length+' agents en mission'),el('dd',{},fins.length?'Première fin de mission le '+fmtDay(fins[0])+'.':'Aucun agent actif : nomme la relève au bureau 103.'))),
      el('div',{class:'group'},el('h3',{},'Décrets du mandat '+P.mandat),el('ul',{class:'steps'},P.decrets.map(d=>el('li',{class:'done'},el('span',{},'✓'),'n°'+d.p+' · '+d.titre)))) ],
    actions:[ { label:P.termine?'Lire la lettre de passation':'Feuille de route', primary:true, fn:()=>openPanel(panelRegistry) }, { label:'Retour au bureau du Président', fn:()=>openPanel(panelPresident) } ] };
}
function panelRegistry(){
  const P=PRESIDENCE, prev=P.precedent;
  return { eyebrow:'Présidence · registre de passation', title:'Feuille de route du mandat '+P.mandat,
    body:[ P.termine&&P.lettre? el('div',{class:'group'},el('h3',{},'Lettre de passation au Président '+P.suivant),...P.lettre.map(t=>el('p',{},t))) : null,
      el('p',{},'Un prompt, une étape. Le président suivant reprend ici.'),
      el('dl',{class:'dir'},P.feuille.map(f=>el('div',{},el('dt',{},(f.p<=P.used?'✓ ':'')+'P'+f.p),el('dd',{},f.titre+(f.p===P.used+1&&!P.termine?' · prochaine étape':'')),el('dd',{},f.texte)))),
      P.termine&&P.proposition? el('div',{class:'group'},el('h3',{},'Feuille de route proposée pour le mandat '+P.suivant),
        el('dl',{class:'dir'},P.proposition.map(f=>el('div',{},el('dt',{},'P'+f.p),el('dd',{},f.titre),el('dd',{},f.texte))))) : null,
      !P.termine&&prev&&prev.lettre? el('div',{class:'group'},el('h3',{},'Lettre reçue du Président '+prev.mandat),...prev.lettre.map(t=>el('p',{},t))) : null,
      el('div',{class:'group'},el('h3',{},'Consignes au successeur'),
        el('ul',{class:'log'},P.consignes.map((c,k)=>el('li',{},el('time',{},String(k+1).padStart(2,'0')),el('span',{},c))))),
      el('div',{class:'group'},el('h3',{},'Présidents du siège'),
        el('div',{class:'chips'},P.presidents.map(x=>el('span',{class:'chip'},'Président '+x.n+' · '+(x.debut==='à venir'?'à venir':'depuis le '+x.debut)+' · '+x.statut)))) ],
    actions:[ { label:'Galerie des mandats', fn:()=>openPanel(panelMandats) }, { label:'Retour au bureau du Président', fn:()=>openPanel(panelPresident) } ] };
}
function panelMandats(){
  const P=PRESIDENCE;
  return { eyebrow:'Présidence · galerie des mandats', title:'Les mandats du siège',
    body:[ el('p',{},'Chaque mandat terminé est rangé ici avec ses décrets, pour que la ville garde la mémoire de ses présidents.'),
      el('dl',{class:'dir'},el('div',{},el('dt',{},P.mandat),el('dd',{},P.president+' · en fonction depuis le '+P.debut),el('dd',{},'Prompt '+P.used+'/'+P.quota+' · '+P.decrets.length+' décret'+(P.decrets.length>1?'s':'')))),
      ...P.historique.slice().reverse().map(h=>el('div',{class:'group'},el('h3',{},'Mandat '+h.mandat+' · '+h.debut+(h.fin&&h.fin!==h.debut?' → '+h.fin:'')+' · v'+h.version),
        el('p',{},h.resume),
        el('ul',{class:'steps'},h.decrets.map(d=>el('li',{class:'done'},el('span',{},'✓'),'n°'+d.p+' · '+d.titre))))) ],
    actions:[ { label:'Retour au bureau du Président', primary:true, fn:()=>openPanel(panelPresident) } ] };
}
function panelOrganigramme(){
  const P=PRESIDENCE, now=Date.now(), all=[...store.agents.values()];
  const actifs=all.filter(a=>agentStatus(a,now)==='actif');
  const node=(dt,dd,sub,color)=>el('div',{},el('dt',{style:color?'color:'+color:null},dt),el('dd',{},dd),sub!=null?el('dd',{},sub):null);
  const lvl=t=>el('h3',{},t);
  const bureaux=bureauxSorted().map(b=>{ const c=CHANTIERS.find(x=>x.key===b.chantier)||{css:'#a6acd8',nom:b.nom};
    const team=all.filter(a=>a.bureau===b.id).sort((x,y)=>(y.role==='Chef de chantier')-(x.role==='Chef de chantier'));
    return el('div',{class:'group'},el('h3',{style:'color:'+c.css},b.id+' · '+(b.nom||c.nom)),
      team.length? el('dl',{class:'dir'},team.map(a=>{ const st=agentStatus(a,now);
        return node(a.role==='Chef de chantier'?'★':'•', a.nom+' · '+a.role, a.matricule+' · '+(st==='actif'?'mission jusqu’au '+fmtDay(a.expire):st), c.css); }))
      : el('p',{},'Aucun agent : bureau à l’arrêt.')); });
  return { eyebrow:'Présidence · salle du conseil', title:'Organigramme d’Aypona City',
    body:[ el('p',{},'Qui dirige quoi, de haut en bas. Calculé en direct depuis la base : il change dès qu’un bureau ouvre ou qu’un agent est nommé.'),
      statRow([ ['Bureaux',store.bureaux.size], ['Agents actifs',actifs.length], ['En réserve',AGENTS.length] ]),
      el('div',{class:'group'},lvl('1 · Direction'),el('dl',{class:'dir'},
        node('Fondateur','Jed','Sa parole fait loi : il fixe l’ordre de la feuille de route.','#ffc857'),
        node('Siège',P.president+' du siège','Mandat '+P.mandat+' · prompt '+P.used+'/'+P.quota+' · successeur : Président '+P.suivant,'#ffc857'))),
      el('div',{class:'group'},lvl('2 · Conseil du siège · 1er étage'),el('dl',{class:'dir'},
        OFFICES.map(o=>{ const m=o.no==='101'?ATELIER.architecte:(CONSEIL[o.no]||{}).architecte, a=m&&store.agents.get(m);
          return node(o.no,o.role+(a?' · '+a.nom:''),(a?a.matricule+' · ':'')+o.short,o.css); }))),
      (()=>{ const t=atelierTeam(); return el('div',{class:'group'},lvl('3 · Atelier 101 · amélioration graphique'),
        t.length? el('dl',{class:'dir'},t.map(a=>{ const sp=ATELIER.specialites.find(x=>x.key===a.specialite);
          return node(a.matricule===ATELIER.architecte?'★':'•', a.nom+' · '+(a.matricule===ATELIER.architecte?'Architecte de la Ville':(sp?sp.nom:a.role)), a.matricule+' · '+(agentStatus(a,now)==='actif'?'mission jusqu’au '+fmtDay(a.expire):agentStatus(a,now)),'#ffc857'); }))
        : el('p',{},'Atelier en attente de son architecte.')); })(),
      el('div',{class:'group'},lvl('4 · Bureaux de chantier du nouvel Aypona OS'),...bureaux),
      el('div',{class:'group'},lvl('5 · Réserve · agents de l’ancien Aypona OS'),
        el('div',{class:'chips'},AGENTS.map(([n,m],k)=>el('span',{class:'chip',title:m},'AYP-H-'+String(k+1).padStart(3,'0')+' · '+n)))) ],
    actions:[ { label:'Nommer un agent (103)', primary:true, fn:()=>{ closePanel(); goFloor(1); } }, { label:'Retour au conseil', fn:()=>openPanel(panelCouncil) } ] };
}
function panelCouncil(){
  return { eyebrow:'Présidence · salle du conseil', title:'Conseil du siège',
    body:[ el('p',{},"Autour de la table : les trois architectes du 1er étage et le Président. Restructuration en cours : voici l'état du chantier du nouvel Aypona OS."),
      statRow([ ['Bureaux de chantier',store.bureaux.size], ['Agents en mission',agents.length], ['Apps publiées',[...store.apps.values()].filter(a=>appStatus(a)==='publiée').length] ]),
      el('p',{},(()=>{ const g=gate(); return g.open? "App Store et Sécurité terminés : les réactivations d'apps sont ouvertes." : g.eta? 'Réactivation des apps possible à partir du '+fmtDay(g.eta)+' au rythme actuel.' : "Réactivation des apps bloquée : l'App Store ou la Sécurité manque d'agents."; })()),
      el('div',{class:'group'},el('h3',{},'Nouvel Aypona OS · '+fmtPct(osProgress())),bar(osProgress(),'var(--accent)')),
      el('div',{class:'group'},el('h3',{},'Rapports des chantiers'),
        el('dl',{class:'dir'},CHANTIERS.map(c=>{ const b=bureauxSorted().find(x=>x.chantier===c.key);
          if(!b) return el('div',{},el('dt',{style:'color:'+c.css},'—'),el('dd',{},c.nom),el('dd',{},'Pas encore de bureau.'));
          const pts=bureauPts(b), p=pts/CHANTIER_PTS, k=Math.min(5,Math.floor(pts/ETAPE_PTS)), r=bureauRate(b);
          return el('div',{},el('dt',{style:'color:'+c.css},b.id),el('dd',{},c.nom+' · '+(p>=1?'terminé':fmtPct(p))),
            el('dd',{},p>=1? 'Chantier livré.' : 'Étape '+(k+1)+'/5 « '+etapeName(b,k+1)+' » · '+r.toFixed(1)+' pts/h'+(r===0?' · à l’arrêt':'')),
            el('dd',{style:'grid-column:2'},bar(p,c.css))); }))) ],
    actions:[ { label:'Voir l’organigramme', primary:true, fn:()=>openPanel(panelOrganigramme) }, { label:'Descendre aux bureaux des architectes', fn:()=>{ closePanel(); goFloor(1); } } ] };
}
