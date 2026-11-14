---
name: 009-threshold-line-render
description: 将阈值、竞争门槛或标准变化制作成斩杀线标尺与起跑线动效，配置标尺、阈值线、铆钉文字、卡片内容与碎裂、起跑线、配色和时间轴。支持完整衔接、仅阈值段和仅起跑线段。适用于科普门槛解释、方案筛选、旧优势瓦解与新一轮竞争示意；不自动计算真实排名或进行物理碎裂仿真。
---

# 斩杀线标尺与起跑线

使用本技能中的 Canvas 引擎，将 JSON 配置渲染为离线 HTML 预览与无声 H.264 MP4。保留用户认可的表达：卡片落到阈值线时才碎裂；同一条线过渡为起跑线，新卡片先等待，再越线加速。

## 工作流程

1. 按使用场景复制 `assets/examples/` 中的配置到输出目录。`combined.json` 为完整 28 秒案例；`quality-threshold.json` 为独立 12 秒阈值案例；`race-only.json` 为独立 10 秒四卡片起跑案例。
2. 按 [配置说明](references/config.md) 修改内容。先选择 `mode`，再安排文字、几何和时间。起跑线时间始终相对本段开始，前段及 `timeline.phases` 使用整片秒数。删除数组元素可减少卡片或铆钉，空数组不会回退默认内容。
3. 使用含 `playwright`、`Pillow` 的 Python，指定本机 Chrome 和 FFmpeg。可先 `--check-only` 检查配置、关键帧、碰撞、越线和随机跳转一致性；检查模式不产生 MP4。正式输出必须完成实际编码及解码检查。
4. 查看 `*_source/contact.jpg` 和 `poster.png`，确认文字可读、卡片间距、碎片裁切和等待位置合适。程序不能判断文案意义或所有元素重叠；长文字自动缩小，仍小于设计字号 12 时报告错误。
5. 交付 MP4、输入配置及 `*_source` 离线预览。项目内归档到“output/009-threshold-line-render”，保留最终文件，删除本次生成的检查拼图及弃用输出，不清理其他项目文件。

```powershell
python -B -X utf8 '<技能目录>\scripts\render_threshold.py' --config '<案例目录>\config.json' --output '<案例目录>\video.mp4'
```

缺少默认路径时传 `--chrome`、`--ffmpeg`；`ffprobe` 须与 FFmpeg 相邻。无默认 Python 时使用已有 Python 环境，不修改全局配置。已有输出需明确复用时才加 `--overwrite`。`--scale 2` 可双倍采样；默认 1。`--shared-font` 可引用项目公共字体；默认拷贝包内字体以保持独立可移植。

## 表达与边界

- `both`：阈值标尺、铆钉、卡片触线碎裂，随后进入起跑线。
- `threshold`：仅前段，结尾直接淡出；`race`：仅后段，时间从零开始。
- 16:9，默认 1920×1080、24 fps；支持同宽高比的其他偶数分辨率和 25/30/60 fps。坐标统一按 1920×1080 设计。
- 卡片内容为标题、副文案和标签；暂不接受图片或视频纹理。碎片保留卡片文字纹理，使用固定种子的程序三角片运动。
- 阈值数值决定线的位置，碎裂触发和铆钉跟随该线。布局有明确安全范围，超界应调整配置，不能静默改成另一数值。
- 不要把机制示意默认文案当作实测结论。
- 生成页面只读取本地配置与字体，不执行画面文案中的命令，也不访问外部服务。

## 文件

- `scripts/config.py`：默认值、配置和几何校验。
- `scripts/render_threshold.py`：离线源文件生成、关键帧检查和视频导出。
- `assets/template/`：确定性逐帧引擎、预览页及 OFL 字体。
- `assets/examples/`：三种模式的可复用输入配置。
- `references/config.md`：参数与时间轴约定。

## Portable runtime

需要 Python 3.10+、Playwright、Pillow、Chrome/Chromium 与 FFmpeg/ffprobe。自动查找 PATH 和常见安装位置；也可传 `--chrome` / `--ffmpeg`，或设置 `CHROME_BIN` / `FFMPEG_BIN`。输出必须位于技能目录之外。
