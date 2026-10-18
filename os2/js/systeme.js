/* =====================================================================
   AYPONA OS 2 · SYSTÈME
   Réglages, apps, permissions à l'usage, notifications, fichiers, récents, disposition,
   catalogue de la ville (lecture seule) et reprise de la v0.2.
   Tout est construit sur un stockage (stockage.js) passé en paramètre : les tests créent
   un système jetable en mémoire, sans toucher aux données de l'utilisateur.
   ===================================================================== */
import { uid, journal } from './noyau.js';
import { valider } from './manifeste.js';

export const FONDS = ['ville', 'aube', 'spatial', 'emeraude', 'or'];
export const WIDGETS = ['horloge', 'systeme', 'sauvegarde', 'notifs', 'fichiers'];
export const LANGUES = ['fr', 'en'];
export const DEFAUTS = Object.freeze({
  fond: 'ville', langue: 'fr', texte: 100, contraste: false, mouvement: false, transparence: false,
  widgets: ['horloge', 'systeme', 'sauvegarde', 'notifs'], nePasDeranger: false, notifApps: {}, dev: false, scinde: 50,
});
export const APPS_SYSTEME = ['reglages', 'store', 'fichiers', 'moniteur', 'astuces'];
export const DISPOSITION = Object.freeze({ grille: ['fichiers', 'moniteur', 'astuces'], dock: ['store', 'reglages'] });
export const FICHIER_MAX = 5 * 1024 * 1024;
export const STOCKAGE_APP_MAX = 256 * 1024;
export const RECENTS_MAX = 8;
export const NOTIFS_MAX = 100;
export const AUDIT_H = 12;

