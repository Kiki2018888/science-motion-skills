---
name: 002-flow-motion-render
description: 将流程、因果链或条件分支制作成可配置的动效视频。支持五种卡片形状、配色与状态变化、分支汇合、多通道回路、持续循环虚线、横竖屏，以及圆形或沿路径转向的三角形光标，含线条重合和标签遮挡检查。适用于科普解释、实验流程、技术路线和政策影响链动画；静态流程图或真实业务流程执行不属于本技能。
---

# 流程与因果链动效

用随附的 HTML/SVG 模板及 Python 渲染器生成本地预览和 H.264 MP4。配置为 JSON，无需远程页面或 API。沿用用户确认的浅色卡片、节点逐步出现、路径推进与返回的表达。连线端点不画固定箭头，由移动光标表达方向。

## 配置内容

先确定节点、关系及叙述顺序。保留用户指定的分支条件与返回位置；流程先后不能自动当作已证实的科学因果。用户只给简单流程时可补充动画节奏，不添加未经给出的研究结论。

读取 [references/config.md](references/config.md) 编写 JSON。已有选择优先；否则默认横屏 1920×1080、浅色配色、圆角矩形、圆形光标、24fps。竖屏使用 1080×1920 并重新排版。

- 全局 nodeDefaults、theme、states、edgeDefaults、cursor 决定默认外观；单个节点或边可覆盖。
- 形状：rect / rounded / pill / circle / diamond。圆形须宽高相等；圆形和菱形的文字空间较小，宜增加尺寸或精简说明，不强行缩小到不可读。
- 光标：circle / triangle，均保留。三角形沿路径切线转动，返回前在停留阶段掉头；到达后光标消失，端点不留箭头。
- 简单链可用 column / row 网格布局；复杂分支、汇合及回路可显式设 position、端口、via。自动布局不等于复杂图的自动避障，检查会指出穿入卡片的路径。
- events 安排节点多次判断和状态；travels 安排同一连线多次推进、暂停及返回。条件可用节点标签或连线标签标明。
- 连续循环使用 `animation.mode: dashed`，按原时间持续移动虚线；多个回程使用 `routing: lane` 分道。新布局建议将 validation 的 paths、labels、crossings 设为 error，检查线条折返、重合、交叉及标签遮挡。不能把复杂关系图理解为自动避障。
- `appearance: amber-night` 可选暗夜配色、细边框和方形铭牌；默认浅色风格不变。

按需要参考完整配置，不把示例文案当作正式内容：

- [最小配置](assets/examples/minimal.json)：三个节点，默认布局与时间轴。
- [判断与返回](assets/examples/research-loop.json)：24 秒横屏，证据不足、补充实验、重新判断；圆形光标。
- [竖屏五种形状](assets/examples/portrait-shapes.json)：分支汇合、形状/局部颜色覆盖、隐藏元素；三角形光标。
- [连续循环](assets/examples/continuous-loop.json)：暗夜配色，上下分道回程，连续移动虚线。

用户未要求声音时输出无声视频。有实测配音时间时据此编排，不截断旁白迁就模板。配音、BGM 或调用 MiniMax 需要相应用户请求。

## 生成

本项目的配置和输出统一放在 `output/002-flow-motion-render/`，技能目录作为只读模板；临时技术检查放系统 TEMP。`<skill>` 是本 SKILL.md 所在目录：

```powershell
python -X utf8 '<skill>\scripts\render_flow.py' --config '<配置绝对路径>.json' --output '<输出绝对路径>.mp4'
```

默认使用本机 Chrome 与既有 FFmpeg。其他环境可用包含 Playwright、Pillow 的 Python，传 --chrome、--ffmpeg；无需下载 Playwright 浏览器。受限环境无法启动浏览器时按工具审批机制重试，不修改安全配置。

选项：--check-only 只做源文件、关键帧与检查；--cursor circle/triangle 覆盖全局光标（单边显式覆盖仍优先）；--fps 24/30；--scale 1/2 设置采集倍率，默认 2 倍后降采样。输出已存在时用新版本名；明确要覆盖时才用 --overwrite，仅替换指定输出及对应源目录中的生成文件。

## 检查与交付

脚本校验配置、引用、时间顺序、卡片文字布局、路径与卡片穿插、任意时间定位一致性、光标朝向，并核对成片格式、帧数及完整解码。过密或文字放不下时改配置，不跳过检查。

查看 `<输出名>_source/contact.jpg` 和 poster.png，重点看条件分支、回路转弯、圆形/菱形内的文字、编号及状态标签；必要时预览动作。报告中的 layout_warnings 和 path_diagnostics 给出采样几何检查结果，仍需视觉确认动态入场和整体层次。

交付视频并保留同名 _source 目录中的 HTML、配置、字体许可和 report.json。预览支持播放、暂停、拖时间轴，以及按配置/圆形/三角形切换；全部参数通过 input.json 修改后重渲。视频用绝对路径内嵌，简短说明画幅和光标。中间帧经管道编码，不保存海量中间图片。


## 局部预览与统一编码

需要只改某一段、查看指定关键帧或对齐成片色彩时，读 [共同渲染接口](references/rendering.md)。支持 `--frames START:END`、`--preview-frames` 和 `--profile bt709|legacy`，默认统一BT.709；原配置中的时间仍为完整场景时间。


## Portable runtime

需要 Python 3.10+、Playwright、Pillow、Chrome/Chromium 与 FFmpeg/ffprobe。自动查找 PATH 和常见安装位置；也可传 `--chrome` / `--ffmpeg`，或设置 `CHROME_BIN` / `FFMPEG_BIN`。输出必须位于技能目录之外。
