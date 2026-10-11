[ライブデモ](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged のマーク">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

ソファが届く前に、曲がり角を通れるルートを見つけましょう。

一階分の間取りを測り、剛体の長方形の品物を2Dで確認するための、現場用の測定シートです。

**独立にサンプリングした経路姿勢は6,408件です。** 成功する2つのプリセットと4つの回帰ケースを実行し、返された各ルートの各区間を Shapely で800間隔に分けてサンプリングします。6ルートには縦向きと横向きの両方のドア開口が含まれます。[検査を再現する](CONTRIBUTING.md)。サンプリングは実装を評価する証拠です。アプリの検証器は、描画した2Dモデル内の連続運動を別途検査します。

| 使用前                                     | 使用後                                               |
| ------------------------------------------ | ---------------------------------------------------- |
| ドア幅、部屋、障害物、持ち上げる高さを測定 | 候補となる旋回ルートと、各移動区間の保守的な検証結果 |
| 曲がって通れるか不明                       | 保存した測定値、ルート再生、寸法入りのルート図で確認 |

![壁を回り込む家具ルートの実際のブラウザー録画](assets/demo.gif)

**試すには:** Corner landing を選び、家具の幅を74から75に変更してから Undo と Redo を使います。測定値を変更するとルートは破棄されます。ルートを検索し、結果を再生します。

Undo と Redo では、まとめて行った測定値の編集を元に戻したりやり直したりできます。測定値はローカルに自動保存され、次回の訪問時に復元できます。ルートは自動保存に含まれません。ブラウザーの保存領域を利用できない場合は、Save project でコピーを保存してください。キーボードでは入力欄を編集できます。モバイルでは Measurements ボタンから障害物編集パネルを開けます。ドアの開口位置は壁に沿ってずらせます。ずらした開口を含むファイルはスキーマバージョン2を使い、古いクライアントでは拒否されます。中央配置のバージョン1ファイルは引き続き読み込めます。

Unwedged は、同じ階で移動する剛体の長方形を検査します。3D、階段、傾ける動作、運び手、変形はモデル化しません。探索には上限があり、ルートを見つけられない場合でも、通過不能とは証明できません。

図面がモデルです。描いたものを実測してください。

## クイックスタート

Node.js 22.12 以降をインストールします。このコマンドはアプリを一度ダウンロードし、このコンピューターの `127.0.0.1` で配信します。 Git もインストールしてください。

```sh
npx github:Arthur031221/Unwedged#v1.1.0
```

ブラウザーアプリにはフォントとソルバーのワーカースレッドが含まれています。初回アクセス後、アプリとルート探索をオフラインで使う前に「オフライン利用可能」の表示を待ってください。プロジェクトファイルはブラウザー内またはダウンロード先に保存されます。アプリは実行中に API を呼び出しません。

## 5行の例

次の内容を `room.json` として保存し、アプリで開いて Find route を選びます。寸法はセンチメートル、角度はラジアンです。

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## 作業の流れ

1. Apartment hallway、Corner landing、Blocked corridor のいずれかを選び、実測した部屋と障害物の寸法を入力します。
2. 家具の長さ、幅、固定の持ち上げ高さ、安全余白を入力し、開始位置と目的地の位置、角度を設定します。
3. ルートを検索します。ワーカーがクリアランスを確認する間もエディターは操作できます。返された姿勢を再生またはスクラブして確認します。
4. 測定値と再検証済みルートを JSON で保存するか、URL のハッシュで共有するか、寸法入り SVG のルート図として書き出します。

測定値はセンチメートルで保存されます。表示をインチに切り替えることもできます。形状を編集または移動すると、次の検索の前に現在のルートが消去されます。

## OS別のインストール

<details><summary>macOS</summary>

Node.js 22.12 以降をインストールし、Terminal を開いて `npx github:Arthur031221/Unwedged#v1.1.0` を実行します。表示されたループバックアドレスを開きます。Ctrl+C でサーバーを停止します。 Git もインストールしてください。

</details>

<details><summary>Linux</summary>

Node.js 22.12 以降をインストールし、ターミナルを開いて `npx github:Arthur031221/Unwedged#v1.1.0` を実行します。表示されたループバックアドレスを開きます。Ctrl+C でサーバーを停止します。 Git もインストールしてください。

</details>

<details><summary>Windows</summary>

Node.js 22.12 以降をインストールし、PowerShell を開いて `npx github:Arthur031221/Unwedged#v1.1.0` を実行します。表示されたループバックアドレスを開きます。Ctrl+C でサーバーを停止します。 Git もインストールしてください。

</details>

## プロジェクトファイル

- `src/core/geometry.ts` は向きのある外形、ドアの隙間、物理的なクリアランスを計算します。
- `src/core/verify.ts` は適応型の連続境界を使って各移動区間を検証します。
- `src/core/search.ts` は有限の状態数と時間制限を持つ決定的な A* 探索を行います。
- `src/worker.ts` は検索とインポートしたルートの検証をインターフェースのスレッド外で実行します。
- `src/locales` には9種類のインターフェース翻訳があります。
- `docs/accuracy.md` では幾何チェックとソルバーの制限を説明します。

## 開発

チェックアウトしたリポジトリから `npm ci`、`npm run dev`、`npm test`、`npm run build` を実行します。`CONTRIBUTING.md` にはブラウザー、オフライン、パッケージ、独立した Shapely の各チェックが記載されています。リポジトリにはフォントファイルとその OFL 通知が含まれています。

Assisted by Claude/Codex.
