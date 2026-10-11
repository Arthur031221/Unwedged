[Demo en vivo](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Marca de Unwedged">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

Encuentra una ruta con giros antes de que llegue el sofá.

Una hoja de campo local para medir una planta de una sola altura y comprobar en 2D un objeto rectangular rígido.

**6.408 poses de ruta muestreadas de forma independiente.** La comprobación ejecuta los dos ajustes preestablecidos que encuentran ruta y cuatro casos de regresión. Después muestrea cada ruta devuelta en 800 intervalos por segmento con Shapely. Las seis rutas incluyen ambas orientaciones de puerta. [Reproduce la comprobación](CONTRIBUTING.md). El muestreo aporta evidencia sobre la implementación. El verificador de la aplicación comprueba por separado el movimiento continuo en el modelo 2D dibujado.

| Antes                                                                           | Después                                                                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Medir el ancho de la puerta, la habitación, los obstáculos y la altura de carga | Una ruta de giro posible con cada segmento de movimiento certificado de forma conservadora |
| No saber si se puede girar                                                      | Medidas guardadas, reproducción de la ruta y plano acotado para revisar                    |

![Grabación real del navegador de una ruta de muebles alrededor de una pared](assets/demo.gif)

**Pruébalo:** elige Corner landing, cambia el ancho del mueble de 74 a 75 y usa Undo y Redo. La ruta se descarta cuando cambian las medidas. Busca una ruta y reproduce el resultado.

Undo y Redo restauran grupos de cambios en las medidas. Las medidas se guardan automáticamente en el almacenamiento local y se pueden recuperar en la siguiente visita. Las rutas no se incluyen en ese guardado. Si el navegador no tiene almacenamiento disponible, usa Save project para conservar una copia. Quienes usan teclado pueden editar los campos. En móviles, el botón Measurements abre el panel para editar obstáculos. Las aberturas de puerta se pueden desplazar a lo largo de una pared. Los archivos con una abertura desplazada usan el esquema versión 2 y los clientes antiguos los rechazan. Los archivos de versión 1 con abertura centrada siguen siendo compatibles.

Unwedged comprueba el movimiento de un rectángulo rígido en una sola planta. No modela 3D, escaleras, inclinación, porteadores ni deformación. Una búsqueda limitada puede pasar por alto una ruta. Nunca demuestra que el paso sea imposible.

El dibujo es el modelo. Mide lo que dibujas.

## Inicio rápido

Instala Node.js 22.12 o posterior. Este comando descarga la aplicación una vez y luego la sirve en este equipo en `127.0.0.1`: También necesitas instalar Git.

```sh
npx github:Arthur031221/Unwedged#v1.1.0
```

La aplicación del navegador incluye sus fuentes y el worker del solucionador. Después de la primera visita, espera al indicador «Listo sin conexión» antes de confiar en el uso sin conexión de la aplicación y la búsqueda de rutas. Los archivos del proyecto permanecen en el navegador o en las descargas. La aplicación no realiza llamadas a API durante el uso.

## Ejemplo de cinco líneas

Guarda esto como `room.json`, ábrelo en la aplicación y elige Find route. Las dimensiones están en centímetros y los ángulos en radianes.

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## Flujo de trabajo

1. Elige Apartment hallway, Corner landing o Blocked corridor e introduce las dimensiones medidas de la habitación y los obstáculos.
2. Introduce el largo y el ancho del mueble, la altura fija de carga y el margen de seguridad. Define las posiciones y los ángulos inicial y de destino.
3. Busca una ruta. El worker comprueba los espacios libres sin bloquear el editor. Reproduce o recorre las poses devueltas.
4. Guarda las medidas y la ruta verificada de nuevo como JSON, compártelas en el fragmento de una URL o exporta un plano de ruta SVG acotado.

Las medidas se guardan en centímetros. Puedes cambiar la visualización a pulgadas. Al editar o mover cualquier geometría, la ruta actual se descarta antes de la siguiente búsqueda.

## Instalación según el sistema

<details><summary>macOS</summary>

Instala Node.js 22.12 o posterior, abre Terminal y ejecuta `npx github:Arthur031221/Unwedged#v1.1.0`. Abre la dirección de bucle local que se muestra. Detén el servidor con Ctrl+C. También necesitas instalar Git.

</details>

<details><summary>Linux</summary>

Instala Node.js 22.12 o posterior, abre una terminal y ejecuta `npx github:Arthur031221/Unwedged#v1.1.0`. Abre la dirección de bucle local que se muestra. Detén el servidor con Ctrl+C. También necesitas instalar Git.

</details>

<details><summary>Windows</summary>

Instala Node.js 22.12 o posterior, abre PowerShell y ejecuta `npx github:Arthur031221/Unwedged#v1.1.0`. Abre la dirección de bucle local que se muestra. Detén el servidor con Ctrl+C. También necesitas instalar Git.

</details>

## Archivos del proyecto

- `src/core/geometry.ts` calcula las huellas orientadas, los huecos de las puertas y el espacio físico disponible.
- `src/core/verify.ts` certifica cada intervalo de movimiento mediante límites continuos adaptativos.
- `src/core/search.ts` ejecuta una búsqueda A* determinista con límites finitos de estados y tiempo.
- `src/worker.ts` ejecuta la búsqueda y la verificación de rutas importadas fuera del hilo de la interfaz.
- `src/locales` contiene nueve traducciones de la interfaz.
- `docs/accuracy.md` describe las comprobaciones geométricas y los límites del solucionador.

## Desarrollo

Desde una copia del repositorio, ejecuta `npm ci`, `npm run dev`, `npm test` y `npm run build`. `CONTRIBUTING.md` enumera las comprobaciones de navegador, modo sin conexión, paquetes y Shapely independiente. El repositorio incluye los archivos de fuentes y sus avisos OFL.

Assisted by Claude/Codex.
