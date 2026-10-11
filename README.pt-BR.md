[Demonstração ao vivo](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Marca do Unwedged">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

Encontre uma rota com curvas antes que o sofá chegue.

Uma ficha de campo local para medir uma planta de um único piso e verificar em 2D um objeto retangular rígido.

**3,204 poses de rota verificadas de forma independente.** Método de verificação: executar os dois predefinidos bem-sucedidos e, em seguida, amostrar cada segmento retornado em 800 intervalos usando Shapely. [Reproduza a verificação](CONTRIBUTING.md). A amostragem testa a implementação. O verificador confere o movimento contínuo no modelo 2D desenhado.

| Antes                                                                      | Depois                                                                                       |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Medir a largura da porta, o cômodo, os obstáculos e a altura de transporte | Uma rota de curva candidata com cada segmento de movimento certificado de forma conservadora |
| Dúvida sobre conseguir fazer a curva                                       | Medidas salvas, reprodução da rota e uma planta cotada para revisar                          |

![Gravação real no navegador de uma rota de móvel contornando uma parede](assets/demo.gif)

Unwedged verifica o movimento de um retângulo rígido em um único piso. Não modela 3D, escadas, inclinação, carregadores ou deformação. Uma busca limitada pode não encontrar uma rota. Ela nunca prova que a passagem é impossível.

O desenho é o modelo. Meça o que você desenhar.

## Início rápido

Instale Node.js 22.12 ou mais recente. Este comando baixa o app uma vez e depois o disponibiliza neste computador em `127.0.0.1`: O Git também precisa estar instalado.

```sh
npx github:Arthur031221/Unwedged
```

O app no navegador inclui as fontes e o worker do solver. Após a primeira visita, aguarde o indicador "Pronto para uso offline" antes de confiar no uso offline do app e da busca de rotas. Os arquivos do projeto ficam no navegador ou na pasta de downloads. O app não faz chamadas de API durante o uso.

## Exemplo de cinco linhas

Salve isto como `room.json`, abra no app e escolha Find route. As dimensões estão em centímetros e os ângulos em radianos.

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## Fluxo de trabalho

1. Escolha Apartment hallway, Corner landing ou Blocked corridor e informe as dimensões medidas do cômodo e dos obstáculos.
2. Informe o comprimento e a largura do móvel, a altura fixa de transporte e a margem de segurança. Defina as posições e os ângulos inicial e de destino.
3. Busque uma rota. O worker verifica as folgas sem travar o editor. Reproduza ou percorra as poses retornadas.
4. Salve as medidas e a rota verificada novamente em JSON, compartilhe-as no fragmento de uma URL ou exporte uma planta de rota SVG cotada.

As medidas são salvas em centímetros. Você pode mudar a exibição para polegadas. Editar ou mover qualquer geometria descarta a rota atual antes da próxima busca.

## Instalação por sistema operacional

<details><summary>macOS</summary>

Instale Node.js 22.12 ou mais recente, abra o Terminal e execute `npx github:Arthur031221/Unwedged`. Abra o endereço de loopback exibido. Encerre o servidor com Ctrl+C. O Git também precisa estar instalado.

</details>

<details><summary>Linux</summary>

Instale Node.js 22.12 ou mais recente, abra um terminal e execute `npx github:Arthur031221/Unwedged`. Abra o endereço de loopback exibido. Encerre o servidor com Ctrl+C. O Git também precisa estar instalado.

</details>

<details><summary>Windows</summary>

Instale Node.js 22.12 ou mais recente, abra o PowerShell e execute `npx github:Arthur031221/Unwedged`. Abra o endereço de loopback exibido. Encerre o servidor com Ctrl+C. O Git também precisa estar instalado.

</details>

## Arquivos do projeto

- `src/core/geometry.ts` calcula contornos orientados, vãos de portas e a folga física.
- `src/core/verify.ts` certifica cada intervalo de movimento com limites contínuos adaptativos.
- `src/core/search.ts` executa uma busca A* determinística com limites finitos de estados e tempo.
- `src/worker.ts` executa a busca e a verificação de rotas importadas fora da thread da interface.
- `src/locales` contém nove traduções da interface.
- `docs/accuracy.md` descreve as verificações geométricas e os limites do solver.

## Desenvolvimento

Em um checkout do repositório, execute `npm ci`, `npm run dev`, `npm test` e `npm run build`. `CONTRIBUTING.md` lista as verificações de navegador, uso offline, pacote e Shapely independente. O repositório inclui os arquivos de fontes e seus avisos OFL.

Assisted by Claude/Codex.
