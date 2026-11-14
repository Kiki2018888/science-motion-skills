---
name: 004-split-compare-render
description: 将左右图片、视频、图片序列或数据曲线制作成同步对照动画，配置文字、共同时间轴、慢放、多个暂停时刻与差异标注。适用于科普对照实验、操作对比和同刻状态比较；不从素材自动推断实验结论或疗效。
---

# 对照实验双屏

用同一时间轴驱动左右内容，支持同步开始、暂停同刻比较、继续播放、片尾突出差异。输出静音 H.264 MP4、可拖动的离线 HTML、关键帧和验收报告。横屏 16:9，默认 1920×1080；当前模板不提供竖屏重排。

## 选择素材和配置

先读 [参数说明](references/config.md)，选最接近的示例复制到工作目录：

- [fall.json](assets/examples/fall.json)：用户认可的小球平方阻力示例，程序运动与自动计算差值。
- [sequence.json](assets/examples/sequence.json)：可替换的图片序列，多段速度和两个暂停点。
- [video.json](assets/examples/video.json)：双视频帧精确同步、两个暂停点。
- [chart.json](assets/examples/chart.json)：共用坐标范围的两条数据曲线。

图片序列/视频示例依赖同级 `sorting/`，复制配置时一起复制或改为实际素材路径。所有示例素材均为原创合成示意，非真实性能实验。

左右可各自选择 `image`、`video`、`sequence`、`chart` 或 `fall`。通用模式可换主题；`fall` 是专用物理预设，不把它当作任意机制生成器。视频原音轨不导出，若用户需要配音或原声，另行按共同时间轴合成。

按任务提供的事实填写条件和结果。真实实验使用真实素材与数据；机制示意明确标注。单纯前后画面不能自动证明因果，别由画面凭空生成数值差或结论。为公平比较，优先统一画面尺度、起点和播放速度；视频起始偏移只能用于明确的事件对齐，独立倍速要注明。

## 执行

依赖 Python 3.10+、Playwright Python、Pillow、本机 Chrome、FFmpeg 和 ffprobe。使用独立虚拟环境，不把虚拟环境放进项目或技能包。无外部生成服务、无 API 凭据。

```powershell
python -B -X utf8 '<技能目录>\scripts\render_compare.py' --config '<工作目录>\config.json' --output '<工作目录>\compare.mp4' --check-only
```

审看 `compare_source/contact.jpg`、`poster.png` 或 `index.html`，核对同步、暂停、文字、框选位置和素材裁切。正式导出去掉 `--check-only`；已有同名预览时加 `--overwrite`。该选项允许更新本次成片与 `_source` 中的生成文件。

可覆盖 `--chrome <exe>`、`--ffmpeg <exe>`；`--scale 1|2` 为采集倍率，默认 2 倍后降采样。默认路径适配当前机器，其他机器按实际环境传入。无头浏览器受执行沙箱限制时按工具权限处理，不把启动超时当作验证成功。

## 验收与交付

脚本检查共同时间轴的边界连续性、暂停时媒体时刻/指标不变、乱序跳帧的实际像素一致性、文字布局、视频帧数/尺寸和完整解码。仍需审看：两侧素材是否真在比较同一阶段、标注是否指向正确位置、原视频分辨率是否足够、裁切是否掩盖信息。自动检查不证明内容的科学真实性。

保留实际输入、配置和输出旁 `_source`：其中包含离线网页、复制后的素材、`input.json`、展开的 `resolved.json`、素材 SHA-256 清单 `assets.json`、`contact.jpg`、`poster.png` 和 `report.json`。导出经管道编码，不生成海量中间帧。技能安装目录保持只读，本项目动效内容统一进入 `output/004-split-compare-render/`。

网页接口：`window.__dur`、`await window.__seek(t)`、`window.__clockAt(t)`、`window.__inspect()`。视频不自由播放，而是按共同时间轴逐帧定位；执行跳帧必须等待 Promise 完成。图片序列默认保持当前帧，不做未配置的插值或形态生成。

## Portable runtime

需要 Python 3.10+、Playwright、Pillow、Chrome/Chromium 与 FFmpeg/ffprobe。自动查找 PATH 和常见安装位置；也可传 `--chrome` / `--ffmpeg`，或设置 `CHROME_BIN` / `FFMPEG_BIN`。输出必须位于技能目录之外。
