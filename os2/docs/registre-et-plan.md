# Aypona OS 2 · registre des défauts et plan

Bureau 102 · Polaris (AYP-102-2610-0013). Commande c0033, décret n°2 du mandat V. 18 oct. 2026.

Gravité : **critique** (sécurité ou système inutilisable), **élevée** (fonction majeure cassée ou
exclusion d'utilisateurs), **moyenne** (gêne réelle, contournable), **faible** (finition).

## Étape A · Registre des défauts

### Ancien Aypona OS (archives : base « ios-home-netlify », vitrine de l'ancien catalogue)

| # | Défaut constaté | Gravité | Correction dans OS 2 |
|---|---|---|---|
| A1 | Cadre d'app `sandbox` avec `allow-scripts` **et** `allow-same-origin` : l'app peut lever son propre bac à sable et lire le stockage du système. | critique | Cadre sans `allow-same-origin` (origine opaque), canal privé `MessageChannel`, aucune donnée système accessible hors API. Test automatique de l'attribut. |
| A2 | « Comptes » et licences vérifiés dans le navigateur : empreintes SHA-256 et sel publiés dans `accounts.js`, compte superadmin débloquable en local. Sécurité de façade. | critique | Aucun compte ni licence côté navigateur. Ce qui doit être protégé le sera par un serveur, jamais par le client. |
| A3 | 157 adresses `netlify.app` codées en dur ; l'abonnement est coupé, elles sont mortes. | critique | Aucune adresse d'app dans le code : chaque app vient d'un manifeste (domicile privé, service ou public). |
| A4 | 35 fonctions Netlify (connexion, synchro, push, AyChat, AySim, DLC) : sans elles, la moitié du système ne marche plus. | élevée | Système 100 % autonome, sans serveur. Les services éventuels deviennent des apps « service ». |
| A5 | `home.html` monolithique : 1,16 Mo, 30 744 lignes, plus `catalog.js` 348 Ko chargé au démarrage. | élevée | Coquille légère (CSS critique en ligne, modules séparés), catalogue lu à la demande. Budget mesuré au démarrage. |
| A6 | `user-scalable=no` sur toutes les pages : zoom interdit (WCAG 1.4.4). | élevée | Zoom autorisé, taille du texte réglable (85 à 150 %). |
| A7 | Clés privées E2E stockées en clair dans `localStorage`, lisibles par toute app (voir A1). | élevée | Aucune clé dans le stockage ; isolement des apps. |
| A8 | 190 `innerHTML` dans `home.html` avec des données de catalogue et d'utilisateur : risque d'injection. | élevée | Tout le DOM est construit par `textContent` / nœuds ; aucun `innerHTML` avec des données. Test automatique. |
| A9 | Service worker « cache d'abord » avec numéro de cache à changer à la main : versions périmées coincées. | moyenne | Service worker versionné par le noyau, réseau d'abord pour la coquille, bandeau « Nouvelle version ». |
| A10 | Manifeste PWA verrouillé en portrait : tablettes et paysage exclus. | moyenne | Orientation libre, mise en page adaptative, multitâche sur tablette. |
| A11 | Écran de verrouillage et « code » sans vraie protection. | moyenne | Supprimé (pas de fausse sécurité). |
| A12 | Contenu du lore (Bluesand, Dania, AySim) mêlé au code système. | moyenne | Le système ne contient aucun contenu : le lore reste aux archives. |
| A13 | `console.log` et télémétrie maison en production. | faible | Journal local consultable dans Diagnostic, rien n'est envoyé. |

### Aypona OS v0.2 (os/index.html, bureau 102)

| # | Défaut constaté | Gravité | Correction dans OS 2 |
|---|---|---|---|
| B1 | Tout vit dans `localStorage` : 5 Mo maximum, effacé par Safari après 7 jours sans visite, fichiers limités à 200 Ko et 1 Mo au total. Aucun export. | élevée | Stockage durable : IndexedDB (demande de stockage persistant) + miroir rapide + secours en mémoire signalé. Export et import d'une sauvegarde `.aypona` (JSON signé SHA-256). |
| B2 | Ni installable ni utilisable hors ligne. | élevée | PWA : manifeste, icônes, service worker, fonctionnement hors ligne de la coquille et des apps système. |
| B3 | Sur tablette et ordinateur, un faux téléphone de 430 px au milieu de l'écran. | élevée | Coquille adaptative : téléphone, tablette (deux apps côte à côte), ordinateur. |
| B4 | Toutes les permissions accordées d'un coup à l'installation, sans retour possible app par app. | élevée | Permissions demandées à l'usage (une fois, toujours, refuser), révocables dans Réglages › Confidentialité. |
| B5 | Navigation par gestes (glisser, appui long) sans équivalent clavier ni lecteur d'écran pour plusieurs actions. | élevée | Chaque geste a un bouton et un raccourci ; aide des raccourcis (touche ?), pièges de focus dans les feuilles, annonces `aria-live`. |
| B6 | Démarrage : animation et attente artificielle avant l'écran de verrouillage. | moyenne | Premier affichage immédiat, tests lancés pendant les temps morts, pas d'écran de verrouillage. |
| B7 | Anglais partiel : une partie des vues est écrite en dur en français. | moyenne | Toutes les chaînes passent par `t()` ; test de parité des clés français/anglais. |
| B8 | Recherche limitée aux apps, réglages et noms de fichiers. | moyenne | Recherche globale : apps, catalogue de la ville, contenu des fichiers, réglages, actions, notifications ; insensible aux accents ; Ctrl/⌘ K. |
| B9 | Pas de centre de contrôle : réglages courants à trois écrans de distance. | moyenne | Centre de contrôle : ne pas déranger, taille du texte, contraste, mouvement, langue, stockage, dernière sauvegarde. |
| B10 | Hôte : réponses en `postMessage(…,'*')`, pas de délai ni de limite de taille ou de débit ; app « service » bloquée par son site = écran vide. | moyenne | Canal `MessageChannel` privé, délai de poignée de main, limite de taille et de débit, carte « Ouvrir dans un onglet » si l'app refuse d'être encadrée. |
| B11 | Lecture du catalogue de la ville non vérifiée hors de la ville, et sans copie hors ligne. | moyenne | Connexion en lecture seule + copie locale datée ; l'origine (direct ou copie) est affichée. |
| B12 | Aucun kit pour les développeurs : le protocole n'est décrit que dans le code. | moyenne | Kit : `sdk/aypona.js`, documentation, valideur de manifeste, app d'exemple, journal des messages en mode développeur. |
| B13 | 24 tests internes seulement, aucun test d'affichage automatique. | moyenne | Au moins 60 tests internes + scénarios Playwright (390 × 780, tablette, clavier, hors ligne). |
| B14 | Pas de taille de texte, de contraste élevé ni de transparence réduite. | moyenne | Réglages d'accessibilité complets, appliqués partout par variables CSS. |
| B15 | Pas de reprise des données d'une version à l'autre. | faible | Au premier démarrage, OS 2 reprend (sans les effacer) les réglages, apps et fichiers de la v0.2. |

## Étape B · Plan d'Aypona OS 2

### Architecture

```
os2/
  index.html            coquille : CSS critique en ligne, balisage, chargement des modules
  manifest.webmanifest  PWA (orientation libre)
  sw.js                 service worker versionné (réseau d'abord, copie hors ligne)
  icone-192.png, icone-512.png
  js/noyau.js           version, bus d'événements, journal, utilitaires DOM sûrs
  js/stockage.js        IndexedDB + miroir + secours mémoire, sauvegarde .aypona, reprise v0.2
  js/i18n.js            français et anglais complets
  js/manifeste.js       manifeste v1 (inchangé), validation
  js/systeme.js         réglages, apps, permissions, notifications, fichiers, catalogue de la ville
  js/hote.js            hôte d'apps isolé (MessageChannel)
  js/interface.js       coquille adaptative, recherche, centre de contrôle, multitâche, apps système
  js/tests.js           suite de tests interne
  sdk/aypona.js         kit développeur (côté app)
  sdk/index.html        documentation et valideur
  sdk/exemple.html      app d'exemple du kit (pas une app du catalogue)
```

### Ce qui est gardé

Manifeste d'app v1 tel quel (id, nom, studio, version, domicile, entrée, icône, permissions
`notifications` et `fichiers`, description) et les trois domiciles ; hôte d'apps isolé ; tests au
démarrage ; français et anglais ; esthétique Aypona (nuit, verre dépoli, or, 5 studios) ; lecture
seule du catalogue de la ville ; fonds d'écran, widgets, Fichiers, sélecteur d'apps.

