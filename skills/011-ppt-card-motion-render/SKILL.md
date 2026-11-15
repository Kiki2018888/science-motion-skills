---
name: 011-ppt-card-motion-render
description: 制作可自由编排的卡片动效视频。每张卡片、文字、图片和图表可独立设置大小、位置、层级与时间轴，支持移位变形、路径运动、淡入滑动翻转、编组及八种 UI 外观。适用于 PPT 风格讲解、信息卡片动画和动态排版；输出 MP4 与离线预览，不编辑原生 PPTX 动画。
---

# 011 · 自由卡片动效

v2 默认按内容设计自由画布：卡片直接放在画布上，每个元素有自己的几何尺寸、外观和动作。八种 UI 风格只是可选外观，不规定看板、网格或左右栏。可在同一画面混用风格，通常以一种为主以保持一致。

## 创作与实现

先安排关键构图和阅读顺序，再设计各元素如何从一个位置变化到下一个位置。可以是不等大的卡片、独立文字、重叠图片、局部放大、横向或纵向排布；不必从旧看板案例开始，也不需要每屏同时展示多个模块。

- 新作品使用 `mode:"freeform"` 和场景 `elements[]`。完整字段与最小可运行例子见 [references/freeform.md](references/freeform.md)。
- 每个元素独立设置 `x/y/w/h/z`；用 `keyframes` 控制位置、真实宽高、缩放、旋转、圆角、透明度、模糊、字号及图表进度。空关键帧表示保持当前位置直到该时间。
- `enter/exit` 提供淡入、滑动、缩放、翻转、擦除、模糊；`motionPath` 定义三次贝塞尔路径；`group/children` 让多张独立卡片一起移动。可以在需要时组合，避免动作争抢重点。
- `card / text / metric / image / chart / list / pill / group / path` 是内容组件，可自由组合；它们不是整屏模板。图像与文字也可以作为卡片子元素手工排版。
- `blocks / photo / glass / dense / neon / editorial / header / console` 是八种外观。项目、场景、单个元素均可指定 `style`，再用 `appearance` 局部改色、圆角、边框、内边距和文字样式。
- 同一个镜头内保留元素 ID，通过关键帧重排；不要为了换位置重新建整屏或把全部卡片合并成大看板。只有构图确实需要容器时，才使用背景面板。

示例入口：`assets/examples/freeform/showcase.json` 是 50 秒八风格自由编排样片；同目录八份单场景 JSON 可分别复用。示例用于说明能力，不要求实际作品重复相同数量、构图或节奏。

## 渲染

```powershell
python "<技能目录>/scripts/render_cards.py" `
  --config "<任务目录>/project.json" `
  --output "<任务目录>/out/cards_v02.mp4" `
  --check-only
```

先看同名 `_source/contact.jpg` 和关键帧，特别检查卡片移动前后、缩小后和重叠时的文字。再去掉 `--check-only` 正式渲染；已有同名检查目录时加 `--overwrite`，正式新变体使用新名称。依赖 Python、Playwright、Pillow、Chrome 和 FFmpeg/FFprobe。浏览器与编码器按 CHROME_BIN、FFMPEG_BIN、PATH 和常见安装位置发现，也可显式传 --chrome / --ffmpeg。

默认 1920×1080、30 fps；自由模式支持其他偶数尺寸及 24/25/30/60 fps。输出 H.264、yuv420p、BT.709 limited-range；附可暂停拖动的离线 `_source/engine.html`、配置、字体、素材和验收报告。截图检测允许极少量浏览器阴影抗锯齿舍入差异，状态求值必须一致。

- `--frames 60:150` 保留原时间轴、导出起始包含结束不包含的帧区间；`--preview-frames 0,60,120` 另存 PNG。
- `--audio narration.wav` 合成已有音频，短音频补静音。长于完整画面的音频默认报错；先调整镜头时长，只有明确允许截音时才用 `--trim-audio`。
- 图片使用本机路径或相对于 JSON 的路径，自动复制归档；不联网抓图。保留本地 Source 字体和 OFL 许可。
- 文案、数据和素材按用户要求确定。示例工作台数字不是事实来源。真实 PPTX 文件的读取和原生动画不是本技能能力。

## 兼容与来源

原有 v1 看板配置仍能渲染：没有 `elements[]` 的旧 `scenes` 自动走原引擎，字段见 [references/config.md](references/config.md)。它们只是兼容模式，不是新作品的默认布局。

编号仍为 011，不占新号。来源与改动见 [references/provenance.md](references/provenance.md)。公开源码与示例采用 MIT；字体保留 SIL OFL 1.1。
