/* ---------- Réactivation des apps du nouvel Aypona OS ----------
   Condition : chantiers App Store et Sécurité terminés. Une app à la fois passe un audit de sécurité
   de 12 h, puis elle rouvre (calculé, rien à écrire). Les bureaux gardent les 8 terrains les plus proches
   du siège ; les apps prennent les suivants, dans l'ordre de leur réactivation. */
const AUDIT_H = 12, BUREAU_LOTS = 8;
const APP_LOTS = LOT_ORDER.slice(BUREAU_LOTS);
const placedApps = new Map();
function appStatus(a,now=Date.now()){ return now >= a.demande + AUDIT_H*36e5 ? 'publiée' : 'en audit'; }
function appName(a){ return (a&&a.manifeste&&a.manifeste.nom)||(a&&a.nom)||''; }
function appsSorted(){ return [...store.apps.values()].sort((a,b)=>a.demande-b.demande || (a.nom<b.nom?-1:1)); }
function appHeight(n){ let h=7; for(const ch of n) h=(h*31+ch.charCodeAt(0))>>>0; return 12+(h%28); }
function bureauOf(key){ return [...store.bureaux.values()].sort((a,b)=>a.id<b.id?-1:1).find(b=>b.chantier===key); }
function gate(){
  const st=bureauOf('store'), se=bureauOf('securite');
  const done=b=>!!b && bureauPts(b)>=CHANTIER_PTS;
  let eta=null; if(st&&se){ const a=done(st)?Date.now():timeToReach(st,CHANTIER_PTS), b=done(se)?Date.now():timeToReach(se,CHANTIER_PTS); if(a&&b) eta=Math.max(a,b); }
  return { open:done(st)&&done(se), st, se, eta };
}
function inAudit(){ return appsSorted().find(a=>appStatus(a)==='en audit'); }
/* Bureau 102 · Polaris (v4.8) : manifeste d'app (décret n°2 du mandat IV). Mêmes règles que le noyau d'Aypona OS (os/index.html).
   privé : aucune adresse publiée ; service : https ; public : https ou apps/<id>/…html publié avec le système. */
const MANIFESTE={
  studios:['Devea','Nativus','BroNet','8Pool','Neural Pro'],
  permissions:{ notifications:'Envoyer des notifications', fichiers:'Lire et écrire ses propres fichiers' },
  reserves:['reglages','store','moniteur','astuces','fichiers','aypona','systeme'],
  validate(m){
    const err=[], out={}, str=v=>typeof v==='string'? v.trim() : '';
    if(!m||typeof m!=='object'||Array.isArray(m)) return { ok:false, errors:['Le manifeste doit être un objet.'], manifeste:null };
    out.id=str(m.id); if(!/^[a-z][a-z0-9-]{1,31}$/.test(out.id)) err.push('id : 2 à 32 caractères, minuscules, chiffres et tirets, en commençant par une lettre.'); else if(MANIFESTE.reserves.includes(out.id)) err.push('id : « '+out.id+' » est réservé au système.');
    out.nom=str(m.nom); if(out.nom.length<2||out.nom.length>24||/[<>]/.test(out.nom)) err.push('nom : 2 à 24 caractères, sans < ni >.');
    out.studio=str(m.studio); if(!MANIFESTE.studios.includes(out.studio)) err.push('studio : '+MANIFESTE.studios.join(', ')+'.');
    out.version=str(m.version); if(!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(out.version)) err.push('version : trois nombres, par exemple 1.0.0.');
    out.domicile=str(m.domicile); if(!DOMICILES[out.domicile]) err.push('domicile : prive, service ou public.');
    out.entree=str(m.entree);
    if(out.domicile==='prive'){ if(out.entree) err.push('entrée : une app privée ne publie pas son adresse, elle se règle sur l’appareil.'); }
    else if(DOMICILES[out.domicile]){
      const rel=/^apps\/[a-z0-9-]+\/[A-Za-z0-9._\/-]*\.html$/.test(out.entree)&&!out.entree.includes('..');
      let https=false; try{ const u=new URL(out.entree); https=u.protocol==='https:'&&!u.username&&!u.password; }catch(e){}
      if(!out.entree) err.push('entrée : adresse obligatoire pour une app '+DOMICILES[out.domicile].nom+'.');
      else if(out.domicile==='service'&&!https) err.push('entrée : une app de service s’ouvre par une adresse https.');
      else if(out.domicile==='public'&&!https&&!rel) err.push('entrée : adresse https, ou chemin apps/'+(out.id||'<id>')+'/….html publié avec le système.');
      else if(rel&&!out.entree.startsWith('apps/'+out.id+'/')) err.push('entrée : le chemin doit commencer par apps/'+out.id+'/.');
    }
    const ic=m.icone&&typeof m.icone==='object'? m.icone : {};
    out.icone={ couleur:/^#[0-9a-fA-F]{6}$/.test(ic.couleur||'')? ic.couleur : '#636366', glyphe:str(ic.glyphe).replace(/[<>&"']/g,'').slice(0,2) || (out.nom[0]||'?').toUpperCase() };
    const perms=m.permissions==null? [] : m.permissions;
    if(!Array.isArray(perms)) err.push('permissions : une liste.'); else { const bad=perms.filter(p=>!MANIFESTE.permissions[p]); if(bad.length) err.push('permissions inconnues : '+bad.join(', ')+'.'); out.permissions=[...new Set(perms.filter(p=>MANIFESTE.permissions[p]))]; }
    if(!out.permissions) out.permissions=[];
    out.description=str(m.description).replace(/[<>]/g,'').slice(0,140);
    return { ok:!err.length, errors:err, manifeste:err.length? null : out };
  },
};
async function requestApp(m){
  const v=MANIFESTE.validate(m); if(!v.ok){ toast('Manifeste refusé : '+v.errors[0]); return false; }
  const g=gate(); if(!g.open){ toast("L'App Store et la Sécurité doivent d'abord être terminés."); return false; }
  const cur=inAudit(); if(cur){ toast(appName(cur)+' est encore en audit : une app à la fois.'); return false; }
  const id=v.manifeste.id; if(store.apps.has(id)){ toast('Une app porte déjà l’id « '+id+' ».'); return false; }
  await put('apps',id,{ nom:id, manifeste:v.manifeste, demande:Date.now() });
  await archive('app', v.manifeste.nom+' ('+id+', '+DOMICILES[v.manifeste.domicile].nom+') : demande de publication, audit de sécurité de '+AUDIT_H+' h');
  logEvt(v.manifeste.nom+' entre en audit de sécurité'); save(); toast(v.manifeste.nom+' entre en audit de sécurité'); return true;
}
function syncApps(){
  const live=appsSorted().filter(a=>appStatus(a)==='publiée');
  const want=new Map(); live.forEach((a,k)=>{ if(APP_LOTS[k]) want.set(a.nom,APP_LOTS[k]); });
  for(const [n,lot] of placedApps){ if(want.get(n)!==lot){ clearLot(lot); placedApps.delete(n); } }
  for(const a of live){ const lot=want.get(a.nom); if(!lot||placedApps.has(a.nom)) continue; placeOnLot(lot,{ kind:'app', name:appName(a), h:appHeight(a.nom), t:a.nom.length%3, domicile:(a.manifeste||{}).domicile },worldReady); lot.appId=a.nom; placedApps.set(a.nom,lot); } // Bureau 102 (v4.8) : nom du manifeste et domicile
}