### Ce qui disparaît

Écran de verrouillage, faux téléphone sur grand écran, attente au démarrage, stockage tout-`localStorage`,
plafond de 1 Mo pour les fichiers, permissions accordées en bloc.

### Nouveautés

1. Installable et hors ligne (PWA), mise à jour annoncée.
2. Stockage durable, export et import `.aypona`, reprise de la v0.2.
3. Recherche globale (Ctrl/⌘ K, touche /).
4. Centre de contrôle.
5. Multitâche sur tablette : deux apps côte à côte, séparateur réglable (1/3, 1/2, 2/3).
6. Permissions demandées à l'usage, révocables.
7. Kit développeur et mode développeur (journal des messages, installation depuis un manifeste).
8. Accessibilité : clavier complet, lecteur d'écran, taille du texte, contraste élevé, transparence et
   mouvement réduits, zoom autorisé.
9. Démarrage rapide sur téléphone, temps de démarrage mesuré et affiché dans Diagnostic.
10. Ne pas déranger et notifications groupées par app.
11. Diagnostic : tests, journal d'erreurs local, stockage, performances.
12. Au moins 60 tests internes, et des tests Playwright dont un au format 390 × 780.

### Hors de ma zone, à décréter

- Le manifeste reste en v1 (données protégées). Proposition pour un futur décret : une v2 avec les
  permissions `presse-papiers` et `partage`, et un champ `langues`.
- La bascule de `os/` vers `os2/` est décrétée par le Président.
- App Store de la ville, `gate`, `bureauPts` et règle de réouverture : inchangés.
