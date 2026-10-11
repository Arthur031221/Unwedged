[라이브 데모](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged 마크">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

소파가 도착하기 전에 회전해 통과할 경로를 찾아보세요.

단층 공간을 측정하고 단단한 직사각형 물체를 2D로 확인하는 현장용 측정 안내서입니다.

**독립적으로 표본 검사한 경로 자세는 6,408개입니다.** 경로를 찾는 두 프리셋과 회귀 사례 네 개를 실행한 뒤, 반환된 각 경로의 구간마다 Shapely로 800개 간격을 표본 검사합니다. 여섯 경로에는 두 방향의 출입구가 모두 포함됩니다. [검사를 재현하는 방법](CONTRIBUTING.md). 표본 검사는 구현에 대한 근거를 제공합니다. 앱 검증기는 그려진 2D 모델에서 연속 동작을 별도로 확인합니다.

| 사용 전                               | 사용 후                                                    |
| ------------------------------------- | ---------------------------------------------------------- |
| 문 너비, 방, 장애물, 운반 높이를 측정 | 후보 회전 경로와 각 이동 구간의 보수적 검증                |
| 회전해 통과할 수 있는지 불확실        | 저장된 측정값, 경로 재생, 치수가 표시된 경로 도면으로 검토 |

![벽을 돌아가는 가구 경로의 실제 브라우저 녹화](assets/demo.gif)

**직접 사용해 보기:** Corner landing을 선택하고 가구 너비를 74에서 75로 바꾼 다음 Undo와 Redo를 사용하세요. 치수가 바뀌면 경로가 지워집니다. 경로를 찾고 결과를 재생하세요.

Undo와 Redo는 묶인 치수 편집을 복원합니다. 치수는 로컬에 자동 저장되며 다음 방문 때 복구할 수 있습니다. 경로는 자동 저장에 포함되지 않습니다. 브라우저 저장소를 사용할 수 없다면 Save project를 사용해 사본을 보관하세요. 키보드 사용자는 입력란을 편집할 수 있습니다. 모바일에서는 Measurements 버튼으로 장애물 편집 패널을 엽니다. 문 개구부 위치는 벽을 따라 옮길 수 있습니다. 개구부를 옮긴 파일은 스키마 버전 2를 사용하므로 구버전 클라이언트에서 거부됩니다. 중앙 개구부가 있는 버전 1 파일은 계속 열 수 있습니다.

Unwedged는 같은 층에서 이동하는 단단한 직사각형 물체를 확인합니다. 3D, 계단, 기울이기, 운반자 또는 물체 변형은 모델링하지 않습니다. 제한된 탐색은 경로를 놓칠 수 있습니다. 통과할 수 없다는 것을 증명하지는 않습니다.

그림이 모델입니다. 그림에 넣은 것을 측정하세요.

## 빠른 시작

Node.js 22.12 이상을 설치하세요. 이 명령은 앱을 한 번 다운로드한 다음 이 컴퓨터의 `127.0.0.1`에서 제공합니다. Git도 설치해야 합니다.

```sh
npx github:Arthur031221/Unwedged#v1.1.0
```

브라우저 앱에는 글꼴과 솔버 워커가 포함되어 있습니다. 처음 방문한 뒤 오프라인에서 앱과 경로 검색을 사용하기 전에 "오프라인 준비 완료" 표시가 나타날 때까지 기다리세요. 프로젝트 파일은 브라우저 또는 다운로드 폴더에 저장됩니다. 앱은 실행 중 API를 호출하지 않습니다.

## 다섯 줄 예제

다음 내용을 `room.json`으로 저장해 앱에서 연 뒤 Find route를 선택하세요. 치수는 센티미터이고 각도는 라디안입니다.

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## 작업 흐름

1. Apartment hallway, Corner landing 또는 Blocked corridor를 선택하고 측정한 방과 장애물 치수를 입력합니다.
2. 가구의 길이, 너비, 고정 운반 높이, 안전 여유를 입력합니다. 시작점과 목적지의 위치 및 각도를 설정합니다.
3. 경로를 찾습니다. 워커가 여유 공간을 확인하는 동안 편집기가 멈추지 않습니다. 반환된 자세를 재생하거나 슬라이더로 살펴봅니다.
4. 측정값과 다시 확인한 경로를 JSON으로 저장하거나 URL 해시로 공유하거나 치수가 표시된 SVG 경로 도면으로 내보냅니다.

측정값은 센티미터로 저장됩니다. 표시 단위는 인치로 바꿀 수 있습니다. 어떤 도형이든 편집하거나 이동하면 다음 검색 전에 현재 경로가 지워집니다.

## 운영체제별 설치

<details><summary>macOS</summary>

Node.js 22.12 이상을 설치하고 Terminal을 열어 `npx github:Arthur031221/Unwedged#v1.1.0`를 실행하세요. 표시된 루프백 주소를 여세요. Ctrl+C를 눌러 서버를 중지합니다. Git도 설치해야 합니다.

</details>

<details><summary>Linux</summary>

Node.js 22.12 이상을 설치하고 터미널을 열어 `npx github:Arthur031221/Unwedged#v1.1.0`를 실행하세요. 표시된 루프백 주소를 여세요. Ctrl+C를 눌러 서버를 중지합니다. Git도 설치해야 합니다.

</details>

<details><summary>Windows</summary>

Node.js 22.12 이상을 설치하고 PowerShell을 열어 `npx github:Arthur031221/Unwedged#v1.1.0`를 실행하세요. 표시된 루프백 주소를 여세요. Ctrl+C를 눌러 서버를 중지합니다. Git도 설치해야 합니다.

</details>

## 프로젝트 파일

- `src/core/geometry.ts`는 방향이 있는 외곽선, 출입구 간격, 실제 여유 공간을 계산합니다.
- `src/core/verify.ts`는 적응형 연속 경계를 사용해 각 이동 구간을 인증합니다.
- `src/core/search.ts`는 유한한 상태와 시간 제한을 둔 결정적 A* 탐색을 실행합니다.
- `src/worker.ts`는 인터페이스 스레드 밖에서 경로 검색과 가져온 경로 검증을 실행합니다.
- `src/locales`에는 아홉 가지 인터페이스 번역이 있습니다.
- `docs/accuracy.md`는 기하 검사와 솔버의 한계를 설명합니다.

## 개발

체크아웃한 코드에서 `npm ci`, `npm run dev`, `npm test`, `npm run build`를 실행하세요. `CONTRIBUTING.md`에는 브라우저, 오프라인, 패키지, 독립 Shapely 검사 방법이 있습니다. 저장소에는 글꼴 파일과 OFL 고지가 포함되어 있습니다.

Assisted by Claude/Codex.
