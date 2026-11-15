# Science Motion Skills · 科普动效技能库

九套可配置、可复现的科普视频动效。提供独立 Python 渲染脚本、HTML/Canvas/SVG 源码、JSON 配置示例、中文字体和代表样片，可作为 Codex 技能使用，也可以直接从命令行导出视频。

**代码与原创示例采用 MIT 开源许可证，可修改、分发和商用。字体保留 SIL OFL 1.1。**

## 动效目录

| 编号 | 动效 | 技能与参数入口 | 样片 |
| --- | --- | --- | --- |
| 001 | 聊天动效 | [001-chat-motion-render](skills/001-chat-motion-render/SKILL.md) | [MP4](previews/001-chat-motion-render.mp4) |
| 002 | 流程与因果链 | [002-flow-motion-render](skills/002-flow-motion-render/SKILL.md) | [MP4](previews/002-flow-motion-render.mp4) |
| 003 | 多尺度连续缩放 | [003-multiscale-zoom-render](skills/003-multiscale-zoom-render/SKILL.md) | [MP4](previews/003-multiscale-zoom-render.mp4) |
| 004 | 对照实验双屏 | [004-split-compare-render](skills/004-split-compare-render/SKILL.md) | [MP4](previews/004-split-compare-render.mp4) |
| 005 | 手机聊天与锁屏通知 | [005-phone-ui-motion](skills/005-phone-ui-motion/SKILL.md) | [MP4](previews/005-phone-ui-motion.mp4) |
| 006 | 分层剖面与拆解 | [006-layer-explode-render](skills/006-layer-explode-render/SKILL.md) | [MP4](previews/006-layer-explode-render.mp4) |
| 007 | 地震局监测屏 | [007-quake-monitor-render](skills/007-quake-monitor-render/SKILL.md) | [MP4](previews/007-quake-monitor-render.mp4) |
| 008 | 终端 / 代码动效 | [008-terminal-motion-render](skills/008-terminal-motion-render/SKILL.md) | [MP4](previews/008-terminal-motion-render.mp4) |
| 009 | 斩杀线标尺 | [009-threshold-line-render](skills/009-threshold-line-render/SKILL.md) | [MP4](previews/009-threshold-line-render.mp4) |

在本地浏览器打开 [gallery.html](gallery.html) 可观看全部九条样片。GitHub 源码页面不能执行 HTML；请下载仓库后打开。视频为已渲染的代表案例，配置可按新主题修改。

## 安装环境

需要 Python 3.10+、Chrome/Chromium、FFmpeg 与 ffprobe。

```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS / Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python -m playwright install chromium
```

FFmpeg 和 ffprobe 需安装到 PATH，或使用 `--ffmpeg` 指定 FFmpeg 的路径，ffprobe 应位于同一目录。浏览器按 CHROME_BIN、PATH、系统常见位置、Playwright Chromium 的顺序发现；也可以使用 `--chrome` 显式指定。FFmpeg 支持 FFMPEG_BIN 环境变量。本仓库不附带上述外部运行时。

本次发布在 Windows、Python 3.12.10、Playwright 1.65.1、Pillow 13.0.0 和本机 Chrome 上验证。包含其他平台的路径发现支持，macOS/Linux 的完整渲染尚未实测。

## 快速开始

先检查完整“斩杀线 → 起跑线”示例：

```bash
python skills/009-threshold-line-render/scripts/render_threshold.py --config skills/009-threshold-line-render/assets/examples/combined.json --output output/threshold.mp4 --check-only
```

再导出视频（检查阶段已经创建源目录，所以加 `--overwrite`）：

```bash
python skills/009-threshold-line-render/scripts/render_threshold.py --config skills/009-threshold-line-render/assets/examples/combined.json --output output/threshold.mp4 --overwrite
```

输出无声 H.264 MP4 与 `output/threshold_source/` 离线预览、配置和验证报告。`--check-only` 不生成新视频。所有输出都必须位于技能目录之外。含图片/视频的配置使用相对路径时，修改主题须同时保留对应素材。

每套技能的 `SKILL.md` 说明具体流程；详细参数位于 `references/config.md`。原始模板与示例在 `assets/`。前后段独立使用、竖屏支持等能力因技能而异，请查看各自说明。场景数值为机制示意，不是实测性能、排名或实验结论。

## 安装为 Codex 技能

```bash
python tools/install_skills.py
```

默认安装到 `~/.codex/skills`（设置 CODEX_HOME 时使用该目录下的 skills），也可传 `--destination <路径>`。安装器遇到任何同名技能会停止，不覆盖本机已有版本；先使用 `--dry-run` 查看将安装的目录。每套技能自带必要源码与字体，安装后可独立使用。

例如：`使用 $009-threshold-line-render，做一个质量门槛动画，只使用前半段。`

## 编号与贡献

- `catalog.json` 是编号索引；现有自建技能 001–009，下一个为 010。
- 新技能采用 `NNN-kebab-case`，目录、SKILL name 与显示名编号一致；已有技能增加主题沿用原编号。
- 修改应保留确定性的时间定位、可替换配置、字体许可和必要验证。不要提交密钥、个人路径、运行环境、临时帧或私人业务脚本。
- 运行 `python tools/check_release.py` 检查包结构、配置文件、许可证和 Python 语法。动态检查需依赖环境与浏览器，按各技能运行 `--check-only`，正式视频还需检查解码和画面。

## License

See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Fonts remain under their bundled OFL license. Product names identify independent, stylized demonstrations and imply no affiliation.

## English overview

Nine configurable motion-rendering skills for science communication: chat, flow and causality, multiscale zoom, split comparison, phone conversation/notifications, exploded layers, event monitoring, terminal/code, and threshold/start-line animation. Run the Python renderers directly or install the folders as Codex skills. JSON examples and editable browser-based engines are included. Original code and examples are MIT licensed; bundled fonts retain SIL OFL licensing. Windows is verified; other platforms have portable tool discovery but have not received full rendering validation.

## v1.1.0 · 2026-11-14

所有九套技能加入共同渲染 2.0：按原时间轴导出帧段、关键帧 PNG、有限范围 BT.709、编码后 PTS 与完整解码检查。005 新增半截手机、硬件细节与消息安全区；002 新增连续虚线、分道回程和路径诊断；009 新增像素角色、细节跑道与实际轮廓越线。上述三项新样片位于 gallery 的 v02 区域，原样片保留。

新选项均为可选配置；旧配置保留原布局。`shared/` 保存共同渲染源码，`python tools/sync_runtime.py` 检查九份副本，`--apply` 同步副本。007 / 008 在本次公开版本中只更新共同渲染层。
