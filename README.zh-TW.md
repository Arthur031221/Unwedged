[線上示範](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged 標誌">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

在沙發送到前，找出可轉彎通行的路線。

這是一份本機使用的現場量測表，用來測量單層格局，並以 2D 檢查剛性矩形物件。

**已獨立檢查 3,204 個路線姿態。** 檢查方式如下。執行兩個成功的預設案例，再使用 Shapely 將每個回傳的線段取樣 800 個間隔。[重現這項檢查](CONTRIBUTING.md)。取樣用來測試實作，驗證器則檢查繪製的 2D 模型中的連續運動。

| 之前                             | 之後                                             |
| -------------------------------- | ------------------------------------------------ |
| 量好門寬、房間、障礙物和搬運高度 | 候選轉彎路線，每個移動線段都經保守驗證           |
| 不確定能否轉彎通過               | 可供檢視的已儲存量測、路線播放和標註尺寸的路線圖 |

![家具路線繞過牆面的實際瀏覽器錄影](assets/demo.gif)

Unwedged 檢查在同一樓層移動的剛性矩形物件。它不模擬 3D、樓梯、傾斜、搬運者或物件變形。有限搜尋可能會漏掉路線，也永遠不會證明物件無法通過。

圖面就是模型。請量測你畫進去的內容。

## 快速開始

安裝 Node.js 22.12 或更新版本。以下指令會下載一次應用程式，接著在這台電腦的 `127.0.0.1` 提供服務： 也需要安裝 Git。

```sh
npx github:Arthur031221/Unwedged
```

瀏覽器應用程式內含字型和求解器工作執行緒。首次造訪後，請等候「離線就緒」指示出現，再依賴離線使用應用程式和路線搜尋。專案檔留在瀏覽器或下載資料夾中。應用程式執行期間不會呼叫 API。

## 五行範例

將以下內容存成 `room.json`，在應用程式中開啟，然後選擇 Find route。尺寸單位為公分，角度單位為弧度。

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## 工作流程

1. 選擇 Apartment hallway、Corner landing 或 Blocked corridor，接著輸入量測過的房間和障礙物尺寸。
2. 輸入家具長度、寬度、固定搬運高度和安全邊界，設定起點與目的地的位置和角度。
3. 搜尋路線。工作執行緒會檢查間隙，不會凍結編輯器。播放或拖曳檢視回傳的姿態。
4. 將量測和重新檢查過的路線存為 JSON、透過 URL 雜湊分享，或匯出標註尺寸的 SVG 路線圖。

量測值以公分儲存。顯示單位可切換為英吋。編輯或移動任何幾何物件後，下次搜尋前目前路線就會被清除。

## 依主機安裝

<details><summary>macOS</summary>

安裝 Node.js 22.12 或更新版本，開啟 Terminal 並執行 `npx github:Arthur031221/Unwedged`。開啟顯示的迴路位址。按 Ctrl+C 停止伺服器。 也需要安裝 Git。

</details>

<details><summary>Linux</summary>

安裝 Node.js 22.12 或更新版本，開啟終端機並執行 `npx github:Arthur031221/Unwedged`。開啟顯示的迴路位址。按 Ctrl+C 停止伺服器。 也需要安裝 Git。

</details>

<details><summary>Windows</summary>

安裝 Node.js 22.12 或更新版本，開啟 PowerShell 並執行 `npx github:Arthur031221/Unwedged`。開啟顯示的迴路位址。按 Ctrl+C 停止伺服器。 也需要安裝 Git。

</details>

## 專案檔案

- `src/core/geometry.ts` 計算有方向的外框、門口間隙和實際淨空。
- `src/core/verify.ts` 使用自適應連續界限驗證每個移動區間。
- `src/core/search.ts` 執行具有限狀態與時間限制的確定性 A* 搜尋。
- `src/worker.ts` 在介面執行緒之外執行搜尋和匯入路線驗證。
- `src/locales` 存放九種介面翻譯。
- `docs/accuracy.md` 說明幾何檢查和求解器限制。

## 開發

在程式碼檢出目錄中執行 `npm ci`、`npm run dev`、`npm test` 和 `npm run build`。`CONTRIBUTING.md` 列出瀏覽器、離線、套件和獨立 Shapely 檢查。儲存庫內含字型檔及其 OFL 授權聲明。

Assisted by Claude/Codex.
