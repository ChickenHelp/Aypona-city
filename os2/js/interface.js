/* =====================================================================
   AYPONA OS 2 · INTERFACE
   Coquille adaptative (téléphone, tablette, ordinateur), volets d'apps et multitâche,
   recherche globale, centre de contrôle, notifications, permissions à l'usage,
   apps système (Réglages, App Store, Fichiers, Diagnostic, Astuces), démarrage.
   Accessibilité : chaque geste a un bouton et un raccourci ; feuilles avec piège de focus ;
   annonces aria-live ; aucun innerHTML avec des données.
   ===================================================================== */
import { VERSION, BUILD, SCHEMA, h, svg, $, $$, clamp, uid, plier, taille, bus, journal, mesures, mesurer } from './noyau.js';
import { creerStockage, ecrireMiroir, creerSauvegarde, inspecterSauvegarde, restaurerSauvegarde, lireV02 } from './stockage.js';
import { t, i18n } from './i18n.js';
import { valider, STUDIOS, STUDIO_COULEURS, DOMICILES, exemple } from './manifeste.js';
import { creerSysteme, FONDS, WIDGETS, APPS_SYSTEME } from './systeme.js';
import { creerHote } from './hote.js';
import { lancerTests } from './tests.js';

mesurer('modules');

/* ---------- Icônes système (balisage fixe) ---------- */
const I = {
  reglages: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M13.6 2l.5 2.4c.6.2 1.2.5 1.7.9l2.3-.8 1.6 2.8-1.8 1.6c.1.6.1 1.3 0 1.9l1.8 1.6-1.6 2.8-2.3-.8c-.5.4-1.1.7-1.7.9l-.5 2.4h-3.2l-.5-2.4c-.6-.2-1.2-.5-1.7-.9l-2.3.8-1.6-2.8 1.8-1.6a6 6 0 0 1 0-1.9L2.5 7.3l1.6-2.8 2.3.8c.5-.4 1.1-.7 1.7-.9L8.6 2h5ZM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" transform="translate(0 2) scale(1 .92)"/></svg>',
  store: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round"><path d="M9.2 4.5 4.6 12.5M14.8 4.5l7 12.1M2.5 16.5h12.5M16.5 12.5h5M5.6 20 4.4 18"/></svg>',
  moniteur: '<svg viewBox="0 0 24 24" fill="none" stroke="#30d158" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12.5h4l2.5-6 4 11 2.6-7.5 1.4 2.5h4.5"/></svg>',
  astuces: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2.5a6.5 6.5 0 0 0-3.9 11.7c.6.5.9 1.1.9 1.8v.5h6v-.5c0-.7.3-1.3.9-1.8A6.5 6.5 0 0 0 12 2.5ZM9.5 18h5v1.2a1.8 1.8 0 0 1-1.8 1.8h-1.4a1.8 1.8 0 0 1-1.8-1.8V18Z"/></svg>',
  fichiers: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h4.2l2 2.2h6.8A2.5 2.5 0 0 1 21 8.7v8.8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z"/></svg>',
  aypona: '<svg viewBox="0 0 24 24" fill="#1a1206"><path d="M12 3 4 21h3.4l1.6-4h6l1.6 4H20L12 3Zm0 6.3 2 5.2h-4l2-5.2Z"/></svg>',
  accueil: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>',
  fermer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  cote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M12 4.5v15"/></svg>',
  plein: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  onglet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  lune: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z"/></svg>',
  mouvement: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="3.5"/><path d="M4 12a8 8 0 0 1 8-8M20 12a8 8 0 0 1-8 8"/></svg>',
  contraste: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 2v14a7 7 0 0 1 0-14Z"/></svg>',
  verre: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 15 15 8" stroke-linecap="round"/></svg>',
  langue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9M12 3C9.5 5.6 8.3 8.6 8.3 12s1.2 6.4 3.7 9"/></svg>',
  texte: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 19 9.2 5h1.9L16.3 19h-2.1l-1.4-3.9H7.5L6.1 19H4Zm4.1-5.7h4.1L10.1 7.5 8.1 13.3ZM17 19l2.6-7h1.3l2.6 7h-1.4l-.6-1.7h-2.5l-.6 1.7H17Zm2.4-2.8h1.8l-.9-2.6-.9 2.6Z"/></svg>',
  disque: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
  sauvegarde: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14"/></svg>',
  reseau: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 18.5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM12 13c-2.1 0-4 .8-5.4 2.2l1.5 1.5A5.6 5.6 0 0 1 12 15.1c1.5 0 2.9.6 3.9 1.6l1.5-1.5A7.6 7.6 0 0 0 12 13Zm0-4.6c-3.3 0-6.3 1.3-8.6 3.5l1.5 1.5A10 10 0 0 1 12 10.5c2.8 0 5.3 1.1 7.1 2.9l1.5-1.5A12.1 12.1 0 0 0 12 8.4Z"/></svg>',
  cle: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M7 10V7.5a5 5 0 0 1 10 0V10h1a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 18 21H6a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 6 10h1Zm2.2 0h5.6V7.5a2.8 2.8 0 0 0-5.6 0V10Z"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m8 7-5 5 5 5M16 7l5 5-5 5"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 13h14l-4.5-6-3.5 4.5-2.5-3L5 17Zm3.5-7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg>',
  cloche: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z"/></svg>',
  grille: '<svg viewBox="0 0 24 24" fill="#fff"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m1 1 6 6-6 6"/></svg>',
  retour: '<svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2 2 10l8 8"/></svg>',
  fichier: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M6 2h8l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V8h4.5L13 3.5Z"/></svg>',
};
const FOND_APP = {
  reglages: 'linear-gradient(180deg,#8e8e93,#48484a)', store: 'linear-gradient(180deg,#1ec8ff,#0a6cff)',
  fichiers: 'linear-gradient(180deg,#5ac8fa,#0a84ff)', moniteur: 'linear-gradient(180deg,#2c2c2e,#0b0b0d)',
  astuces: 'linear-gradient(180deg,#ffd60a,#ff9f0a)', aypona: 'linear-gradient(135deg,#f5d061,#d4af37 40%,#8b6914 75%,#2a1a3a)',
};

/* ---------- État ---------- */
let st, sys, hote;
const E = { tablette: false, ouvertes: [], visibles: [], actif: null, edition: false, tests: [], testsT: 0, reg: null, feuille: null, retourFocus: null, dlgFile: [], selMode: 'ouvertes' };
const R = () => sys.reglages;
const mq = matchMedia('(min-width: 768px) and (min-height: 540px)');

