[在线演示](https://arthur031221.github.io/Unwedged/) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português brasileiro](README.pt-BR.md)

# Unwedged

<img src="public/unwedged-mark.svg" width="48" height="48" alt="Unwedged 标志">

[![Node.js 22.12+](https://img.shields.io/badge/Node.js-22.12%2B-3157a0?style=flat-square)](docs/install.md) [![MIT](https://img.shields.io/badge/license-MIT-048b78?style=flat-square)](LICENSE)

在沙发送到之前，找出可以转弯通行的路线。

这是一款本地测量工具，可检查刚性矩形物件能否在实测的单层户型中转弯通行。

![家具路线绕过墙面的真实浏览器录屏](assets/demo.gif)

**试用：**选择转角平台，在示例宽度 74 cm 时点击查找路线，再点击播放路线。将宽度改为 75 cm，观察路线消失。使用撤销和重做查看这次编辑。如果有限搜索在 75 cm 时没有找到路线，这并不能证明无法通行。

选择新建空白方案，开始一个没有墙壁和障碍物的户型，并在方案名称中填写名称。创建方案计为一步撤销，测量值会自动保存在本地。重命名会保留已验证的路线。查找路线位于方案旁，搜索期间会变为取消搜索。分享会在剪贴板可用时复制项目链接，否则链接会留在地址栏并报告结果。标题会显示所选单位，导出的路线图 SVG 说明文字会包含方案名称。

数值测量会在离开输入框或按 Enter 时完整提交。无效值会显示可访问的提示，并在修正前阻止搜索、分享、保存和导出。编辑墙壁尺寸会保留实测门洞宽度和偏移量。冲突尺寸会被拒绝。成功打开项目后可以撤销。导入被拒绝时，当前户型和已认证路线会保留。

撤销和重做会恢复成组的测量编辑。测量值会自动保存在本地，并可在下次访问时恢复。自动保存不包含路线。如果浏览器存储不可用，请使用保存项目。输入框支持键盘操作。在移动设备上，尺寸按钮会打开障碍物编辑面板。门洞可以沿墙移动位置。带偏移门洞的文件使用架构版本 2，旧版客户端会拒绝。居中的版本 1 文件仍可打开。

Unwedged 检查在同一楼层移动的刚性矩形物件。它不模拟 3D、楼梯、倾斜、搬运者或物件变形。有限搜索可能会漏掉路线，也永远不会证明物件无法通过。

图纸就是模型。请测量你画进去的内容。

## 快速开始

安装 Node.js 22.12 或更新版本。以下命令会下载一次应用，然后在这台电脑的 `127.0.0.1` 上提供服务： 也需要安装 Git。

```sh
npx github:Arthur031221/Unwedged#v1.2.0
```

浏览器应用内置字体和求解器工作线程。首次访问后，请等待"离线就绪"指示出现，再依赖离线使用应用和路线搜索。项目文件保存在浏览器或下载文件夹中。应用运行期间不会调用 API。

## 五行示例

将以下内容保存为 `room.json`，在应用中打开，然后选择 Find route。尺寸单位为厘米，角度单位为弧度。

<!-- prettier-ignore -->
```json
{"format":"unwedged","schemaVersion":1,"project":{
  "schemaVersion":1,"name":"Small room","floor":{"width":500,"height":300},
  "furniture":{"length":150,"width":70,"height":70},"margin":2,"rects":[],
  "start":{"x":100,"y":150,"angle":0},"goal":{"x":400,"y":150,"angle":0}
}}
```

## 工作流程

1. 选择 Apartment hallway、Corner landing 或 Blocked corridor，然后输入测量得到的房间和障碍物尺寸。
2. 输入家具长度、宽度、固定搬运高度和安全余量，设置起点与目的地的位置和角度。
3. 搜索路线。工作线程会检查净空，不会冻结编辑器。播放或拖动查看返回的姿态。
4. 将测量数据和重新检查过的路线保存为 JSON，通过 URL 哈希分享，或导出标注尺寸的 SVG 路线图。

测量值以厘米保存。显示单位可以切换为英寸。编辑或移动任何几何物件后，下次搜索之前，当前路线就会被清除。

## 按主机安装

<details><summary>macOS</summary>

安装 Node.js 22.12 或更新版本，打开 Terminal 并运行 `npx github:Arthur031221/Unwedged#v1.2.0`。打开显示的回环地址。按 Ctrl+C 停止服务器。 也需要安装 Git。

</details>

<details><summary>Linux</summary>

安装 Node.js 22.12 或更新版本，打开终端并运行 `npx github:Arthur031221/Unwedged#v1.2.0`。打开显示的回环地址。按 Ctrl+C 停止服务器。 也需要安装 Git。

</details>

<details><summary>Windows</summary>

安装 Node.js 22.12 或更新版本，打开 PowerShell 并运行 `npx github:Arthur031221/Unwedged#v1.2.0`。打开显示的回环地址。按 Ctrl+C 停止服务器。 也需要安装 Git。

</details>

## 项目文件

- `src/core/geometry.ts` 计算有方向的外框、门口间隙和实际净空。
- `src/core/verify.ts` 使用自适应连续边界验证每个移动区间。
- `src/core/search.ts` 执行具有有限状态和时间限制的确定性 A* 搜索。
- `src/worker.ts` 在界面线程之外执行搜索和导入路线验证。
- `src/locales` 包含九种界面翻译。
- `docs/accuracy.md` 介绍几何检查和求解器限制。

## 开发

在代码检出目录中运行 `npm ci`、`npm run dev`、`npm test` 和 `npm run build`。`CONTRIBUTING.md` 列出浏览器、离线、软件包和独立 Shapely 检查。仓库包含字体文件及其 OFL 许可声明。

Assisted by Claude/Codex.
