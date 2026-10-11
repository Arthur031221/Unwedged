[在线演示](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged 标志">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

沙发送到前，先找出可以转弯通行的路线。

一款本地测量工具，用于检查刚性矩形物件能否在实测的单层户型中转弯通行。

![家具路线绕过墙面的真实浏览器录屏](assets/demo.gif)

**试用：**打开在线演示并选择 Corner landing。在宽度 74 cm 时查找并播放路线，再将宽度改为 75 cm。有限搜索找不到路线，并不能证明无法通行。

## 快速开始

安装 Node.js 22.12 或更新版本及 Git，然后在本机运行应用：

```sh
npx github:Arthur031221/Unwedged#v1.3.0
```

命令会下载应用，并在电脑的 `127.0.0.1` 上提供服务。首次访问后，请等待"离线就绪"提示，再依赖离线使用。测量值保存在浏览器或你保存的文件中。

Unwedged 模拟刚性矩形物件在同一楼层移动。它不模拟 3D、楼梯、倾斜、搬运者或物件变形。搜索范围有限，可能漏掉路线，也不会证明无法通行。

X 和 Y 表示中心点坐标。原点在左下角，X 向右增加，Y 向上增加。正角度按逆时针旋转。示例见[使用说明](docs/usage.md)。

图纸就是模型。请测量你画进去的内容。

## 首次使用

1. 选择 Apartment hallway、Corner landing 或 Blocked corridor，然后输入实测房间和障碍物尺寸。
2. 输入家具长度、宽度、固定搬运高度和安全余量，并设置起点与目的地的位置和角度。
3. 搜索路线，然后播放或拖动查看返回的姿态。警告会指出端点碰撞或净空低于所需余量。
4. 将测量值和重新检查过的路线保存为 JSON，分享项目链接，或导出标注尺寸的 SVG 路线图。

[使用说明](docs/usage.md)介绍坐标和编辑方法。[精度与限制](docs/accuracy.md)说明几何检查和搜索限制。

## 五行示例

将以下内容保存为 `room.json`，在应用中打开并选择 Find route。尺寸单位为厘米，角度单位为弧度。

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## 按系统安装

安装 Node.js 22.12 或更新版本及 Git，然后在 Terminal、Linux 终端或 PowerShell 中运行以下命令。打开显示的地址，按 Ctrl+C 停止服务器。

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

## 项目文件

- `src/core/geometry.ts` 计算有方向的外框、门口间隙和实际净空。
- `src/core/verify.ts` 使用自适应连续边界验证每个移动区间。
- `src/core/search.ts` 执行具有有限状态和时间限制的确定性 A* 搜索。
- `src/worker.ts` 在界面线程之外执行搜索和导入路线验证。
- `src/locales` 包含九种界面翻译。
- [docs/accuracy.md](docs/accuracy.md) 介绍几何检查和求解器限制。

## 开发

在代码检出目录中运行 `npm ci`、`npm run dev`、`npm test` 和 `npm run build`。[CONTRIBUTING.md](CONTRIBUTING.md) 列出了浏览器、离线、软件包和独立 Shapely 检查。仓库包含字体文件及其 OFL 声明。

Assisted by Claude/Codex.
