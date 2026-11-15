---
name: 006-layer-explode-render
description: 将多层结构制作成立体分层拆解动效，配置层数、各层图片与程序纹理、标注、展开方向、间距、时间轴和背景，支持错峰展开、逐层强调与重新组装。适用于材料层次、过滤模块、设备组成和科普结构示意；不自动切割任意三维模型或从单张图片恢复内部结构。
---

# 分层剖面与拆解动效

使用随附 Canvas 模板，将 2–10 层矩形材料或部件绘制成带厚度的立体投影，导出离线 HTML 与静音 H.264 MP4。保留已认可样片的错峰展开、跟随标注、逐层强调和按序复位。

## 准备内容

先读 [参数说明](references/config.md)。以 `assets/examples/filter.json` 为程序纹理示例，`image-right.json` 为图片替换与横向展开示例，`ten-layers.json` 为多层斜向展开且不复位的示例。

`layers` 按装配时从底到顶排列；用稳定 ID 指定强调对象。换主题时一起修改标题、层标签、说明和强调顺序。图片素材贴在矩形层面上，可独立设置尺寸比例与厚度；不把普通照片当成已知的内部结构。若目标是异形器官、真实机械拆装或模型剖切，应使用相应素材/几何实现，不能声称这个平面分层模板已完成真实三维切割。

程序纹理包括纯色、支撑格、折叠、颗粒、细网和开槽，可改配色、密度和随机种子；图片支持本地 PNG/JPEG/WebP/SVG。图片会复制到输出源目录并记录摘要。SVG 内的外链资源应先转成本地自包含素材。

## 配置与导出

默认使用 1920×1080 横屏、24 fps，输出为无声动效素材。时间轴使用“整体停留→错峰展开→展开停留→逐层强调→停留→复位→收尾”，可关闭复位。按既有配音时长调整各阶段，而不是截断配音。

```powershell
python -B -X utf8 '<技能目录>\scripts\render_layers.py' --config '<工作目录>\config.json' --output '<工作目录>\layers.mp4' --check-only
```

先检查 `layers_source/contact.jpg`、`poster.png` 或 `index.html`，再去掉 `--check-only` 导出。同名更新显式加 `--overwrite`。支持 `--chrome <exe>`、`--ffmpeg <exe>`、`--scale 1|2`。依赖 Python 3.10+、Playwright Python、Pillow、本机 Chrome、FFmpeg/ffprobe；使用独立虚拟环境，不把运行环境复制进技能或 项目输出目录。

画面根据装配与展开两端位置计算固定缩放，所以增加层数或间距会使部件缩小。要更大，减少同屏层数或调整 `layout.artBox`、`geometry`；不要用极小文字塞进过多说明。横向展开尤其需要检查层面遮挡与引线；标签右侧列表自动按展开后的上下位置排序，编号始终对应原装配层次。

## 验收与交付

脚本核验装配/展开/最终位置、强调层 ID、文字布局、乱序跳帧像素一致性，以及视频尺寸、帧数和完整解码。另做视觉检查：材料区别是否清楚，间距是否足够，标签与引线是否可追踪，运动中有无不合适的遮挡，背景对比是否足够。方向是屏幕中的示意展开向量，不是物理碰撞模拟；需要真实机械路径时另行建模。

输出旁 `_source` 保留原始与展开配置、网页、字体许可、素材副本与 SHA-256、关键帧及报告。本项目参数与成片统一放 `output/006-layer-explode-render/`，安装目录不存输出。编码用帧管道，不落地大量图片序列。

接口：`window.__dur`、`await window.__seek(t)`、`window.__stateAt(t)`、`window.__inspect()`。每帧由时间直接求位置和强调强度，纹理由稳定种子预先绘制，字体加载后才开始采集。修改时间函数或绘图状态后复查任意定位一致性。

## Portable runtime

需要 Python 3.10+、Playwright、Pillow、Chrome/Chromium 与 FFmpeg/ffprobe。自动查找 PATH 和常见安装位置；也可传 `--chrome` / `--ffmpeg`，或设置 `CHROME_BIN` / `FFMPEG_BIN`。输出必须位于技能目录之外。


## 局部预览与统一编码

读 [共同渲染接口](references/rendering.md)。支持 `--frames START:END`、`--preview-frames` 和 `--profile bt709|legacy`；默认有限范围 BT.709，时间仍使用原场景时间轴。
