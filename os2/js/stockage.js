/* =====================================================================
   AYPONA OS 2 · STOCKAGE DURABLE
   - IndexedDB d'abord (gros volumes, stockage persistant demandé) ;
   - sinon localStorage (petit, signalé) ;
   - sinon mémoire (rien n'est gardé, signalé en rouge).
   Les petites données (réglages, apps, permissions…) sont gardées en cache mémoire et lues
   sans attendre ; chaque écriture part en tâche de fond. Un miroir des réglages dans
   localStorage permet le premier affichage avant l'ouverture d'IndexedDB.
   Sauvegarde : fichier .aypona (JSON) signé SHA-256, export et import, fusion ou remplacement.
   ===================================================================== */
import { VERSION, SCHEMA, sha256, canonique, journal } from './noyau.js';

export const FORMAT = 'aypona-os2-sauvegarde';
export const MIROIR = 'aypona-os2:miroir';
const LS_PREFIX = 'aypona-os2:';

function idbOuvrir(nom) {
  return new Promise((res, rej) => {
    let req;
    try { req = indexedDB.open(nom, 1); } catch (e) { rej(e); return; }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('fichiers')) db.createObjectStore('fichiers', { keyPath: 'id' });
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
    req.onblocked = () => rej(new Error('IndexedDB bloquée'));
    setTimeout(() => rej(new Error('IndexedDB : délai dépassé')), 4000);
  });
}
const tx = (db, store, mode, fn) => new Promise((res, rej) => {
  const t = db.transaction(store, mode); const s = t.objectStore(store); let out;
  Promise.resolve(fn(s)).then(v => { out = v; });
  t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('transaction annulée'));
});
const reqP = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

/* Crée un stockage. mode : 'auto' (IndexedDB > local > mémoire) ou forcé ('memoire', 'local', 'indexeddb').
   nom : nom de la base (les tests utilisent une base à part). */
