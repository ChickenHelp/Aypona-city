/* ---------- Restructuration : bureaux de construction & agents ----------
   Données partagées dans la base de l'artifact (collections « bureaux », « agents », « archives »).
   Hors claude.ai (aperçu local), repli sur le stockage du navigateur. */
const CHANTIERS = [
  { key:'noyau',     nom:'Noyau AyLibre',  mission:'Construit la base du nouveau système : démarrage, fichiers, réglages.', hex:0x7cc8ff, css:'#7cc8ff' },
  { key:'interface', nom:'Interface',      mission:"Dessine l'écran d'accueil, les fenêtres et le style du nouvel Aypona OS.", hex:0xff8a65, css:'#ff8a65' },
  { key:'store',     nom:'App Store',      mission:'Prépare le magasin qui réinstallera les apps une par une.', hex:0x4fe0a8, css:'#4fe0a8' },
  { key:'securite',  nom:'Sécurité',       mission:'Comptes, accès, sauvegardes : rien ne rouvre sans son feu vert.', hex:0xe5534b, css:'#e5534b' },
  { key:'ia',        nom:'IA & Agents',    mission:"Branche l'intelligence artificielle au cœur du système.", hex:0xb392ff, css:'#b392ff' },
  { key:'donnees',   nom:'Données & Cloud',mission:'Stockage, synchronisation et hébergement hors Netlify.', hex:0xffc857, css:'#ffc857' },
];
const ROLES = ['Chef de chantier','Développeur','Designer','Testeur','Sécurité','Intégrateur IA'];
const DUREES = [ [1,'1 jour'], [7,'7 jours'], [30,'30 jours'], [90,'90 jours'], [365,'1 an'] ];
const NOMS = ['Atlas','Nova','Iris','Vega','Orion','Lyra','Sirius','Altaïr','Rigel','Mira','Deneb','Talos','Electra','Pollux','Juno','Cassio'];
const DAY = 864e5;
const chantier = k => CHANTIERS.find(c=>c.key===k) || CHANTIERS[0];
const dureeLabel = d => (DUREES.find(x=>x[0]===d)||[d,d+' jours'])[1];