/* ---------- Petits constructeurs ---------- */
const nomApp = a => !a ? '?' : (a.systeme || APPS_SYSTEME.includes(a.id) ? t('app.' + a.id) : (a.nom || a.id));
function iconeApp(a, cls) {
  const el = h('span', { class: 'icone' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true' });
  if (!a) return el;
  if (a.systeme || APPS_SYSTEME.includes(a.id) || a.id === 'aypona') {
    el.style.background = FOND_APP[a.id] || FOND_APP.aypona; el.append(svg(I[a.id] || I.aypona));
    if (a.id === 'moniteur') el.style.border = '.5px solid rgba(255,255,255,.14)';
  } else { el.style.background = (a.icone && a.icone.couleur) || '#636366'; el.textContent = (a.icone && a.icone.glyphe) || '?'; }
  return el;
}
const domChip = d => h('span', { class: 'dom' }, h('i', { style: { background: DOMICILES[d] || '#888' } }), t('dom.' + d));
const sec = (titre, enfants, pied) => h('section', { class: 'sec' }, titre ? h('h3', {}, titre) : null, enfants, pied ? h('p', { class: 'pied' }, pied) : null);
const liste = (...l) => h('div', { class: 'liste' }, l);
function ligne({ icone, fond, libelle, sous, valeur, chevron, onclick, droite, cls, label }) {
  const kids = [
    icone ? h('span', { class: 'pi', style: { background: fond || '#636366' } }, typeof icone === 'string' && icone.startsWith('<svg') ? svg(icone) : icone) : null,
    h('span', { class: 'pl' }, libelle, sous ? h('small', {}, sous) : null),
    valeur != null ? h('span', { class: 'pv' }, valeur) : null,
    droite || null,
    chevron ? svg(I.chev) : null,
  ];
  return onclick ? h('button', { class: 'ligne ' + (cls || ''), onclick, 'aria-label': label || null }, kids) : h('div', { class: 'ligne ' + (cls || '') }, kids);
}
function interrupteur(libelle, val, change, sous) {
  const id = uid('sw');
  const b = h('button', { class: 'interrupteur', role: 'switch', 'aria-checked': String(!!val), 'aria-labelledby': id });
  b.addEventListener('click', () => { const v = b.getAttribute('aria-checked') !== 'true'; b.setAttribute('aria-checked', String(v)); change(v); });
  return h('div', { class: 'ligne' }, h('span', { class: 'pl', id }, libelle, sous ? h('small', {}, sous) : null), b);
}
const bouton = (txt, onclick, cls, attrs) => h('button', { class: 'b ' + (cls || ''), onclick, ...(attrs || {}) }, txt);
function quand(ts) {
  if (!ts) return t('jamais');
  const d = Date.now() - ts, m = Math.round(d / 60000);
  if (m < 1) return t('aLInstant'); if (m < 60) return t('ilYaMin', { n: m });
  const hh = Math.round(m / 60); if (hh < 24) return t('ilYaH', { n: hh });
  return t('ilYaJ', { n: Math.round(hh / 24) });
}
const heureCourte = ts => new Date(ts).toLocaleTimeString(i18n.langue === 'en' ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
function telecharger(nom, blob) {
  const a = h('a', { href: URL.createObjectURL(blob), download: nom }); document.body.append(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}

/* ---------- Île (toast) et annonces ---------- */
let ileT;
function ile(msg) { const e = $('#ile'); e.textContent = msg; e.classList.add('on'); clearTimeout(ileT); ileT = setTimeout(() => e.classList.remove('on'), 2600); }
function annoncer(msg) { const e = $('#annonce'); e.textContent = ''; setTimeout(() => { e.textContent = msg; }, 30); }

/* ---------- Feuilles : ouverture, piège de focus, Échap ---------- */
const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';
function ouvrirFeuille(id, preparer, focusSel) {
  if (E.feuille && E.feuille !== id) fermerFeuille(E.feuille, true);
  const f = $('#' + id);
  if (E.feuille !== id) E.retourFocus = document.activeElement;
  E.feuille = id; if (preparer) preparer();
  f.hidden = false; f.classList.remove('entre'); void f.offsetWidth; f.classList.add('entre');
  $('#os').setAttribute('aria-hidden', 'true'); $('#os').inert = true;
  const cible = (focusSel && $(focusSel, f)) || $(FOCUSABLE, f); if (cible) cible.focus();
}
function fermerFeuille(id, sansFocus) {
  const f = $('#' + (id || E.feuille)); if (!f || f.hidden) return;
  f.hidden = true; if (E.feuille === f.id) E.feuille = null;
  $('#os').removeAttribute('aria-hidden'); $('#os').inert = false;
  if (f.id === 'fNotifs') sys.notifs.toutLu();
  if (!sansFocus && E.retourFocus && document.contains(E.retourFocus)) E.retourFocus.focus();
}
function pieger(e, racine) {
  if (e.key !== 'Tab') return;
  const els = $$(FOCUSABLE, racine).filter(x => x.offsetParent !== null || x === document.activeElement); if (!els.length) return;
  const a = els[0], z = els[els.length - 1];
  if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
  else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
}

/* ---------- Dialogues (confirmation, permission, choix) ---------- */
function dialogue({ icone, titre, texte, actions, role = 'alertdialog', deux }) {
  return new Promise(res => {
    const run = () => {
      const d = $('#dlg'); d.replaceChildren();
      const prec = document.activeElement;
      const tid = uid('dt'), pid = uid('dp');
      const fin = v => { d.hidden = true; d.replaceChildren(); $('#os').inert = !!E.feuille; if (prec && document.contains(prec)) prec.focus(); res(v); E.dlgFile.shift(); if (E.dlgFile.length) E.dlgFile[0](); };
      const btns = actions.map(a => h('button', { class: a.cls || '', onclick: () => fin(a.v) }, a.txt));
      const carte = h('div', { class: 'dlg-carte', role, 'aria-modal': 'true', 'aria-labelledby': tid, 'aria-describedby': pid },
        h('div', { class: 'txt' }, icone || null, h('h2', { id: tid }, titre), h('p', { id: pid }, texte || '')),
        h('div', { class: 'dlg-acts' + (deux ? ' deux' : '') }, btns));
      carte.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fin(actions.find(a => a.annuler)?.v ?? null); } pieger(e, carte); });
      d.append(carte); d.hidden = false; $('#os').inert = true;
      (btns.find((b, i) => actions[i].focus) || btns[0]).focus();
    };
    E.dlgFile.push(run); if (E.dlgFile.length === 1) run();
  });
}
const confirmer = (titre, texte, oui, rouge) => dialogue({ titre, texte, deux: true, actions: [{ txt: t('annuler'), v: false, annuler: true }, { txt: oui, v: true, cls: rouge ? 'rouge' : 'gras', focus: !rouge }] });
function demanderPermission(app, perm) {
  return dialogue({
    icone: iconeApp(app), titre: t('perm.titre', { app: nomApp(app), perm: t('perm.' + perm) }), texte: t('perm.texte.' + perm),
    actions: [{ txt: t('perm.uneFois'), v: 'une-fois' }, { txt: t('perm.toujours'), v: 'toujours', cls: 'gras' }, { txt: t('perm.refuser'), v: 'refuser', cls: 'rouge', annuler: true }],
  });
}

/* ---------- Apparence ---------- */
const theme = () => ({ texte: R().get('texte'), contraste: R().get('contraste'), mouvement: R().get('mouvement'), transparence: R().get('transparence') });
function appliquer() {
  const r = R().tous(), d = document.documentElement;
  i18n.set(r.langue); d.lang = r.langue; d.dataset.fond = r.fond; d.style.fontSize = r.texte + '%';
  d.classList.toggle('contraste', r.contraste); d.classList.toggle('opaque', r.transparence); d.classList.toggle('calme', r.mouvement);
  ecrireMiroir({ fond: r.fond, langue: r.langue, texte: r.texte, contraste: r.contraste, transparence: r.transparence, mouvement: r.mouvement });
  i18n.apply(document);
  $('#luneBarre').hidden = !r.nePasDeranger;
}

/* ---------- Accueil ---------- */
function badgeApp(id) { return sys.notifs.liste().filter(n => n.app === id && !n.lue).length; }
function tuile(id, zone) {
  const a = sys.apps.get(id); if (!a) return null;
  const nb = badgeApp(id), nom = nomApp(a);
  const ic = iconeApp(a); if (nb) ic.append(h('span', { class: 'badge' }, nb > 99 ? '99+' : nb));
  const b = h('button', { class: 'tuile', 'data-id': id, tabindex: '-1', 'aria-label': nb ? t('appBadge', { app: nom, n: nb }) : nom, onclick: () => { if (!E.edition) ouvrir(id); } }, ic, h('span', { class: 'etiquette', 'aria-hidden': 'true' }, nom));
  let appui;
  b.addEventListener('pointerdown', () => { appui = setTimeout(() => { if (!E.edition) basculerEdition(true); }, 550); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => clearTimeout(appui)));
  b.addEventListener('contextmenu', e => { e.preventDefault(); basculerEdition(true); });
  if (E.edition) {
    const w = h('div', { class: 'tuile-wrap', style: { display: 'grid', justifyItems: 'center', gap: '.3rem' } }, b,
      h('div', { class: 'outils-tuile' },
        h('button', { 'aria-label': t('deplacerAvant', { app: nom }), onclick: () => { sys.disposition.deplacer(id, -1); rendreAccueil(id); } }, '◀'),
        h('button', { 'aria-label': zone === 'dock' ? t('retirerDock', { app: nom }) : t('mettreDock', { app: nom }), onclick: () => { if (!sys.disposition.basculerDock(id)) ile(t('dockPlein')); rendreAccueil(id); } }, zone === 'dock' ? '⇧' : '⇩'),
        h('button', { 'aria-label': t('deplacerApres', { app: nom }), onclick: () => { sys.disposition.deplacer(id, 1); rendreAccueil(id); } }, '▶')));
    return w;
  }
  return b;
}
function basculerEdition(v) {
  E.edition = v; $('#accueil').classList.toggle('edition', v);
  const ban = $('#bandeauEdition'); ban.hidden = !v; ban.replaceChildren();
  if (v) { ban.className = 'bandeau-edition'; ban.append(h('span', {}, t('editionAide')), bouton(t('ok'), () => basculerEdition(false), 'bleu petit')); annoncer(t('editionAide')); }
  rendreAccueil();
  if (v) $('.bandeau-edition button').focus();
}
function rendreAccueil(focusId) {
  const d = sys.disposition.reparer();
  const g = $('#grille'); g.replaceChildren();
  d.grille.forEach(id => { const x = tuile(id, 'grille'); if (x) g.append(x); });
  if (!sys.apps.installees().length && !E.edition) g.append(h('div', { class: 'vide', style: { gridColumn: '1 / -1' } }, h('b', {}, t('aucuneApp')), h('p', {}, t('aucuneAppTxt'))));
  if (!E.edition) g.append(h('div', { style: { gridColumn: '1 / -1', display: 'flex', justifyContent: 'center' } }, bouton(t('modifierAccueil'), () => basculerEdition(true), 'petit')));
  const dock = $('#dock'); dock.replaceChildren();
  d.dock.forEach(id => { const x = tuile(id, 'dock'); if (x) dock.append(x); });
  if (E.tablette && !E.edition) {
    const rec = sys.recents.liste().map(r => r.id).filter(id => !d.dock.includes(id)).slice(0, 3);
    if (rec.length) { dock.append(h('span', { class: 'sep', 'aria-hidden': 'true' })); rec.forEach(id => { const x = tuile(id, 'recent'); if (x) dock.append(x); }); }
  }
  /* Tabulation itinérante : un seul arrêt par zone, flèches pour se déplacer. */
  [g, dock].forEach(z => { const ts = $$('.tuile', z); if (ts.length) (ts.find(x => x.dataset.id === focusId) || ts[0]).tabIndex = 0; });
  if (focusId) { const f = $(`.tuile[data-id="${CSS.escape(focusId)}"]`); if (f) f.focus(); }
  rendreWidgets(); majCompteurs();
}
function naviguerTuiles(e) {
  const z = e.currentTarget, ts = $$('.tuile', z), i = ts.indexOf(document.activeElement); if (i < 0) return;
  const cols = z.id === 'grille' ? getComputedStyle(z).gridTemplateColumns.split(' ').length : ts.length;
  const pas = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols, Home: -i, End: ts.length - 1 - i }[e.key];
  if (pas == null) return;
  e.preventDefault(); const j = clamp(i + pas, 0, ts.length - 1);
  ts.forEach(x => { x.tabIndex = -1; }); ts[j].tabIndex = 0; ts[j].focus();
}

