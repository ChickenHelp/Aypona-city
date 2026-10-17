function panelOS(){
  // Bureau 102 · Polaris (v3.3, v4.8) : sur ordre du fondateur, le bureau 102 construit le système Aypona OS (noyau, interface, socle).
  // Le système est publié avec la ville, à l'adresse relative os/index.html ; les apps et l'App Store sortent de la mission.
  const OS_URL='os/index.html', openOS=()=>openHref(OS_URL);
  const noyau=bureauOf('noyau'), inter=bureauOf('interface');
  const row=(b,key)=>{ const c=chantier(key); if(!b) return el('div',{},el('dt',{style:'color:'+c.css},'—'),el('dd',{},c.nom),el('dd',{},'Pas encore de bureau.'));
    const pp=bureauPts(b)/CHANTIER_PTS; return el('div',{},el('dt',{style:'color:'+c.css},b.id),el('dd',{},c.nom+' · '+(pp>=1?'terminé':fmtPct(pp))),el('dd',{style:'grid-column:2'},bar(pp,c.css))); };
  return { eyebrow:'Bureau 102 · 1er étage', title:"Architecte d'Aypona OS"+(store.agents.get(CONSEIL['102'].architecte)?' · '+store.agents.get(CONSEIL['102'].architecte).nom:''),
    body:[ conseilHead('102'),
      el('p',{},"Je construis le système Aypona OS : noyau, interface et socle. Décret n°2 du mandat IV : le catalogue est recréé de zéro, chaque app arrive avec un manifeste et un domicile (privé, service, public) ; les anciennes apps et l'univers lore sont aux archives."),
      statRow([ ['Système','v0.2.0'], ['Apps publiées',appsSorted().filter(a=>appStatus(a)==='publiée').length], ['Tests du noyau',24] ]),
      el('a',{ href:OS_URL, target:'_blank', rel:'noopener', style:'display:inline-flex;gap:8px;align-items:center;justify-self:start;padding:10px 14px;border-radius:12px;background:var(--accent);color:var(--night);font:600 .95rem var(--body);text-decoration:none' },'Ouvrir Aypona OS ↗'),
      field('Chantiers du système', el('dl',{class:'dir'},row(noyau,'noyau'),row(inter,'interface'))),
      field('Dans la v0.2', el('ul',{class:'log'},[ ['Manifeste','id, nom, studio, version, domicile, adresse, icône, permissions ; manifestes invalides refusés'], ['Hôte d’apps','les apps publiées avec le système s’ouvrent dans une fenêtre isolée et parlent au système par messages ; les autres par un vrai lien'], ['Système','sélecteur d’apps, Fichiers, widgets au choix, notifications envoyées par les apps, App Store relié au catalogue de la ville'], ['Tests','24 tests au démarrage'], ['En attente','comptes, synchronisation et notifications push, qui demandent un serveur ; v0.3 sur GitHub avec Antarès'] ].map(([k,v])=>el('li',{},el('time',{},k),el('span',{},v))))) ],
    actions:[ { label:'Ouvrir Aypona OS', primary:true, fn:openOS }, { label:"Ouvrir l'App Store", fn:()=>openPanel(panelAppStore) }, { label:'Archives de l’ancien catalogue', fn:()=>openPanel(panelOldCatalog) } ] };
}
