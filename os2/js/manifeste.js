/* =====================================================================
   AYPONA OS 2 · MANIFESTE D'APP v1 (décret n°2 du mandat IV, inchangé)
   Mêmes règles que le validateur de l'App Store de la ville (bureau 102) et que la v0.2.
   Le manifeste est une donnée protégée : toute évolution passe par un décret du Président.
   { id, nom, studio, version, domicile:'prive'|'service'|'public', entree, icone:{couleur,glyphe},
     permissions:['notifications','fichiers'], description }
   ===================================================================== */
import { t } from './i18n.js';

export const STUDIOS = ['Devea', 'Nativus', 'BroNet', '8Pool', 'Neural Pro'];
export const STUDIO_COULEURS = { Devea: '#ff8a65', Nativus: '#4fe0a8', BroNet: '#5cb4ff', '8Pool': '#ffc857', 'Neural Pro': '#b392ff' };
export const DOMICILES = { prive: '#ff6fae', service: '#5ef0ff', public: '#f4f6ff' };
export const PERMISSIONS = ['notifications', 'fichiers'];
export const RESERVES = ['reglages', 'store', 'moniteur', 'astuces', 'fichiers', 'aypona', 'systeme'];

const str = v => typeof v === 'string' ? v.trim() : '';

export function valider(m) {
  const err = [], out = {};
  if (!m || typeof m !== 'object' || Array.isArray(m)) return { ok: false, errors: [t('mf.objet')], manifeste: null };
  out.id = str(m.id);
  if (!/^[a-z][a-z0-9-]{1,31}$/.test(out.id)) err.push(t('mf.id'));
  else if (RESERVES.includes(out.id)) err.push(t('mf.idReserve', { id: out.id }));
  out.nom = str(m.nom);
  if (out.nom.length < 2 || out.nom.length > 24 || /[<>]/.test(out.nom)) err.push(t('mf.nom'));
  out.studio = str(m.studio);
  if (!STUDIOS.includes(out.studio)) err.push(t('mf.studio', { liste: STUDIOS.join(', ') }));
  out.version = str(m.version);
  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(out.version)) err.push(t('mf.version'));
  out.domicile = str(m.domicile);
  if (!DOMICILES[out.domicile]) err.push(t('mf.domicile'));
  out.entree = str(m.entree);
  if (out.domicile === 'prive') { if (out.entree) err.push(t('mf.entreePrive')); }
  else if (DOMICILES[out.domicile]) {
    const rel = /^apps\/[a-z0-9-]+\/[A-Za-z0-9._\/-]*\.html$/.test(out.entree) && !out.entree.includes('..');
    let https = false;
    try { const u = new URL(out.entree); https = u.protocol === 'https:' && !u.username && !u.password; } catch (e) {}
    if (!out.entree) err.push(t('mf.entreeVide', { dom: t('dom.' + out.domicile) }));
    else if (out.domicile === 'service' && !https) err.push(t('mf.entreeService'));
    else if (out.domicile === 'public' && !https && !rel) err.push(t('mf.entreePublic', { id: out.id || '<id>' }));
    else if (rel && !out.entree.startsWith('apps/' + out.id + '/')) err.push(t('mf.entreeChemin', { id: out.id }));
  }
  const ic = m.icone && typeof m.icone === 'object' ? m.icone : {};
  out.icone = {
    couleur: /^#[0-9a-fA-F]{6}$/.test(ic.couleur || '') ? ic.couleur : '#636366',
    glyphe: [...str(ic.glyphe).replace(/[<>&"']/g, '')].slice(0, 2).join('') || (out.nom[0] || '?').toUpperCase(),
  };
  const perms = m.permissions == null ? [] : m.permissions;
  if (!Array.isArray(perms)) { err.push(t('mf.permListe')); out.permissions = []; }
  else {
    const bad = perms.filter(p => !PERMISSIONS.includes(p));
    if (bad.length) err.push(t('mf.permInconnue', { liste: bad.join(', ') }));
    out.permissions = [...new Set(perms.filter(p => PERMISSIONS.includes(p)))];
  }
  out.description = str(m.description).replace(/[<>]/g, '').slice(0, 140);
  return { ok: !err.length, errors: err, manifeste: err.length ? null : out };
}

export const exemple = () => ({
  id: 'exemple-notes', nom: 'Notes', studio: 'Nativus', version: '1.0.0', domicile: 'public',
  entree: 'https://exemple.github.io/notes/', icone: { couleur: '#ffd60a', glyphe: 'N' },
  permissions: ['fichiers'], description: 'Exemple de manifeste : une app de notes publique.',
});
