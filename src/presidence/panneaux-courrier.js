const draftMsg={ a:null, objet:'', texte:'' };
function panelCourrier(){
  const ids=courrierIds(), total=store.courrier.length, nonlus=store.courrier.filter(m=>m.statut==='à lire').length;
  return { eyebrow:'Sous-sol · salle 3', title:'Bureau du courrier',
    body:[ el('p',{},"Ici sont stockés tous les prompts entre le Président, les architectes et leurs agents : le fondateur ne les transmet plus. Chacun a son dossier et le lit avant tout travail."),
      statRow([ ['Courriers',total], ['À lire',nonlus], ['Dossiers',ids.length] ]),
      field('Dossiers', el('dl',{class:'dir'},ids.map(([id,nm])=>{ const n=aLire(id); return el('div',{},el('dt',{style:n?'color:var(--warm)':''},n? n+' à lire' : '✓'),el('dd',{},btn(nm,()=>{ draftMsg.dossier=id; openPanel(panelDossier); },'small')),el('dd',{},id)); }))),
      field('Derniers courriers', store.courrier.length? el('ul',{class:'log'},store.courrier.slice(0,12).map(m=>el('li',{},el('time',{},fmtDate(m.t)),el('span',{},courrierNom(m.de)+' → '+courrierNom(m.a)+' · '+(m.objet||'')+' · '+m.statut)))) : el('p',{},'Aucun courrier pour l’instant.')),
      field('Protocole', el('ul',{class:'log'},COURRIER.protocole.map((r,k)=>el('li',{},el('time',{},String(k+1).padStart(2,'0')),el('span',{},r))))) ],
    actions:[ { label:'Écrire un courrier', primary:true, fn:()=>{ draftMsg.dossier=null; openPanel(panelEcrire); } } ] };
}
function dossierMission(id){ if(id==='PRESIDENT') return 'Mandat '+PRESIDENCE.mandat+' · prompt '+PRESIDENCE.used+'/'+PRESIDENCE.quota+'. Registre dans l’objet PRESIDENCE.';
  if(id==='FONDATEUR') return 'Sa parole fait loi. Il écrit à qui il veut et reçoit les rapports qui lui sont adressés.';
  const a=store.agents.get(id); if(!a) return '';
  if(a.bureau===ATELIER.bureau) return (id===ATELIER.architecte? ATELIER.mission : ((ATELIER.specialites.find(x=>x.key===a.specialite)||{}).texte||a.role))+' Règles : objet ATELIER.';
  if(CONSEIL[a.bureau]) return CONSEIL[a.bureau].mission+' Règles : objet CONSEIL.';
  return a.role; }
function msgItem(m){ return el('div',{},el('dt',{style:m.statut==='à lire'?'color:var(--warm)':''},m.statut),el('dd',{},courrierNom(m.de)+' → '+courrierNom(m.a)+' · '+(m.objet||'sans objet')),el('dd',{},fmtDate(m.t)+' · '+m.texte)); }
function panelDossier(){
  const id=draftMsg.dossier, d=dossierOf(id), a=store.agents.get(id);
  return { eyebrow:'Bureau du courrier · dossier', title:courrierNom(id),
    body:[ el('dl',{class:'dir'},el('div',{},el('dt',{},a? a.matricule : id),el('dd',{},'Mission'),el('dd',{},dossierMission(id)))),
      statRow([ ['Courriers',d.length], ['À lire',aLire(id)], ['Traités',d.filter(m=>m.statut==='traité').length] ]),
      field('Courriers du dossier', d.length? el('dl',{class:'dir'},d.map(msgItem)) : el('p',{},'Dossier vide.')) ],
    actions:[ { label:'Écrire à '+courrierNom(id).split(' · ')[0], primary:true, fn:()=>{ draftMsg.a=id; openPanel(panelEcrire); } }, { label:'Retour au courrier', fn:()=>openPanel(panelCourrier) } ] };
}
async function sendCourrier(m){
  const t=Date.now(), id='c'+t.toString(36)+Math.random().toString(36).slice(2,6), doc={ t, de:m.de, a:m.a, objet:m.objet, texte:m.texte, statut:'à lire', suite:m.suite||null };
  if(store.db){ try { await store.db.collection('courrier').doc(id).set(doc); toast('Courrier déposé pour '+courrierNom(m.a)+'.'); } catch(e){ toast("Courrier refusé : tu n'as peut-être pas les droits d'écriture."); } }
  else { store.courrier.unshift({ ...doc, id }); toast('Courrier déposé (hors ligne).'); }
}
function panelEcrire(){
  if(!draftMsg.a) draftMsg.a='PRESIDENT';
  const obj=el('input',{ type:'text', maxlength:'80', placeholder:'Objet', autocomplete:'off' }); obj.value=draftMsg.objet;
  obj.addEventListener('input',()=>{ draftMsg.objet=obj.value; }); obj.addEventListener('keydown',e=>e.stopPropagation());
  const txt=el('textarea',{ maxlength:'4000', placeholder:'Ton message ou ta commande' }); txt.value=draftMsg.texte;
  txt.addEventListener('input',()=>{ draftMsg.texte=txt.value; }); txt.addEventListener('keydown',e=>e.stopPropagation());
  const send=async()=>{ if(!draftMsg.texte.trim()){ toast('Le message est vide.'); return; }
    await sendCourrier({ de:'FONDATEUR', a:draftMsg.a, objet:draftMsg.objet.trim()||'Message du fondateur', texte:draftMsg.texte.trim() });
    draftMsg.objet=''; draftMsg.texte=''; draftMsg.dossier=draftMsg.a; openPanel(panelDossier); };
  return { eyebrow:'Bureau du courrier · écrire', title:'Courrier du fondateur',
    body:[ el('p',{},"Le message attend son destinataire dans son dossier. Pour le réveiller, une phrase suffit dans sa conversation : « Lis ton dossier au Bureau du courrier. »"),
      field('Destinataire', chipPick(courrierIds().filter(x=>x[0]!=='FONDATEUR').concat([['TOUS','Toute la ville']]).map(([v,l])=>[v,l.split(' · ')[0]]),draftMsg.a,v=>draftMsg.a=v)),
      field('Objet', el('div',{class:'form'},obj)), field('Message', el('div',{class:'form'},txt)) ],
    actions:[ { label:'Déposer le courrier', primary:true, fn:send }, { label:'Retour au courrier', fn:()=>openPanel(panelCourrier) } ] };
}
function panelEmpty(){
  return { eyebrow:'Sous-sol · salle 3', title:'Salle vide',
    body:[ el('p',{},"Cette salle n'a pas encore d'usage. Elle attend un futur service d'Aypona City.") ], actions:[] };
}
