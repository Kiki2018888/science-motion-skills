---
name: 018-paper-cut-cartoon
description: 用剪纸像素定格风格制作可换题材的科普或叙事镜头。适合纸偶表演、手持道具、撕贴标签和掀纸转场，可导出横竖屏 MP4 与离线逐帧 HTML。
---

# 剪纸像素定格卡通

把讲解里的动作画出来。先确定观众应看到谁、什么道具、哪个状态发生改变，再安排准备动作、接触与角色反应。角色和道具各用单独图层，字幕按口播的实际入点切换。

材质沿用深色卡纸、固定种子的纸纤维、月白剪边和右下硬投影。机器人由纸片拼接，四肢绕铆钉活动。输出为 30 fps，姿势以每秒 12 次更新。角色的眼睛和手、道具的接触点应比背景更醒目；竖屏单独调整位置和比例。

从[磁铁与回形针](assets/examples/magnet.json)或[纸手换签](assets/examples/sticker.json)另存一份配置，换成该片的角色、道具、动作与字幕。机器人、人偶、纸签与多层矢量道具均可自由组合。自定义图形、关键帧、手部挂点与竖屏构图见[镜头配置](references/scenes.md)。

从技能目录运行。需要 Python、Playwright、Chromium 或 Chrome；导出 MP4 还需要 FFmpeg 和 ffprobe。浏览器可用 `--chrome` 指定，FFmpeg 可用 `--ffmpeg` 指定。

```sh
python scripts/render_paper.py --config assets/examples/magnet.json --check-only
python scripts/render_paper.py --config assets/examples/magnet.json --output magnet.mp4 --html magnet.html
python scripts/render_paper.py --config assets/examples/magnet.json --format portrait --output magnet-portrait.mp4
```

`--html` 生成内嵌画面、字库和配置的离线页面，可和 `--check-only` 一起使用。双击循环播放，追加 `?cap=1` 后由 `window.__seek(t)` 定位秒数，`window.__dur` 提供全长。局部出片、抽帧和文件命名见[渲染输出](references/rendering.md)。已有输出用 `--overwrite` 显式覆盖。

技能输出无声画面。需要成片配音时，用实测口播时长填写每镜 `duration` 和字幕起点，再进入影片的声音合成流程。
