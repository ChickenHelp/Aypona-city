/* =====================================================================
   AYPONA OS 2 · NOYAU (Bureau 102 · Polaris, AYP-102-2610-0013)
   Décret n°2 du mandat V. Version, bus d'événements, journal local, utilitaires sûrs.
   Règle : aucun innerHTML avec des données. Le DOM se construit avec h() et textContent.
   ===================================================================== */
export const VERSION = '2.0.0';
export const BUILD = '2026-10-18';
export const SCHEMA = 1;

/* ---------- Construction du DOM sans injection ----------
   h('button', { class:'x', onclick:fn, 'aria-label':'…' }, 'texte', autreNoeud)
   Les attributs html/innerHTML sont refusés : seul svg() accepte du balisage, et uniquement
   depuis la table d'icônes du système (jamais des données d'app ou d'utilisateur). */
export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'html' || k === 'innerHTML') throw new Error('h() : innerHTML interdit');
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'value') e.value = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(Infinity)) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}

/* Icônes système : balisage fixe, écrit ici, jamais construit depuis des données. */
const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
const svgCache = new Map();
export function svg(markup) {
  if (!svgCache.has(markup)) {
    const src = markup.includes('xmlns=') ? markup : markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const doc = parser.parseFromString(src, 'image/svg+xml');
    svgCache.set(markup, doc.documentElement);
  }
  const n = document.importNode(svgCache.get(markup), true);
  n.setAttribute('aria-hidden', 'true');
  n.setAttribute('focusable', 'false');
  return n;
}

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const uid = p => (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* Texte sans accents ni casse, pour la recherche. */
export const plier = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function taille(n) {
  if (!isFinite(n)) return '—';
  if (n < 1024) return n + ' o';
  if (n < 1024 * 1024) return (n / 1024).toFixed(n < 10240 ? 1 : 0).replace('.', ',') + ' Ko';
  if (n < 1024 ** 3) return (n / 1024 / 1024).toFixed(1).replace('.', ',') + ' Mo';
  return (n / 1024 ** 3).toFixed(1).replace('.', ',') + ' Go';
}

/* Empreinte SHA-256 en hexadécimal (signature des sauvegardes). */
export async function sha256(texte) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* JSON canonique : clés triées, pour que l'empreinte ne dépende pas de l'ordre. */
export function canonique(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonique).join(',') + ']';
  return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + canonique(v[k])).join(',') + '}';
}

/* ---------- Bus d'événements ---------- */
export function creerBus() {
  const handlers = {};
  return {
    on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); return () => { handlers[ev] = (handlers[ev] || []).filter(f => f !== fn); }; },
    emit(ev, data) {
      journal.ajouter('evt', ev, data);
      for (const fn of (handlers[ev] || []).slice()) { try { fn(data); } catch (e) { journal.erreur(e, 'bus:' + ev); } }
    },
  };
}

/* ---------- Journal local (rien n'est envoyé) ---------- */
const JMAX = 200;
const lignes = [];
export const journal = {
  ajouter(type, quoi, data) {
    let d = '';
    if (data != null) { try { d = typeof data === 'object' ? JSON.stringify(data) : String(data); } catch (e) { d = '[objet]'; } }
    lignes.unshift({ t: Date.now(), type, quoi: String(quoi).slice(0, 80), d: d.slice(0, 120) });
    if (lignes.length > JMAX) lignes.length = JMAX;
  },
  erreur(e, ou) { journal.ajouter('erreur', ou || 'système', (e && e.message) || String(e)); },
  liste: type => lignes.filter(l => !type || l.type === type),
  vider() { lignes.length = 0; },
};
if (typeof window !== 'undefined') {
  window.addEventListener('error', e => journal.erreur(e.error || e.message, 'fenêtre'));
  window.addEventListener('unhandledrejection', e => journal.erreur(e.reason, 'promesse'));
}

export const bus = creerBus();

/* Mesures de démarrage (performance.now()) */
export const mesures = {};
export function mesurer(nom) { mesures[nom] = Math.round(performance.now()); return mesures[nom]; }
