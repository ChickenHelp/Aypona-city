/* ---------- Données Aypona OS ---------- */
const STUDIOS = [
  { name:'Devea',      hex:0xff8a65, css:'#ff8a65' },
  { name:'Nativus',    hex:0x4fe0a8, css:'#4fe0a8' },
  { name:'BroNet',     hex:0x5cb4ff, css:'#5cb4ff' },
  { name:'8Pool',      hex:0xffc857, css:'#ffc857' },
  { name:'Neural Pro', hex:0xb392ff, css:'#b392ff' },
];
const APPS = ['AyNetwork','AyBudget','AyCV','AyMatch','AyCat','AyShield','AyMeditate','AyWardrobe','AyKeys','AyPermis','AyMenu','AyDIY','AyRappel','AySummary','AyArt','AyPress','AyFood','AyLaw','AyHealth','AyClimate','AyDigest','AyRadio','AyGps','AyCam','AyFly','AySign','AyInvoice','AyBank','AyPoker','AypFlix','Voyago','DuoPanier','VAULT.OPS','CLUTCH','Burner'];
const AGENTS = [
  ['GLaDOS','Teste la solidité des nouveaux bâtiments'],
  ['SKYNET','Surveille le réseau routier'],
  ['MCP','Relie les apps entre elles'],
  ['Jarvis','Guide les visiteurs du siège'],
  ['KITT','Patrouille sur les grands axes'],
  ['Cerebro','Cartographie les quartiers'],
  ['C-3PO','Traduit les panneaux de la ville'],
  ['Matrix OS','Simule le trafic aux heures de pointe'],
  ['Metal Cooler Core','Refroidit les serveurs du quartier BroNet'],
];
const OFFICES = [
  { no:'101', role:'Architecte de la Ville', short:'construit la ville', hex:0xffc857, css:'#ffc857', open:()=>openPanel(panelCity) },
  { no:'102', role:"Architecte d'Aypona OS", short:"construit le système Aypona OS", hex:0x5cb4ff, css:'#5cb4ff', open:()=>openPanel(panelOS) },
  { no:'103', role:'Manager des agents', short:'manage les agents IA', hex:0xb392ff, css:'#b392ff', open:()=>openPanel(panelAgents) },
];

