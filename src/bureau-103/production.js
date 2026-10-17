/* ---------- Production des chantiers ----------
   Avancement calculé à partir des fiches d'agents (dates de nomination, d'expiration, de révocation) :
   identique pour tous les visiteurs, sans écriture. 480 points par chantier, 5 étapes de 96 points. */
const HOUR = 36e5, CHANTIER_PTS = 480, ETAPE_PTS = 96;
const ETAPES = {
  noyau:['Fondations','Démarrage','Fichiers','Réglages','Mise en service'],
  interface:['Maquettes',"Écran d'accueil",'Fenêtres','Thème nuit','Finitions'],
  store:['Catalogue','Fiches des apps','Installation','Mises à jour','Ouverture'],
  securite:['Comptes','Accès','Chiffrement','Sauvegardes','Audit final'],
  ia:['Branchement','Assistant','Agents','Mémoire','Tests'],
  donnees:['Stockage','Synchronisation','Hébergement','Migration','Contrôle'],
};
const RATES = { 'Chef de chantier':.6, 'Développeur':1, 'Designer':1, 'Testeur':.8, 'Sécurité':1, 'Intégrateur IA':1 };
const AFFINITE = { noyau:['Développeur'], interface:['Designer'], store:['Développeur','Testeur'], securite:['Sécurité','Testeur'], ia:['Intégrateur IA'], donnees:['Développeur','Sécurité'] };
const teamOf = id => [...store.agents.values()].filter(a=>a.bureau===id);
function agentRate(a,b){ return (RATES[a.role]||1) * ((AFFINITE[b.chantier]||[]).includes(a.role) ? 1.5 : 1); }
function agentEnd(a){ return Math.min(a.expire, a.statut==='révoqué' ? (a.revoque||a.cree) : Infinity); }
function agentPts(a,b,t,team){
  const s=Math.max(a.cree,b.cree), e=Math.min(agentEnd(a),t); if(e<=s) return 0;
  let pts=(e-s)/HOUR*agentRate(a,b);
  if(a.role!=='Chef de chantier'){ let best=0; for(const c of team) if(c.role==='Chef de chantier'){ const cs=Math.max(s,c.cree), ce=Math.min(e,agentEnd(c)); if(ce>cs) best=Math.max(best,ce-cs); } pts+=best/HOUR*agentRate(a,b)*.2; }
  return pts;
}
function bureauPts(b,t=Date.now()){ const team=teamOf(b.id); let sum=0; for(const a of team) sum+=agentPts(a,b,t,team); return Math.min(sum,CHANTIER_PTS); }
function bureauRate(b){ const now=Date.now(); return Math.max(0,bureauPts(b,now+HOUR)-bureauPts(b,now)); }
function timeToReach(b,target){
  const now=Date.now(); let hi;
  if(bureauPts(b,now)>=target) hi=now; else { const lim=Math.max(now,...teamOf(b.id).map(agentEnd).filter(isFinite)); if(bureauPts(b,lim)<target) return null; hi=lim; }
  let lo=b.cree; for(let k=0;k<44;k++){ const m=(lo+hi)/2; if(bureauPts(b,m)>=target) hi=m; else lo=m; } return hi;
}
function fmtPct(p){ const v=p*100; return (v<10 && v>0 ? v.toFixed(1) : Math.floor(v))+' %'; }
function bar(p,css){ return el('div',{class:'bar'},el('i',{style:'width:'+(p*100).toFixed(2)+'%;background:'+css})); }
function osProgress(){ let s=0; for(const c of CHANTIERS){ const b=bureauxSorted().find(x=>x.chantier===c.key); if(b) s+=bureauPts(b)/CHANTIER_PTS; } return s/CHANTIERS.length; }
function etapeName(b,k){ return (ETAPES[b.chantier]||ETAPES.noyau)[k-1]; }
const milestonesDone=new Set();
function checkMilestones(){
  const known=new Set(store.archives.map(e=>e.id).filter(Boolean));
  for(const b of store.bureaux.values()){
    const pts=bureauPts(b), c=chantier(b.chantier);
    for(let k=1;k<=5;k++){
      if(pts<k*ETAPE_PTS) break;
      const id='etape-'+b.id+'-'+k; if(known.has(id)||milestonesDone.has(id)) continue; milestonesDone.add(id);
      const t=Math.round(timeToReach(b,k*ETAPE_PTS)||Date.now());
      const e={ id, t, type:'etape', txt: b.id+' · '+c.nom+' : étape '+k+'/5 « '+etapeName(b,k)+' » franchie'+(k===5?' · chantier terminé':''), matricule:null };
      if(store.db){ store.db.collection('archives').doc(id).set(e).catch(()=>{}); }
      else { store.archives.push(e); store.archives.sort((x,y)=>y.t-x.t); localSave(); }
      if(worldReady) toast(e.txt);
    }
  }
}
function updateProduction(){
  for(const [id,lot] of placed){ const b=store.bureaux.get(id), o=lot.obj; if(!b||!o||!o.fill) continue;
    const p=bureauPts(b)/CHANTIER_PTS; o.fill.scale.x=Math.max(.001,p); o.fill.position.x=-4.5+4.5*p;
    const txt=b.id+' · '+chantier(b.chantier).nom+' · '+(p>=1?'terminé':fmtPct(p));
    if(txt!==o.lastTxt){ o.lastTxt=txt; if(o.sign){ o.group.remove(o.sign); const sm=o.sign.material; if(sm.map) sm.map.dispose(); sm.dispose(); } o.sign=label(txt,chantier(b.chantier).css); o.sign.position.y=o.signY; o.group.add(o.sign); }
    o.crane.forEach(m=>m.visible=p<1); }
  const g=osProgress(); $('#osPct').textContent=fmtPct(g); $('#osBar').style.width=(g*100).toFixed(2)+'%';
  checkMilestones();
  syncApps();
  const known=new Set(store.archives.map(e=>e.id).filter(Boolean));
  for(const a of store.apps.values()){
    if(appStatus(a)!=='publiée') continue; const id='app-'+a.nom; if(known.has(id)||milestonesDone.has(id)) continue; milestonesDone.add(id);
    const lot=placedApps.get(a.nom), e={ id, t:a.demande+AUDIT_H*36e5, type:'app', txt:appName(a)+' est publiée'+(lot?' dans le quartier '+STUDIOS[lot.st].name:'')+' après son audit', matricule:null };
    if(store.db) store.db.collection('archives').doc(id).set(e).catch(()=>{}); else { store.archives.push(e); store.archives.sort((x,y)=>y.t-x.t); localSave(); }
    if(worldReady) toast(e.txt);
  }
}