export function creerSysteme(st, bus) {
  const emit = (ev, d) => bus && bus.emit(ev, d);

  /* ---------- Réglages ---------- */
  const valideur = {
    fond: v => FONDS.includes(v), langue: v => LANGUES.includes(v),
    texte: v => Number.isFinite(v) && v >= 85 && v <= 150,
    contraste: v => typeof v === 'boolean', mouvement: v => typeof v === 'boolean', transparence: v => typeof v === 'boolean',
    nePasDeranger: v => typeof v === 'boolean', dev: v => typeof v === 'boolean',
    widgets: v => Array.isArray(v), notifApps: v => v && typeof v === 'object' && !Array.isArray(v),
    scinde: v => [33, 50, 67].includes(v),
  };
  const reglages = {
    tous: () => ({ ...DEFAUTS, ...(st.get('reglages', {}) || {}) }),
    get: k => reglages.tous()[k],
    set(k, v) {
      if (!(k in DEFAUTS) || !valideur[k](v)) return false;
      if (k === 'widgets') v = v.filter((w, i) => WIDGETS.includes(w) && v.indexOf(w) === i).slice(0, 4);
      const cur = st.get('reglages', {}) || {}; cur[k] = v; st.set('reglages', cur);
      emit('reglage', { k, v }); return true;
    },
  };

  /* ---------- Apps ---------- */
  const apps = {
    installees: () => (st.get('installees', []) || []).filter(m => valider(m).ok),
    get(id) {
      if (APPS_SYSTEME.includes(id)) return { id, systeme: true };
      const m = apps.installees().find(x => x.id === id);
      return m ? { ...m, systeme: false } : (apps.essai && apps.essai.id === id ? { ...apps.essai, systeme: false, essai: true } : null);
    },
    toutes: () => [...APPS_SYSTEME.map(id => ({ id, systeme: true })), ...apps.installees().map(m => ({ ...m, systeme: false }))],
    installer(m, source) {
      const v = valider(m); if (!v.ok) return v;
      const list = (st.get('installees', []) || []).filter(x => x.id !== v.manifeste.id);
      list.push({ ...v.manifeste, source: ['ville', 'local', 'reprise'].includes(source) ? source : 'local', installe: Date.now() });
      st.set('installees', list); disposition.ajouter(v.manifeste.id);
      emit('apps', { installe: v.manifeste.id }); return v;
    },
    async desinstaller(id) {
      if (APPS_SYSTEME.includes(id)) return false;
      st.set('installees', (st.get('installees', []) || []).filter(x => x.id !== id));
      const p = st.get('prive', {}) || {}; delete p[id]; st.set('prive', p);
      permissions.oublier(id); recents.retirer(id); disposition.retirer(id);
      const sa = st.get('stockageApps', {}) || {}; delete sa[id]; st.set('stockageApps', sa);
      for (const f of await fichiers.liste(id)) await fichiers.supprimer(f.id, id);
      emit('apps', { desinstalle: id }); return true;
    },
    adressePrivee: id => (st.get('prive', {}) || {})[id] || '',
    reglerAdressePrivee(id, url) {
      let ok = false; try { const u = new URL(url); ok = /^https?:$/.test(u.protocol) && !u.username && !u.password; } catch (e) {}
      if (!ok) return false;
      const p = st.get('prive', {}) || {}; p[id] = url; st.set('prive', p); emit('apps', { prive: id }); return true;
    },
    /* Adresse d'ouverture : https, chemin publié avec le système, ou adresse privée réglée sur l'appareil. */
    adresse(a, base) {
      if (!a || a.systeme) return '';
      if (a.essai) return new URL(a.entree, base).href;
      if (a.domicile === 'prive') return apps.adressePrivee(a.id);
      if (/^apps\//.test(a.entree)) return new URL(a.entree, base).href;
      return a.entree;
    },
    essai: null, /* app d'essai du kit (mode développeur), jamais enregistrée */
  };

  /* ---------- Permissions demandées à l'usage ----------
     État par app et par permission : 'demander' (défaut), 'toujours', 'refuse'.
     « Une fois » vaut pour la session (mémoire seulement). Une permission absente du manifeste
     est refusée sans question. */
  const session = new Map();
  const permissions = {
    prompteur: null, /* async (app, perm) => 'une-fois' | 'toujours' | 'refuser' (fourni par l'interface) */
    table: () => st.get('permissions', {}) || {},
    etat(app, perm) {
      if (!app || !(app.permissions || []).includes(perm)) return 'absente';
      if (perm === 'notifications' && (reglages.get('notifApps') || {})[app.id] === false) return 'refuse';
      const s = (permissions.table()[app.id] || {})[perm];
      if (s === 'toujours' || s === 'refuse') return s;
      return session.get(app.id + ':' + perm) ? 'une-fois' : 'demander';
    },
    accordee: (app, perm) => ['toujours', 'une-fois'].includes(permissions.etat(app, perm)),
    async demander(app, perm) {
      const e = permissions.etat(app, perm);
      if (e === 'absente' || e === 'refuse') return false;
      if (e === 'toujours' || e === 'une-fois') return true;
      if (!permissions.prompteur) return false;
      const rep = await permissions.prompteur(app, perm);
      if (rep === 'une-fois') session.set(app.id + ':' + perm, true);
      else if (rep === 'toujours' || rep === 'refuser') permissions.regler(app.id, perm, rep === 'toujours' ? 'toujours' : 'refuse');
      journal.ajouter('permission', app.id + ':' + perm, rep);
      return rep === 'une-fois' || rep === 'toujours';
    },
    regler(id, perm, val) {
      const tb = permissions.table(); tb[id] = tb[id] || {};
      if (val === 'demander') { delete tb[id][perm]; session.delete(id + ':' + perm); }
      else tb[id][perm] = val;
      if (perm === 'notifications' && val !== 'refuse') { const na = reglages.get('notifApps') || {}; if (na[id] === false) { delete na[id]; reglages.set('notifApps', na); } }
      st.set('permissions', tb); emit('permissions', { id, perm, val });
    },
    oublier(id) { const tb = permissions.table(); delete tb[id]; st.set('permissions', tb); for (const k of [...session.keys()]) if (k.startsWith(id + ':')) session.delete(k); },
    oublierSession: () => session.clear(),
  };

  /* ---------- Notifications ---------- */
  const notifs = {
    liste: () => st.get('notifs', []) || [],
    autorisee: app => app === 'aypona' || (reglages.get('notifApps') || {})[app] !== false,
    ajouter(n) {
      const app = n.app || 'aypona'; if (!notifs.autorisee(app)) return null;
      const item = { id: uid('n'), t: Date.now(), app, titre: String(n.titre || '').slice(0, 60), texte: String(n.texte || '').slice(0, 240), lue: false };
      st.set('notifs', [item, ...notifs.liste()].slice(0, NOTIFS_MAX));
      const silencieuse = !!reglages.get('nePasDeranger');
      emit('notif', { ...item, silencieuse }); return { ...item, silencieuse };
    },
    groupes() {
      const g = new Map();
      for (const n of notifs.liste()) { if (!g.has(n.app)) g.set(n.app, []); g.get(n.app).push(n); }
      return [...g].map(([app, items]) => ({ app, items, nonLues: items.filter(i => !i.lue).length }));
    },
    nonLues: () => notifs.liste().filter(n => !n.lue).length,
    toutLu() { st.set('notifs', notifs.liste().map(n => ({ ...n, lue: true }))); emit('notif:lues'); },
    retirer(id) { st.set('notifs', notifs.liste().filter(n => n.id !== id)); emit('notif:retrait', id); },
    retirerApp(app) { st.set('notifs', notifs.liste().filter(n => n.app !== app)); emit('notif:retrait', app); },
    vider() { st.set('notifs', []); emit('notif:retrait'); },
  };

  /* ---------- Fichiers (chaque app ne voit que les siens) ---------- */
  const nomPropre = n => String(n || '').trim().replace(/[\\/<>:"|?*\u0000-\u001f]/g, '').replace(/^\.+/, '').slice(0, 80);
  const fichiers = {
    nomPropre,
    async liste(app) { return (await st.fichiersTous()).filter(f => !app || f.app === app).sort((a, b) => b.modifie - a.modifie); },
    async get(id, app) { const f = await st.fichierLire(id); return f && (!app || f.app === app) ? f : null; },
    async trouver(nom, app) { return (await st.fichiersTous()).find(f => f.nom === nom && f.app === app) || null; },
    async usage() { return (await st.fichiersTous()).reduce((s, f) => s + (f.taille || 0), 0); },
    async enregistrer({ id, nom, contenu, type, app }) {
      nom = nomPropre(nom); app = app || 'fichiers';
      contenu = contenu == null ? '' : String(contenu);
      type = typeof type === 'string' && /^[a-z]+\/[a-z0-9.+-]+$/i.test(type) ? type : 'text/plain';
      if (!nom) return { ok: false, error: 'nom' };
      const t8 = new Blob([contenu]).size;
      if (t8 > FICHIER_MAX) return { ok: false, error: 'trop-gros' };
      const tous = await st.fichiersTous();
      const cur = id ? tous.find(f => f.id === id && f.app === app) : null;
      if (id && !cur) return { ok: false, error: 'introuvable' };
      if (tous.some(f => f.nom === nom && f.app === app && (!cur || f.id !== cur.id))) return { ok: false, error: 'doublon' };
      const total = tous.reduce((s, f) => s + (f.taille || 0), 0) - (cur ? cur.taille || 0 : 0) + t8;
      if (total > await st.plafondFichiers()) return { ok: false, error: 'plein' };
      const f = { ...(cur || { id: uid('f'), cree: Date.now(), app }), nom, contenu, type, taille: t8, modifie: Date.now() };
      await st.fichierEcrire(f); emit('fichiers', { id: f.id }); return { ok: true, fichier: f };
    },
    async supprimer(id, app) {
      const f = await st.fichierLire(id); if (!f || (app && f.app !== app)) return false;
      await st.fichierSupprimer(id); emit('fichiers', { retire: id }); return true;
    },
  };

  /* ---------- Stockage privé des apps (clé → valeur, sans permission, 256 Ko par app) ---------- */
  const stockageApp = {
    lire(id, cle) { return ((st.get('stockageApps', {}) || {})[id] || {})[cle]; },
    ecrire(id, cle, val) {
      cle = String(cle || '').slice(0, 64); if (!cle) return { ok: false, error: 'cle' };
      const tout = st.get('stockageApps', {}) || {}; const zone = { ...(tout[id] || {}) };
      if (val === undefined) delete zone[cle]; else zone[cle] = val;
      if (JSON.stringify(zone).length > STOCKAGE_APP_MAX) return { ok: false, error: 'plein' };
      tout[id] = zone; st.set('stockageApps', tout); return { ok: true };
    },
  };

  /* ---------- Apps récentes et disposition ---------- */
  const recents = {
    liste: () => (st.get('recents', []) || []).filter(r => apps.get(r.id)),
    toucher(id) { const l = (st.get('recents', []) || []).filter(r => r.id !== id); l.unshift({ id, t: Date.now() }); st.set('recents', l.slice(0, RECENTS_MAX)); },
    retirer(id) { st.set('recents', (st.get('recents', []) || []).filter(r => r.id !== id)); },
    vider() { st.set('recents', []); },
  };
  const disposition = {
    get() { const d = st.get('disposition', null); return d && Array.isArray(d.grille) && Array.isArray(d.dock) ? d : { grille: DISPOSITION.grille.slice(), dock: DISPOSITION.dock.slice() }; },
    set(d) { st.set('disposition', d); emit('disposition', d); },
    ajouter(id) { const d = disposition.get(); if (!d.grille.includes(id) && !d.dock.includes(id)) d.grille.push(id); disposition.set(d); },
    retirer(id) { const d = disposition.get(); d.grille = d.grille.filter(x => x !== id); d.dock = d.dock.filter(x => x !== id); disposition.set(d); },
    /* Chaque app connue placée une seule fois, dock de 4 au maximum. */
    reparer() {
      const connues = new Set(apps.toutes().map(a => a.id)), vu = new Set(), d = disposition.get();
      const net = (l, max) => { const r = []; for (const id of l) { if (r.length >= max) break; if (connues.has(id) && !vu.has(id)) { vu.add(id); r.push(id); } } return r; };
      const out = { dock: net(d.dock, 4), grille: [] };
      out.grille = net(d.grille, Infinity);
      connues.forEach(id => { if (!vu.has(id)) { vu.add(id); out.grille.push(id); } });
      return out;
    },
    deplacer(id, delta) {
      const d = disposition.reparer(); const zone = d.grille.includes(id) ? 'grille' : 'dock';
      const l = d[zone], i = l.indexOf(id), j = i + delta; if (i < 0 || j < 0 || j >= l.length) return false;
      [l[i], l[j]] = [l[j], l[i]]; disposition.set(d); return true;
    },
    basculerDock(id) {
      const d = disposition.reparer();
      if (d.dock.includes(id)) { d.dock = d.dock.filter(x => x !== id); d.grille.push(id); }
      else { if (d.dock.length >= 4) return false; d.grille = d.grille.filter(x => x !== id); d.dock.push(id); }
      disposition.set(d); return true;
    },
  };

  /* ---------- Catalogue de la ville (lecture seule, copie locale datée) ---------- */
  const ville = {
    etat: 'hors-ville', /* 'direct' | 'copie' | 'hors-ville' */
    statut: a => Date.now() >= (a.demande || 0) + AUDIT_H * 36e5 ? 'publiee' : 'audit',
    lire(raw) {
      return (raw || []).filter(a => a && a.manifeste && valider(a.manifeste).ok)
        .map(a => ({ id: a.id || a.manifeste.id, manifeste: valider(a.manifeste).manifeste, demande: +a.demande || 0 }));
    },
    copie: () => st.get('catalogue', null),
    apps() { const c = ville.copie(); return c ? c.apps : []; },
    recevoir(raw) { const appsV = ville.lire(raw); st.set('catalogue', { t: Date.now(), apps: appsV }); ville.etat = 'direct'; emit('ville', ville.etat); return appsV; },
    async connecter() {
      if (ville.copie()) ville.etat = 'copie';
      try {
        if (typeof window === 'undefined' || !window.claude || typeof window.claude.use !== 'function') { emit('ville', ville.etat); return ville.etat; }
        const db = await window.claude.use('db'); if (!db) { emit('ville', ville.etat); return ville.etat; }
        db.collection('apps').onSnapshot(snap => ville.recevoir(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => emit('ville', ville.etat));
      } catch (e) { journal.erreur(e, 'ville'); emit('ville', ville.etat); }
      return ville.etat;
    },
  };

  /* ---------- Reprise de la v0.2 ---------- */
  function reprendreV02(v) {
    if (!v) return null;
    const s = v.settings || {}, n = { apps: 0, fichiers: 0, reglages: 0 };
    const map = { wallpaper: 'fond', lang: 'langue', reduceMotion: 'mouvement', widgets: 'widgets', notifApps: 'notifApps' };
    for (const [a, b] of Object.entries(map)) { if (s[a] === undefined) continue; const val = b === 'widgets' ? (Array.isArray(s[a]) ? s[a].filter(w => WIDGETS.includes(w)) : null) : s[a]; if (val != null && reglages.set(b, val)) n.reglages++; }
    for (const m of v.installed || []) if (apps.installer(m, 'reprise').ok) n.apps++;
    const prive = v.prive || {}; for (const id in prive) apps.reglerAdressePrivee(id, prive[id]);
    if (v.layout && Array.isArray(v.layout.grid)) disposition.set({ grille: v.layout.grid.slice(), dock: Array.isArray(v.layout.dock) ? v.layout.dock.slice() : [] });
    const files = (v.files || []).map(f => ({ id: String(f.id || uid('f')), nom: nomPropre(f.nom) || 'sans-nom.txt', contenu: String(f.contenu || ''), type: 'text/plain', app: String(f.app || 'fichiers'), cree: +f.cree || Date.now(), modifie: +f.modifie || Date.now(), taille: new Blob([String(f.contenu || '')]).size }));
    return { n, files };
  }
  async function reprendre(v) {
    const r = reprendreV02(v); if (!r) return null;
    for (const f of r.files) { await st.fichierEcrire(f); r.n.fichiers++; }
    st.set('meta.reprise', { t: Date.now(), ...r.n });
    await st.vider(); emit('reprise', r.n); return r.n;
  }

  return { st, reglages, apps, permissions, notifs, fichiers, stockageApp, recents, disposition, ville, reprendre };
}
