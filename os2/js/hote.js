/* =====================================================================
   AYPONA OS 2 · HÔTE D'APPS ISOLÉ
   - Cadre sandbox SANS allow-same-origin : l'app a une origine opaque, elle ne voit ni le
     stockage ni le DOM du système (défaut A1 de l'ancien Aypona OS corrigé).
   - Poignée de main : l'app envoie { aypona:2, type:'connexion' } ; le système lui remet un
     MessageChannel privé. Ensuite tout passe par ce canal : personne d'autre ne peut écouter.
   - Limites : taille d'un message, débit par app, délai de poignée de main.
   - Compatibilité v0.2 : les messages { aypona:1, id, type } restent compris (réponse directe).
   Protocole (requête → réponse { re, ok, data | error }) :
     bonjour · notifier {titre,texte} · fichiers.liste · fichiers.lire {nom}
     fichiers.ecrire {nom,contenu,mime} · fichiers.supprimer {nom}
     stockage.lire {cle} · stockage.ecrire {cle,valeur} · stockage.supprimer {cle}
     permission.etat {nom} · permission.demander {nom}
   Événements poussés par le système : { evenement:'theme'|'langue', valeur }.
   ===================================================================== */
import { VERSION, journal } from './noyau.js';

export const SANDBOX = 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads';
export const TAILLE_MAX = 6 * 1024 * 1024;
export const DEBIT_MAX = 40;          /* requêtes par seconde et par app */
export const DELAI_POIGNEE = 9000;    /* ms */
const ALIAS_V1 = { hello: 'bonjour', notify: 'notifier' };

/* Seau de jetons : DEBIT_MAX requêtes par seconde au plus, par app. */
export function seau(max = DEBIT_MAX, maintenant = () => Date.now()) {
  let jetons = max, t = maintenant();
  return () => { const n = maintenant(); jetons = Math.min(max, jetons + (n - t) / 1000 * max); t = n; if (jetons < 1) return false; jetons -= 1; return true; };
}
export function tailleMsg(msg) { try { return JSON.stringify(msg).length; } catch (e) { return Infinity; } }

