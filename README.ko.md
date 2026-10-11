[라이브 데모](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged 마크">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

소파가 도착하기 전에 회전 경로를 찾으세요.

실측한 단층 평면도에서 단단한 직사각형 가구가 회전해 통과할 수 있는지 확인하는 로컬 측정 도구입니다.

![가구가 벽을 돌아가는 실제 브라우저 녹화](assets/demo.gif)

**사용해 보기:** 라이브 데모를 열고 Corner landing을 선택하세요. 폭 74 cm에서 경로를 찾고 재생한 다음 폭을 75 cm로 바꿔 보세요. 제한된 검색에서 경로를 찾지 못해도 통과가 불가능하다는 뜻은 아닙니다.

## 빠른 시작

Node.js 22.12 이상과 Git을 설치한 뒤 다음 명령으로 앱을 로컬에서 실행하세요.

```sh
npx github:Arthur031221/Unwedged#v1.3.0
```

명령이 앱을 다운로드하고 컴퓨터의 `127.0.0.1`에서 제공합니다. 첫 방문 후 오프라인 사용에 의존하기 전에 "오프라인 준비 완료" 표시를 기다리세요. 측정값은 브라우저 저장소나 저장한 파일에 남습니다.

Unwedged는 한 층에서 움직이는 단단한 직사각형을 모델링합니다. 3D, 계단, 기울이기, 운반자, 변형은 모델링하지 않습니다. 검색에는 한계가 있어 경로를 놓칠 수 있으며 통과 불가를 증명하지 않습니다.

X와 Y는 중심 좌표입니다. 원점은 왼쪽 아래이고 X는 오른쪽, Y는 위쪽으로 증가합니다. 양수 각도는 반시계 방향으로 회전합니다. 예시는 [사용법](docs/usage.md)을 참고하세요.

그림이 모델입니다. 그린 것을 측정하세요.

## 처음 사용하기

1. Apartment hallway, Corner landing, Blocked corridor 중 하나를 고르고 방과 장애물의 실측 치수를 입력하세요.
2. 가구 길이와 너비, 고정 운반 높이, 안전 여유를 입력하고 시작점과 목적지의 위치 및 각도를 설정하세요.
3. 경로를 찾은 뒤 결과 자세를 재생하거나 이동하며 확인하세요. 끝점 충돌이나 필요한 안전 여유보다 작은 간격을 경고합니다.
4. 측정값과 다시 확인한 경로를 JSON으로 저장하거나 프로젝트 링크를 공유하거나 치수가 표시된 SVG 경로도를 내보내세요.

좌표와 편집 방법은 [사용법](docs/usage.md), 기하 검사와 검색 한계는 [정확도와 제한](docs/accuracy.md)을 참고하세요.

## 다섯 줄 예제

다음 내용을 `room.json`으로 저장해 앱에서 열고 경로 찾기를 선택하세요. 치수는 센티미터, 각도는 라디안입니다.

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## 운영체제별 설치

Node.js 22.12 이상과 Git을 설치한 뒤 Terminal, Linux 터미널 또는 PowerShell에서 다음 명령을 실행하세요. 표시된 주소를 열고 Ctrl+C로 서버를 중지합니다.

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

## 프로젝트 파일

- `src/core/geometry.ts`는 방향이 있는 외곽선, 출입구 간격, 실제 여유 공간을 계산합니다.
- `src/core/verify.ts`는 적응형 연속 경계를 사용해 각 이동 구간을 인증합니다.
- `src/core/search.ts`는 유한한 상태와 시간 제한을 둔 결정적 A* 탐색을 실행합니다.
- `src/worker.ts`는 인터페이스 스레드 밖에서 경로 검색과 가져온 경로 검증을 실행합니다.
- `src/locales`에는 아홉 가지 인터페이스 번역이 있습니다.
- [docs/accuracy.md](docs/accuracy.md)는 기하 검사와 솔버의 한계를 설명합니다.

## 개발

저장소에서 `npm ci`, `npm run dev`, `npm test`, `npm run build`를 실행하세요. [CONTRIBUTING.md](CONTRIBUTING.md)에 브라우저, 오프라인, 패키지, 독립 Shapely 확인 방법이 있습니다. 글꼴 파일과 OFL 고지도 포함되어 있습니다.

Assisted by Claude/Codex.
