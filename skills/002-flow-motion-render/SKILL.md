---
name: 002-flow-motion-render
description: 将流程、因果链或条件分支制作成动效视频。支持五种卡片形状、连续圆角、分支汇合、分道回路、循环虚线和方向光标，可检查线条与标签遮挡。适用于科普解释和技术路线，提供浅色、琥珀暗夜、横竖屏以及透明 WebM 导出。
---

# 流程与因果链动效

用随附的 HTML/SVG 模板及 Python 渲染器生成本地预览和 H.264 MP4。配置为 JSON，无需远程页面或 API。沿用用户确认的浅色卡片、节点逐步出现、路径推进与返回的表达。连线端点不画固定箭头，由移动光标表达方向。

**v3.0.0** 的默认圆角卡片采用超椭圆轮廓（指数 4.5）。接触阴影和左上边缘光勾出厚度。浅色用极淡的底部渐变和深色文字投影，琥珀暗夜加顶部反光、细颗粒和暖色文字辉光。

## 配置内容

先确定节点、关系及叙述顺序。保留用户指定的分支条件与返回位置；流程先后不能自动当作已证实的科学因果。用户只给简单流程时可补充动画节奏，不添加未经给出的研究结论。

读取 [references/config.md](references/config.md) 编写 JSON。已有选择优先；否则默认横屏 1920×1080、浅色配色、圆角矩形、圆形光标、24fps。竖屏使用 1080×1920 并重新排版。

- 全局 nodeDefaults、theme、states、edgeDefaults、cursor 决定默认外观；单个节点或边可覆盖。
- 形状：rect / rounded / pill / circle / diamond。圆形须宽高相等；圆形和菱形的文字空间较小，宜增加尺寸或精简说明，不强行缩小到不可读。
- 光标：circle / triangle，均保留。三角形沿路径切线转动，返回前在停留阶段掉头；到达后光标消失，端点不留箭头。
- 简单链可用 column / row 网格布局；复杂分支、汇合及回路可显式设 position、端口、via。自动布局不等于复杂图的自动避障，检查会指出穿入卡片的路径。
- events 安排节点多次判断和状态；travels 安排同一连线多次推进、暂停及返回。条件可用节点标签或连线标签标明。
- 连续循环使用 `animation.mode: dashed`，按原时间持续移动虚线；多个回程使用 `routing: lane` 分道。新布局建议将 validation 的 paths、labels、crossings 设为 error，检查线条折返、重合、交叉及标签遮挡。不能把复杂关系图理解为自动避障。
- `appearance: amber-night` 选用暗夜配色、琥珀辉光和细边框铭牌。默认浅色配色适合文档型内容。
- 横屏默认卡片为 300×190，标题与说明分别为 40px 和 22px。竖屏默认卡片为 520×200，字号分别为 46px 和 26px。可在 `nodeDefaults` 或节点 `style` 单独调整。

按需要参考完整配置，不把示例文案当作正式内容：

- [最小配置](assets/examples/minimal.json)：三个节点，默认布局与时间轴。
- [判断与返回](assets/examples/research-loop.json)：24 秒横屏，证据不足、补充实验、重新判断；圆形光标。
- [竖屏五种形状](assets/examples/portrait-shapes.json)：分支汇合、形状/局部颜色覆盖、隐藏元素；三角形光标。
- [连续循环](assets/examples/continuous-loop.json)：暗夜配色，上下分道回程，连续移动虚线。

同一条五节点流程有三份可直接重渲的 v3 代表样片配置。[琥珀暗夜横屏](assets/examples/showcase-amber.json) · [浅色横屏](assets/examples/showcase-light.json) · [竖屏纵列](assets/examples/showcase-portrait.json)

用户未要求声音时输出无声视频。有实测配音时间时据此编排，不截断旁白迁就模板。配音、BGM 或调用 MiniMax 需要相应用户请求。

## 生成

在仓库根目录运行以下命令。第一条导出主样片，第二条生成能叠在其他画面上的透明 WebM。

```bash
python skills/002-flow-motion-render/scripts/render_flow.py --config skills/002-flow-motion-render/assets/examples/showcase-amber.json --output output/flow-amber.mp4
python skills/002-flow-motion-render/scripts/render_flow.py --config skills/002-flow-motion-render/assets/examples/showcase-amber.json --output output/flow-overlay.webm --alpha
```

渲染器自动查找本机浏览器与 FFmpeg，也可传 `--chrome` 和 `--ffmpeg`。透明导出需要 FFmpeg 带 `libvpx-vp9` 编解码器。

选项：--check-only 只做源文件、关键帧与检查；--cursor circle/triangle 覆盖全局光标（单边显式覆盖仍优先）；--fps 24/30；--scale 1/2 设置采集倍率，默认 2 倍后降采样。输出已存在时用新版本名；明确要覆盖时才用 --overwrite，仅替换指定输出及对应源目录中的生成文件。

## 检查与交付

脚本校验配置、引用、时间顺序、卡片文字布局、路径与卡片穿插、任意时间定位一致性、光标朝向，并核对成片格式、帧数及完整解码。过密或文字放不下时改配置，不跳过检查。

查看 `<输出名>_source/contact.jpg` 和 poster.png，重点看条件分支、回路转弯、圆形/菱形内的文字、编号及状态标签；必要时预览动作。报告中的 layout_warnings 和 path_diagnostics 给出采样几何检查结果，仍需视觉确认动态入场和整体层次。

交付视频并保留同名 _source 目录中的 HTML、配置、字体许可和 report.json。预览支持播放、暂停、拖时间轴，以及按配置/圆形/三角形切换；全部参数通过 input.json 修改后重渲。视频用绝对路径内嵌，简短说明画幅和光标。中间帧经管道编码，不保存海量中间图片。


## 局部预览与统一编码

需要只改某一段、查看指定关键帧或对齐成片色彩时，读 [共同渲染接口](references/rendering.md)。支持 `--frames START:END`、`--preview-frames` 和 `--profile bt709|legacy`，默认统一BT.709；原配置中的时间仍为完整场景时间。


## Portable runtime

需要 Python 3.10+、Playwright、Pillow、Chrome/Chromium 与 FFmpeg/ffprobe。自动查找 PATH 和常见安装位置；也可传 `--chrome` / `--ffmpeg`，或设置 `CHROME_BIN` / `FFMPEG_BIN`。输出必须位于技能目录之外。