export async function creerStockage({ nom = 'aypona-os2', mode = 'auto' } = {}) {
  const cache = new Map();          // kv en mémoire
  let fichiers = new Map();         // fichiers (mode local et mémoire), en IndexedDB : lus à la demande
  let db = null, actif = 'memoire';
  const lsKey = k => LS_PREFIX + nom + ':' + k;

  if (mode === 'auto' || mode === 'indexeddb') {
    try {
      if (typeof indexedDB === 'undefined') throw new Error('IndexedDB absente');
      db = await idbOuvrir(nom);
      const [cles, vals] = await tx(db, 'kv', 'readonly', s => Promise.all([reqP(s.getAllKeys()), reqP(s.getAll())]));
      cles.forEach((k, i) => cache.set(k, vals[i]));
      actif = 'indexeddb';
    } catch (e) { journal.erreur(e, 'stockage'); db = null; if (mode === 'indexeddb') throw e; }
  }
  if (!db && (mode === 'auto' || mode === 'local')) {
    try {
      const k = lsKey('__essai'); localStorage.setItem(k, '1'); localStorage.removeItem(k);
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(lsKey('kv:'))) { try { cache.set(key.slice(lsKey('kv:').length), JSON.parse(localStorage.getItem(key))); } catch (e) {} }
      }
      try { const raw = localStorage.getItem(lsKey('fichiers')); if (raw) JSON.parse(raw).forEach(f => fichiers.set(f.id, f)); } catch (e) {}
      actif = 'local';
    } catch (e) { if (mode === 'local') throw e; actif = 'memoire'; }
  }

  /* File d'écriture : une seule écriture en vol par clé, la dernière valeur gagne. */
  const enAttente = new Map(); let vidage = null;
  function planifier() {
    if (vidage) return vidage;
    vidage = Promise.resolve().then(async () => {
      while (enAttente.size) {
        const lot = [...enAttente]; enAttente.clear();
        try {
          if (actif === 'indexeddb') await tx(db, 'kv', 'readwrite', s => { lot.forEach(([k, v]) => v === undefined ? s.delete(k) : s.put(v, k)); });
          else if (actif === 'local') lot.forEach(([k, v]) => v === undefined ? localStorage.removeItem(lsKey('kv:' + k)) : localStorage.setItem(lsKey('kv:' + k), JSON.stringify(v)));
        } catch (e) { journal.erreur(e, 'stockage:écriture'); api.derniereErreur = e.message; }
      }
      vidage = null;
    });
    return vidage;
  }
  const clone = v => v === undefined ? v : JSON.parse(JSON.stringify(v));
  const sauverFichiersLocal = () => { if (actif === 'local') localStorage.setItem(lsKey('fichiers'), JSON.stringify([...fichiers.values()])); };

  const api = {
    nom, derniereErreur: null,
    get mode() { return actif; },
    get durable() { return actif !== 'memoire'; },
    /* ----- clé → valeur ----- */
    get(k, def) { return cache.has(k) ? clone(cache.get(k)) : def; },
    set(k, v) { v = clone(v); cache.set(k, v); enAttente.set(k, v); planifier(); return true; },
    remove(k) { cache.delete(k); enAttente.set(k, undefined); planifier(); },
    cles: () => [...cache.keys()],
    vider: () => planifier(),
    /* ----- fichiers ----- */
    async fichiersTous() {
      if (actif === 'indexeddb') return tx(db, 'fichiers', 'readonly', s => reqP(s.getAll()));
      return [...fichiers.values()].map(clone);
    },
    async fichierLire(id) {
      if (actif === 'indexeddb') return tx(db, 'fichiers', 'readonly', s => reqP(s.get(id))).then(v => v || null);
      return fichiers.has(id) ? clone(fichiers.get(id)) : null;
    },
    async fichierEcrire(f) {
      if (actif === 'indexeddb') await tx(db, 'fichiers', 'readwrite', s => { s.put(f); });
      else { fichiers.set(f.id, clone(f)); sauverFichiersLocal(); }
      return f;
    },
    async fichierSupprimer(id) {
      if (actif === 'indexeddb') await tx(db, 'fichiers', 'readwrite', s => { s.delete(id); });
      else { fichiers.delete(id); sauverFichiersLocal(); }
    },
    /* ----- espace ----- */
    async estimation() {
      let quota = actif === 'indexeddb' ? 0 : actif === 'local' ? 5 * 1024 * 1024 : 8 * 1024 * 1024, usage = 0, persistant = false;
      try { if (actif === 'indexeddb' && navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); quota = e.quota || 0; usage = e.usage || 0; } } catch (e) {}
      try { if (navigator.storage && navigator.storage.persisted) persistant = await navigator.storage.persisted(); } catch (e) {}
      if (!usage) usage = (await api.fichiersTous()).reduce((s, f) => s + (f.taille || 0), 0) + JSON.stringify([...cache]).length;
      return { quota, usage, persistant };
    },
    async rendreDurable() {
      try { if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch (e) {}
      return false;
    },
    /* Plafond total des fichiers selon le mode. */
    async plafondFichiers() {
      if (actif === 'local') return 1024 * 1024;
      if (actif === 'memoire') return 8 * 1024 * 1024;
      const e = await api.estimation();
      return Math.max(20 * 1024 * 1024, Math.min(500 * 1024 * 1024, Math.floor((e.quota || 0) * 0.5)));
    },
    /* ----- remise à zéro ----- */
    async effacerTout() {
      cache.clear(); enAttente.clear();
      if (actif === 'indexeddb') { await tx(db, 'kv', 'readwrite', s => { s.clear(); }); await tx(db, 'fichiers', 'readwrite', s => { s.clear(); }); }
      else if (actif === 'local') { const ks = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(LS_PREFIX + nom + ':')) ks.push(k); } ks.forEach(k => localStorage.removeItem(k)); fichiers.clear(); }
      else fichiers.clear();
    },
    fermer() { if (db) { db.close(); db = null; } },
    async detruire() { api.fermer(); if (actif === 'indexeddb') await new Promise(r => { const q = indexedDB.deleteDatabase(nom); q.onsuccess = q.onerror = q.onblocked = () => r(); }); else await api.effacerTout(); },
  };
  return api;
}

