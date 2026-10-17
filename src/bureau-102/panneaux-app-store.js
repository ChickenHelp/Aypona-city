/* Bureau 102 · Polaris (v4.8) : App Store du catalogue neuf (décret n°2 du mandat IV).
   Les 35 anciennes apps (APPS) sont des archives en lecture seule ; les apps nouvelles arrivent par manifeste. */
function appChip(n){ return el('span',{class:'chip',title:'Archivée, en lecture seule'},n); }
function domChip(dom){ const d=DOMICILES[dom]; return d? el('span',{class:'chip',style:'border-style:solid;border-color:'+d.css+';color:'+d.css},'● '+d.nom) : null; }
function appUrl(m){ if(!m||m.domicile==='prive'||!m.entree) return null; return /^apps\//.test(m.entree)? 'os/'+m.entree : m.entree; }
function linkBtn(href,label){ return el('a',{ href, target:'_blank', rel:'noopener noreferrer', style:'display:inline-flex;gap:8px;align-items:center;justify-self:start;padding:10px 14px;border-radius:12px;background:var(--accent);color:var(--night);font:600 .95rem var(--body);text-decoration:none' },label); }
function openHref(href){ const a=document.createElement('a'); a.href=href; a.target='_blank'; a.rel='noopener noreferrer'; document.body.append(a); a.click(); a.remove(); }
const mdraft={ id:'', nom:'', studio:'Nativus', version:'1.0.0', domicile:'public', entree:'', couleur:'#5cb4ff', glyphe:'', permissions:[], description:'', check:false };
function mdraftManifest(){ return { id:mdraft.id, nom:mdraft.nom, studio:mdraft.studio, version:mdraft.version, domicile:mdraft.domicile, entree:mdraft.domicile==='prive'?'':mdraft.entree, icone:{ couleur:mdraft.couleur, glyphe:mdraft.glyphe }, permissions:mdraft.permissions.slice(), description:mdraft.description }; }
function mInput(key,label,ph,max){ const i=el('input',{ type:'text', maxlength:String(max||60), placeholder:ph||'', autocomplete:'off', 'aria-label':label }); i.value=mdraft[key];
  i.addEventListener('input',()=>{ mdraft[key]=i.value; }); i.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); mdraft.check=true; renderPanel(); } });
  return field(label, el('div',{class:'form'},i)); }
