/* ---------- TRANSITION GITHUB & CLAUDE CODE · bureau 104 (décret n°3 du mandat IV) ----------
   Recommandations du Président IV. Antarès les exécute dans l'ordre ; le fondateur peut en changer. */
const TRANSITION = {
  agent:'AYP-104-2610-0015',
  depot:{ nom:'ChickenHelp/Aypona-city', branche:'main', visibilite:'public', statut:'créé par le fondateur ; étapes 1 et 2 validées (décret n°4 du mandat IV), étape 3 autorisée' },
  etapes:[
    { n:1, titre:'Dépôt et import tel quel', texte:'Le fondateur crée le dépôt et connecte GitHub. Antarès y importe la version en ligne sans rien modifier (page de la ville, os/index.html et fichiers publiés), en un commit initial marqué du numéro de version en ligne.' },
    { n:2, titre:'CLAUDE.md et agents', texte:'Un CLAUDE.md à la racine reprend le protocole du courrier, les zones de chacun et les règles des objets PRESIDENCE, ATELIER, CONSEIL et COURRIER. Un fichier par agent dans .claude/agents (président, Altaïr, Polaris, Capella, Antarès, Rigel, Deneb, Mira, Electra) reprend sa lettre de mission : le fondateur n’a plus qu’à ouvrir Claude Code dans le dépôt.' },
    { n:3, titre:'Découpage par zones', texte:'Le fichier unique de la ville est découpé en modules, un dossier par zone : données de la Présidence et du conseil, rendu de l’Atelier 101, App Store du bureau 102, agents du bureau 103. Un build Vite reproduit une page unique, sans aucune différence visible (captures avant et après au format téléphone).' },
    { n:4, titre:'Branches et tests automatiques', texte:'Une branche par livraison, fusion par demande de fusion. GitHub Actions vérifie le build, les tests du noyau d’Aypona OS et un test de la ville au format téléphone (390 × 780) sans erreur dans la console. RELEASES et le CHANGELOG suivent les versions du dépôt.' },
    { n:5, titre:'Publication et bascule', texte:'La ville publiée est construite depuis le dépôt : l’artifact garde son adresse et sa base, GitHub Pages sert la version publique d’Aypona OS (v0.3). Bascule décrétée par le Président quand les étapes 1 à 4 passent.' },
  ],
  recommandations:[
    'Importer d’abord, améliorer ensuite : aucun découpage ni nettoyage avant que la version en ligne soit à l’identique dans le dépôt.',
    'La base de l’artifact (agents, courrier, archives, apps) reste la source vivante. Le dépôt étant public, elle n’y est jamais exportée (décret n°4 du mandat IV).',
    'Jusqu’à la bascule, tout agent qui publie dans l’artifact importe aussi la version en ligne dans le dépôt ; à défaut, Antarès le fait à chaque réveil.',
    'Le découpage (étape 3) se fait sur une branche et ne fusionne qu’après la v0.2 de Polaris et un import de la version en ligne, pour ne jamais écraser une livraison.',
    'Le courrier reste dans la base ; son passage éventuel en issues GitHub sera un décret à part, après la bascule.',
    'Les zones de chaque agent deviennent des dossiers : chacun ne modifie que le sien, ce qui met fin aux conflits de publication.',
    'Aucun secret dans le dépôt (clés d’API, jetons) : variables d’environnement ou secrets GitHub seulement.',
    'Garder Three.js r128, les commandes manette, clavier et tactile, et l’esthétique de nuit en verre dépoli pendant toute la transition.',
    'Ne pas bloquer la v0.2 de Polaris : elle est livrée dans l’artifact avant le 22 oct., puis importée dans le dépôt.',
  ],
};

