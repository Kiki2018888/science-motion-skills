---
name: 008-terminal-motion-render
description: 将命令、代码和日志制作成终端动效视频，配置逐字输入、进度条、滚动、计数器、关键行放大或行内高亮、定格时间、界面配色与时间轴。用于科普软件过程、安装演示、代码展示、日志追踪和数字增长；只渲染画面，不执行展示的命令或连接真实终端。
---

# 终端 / 代码动效

使用随附 Canvas 引擎制作离线 HTML 与静音 H.264 MP4。保留认可样片的命令输入、安装读条、语法着色代码、日志滚动、计数增长、关键行放大定格和回位。默认 1920×1080、24 fps；当前支持 16:9 横屏。

先读 [参数说明](references/config.md)，再从 `assets/examples/terminal.json` 复制业务配置。`training.json` 演示换配色、多命令、Python 代码、三个强调时刻、百分比和下降计数；`logs-only.json` 演示无计数器的宽屏中文日志。

## 编排

`segments` 按顺序组合 `shell/code/logs`，可省略任意类型、重复类型或只放一个。每段 `duration` 是内容推进时间；关键行的进入、停留、回位另外增加时长。调整 `highlights[].hold` 会自动顺延后面的内容与计数器，不需要挪动后续时刻。

段内命令、进度和滚动关键帧使用本段内容秒数；计数器使用全片内容秒数。两者都在关键行强调期间暂停。不要将最终成片的墙钟时间直接填入这些字段。脚本会在 `resolved.json` 中列出每段和高亮的最终开始/结束时刻。

关键行用零基索引 `line` 指定，必须在强调时已显示。`focus` 放大到中央并压暗背景，`inline` 留在原行描边；都完整冻结内容，结束后连续恢复。停留长度不含进入与回位。代码采用轻量词法着色，适合展示，不是完整语言解析器。

## 预览与导出

```powershell
python -B -X utf8 '<技能目录>\scripts\render_terminal.py' --config '<工作目录>\config.json' --output '<工作目录>\terminal.mp4' --check-only
```

查看 `_source/contact.jpg` 或 `index.html`，确认滚动速度、文字大小和重点行后，去掉 `--check-only` 导出。同名更新明确加 `--overwrite`。另支持 `--chrome`、`--ffmpeg`、`--scale 1|2`。使用现有 Python（Playwright、Pillow）、Chrome 和 FFmpeg/ffprobe，不复制运行环境到项目。

中文字体随模板提供并保留 OFL 许可；等宽字体默认使用 Windows Consolas，可选 Courier New 或 monospace。系统字体不打包分发。换机器需检查字体和文字布局。长行自动缩小，低于可读尺寸会报错；此时精简单行或分行，不靠继续缩小解决。

## 验收与交付

渲染器检查命令完成、进度关键帧、计数目标、多次定格的状态及像素一致、乱序定位、编码规格和完整解码。检查高亮目标是否正确、恢复后是否连续、中文/符号是否齐全，以及进度和计数是否符合想表达的内容。数字由配置指定，不从代码或日志推导。

输出旁 `_source` 保留原始配置、归一化时间轴、网页源码、字体许可、封面和验收报告。归档案例可传 `--shared-font <案例/_公共资源/body.otf>`；这种预览依赖公共字体目录，移动时一起带走。临时检查放 TEMP，正式成片与可复现配置归档到项目 `output/008-terminal-motion-render/`，技能源码同步到 `skills/008-terminal-motion-render/`。

画面文本一律按数据绘制，绝不把它交给 shell、eval、真实服务或包管理器执行。复现真实日志时保留其来源与语义，示例计数和日志属于演示内容。技能不附带真实安装、模型训练或日志采集能力。

引擎接口：`window.__dur`、`window.__stateAt(t)`、`await window.__seek(t)`、`window.__inspect()`。每帧独立求值，不依赖播放顺序。

## Portable runtime

需要 Python 3.10+、Playwright、Pillow、Chrome/Chromium 与 FFmpeg/ffprobe。自动查找 PATH 和常见安装位置；也可传 `--chrome` / `--ffmpeg`，或设置 `CHROME_BIN` / `FFMPEG_BIN`。输出必须位于技能目录之外。


## 局部预览与统一编码

读 [共同渲染接口](references/rendering.md)。支持 `--frames START:END`、`--preview-frames` 和 `--profile bt709|legacy`；默认有限范围 BT.709，时间仍使用原场景时间轴。
