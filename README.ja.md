[ライブデモ](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged のマーク">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

ソファが届く前に、曲がって通れる経路を見つけます。

実測した平面図で、剛体の長方形の家具が曲がって通れるかを調べるローカル測定ツールです。

![家具が壁を回り込む実際のブラウザー録画](assets/demo.gif)

**試す:** ライブデモを開き、「Corner landing」を選びます。幅 74 cm で経路を検索して再生し、幅を 75 cm に変えてみます。制限付き検索で経路が見つからなくても、通行不能の証明にはなりません。

## クイックスタート

Node.js 22.12 以降と Git をインストールし、次のコマンドでアプリをローカル起動します。

```sh
npx github:Arthur031221/Unwedged#v1.3.0
```

コマンドはアプリをダウンロードし、コンピューターの `127.0.0.1` で配信します。初回アクセス後、オフライン利用に頼る前に「オフライン準備完了」の表示を待ってください。測定値はブラウザー内または保存したファイルに残ります。

Unwedged は一つの階で移動する剛体の長方形を扱います。3D、階段、傾ける動作、運搬者、変形は扱いません。検索には上限があり、経路を見落とすことがあります。通行不能を証明するものではありません。

X と Y は中心の座標です。原点は左下で、X は右、Y は上に増えます。正の角度は反時計回りです。例は[使い方](docs/usage.md)を参照してください。

図面がモデルです。描いたものを測りましょう。

## 最初の使い方

1. Apartment hallway、Corner landing、Blocked corridor のいずれかを選び、部屋と障害物の実測寸法を入力します。
2. 家具の長さ、幅、固定した持ち上げ高さ、安全余裕を入力し、開始位置と目的地の位置、角度を設定します。
3. 経路を検索し、得られた姿勢を再生またはスクラブして確認します。端点の衝突や、安全余裕を下回る隙間を警告します。
4. 測定値と再確認済みの経路を JSON で保存し、プロジェクトリンクを共有するか、寸法付き SVG 経路図を出力します。

座標と編集方法は[使い方](docs/usage.md)、幾何チェックと検索上限は[精度と制限](docs/accuracy.md)を参照してください。

## 5 行の例

次の内容を `room.json` として保存し、アプリで開いて経路を検索します。寸法はセンチメートル、角度はラジアンです。

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## OS 別インストール

Node.js 22.12 以降と Git をインストールし、Terminal、Linux の端末または PowerShell で次のコマンドを実行します。表示されたアドレスを開き、Ctrl+C で停止します。

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

## プロジェクトのファイル

- `src/core/geometry.ts` は向きのある外形、ドアの隙間、物理的なクリアランスを計算します。
- `src/core/verify.ts` は適応型の連続境界を使って各移動区間を検証します。
- `src/core/search.ts` は有限の状態数と時間制限を持つ決定的な A* 探索を行います。
- `src/worker.ts` は検索とインポートしたルートの検証をインターフェースのスレッド外で実行します。
- `src/locales` には9種類のインターフェース翻訳があります。
- [docs/accuracy.md](docs/accuracy.md) では幾何チェックとソルバーの制限を説明します。

## 開発

リポジトリで `npm ci`、`npm run dev`、`npm test`、`npm run build` を実行します。[CONTRIBUTING.md](CONTRIBUTING.md) にブラウザー、オフライン、パッケージ、独立した Shapely の確認方法があります。フォントと OFL 表記も含まれます。

Assisted by Claude/Codex.
