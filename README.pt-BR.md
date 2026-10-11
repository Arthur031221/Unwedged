[Demonstração ao vivo](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Marca do Unwedged">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

Encontre uma rota com curvas antes de o sofá chegar.

Uma ferramenta local de medição que verifica se um objeto retangular rígido consegue fazer curvas em uma planta medida de um único piso.

![Gravação real do navegador de um móvel contornando uma parede](assets/demo.gif)

**Experimente:** abra a demonstração e escolha Corner landing. Encontre e reproduza a rota com 74 cm, depois altere a largura para 75 cm. Se a busca limitada não encontrar uma rota, isso não prova que a passagem seja impossível.

## Início rápido

Instale Node.js 22.12 ou mais recente e Git, depois execute o app localmente:

```sh
npx github:Arthur031221/Unwedged#v1.3.0
```

O comando baixa o app e o disponibiliza no computador em `127.0.0.1`. Após a primeira visita, aguarde o indicador "Pronto para uso offline" antes de depender do modo offline. As medidas ficam no navegador ou nos arquivos salvos.

Unwedged modela um retângulo rígido que se move em um piso. Não modela 3D, escadas, inclinação, carregadores nem deformação. A busca é limitada, pode deixar de encontrar uma rota e não prova que a passagem seja impossível.

X e Y indicam os centros. A origem fica no canto inferior esquerdo, X aumenta para a direita e Y para cima. Ângulos positivos giram no sentido anti-horário. Veja o exemplo em [Uso](docs/usage.md).

O desenho é o modelo. Meça o que você desenhou.

## Primeiro uso

1. Escolha Apartment hallway, Corner landing ou Blocked corridor e informe as medidas da sala e dos obstáculos.
2. Informe o comprimento e a largura do móvel, a altura fixa de transporte e a margem de segurança. Defina as posições e os ângulos de início e destino.
3. Busque uma rota e reproduza ou percorra as poses encontradas. Os avisos indicam colisões nas extremidades ou folga abaixo da margem necessária.
4. Salve as medidas e a rota verificada em JSON, compartilhe um link do projeto ou exporte uma planta SVG cotada.

[Uso](docs/usage.md) explica coordenadas e edição. [Precisão e limites](docs/accuracy.md) descreve as verificações geométricas e os limites da busca.

## Exemplo de cinco linhas

Salve como `room.json`, abra no app e escolha Buscar rota. As dimensões estão em centímetros e os ângulos em radianos.

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## Instalação por sistema

Instale Node.js 22.12 ou mais recente e Git, depois execute o comando no Terminal, em um terminal Linux ou no PowerShell. Abra o endereço exibido e pare o servidor com Ctrl+C.

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

## Arquivos do projeto

- `src/core/geometry.ts` calcula contornos orientados, vãos de portas e a folga física.
- `src/core/verify.ts` certifica cada intervalo de movimento com limites contínuos adaptativos.
- `src/core/search.ts` executa uma busca A* determinística com limites finitos de estados e tempo.
- `src/worker.ts` executa a busca e a verificação de rotas importadas fora da thread da interface.
- `src/locales` contém nove traduções da interface.
- [docs/accuracy.md](docs/accuracy.md) descreve as verificações geométricas e os limites do solver.

## Desenvolvimento

No repositório, execute `npm ci`, `npm run dev`, `npm test` e `npm run build`. [CONTRIBUTING.md](CONTRIBUTING.md) lista as verificações de navegador, modo offline, pacote e Shapely independente. Os arquivos de fontes e seus avisos OFL estão incluídos.

Assisted by Claude/Codex.
