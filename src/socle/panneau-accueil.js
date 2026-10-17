function panelReception(){
  return { eyebrow:'Accueil · rez-de-chaussée', title:"Bienvenue au siège d'Aypona City",
    body:[ el('p',{},"Restructuration en cours : la ville a été vidée, seul le siège reste debout, et toutes les apps d'Aypona OS sont désactivées. Nos trois architectes préparent le nouvel Aypona OS au 1er étage."),
      el('dl',{class:'dir'}, OFFICES.map(o=>el('div',{},el('dt',{},o.no),el('dd',{},o.role),el('dd',{},'Il '+o.short+'.')))),
      el('p',{},"Au sous-sol : les archives des agents et des applications, la salle des mises à jour et le Bureau du courrier. Au 2e étage : la Présidence du siège. L'ascenseur est au fond à droite.") ],
    actions:[ { label:'Monter au 1er étage', primary:true, fn:()=>{ closePanel(); goFloor(1); } }, { label:'Monter à la Présidence', fn:()=>{ closePanel(); goFloor(2); } }, { label:'Descendre au sous-sol', fn:()=>{ closePanel(); goFloor(-1); } } ] };
}

