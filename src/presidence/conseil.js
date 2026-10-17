/* ---------- CONSEIL DES ARCHITECTES · bureaux 102 et 103 (décret n°2 du mandat III) ----------
   Comme l'Atelier 101, chaque architecte vit dans sa propre conversation et le fondateur transfère les prompts.
   Fiches : collection agents, bureau:'102' ou '103'. Zone protégée, ne change que par décret du Président. */
const CONSEIL = {
  '104':{ architecte:'AYP-104-2610-0015', titre:'Chargé de la transition GitHub & Claude Code',
    mission:"Faire du dépôt GitHub la source du code d'Aypona City et d'Aypona OS, et faire travailler chaque agent dans Claude Code, sans casser la ville en ligne ni sa base (décret n°3 du mandat IV, plan dans l'objet TRANSITION).",
    regles:[ 'Une seule artifact : celle d’Aypona City. Lire la version en ligne avant chaque publication, fusionner, ne jamais écraser.',
      'Zone du bureau 104 : le dépôt GitHub (structure, CLAUDE.md, .claude/agents, CI, publication), jamais le contenu des zones des autres agents sans leur accord par courrier.',
      'Aucun changement visible dans la ville pendant l’import et le découpage : même rendu, mêmes commandes, mêmes données.',
      'Aucun secret (clés, jetons) dans le dépôt.',
      'Chaque étape : une ligne RELEASES commençant par « Bureau 104 », une entrée aux archives de type livraison.',
      'Avant tout travail : lire son dossier au Bureau du courrier, marquer lu, puis traité avec sa réponse en courrier. Rapports au PRESIDENT par courrier.' ] },
  '102':{ architecte:'AYP-102-2610-0013', titre:"Architecte d'Aypona OS",
    mission:"Construire le système Aypona OS (noyau, interface, socle), d'abord dans la ville (os/) puis sur GitHub, et un App Store qui publie des apps nouvelles décrites par un manifeste, chaque tour d'app ouvrant sa vraie app et affichant son domicile (décret n°2 du mandat IV).",
    regles:[ 'Une seule artifact : celle d’Aypona City. Lire la version en ligne avant chaque publication, fusionner, ne jamais écraser.',
      'Zone du bureau 102 : App Store, liste des apps (APPS), statut et panneaux des apps, panneau du bureau 102.',
      'La règle de réouverture (App Store et Sécurité terminés, une app à la fois, 12 h d’audit) ne change que par décret du Président.',
      'Pas de rendu graphique : il appartient à l’Atelier 101.',
      'Chaque livraison : une ligne dans RELEASES commençant par « Bureau 102 », une entrée aux archives de type livraison.',
      'Avant tout travail : lire son dossier au Bureau du courrier, marquer lu, puis traité avec sa réponse en courrier. Rapports au PRESIDENT par courrier.' ] },
  '103':{ architecte:'AYP-103-2610-0014', titre:'Manager des agents',
    mission:"Faire tourner les équipes de la ville : relève des 12 missions avant le 16 nov., renforts des chantiers App Store et Sécurité, registre des agents à jour.",
    regles:[ 'Une seule artifact : celle d’Aypona City. Lire la version en ligne avant chaque publication, fusionner, ne jamais écraser.',
      'Zone du bureau 103 : nomination, prolongation et révocation des agents par la collection agents, panneau du bureau 103.',
      'Les matricules (AYP-[bureau]-[AAMM]-[numéro]) et le calcul des chantiers (bureauPts) ne changent que par décret. Une fiche n’est jamais supprimée.',
      'Pas de rendu graphique : il appartient à l’Atelier 101.',
      'Chaque nomination ou prolongation : une entrée aux archives (creation ou prolongation) avec le matricule.',
      'Avant tout travail : lire son dossier au Bureau du courrier, marquer lu, puis traité avec sa réponse en courrier. Rapports au PRESIDENT par courrier.' ] },
};
function conseilHead(no){ const c=CONSEIL[no], a=c&&store.agents.get(c.architecte); if(!c) return null;
  return el('dl',{class:'dir'},el('div',{},el('dt',{},a?a.nom:'à nommer'),el('dd',{},c.titre+(a?' · '+a.matricule:'')),el('dd',{},'Mission : '+c.mission+(a?' · '+(agentStatus(a)==='actif'?'en mission jusqu’au '+fmtDay(a.expire):agentStatus(a)):'')))); }

