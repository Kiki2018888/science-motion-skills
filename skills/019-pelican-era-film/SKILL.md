---
name: 019-pelican-era-film
description: "用《鹈鹕测试》的 20 种时代画风制作新动作动画。用户给一个动作脚本和一个画风名，Agent 编写角色、道具、镜头与时间轴，再用相应的笔法、造型和材质绘制。支持离线 HTML、同一动作停帧换画风、PNG 与静音 MP4。适用于唐代白描、木版浮世绘、爪哇皮影、像素、示波器等题材迁移及原片复现。"
license: MIT
metadata:
  version: "2.0.0"
  upstream_commit: "59c8ca2657ce5b2cf067969b5bda19d6609af8ac"
---

# 动作脚本 × 20 种时代画风

用户说「用唐代白描画一只松鼠推开窗，把松果放到窗台上」就开始制作。由 Agent 写出新主体、动作、镜头和场景代码。技能提供从原作提取的画材函数、可迁移的造型规则与离线播放器。若用户已有动作源或指定关键帧，沿用已有的时序、坐标和镜头。

## 制作新动作

构建使用 Node.js 22+，播放使用现代浏览器。导出 PNG 使用 Chrome/Chromium，编码 MP4 另需 FFmpeg。

1. 从文字梳理谁动、什么不动、道具由谁持有、什么时候接触或分离。确定画幅、镜头、遮挡、事件和终态。把可检验的关键位置命名为锚点。
2. 从本技能目录运行 `node scripts/style-scene.mjs rules "唐代白描"`。可传中文名、别名、编号或上游场景 ID；`list` 列出全部 20 种。根据返回的造型规则重新设计这个主体的外形，用画材规则画受力线、表面、边缘与空间。
3. 按[场景接口与制作示例](references/scene-authoring.md)编写项目自己的场景 JS。用 `scene.draw(p,t)` 统一驱动人物、物件、环境和镜头，按材质把外形拆成面与线。皮影可在铰点分片，白描可把主轮廓交给兰叶描、硬边交给铁线描。形体很复杂时，在场景里写专用的几何与动作函数。
4. 打包单文件 HTML，实际打开并检查关键帧。用户只选一种就用那一种。做比较时在同一构建里重复 `--style`，保留一份动作程序。停在同一秒检查接触、遮挡和该画风的验收项。交付可播放成品与可修改的场景源。

```sh
node scripts/style-scene.mjs rules 浮世绘
node scripts/style-scene.mjs build --scene examples/paper-boat.js --style 浮世绘 --style 唐代白描 --out boat.html
```

单文件可以双击、暂停、拖时间轴、同帧换风格、全屏。调用 `window.__seek(t)` 或 `renderAt(t)` 可精确定位。需要视频时执行 `node scripts/capture-frames.mjs --html boat.html --clip-start 0 --clip-seconds 9 --fps 30 --out movie`。生成与播放新动作均不需要检出原片或安装 p5。

## 画材与样例

- [20 张画风规则卡](assets/medium/styles.json)含造型、笔法、空间、运动、验收和对应上游函数。[同源画材](assets/medium/brushes.js)与[通用绘制代码](assets/medium/materials.js)把规则作用在当前场景的轮廓上。
- [横屏纸船过桥](examples/paper-boat.js)演示附着、松绳和前景遮挡。[竖屏偏心轮印章](examples/cam-stamp.js)演示刚体运动与两处接触。
- [两台机器人打羽毛球](assets/showcase.html)是手工细化的早期对照样片，含完整六秒五拍回合与击球声。[在线大画面展示](https://kiki2018888.github.io/science-motion-skills/)
- 用户明确要原版《鹈鹕测试》、原片某场或原片节奏时，按[固定版本原片流程](references/upstream-film.md)操作。[原片分场索引](references/style-catalog.md) · [代码修改索引](references/edit-map.md)

上游为 Elbert 的《鹈鹕测试》，固定提交 `59c8ca2657ce5b2cf067969b5bda19d6609af8ac`。通用版保留画材与算法出处。跨主体画风规则、场景接口、适配层和两段新动作由 Science Motion Skills 编写。[上游原作](https://github.com/orbitoo/pelican-test) · [署名与许可](references/notices.md)