/* ---------- Widgets ---------- */
async function rendreWidgets() {
  const box = $('#widgets'); const ws = R().get('widgets');
  const els = [];
  for (const w of ws) {
    if (w === 'horloge') { const now = new Date(); els.push(h('div', { class: 'widget w-heure' }, h('h3', {}, t('w.horloge')), h('div', {}, h('div', { class: 't' }, heureCourte(now)), h('div', { class: 'd' }, now.toLocaleDateString(i18n.langue === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))))); }
    if (w === 'systeme') {
      const ok = E.tests.filter(x => x.ok).length, tot = E.tests.length;
      els.push(h('button', { class: 'widget w-sys', onclick: () => ouvrir('moniteur') }, h('h3', {}, t('w.systeme')), h('div', { class: 'v' }, 'OS ' + VERSION),
        h('ul', { class: 'w-liste' }, h('li', {}, h('i', { class: 'point' + (tot && ok < tot ? ' bad' : '') }), tot ? t('testsOk', { ok, tot }) : t('testsEnCours')),
          h('li', {}, h('i', { class: 'point' + (st.mode === 'memoire' ? ' bad' : st.mode === 'local' ? ' warn' : '') }), t('mode.' + st.mode)))));
    }
    if (w === 'sauvegarde') {
      const ts = st.get('meta.sauvegarde', 0), vieux = !ts || Date.now() - ts > 7 * 864e5;
      els.push(h('div', { class: 'widget' }, h('h3', {}, t('w.sauvegarde')), h('div', {}, h('div', { style: { fontWeight: 700, fontSize: '1.05rem' } }, ts ? quand(ts) : t('jamais')), h('small', { style: { color: vieux ? 'var(--warn)' : 'var(--ink-2)', fontSize: '.78rem' } }, vieux ? t('sauvConseil') : t('sauvOk'))), h('button', { class: 'w-btn', onclick: exporter }, t('exporter'))));
    }
    if (w === 'notifs') { const l = sys.notifs.liste(); els.push(h('button', { class: 'widget', onclick: () => ouvrirNotifs() }, h('h3', {}, t('notifications')), h('div', { class: 'w-gros' }, String(sys.notifs.nonLues())), h('ul', { class: 'w-liste' }, l.slice(0, 2).map(n => h('li', {}, n.titre || nomApp(sys.apps.get(n.app) || { id: n.app })))))); }
    if (w === 'fichiers') { const fs = await sys.fichiers.liste(); els.push(h('button', { class: 'widget', onclick: () => ouvrir('fichiers') }, h('h3', {}, t('app.fichiers')), h('div', { class: 'w-gros' }, String(fs.length)), h('ul', { class: 'w-liste' }, fs.slice(0, 3).map(f => h('li', {}, f.nom))))); }
  }
  box.replaceChildren(...els); box.hidden = !els.length;
}
function majCompteurs() {
  const n = sys.notifs.nonLues(), p = $('#nbNotif'); p.hidden = !n; p.textContent = n > 99 ? '99+' : n;
  $('#bNotif').setAttribute('aria-label', n ? t('notifsN', { n }) : t('notifications'));
}
function majHeure() { $('#heure').textContent = heureCourte(Date.now()); const w = $('.w-heure .t'); if (w) w.textContent = heureCourte(Date.now()); }

/* ---------- Volets d'apps (multitâche) ---------- */
const MAX_OUVERTES = () => E.tablette ? 4 : 3;
function ouvrir(id, opts = {}) {
  const a = sys.apps.get(id); if (!a) return;
  if (E.feuille) fermerFeuille(E.feuille, true);
  sys.recents.toucher(id);
  let o = E.ouvertes.find(x => x.id === id);
  if (!o) { o = creerVolet(a); E.ouvertes.push(o); evincer(); }
  if (E.tablette && opts.cote && E.visibles.length && !E.visibles.includes(id)) E.visibles = [E.actif && E.visibles.includes(E.actif) ? E.actif : E.visibles[0], id];
  else if (!(E.tablette && E.visibles.includes(id))) E.visibles = [id];
  E.actif = id; afficherScene(true);
  if (opts.page && o.naviguer) o.naviguer(opts.page, opts.arg);
  annoncer(t('appOuverte', { app: nomApp(a) }));
}
function evincer() {
  while (E.ouvertes.length > MAX_OUVERTES()) {
    const v = E.ouvertes.find(o => !E.visibles.includes(o.id) && o.id !== E.actif) || E.ouvertes[0];
    detruireVolet(v);
  }
}
function detruireVolet(o) {
  if (o.cadre) hote.liberer(o.cadre);
  o.el.remove(); E.ouvertes = E.ouvertes.filter(x => x !== o); E.visibles = E.visibles.filter(x => x !== o.id);
}
function fermer(id) {
  const o = E.ouvertes.find(x => x.id === id); if (!o) return;
  detruireVolet(o); if (E.actif === id) E.actif = E.visibles[0] || null;
  afficherScene(); if (!E.visibles.length) allerAccueil();
}
function allerAccueil() {
  E.visibles = []; afficherScene();
  const f = $('#grille .tuile[tabindex="0"]') || $('#grille'); if (f) f.focus();
}
function afficherScene(anim) {
  const sc = $('#scene'), vis = E.visibles;
  sc.hidden = !vis.length; $('#os').classList.toggle('scene-on', !!vis.length);
  $('#dockZone').hidden = !!vis.length; $('#accueil').hidden = !!vis.length;
  let sep = $('.separateur', sc);
  E.ouvertes.forEach(o => {
    const i = vis.indexOf(o.id); o.el.hidden = i < 0; o.el.style.order = i < 0 ? 9 : (i === 0 ? 1 : 3);
    o.el.style.flex = ''; o.el.classList.toggle('actif', vis.length > 1 && o.id === E.actif);
    $$('.vb-cote', o.el).forEach(b => { b.hidden = !E.tablette || vis.length > 1; });
    $$('.vb-plein', o.el).forEach(b => { b.hidden = !(E.tablette && vis.length > 1); });
  });
  if (vis.length === 2) {
    if (!sep) { sep = creerSeparateur(); sc.append(sep); }
    sep.hidden = false; sep.style.order = 2; regleScinde(R().get('scinde'));
  } else if (sep) sep.hidden = true;
  if (anim && vis.length) { sc.classList.remove('ouvre'); void sc.offsetWidth; sc.classList.add('ouvre'); }
  if (anim && vis.length) { const o = E.ouvertes.find(x => x.id === E.actif); const tt = o && $('h2', o.el); if (tt) { tt.tabIndex = -1; tt.focus(); } }
  rendreAccueil();
}
function regleScinde(v) {
  const o = E.ouvertes.find(x => x.id === E.visibles[0]); if (!o) return;
  o.el.style.flex = '0 0 ' + v + '%';
  const s = $('.separateur'); if (s) { s.setAttribute('aria-valuenow', v); s.setAttribute('aria-valuetext', t('scinde', { a: v, b: 100 - v })); }
}
function creerSeparateur() {
  const s = h('div', { class: 'separateur', role: 'separator', tabindex: '0', 'aria-orientation': 'vertical', 'aria-valuemin': '33', 'aria-valuemax': '67', 'aria-label': t('separateur') });
  const vals = [33, 50, 67];
  s.addEventListener('keydown', e => {
    const i = vals.indexOf(R().get('scinde')); let j = i;
    if (e.key === 'ArrowLeft') j = Math.max(0, i - 1); else if (e.key === 'ArrowRight') j = Math.min(2, i + 1); else return;
    e.preventDefault(); R().set('scinde', vals[j]); regleScinde(vals[j]);
  });
  s.addEventListener('pointerdown', e => {
    s.setPointerCapture(e.pointerId); const box = $('#scene').getBoundingClientRect();
    $$('.cadre-app').forEach(f => { f.style.pointerEvents = 'none'; });
    const move = ev => { const p = clamp((ev.clientX - box.left) / box.width * 100, 25, 75); const o = E.ouvertes.find(x => x.id === E.visibles[0]); if (o) o.el.style.flex = '0 0 ' + p + '%'; };
    const fin = ev => {
      s.removeEventListener('pointermove', move); s.removeEventListener('pointerup', fin);
      $$('.cadre-app').forEach(f => { f.style.pointerEvents = ''; });
      const p = (ev.clientX - box.left) / box.width * 100; const v = vals.reduce((a, b) => Math.abs(b - p) < Math.abs(a - p) ? b : a);
      R().set('scinde', v); regleScinde(v);
    };
    s.addEventListener('pointermove', move); s.addEventListener('pointerup', fin);
  });
  return s;
}
function creerVolet(a) {
  const nom = nomApp(a), tid = uid('vt');
  const corps = h('div', { class: 'volet-corps' });
  const el = h('section', { class: 'volet', 'data-app': a.id, 'aria-labelledby': tid },
    h('div', { class: 'volet-barre' },
      h('button', { class: 'vb', onclick: allerAccueil, 'aria-label': t('accueil'), 'aria-keyshortcuts': 'Alt+H' }, svg(I.accueil)),
      iconeApp(a), h('h2', { id: tid }, nom),
      h('button', { class: 'vb vb-cote', onclick: () => ouvrirSelecteur('cote'), 'aria-label': t('coteACote'), title: t('coteACote') }, svg(I.cote)),
      h('button', { class: 'vb vb-plein', onclick: () => { E.visibles = [a.id]; E.actif = a.id; afficherScene(); }, 'aria-label': t('pleinEcran'), title: t('pleinEcran') }, svg(I.plein)),
      h('button', { class: 'vb', onclick: () => fermer(a.id), 'aria-label': t('fermerApp', { app: nom }), 'aria-keyshortcuts': 'Alt+W' }, svg(I.fermer))),
    corps);
  el.addEventListener('focusin', () => { if (E.actif !== a.id) { E.actif = a.id; $$('.volet').forEach(v => v.classList.toggle('actif', E.visibles.length > 1 && v.dataset.app === a.id)); } });
  $('#scene').append(el);
  const o = { id: a.id, el, corps, cadre: null, naviguer: null };
  if (a.systeme) VUES[a.id](corps, o); else vueHote(corps, o, a);
  return o;
}
/* Rafraîchit les apps système ouvertes (changement de langue, d'apps…). */
function rafraichirVues(ids) {
  E.ouvertes.forEach(o => { const a = sys.apps.get(o.id); if (a && a.systeme && (!ids || ids.includes(o.id))) { const p = o.page; o.corps.replaceChildren(); VUES[o.id](o.corps, o); if (p && o.naviguer) o.naviguer(p, o.arg); } });
  E.ouvertes.forEach(o => { const h2 = $('.volet-barre h2', o.el); if (h2) h2.textContent = nomApp(sys.apps.get(o.id)); });
}

/* ---------- Hôte : vue d'une app tierce ---------- */
function vueHote(corps, o, a) {
  const url = sys.apps.adresse(a, location.href);
  if (!url) {
    const inp = h('input', { type: 'url', id: uid('pv'), placeholder: 'https://…', inputmode: 'url', autocomplete: 'off' });
    corps.append(h('div', { class: 'carte-ext' }, iconeApp(a), h('h2', {}, nomApp(a)), domChip('prive'), h('p', {}, t('priveTxt')),
      h('div', { class: 'champ', style: { width: '100%' } }, h('label', { for: inp.id }, t('priveAdresse')), inp),
      bouton(t('enregistrer'), () => { if (sys.apps.reglerAdressePrivee(a.id, inp.value.trim())) { corps.replaceChildren(); vueHote(corps, o, a); } else ile(t('adresseInvalide')); }, 'bleu')));
    return;
  }
  const echec = () => {
    if (o.cadre) { hote.liberer(o.cadre); o.cadre.remove(); o.cadre = null; }
    corps.replaceChildren(h('div', { class: 'carte-ext' }, iconeApp(a), h('h2', {}, nomApp(a)), domChip(a.domicile), h('p', {}, t('appSilence')),
      h('div', { class: 'boutons', style: { justifyContent: 'center' } },
        h('a', { class: 'b bleu', href: url, target: '_blank', rel: 'noopener noreferrer' }, svg(I.onglet), t('ouvrirOnglet')),
        bouton(t('reessayer'), () => { corps.replaceChildren(); vueHote(corps, o, a); }))));
  };
  o.cadre = hote.cadre(a, url, { surEchec: echec });
  corps.append(o.cadre);
}

