---
name: 007-quake-monitor-render
description: 将事件与强度变化制作成地震局或数据监测屏动效，配置波形、地图事件、月份、数值、落印及裂缝。支持仪表盘、独立模块和可跨镜头复用的固定监测带，以统一事件时间轴同步波峰、月份、数值定格与盖章。用于科普盘点和节点监测；不用于真实地震预警、数据测量或物理裂纹仿真。
---

# 地震局与事件监测屏动效

用随附 Canvas 模板输出离线预览和静音 H.264 MP4。保留认可样片的滚动信号、扩散事件、月份翻页、数值锁定、徽章落印和沿父路径分叉的裂缝。默认 1920×1080、24 fps；当前为 16:9 横屏。

先读 [配置说明](references/config.md)。以 `assets/examples/monitor.json` 制作完整监测屏；`network.json` 演示本地 SVG 拓扑图、多事件、跨年、百分比和圆章；`cracks.json` 演示独立裂缝模块及自定义分支。

固定底部监测带和重复事件定格使用 `monitor-band.json`：`layout: monitor-band` 与统一的 `monitor.events`。可选 `appearance: amber-night`；旧仪表盘配色和布局保持默认。跨镜头嵌入可复用 `assets/template/monitor-band.js`，先读配置说明中的“固定监测带”。

**v3.0.0**　深色仪表盘区分主面板与波形条的投影强度。信号线带辉光，月份翻页使用带厚度的日历卡片。

代表样片配置　[夜间监测屏](assets/examples/monitor.json)

## 制作

将示例 JSON 复制到 `output/007-quake-monitor-render/` 下的具体场景目录，按主题同时更新标题、事件、单位、年份、徽章、阶段文案和配色。所有时刻以视频起点的秒数计算；波形冻结不会推迟日历、事件或其他模块。无需改引擎。地图支持示意世界轮廓或本地 PNG/JPEG/WebP/SVG；本地图片与事件归一化坐标应对应，底图按面板尺寸铺满。图片路径相对输入 JSON，不要引用安装目录内的输出文件。

```powershell
python -B -X utf8 '<技能目录>\scripts\render_monitor.py' --config '<工作目录>\config.json' --output '<工作目录>\monitor.mp4' --check-only
```

检查 `_source/contact.jpg` 或离线 `index.html`，确认文字、标注与画面节奏后去掉 `--check-only` 编码。同名更新加 `--overwrite`。支持 `--chrome`、`--ffmpeg`、`--scale 1|2`。依赖 Python 3.10+、Playwright Python、Pillow、Chrome 和相邻的 FFmpeg/ffprobe，使用独立 Python 环境。不要向技能包复制运行环境。

## 参数与限制

`layout` 选择 `dashboard` 或 `map/calendar/magnitude/cracks/wave` 独立构图；仪表盘可关闭地图、日历、波形。数值和裂缝共用主面板，应错开。徽章可以独立于数值出现，支持方框、圆章、旋转、颜色和落印时长。

波形是可配置程序信号，脉冲强度不自动换算成震级。震级是独立输入数值，也可改成评分、百分比等。若使用真实事件，由用户提供或另行核实数据；不要把默认示意地图当作准确行政边界地图，把程序波形当成实测信号，或声称裂纹路径具有物理预测能力。

长文字会在各自区域内缩小；缩到难以阅读时脚本报错，应精简文案。多事件的 `offset` 由作者调整，检查相互遮挡；当前不自动求解所有标签碰撞。定量数据需要完整曲线/坐标轴时，应另用数据图表工具。

固定监测带使用独立排版检查：事件标题与副文案最多三行，数值字号最低120设计像素，超出容器时报错。制作限制放工程记录；画面脚注按具体项目要求配置。

## 验收与归档

渲染器检查月份和年份切换、数值锁定、波形暂停、事件进出、裂缝完成、乱序跳帧像素一致性，并核对编码尺寸、帧数和完整解码。仍要查看关键帧：事件标签是否清楚、落印是否遮住数值、裂缝分支是否连贯、月份翻页能否看清。

输出旁 `_source` 包含原始与归一化配置、HTML/JS、字体许可、素材副本及 SHA-256、预览图、报告。默认源包自带字体；仅在项目案例归档时可用 `--shared-font <案例/_公共资源/body.otf>`，此时移动预览须带上公共资源。交付保留成片、配置和可复现源码，临时检查放系统 TEMP，避免在项目积累过程版本。

案例统一保存在项目 `output/007-quake-monitor-render/`；技能包同步保存在 `skills/007-quake-monitor-render/`。独立动效产物也放上述案例目录，视频合成项目引用这些文件，不改脚本文稿。

引擎接口：`window.__dur`、`await window.__seek(t)`、`window.__stateAt(t)`、`window.__inspect()`。任意时间直接求画面，不依赖上一帧；字体和本地图片加载完成后才开始采集。


## 局部预览与统一编码

需要只改某一段、查看指定关键帧或对齐成片色彩时，读 [共同渲染接口](references/rendering.md)。支持 `--frames START:END`、`--preview-frames` 和 `--profile bt709|legacy`，默认统一BT.709；原配置中的时间仍为完整场景时间。

## Portable runtime

需要 Python 3.10+、Playwright、Pillow、Chrome/Chromium 与 FFmpeg/ffprobe。自动查找 PATH 和常见安装位置；也可传 `--chrome` / `--ffmpeg`，或设置 `CHROME_BIN` / `FFMPEG_BIN`。输出必须位于技能目录之外。

默认样片在 Canvas 内绘制整幅背景。`--alpha` 可导出 VP9 WebM，实际透明范围见导出报告的 `alpha_min` 和 `alpha_max`。
