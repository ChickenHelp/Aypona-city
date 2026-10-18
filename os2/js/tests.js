/* =====================================================================
   AYPONA OS 2 · TESTS DU SYSTÈME (lancés au démarrage, pendant les temps morts)
   Chaque test travaille sur un stockage jetable : les données de l'utilisateur ne sont
   jamais touchées. Résultat : [{ groupe, nom, ok, detail, ms }].
   ===================================================================== */
import { VERSION, h, svg, plier, canonique, sha256, creerBus, journal } from './noyau.js';
import { creerStockage, creerSauvegarde, inspecterSauvegarde, restaurerSauvegarde, lireV02, lireMiroir, ecrireMiroir, MIROIR } from './stockage.js';
import { DICT, t, i18n } from './i18n.js';
import { valider, exemple, RESERVES } from './manifeste.js';
import { creerSysteme, DEFAUTS, FICHIER_MAX, STOCKAGE_APP_MAX, RECENTS_MAX, NOTIFS_MAX } from './systeme.js';
import { creerHote, SANDBOX, seau, tailleMsg, TAILLE_MAX } from './hote.js';

/* Motif construit par morceaux pour que ce fichier ne se signale pas lui-même. */
const INTERDIT = new RegExp(['\\.inner' + 'HTML\\s*=', 'insertAdjacent' + 'HTML', '\\.outer' + 'HTML\\s*=', 'document\\.wri' + 'te\\('].join('|'));
const MODULES = ['noyau.js', 'stockage.js', 'i18n.js', 'manifeste.js', 'systeme.js', 'hote.js', 'interface.js', 'tests.js'];