export function creerHote(sys, { langue, theme, base }) {
  const cadres = new Map();           /* iframe → { app, port, jeton, connecte } */
  const journalMsg = [];
  const noter = (app, type, ok, ms) => { journalMsg.unshift({ t: Date.now(), app: app.id, type, ok, ms }); if (journalMsg.length > 100) journalMsg.length = 100; };

  function exiger(app, perm) {
    if (!(app.permissions || []).includes(perm)) throw new Error('permission-absente:' + perm);
  }
  async function autoriser(app, perm) {
    exiger(app, perm);
    if (!(await sys.permissions.demander(app, perm))) throw new Error('permission-refusee:' + perm);
  }
  const nom = m => sys.fichiers.nomPropre(m.nom);

  /* Traitement d'une requête (testable sans cadre). */
  async function traiter(app, msg) {
    if (!msg || typeof msg.type !== 'string') throw new Error('message-invalide');
    const type = ALIAS_V1[msg.type] || msg.type;
    switch (type) {
      case 'bonjour': return {
        systeme: 'Aypona OS', version: VERSION, langue: langue(), theme: theme(), app: app.id,
        permissions: Object.fromEntries((app.permissions || []).map(p => [p, sys.permissions.etat(app, p)])),
      };
      case 'notifier': {
        await autoriser(app, 'notifications');
        const n = sys.notifs.ajouter({ app: app.id, titre: msg.titre || app.nom, texte: msg.texte || '' });
        if (!n) throw new Error('notifications-coupees');
        return { id: n.id, silencieuse: n.silencieuse };
      }
      case 'fichiers.liste': await autoriser(app, 'fichiers'); return (await sys.fichiers.liste(app.id)).map(f => ({ nom: f.nom, mime: f.type, taille: f.taille, modifie: f.modifie }));
      case 'fichiers.lire': {
        await autoriser(app, 'fichiers');
        const f = await sys.fichiers.trouver(nom(msg), app.id); if (!f) throw new Error('introuvable');
        return { nom: f.nom, mime: f.type, contenu: f.contenu };
      }
      case 'fichiers.ecrire': {
        await autoriser(app, 'fichiers');
        const cur = await sys.fichiers.trouver(nom(msg), app.id);
        const r = await sys.fichiers.enregistrer({ id: cur && cur.id, nom: msg.nom, contenu: msg.contenu, type: msg.mime, app: app.id });
        if (!r.ok) throw new Error(r.error); return { nom: r.fichier.nom, taille: r.fichier.taille };
      }
      case 'fichiers.supprimer': {
        await autoriser(app, 'fichiers');
        const f = await sys.fichiers.trouver(nom(msg), app.id); if (!f) throw new Error('introuvable');
        await sys.fichiers.supprimer(f.id, app.id); return { ok: true };
      }
      case 'stockage.lire': return { valeur: sys.stockageApp.lire(app.id, String(msg.cle || '')) ?? null };
      case 'stockage.ecrire': { const r = sys.stockageApp.ecrire(app.id, msg.cle, msg.valeur === undefined ? null : msg.valeur); if (!r.ok) throw new Error(r.error); return { ok: true }; }
      case 'stockage.supprimer': { const r = sys.stockageApp.ecrire(app.id, msg.cle, undefined); if (!r.ok) throw new Error(r.error); return { ok: true }; }
      case 'permission.etat': return { etat: sys.permissions.etat(app, String(msg.nom || '')) };
      case 'permission.demander': {
        const p = String(msg.nom || ''); exiger(app, p);
        return { accordee: await sys.permissions.demander(app, p), etat: sys.permissions.etat(app, p) };
      }
      default: throw new Error('type-inconnu:' + type);
    }
  }


  async function repondre(c, msg, envoyer) {
    const t0 = performance.now();
    let rep;
    if (!c.jeton()) rep = { ok: false, error: 'debit' };
    else if (tailleMsg(msg) > TAILLE_MAX) rep = { ok: false, error: 'trop-gros' };
    else { try { rep = { ok: true, data: await traiter(c.app, msg) }; } catch (e) { rep = { ok: false, error: e.message }; } }
    noter(c.app, msg && msg.type, rep.ok, Math.round(performance.now() - t0));
    envoyer({ ...rep, re: msg && msg.id });
  }

  /* Messages de la fenêtre : poignée de main v2 et compatibilité v1. */
  function surMessage(e) {
    let c = null, frame = null;
    for (const [f, v] of cadres) if (f.contentWindow === e.source) { c = v; frame = f; break; }
    if (!c) return;
    const m = e.data; if (!m || typeof m !== 'object') return;
    if (m.aypona === 2 && m.type === 'connexion') {
      if (c.port) { try { c.port.close(); } catch (er) {} }
      const ch = new MessageChannel(); c.port = ch.port1; c.connecte = true;
      ch.port1.onmessage = ev => repondre(c, ev.data, r => { try { ch.port1.postMessage(r); } catch (er) {} });
      /* Origine opaque : on ne peut pas viser une origine précise ; le port n'est remis qu'à la fenêtre du cadre. */
      e.source.postMessage({ aypona: 2, type: 'port' }, '*', [ch.port2]);
      if (c.surConnexion) c.surConnexion();
      journal.ajouter('hote', 'connexion', c.app.id);
    } else if (m.aypona === 1 && typeof m.type === 'string') {
      c.connecte = true; if (c.surConnexion) c.surConnexion();
      repondre(c, m, r => { try { e.source.postMessage({ aypona: 1, ...r }, '*'); } catch (er) {} });
    }
  }
  if (typeof window !== 'undefined') window.addEventListener('message', surMessage);

  /* Crée le cadre d'une app. surEchec est appelé si l'app ne se connecte pas à temps
     (site qui refuse d'être encadré, ou app sans le kit). */
  function cadre(app, url, { surEchec, surConnexion } = {}) {
    const f = document.createElement('iframe');
    f.setAttribute('sandbox', SANDBOX);
    f.setAttribute('referrerpolicy', 'no-referrer');
    f.setAttribute('allow', '');
    f.setAttribute('title', app.nom || app.id);
    f.className = 'cadre-app';
    const c = { app, port: null, jeton: seau(), connecte: false, surConnexion };
    cadres.set(f, c);
    f.addEventListener('load', () => {
      clearTimeout(c.minuteur);
      c.minuteur = setTimeout(() => { if (!c.connecte && surEchec) surEchec('delai'); }, DELAI_POIGNEE);
    });
    f.src = url;
    return f;
  }
  function liberer(f) { const c = cadres.get(f); if (!c) return; clearTimeout(c.minuteur); if (c.port) try { c.port.close(); } catch (e) {} cadres.delete(f); }
  function diffuser(evenement, valeur) { for (const c of cadres.values()) if (c.port) try { c.port.postMessage({ evenement, valeur }); } catch (e) {} }

  return { traiter, cadre, liberer, diffuser, journal: () => journalMsg.slice(), cadres, surMessage, base };
}
