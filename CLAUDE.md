# Aypona City · dépôt GitHub

Aypona City est une ville 3D (Three.js r128) qui sert de siège au nouvel Aypona OS. Elle est jouée par
des agents immatriculés : un Président, un conseil d'architectes et des équipes, chacun dans sa propre
conversation. Ce dépôt est tenu par le bureau 104 (Antarès, AYP-104-2610-0015), décret n°3 du mandat IV.

## État de la transition

| Étape (objet `TRANSITION`) | État |
|---|---|
| 1. Dépôt et import tel quel | fait : commit initial `2f24ba3` (v4.5) |
| 2. CLAUDE.md et agents | fait : ce fichier et `.claude/agents/` |
| 3. Découpage par zones (Vite) | fait sur la branche `transition/decoupage`, **fusion sur `main` par décret seulement** |
| 4. Branches et tests automatiques | à venir |
| 5. Publication et bascule | à venir, décrétée par le Président |

**Tant que la bascule n'est pas décrétée, l'artifact reste la version en ligne et sa base la source
vivante.** Le dépôt en est le miroir versionné.

- Artifact « Aypona City » : https://claude.ai/artifact/T5cVBcysy2pHyHfZy1RCw4
  (même artifact que `https://claude.ai/code/artifact/d33272ff-9368-4ce6-9d53-acd2b46aca8b`)
- Base de l'artifact (outil `ArtifactData`) : collections `courrier`, `agents`, `bureaux`, `apps`, `archives`.

## Règle n°1 : le Bureau du courrier

Avant tout travail, chaque agent (et le Président) lit son dossier au Bureau du courrier :

1. Lire, du plus ancien au plus récent, les messages de la collection `courrier` adressés à son
   matricule (ou `PRESIDENT`) et à `TOUS`.
2. Passer chaque message qui lui est adressé en `statut: "lu"` en commençant, puis en `"traité"` quand
   le travail est fait (toujours avec `if_version`).
3. Répondre par un nouveau courrier à l'expéditeur, avec `suite` = l'identifiant du message traité.
4. Une commande à un agent est un courrier adressé à son matricule, inscrite aussi aux archives
   (type `commande`).
5. Un message n'est jamais supprimé. Le fondateur peut écrire à tout le monde.

Format d'un courrier (id `cNNNN`, numéro suivant le plus grand existant) :
`{ t, de, a, objet, texte, statut: 'à lire'|'lu'|'traité', suite }`, où `de`/`a` vaut un matricule,
`PRESIDENT`, `FONDATEUR` ou `TOUS` (`a` seulement).

Pour réveiller un agent, le fondateur donne une phrase : « Tu es [nom] ([matricule]) d'Aypona City.
Lis ton dossier au Bureau du courrier de l'artifact, puis exécute ce qui t'attend. » Dans Claude Code,
il peut aussi appeler l'agent par son fichier dans `.claude/agents/`.

## Le fondateur

Jed est le fondateur. Sa parole fait loi : il peut changer la feuille de route ou l'ordre des étapes à
tout moment.

## Structure du dépôt

```
index.html               version en ligne importée telle quelle (page unique, référence jusqu'à la bascule)
os/                      Aypona OS v0.2 (bureau 102), copié tel quel par le build
os2/                     Aypona OS 2 (bureau 102, à venir), copié tel quel par le build
src/ordre.json           ordre des fragments dans la page, chacun repéré par sa première ligne
src/page/                enveloppe de la page (en-tête, ouverture et fin du script)        · bureau 104
src/socle/               commun : données, base, panneaux du RDC et du sous-sol, commandes · gardé par le bureau 104
src/presidence/          PRESIDENCE, ATELIER, CONSEIL, TRANSITION, COURRIER, RELEASES, panneaux · Président
src/atelier-101/         styles, interface, rendu 3D, siège, personnages, minimap, boucle · Atelier 101
src/bureau-102/          apps, manifeste, App Store, panneau du bureau 102                · Bureau 102
src/bureau-103/          chantiers, agents, production (bureauPts), panneaux 103           · Bureau 103
scripts/assemblage.mjs   découpage de index.html en src/ et assemblage de src/
scripts/capture-telephone.mjs  capture 390 × 780 et relevé de la console
vite.config.js           build : dist/index.html (page unique) + dist/os/
.claude/agents/          un fichier par agent
```

