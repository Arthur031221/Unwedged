[線上示範](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged 標誌">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

在沙發送到前，找出可轉彎通行的路線。

這是一款本機量測工具，可檢查剛性矩形物件能否在實測的單層格局中轉彎通行。

![家具路線繞過牆面的實際瀏覽器錄影](assets/demo.gif)

**試用：**選擇轉角平台，在範例寬度 74 cm 時按「尋找路線」，再按「播放路線」。將寬度改為 75 cm，觀察路線消失。使用「復原」和「重做」查看這次編輯。若有限搜尋在 75 cm 時找不到路線，這並不能證明無法通行。

選擇「新增空白方案」，建立沒有牆面和障礙物的格局，並在「方案名稱」輸入名稱。建立方案算一步「復原」，量測值會自動儲存在本機。重新命名會保留已驗證路線。「尋找路線」位於方案旁，搜尋期間會變成「取消搜尋」。「分享」會在剪貼簿可用時複製連結，否則連結會留在網址列並回報結果。標題會顯示所選單位，匯出路線圖的 SVG 說明文字會包含方案名稱。

數值量測會在離開欄位或按 Enter 時完整提交。無效值會顯示可存取的提示，並在修正前阻止搜尋、分享、儲存和匯出。編輯牆面尺寸會保留實測門洞寬度和偏移量。衝突尺寸會遭拒。成功開啟專案後可以復原。匯入遭拒時，目前格局和已認證路線會保留。

「復原」和「重做」會還原成組的量測編輯。量測值會自動儲存在本機，並可於下次造訪時還原。自動儲存不包含路線。如果瀏覽器儲存空間無法使用，請使用「儲存專案」。欄位支援鍵盤操作。行動裝置上可用「尺寸」開啟障礙物編輯面板。門洞可沿牆調整位置。含偏移門洞的檔案使用架構版本 2，舊版用戶端會拒絕。置中的版本 1 檔案仍可開啟。

Unwedged 檢查在同一樓層移動的剛性矩形物件。它不模擬 3D、樓梯、傾斜、搬運者或物件變形。有限搜尋可能會漏掉路線，也永遠不會證明物件無法通過。

圖面就是模型。請量測你畫進去的內容。

## 快速開始

安裝 Node.js 22.12 或更新版本。以下指令會下載一次應用程式，接著在這台電腦的 `127.0.0.1` 提供服務： 也需要安裝 Git。

```sh
npx github:Arthur031221/Unwedged#v1.2.0
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

安裝 Node.js 22.12 或更新版本，開啟 Terminal 並執行 `npx github:Arthur031221/Unwedged#v1.2.0`。開啟顯示的迴路位址。按 Ctrl+C 停止伺服器。 也需要安裝 Git。

</details>

<details><summary>Linux</summary>

安裝 Node.js 22.12 或更新版本，開啟終端機並執行 `npx github:Arthur031221/Unwedged#v1.2.0`。開啟顯示的迴路位址。按 Ctrl+C 停止伺服器。 也需要安裝 Git。

</details>

<details><summary>Windows</summary>

安裝 Node.js 22.12 或更新版本，開啟 PowerShell 並執行 `npx github:Arthur031221/Unwedged#v1.2.0`。開啟顯示的迴路位址。按 Ctrl+C 停止伺服器。 也需要安裝 Git。

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
