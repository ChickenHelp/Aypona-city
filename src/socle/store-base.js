const store = { bureaux:new Map(), agents:new Map(), apps:new Map(), archives:[], courrier:[], db:null };
const LOCAL_KEY = 'aypona-city-v2-local';
function localLoad(){ try { const s=JSON.parse(localStorage.getItem(LOCAL_KEY)); if(s){ (s.bureaux||[]).forEach(b=>store.bureaux.set(b.id,b)); (s.agents||[]).forEach(a=>store.agents.set(a.matricule,a)); (s.apps||[]).forEach(a=>store.apps.set(a.nom,a)); store.archives=s.archives||[]; } } catch(e) {} }
function localSave(){ if(store.db) return; try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ bureaux:[...store.bureaux.values()], agents:[...store.agents.values()], apps:[...store.apps.values()], archives:store.archives.slice(0,200) })); } catch(e) {} }
function refreshPanel(){ if(!panelFn) return; const a=document.activeElement; if(a && (a.tagName==='INPUT'||a.tagName==='TEXTAREA') && panel.contains(a)) return; renderPanel(); }
async function put(coll,id,data){
  const map=store[coll]; const doc={ ...(map.get(id)||{}), ...data }; map.set(id,doc); localSave(); syncWorld();
  if(store.db){ try { await store.db.collection(coll).doc(id).set(doc); } catch(e){ toast("Enregistrement refusé : tu n'as peut-être pas les droits d'écriture."); } }
}
async function archive(type,txt,matricule){
  const e={ t:Date.now(), type, txt, matricule:matricule||null };
  if(store.db){ try { await store.db.collection('archives').add(e); } catch(err) {} }
  else { store.archives.unshift(e); localSave(); }
  refreshPanel();
}
let worldReady=false;
function initStore(){
  const useLocal=()=>{ localLoad(); syncWorld(); worldReady=true; };
  if(!window.claude || typeof window.claude.use!=='function'){ useLocal(); return; }
  window.claude.use('db').then(db=>{
    if(!db){ useLocal(); return; }
    store.db=db;
    db.collection('bureaux').onSnapshot(snap=>{ store.bureaux.clear(); snap.docs.forEach(d=>store.bureaux.set(d.id,{ ...d.data(), id:d.id })); syncWorld(); worldReady=true; refreshPanel(); }, ()=>{});
    db.collection('apps').onSnapshot(snap=>{ store.apps.clear(); snap.docs.forEach(d=>store.apps.set(d.id,{ ...d.data(), nom:d.id })); syncApps(); refreshPanel(); }, ()=>{});
    db.collection('agents').onSnapshot(snap=>{ store.agents.clear(); snap.docs.forEach(d=>store.agents.set(d.id,{ ...d.data(), matricule:d.id })); syncAgents(); refreshPanel(); }, ()=>{});
    db.collection('courrier').orderBy('t','desc').limit(300).onSnapshot(snap=>{ store.courrier=snap.docs.map(d=>({ ...d.data(), id:d.id })); refreshPanel(); }, ()=>{});
    db.collection('archives').orderBy('t','desc').limit(150).onSnapshot(snap=>{ store.archives=snap.docs.map(d=>({ ...d.data(), id:d.id })); refreshPanel(); }, ()=>{});
  }).catch(useLocal);
}