/* ---------- Recherche globale ---------- */
const PAGES_REGLAGES = ['fond', 'affichage', 'langue', 'notifs', 'confidentialite', 'apps', 'stockage', 'dev', 'apropos'];
function actions() {
  const r = R();
  return [
    { k: 'act.exporter', faire: exporter }, { k: 'act.importer', faire: () => importer() },
    { k: r.get('nePasDeranger') ? 'act.dndOff' : 'act.dndOn', faire: () => basculer('nePasDeranger') },
    { k: r.get('contraste') ? 'act.contrasteOff' : 'act.contrasteOn', faire: () => basculer('contraste') },
    { k: r.get('mouvement') ? 'act.mouvementOff' : 'act.mouvementOn', faire: () => basculer('mouvement') },
    { k: r.get('transparence') ? 'act.transparenceOff' : 'act.transparenceOn', faire: () => basculer('transparence') },
    { k: i18n.langue === 'fr' ? 'act.anglais' : 'act.francais', faire: () => { R().set('langue', i18n.langue === 'fr' ? 'en' : 'fr'); } },
    { k: 'act.texteGrand', faire: () => R().set('texte', clamp(R().get('texte') + 10, 85, 150)) },
    { k: 'act.texteNormal', faire: () => R().set('texte', 100) },
    { k: 'act.centre', faire: () => ouvrirCentre() }, { k: 'act.notifs', faire: () => ouvrirNotifs() },
    { k: 'act.raccourcis', faire: () => ouvrirAide() }, { k: 'act.modifier', faire: () => { fermerFeuille(); allerAccueil(); basculerEdition(true); } },
    { k: 'act.tests', faire: () => { ouvrir('moniteur'); executerTests(); } }, { k: 'act.nouveauFichier', faire: () => ouvrir('fichiers', { page: 'editer' }) },
    { k: 'act.accueil', faire: () => { fermerFeuille(); allerAccueil(); } },
  ];
}
function score(texte, q) {
  const s = plier(texte); if (!q) return 0;
  if (s.startsWith(q)) return 3; if (s.includes(' ' + q) || s.includes('-' + q)) return 2; return s.includes(q) ? 1 : 0;
}
function surligner(texte, q) {
  const s = plier(texte), i = s.indexOf(q); if (i < 0 || !q) return [texte];
  return [texte.slice(0, i), h('mark', {}, texte.slice(i, i + q.length)), texte.slice(i + q.length)];
}
let rechJeton = 0, rechT;
async function chercher(qBrut) {
  const jet = ++rechJeton, q = plier(qBrut.trim()), box = $('#rechRes');
  const groupes = [];
  const add = (cle, items) => { items = items.filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 6); if (items.length) groupes.push({ cle, items }); };
  if (!q) {
    const rec = sys.recents.liste().slice(0, 5).map(r => sys.apps.get(r.id)).filter(Boolean);
    if (rec.length) groupes.push({ cle: 'rech.recentes', items: rec.map(a => ({ s: 1, ic: iconeApp(a), titre: nomApp(a), sous: t('rech.app'), faire: () => ouvrir(a.id) })) });
  } else {
    add('rech.apps', sys.apps.toutes().map(a => ({ s: score(nomApp(a), q) + (score(a.description || '', q) ? .5 : 0), ic: iconeApp(a), titre: nomApp(a), sous: a.systeme ? t('rech.appSysteme') : (a.studio + ' · ' + t('dom.' + a.domicile)), faire: () => ouvrir(a.id) })));
    add('rech.actions', actions().map(x => ({ s: score(t(x.k), q), ic: iconeApp({ id: 'aypona' }), titre: t(x.k), sous: t('rech.action'), faire: () => { fermerFeuille(); x.faire(); } })));
    add('rech.reglages', PAGES_REGLAGES.map(p => ({ s: Math.max(score(t('reg.' + p), q), score(t('regMots.' + p), q) ? .8 : 0), ic: iconeApp({ id: 'reglages', systeme: true }), titre: t('reg.' + p), sous: t('app.reglages'), faire: () => ouvrir('reglages', { page: p }) })));
    add('rech.catalogue', sys.ville.apps().map(c => ({ s: score(c.manifeste.nom, q) + (score(c.manifeste.description, q) ? .5 : 0), ic: iconeApp(c.manifeste), titre: c.manifeste.nom, sous: t('rech.catalogueSous', { statut: t('statut.' + sys.ville.statut(c)) }), faire: () => ouvrir('store') })));
    add('rech.notifs', sys.notifs.liste().map(n => ({ s: Math.max(score(n.titre, q), score(n.texte, q)), ic: iconeApp(sys.apps.get(n.app) || { id: 'aypona' }), titre: n.titre || '—', sous: n.texte, faire: () => ouvrirNotifs() })));
    const fs = await sys.fichiers.liste(); if (jet !== rechJeton) return;
    add('rech.fichiers', fs.map(f => {
      const sn = score(f.nom, q); let sous = taille(f.taille) + ' · ' + nomApp(sys.apps.get(f.app) || { id: f.app, nom: f.app });
      let sc = sn;
      if (!sn && /^text\/|json/.test(f.type || 'text/plain')) { const c = plier(String(f.contenu).slice(0, 200000)), i = c.indexOf(q); if (i >= 0) { sc = .7; sous = '… ' + String(f.contenu).slice(Math.max(0, i - 24), i + 40).replace(/\s+/g, ' ') + ' …'; } }
      return { s: sc, ic: iconeApp({ id: 'fichiers', systeme: true }), titre: f.nom, sous, faire: () => ouvrir('fichiers', { page: 'editer', arg: f.id }) };
    }));
  }
  if (jet !== rechJeton) return;
  box.replaceChildren(); let n = 0;
  for (const g of groupes) {
    const gid = uid('g');
    box.append(h('div', { class: 'groupe-res', role: 'group', 'aria-labelledby': gid }, h('h3', { id: gid }, t(g.cle)),
      g.items.map(it => h('button', { class: 'res', role: 'option', id: uid('r'), 'aria-selected': 'false', tabindex: '-1', onclick: () => { it.faire(); } }, it.ic, h('span', { class: 'pl' }, h('span', {}, surligner(it.titre, q)), it.sous ? h('small', {}, it.sous) : null)))));
    n += g.items.length;
  }
  if (!n) box.append(h('p', { class: 'muet' }, q ? t('aucunResultat') : t('rechVide')));
  selectionRes(0);
  if (q) annoncer(t('resultatsN', { n }));
}
function selectionRes(i) {
  const rs = $$('#rechRes .res'); const inp = $('#rechInput');
  rs.forEach((r, k) => r.setAttribute('aria-selected', String(k === i)));
  if (rs[i]) { inp.setAttribute('aria-activedescendant', rs[i].id); rs[i].scrollIntoView({ block: 'nearest' }); } else inp.removeAttribute('aria-activedescendant');
}
function ouvrirRecherche() {
  ouvrirFeuille('fRech', () => { $('#rechInput').value = ''; chercher(''); }, '#rechInput');
}

/* ---------- Notifications ---------- */
function ouvrirNotifs() { ouvrirFeuille('fNotifs', rendreNotifs); }
function rendreNotifs() {
  const box = $('#notifsListe'); box.replaceChildren();
  if (R().get('nePasDeranger')) box.append(h('div', { class: 'notif' }, h('span', { class: 'icone', style: { background: '#5e5ce6' } }, svg(I.lune)), h('b', {}, t('dndActif')), h('span'), h('p', {}, t('dndTxt'))));
  const gs = sys.notifs.groupes();
  if (!gs.length) { box.append(h('p', { class: 'muet' }, t('aucuneNotif'))); return; }
  for (const g of gs) {
    const a = sys.apps.get(g.app) || { id: g.app === 'aypona' ? 'aypona' : g.app, nom: g.app };
    box.append(h('section', { class: 'groupe-notif', 'aria-label': nomApp(a) },
      h('header', {}, h('b', {}, g.app === 'aypona' ? 'Aypona OS' : nomApp(a), g.nonLues ? ' · ' + t('nonLuesN', { n: g.nonLues }) : ''), bouton(t('effacer'), () => { sys.notifs.retirerApp(g.app); rendreNotifs(); }, 'petit')),
      g.items.slice(0, 8).map(n => h('article', { class: 'notif' + (n.lue ? '' : ' nonlue') }, iconeApp(g.app === 'aypona' ? { id: 'aypona' } : a), h('b', {}, n.titre || '—'), h('time', { datetime: new Date(n.t).toISOString() }, quand(n.t)), h('p', {}, n.texte)))));
  }
}