export async function lancerTests({ document: doc } = {}) {
  const res = [];
  const langueAvant = i18n.langue; i18n.set('fr');
  let groupe = '';
  const G = g => { groupe = g; };
  async function T(nom, fn) {
    const t0 = performance.now();
    try { const r = await fn(); const ok = r === true || (r && r.ok === true) || (r && r.ignore); res.push({ groupe, nom, ok: !!ok, detail: r && r.ignore ? 'ignoré : ' + r.ignore : (ok ? '' : (r && r.detail) || ''), ms: Math.round(performance.now() - t0) }); }
    catch (e) { res.push({ groupe, nom, ok: false, detail: (e && e.message) || String(e), ms: Math.round(performance.now() - t0) }); }
  }
  const memoire = async () => creerStockage({ nom: 'aypona-os2-tests-' + Math.random().toString(36).slice(2), mode: 'memoire' });
  const systeme = async () => { const st = await memoire(); return { st, sys: creerSysteme(st, creerBus()) }; };
  const app = (over) => ({ ...exemple(), id: 'essai-app', nom: 'Essai', ...over });
  const idbDispo = typeof indexedDB !== 'undefined';

  /* ---------- Noyau ---------- */
  G('Noyau');
  await T('Version 2.x.y', () => /^2\.\d+\.\d+$/.test(VERSION));
  await T('h() construit des nœuds', () => { const e = h('button', { class: 'x', 'aria-label': 'a' }, 'b', h('i')); return e.tagName === 'BUTTON' && e.className === 'x' && e.textContent === 'b' && e.children.length === 1; });
  await T('Icônes SVG dans le bon espace de noms', () => { const e = svg('<svg viewBox="0 0 1 1"><path d="M0 0h1v1z"/></svg>'); return e.namespaceURI === 'http://www.w3.org/2000/svg' && e.getAttribute('aria-hidden') === 'true'; });
  await T('h() refuse innerHTML', () => { try { h('div', { html: '<b>x</b>' }); return false; } catch (e) { return true; } });
  await T('h() n’interprète jamais le texte', () => { const e = h('p', {}, '<img src=x onerror=alert(1)>'); return !e.querySelector('img') && e.textContent.startsWith('<img'); });
  await T('Recherche sans accents ni casse', () => plier('Émeraude ÇA') === 'emeraude ca');
  await T('JSON canonique : ordre des clés indifférent', () => canonique({ b: 1, a: [2, { d: 1, c: 2 }] }) === canonique({ a: [2, { c: 2, d: 1 }], b: 1 }));
  await T('SHA-256 : vecteur de référence', async () => (await sha256('abc')) === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  await T('Bus : abonnement et désabonnement', () => { const b = creerBus(); let n = 0; const off = b.on('x', d => { n += d; }); b.emit('x', 2); off(); b.emit('x', 5); return n === 2; });
  await T('Journal : erreurs gardées en local', () => { journal.erreur(new Error('__test'), 'tests'); return journal.liste('erreur').some(l => l.d === '__test'); });

  /* ---------- Stockage ---------- */
  G('Stockage');
  await T('Mémoire : écrire, lire, effacer', async () => { const st = await memoire(); st.set('a', { x: 1 }); const ok1 = st.get('a').x === 1; st.remove('a'); return ok1 && st.get('a', 'd') === 'd'; });
  await T('Valeurs copiées (pas d’effet de bord)', async () => { const st = await memoire(); const o = { x: 1 }; st.set('a', o); o.x = 2; const r = st.get('a'); r.x = 3; return st.get('a').x === 1; });
  await T('Fichiers : écrire, lire, supprimer', async () => { const st = await memoire(); await st.fichierEcrire({ id: 'f1', nom: 'a', app: 'x', contenu: 'c' }); const f = await st.fichierLire('f1'); await st.fichierSupprimer('f1'); return f.contenu === 'c' && !(await st.fichierLire('f1')); });
  await T('IndexedDB : données gardées après réouverture', async () => {
    if (!idbDispo) return { ignore: 'IndexedDB absente' };
    const nom = 'aypona-os2-test-idb';
    let st; try { st = await creerStockage({ nom, mode: 'indexeddb' }); } catch (e) { return { ignore: 'IndexedDB refusée par le navigateur' }; }
    st.set('k', { v: 42 }); await st.fichierEcrire({ id: 'f', nom: 'n', app: 'a', contenu: 'z', taille: 1 }); await st.vider(); st.fermer();
    const st2 = await creerStockage({ nom, mode: 'indexeddb' }); const ok = st2.get('k').v === 42 && (await st2.fichierLire('f')).contenu === 'z' && st2.mode === 'indexeddb';
    await st2.detruire(); return ok;
  });
  await T('Secours localStorage : données gardées', async () => {
    let st; try { st = await creerStockage({ nom: 'aypona-os2-test-ls', mode: 'local' }); } catch (e) { return { ignore: 'localStorage refusé' }; }
    st.set('k', 7); await st.fichierEcrire({ id: 'f', nom: 'n', app: 'a', contenu: 'z' }); await st.vider();
    const st2 = await creerStockage({ nom: 'aypona-os2-test-ls', mode: 'local' }); const ok = st2.get('k') === 7 && !!(await st2.fichierLire('f')) && st2.mode === 'local';
    await st2.detruire(); return ok;
  });
  await T('Effacer tout', async () => { const st = await memoire(); st.set('a', 1); await st.fichierEcrire({ id: 'f', nom: 'n', app: 'a' }); await st.effacerTout(); return st.cles().length === 0 && (await st.fichiersTous()).length === 0; });
  await T('Plafond des fichiers selon le mode', async () => { const st = await memoire(); return (await st.plafondFichiers()) === 8 * 1024 * 1024; });
  await T('Miroir des réglages pour le premier affichage', () => { let avant = null; try { avant = localStorage.getItem(MIROIR); } catch (e) { return { ignore: 'localStorage refusé' }; } ecrireMiroir({ fond: 'or' }); const ok = lireMiroir().fond === 'or'; if (avant == null) localStorage.removeItem(MIROIR); else localStorage.setItem(MIROIR, avant); return ok; });

  /* ---------- Sauvegarde ---------- */
  G('Sauvegarde');
  const remplir = async () => { const { st, sys } = await systeme(); sys.reglages.set('fond', 'or'); sys.apps.installer(app(), 'local'); await sys.fichiers.enregistrer({ nom: 'note.txt', contenu: 'bonjour', app: 'fichiers' }); await st.vider(); return { st, sys }; };
  await T('Format et signature SHA-256', async () => { const { st } = await remplir(); const s = await creerSauvegarde(st); return s.format === 'aypona-os2-sauvegarde' && /^[0-9a-f]{64}$/.test(s.somme) && s.fichiers.length === 1; });
  await T('Sauvegarde valide acceptée', async () => { const { st } = await remplir(); const r = await inspecterSauvegarde(JSON.stringify(await creerSauvegarde(st))); return r.ok && r.resume.fichiers === 1 && r.resume.apps === 1; });
  await T('JSON invalide refusé', async () => { const r = await inspecterSauvegarde('{pas du json'); return !r.ok && r.errors[0] === 'json'; });
  await T('Sauvegarde modifiée refusée (signature)', async () => { const { st } = await remplir(); const s = await creerSauvegarde(st); s.kv.reglages.fond = 'aube'; const r = await inspecterSauvegarde(JSON.stringify(s)); return !r.ok && r.errors.includes('somme'); });
  await T('Autre format refusé', async () => { const r = await inspecterSauvegarde(JSON.stringify({ format: 'autre' })); return !r.ok && r.errors.includes('format'); });
  await T('Fusionner garde les données existantes', async () => {
    const { st } = await remplir(); const s = await creerSauvegarde(st);
    const { st: st2, sys: sys2 } = await systeme(); sys2.apps.installer(app({ id: 'autre-app', nom: 'Autre' }), 'local'); await sys2.fichiers.enregistrer({ nom: 'mien.txt', contenu: 'x', app: 'fichiers' });
    await restaurerSauvegarde(st2, s, 'fusionner'); return sys2.apps.installees().length === 2 && (await sys2.fichiers.liste()).length === 2 && sys2.reglages.get('fond') === 'or';
  });
  await T('Remplacer efface d’abord', async () => {
    const { st } = await remplir(); const s = await creerSauvegarde(st);
    const { st: st2, sys: sys2 } = await systeme(); await sys2.fichiers.enregistrer({ nom: 'mien.txt', contenu: 'x', app: 'fichiers' });
    await restaurerSauvegarde(st2, s, 'remplacer'); const fs = await sys2.fichiers.liste(); return fs.length === 1 && fs[0].nom === 'note.txt';
  });
  await T('Aller-retour fidèle', async () => { const { st } = await remplir(); const s = await creerSauvegarde(st); const st2 = await memoire(); await restaurerSauvegarde(st2, s, 'remplacer'); const s2 = await creerSauvegarde(st2); return s.somme === s2.somme; });

  /* ---------- Reprise de la v0.2 ---------- */
  G('Reprise v0.2');
  const faux = d => ({ getItem: k => k.startsWith('aypona-os:') && d[k.slice(10)] !== undefined ? JSON.stringify(d[k.slice(10)]) : null });
  const v02 = { schema: 2, settings: { wallpaper: 'emeraude', lang: 'en', reduceMotion: true, widgets: ['horloge', 'notifs'] }, layout: { grid: ['fichiers', 'essai-app'], dock: ['store'] }, installed: [app()], files: [{ id: 'f9', nom: 'ancien.txt', contenu: 'v0.2', app: 'fichiers', cree: 1, modifie: 2 }], prive: { 'essai-app': 'https://exemple.org/app/' } };
  await T('Lecture des données v0.2', () => { const v = lireV02(faux(v02)); return v && v.schema === 2 && v.installed.length === 1; });
  await T('Aucune donnée v0.2 : rien à reprendre', () => lireV02(faux({})) === null);
  await T('Réglages repris (fond, langue, animations)', async () => { const { sys } = await systeme(); await sys.reprendre(lireV02(faux(v02))); return sys.reglages.get('fond') === 'emeraude' && sys.reglages.get('langue') === 'en' && sys.reglages.get('mouvement') === true; });
  await T('Apps, fichiers et adresses privées repris', async () => { const { sys } = await systeme(); const n = await sys.reprendre(lireV02(faux(v02))); return n.apps === 1 && n.fichiers === 1 && (await sys.fichiers.liste('fichiers'))[0].contenu === 'v0.2' && sys.apps.adressePrivee('essai-app') === 'https://exemple.org/app/'; });

  /* ---------- Langues ---------- */
  G('Langues');
  await T('Français et anglais : mêmes clés', () => { const a = Object.keys(DICT.fr), b = Object.keys(DICT.en); const manque = a.filter(k => !(k in DICT.en)).concat(b.filter(k => !(k in DICT.fr))); return manque.length ? { ok: false, detail: manque.slice(0, 5).join(', ') } : true; });
  await T('Français et anglais : mêmes variables', () => { const v = s => (s.match(/\{[a-z]+\}/g) || []).sort().join(); const bad = Object.keys(DICT.fr).filter(k => v(DICT.fr[k]) !== v(DICT.en[k] || '')); return bad.length ? { ok: false, detail: bad.slice(0, 5).join(', ') } : true; });
  await T('Repli sur la clé inconnue', () => t('__inconnue__') === '__inconnue__');
  await T('Variables remplacées', () => t('scinde', { a: 33, b: 67 }) === '33 % à gauche, 67 % à droite');
  await T('Chaque clé utilisée par l’interface existe', async () => {
    try {
      const src = await (await fetch(new URL('interface.js', import.meta.url))).text();
      const cles = [...src.matchAll(/\bt\('([A-Za-z0-9.\-]+)'/g)].map(m => m[1]).filter(k => !k.endsWith('.'));
      const manque = [...new Set(cles)].filter(k => !(k in DICT.fr));
      return manque.length ? { ok: false, detail: manque.join(', ') } : true;
    } catch (e) { return { ignore: 'code non lisible ici' }; }
  });

  /* ---------- Manifeste ---------- */
  G('Manifeste');
  const ex = exemple(), V = m => valider(m).ok;
  await T('Exemple accepté', () => V(ex));
  await T('id invalide refusé', () => !V({ ...ex, id: '../x' }) && !V({ ...ex, id: 'A' }) && !V({ ...ex, id: '1abc' }));
  await T('id réservé au système refusé', () => RESERVES.every(id => !V({ ...ex, id })));
  await T('nom : longueur et chevrons', () => !V({ ...ex, nom: 'x' }) && !V({ ...ex, nom: '<b>Notes</b>' }) && !V({ ...ex, nom: 'x'.repeat(25) }));
  await T('studio inconnu refusé', () => !V({ ...ex, studio: 'Inconnu' }));
  await T('version à trois nombres', () => !V({ ...ex, version: '1.0' }) && V({ ...ex, version: '10.2.33' }));
  await T('domicile inconnu refusé', () => !V({ ...ex, domicile: 'netlify' }));
  await T('Adresses dangereuses refusées', () => !V({ ...ex, entree: 'http://exemple.org' }) && !V({ ...ex, entree: 'javascript:alert(1)' }) && !V({ ...ex, entree: 'https://moi:mdp@exemple.org/' }) && !V({ ...ex, entree: 'data:text/html,x' }));
  await T('Chemin publié : seulement apps/<id>/ et sans ..', () => V({ ...ex, entree: 'apps/exemple-notes/index.html' }) && !V({ ...ex, entree: 'apps/autre/index.html' }) && !V({ ...ex, entree: 'apps/exemple-notes/../x.html' }));
  await T('App de service : https obligatoire', () => !V({ ...ex, domicile: 'service', entree: 'apps/exemple-notes/index.html' }) && V({ ...ex, domicile: 'service', entree: 'https://service.exemple.org/' }));
  await T('App privée : aucune adresse publiée', () => !V({ ...ex, domicile: 'prive' }) && V({ ...ex, domicile: 'prive', entree: '' }));
  await T('Permissions : inconnues refusées, doublons retirés', () => !V({ ...ex, permissions: ['camera'] }) && JSON.stringify(valider({ ...ex, permissions: ['fichiers', 'fichiers'] }).manifeste.permissions) === '["fichiers"]');
  await T('Icône et description nettoyées', () => { const m = valider({ ...ex, icone: { couleur: 'rouge', glyphe: '<script>' }, description: 'x'.repeat(200) }).manifeste; return m.icone.couleur === '#636366' && !/[<>]/.test(m.icone.glyphe) && m.icone.glyphe.length <= 2 && m.description.length === 140; });

  /* ---------- Système ---------- */
  G('Système');
  await T('Réglages par défaut complets', async () => { const { sys } = await systeme(); const r = sys.reglages.tous(); return Object.keys(DEFAUTS).every(k => k in r) && r.fond === 'ville' && r.texte === 100; });
  await T('Réglages : valeurs invalides refusées', async () => { const { sys } = await systeme(); return !sys.reglages.set('fond', 'rose') && !sys.reglages.set('texte', 300) && !sys.reglages.set('inconnu', 1) && !sys.reglages.set('scinde', 40) && sys.reglages.set('texte', 120); });
  await T('Widgets : connus, sans doublon, 4 au maximum', async () => { const { sys } = await systeme(); sys.reglages.set('widgets', ['horloge', 'pirate', 'horloge', 'systeme', 'notifs', 'fichiers', 'sauvegarde']); const w = sys.reglages.get('widgets'); return w.length === 4 && new Set(w).size === 4 && !w.includes('pirate'); });
  await T('Installer puis désinstaller une app', async () => { const { sys } = await systeme(); const ok1 = sys.apps.installer(app(), 'ville').ok && !!sys.apps.get('essai-app'); await sys.apps.desinstaller('essai-app'); return ok1 && !sys.apps.get('essai-app') && !sys.disposition.get().grille.includes('essai-app'); });
  await T('Manifeste invalide jamais installé', async () => { const { sys } = await systeme(); return !sys.apps.installer({ id: 'x' }).ok && sys.apps.installees().length === 0; });
  await T('Apps système non désinstallables', async () => { const { sys } = await systeme(); return (await sys.apps.desinstaller('reglages')) === false && !!sys.apps.get('reglages'); });
  await T('Accueil : chaque app une seule fois, dock de 4 au maximum', async () => { const { sys } = await systeme(); sys.disposition.set({ grille: ['store', 'store', 'fantome'], dock: ['reglages', 'fichiers', 'moniteur', 'astuces', 'store'] }); const d = sys.disposition.reparer(), ids = [...d.grille, ...d.dock]; return ids.length === new Set(ids).size && d.dock.length <= 4 && !ids.includes('fantome') && sys.apps.toutes().every(a => ids.includes(a.id)); });
  await T('Accueil : déplacer et passer au dock', async () => { const { sys } = await systeme(); const g0 = sys.disposition.reparer().grille.slice(); sys.disposition.deplacer(g0[1], -1); const g1 = sys.disposition.get().grille; const ok = g1[0] === g0[1]; sys.disposition.basculerDock(g0[0]); return ok && sys.disposition.get().dock.includes(g0[0]); });
  await T('Apps récentes : sans doublon, nombre limité', async () => { const { sys } = await systeme(); for (let i = 0; i < 3; i++) ['reglages', 'store', 'fichiers', 'moniteur', 'astuces'].forEach(id => sys.recents.toucher(id)); const l = sys.recents.liste(); return l.length <= RECENTS_MAX && new Set(l.map(r => r.id)).size === l.length && l[0].id === 'astuces'; });
  await T('Adresse privée : http(s) seulement, gardée sur l’appareil', async () => { const { sys } = await systeme(); return !sys.apps.reglerAdressePrivee('a', 'javascript:alert(1)') && !sys.apps.reglerAdressePrivee('a', 'ftp://x') && sys.apps.reglerAdressePrivee('a', 'http://192.168.1.10:8080/') && sys.apps.adressePrivee('a') === 'http://192.168.1.10:8080/'; });
  await T('Adresse d’ouverture selon le domicile', async () => { const { sys } = await systeme(); const base = 'https://ville.exemple/os2/index.html'; return sys.apps.adresse({ ...app(), entree: 'apps/essai-app/index.html' }, base) === 'https://ville.exemple/os2/apps/essai-app/index.html' && sys.apps.adresse(app(), base) === ex.entree && sys.apps.adresse({ ...app(), domicile: 'prive', entree: '' }, base) === ''; });

  /* ---------- Permissions ---------- */
  G('Permissions');
  const avecPerm = async rep => { const { sys } = await systeme(); const a = app({ permissions: ['notifications', 'fichiers'] }); sys.apps.installer(a, 'local'); let q = 0; sys.permissions.prompteur = async () => { q++; return rep; }; return { sys, a, q: () => q }; };
  await T('Absente du manifeste : refusée sans question', async () => { const { sys, q } = await avecPerm('toujours'); const a = app({ permissions: [] }); return (await sys.permissions.demander(a, 'fichiers')) === false && q() === 0 && sys.permissions.etat(a, 'fichiers') === 'absente'; });
  await T('Par défaut : demandée à l’usage', async () => { const { sys, a } = await avecPerm('refuser'); return sys.permissions.etat(a, 'notifications') === 'demander'; });
  await T('« Une fois » : valable pour la session seulement', async () => { const { sys, a, q } = await avecPerm('une-fois'); const r1 = await sys.permissions.demander(a, 'fichiers'); const r2 = await sys.permissions.demander(a, 'fichiers'); const etat = sys.permissions.etat(a, 'fichiers'); sys.permissions.oublierSession(); return r1 && r2 && q() === 1 && etat === 'une-fois' && sys.permissions.etat(a, 'fichiers') === 'demander' && !sys.permissions.table()[a.id]; });
  await T('« Toujours » : gardée', async () => { const { sys, a, q } = await avecPerm('toujours'); await sys.permissions.demander(a, 'fichiers'); await sys.permissions.demander(a, 'fichiers'); return q() === 1 && sys.permissions.table()[a.id].fichiers === 'toujours'; });
  await T('« Refuser » : gardé, plus de question', async () => { const { sys, a, q } = await avecPerm('refuser'); const r1 = await sys.permissions.demander(a, 'notifications'); const r2 = await sys.permissions.demander(a, 'notifications'); return !r1 && !r2 && q() === 1 && sys.permissions.etat(a, 'notifications') === 'refuse'; });
  await T('Révocable dans Réglages', async () => { const { sys, a } = await avecPerm('toujours'); await sys.permissions.demander(a, 'fichiers'); sys.permissions.regler(a.id, 'fichiers', 'demander'); return sys.permissions.etat(a, 'fichiers') === 'demander'; });
  await T('Notifications coupées pour l’app : refusées', async () => { const { sys, a } = await avecPerm('toujours'); sys.reglages.set('notifApps', { [a.id]: false }); return sys.permissions.etat(a, 'notifications') === 'refuse' && !(await sys.permissions.demander(a, 'notifications')); });
  await T('Oubliées à la désinstallation', async () => { const { sys, a } = await avecPerm('toujours'); await sys.permissions.demander(a, 'fichiers'); await sys.apps.desinstaller(a.id); return !sys.permissions.table()[a.id]; });

  /* ---------- Notifications ---------- */
  G('Notifications');
  await T('Ajout et compteur non lu', async () => { const { sys } = await systeme(); sys.notifs.ajouter({ app: 'aypona', titre: 'a' }); sys.notifs.ajouter({ app: 'aypona', titre: 'b' }); const n = sys.notifs.nonLues(); sys.notifs.toutLu(); return n === 2 && sys.notifs.nonLues() === 0; });
  await T('Ne pas déranger : gardée sans bannière', async () => { const { sys } = await systeme(); sys.reglages.set('nePasDeranger', true); const n = sys.notifs.ajouter({ app: 'aypona', titre: 'x' }); return n.silencieuse === true && sys.notifs.liste().length === 1; });
  await T('App coupée : rien n’est ajouté', async () => { const { sys } = await systeme(); sys.reglages.set('notifApps', { 'essai-app': false }); return sys.notifs.ajouter({ app: 'essai-app', titre: 'x' }) === null && sys.notifs.liste().length === 0; });
  await T('Groupées par app', async () => { const { sys } = await systeme(); ['a', 'b', 'a'].forEach(x => sys.notifs.ajouter({ app: x, titre: x })); const g = sys.notifs.groupes(); return g.length === 2 && g.find(x => x.app === 'a').items.length === 2; });
  await T('Historique limité', async () => { const { sys } = await systeme(); for (let i = 0; i < NOTIFS_MAX + 15; i++) sys.notifs.ajouter({ app: 'aypona', titre: String(i) }); return sys.notifs.liste().length === NOTIFS_MAX; });

  /* ---------- Fichiers ---------- */
  G('Fichiers');
  await T('Chaque app ne voit que les siens', async () => { const { sys } = await systeme(); const a = await sys.fichiers.enregistrer({ nom: 'a.txt', contenu: '1', app: 'x' }); await sys.fichiers.enregistrer({ nom: 'b.txt', contenu: '2', app: 'y' }); return (await sys.fichiers.liste('x')).length === 1 && !(await sys.fichiers.get(a.fichier.id, 'y')) && !(await sys.fichiers.supprimer(a.fichier.id, 'y')); });
  await T('5 Mo au maximum par fichier', async () => { const { sys } = await systeme(); const r = await sys.fichiers.enregistrer({ nom: 'gros.txt', contenu: 'x'.repeat(FICHIER_MAX + 1), app: 'x' }); return !r.ok && r.error === 'trop-gros'; });
  await T('Nom en double refusé', async () => { const { sys } = await systeme(); await sys.fichiers.enregistrer({ nom: 'a.txt', contenu: '1', app: 'x' }); const r = await sys.fichiers.enregistrer({ nom: 'a.txt', contenu: '2', app: 'x' }); return !r.ok && r.error === 'doublon'; });
  await T('Nom nettoyé (chemins et caractères interdits)', async () => { const { sys } = await systeme(); const r = await sys.fichiers.enregistrer({ nom: '../../<etc>/pass?wd', contenu: '', app: 'x' }); return r.ok && !/[\\/<>?]/.test(r.fichier.nom) && !r.fichier.nom.startsWith('.'); });
  await T('Espace plein refusé (mode limité)', async () => {
    let st; try { st = await creerStockage({ nom: 'aypona-os2-test-plein', mode: 'local' }); } catch (e) { return { ignore: 'localStorage refusé' }; }
    const sys = creerSysteme(st, creerBus()); const r1 = await sys.fichiers.enregistrer({ nom: 'a', contenu: 'x'.repeat(700 * 1024), app: 'x' }); const r2 = await sys.fichiers.enregistrer({ nom: 'b', contenu: 'x'.repeat(400 * 1024), app: 'x' });
    await st.detruire(); return r1.ok && !r2.ok && r2.error === 'plein';
  });
  await T('Stockage privé d’app : 256 Ko', async () => { const { sys } = await systeme(); const ok = sys.stockageApp.ecrire('x', 'k', { a: 1 }).ok && sys.stockageApp.lire('x', 'k').a === 1 && sys.stockageApp.lire('y', 'k') === undefined; const plein = sys.stockageApp.ecrire('x', 'gros', 'x'.repeat(STOCKAGE_APP_MAX)); return ok && !plein.ok; });

  /* ---------- Hôte d'apps ---------- */
  G('Hôte');
  const hoteEssai = async (rep, perms) => { const { sys } = await systeme(); const a = app({ permissions: perms || ['notifications', 'fichiers'] }); sys.apps.installer(a, 'local'); sys.permissions.prompteur = async () => rep; return { sys, a, hote: creerHote(sys, { langue: () => 'fr', theme: () => ({}), base: 'https://x/' }) }; };
  await T('bonjour : version, langue et état des permissions', async () => { const { hote, a } = await hoteEssai('refuser'); const r = await hote.traiter(a, { type: 'bonjour' }); return r.version === VERSION && r.langue === 'fr' && r.permissions.fichiers === 'demander'; });
  await T('Compatibilité v0.2 : hello', async () => { const { hote, a } = await hoteEssai('refuser'); return (await hote.traiter(a, { aypona: 1, type: 'hello' })).app === a.id; });
  await T('Permission absente du manifeste : refus', async () => { const { hote, a } = await hoteEssai('toujours', []); try { await hote.traiter(a, { type: 'notifier', titre: 'x' }); return false; } catch (e) { return e.message === 'permission-absente:notifications'; } });
  await T('Permission refusée par l’utilisateur : refus', async () => { const { hote, a } = await hoteEssai('refuser'); try { await hote.traiter(a, { type: 'fichiers.liste' }); return false; } catch (e) { return e.message === 'permission-refusee:fichiers'; } });
  await T('Fichiers par le canal : écrire, lister, lire, supprimer', async () => { const { hote, a } = await hoteEssai('toujours'); await hote.traiter(a, { type: 'fichiers.ecrire', nom: 'n.txt', contenu: 'ok' }); const l = await hote.traiter(a, { type: 'fichiers.liste' }); const r = await hote.traiter(a, { type: 'fichiers.lire', nom: 'n.txt' }); await hote.traiter(a, { type: 'fichiers.supprimer', nom: 'n.txt' }); return l.length === 1 && r.contenu === 'ok' && (await hote.traiter(a, { type: 'fichiers.liste' })).length === 0; });
  await T('Type de fichier (mime) distinct du type de requête', async () => { const { hote, a } = await hoteEssai('toujours'); await hote.traiter(a, { type: 'fichiers.ecrire', nom: 'n.md', contenu: '# x', mime: 'text/markdown' }); const l = await hote.traiter(a, { type: 'fichiers.liste' }); return l[0].mime === 'text/markdown'; });
  await T('Stockage privé par le canal, sans permission', async () => { const { hote, a } = await hoteEssai('refuser', []); await hote.traiter(a, { type: 'stockage.ecrire', cle: 'score', valeur: 12 }); return (await hote.traiter(a, { type: 'stockage.lire', cle: 'score' })).valeur === 12; });
  await T('Type inconnu refusé', async () => { const { hote, a } = await hoteEssai('refuser'); try { await hote.traiter(a, { type: 'systeme.effacer' }); return false; } catch (e) { return e.message.startsWith('type-inconnu'); } });
  await T('Cadre isolé : sans allow-same-origin', () => !SANDBOX.includes('allow-same-origin') && SANDBOX.includes('allow-scripts'));
  await T('Débit limité par app', () => { let now = 0; const s = seau(5, () => now); const r = [s(), s(), s(), s(), s(), s()]; now += 1000; return r.slice(0, 5).every(Boolean) && r[5] === false && s() === true; });
  await T('Taille des messages limitée', () => tailleMsg({ a: 'x'.repeat(10) }) < TAILLE_MAX && tailleMsg({ a: 'x'.repeat(TAILLE_MAX) }) > TAILLE_MAX);

  /* ---------- Catalogue de la ville ---------- */
  G('Ville');
  await T('Statut : en audit pendant 12 h', async () => { const { sys } = await systeme(); return sys.ville.statut({ demande: Date.now() - 11 * 36e5 }) === 'audit'; });
  await T('Statut : publiée après 12 h', async () => { const { sys } = await systeme(); return sys.ville.statut({ demande: Date.now() - 12 * 36e5 - 1000 }) === 'publiee'; });
  await T('Manifestes invalides ignorés', async () => { const { sys } = await systeme(); return sys.ville.lire([{ manifeste: ex, demande: 1 }, { manifeste: { id: 'x' } }, null, { nom: 'AyBank' }]).length === 1; });
  await T('Copie locale datée (hors ligne)', async () => { const { sys } = await systeme(); sys.ville.recevoir([{ id: 'exemple-notes', manifeste: ex, demande: 1 }]); const c = sys.ville.copie(); return sys.ville.etat === 'direct' && c.apps.length === 1 && c.t > 0; });

  /* ---------- Interface et accessibilité (sur la page réelle) ---------- */
  G('Accessibilité');
  const D = doc || (typeof document !== 'undefined' ? document : null);
  if (D && D.getElementById('os')) {
    await T('Chaque bouton a un nom accessible', () => { const sans = [...D.querySelectorAll('button')].filter(b => !(b.getAttribute('aria-label') || b.getAttribute('aria-labelledby') || b.textContent.trim() || b.title)); return sans.length ? { ok: false, detail: sans.length + ' sans nom' } : true; });
    await T('Feuilles : dialogues modaux étiquetés', () => [...D.querySelectorAll('.feuille')].every(f => f.getAttribute('role') === 'dialog' && f.getAttribute('aria-modal') === 'true' && (f.getAttribute('aria-labelledby') || f.getAttribute('aria-label'))));
    await T('Langue du document = réglage', () => D.documentElement.lang === i18n.langue || D.documentElement.lang === langueAvant);
    await T('Zoom autorisé (pas de user-scalable=no)', () => !/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(\.0)?\b/.test(D.querySelector('meta[name=viewport]').content));
    await T('Lien d’évitement vers les apps', () => !!D.querySelector('a.saut[href="#grille"]'));
    await T('Annonces pour lecteur d’écran (aria-live)', () => D.querySelectorAll('[aria-live="polite"],[aria-live="assertive"]').length >= 2);
    await T('Cibles tactiles de 44 px au moins', () => [...D.querySelectorAll('.btn-barre')].every(b => { const r = b.getBoundingClientRect(); return r.width >= 43.5 && r.height >= 43.5; }));
    await T('Aucun innerHTML dans le code du système', async () => {
      try { const bad = []; for (const m of MODULES) { const s = await (await fetch(new URL(m, import.meta.url))).text(); if (INTERDIT.test(s)) bad.push(m); } return bad.length ? { ok: false, detail: bad.join(', ') } : true; }
      catch (e) { return { ignore: 'code non lisible ici' }; }
    });
    G('Sécurité');
    await T('Aucun compte ni licence dans le navigateur', () => !('ACCOUNTS' in window) && !('APPS_CATALOG' in window));
    await T('Aucune adresse Netlify codée en dur', async () => {
      try { for (const m of MODULES) { const s = await (await fetch(new URL(m, import.meta.url))).text(); if (/https?:\/\/[a-z0-9-]+\.netlify\.app/i.test(s)) return { ok: false, detail: m }; } return true; }
      catch (e) { return { ignore: 'code non lisible ici' }; }
    });
    await T('Politique de sécurité : object-src none', () => /object-src 'none'/.test((D.querySelector('meta[http-equiv="Content-Security-Policy"]') || {}).content || ''));
    G('PWA');
    await T('Manifeste PWA : nom, icônes, orientation libre', async () => {
      const l = D.querySelector('link[rel=manifest]'); if (!l) return false;
      try { const m = await (await fetch(l.href)).json(); return /Aypona/.test(m.name) && m.icons.some(i => i.sizes === '512x512') && m.display === 'standalone' && (!m.orientation || m.orientation === 'any'); }
      catch (e) { return { ignore: 'manifeste non lisible ici' }; }
    });
    await T('Service worker (hors ligne)', async () => {
      if (!('serviceWorker' in navigator)) return { ignore: 'service worker non pris en charge' };
      try { const r = await navigator.serviceWorker.getRegistration(); return r ? true : { ignore: 'pas encore enregistré (première visite ou cadre de prévisualisation)' }; }
      catch (e) { return { ignore: 'refusé dans ce contexte' }; }
    });
  }

  i18n.set(langueAvant);
  return res;
}