function manifestForm(g,cur){
  const v=mdraft.check? MANIFESTE.validate(mdraftManifest()) : null;
  const canAsk=g.open&&!cur;
  return el('div',{class:'group'}, el('h3',{},'Préparer un manifeste'),
    mInput('id','Identifiant (id)','ex. notes',32), mInput('nom','Nom affiché','ex. Notes',24),
    field('Studio', chipPick(MANIFESTE.studios.map(x=>[x,x]),mdraft.studio,x=>mdraft.studio=x)),
    mInput('version','Version','1.0.0',11),
    field('Domicile', chipPick(Object.keys(DOMICILES).map(k=>[k,DOMICILES[k].nom]),mdraft.domicile,x=>mdraft.domicile=x)),
    mdraft.domicile==='prive'? el('p',{},"App privée : son adresse reste sur l'appareil du fondateur et se règle dans Aypona OS, jamais ici.") : mInput('entree','Adresse d’entrée', mdraft.domicile==='service'?'https://mon-app.netlify.app/':'https://compte.github.io/app/ ou apps/<id>/index.html',200),
    field('Permissions', el('div',{class:'chips'},Object.keys(MANIFESTE.permissions).map(p=>{ const on=mdraft.permissions.includes(p); return btn((on?'● ':'')+MANIFESTE.permissions[p],()=>{ mdraft.permissions=on? mdraft.permissions.filter(x=>x!==p) : [...mdraft.permissions,p]; renderPanel(); },'small'+(on?' primary':'')); }))),
    mInput('couleur','Couleur de l’icône','#5cb4ff',7), mInput('glyphe','Lettre de l’icône','N',2), mInput('description','Description courte','140 caractères au maximum',140),
    v? el('ul',{class:'log'}, v.ok? el('li',{},el('time',{},'OK'),el('span',{},'Manifeste valide : '+v.manifeste.nom+' '+v.manifeste.version+', '+DOMICILES[v.manifeste.domicile].nom+'.')) : v.errors.map(e=>el('li',{},el('time',{},'✗'),el('span',{},e)))) : null,
    el('div',{class:'actions'}, btn('Vérifier le manifeste',()=>{ mdraft.check=true; renderPanel(); },'small'),
      btn('Exemple',()=>{ Object.assign(mdraft,{ id:'notes', nom:'Notes', studio:'Nativus', version:'1.0.0', domicile:'public', entree:'https://exemple.github.io/notes/', couleur:'#ffd60a', glyphe:'N', permissions:['fichiers'], description:'Exemple : une app de notes publique.', check:true }); renderPanel(); },'small'),
      canAsk? btn('Demander la publication',async()=>{ mdraft.check=true; const ok=await requestApp(mdraftManifest()); if(ok) Object.assign(mdraft,{ id:'', nom:'', entree:'', glyphe:'', description:'', permissions:[], check:false }); renderPanel(); },'small primary') : null),
    canAsk? null : el('p',{}, g.open? 'Une app est déjà en audit : la prochaine demande sera possible après ses 12 h.' : 'Tu peux préparer et vérifier un manifeste dès maintenant. La demande de publication s’ouvrira avec l’App Store.'));
}
function panelAppStore(){
  const g=gate(), list=appsSorted(), pub=list.filter(a=>appStatus(a)==='publiée'), cur=inAudit();
  const row=(b,key)=>{ const c=chantier(key); if(!b) return el('div',{},el('dt',{style:'color:'+c.css},'—'),el('dd',{},c.nom),el('dd',{},'Pas encore de bureau.'));
    const pp=bureauPts(b)/CHANTIER_PTS; return el('div',{},el('dt',{style:'color:'+c.css},b.id),el('dd',{},c.nom+' · '+(pp>=1?'terminé':fmtPct(pp))),el('dd',{style:'grid-column:2'},bar(pp,c.css))); };
  const left=cur? Math.max(0,cur.demande+AUDIT_H*36e5-Date.now()) : 0;
  return { eyebrow:'App Store du nouvel Aypona OS', title:g.open? 'Publications ouvertes' : 'Publications verrouillées',
    body:[ el('p',{},"Le catalogue d'Aypona OS est recréé de zéro. Chaque app nouvelle arrive avec son manifeste et son domicile, une à la fois, après "+AUDIT_H+" h d'audit par l'équipe Sécurité. Une fois publiée, sa tour sort de terre dans la ville et elle s'installe dans Aypona OS."),
      statRow([ ['Publiées',pub.length], ['En audit',cur?1:0], ['Archivées',APPS.length] ]),
      field('Domiciles', el('div',{class:'chips'},Object.keys(DOMICILES).map(domChip)), el('p',{},'Privé : sur l’ordinateur ou le cloud du fondateur, adresse jamais publiée. Service : app avec serveur, sur Netlify. Public : ouverte à tous, sur GitHub ou publiée avec le système. La balise de la tour prend la couleur du domicile.')),
      g.open? null : el('p',{},"Les publications s'ouvrent quand l'App Store et la Sécurité sont terminés."+(g.eta?' Ouverture prévue le '+fmtDay(g.eta)+' au rythme actuel.':' Au rythme actuel, les agents ne suffiront pas : renforce ces deux bureaux.')),
      g.open? null : el('dl',{class:'dir'},row(g.st,'store'),row(g.se,'securite')),
      cur? el('p',{},el('b',{style:'color:var(--warm)'},appName(cur)),' est en audit de sécurité. Fin dans '+Math.ceil(left/36e5)+' h.') : null,
      list.length? field('Catalogue', el('dl',{class:'dir'},list.map(a=>{ const m=a.manifeste||{}, st=appStatus(a);
        return el('div',{},el('dt',{style:'color:'+(st==='publiée'?'#7fe0a0':'var(--warm)')},st),el('dd',{},appName(a)+' · '+(m.studio||'')+' · v'+(m.version||'?')),el('dd',{},(DOMICILES[m.domicile]||{nom:'?'}).nom+' · demandée le '+fmtDay(a.demande))); }))) : el('p',{},'Aucune app publiée pour l’instant.'),
      manifestForm(g,cur) ],
    actions:[ ...(g.open? [] : [{ label:'Nommer des renforts (103)', primary:true, fn:()=>openPanel(panelAgents) }]), { label:'Archives de l’ancien catalogue', fn:()=>openPanel(panelOldCatalog) }, { label:'Ouvrir Aypona OS', fn:()=>openHref('os/index.html') } ] };
}
function panelOldCatalog(){
  return { eyebrow:'App Store · archives en lecture seule', title:'Archives de l’ancien catalogue',
    body:[ el('p',{},"Décret n°2 du mandat IV : les 35 apps de l'ancien Aypona OS ne sont plus réactivables. Elles n'ont plus d'adresse depuis l'arrêt de l'abonnement Netlify. Elles restent ici comme base de recherche pour le catalogue neuf, avec l'ancien catalogue de 347 apps et l'univers lore (Bluesand, Dania, AySim, crédits), conservés dans les zips du fondateur."),
      field('35 apps de l’ancien Aypona OS', el('div',{class:'chips'},APPS.map(appChip))) ],
    actions:[ { label:'Retour à l’App Store', primary:true, fn:()=>openPanel(panelAppStore) } ] };
}
function panelApp(lot){
  const a=store.apps.get(lot.appId)||[...store.apps.values()].find(x=>appName(x)===lot.name);
  if(a){ const m=a.manifeste||{}, url=appUrl(m);
    return { eyebrow:'Quartier '+STUDIOS[lot.st].name+' · nouvel Aypona OS', title:appName(a),
      body:[ el('p',{},(m.description||'App du nouvel Aypona OS.')+' Publiée après '+AUDIT_H+" h d'audit par l'équipe Sécurité."),
        el('div',{class:'chips'},domChip(m.domicile),m.studio?el('span',{class:'chip'},m.studio):null,el('span',{class:'chip'},'v'+(m.version||'?'))),
        statRow([ ['Demandée le',fmtDay(a.demande)], ['Publiée le',fmtDay(a.demande+AUDIT_H*36e5)], ['Étages',Math.round(appHeight(a.nom)/3.5)] ]),
        url? linkBtn(url,'Ouvrir '+appName(a)+' ↗') : el('p',{},m.domicile==='prive'? "App privée : elle s'ouvre depuis Aypona OS, sur l'appareil où son adresse est réglée." : 'Adresse manquante.'),
        (m.permissions||[]).length? field('Permissions', el('div',{class:'chips'},m.permissions.map(p=>el('span',{class:'chip'},MANIFESTE.permissions[p]||p)))) : null ],
      actions:[ ...(url? [{ label:'Ouvrir '+appName(a), primary:true, fn:()=>openHref(url) }] : [{ label:'Ouvrir Aypona OS', primary:true, fn:()=>openHref('os/index.html') }]), { label:"App Store", fn:()=>openPanel(panelAppStore) }, homeAction ] }; }
  const rec=state.built.find(b=>b.lot===lot.i);
  return { eyebrow:'Quartier '+STUDIOS[lot.st].name, title:lot.name,
    body:[ el('p',{}, rec? "App installée depuis le bureau 102 de l'architecte d'Aypona OS." : "Bâtiment issu du catalogue Aypona OS. Le studio "+STUDIOS[lot.st].name+" l'occupe."),
      statRow([ ['Lot',lot.i+1], ['Quartier',STUDIOS[lot.st].name], ['Étages',Math.round((rec?rec.h:Math.max(...lot.obj.meshes.map(m=>m.position.y+m.geometry.parameters.height/2)))/3.5)] ]) ],
    actions:[ homeAction ] };
}

