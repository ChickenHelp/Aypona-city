# Aypona City · dépôt GitHub

Aypona City est une ville 3D (Three.js r128) qui sert de siège au nouvel Aypona OS. Elle est jouée par
des agents immatriculés : un Président, un conseil d'architectes et des équipes, chacun dans sa propre
conversation. Ce dépôt est tenu par le bureau 104 (Antarès, AYP-104-2610-0015), décret n°3 du mandat IV.

## État de la transition

| Étape (objet `TRANSITION`) | État |
|---|---|
| 1. Dépôt et import tel quel | fait : commit initial, tag `v4.5` |
| 2. CLAUDE.md et agents | fait : ce fichier et `.claude/agents/` |
| 3. Découpage par zones (Vite) | **interdit sans décret du Président** |
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

## Structure du dépôt (avant découpage)

```
index.html               page unique de la ville (tout le code, objets et rendu)
os/index.html            Aypona OS (bureau 102)
os/aypona-logo-gold.png  logo d'Aypona OS
.claude/agents/          un fichier par agent
```

Repères dans `index.html` (fonction `ayponaMain`) : `PRESIDENCE`, `ATELIER`, `CONSEIL`, `TRANSITION`,
`COURRIER`, `OFFICES`, `CHANTIERS`, `bureauPts`, `gate`, `RELEASES`. Lire ces objets avant toute
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
   « Synchro de la version en ligne vX.Y ».
2. Travailler sur une branche par livraison, jamais directement sur `main`.
3. Publier sur la même artifact (même adresse), jamais une nouvelle. Fusionner en cas de conflit,
   ne jamais écraser.
4. Le numéro de version se prend dans `RELEASES` de la version en ligne au moment de publier.
   Chaque livraison : une ligne `RELEASES` préfixée par sa zone (« Atelier 101 », « Bureau 102 »,
   « Bureau 104 »…) et une entrée aux archives (type `livraison`).
5. Après publication, committer les fichiers publiés et taguer `vX.Y`.

## Règles permanentes

- Garder Three.js r128 depuis cdnjs, les commandes manette, clavier et tactile, et l'esthétique
  Aypona OS : ville de nuit, verre dépoli, couleurs des 5 studios.
- Tester au format téléphone (390 × 780), sans erreur dans la console.
- Aucun secret (clés d'API, jetons) dans le dépôt : variables d'environnement ou secrets GitHub.
- Le courrier reste dans la base de l'artifact ; un passage en issues GitHub serait un décret à part.
- Rédiger en français.
