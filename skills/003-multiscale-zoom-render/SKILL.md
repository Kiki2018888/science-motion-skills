---
name: 003-multiscale-zoom-render
description: 将整体到细节的多个观察尺度制作成连续缩放视频。可替换照片、显微图、PNG、JPEG、WebP、SVG 素材，配置层级、焦点、推进与停留时间、比例尺、文字和横竖屏。适用于科普尺度对比、局部深入和多层结构解释；不是从一张图片自动生成真实微观细节。
---

# 多尺度连续缩放

将各层素材放在同一个坐标系中，以连续相机推进串起“整体—局部—细节”。保留建立画面、推进、到达和停留的节奏。脚本输出可离线预览的 HTML 源文件、关键帧、检查报告及无声 H.264 MP4。

## 选模式与准备配置

- **换主题**：使用 `scene.type: images`，每层准备 PNG / JPEG / WebP / SVG。照片、显微图、3D 渲染静帧可以混用；当前模板不直接读取视频或 3D 模型。
- **重做叶片演示**：使用 `scene.type: leaf`，保留用户已认可的叶片—叶面—表皮细胞—气孔程序绘图。相机、文字和界面配色可配置；叶片内部绘图结构仍由 `leaf.js` 决定，不把它误当作任意主题生成器。
- 复制 [叶片配置](assets/examples/leaf.json) 或 [电路板竖屏配置](assets/examples/circuit-portrait.json) 到工作目录。电路板配置依赖同级 `circuit/`，一起复制或修改素材路径。
- 修改参数前读 [配置说明](references/config.md)，准备实际素材时读其中“对齐素材”。素材与配置、输出保存在当前任务工作目录，不写入技能安装目录。

素材须有对应尺度的实际内容。普通照片无法凭缩放产生真实细胞或原子结构；没有真实测量依据时使用示意说明、关闭比例尺或自定义单位。图片内容的科学真实性与几何对齐需要人工审看，自动检查不能证明它们。

## 预览与导出

依赖：Python 3.10+、Playwright Python、Pillow、本机 Chrome、FFmpeg / ffprobe。不使用外部生成服务，不需要 API key。复用现有环境，不将依赖目录复制到项目中。

Python 3.10 或更高版本；依赖安装见仓库 README。

```powershell
python -B -X utf8 '<技能目录>\scripts\render_zoom.py' --config '<工作目录>\config.json' --output '<工作目录>\zoom.mp4' --check-only
```

打开 `zoom_source/index.html` 或检查 `contact.jpg`、`poster.png`。调整焦点、素材对齐、文字长度和节奏。正式导出时去掉 `--check-only`；同一目标已生成过预览时加 `--overwrite`。`--overwrite` 明确允许更新该输出及其源目录中的生成文件。

可用参数：`--chrome <exe>`、`--ffmpeg <exe>`、`--scale 1|2`。默认 2 倍采集后降采样；默认 Chrome 与 FFmpeg 路径按当前机器设置，可覆盖。无头 Chrome 若受执行沙箱限制，按当前工具权限规则处理，不把超时误报为代码已通过。

## 验收与交付

脚本检查各层落点、相机边界连续性、比例尺投影关系、乱序跳帧像素一致性、文字/标注布局、视频尺寸与帧数及全片解码。仍需视觉检查：层间是否对齐、有无矩形贴片感或模糊放大、观察位置是否清楚、标注是否指对对象。纯图片层的渐显由视野宽度控制，缩回时反向消失。

保留原始配置、实际素材及输出旁的 `_source` 目录。`config.js` 内嵌本次图片，预览不依赖图片原位置；`input.json` 保留原参数，`resolved.json` 保留展开后的配置，`assets.json` 记录素材路径与摘要。修改源配置后重新渲染，不把旧 MP4 当作新结果。

交付 MP4 与预览入口，概括使用的层级和时长。有真实尺寸依据才描述为物理比例；“相对初始画面”是视野宽度之比，不是显微镜物镜倍率。

## 运行接口

`window.__dur` 为总秒数；`await window.__seek(t)` 稳定到指定时刻；`window.__cameraAt(t)` 返回相机状态；`window.__inspect()` 返回当前状态。动画仅取决于时间与配置，不依赖播放顺序。渲染帧经管道编码，不写大批 PNG 序列。

## Portable runtime

需要 Python 3.10+、Playwright、Pillow、Chrome/Chromium 与 FFmpeg/ffprobe。自动查找 PATH 和常见安装位置；也可传 `--chrome` / `--ffmpeg`，或设置 `CHROME_BIN` / `FFMPEG_BIN`。输出必须位于技能目录之外。
