/* =====================================================================
   AYPONA OS 2 · SERVICE WORKER (hors ligne)
   - Version liée au noyau : un nouveau noyau = un nouveau cache, l'ancien est supprimé.
   - Coquille et modules : réseau d'abord (toujours la dernière version en ligne),
     copie en cache si le réseau manque (défaut A9 de l'ancien Aypona OS corrigé).
   - Rien d'autre que les fichiers du système n'est mis en cache (pas les apps).
   - La nouvelle version attend l'accord de l'utilisateur (bandeau « Redémarrer »).
   ===================================================================== */
const VERSION = '2.0.0';
const CACHE = 'aypona-os2-' + VERSION;
const COQUILLE = ['./', 'index.html', 'manifest.webmanifest', 'icone-192.png', 'icone-512.png',
  'js/noyau.js', 'js/stockage.js', 'js/i18n.js', 'js/manifeste.js', 'js/systeme.js', 'js/hote.js', 'js/interface.js', 'js/tests.js',
  'sdk/index.html', 'sdk/aypona.js', 'sdk/exemple.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(COQUILLE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => null)))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('aypona-os2-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data && e.data.type === 'activer') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const portee = new URL('./', location.href).pathname;
  if (!url.pathname.startsWith(portee) || url.pathname.startsWith(portee + 'apps/')) return;
  e.respondWith(fetch(req).then(rep => {
    if (rep && rep.ok && rep.type === 'basic') { const copie = rep.clone(); caches.open(CACHE).then(c => c.put(req, copie)); }
    return rep;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
