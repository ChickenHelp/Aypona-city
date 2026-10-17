/* ---------- ATELIER 101 · Architecte de la Ville (décret n°3 du mandat II) ----------
   L'architecte vit dans sa propre conversation. Il dirige une équipe d'agents par spécialité, chacun dans
   sa conversation, et le fondateur transfère les prompts. Fiches : collection agents, bureau:'101'. */
const ATELIER = {
  bureau:'101', architecte:'AYP-101-2610-0008',
  mission:"Améliorer l'application graphique d'Aypona City : rendu 3D, lumière, bâtiments, personnages, interface et confort sur mobile, sans casser les commandes ni les données.",
  specialites:[
    { key:'lumiere',  nom:'Lumière & ambiance',      texte:'Ciel, éclairage, néons, brouillard, reflets de la ville de nuit.' },
    { key:'batiments',nom:'Bâtiments & siège',       texte:'Silhouettes des bureaux, des apps et du siège, détails de façade.' },
    { key:'persos',   nom:'Personnages & animation', texte:'Joueur, Président, architectes, agents en orbite, animations.' },
    { key:'hud',      nom:'Interface & panneaux',    texte:'HUD en verre dépoli, panneaux, minimap, lisibilité.' },
    { key:'perf',     nom:'Performance mobile',      texte:'Fluidité sur téléphone, poids du code, nombre de draw calls.' },
  ],
  regles:[
    'Une seule artifact : celle d’Aypona City. Lire la version en ligne avant chaque publication, fusionner en cas de conflit, ne jamais écraser.',
    'Zone de l’atelier : CSS, Three.js, sol et routes, personnages, quartiers et lots, le siège en 3D, minimap, boucle de rendu.',
    'Hors zone, sans décret du Président : PRESIDENCE, ATELIER, règles des agents, calcul des chantiers, App Store.',
    'Garder trois.js r128 depuis cdnjs, les commandes manette, clavier et tactile, et l’esthétique nuit, verre dépoli, 5 couleurs de studio.',
    'Chaque livraison : une ligne dans RELEASES commençant par « Atelier 101 », une entrée aux archives de type livraison.',
    'Chaque commande à un agent : un courrier au Bureau du courrier adressé à son matricule (le fondateur ne transmet plus les prompts), et une entrée aux archives de type commande.',
    'Avant tout travail : lire son dossier au Bureau du courrier (messages adressés à son matricule ou à TOUS), marquer lu, puis traité avec sa réponse en courrier.',
  ],
};