/* ---------- Centre de contrôle ---------- */
function basculer(k) { R().set(k, !R().get(k)); ile(t('ctrl.' + k) + ' : ' + (R().get(k) ? t('active') : t('desactive'))); }
function ouvrirCentre() { ouvrirFeuille('fCtrl', rendreCentre); }
async function rendreCentre() {
  const box = $('#ctrlTuiles'), r = R();
  const tog = (k, ic, extra) => h('button', { class: 'tuile-ctrl' + (extra || ''), 'aria-pressed': String(!!r.get(k)), onclick: () => { basculer(k); rendreCentre(); } }, h('span', { class: 'rond' }, svg(I[ic])), h('span', {}, t('ctrl.' + k), h('small', {}, r.get(k) ? t('active') : t('desactive'))));
  const tid = uid('tx');
  const curseur = h('input', { type: 'range', min: '85', max: '150', step: '5', value: String(r.get('texte')), id: tid, style: { flex: '1 1 8rem', accentColor: 'var(--gold)', minHeight: '2.75rem' }, 'aria-valuetext': r.get('texte') + ' %' });
  curseur.addEventListener('change', () => { R().set('texte', +curseur.value); });
  curseur.addEventListener('input', () => { curseur.setAttribute('aria-valuetext', curseur.value + ' %'); $('#txVal').textContent = curseur.value + ' %'; });
  const e = await st.estimation(); const ts = st.get('meta.sauvegarde', 0);
  box.replaceChildren(
    tog('nePasDeranger', 'lune', ' lune-on'), tog('mouvement', 'mouvement'), tog('contraste', 'contraste'), tog('transparence', 'verre'),
    h('button', { class: 'tuile-ctrl', onclick: () => { R().set('langue', i18n.langue === 'fr' ? 'en' : 'fr'); rendreCentre(); } }, h('span', { class: 'rond' }, svg(I.langue)), h('span', {}, t('ctrl.langue'), h('small', {}, i18n.langue === 'fr' ? 'Français' : 'English'))),
    h('div', { class: 'tuile-ctrl' }, h('span', { class: 'rond' }, svg(I.reseau)), h('span', {}, t('ctrl.reseau'), h('small', {}, navigator.onLine ? t('enLigne') : t('horsLigne')))),
    h('div', { class: 'tuile-ctrl large' }, h('span', { class: 'rond' }, svg(I.texte)), h('label', { for: tid, style: { fontWeight: 600, fontSize: '.85rem' } }, t('ctrl.texte')), curseur, h('span', { id: 'txVal', class: 'mono' }, r.get('texte') + ' %')),
    h('div', { class: 'tuile-ctrl large' }, h('span', { class: 'rond' }, svg(I.disque)), h('span', { style: { flex: 1 } }, t('mode.' + st.mode), h('small', {}, (e.quota ? t('utiliseSur', { u: taille(e.usage), q: taille(e.quota) }) : taille(e.usage)) + (e.persistant ? ' · ' + t('durable') : ''))), bouton(t('reglages'), () => ouvrir('reglages', { page: 'stockage' }), 'petit')),
    h('div', { class: 'tuile-ctrl large' }, h('span', { class: 'rond' }, svg(I.sauvegarde)), h('span', { style: { flex: 1 } }, t('w.sauvegarde'), h('small', {}, ts ? quand(ts) : t('jamais'))), bouton(t('exporter'), exporter, 'bleu petit'), bouton(t('importer'), () => importer(), 'petit')),
  );
}

/* ---------- Sélecteur d'apps ouvertes / côte à côte ---------- */
function ouvrirSelecteur(mode = 'ouvertes') { E.selMode = mode; ouvrirFeuille('fSel', rendreSelecteur); }
function rendreSelecteur() {
  const box = $('#selCorps'); box.replaceChildren();
  const cote = E.selMode === 'cote';
  $('#tSel').textContent = cote ? t('choisirCote') : t('appsOuvertes'); $('#selTout').hidden = cote || !E.ouvertes.length;
  const carte = (a, ouverte) => h('div', { class: 'carte-sel' },
    h('button', { style: { display: 'grid', gap: '.5rem', justifyItems: 'center', width: '100%' }, onclick: () => { fermerFeuille(null, true); ouvrir(a.id, { cote }); }, 'aria-label': (cote ? t('ouvrirCote', { app: nomApp(a) }) : t('ouvrirApp', { app: nomApp(a) })) }, iconeApp(a), h('b', {}, nomApp(a)), h('small', {}, ouverte ? t('ouverte') : t('app.' + (a.systeme ? 'systeme' : 'installee')))),
    ouverte && !cote ? h('button', { class: 'x', 'aria-label': t('fermerApp', { app: nomApp(a) }), onclick: () => { fermer(a.id); rendreSelecteur(); } }, '×') : null);
  if (cote) {
    const autres = sys.apps.toutes().filter(a => !E.visibles.includes(a.id));
    box.append(h('div', { class: 'cartes-sel' }, autres.map(a => carte(a, E.ouvertes.some(o => o.id === a.id)))));
    return;
  }
  if (E.ouvertes.length) box.append(h('div', { class: 'cartes-sel' }, E.ouvertes.map(o => carte(sys.apps.get(o.id), true))));
  else box.append(h('p', { class: 'muet' }, t('aucuneOuverte')));
  const rec = sys.recents.liste().filter(r => !E.ouvertes.some(o => o.id === r.id)).map(r => sys.apps.get(r.id));
  if (rec.length) box.append(h('section', { class: 'sec' }, h('h3', {}, t('recentes')), h('div', { class: 'cartes-sel' }, rec.map(a => carte(a, false)))));
}

/* ---------- Aide (raccourcis) ---------- */
const RACCOURCIS = [['Ctrl/⌘ K', 'k.rech'], ['/', 'k.rech'], ['Alt N', 'k.notifs'], ['Alt C', 'k.centre'], ['Alt O', 'k.ouvertes'], ['Alt H', 'k.accueil'], ['Alt W', 'k.fermer'], ['Alt ← →', 'k.volet'], ['Échap / Esc', 'k.echap'], ['?', 'k.aide'], ['← → ↑ ↓', 'k.fleches']];
const tableRaccourcis = () => h('div', { class: 'raccourcis' }, RACCOURCIS.flatMap(([k, d]) => [h('span', {}, k.split(' ').map((x, i) => [i ? ' ' : '', h('kbd', {}, x)])), h('span', {}, t(d))]));
function ouvrirAide() { ouvrirFeuille('fAide', () => { $('#aideCorps').replaceChildren(tableRaccourcis()); }); }

/* ---------- Sauvegarde ---------- */
async function exporter() {
  try {
    const s = await creerSauvegarde(st);
    const d = new Date(), nom = 'aypona-sauvegarde-' + d.toISOString().slice(0, 10) + '.aypona';
    telecharger(nom, new Blob([JSON.stringify(s)], { type: 'application/json' }));
    st.set('meta.sauvegarde', Date.now()); ile(t('sauvFaite', { n: s.fichiers.length })); rendreWidgets();
    if (E.feuille === 'fCtrl') rendreCentre();
  } catch (e) { journal.erreur(e, 'export'); ile(t('erreurExport')); }
}
function importer() {
  const inp = h('input', { type: 'file', accept: '.aypona,application/json,.json', hidden: true });
  inp.addEventListener('change', async () => {
    const f = inp.files[0]; inp.remove(); if (!f) return;
    const r = await inspecterSauvegarde(await f.text());
    if (!r.ok) { await dialogue({ titre: t('importRefuse'), texte: r.errors.map(e => t('sauvErr.' + e)).join(' '), actions: [{ txt: t('ok'), v: 1, annuler: true }] }); return; }
    const choix = await dialogue({
      titre: t('importTitre'), texte: t('importResume', { d: new Date(r.resume.cree).toLocaleString(i18n.langue === 'en' ? 'en-GB' : 'fr-FR'), f: r.resume.fichiers, a: r.resume.apps, s: r.resume.systeme }),
      actions: [{ txt: t('fusionner'), v: 'fusionner', cls: 'gras' }, { txt: t('remplacer'), v: 'remplacer', cls: 'rouge' }, { txt: t('annuler'), v: null, annuler: true }],
    });
    if (!choix) return;
    if (choix === 'remplacer' && !(await confirmer(t('remplacerQ'), t('remplacerTxt'), t('remplacer'), true))) return;
    await restaurerSauvegarde(st, r.sauvegarde, choix);
    appliquer(); rendreAccueil(); rafraichirVues(); ile(t('importFait'));
  });
  document.body.append(inp); inp.click();
}

/* =====================================================================
   APPS SYSTÈME
   ===================================================================== */
function enTete(o, titre, retour) {
  return [retour ? h('div', { class: 'nav-vue' }, h('button', { class: 'retour', onclick: retour }, svg(I.retour), t('retour'))) : null, h('h2', { class: 'titre-vue' }, titre)];
}
const VUES = {};