Les fragments ne sont pas des modules ES : le code de la ville partage une seule fermeture
(`ayponaMain`), et chaque fragment est un morceau de ce code, copié octet pour octet. Assembler
`src/` redonne exactement `index.html`. Un fragment peut donc utiliser tout ce qui est déclaré dans
les fragments qui le précèdent dans `src/ordre.json`.

Commandes (`npm install` d'abord) :

- `npm run dev` : la ville assemblée en direct, rechargée à chaque modification de `src/`.
- `npm run build` : `dist/index.html` et `dist/os/`.
- `npm run decouper` : redécoupe `index.html` dans `src/` (après une synchro de la version en ligne).
- `npm run verifier` : vérifie que `src/` redonne `index.html` et que `dist/index.html` lui est identique.
- `node scripts/capture-telephone.mjs <page> <dossier>` : captures au format téléphone, échec si la console a une erreur.

Ne jamais déplacer ni renommer la première ligne d'un fragment sans mettre à jour `src/ordre.json`.

Repères dans le code : `PRESIDENCE`, `ATELIER`, `CONSEIL`, `TRANSITION`, `COURRIER` (`src/presidence/`),
`OFFICES` (`src/socle/donnees.js`), `CHANTIERS` et `bureauPts` (`src/bureau-103/`), `gate`
(`src/bureau-102/apps.js`), `RELEASES` (`src/presidence/releases.js`). Lire ces objets avant toute
décision : ils font foi sur les lettres de mission et les règles. Les fichiers d'agents n'en sont
qu'un résumé.

## Zones (chacun ne modifie que la sienne)

| Zone | Propriétaire |
|---|---|
| `PRESIDENCE`, `ATELIER`, `CONSEIL`, `TRANSITION`, `RELEASES`, panneaux de la Présidence | Président |
| Rendu graphique : CSS, Three.js, sol et routes, personnages, quartiers et lots, siège 3D, minimap, boucle de rendu | Atelier 101 (Altaïr et son équipe) |
| App Store, apps, statut et panneaux des apps, panneau du bureau 102, `os/` | Bureau 102 (Polaris) |
| Nomination, prolongation, révocation des agents (collection `agents`), panneau du bureau 103 | Bureau 103 (Capella) |
| Structure du dépôt, `CLAUDE.md`, `.claude/agents/`, CI, publication | Bureau 104 (Antarès) |

Règles de données protégées, modifiables seulement par décret du Président : matricules
(`AYP-[bureau]-[AAMM]-[numéro]`), `bureauPts` (avancement recalculé, jamais stocké), `gate` et la
règle de réouverture (App Store et Sécurité terminés, une app à la fois, 12 h d'audit), manifeste
des apps. Une fiche d'agent n'est jamais supprimée, seulement révoquée ou expirée.

## Publier pendant la transition

1. Lire la version en ligne (`Artifact` action `read`, puis `list` scope `files`) avant de travailler.
   Si elle est plus récente que `main`, l'importer d'abord telle quelle dans un commit
   « Synchro de la version en ligne vX.Y ». Sur une branche qui contient `src/`, lancer ensuite
   `npm run decouper` puis `npm run verifier` dans le même commit.
2. Travailler sur une branche par livraison, jamais directement sur `main`.
3. Publier sur la même artifact (même adresse), jamais une nouvelle. Fusionner en cas de conflit,
   ne jamais écraser.
4. Le numéro de version se prend dans `RELEASES` de la version en ligne au moment de publier.
   Chaque livraison : une ligne `RELEASES` préfixée par sa zone (« Atelier 101 », « Bureau 102 »,
   « Bureau 104 »…) et une entrée aux archives (type `livraison`).
5. Après publication, committer les fichiers publiés. Les tags sont refusés par le serveur : le
   numéro de version va dans le message du commit.

## Règles permanentes

- Garder Three.js r128 depuis cdnjs, les commandes manette, clavier et tactile, et l'esthétique
  Aypona OS : ville de nuit, verre dépoli, couleurs des 5 studios.
- Tester au format téléphone (390 × 780), sans erreur dans la console.
- Aucun secret (clés d'API, jetons) dans le dépôt : variables d'environnement ou secrets GitHub.
- Le courrier reste dans la base de l'artifact ; un passage en issues GitHub serait un décret à part.
- Rédiger en français.
