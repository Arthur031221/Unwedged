[Démo en ligne](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Marque Unwedged">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

Trouvez un itinéraire avec un virage avant l'arrivée du canapé.

Une fiche de terrain locale pour mesurer un logement de plain-pied et vérifier en 2D un objet rectangulaire rigide.

**6 408 poses de trajet échantillonnées indépendamment.** La vérification exécute les deux préréglages qui trouvent un trajet et quatre cas de régression, puis échantillonne chaque trajet retourné en 800 intervalles par segment avec Shapely. Les six trajets couvrent les deux orientations de porte. [Reproduire la vérification](CONTRIBUTING.md). L'échantillonnage apporte des éléments sur l'implémentation. Le vérificateur de l'application contrôle séparément le mouvement continu dans le modèle 2D dessiné.

| Avant                                                                            | Après                                                                                            |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Mesurer la largeur de la porte, la pièce, les obstacles et la hauteur de portage | Un itinéraire de virage candidat dont chaque segment de mouvement est certifié de façon prudente |
| Incertitude sur le passage d'un virage                                           | Mesures enregistrées, lecture du trajet et plan coté à examiner                                  |

![Enregistrement réel dans le navigateur d'un trajet de meuble contournant un mur](assets/demo.gif)

**Pour essayer :** choisissez Corner landing, modifiez la largeur du meuble de 74 à 75, puis utilisez Undo et Redo. Le trajet est effacé lorsque les mesures changent. Recherchez un trajet, puis lancez sa lecture.

Undo et Redo rétablissent des groupes de modifications des mesures. Les mesures sont enregistrées automatiquement dans le stockage local et peuvent être récupérées à la visite suivante. Les trajets ne sont pas inclus dans cet enregistrement. Si le navigateur ne dispose pas de stockage, utilisez Save project pour conserver une copie. Les personnes qui utilisent le clavier peuvent modifier les champs. Sur mobile, le bouton Measurements ouvre le panneau de modification des obstacles. Les ouvertures de porte peuvent être décalées le long d'un mur. Les fichiers avec une ouverture décalée utilisent le schéma version 2 et sont refusés par les anciennes versions du client. Les fichiers version 1 avec une ouverture centrée restent acceptés.

Unwedged vérifie le déplacement d'un rectangle rigide sur un seul étage. Il ne modélise ni la 3D, ni les escaliers, ni l'inclinaison, ni les porteurs, ni la déformation. Une recherche bornée peut manquer un trajet. Elle ne prouve jamais qu'un passage est impossible.

Le dessin est le modèle. Mesurez ce que vous y dessinez.

## Démarrage rapide

Installez Node.js 22.12 ou une version ultérieure. Cette commande télécharge l'application une seule fois, puis la sert sur cet ordinateur à l'adresse `127.0.0.1` : Git doit aussi être installé.

```sh
npx github:Arthur031221/Unwedged#v1.1.0
```

L'application du navigateur intègre ses polices et son worker de résolution. Après la première visite, attendez l'indicateur « Prêt hors ligne » avant de compter sur le fonctionnement hors ligne de l'application et de la recherche de trajets. Les fichiers du projet restent dans le navigateur ou dans les téléchargements. L'application n'effectue aucun appel API pendant son utilisation.

## Exemple en cinq lignes

Enregistrez ceci dans `room.json`, ouvrez le fichier dans l'application, puis choisissez Find route. Les dimensions sont en centimètres et les angles en radians.

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## Déroulement

1. Choisissez Apartment hallway, Corner landing ou Blocked corridor, puis saisissez les dimensions mesurées de la pièce et des obstacles.
2. Saisissez la longueur et la largeur du meuble, sa hauteur de portage fixe et la marge de sécurité. Définissez les positions et angles de départ et d'arrivée.
3. Recherchez un trajet. Le worker vérifie les dégagements sans bloquer l'éditeur. Relisez ou parcourez les poses obtenues.
4. Enregistrez les mesures et le trajet revérifié en JSON, partagez-les dans le fragment d'une URL ou exportez un plan de trajet SVG coté.

Les mesures sont enregistrées en centimètres. Vous pouvez afficher les pouces. Toute modification ou tout déplacement de géométrie efface le trajet actuel avant la recherche suivante.

## Installation selon le système

<details><summary>macOS</summary>

Installez Node.js 22.12 ou une version ultérieure, ouvrez Terminal et lancez `npx github:Arthur031221/Unwedged#v1.1.0`. Ouvrez l'adresse de bouclage affichée. Arrêtez le serveur avec Ctrl+C. Git doit aussi être installé.

</details>

<details><summary>Linux</summary>

Installez Node.js 22.12 ou une version ultérieure, ouvrez un terminal et lancez `npx github:Arthur031221/Unwedged#v1.1.0`. Ouvrez l'adresse de bouclage affichée. Arrêtez le serveur avec Ctrl+C. Git doit aussi être installé.

</details>

<details><summary>Windows</summary>

Installez Node.js 22.12 ou une version ultérieure, ouvrez PowerShell et lancez `npx github:Arthur031221/Unwedged#v1.1.0`. Ouvrez l'adresse de bouclage affichée. Arrêtez le serveur avec Ctrl+C. Git doit aussi être installé.

</details>

## Fichiers du projet

- `src/core/geometry.ts` calcule les empreintes orientées, les ouvertures de porte et le dégagement physique.
- `src/core/verify.ts` certifie chaque intervalle de mouvement avec des bornes continues adaptatives.
- `src/core/search.ts` exécute une recherche A* déterministe avec des limites finies d'états et de durée.
- `src/worker.ts` exécute la recherche et la vérification des trajets importés hors du fil de l'interface.
- `src/locales` contient neuf traductions de l'interface.
- `docs/accuracy.md` décrit les vérifications géométriques et les limites du solveur.

## Développement

Depuis une copie du dépôt, lancez `npm ci`, `npm run dev`, `npm test` et `npm run build`. `CONTRIBUTING.md` répertorie les vérifications du navigateur, du mode hors ligne, des paquets et de Shapely indépendant. Le dépôt inclut les fichiers de polices et leurs avis OFL.

Assisted by Claude/Codex.
