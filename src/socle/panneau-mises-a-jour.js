function panelUpdates(){
  const log=state.log.slice(0,25);
  return { eyebrow:'Sous-sol · salle 2', title:'Salle des mises à jour',
    body:[ el('p',{},"Les versions d'Aypona City et le journal de tout ce qui change dans la ville : constructions, démolitions, installations d'apps, agents."),
      el('div',{class:'group'},el('h3',{},'Versions'),
        el('dl',{class:'dir'},RELEASES.map(([v,t])=>el('div',{},el('dt',{},'v'+v),el('dd',{},t))))),
      el('div',{class:'group'},el('h3',{},'Journal de la ville'),
        log.length ? el('ul',{class:'log'},log.map(e=>el('li',{},el('time',{},fmtDate(e.t)),el('span',{},e.txt))))
                   : el('p',{},'Aucun changement pour l’instant. Construis quelque chose au bureau 101 ou installe une app au bureau 102.')) ],
    actions: state.log.length? [ { label:'Vider le journal', fn:()=>{ state.log=[]; save(); } } ] : [] };
}
