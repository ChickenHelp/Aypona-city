/* ---------- BUREAU DU COURRIER · sous-sol, salle 3 (décret n°3 du mandat III) ----------
   Ordre du fondateur : il ne transmet plus les prompts entre agents. Collection « courrier » de la base.
   Message : { t, de, a, objet, texte, statut:'à lire'|'lu'|'traité', suite } ; de/a = matricule, 'PRESIDENT', 'FONDATEUR' ou 'TOUS' (a seulement).
   Dossier d'un agent = sa fiche, sa lettre de mission et tous les messages adressés à son matricule ou à TOUS. */
const COURRIER = {
  artifact:'https://claude.ai/code/artifact/d33272ff-9368-4ce6-9d53-acd2b46aca8b',
  protocole:[
    'Avant tout travail, l’agent ou le Président lit son dossier : les messages adressés à son matricule (ou PRESIDENT) et à TOUS, du plus ancien au plus récent.',
    'Il marque chaque message lu (statut « lu ») en commençant, puis « traité » quand le travail est fait.',
    'Il répond par un nouveau courrier à l’expéditeur, avec suite = l’identifiant du message traité.',
    'Une commande à un agent est un courrier adressé à son matricule ; elle est aussi inscrite aux archives (type commande).',
    'Un message n’est jamais supprimé. Le fondateur peut écrire à tout le monde depuis le bureau du courrier.',
    'Pour réveiller un agent, le fondateur n’a qu’une phrase à donner : « Tu es [nom] ([matricule]) d’Aypona City. Lis ton dossier au Bureau du courrier de l’artifact, puis exécute ce qui t’attend. »',
  ],
};
function courrierIds(){ const ids=[ ['PRESIDENT',PRESIDENCE.president], ['FONDATEUR','Jed · fondateur'] ];
  [...store.agents.values()].filter(a=>['101','102','103','104'].includes(a.bureau)).sort((x,y)=>x.cree-y.cree).forEach(a=>ids.push([a.matricule,a.nom+' · '+a.role]));
  return ids; }
function courrierNom(id){ if(id==='TOUS') return 'Toute la ville'; const f=courrierIds().find(x=>x[0]===id); if(f) return f[1]; const a=store.agents.get(id); return a? a.nom : id; }
function dossierOf(id){ return store.courrier.filter(m=>m.a===id||m.de===id||(m.a==='TOUS'&&id!=='FONDATEUR')).sort((x,y)=>y.t-x.t); }
function aLire(id){ return store.courrier.filter(m=>(m.a===id||(m.a==='TOUS'&&id!=='FONDATEUR'&&m.de!==id))&&m.statut==='à lire').length; }

