[線上示範](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged 標誌">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

沙發送到前，先找出可轉彎通行的路線。

本機量測工具，可檢查剛性矩形物件能否在實測的單層格局中轉彎通行。

![家具路線繞過牆面的實際瀏覽器錄影](assets/demo.gif)

**試用：**開啟線上示範並選擇 Corner landing。在寬度 74 cm 時尋找並播放路線，再將寬度改為 75 cm。有限搜尋找不到路線，並不能證明無法通行。

## 快速開始

安裝 Node.js 22.12 或更新版本及 Git，然後在本機執行應用程式：

```sh
npx github:Arthur031221/Unwedged#v1.3.0
```

指令會下載應用程式，並在電腦的 `127.0.0.1` 提供服務。首次造訪後，請等候「離線就緒」提示，再依賴離線使用。量測值會留在瀏覽器或你儲存的檔案中。

Unwedged 模擬剛性矩形物件在同一樓層移動。它不模擬 3D、樓梯、傾斜、搬運者或物件變形。搜尋範圍有限，可能漏掉路線，也不會證明無法通行。

X 和 Y 表示中心點座標。原點在左下角，X 向右增加，Y 向上增加。正角度逆時針旋轉。範例請見[使用說明](docs/usage.md)。

圖面就是模型。請量測你畫進去的內容。

## 開始使用

1. 選擇 Apartment hallway、Corner landing 或 Blocked corridor，然後輸入實測的房間和障礙物尺寸。
2. 輸入家具長度、寬度、固定搬運高度和安全邊界，並設定起點與目的地的位置和角度。
3. 搜尋路線，然後播放或拖曳檢視回傳的姿態。警告會指出端點碰撞或淨空低於所需邊界。
4. 將量測和重新檢查過的路線存為 JSON、分享專案連結，或匯出標註尺寸的 SVG 路線圖。

[使用說明](docs/usage.md)介紹座標和編輯方法。[精度與限制](docs/accuracy.md)說明幾何檢查和搜尋限制。

## 五行範例

將以下內容存成 `room.json`，在應用程式中開啟並選擇 Find route。尺寸單位為公分，角度單位為弧度。

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## 依作業系統安裝

安裝 Node.js 22.12 或更新版本及 Git，然後在 Terminal、Linux 終端機或 PowerShell 執行下列指令。開啟顯示的位址，按 Ctrl+C 停止伺服器。

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

## 專案檔案

- `src/core/geometry.ts` 計算有方向的外框、門口間隙和實際淨空。
- `src/core/verify.ts` 使用自適應連續界限驗證每個移動區間。
- `src/core/search.ts` 執行具有限狀態與時間限制的確定性 A* 搜尋。
- `src/worker.ts` 在介面執行緒之外執行搜尋和匯入路線驗證。
- `src/locales` 存放九種介面翻譯。
- [docs/accuracy.md](docs/accuracy.md) 說明幾何檢查和求解器限制。

## 開發

在程式碼檢出目錄中執行 `npm ci`、`npm run dev`、`npm test` 和 `npm run build`。[CONTRIBUTING.md](CONTRIBUTING.md) 列出瀏覽器、離線、套件和獨立 Shapely 檢查。儲存庫內含字型檔及其 OFL 授權聲明。

Assisted by Claude/Codex.