/* ---------- Miroir des réglages (premier affichage instantané) ---------- */
export function lireMiroir() { try { return JSON.parse(localStorage.getItem(MIROIR) || 'null'); } catch (e) { return null; } }
export function ecrireMiroir(v) { try { localStorage.setItem(MIROIR, JSON.stringify(v)); } catch (e) {} }

/* ---------- Sauvegarde .aypona ---------- */
export const SAUV_MAX = 300 * 1024 * 1024;
const CLES_EXCLUES = ['meta.session'];

export async function creerSauvegarde(st) {
  const kv = {}; st.cles().filter(k => !CLES_EXCLUES.includes(k)).sort().forEach(k => { kv[k] = st.get(k); });
  const fichiers = (await st.fichiersTous()).sort((a, b) => a.id < b.id ? -1 : 1);
  const corps = { kv, fichiers };
  return { format: FORMAT, version: 1, systeme: 'Aypona OS ' + VERSION, schema: SCHEMA, cree: new Date().toISOString(), somme: await sha256(canonique(corps)), ...corps };
}

/* Vérifie une sauvegarde (texte ou objet) sans rien écrire. */
export async function inspecterSauvegarde(src) {
  const errors = [];
  let o = src;
  if (typeof src === 'string') {
    if (src.length > SAUV_MAX) return { ok: false, errors: ['taille'] };
    try { o = JSON.parse(src); } catch (e) { return { ok: false, errors: ['json'] }; }
  }
  if (!o || typeof o !== 'object' || o.format !== FORMAT) errors.push('format');
  else {
    if (o.version !== 1) errors.push('version');
    if (!o.kv || typeof o.kv !== 'object' || Array.isArray(o.kv)) errors.push('kv');
    if (!Array.isArray(o.fichiers) || o.fichiers.some(f => !f || typeof f.id !== 'string' || typeof f.nom !== 'string' || typeof f.app !== 'string')) errors.push('fichiers');
    if (!errors.length && o.somme !== await sha256(canonique({ kv: o.kv, fichiers: o.fichiers }))) errors.push('somme');
  }
  if (errors.length) return { ok: false, errors };
  const inst = Array.isArray(o.kv.installees) ? o.kv.installees.length : 0;
  return { ok: true, errors: [], sauvegarde: o, resume: { cree: o.cree, systeme: o.systeme, cles: Object.keys(o.kv).length, fichiers: o.fichiers.length, apps: inst } };
}

/* mode : 'remplacer' (efface d'abord) ou 'fusionner' (garde l'existant, la sauvegarde gagne en cas de doublon). */
export async function restaurerSauvegarde(st, o, mode = 'fusionner') {
  if (mode === 'remplacer') await st.effacerTout();
  for (const [k, v] of Object.entries(o.kv)) {
    if (CLES_EXCLUES.includes(k)) continue;
    if (mode === 'fusionner' && k === 'installees') {
      const cur = st.get('installees', []) || [], ids = new Set(v.map(m => m.id));
      st.set(k, [...cur.filter(m => !ids.has(m.id)), ...v]);
    } else st.set(k, v);
  }
  for (const f of o.fichiers) await st.fichierEcrire(f);
  await st.vider();
  return { cles: Object.keys(o.kv).length, fichiers: o.fichiers.length };
}

/* ---------- Reprise des données de la v0.2 (même origine, préfixe aypona-os:) ----------
   Lecture seule : la v0.2 garde ses données intactes. */
export function lireV02(ls = (typeof localStorage !== 'undefined' ? localStorage : null)) {
  if (!ls) return null;
  const get = k => { try { const r = ls.getItem('aypona-os:' + k); return r == null ? null : JSON.parse(r); } catch (e) { return null; } };
  const schema = get('schema');
  if (!schema) return null;
  return { schema, settings: get('settings') || {}, layout: get('layout'), installed: get('installed') || [], files: get('files') || [], prive: get('prive') || {}, notifs: get('notifs') || [] };
}
