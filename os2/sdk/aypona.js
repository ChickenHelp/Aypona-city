/* =====================================================================
   KIT AYPONA OS 2 · côté app (sdk/aypona.js)
   À inclure dans une app : <script src="aypona.js"></script> (ou copie locale du fichier).
   L'app tourne dans un cadre isolé d'Aypona OS ; ce kit ouvre le canal privé avec le système.

     const os = await Aypona.connecter();          // { systeme, version, langue, theme, app, permissions }
     await Aypona.notifier('Titre', 'Texte');      // demande la permission « notifications » au besoin
     await Aypona.fichiers.ecrire('note.txt', 'Bonjour');
     const liste = await Aypona.fichiers.liste();
     await Aypona.stockage.ecrire('score', 12);    // stockage privé, sans permission, 256 Ko
     Aypona.sur('langue', l => …); Aypona.sur('theme', th => …);

   Hors d'Aypona OS (page ouverte seule), connecter() échoue avec l'erreur « hors-aypona ».
   Erreurs possibles : permission-absente:<nom>, permission-refusee:<nom>, introuvable, doublon,
   trop-gros, plein, debit, delai, type-inconnu:<type>.
   ===================================================================== */
(function (global) {
  'use strict';
  var port = null, attente = {}, n = 0, ecouteurs = {}, connexion = null;
  var DELAI = 15000;

  function connecter() {
    if (connexion) return connexion;
    connexion = new Promise(function (res, rej) {
      if (global.parent === global) { rej(new Error('hors-aypona')); return; }
      var fini = false;
      function surPort(e) {
        if (e.source !== global.parent || !e.data || e.data.aypona !== 2 || e.data.type !== 'port' || !e.ports || !e.ports[0]) return;
        global.removeEventListener('message', surPort); fini = true;
        port = e.ports[0];
        port.onmessage = function (ev) {
          var m = ev.data || {};
          if (m.evenement) { (ecouteurs[m.evenement] || []).forEach(function (f) { try { f(m.valeur); } catch (er) {} }); return; }
          var p = attente[m.re]; if (!p) return; delete attente[m.re]; clearTimeout(p.t);
          if (m.ok) p.res(m.data); else p.rej(new Error(m.error || 'erreur'));
        };
        demander('bonjour').then(res, rej);
      }
      global.addEventListener('message', surPort);
      global.parent.postMessage({ aypona: 2, type: 'connexion' }, '*');
      setTimeout(function () { if (!fini) { global.removeEventListener('message', surPort); connexion = null; rej(new Error('delai')); } }, 6000);
    });
    return connexion;
  }

  function demander(type, donnees) {
    return new Promise(function (res, rej) {
      var go = function () {
        var id = 'm' + (++n);
        attente[id] = { res: res, rej: rej, t: setTimeout(function () { delete attente[id]; rej(new Error('delai')); }, DELAI) };
        var msg = {}; for (var k in (donnees || {})) if (donnees[k] !== undefined) msg[k] = donnees[k]; msg.id = id; msg.type = type;
        port.postMessage(msg);
      };
      if (port) go(); else connecter().then(go, rej);
    });
  }

  global.Aypona = {
    connecter: connecter,
    demander: demander,
    notifier: function (titre, texte) { return demander('notifier', { titre: titre, texte: texte }); },
    fichiers: {
      liste: function () { return demander('fichiers.liste'); },
      lire: function (nom) { return demander('fichiers.lire', { nom: nom }); },
      ecrire: function (nom, contenu, mime) { return demander('fichiers.ecrire', { nom: nom, contenu: contenu, mime: mime }); },
      supprimer: function (nom) { return demander('fichiers.supprimer', { nom: nom }); },
    },
    stockage: {
      lire: function (cle) { return demander('stockage.lire', { cle: cle }).then(function (r) { return r.valeur; }); },
      ecrire: function (cle, valeur) { return demander('stockage.ecrire', { cle: cle, valeur: valeur }); },
      supprimer: function (cle) { return demander('stockage.supprimer', { cle: cle }); },
    },
    permission: {
      etat: function (nom) { return demander('permission.etat', { nom: nom }).then(function (r) { return r.etat; }); },
      demander: function (nom) { return demander('permission.demander', { nom: nom }); },
    },
    sur: function (evenement, fn) { (ecouteurs[evenement] = ecouteurs[evenement] || []).push(fn); },
    version: '2.0.0',
  };
})(window);
