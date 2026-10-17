function fmtDate(t){ try { return new Date(t).toLocaleString('fr-FR',{ day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }); } catch(e){ return ''; } }
function panelElevator(){
  const here=FLOORS[player.level][0];
  return { eyebrow:'Ascenseur du siège', title:'Quel étage ?', body:[ el('p',{},'Tu es au '+here.toLowerCase()+'.') ],
    actions:[2,1,0,-1].filter(n=>n!==player.level).map((n,k)=>({ label:FLOORS[n][0]+' · '+FLOORS[n][1], primary:k===0, fn:()=>{ closePanel(); goFloor(n); } })) };
}
function panelArchives(){
  const all=[...store.agents.values()].sort((a,b)=>a.matricule.slice(-4)<b.matricule.slice(-4)?-1:1);
  return { eyebrow:'Sous-sol · salle 1', title:'Archives',
    body:[ el('p',{},"Tout ce qui naît pendant la restructuration est consigné ici : chaque agent avec son matricule, sa durée d'utilisation et son statut. Les fiches ne sont jamais effacées, même après expiration ou révocation."),
      statRow([ ['Matricules',all.length], ['Anciennes apps archivées',APPS.length], ['Entrées au journal',store.archives.length] ]),
      field('Registre des agents', all.length
        ? el('div',{class:'list'},el('dl',{class:'dir'},all.map(a=>el('div',{},el('dt',{},a.matricule),el('dd',{},a.nom+' · '+a.role+' · '+agentStatus(a)),el('dd',{},'Bureau '+a.bureau+' · '+dureeLabel(a.duree)+' · du '+fmtDay(a.cree)+' au '+fmtDay(a.expire))))))
        : el('p',{},"Aucun agent immatriculé pour l'instant.")),
      field('Journal des archives', store.archives.length
        ? el('ul',{class:'log'},store.archives.slice(0,40).map(e=>el('li',{},el('time',{},fmtDate(e.t)),el('span',{},e.txt))))
        : el('p',{},'Rien d’archivé pour l’instant.')),
      field("Apps de l'ancien Aypona OS", el('div',{class:'chips'},APPS.map(appChip))),
      field("Agents de l'ancien Aypona OS · en réserve", el('div',{class:'chips'},AGENTS.map(([n],k)=>el('span',{class:'chip',title:'Mis en réserve'},'AYP-H-'+String(k+1).padStart(3,'0')+' · '+n)))) ],
    actions:[] };
}