/* ----- Réglages ----- */
VUES.reglages = (corps, o) => {
  const go = (page, arg) => { o.page = page; o.arg = arg; corps.replaceChildren(); corps.scrollTop = 0; const v = h('div', { class: 'vue' }); corps.append(v); (PAGES[page] || PAGES.racine)(v, arg); const f = $('.retour', v) || $('.titre-vue', v); if (page !== 'racine' && f) { f.tabIndex = f.tabIndex < 0 ? -1 : f.tabIndex; f.focus(); } };
  o.naviguer = go;
  const racine = () => go('racine');
  const r = R();
  const PAGES = {
    racine(v) {
      const it = (p, ic, fond, val) => ligne({ icone: I[ic] || ic, fond, libelle: t('reg.' + p), valeur: val, chevron: true, onclick: () => go(p) });
      v.append(h('h2', { class: 'titre-vue' }, t('app.reglages')),
        liste(it('fond', 'image', '#5e5ce6', t('fond.' + r.get('fond'))), it('affichage', 'texte', '#0a84ff', r.get('texte') + ' %'), it('langue', 'langue', '#30b0c7', r.get('langue') === 'fr' ? 'Français' : 'English')),
        liste(it('notifs', 'cloche', '#ff453a', r.get('nePasDeranger') ? t('ctrl.nePasDeranger') : null), it('confidentialite', 'cle', '#0a84ff'), it('apps', 'grille', '#ff9f0a', String(sys.apps.installees().length))),
        liste(it('stockage', 'disque', '#8e8e93', t('mode.' + st.mode)), it('dev', 'code', '#636366', r.get('dev') ? t('active') : null), it('apropos', 'info', '#8e8e93', VERSION)));
    },
    fond(v) {
      v.append(...enTete(o, t('reg.fond'), racine), h('div', { class: 'fonds', role: 'group', 'aria-label': t('reg.fond') }, FONDS.map(f => h('button', { 'aria-pressed': String(r.get('fond') === f), onclick: () => { R().set('fond', f); go('fond'); } }, h('span', { class: 'ech' }, h('span', { class: 'fond', 'data-f': f })), t('fond.' + f)))));
    },
    affichage(v) {
      const tid = uid('t'); const cur = h('input', { type: 'range', id: tid, min: '85', max: '150', step: '5', value: String(r.get('texte')), 'aria-valuetext': r.get('texte') + ' %' });
      const val = h('b', {}, r.get('texte') + ' %');
      cur.addEventListener('input', () => { val.textContent = cur.value + ' %'; cur.setAttribute('aria-valuetext', cur.value + ' %'); });
      cur.addEventListener('change', () => R().set('texte', +cur.value));
      v.append(...enTete(o, t('reg.affichage'), racine),
        sec(t('ctrl.texte'), h('div', { class: 'champ' }, h('label', { for: tid }, t('texteAide'), ' ', val), cur, h('p', { style: { fontSize: '1rem' } }, t('texteApercu')))),
        sec(t('accessibilite'), liste(
          interrupteur(t('ctrl.contraste'), r.get('contraste'), x => R().set('contraste', x), t('contrasteAide')),
          interrupteur(t('ctrl.transparence'), r.get('transparence'), x => R().set('transparence', x), t('transparenceAide')),
          interrupteur(t('ctrl.mouvement'), r.get('mouvement'), x => R().set('mouvement', x), t('mouvementAide')))),
        sec(t('widgets'), liste(WIDGETS.map(w => interrupteur(t('w.' + w), r.get('widgets').includes(w), x => {
          const l = R().get('widgets').filter(y => y !== w); if (x) { if (l.length >= 4) { ile(t('widgetsMax')); go('affichage'); return; } l.push(w); }
          R().set('widgets', WIDGETS.filter(y => l.includes(y)));
        }))), t('widgetsAide')),
        sec(t('accueil'), liste(ligne({ libelle: t('modifierAccueil'), cls: 'bleu', onclick: () => { allerAccueil(); basculerEdition(true); } }))));
    },
    langue(v) {
      v.append(...enTete(o, t('reg.langue'), racine), h('div', { class: 'liste', role: 'radiogroup', 'aria-label': t('reg.langue') },
        [['fr', 'Français'], ['en', 'English']].map(([l, n]) => h('button', { class: 'ligne', role: 'radio', 'aria-checked': String(r.get('langue') === l), onclick: () => { R().set('langue', l); } }, h('span', { class: 'pl', lang: l }, n), r.get('langue') === l ? h('span', { class: 'pv', style: { color: 'var(--blue-ink)' } }, '✓') : null))));
    },
    notifs(v) {
      const inst = sys.apps.installees();
      v.append(...enTete(o, t('reg.notifs'), racine),
        sec(null, liste(interrupteur(t('ctrl.nePasDeranger'), r.get('nePasDeranger'), x => R().set('nePasDeranger', x), t('dndAide')))),
        sec(t('parApp'), inst.length ? liste(inst.map(m => interrupteur(m.nom, (r.get('notifApps') || {})[m.id] !== false, x => { const na = { ...(R().get('notifApps') || {}) }; if (x) delete na[m.id]; else na[m.id] = false; R().set('notifApps', na); }, (m.permissions || []).includes('notifications') ? t('perm.etat.' + sys.permissions.etat(m, 'notifications')) : t('neDemandePas')))) : h('p', { class: 'pied' }, t('aucuneApp'))));
    },
    confidentialite(v) {
      const inst = sys.apps.installees().filter(m => (m.permissions || []).length);
      v.append(...enTete(o, t('reg.confidentialite'), racine), h('div', { class: 'prose' }, t('confTxt')));
      if (!inst.length) { v.append(h('p', { class: 'pied' }, t('confVide'))); return; }
      inst.forEach(m => v.append(sec(m.nom, liste(m.permissions.map(p => {
        const id = uid('p'); const cur = (sys.permissions.table()[m.id] || {})[p] || 'demander';
        const sel = h('select', { id, onchange: e => sys.permissions.regler(m.id, p, e.target.value) }, ['demander', 'toujours', 'refuse'].map(x => h('option', { value: x, selected: x === cur || null }, t('perm.choix.' + x))));
        return h('div', { class: 'ligne' }, h('label', { class: 'pl', for: id }, t('perm.' + p), h('small', {}, t('perm.texte.' + p))), sel);
      })))));
    },
    apps(v, id) {
      if (id) return PAGES.app(v, id);
      const inst = sys.apps.installees();
      v.append(...enTete(o, t('reg.apps'), racine), h('div', { class: 'legende' }, Object.keys(DOMICILES).map(domChip)));
      v.append(inst.length ? liste(inst.map(m => ligne({ icone: iconeApp(m), libelle: m.nom, sous: m.studio + ' · ' + m.version, droite: domChip(m.domicile), chevron: true, onclick: () => go('apps', m.id) }))) : h('div', { class: 'prose' }, t('aucuneAppTxt')));
    },
    app(v, id) {
      const m = sys.apps.installees().find(x => x.id === id); if (!m) return go('apps');
      v.append(...enTete(o, m.nom, () => go('apps')),
        h('div', { style: { display: 'flex', gap: '.8rem', alignItems: 'center' } }, iconeApp(m), h('div', {}, h('b', {}, m.nom), h('div', { style: { color: 'var(--ink-2)', fontSize: '.85rem' } }, m.studio + ' · ' + m.version))),
        m.description ? h('div', { class: 'prose' }, m.description) : null,
        sec(null, liste(ligne({ libelle: t('domicile'), droite: domChip(m.domicile) }), ligne({ libelle: t('source'), valeur: t('src.' + m.source) }), ligne({ libelle: t('installeeLe'), valeur: new Date(m.installe).toLocaleDateString(i18n.langue === 'en' ? 'en-GB' : 'fr-FR') }), ligne({ libelle: t('permissions'), valeur: m.permissions.length ? m.permissions.map(p => t('perm.' + p)).join(', ') : t('aucune') }))));
      if (m.domicile === 'prive') {
        const inp = h('input', { type: 'url', id: uid('pa'), value: sys.apps.adressePrivee(m.id), placeholder: 'https://…' });
        v.append(sec(t('priveAdresse'), [h('div', { class: 'champ' }, h('label', { for: inp.id }, t('priveAide')), inp), h('div', { class: 'boutons' }, bouton(t('enregistrer'), () => ile(sys.apps.reglerAdressePrivee(m.id, inp.value.trim()) ? t('adresseOk') : t('adresseInvalide')), 'bleu petit'))]));
      }
      v.append(h('div', { class: 'boutons' }, bouton(t('ouvrir'), () => ouvrir(m.id), 'bleu'), bouton(t('desinstaller'), async () => {
        if (!(await confirmer(t('desinstallerQ', { app: m.nom }), t('desinstallerTxt'), t('desinstaller'), true))) return;
        fermer(m.id); await sys.apps.desinstaller(m.id); ile(t('desinstallee', { app: m.nom })); go('apps');
      }, 'rouge')));
    },
    async stockage(v) {
      const e = await st.estimation(); const ts = st.get('meta.sauvegarde', 0), rep = st.get('meta.reprise', null), v02 = lireV02();
      const pct = e.quota ? Math.min(100, e.usage / e.quota * 100) : 0;
      v.append(...enTete(o, t('reg.stockage'), racine),
        sec(t('espace'), [liste(ligne({ libelle: t('mode'), valeur: t('mode.' + st.mode) }), ligne({ libelle: t('utilise'), valeur: e.quota ? t('utiliseSur', { u: taille(e.usage), q: taille(e.quota) }) : taille(e.usage) }), ligne({ libelle: t('durable'), valeur: e.persistant ? t('oui') : t('non') })),
          e.quota ? h('div', { class: 'jauge', role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(pct)), 'aria-label': t('utilise') }, h('i', { style: { width: Math.max(2, pct) + '%' } })) : null], t('modeAide.' + st.mode)),
        h('div', { class: 'boutons' }, bouton(t('rendreDurable'), async () => { ile((await st.rendreDurable()) ? t('durableOk') : t('durableNon')); go('stockage'); }, 'petit', { disabled: e.persistant || st.mode !== 'indexeddb' || null })),
        sec(t('w.sauvegarde'), [liste(ligne({ libelle: t('derniere'), valeur: ts ? quand(ts) : t('jamais') })), h('div', { class: 'boutons' }, bouton(t('exporter'), exporter, 'bleu'), bouton(t('importer'), () => importer()))], t('sauvAide')),
        sec(t('repriseTitre'), [h('div', { class: 'prose' }, rep ? t('repriseFaite', { d: new Date(rep.t).toLocaleDateString(i18n.langue === 'en' ? 'en-GB' : 'fr-FR'), a: rep.apps, f: rep.fichiers }) : (v02 ? t('repriseDispo') : t('repriseAucune'))),
          v02 ? h('div', { class: 'boutons' }, bouton(t('reprendre'), async () => { const n = await sys.reprendre(v02); ile(t('repriseOk', { a: n.apps, f: n.fichiers })); appliquer(); rendreAccueil(); go('stockage'); }, 'petit')) : null]),
        sec(t('zoneDanger'), liste(ligne({ libelle: t('reinitialiser'), cls: 'rouge', onclick: async () => {
          if (!(await confirmer(t('reinitQ'), t('reinitTxt'), t('reinitialiser'), true))) return;
          E.ouvertes.slice().forEach(detruireVolet); await st.effacerTout(); st.set('meta.premier', Date.now()); appliquer(); allerAccueil(); ile(t('reinitFait'));
        } }))));
    },
    dev(v) {
      v.append(...enTete(o, t('reg.dev'), racine), sec(null, liste(interrupteur(t('modeDev'), r.get('dev'), x => { R().set('dev', x); go('dev'); }, t('modeDevAide')))));
      v.append(sec(t('kit'), [h('div', { class: 'prose' }, t('kitTxt')), h('div', { class: 'boutons' }, h('a', { class: 'b bleu', href: 'sdk/index.html', target: '_blank', rel: 'noopener' }, t('kitOuvrir')), bouton(t('kitEssai'), essaiKit))]));
      if (!r.get('dev')) return;
      const ta = h('textarea', { class: 'code', id: uid('mf'), spellcheck: 'false' }); ta.value = JSON.stringify(exemple(), null, 2);
      const msgs = h('ul', { class: 'msgs', 'aria-live': 'polite' });
      const lire = () => { msgs.replaceChildren(); let m; try { m = JSON.parse(ta.value); } catch (e) { msgs.append(h('li', {}, t('jsonInvalide'))); return null; } const res = valider(m); if (res.ok) msgs.append(h('li', { class: 'ok' }, t('manifesteOk'))); else res.errors.forEach(x => msgs.append(h('li', {}, x))); return res; };
      v.append(sec(t('installerManifeste'), [h('div', { class: 'champ' }, h('label', { for: ta.id }, t('manifesteJson')), ta), msgs, h('div', { class: 'boutons' }, bouton(t('verifier'), lire, 'petit'), bouton(t('installer'), () => { const res = lire(); if (res && res.ok) { sys.apps.installer(res.manifeste, 'local'); ile(t('installee', { app: res.manifeste.nom })); rendreAccueil(); } }, 'bleu petit'))], t('installerAide')));
      const j = hote.journal();
      v.append(sec(t('journalMsg'), j.length ? h('ul', { class: 'journal' }, j.slice(0, 40).map(x => h('li', {}, h('time', {}, heureCourte(x.t)), h('span', {}, x.app + ' · ' + x.type + ' · ' + (x.ok ? 'ok' : 'erreur') + ' · ' + x.ms + ' ms')))) : h('p', { class: 'pied' }, t('journalVide'))));
    },
    apropos(v) {
      const nouv = ['pwa', 'stockage', 'recherche', 'centre', 'multitache', 'permissions', 'kit', 'access', 'demarrage', 'dnd', 'diag', 'tests'];
      v.append(...enTete(o, t('reg.apropos'), racine),
        h('div', { style: { display: 'grid', justifyItems: 'center', gap: '.4rem', padding: '.6rem 0' } }, iconeApp({ id: 'aypona' }), h('b', { style: { fontSize: '1.3rem' } }, 'Aypona OS ' + VERSION), h('small', { style: { color: 'var(--ink-2)' } }, t('bureau'))),
        sec(null, liste(ligne({ libelle: t('version'), valeur: VERSION }), ligne({ libelle: 'Build', valeur: BUILD }), ligne({ libelle: t('schema'), valeur: String(SCHEMA) }), ligne({ libelle: t('demarrage'), valeur: (mesures.pret || 0) + ' ms' }), ligne({ libelle: t('mode'), valeur: t('mode.' + st.mode) }))),
        sec(t('nouveautes'), h('div', { class: 'prose' }, h('ul', {}, nouv.map(n => h('li', {}, t('nouv.' + n)))))),
        sec(t('garde'), h('div', { class: 'prose' }, t('gardeTxt'))));
    },
  };
  go('racine');
};

