[라이브 데모](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged 마크">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

소파가 도착하기 전에 회전해 통과할 경로를 찾아보세요.

실측한 단층 배치에서 단단한 직사각형 가구가 회전해 통과할 수 있는지 확인하는 로컬 측정 도구입니다.

![벽을 돌아가는 가구 경로의 실제 브라우저 녹화](assets/demo.gif)

**사용해 보기:** 코너 홀을 선택하고 예제 너비 74 cm에서 경로 찾기를 누른 뒤 경로 재생을 누르세요. 너비를 75 cm로 바꾸면 경로가 사라집니다. 실행 취소와 다시 실행으로 편집을 확인하세요. 너비 75 cm에서 제한된 검색이 경로를 찾지 못해도 통과할 수 없다는 증거는 아닙니다.

새 빈 계획 만들기를 눌러 벽과 장애물이 없는 배치를 만들고 계획 이름을 입력하세요. 만들기는 실행 취소 한 단계로 기록되고 치수는 로컬에 자동 저장됩니다. 이름을 바꿔도 인증된 경로는 유지됩니다. 경로 찾기는 계획 옆에 있고 검색 중에는 검색 취소로 바뀝니다. 공유는 클립보드가 있으면 링크를 복사하고, 없으면 주소 표시줄에 남기며 결과를 알려줍니다. 제목은 선택한 단위를 따르고 경로 도면 SVG 설명에는 계획 이름이 표시됩니다.

숫자 치수는 입력란을 벗어나거나 Enter를 누르면 전체 값이 확정됩니다. 잘못된 값에는 눈에 보이고 접근 가능한 안내가 표시되며 수정할 때까지 검색, 공유, 저장, 내보내기가 차단됩니다. 벽 크기를 바꿔도 측정한 출입구 너비와 오프셋은 유지되며, 서로 맞지 않는 치수는 거부됩니다. 프로젝트 열기에 성공하면 실행 취소할 수 있습니다. 가져오기가 거부되면 현재 배치와 인증된 경로가 유지됩니다.

실행 취소와 다시 실행은 묶인 치수 편집을 복원합니다. 치수는 로컬에 저장되어 다음 방문 때 복구할 수 있지만 경로는 저장되지 않습니다. 브라우저 저장소를 쓸 수 없다면 프로젝트 저장을 사용하세요. 필드는 키보드로 편집할 수 있습니다. 모바일에서는 치수 버튼으로 장애물을 편집합니다. 출입구는 벽을 따라 옮길 수 있습니다. 오프셋 파일은 스키마 버전 2를 사용하므로 이전 클라이언트에서 거부됩니다. 가운데 정렬된 버전 1 파일은 계속 호환됩니다.

Unwedged는 같은 층에서 이동하는 단단한 직사각형 물체를 확인합니다. 3D, 계단, 기울이기, 운반자 또는 물체 변형은 모델링하지 않습니다. 제한된 탐색은 경로를 놓칠 수 있습니다. 통과할 수 없다는 것을 증명하지는 않습니다.

그림이 모델입니다. 그림에 넣은 것을 측정하세요.

## 빠른 시작

Node.js 22.12 이상을 설치하세요. 이 명령은 앱을 한 번 다운로드한 다음 이 컴퓨터의 `127.0.0.1`에서 제공합니다. Git도 설치해야 합니다.

```sh
npx github:Arthur031221/Unwedged#v1.2.0
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

Node.js 22.12 이상을 설치하고 Terminal을 열어 `npx github:Arthur031221/Unwedged#v1.2.0`를 실행하세요. 표시된 루프백 주소를 여세요. Ctrl+C를 눌러 서버를 중지합니다. Git도 설치해야 합니다.

</details>

<details><summary>Linux</summary>

Node.js 22.12 이상을 설치하고 터미널을 열어 `npx github:Arthur031221/Unwedged#v1.2.0`를 실행하세요. 표시된 루프백 주소를 여세요. Ctrl+C를 눌러 서버를 중지합니다. Git도 설치해야 합니다.

</details>

<details><summary>Windows</summary>

Node.js 22.12 이상을 설치하고 PowerShell을 열어 `npx github:Arthur031221/Unwedged#v1.2.0`를 실행하세요. 표시된 루프백 주소를 여세요. Ctrl+C를 눌러 서버를 중지합니다. Git도 설치해야 합니다.

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
