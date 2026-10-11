[Démo en ligne](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Marque Unwedged">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

Trouvez un itinéraire avec virages avant l'arrivée du canapé.

Un outil de mesure local pour vérifier si un objet rectangulaire rigide peut tourner dans un plan mesuré sur un seul niveau.

![Enregistrement réel du navigateur montrant un meuble contournant un mur](assets/demo.gif)

**À essayer :** ouvrez la démo et choisissez Palier en angle. Cherchez puis lisez l'itinéraire avec 74 cm, puis réglez Largeur sur 75 cm. Une recherche limitée qui ne trouve pas d'itinéraire ne prouve pas que le passage est impossible.

## Démarrage rapide

Installez Node.js 22.12 ou une version ultérieure ainsi que Git, puis lancez l'application en local :

```sh
npx github:Arthur031221/Unwedged#v1.3.0
```

La commande télécharge l'application et la sert sur votre ordinateur à `127.0.0.1`. Après la première visite, attendez l'indicateur « Hors ligne prêt » avant de compter sur l'usage hors ligne. Les mesures restent dans le navigateur ou dans les fichiers enregistrés.

Unwedged modélise un rectangle rigide qui se déplace sur un seul niveau. Il ne modélise pas la 3D, les escaliers, l'inclinaison, les porteurs ni la déformation. La recherche est limitée, peut manquer un itinéraire et ne prouve pas qu'un passage est impossible.

X et Y indiquent les centres. L'origine se trouve en bas à gauche, X augmente vers la droite et Y vers le haut. Les angles positifs tournent dans le sens antihoraire. Voir l'exemple dans [Utilisation](docs/usage.md).

Le dessin est le modèle. Mesurez ce que vous y placez.

## Première utilisation

1. Choisissez Apartment hallway, Corner landing ou Blocked corridor, puis saisissez les mesures de la pièce et des obstacles.
2. Saisissez la longueur, la largeur, la hauteur de port fixe du meuble et la marge de sécurité. Définissez les positions et angles de départ et d'arrivée.
3. Cherchez un itinéraire, puis lisez ou parcourez les poses obtenues. Les avertissements signalent une collision aux extrémités ou un dégagement inférieur à la marge requise.
4. Enregistrez les mesures et l'itinéraire vérifié en JSON, partagez un lien du projet ou exportez un plan SVG coté.

[Utilisation](docs/usage.md) explique les coordonnées et les modifications. [Précision et limites](docs/accuracy.md) décrit les vérifications géométriques et les limites de recherche.

## Exemple en cinq lignes

Enregistrez ceci sous `room.json`, ouvrez le fichier dans l'application et choisissez Chercher un itinéraire. Les dimensions sont en centimètres et les angles en radians.

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## Installation selon le système

Installez Node.js 22.12 ou une version ultérieure et Git, puis lancez la commande dans Terminal, un terminal Linux ou PowerShell. Ouvrez l'adresse affichée et arrêtez le serveur avec Ctrl+C.

<details><summary>macOS</summary>

```sh
npx github:Arthur031221/Unwedged#v1.3.0
```

</details>

<details><summary>Linux</summary>

```sh
npx github:Arthur031221/Unwedged#v1.3.0
```

</details>

<details><summary>Windows</summary>

```powershell
npx github:Arthur031221/Unwedged#v1.3.0
```

</details>

## Fichiers du projet

- `src/core/geometry.ts` calcule les empreintes orientées, les ouvertures de porte et le dégagement physique.
- `src/core/verify.ts` certifie chaque intervalle de mouvement avec des bornes continues adaptatives.
- `src/core/search.ts` exécute une recherche A* déterministe avec des limites finies d'états et de durée.
- `src/worker.ts` exécute la recherche et la vérification des trajets importés hors du fil de l'interface.
- `src/locales` contient neuf traductions de l'interface.
- [docs/accuracy.md](docs/accuracy.md) décrit les vérifications géométriques et les limites du solveur.

## Développement

Depuis une copie du dépôt, lancez `npm ci`, `npm run dev`, `npm test` et `npm run build`. [CONTRIBUTING.md](CONTRIBUTING.md) détaille les vérifications navigateur, hors ligne, paquet et Shapely indépendant. Les fichiers de polices et leurs notices OFL sont inclus.

Assisted by Claude/Codex.