/* ----- App Store (catalogue de la ville, lecture seule) ----- */
VUES.store = (corps, o) => {
  const rendre = () => {
    const v = h('div', { class: 'vue' }); corps.replaceChildren(v);
    const etat = sys.ville.etat, copie = sys.ville.copie();
    v.append(h('h2', { class: 'titre-vue' }, t('app.store')),
      h('div', { class: 'prose' }, t('storeTxt'), h('div', { class: 'legende' }, Object.keys(DOMICILES).map(domChip))),
      h('p', { class: 'pied', role: 'status' }, etat === 'direct' ? t('ville.direct') : etat === 'copie' ? t('ville.copie', { d: quand(copie && copie.t) }) : t('ville.hors')));
    const cat = sys.ville.apps(), pub = cat.filter(c => sys.ville.statut(c) === 'publiee'), aud = cat.filter(c => sys.ville.statut(c) === 'audit');
    const carte = c => {
      const m = c.manifeste, inst = sys.apps.installees().some(x => x.id === m.id), ok = sys.ville.statut(c) === 'publiee';
      const reste = Math.max(0, Math.ceil((c.demande + 12 * 36e5 - Date.now()) / 36e5));
      return h('div', { class: 'carte-app' }, iconeApp(m), h('b', {}, m.nom), h('small', {}, m.studio + ' · ' + m.version + ' · ', domChip(m.domicile), ok ? '' : ' · ' + t('auditReste', { n: reste })),
        h('div', { class: 'act' }, inst ? bouton(t('ouvrir'), () => ouvrir(m.id), 'petit') : bouton(t('installer'), () => { if (sys.apps.installer(m, 'ville').ok) { ile(t('installee', { app: m.nom })); rendre(); rendreAccueil(); } }, 'bleu petit', { disabled: !ok || null })));
    };
    v.append(sec(t('publiees'), pub.length ? liste(pub.map(carte)) : h('div', { class: 'prose' }, t('aucunePubliee'))));
    if (aud.length) v.append(sec(t('enAudit'), liste(aud.map(carte)), t('auditAide')));
  };
  o.naviguer = rendre; rendre();
  o.off = bus.on('ville', () => { if (document.contains(corps)) rendre(); });
};

