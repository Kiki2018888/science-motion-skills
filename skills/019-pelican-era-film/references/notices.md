# 许可与第三方声明

通用版在 `assets/medium/brushes.js` 提取、适配固定提交的二十场画材函数。`styles.json` 逐场标记来源。独立新增的部分包括主体无关的画风规则、绘制与播放接口、场景构建器，以及纸船与偏心轮动作。生成的离线 HTML 附有双方的 MIT 许可和上游第三方声明。[上游许可](upstream/LICENSE) · [上游第三方声明](upstream/THIRD_PARTY_NOTICES.md)

本技能包包含工作流脚本及 [机器人羽毛球展示页](../assets/showcase.html)。页面内嵌了固定提交中改编的材质绘制函数与双骨骼求解器，附有 Elbert 的 MIT 全文、上游第三方声明和技能包的 MIT 全文。其余双人球局绘制、比赛动作、击球声及交互播放器由 Science Motion Skills 为本次改编制作，采用 MIT 许可。展示页用浏览器原生 Canvas、Web Audio 与系统字体。

用户用 `scripts/fetch-upstream.sh` 取得的原影片工程，须连同其 `LICENSE`、`THIRD_PARTY_NOTICES.md` 及随所分发字体或库要求提供的许可证一起保留。[上游源头](https://github.com/orbitoo/pelican-test) · [固定版本](https://github.com/orbitoo/pelican-test/tree/59c8ca2657ce5b2cf067969b5bda19d6609af8ac)

本页对应的上游提交为 `59c8ca2657ce5b2cf067969b5bda19d6609af8ac`。

## 影片源码

上游仓库 <https://github.com/orbitoo/pelican-test> 的 `LICENSE` 全文如下，版权人为 Elbert：

```
MIT License

Copyright (c) 2026 Elbert

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

技能包自身的说明与脚本使用本目录 `LICENSE`（MIT，版权人为 pelican-era-film skill package 的贡献者）。两份 MIT 互不替代。

## 已核对的第三方组件

下列结论来自固定提交里的 `THIRD_PARTY_NOTICES.md`、`package.json`、`public/vendor/` 文件头，以及上游许可证原文。打包进本技能的文件没有包含这些二进制。

| 组件 | 固定树中的位置 | 许可 | 核对方式 |
| --- | --- | --- | --- |
| p5.js 2.3.4 | `public/vendor/p5.min.js` 内含版本串 `"2.3.4"`；`package.json` 依赖 `^2.3.4` | LGPL-2.1 | 对照 <https://github.com/processing/p5.js/blob/v2.3.4/license.txt>。压缩包开头没有许可证横幅。 |
| p5.brush 3.0.0 | `public/vendor/p5.brush.js`；`package.json` 依赖 `^3.0.0` | MIT，Copyright (c) 2023-2026 Alejandro Campos Uribe | 对照 <https://github.com/acamposuribe/p5.brush/blob/main/LICENSE.md> 与 npm 包 `p5.brush@3.0.0` 的 MIT 声明。压缩包开头没有许可证横幅。 |
| simplex-noise | 由 p5.brush 传递依赖；压缩包前部含内联二维单纯形噪声实现 | MIT，Copyright (c) Jonas Wagner | 仅依上游 `THIRD_PARTY_NOTICES.md` 与压缩包形态，未对 jwagner/simplex-noise 做逐字节比对。 |
| puppeteer-core ^24 | 仅开发依赖，不打进页面 | Apache-2.0 | 依上游声明与 npm 包许可。本技能的截帧脚本不调用它。 |
| FFmpeg | 系统命令，`tools/encode.sh` 才会调用 | LGPL 或 GPL，视本机构建而定 | 未捆绑。调用前用户自行确认本机 FFmpeg 的许可证。 |

分发含 `p5.min.js` 的作品时，同时附上 LGPL-2.1 全文，并保留上述版权声明。p5.js 是库；影片应用代码通过脚本标签调用它。本技能不把影片代码解释成 p5.js 的修改版。

## 字体

`public/fonts/` 同时有子集化 `.woff2`（播放器实际引用）和较大的 `.ttf` 原件。`public/style.css` 的 `@font-face` 先写 woff2，再写 ttf。固定树里没有单独的 OFL 文本文件，只有 `THIRD_PARTY_NOTICES.md` 中的说明：

- Noto Serif SC、Noto Sans SC：SIL Open Font License 1.1，Copyright Google LLC / Adobe
- LXGW WenKai（霞鹜文楷）：SIL Open Font License 1.1，Copyright LXGW 与 Fontworks Inc.（衍生自 Klee One）
- JetBrains Mono：SIL Open Font License 1.1，Copyright JetBrains s.r.o.

这些名称与 OFL 1.1 的常见归属一致。本技能没有把 woff2 子集与字体厂商的发行包逐字节比对。再分发字体文件时，附上对应 OFL 1.1 与版权声明，不能只留子集文件。`fetch-upstream.sh` 默认会取回 ttf；`--skip-source-fonts` 只省略 ttf，woff2 仍在，OFL 义务仍然适用。

## 公共领域致敬

上游声明所致敬的历史作品（塔西里岩画、埃及墓葬壁画、汉画像石、吴道子白描、范宽《溪山行旅图》、张择端《清明上河图》、玛雅抄本、莫卧儿细密画、八大山人、哇扬皮影、广重东海道、梵高《星月夜》1889、蒙克《呐喊》1893、茂瑙《诺斯费拉图》1922）按该声明处于公共领域。画面是程序化致敬，不是那些作品的扫描件。第 16–20 场的界面、像素关卡和发布会道具，上游声明为虚构原创，不含真实品牌。改这些画面时不要画入真实商标或受保护角色。