/* ----- Fichiers ----- */
const estTexte = ty => /^text\/|json|xml|javascript/.test(ty || 'text/plain');
VUES.fichiers = (corps, o) => {
  const go = (page, arg) => { o.page = page; o.arg = arg; corps.replaceChildren(); const v = h('div', { class: 'vue' }); corps.append(v); (page === 'editer' ? editer : lister)(v, arg); };
  o.naviguer = go;
  async function lister(v) {
    const fs = await sys.fichiers.liste(); const total = fs.reduce((s, f) => s + f.taille, 0), plafond = await st.plafondFichiers();
    v.append(h('h2', { class: 'titre-vue' }, t('app.fichiers')),
      h('div', { class: 'boutons' }, bouton(t('nouveau'), () => go('editer'), 'bleu'), bouton(t('importer'), importerFichier)),
      h('p', { class: 'pied' }, t('fichiersEspace', { n: fs.length, u: taille(total), q: taille(plafond) })));
    if (!fs.length) { v.append(h('div', { class: 'prose' }, t('fichiersVide'))); return; }
    const parApp = new Map(); fs.forEach(f => { if (!parApp.has(f.app)) parApp.set(f.app, []); parApp.get(f.app).push(f); });
    for (const [app, l] of parApp) {
      const a = sys.apps.get(app) || { id: app, nom: app };
      v.append(sec(app === 'fichiers' ? t('mesFichiers') : nomApp(a), liste(l.map(f => ligne({ icone: estTexte(f.type) ? I.fichier : I.image, fond: estTexte(f.type) ? '#0a84ff' : '#ff9f0a', libelle: f.nom, sous: taille(f.taille) + ' · ' + quand(f.modifie), chevron: true, onclick: () => go('editer', f.id) })))));
    }
  }
  function importerFichier() {
    const inp = h('input', { type: 'file', hidden: true });
    inp.addEventListener('change', async () => {
      const f = inp.files[0]; inp.remove(); if (!f) return;
      if (f.size > 5 * 1024 * 1024) { ile(t('err.trop-gros')); return; }
      const texte = estTexte(f.type) || /\.(txt|md|csv|json|html|css|js)$/i.test(f.name);
      const contenu = texte ? await f.text() : await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); });
      const res = await sys.fichiers.enregistrer({ nom: f.name, contenu, type: f.type || (texte ? 'text/plain' : 'application/octet-stream'), app: 'fichiers' });
      ile(res.ok ? t('fichierImporte', { nom: res.fichier.nom }) : t('err.' + res.error)); go('liste');
    });
    document.body.append(inp); inp.click();
  }
  async function editer(v, id) {
    const f = id ? await sys.fichiers.get(id) : null;
    if (id && !f) return go('liste');
    const nid = uid('fn'), cid = uid('fc');
    const nom = h('input', { id: nid, value: f ? f.nom : t('nouveauNom') + ' ' + new Date().toLocaleDateString(i18n.langue === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short' }).replace(/\.$/, '') + '.txt', autocomplete: 'off' });
    v.append(...enTete(o, f ? f.nom : t('nouveau'), () => go('liste')));
    if (f && f.app !== 'fichiers') v.append(h('p', { class: 'pied' }, t('fichierDe', { app: nomApp(sys.apps.get(f.app) || { id: f.app, nom: f.app }) })));
    const texte = !f || estTexte(f.type);
    let zone = null;
    if (texte) { zone = h('textarea', { id: cid, spellcheck: 'true' }); zone.value = f ? f.contenu : ''; }
    v.append(h('div', { class: 'champ' }, h('label', { for: nid }, t('nom')), nom),
      texte ? h('div', { class: 'champ' }, h('label', { for: cid }, t('contenu')), zone) : (/^image\//.test(f.type) && /^data:image\//.test(f.contenu) ? h('img', { class: 'apercu', src: f.contenu, alt: f.nom }) : h('div', { class: 'prose' }, t('pasDApercu'))));
    v.append(h('div', { class: 'boutons' },
      bouton(t('enregistrer'), async () => { const r = await sys.fichiers.enregistrer({ id: f && f.id, nom: nom.value, contenu: texte ? zone.value : f.contenu, type: f ? f.type : 'text/plain', app: f ? f.app : 'fichiers' }); if (r.ok) { ile(t('fichierEnregistre')); go('editer', r.fichier.id); } else ile(t('err.' + r.error)); }, 'bleu'),
      f ? bouton(t('telecharger'), async () => { const blob = /^data:/.test(f.contenu) ? await (await fetch(f.contenu)).blob() : new Blob([f.contenu], { type: f.type }); telecharger(f.nom, blob); }) : null,
      f ? bouton(t('supprimer'), async () => { if (await confirmer(t('supprimerQ', { nom: f.nom }), t('supprimerTxt'), t('supprimer'), true)) { await sys.fichiers.supprimer(f.id); ile(t('fichierSupprime')); go('liste'); } }, 'rouge') : null));
    if (!f) nom.select();
  }
  go('liste');
};

/* ----- Diagnostic ----- */
VUES.moniteur = (corps, o) => {
  const rendre = () => {
    const v = h('div', { class: 'vue' }); corps.replaceChildren(v);
    const ok = E.tests.filter(x => x.ok).length, tot = E.tests.length;
    v.append(h('h2', { class: 'titre-vue' }, t('app.moniteur')),
      sec(null, liste(ligne({ libelle: t('tests'), valeur: tot ? ok + ' / ' + tot : t('testsEnCours') }), ligne({ libelle: t('demarrage'), valeur: (mesures.pret || 0) + ' ms', sous: t('demarrageAide', { a: mesures.modules || 0, b: mesures.stockage || 0 }) }), ligne({ libelle: t('mode'), valeur: t('mode.' + st.mode) }), ligne({ libelle: t('erreurs'), valeur: String(journal.liste('erreur').length) }))),
      h('div', { class: 'boutons' }, bouton(t('relancer'), async () => { await executerTests(); }, 'bleu petit'), bouton(t('viderJournal'), () => { journal.vider(); rendre(); }, 'petit')));
    if (tot) {
      const groupes = [...new Set(E.tests.map(x => x.groupe))];
      v.append(sec(t('resultats'), h('ul', { class: 'journal' }, groupes.flatMap(g => E.tests.filter(x => x.groupe === g).map(x => h('li', {}, h('span', { class: x.ok ? 'test-ok' : 'test-ko', 'aria-label': x.ok ? t('reussi') : t('echoue') }, x.ok ? '✓' : '✗'), h('span', {}, g + ' · ' + x.nom + (x.detail ? ' — ' + x.detail : ''))))))));
    }
    const errs = journal.liste('erreur').slice(0, 30);
    v.append(sec(t('journalErreurs'), errs.length ? h('ul', { class: 'journal' }, errs.map(l => h('li', {}, h('time', {}, heureCourte(l.t)), h('span', {}, l.quoi + ' · ' + l.d)))) : h('p', { class: 'pied' }, t('aucuneErreur'))));
    const evts = journal.liste().filter(l => l.type !== 'erreur').slice(0, 30);
    v.append(sec(t('journalSysteme'), h('ul', { class: 'journal' }, evts.map(l => h('li', {}, h('time', {}, heureCourte(l.t)), h('span', {}, l.type + ' · ' + l.quoi + (l.d ? ' · ' + l.d : '')))))));
  };
  o.naviguer = rendre; rendre();
  o.off = bus.on('tests', () => { if (document.contains(corps)) rendre(); });
};

/* ----- Astuces ----- */
VUES.astuces = corps => {
  const v = h('div', { class: 'vue' }); corps.append(v);
  v.append(h('h2', { class: 'titre-vue' }, t('app.astuces')),
    h('div', { class: 'prose' }, h('ul', {}, ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'].map(k => h('li', {}, t('astuce.' + k))))),
    sec(t('raccourcis'), tableRaccourcis()));
};

/* ----- App d'exemple du kit (essai, jamais installée) ----- */
function essaiKit() {
  sys.apps.essai = { id: 'exemple-kit', nom: t('kitNomEssai'), studio: 'Nativus', version: '1.0.0', domicile: 'public', entree: 'sdk/exemple.html', icone: { couleur: '#4fe0a8', glyphe: 'K' }, permissions: ['notifications', 'fichiers'], description: '' };
  ouvrir('exemple-kit');
}

/* =====================================================================
   TESTS, SERVICE WORKER, CLAVIER, DÉMARRAGE
   ===================================================================== */
async function executerTests() {
  E.tests = await lancerTests({ document });
  const ok = E.tests.filter(x => x.ok).length;
  st.set('meta.tests', { t: Date.now(), ok, total: E.tests.length });
  bus.emit('tests', { ok, total: E.tests.length });
  rendreWidgets();
  if (ok < E.tests.length) sys.notifs.ajouter({ app: 'aypona', titre: t('testsEchecT'), texte: t('testsEchecP', { n: E.tests.length - ok }) });
  window.__aypona_tests = { ok, total: E.tests.length, echecs: E.tests.filter(x => !x.ok).map(x => x.groupe + ' · ' + x.nom + (x.detail ? ' — ' + x.detail : '')) };
  return E.tests;
}

function enregistrerSW() {
  try {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
    navigator.serviceWorker.register('sw.js', { scope: './' }).then(reg => {
      E.reg = reg; journal.ajouter('sw', 'enregistré', reg.scope);
      const montrer = () => { if (reg.waiting && navigator.serviceWorker.controller) $('#maj').hidden = false; };
      montrer();
      reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') montrer(); }); });
    }).catch(e => journal.erreur(e, 'sw'));
    let recharge = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (recharge) return; recharge = true; if (E.majDemandee) location.reload(); });
  } catch (e) { journal.erreur(e, 'sw'); }
}

function clavier(e) {
  const tape = e.target.matches && e.target.matches('input,textarea,select,[contenteditable]');
  const dlg = !$('#dlg').hidden;
  if (dlg) return;
  if (e.key === 'Escape') {
    if (E.feuille) { e.preventDefault(); fermerFeuille(); return; }
    if (E.edition) { e.preventDefault(); basculerEdition(false); return; }
  }
  if (E.feuille) pieger(e, $('#' + E.feuille));
  if (E.feuille === 'fRech' && ['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
    const rs = $$('#rechRes .res'), i = rs.findIndex(r => r.getAttribute('aria-selected') === 'true');
    if (e.key === 'Enter') { if (rs[i]) { e.preventDefault(); rs[i].click(); } return; }
    e.preventDefault(); selectionRes(clamp(i + (e.key === 'ArrowDown' ? 1 : -1), 0, rs.length - 1)); return;
  }
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') { e.preventDefault(); E.feuille === 'fRech' ? fermerFeuille() : ouvrirRecherche(); return; }
  if (e.altKey && !e.ctrlKey && !e.metaKey) {
    const a = { KeyN: () => E.feuille === 'fNotifs' ? fermerFeuille() : ouvrirNotifs(), KeyC: () => E.feuille === 'fCtrl' ? fermerFeuille() : ouvrirCentre(), KeyO: () => E.feuille === 'fSel' ? fermerFeuille() : ouvrirSelecteur(), KeyH: () => { fermerFeuille(); allerAccueil(); }, KeyW: () => { if (E.actif && E.visibles.includes(E.actif)) fermer(E.actif); },
      ArrowLeft: () => basculerVolet(), ArrowRight: () => basculerVolet() }[e.code];
    if (a) { e.preventDefault(); a(); return; }
  }
  if (tape) return;
  if (e.key === '/' && !E.feuille) { e.preventDefault(); ouvrirRecherche(); }
  else if (e.key === '?' && !E.feuille) { e.preventDefault(); ouvrirAide(); }
}
function basculerVolet() {
  if (E.visibles.length < 2) return;
  E.actif = E.visibles.find(x => x !== E.actif); afficherScene();
  const o = E.ouvertes.find(x => x.id === E.actif); const tt = o && $('h2', o.el); if (tt) { tt.tabIndex = -1; tt.focus(); }
}

function modeEcran() {
  const tab = mq.matches; if (tab === E.tablette && document.documentElement.classList.contains('pret')) return;
  E.tablette = tab; $('#os').classList.toggle('tablette', tab); document.body.classList.toggle('tablette', tab);
  if (!tab && E.visibles.length > 1) E.visibles = [E.actif || E.visibles[0]];
  evincer(); afficherScene();
}

async function demarrer() {
  st = await creerStockage(); mesurer('stockage');
  sys = creerSysteme(st, bus);
  window.Aypona = { version: VERSION, sys, st, hote: null, E, ouvrir, fermer, allerAccueil, executerTests };
  i18n.set(R().get('langue'));
  hote = creerHote(sys, { langue: () => R().get('langue'), theme, base: location.href }); window.Aypona.hote = hote;
  sys.permissions.prompteur = demanderPermission;
  const premier = !st.get('meta.premier');
  if (premier) {
    st.set('meta.premier', Date.now());
    const v02 = lireV02();
    if (v02) { const n = await sys.reprendre(v02); sys.notifs.ajouter({ app: 'aypona', titre: t('repriseT'), texte: t('repriseP', { a: n.apps, f: n.fichiers }) }); }
    sys.notifs.ajouter({ app: 'aypona', titre: t('bienvenueT'), texte: t('bienvenueP') });
  }
  st.set('meta.demarrages', (st.get('meta.demarrages', 0) || 0) + 1);
  appliquer();
  E.tablette = mq.matches; $('#os').classList.toggle('tablette', E.tablette); document.body.classList.toggle('tablette', E.tablette);
  rendreAccueil(); majHeure();
  document.documentElement.classList.add('pret');
  const dem = $('#demarrage'); dem.classList.add('part'); setTimeout(() => dem.remove(), 300);
  mesurer('pret');

  /* Écouteurs */
  $('#bRech').addEventListener('click', ouvrirRecherche);
  $('#bNotif').addEventListener('click', ouvrirNotifs);
  $('#bCtrl').addEventListener('click', ouvrirCentre);
  $$('[data-ferme]').forEach(b => b.addEventListener('click', () => fermerFeuille()));
  $$('.feuille').forEach(f => f.addEventListener('click', e => { if (e.target === f || e.target.classList.contains('feuille-in')) fermerFeuille(); }));
  $('#notifsLu').addEventListener('click', () => { sys.notifs.toutLu(); rendreNotifs(); });
  $('#notifsVider').addEventListener('click', () => { sys.notifs.vider(); rendreNotifs(); });
  $('#selTout').addEventListener('click', () => { E.ouvertes.slice().forEach(detruireVolet); allerAccueil(); rendreSelecteur(); });
  $('#rechInput').addEventListener('input', e => { clearTimeout(rechT); rechT = setTimeout(() => chercher(e.target.value), 70); });
  $('#grille').addEventListener('keydown', naviguerTuiles); $('#dock').addEventListener('keydown', naviguerTuiles);
  $('#majBtn').addEventListener('click', () => { E.majDemandee = true; if (E.reg && E.reg.waiting) E.reg.waiting.postMessage({ type: 'activer' }); else location.reload(); });
  document.addEventListener('keydown', clavier);
  mq.addEventListener('change', modeEcran);
  const reseau = () => { $('#hors').hidden = navigator.onLine; };
  addEventListener('online', reseau); addEventListener('offline', reseau); reseau();
  setInterval(majHeure, 15000);

  bus.on('reglage', ({ k }) => {
    appliquer(); hote.diffuser(k === 'langue' ? 'langue' : 'theme', k === 'langue' ? R().get('langue') : theme());
    if (k === 'langue') { rafraichirVues(); rendreAccueil(); }
    if (['widgets'].includes(k)) rendreWidgets();
  });
  bus.on('notif', n => { majCompteurs(); if (!n.silencieuse) { const a = sys.apps.get(n.app); ile((n.app === 'aypona' ? 'Aypona OS' : nomApp(a)) + ' · ' + (n.titre || n.texte)); } if (!E.visibles.length) rendreAccueil(); if (E.feuille === 'fNotifs') rendreNotifs(); });
  ['notif:lues', 'notif:retrait'].forEach(ev => bus.on(ev, () => { majCompteurs(); if (!E.visibles.length) rendreAccueil(); }));
  bus.on('apps', () => { if (!E.visibles.length) rendreAccueil(); rafraichirVues(['reglages', 'store']); });
  bus.on('fichiers', () => { if (R().get('widgets').includes('fichiers')) rendreWidgets(); });

  sys.ville.connecter();
  enregistrerSW();
  const idle = window.requestIdleCallback || (f => setTimeout(f, 200));
  idle(() => executerTests(), { timeout: 1500 });
}

demarrer().catch(e => { journal.erreur(e, 'démarrage'); const d = $('#demarrage'); if (d) d.replaceChildren(h('p', { style: { padding: '1.5rem', textAlign: 'center' } }, 'Aypona OS 2 : ' + (e && e.message))); });
