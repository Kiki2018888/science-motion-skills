---
name: 001-chat-motion-render
description: 将对话制作成聊天动效视频。支持 Messages、微信、WhatsApp、Claude、ChatGPT、X 公开回复串、Google Gemini 七套 UI、浅深色、横竖屏、无光标逐字输入与整条弹出，可逐条混用和长对话滚动。只渲染视频，不向真实软件发送消息。
---

# 聊天动效视频

使用随包 HTML/CSS/JS 与 Python 渲染器生成无声 H.264 MP4 和离线预览。七套 UI 沿用已认可的界面；逐字输入不显示光标，保留标点停顿，整条弹出保留 0.48 秒轻微回弹。X 使用公开帖子与回复结构，帖子正文不做气泡变形。

## 配置

保留用户原文、顺序和说话人。单条长到超过一屏时按原句界拆为同一说话人的连续消息，不缩小到不可读，也不擅自删改内容。

参数按用户选择映射：
- 横屏 → `aspect: landscape`（1920×1080）；竖屏 → `portrait`（1080×1920）。
- Messages / iMessage → `theme: apple`；微信 → `wechat`；WhatsApp → `whatsapp`；Claude → `claude`；ChatGPT → `chatgpt`；X 公开回复串 → `x`；Google Gemini → `gemini`。
- 浅色 / 深色 → `appearance: light / dark`。
- 逐字输入 → `mode: type`；整条弹出 → `pop`。每条消息可覆盖 `mode`，两种方式均无光标。
- 仅提供这七套 UI；`ui` 可省略，显式填写时为 `modern`。

优先沿用用户已选参数；未指定时默认竖屏、微信、浅色、整条弹出，并简短说明。按角色维持左右关系，通常提问者在右、回答者在左；X 按公开回复串排列。不要从姓名推断身份。

读 [references/config.md](references/config.md) 构造 JSON。`assets/examples/` 含七套界面和逐条混用配置示例。指定配音时间时可用逐条 `start`、`hold`、`cps` 对齐。本技能不生成配音、BGM 或音效轨；默认交付无声视频。

## 导出

```bash
python "<skill>/scripts/render_chat.py" --config "<case>/dialogue.json" --output "<case>/chat-v02.mp4"
```

需要 Python 3.10+、Playwright、Pillow、Chrome/Chromium、FFmpeg 与 ffprobe。浏览器按 `CHROME_BIN`、PATH、系统常见位置、Playwright Chromium 发现；FFmpeg 按 `FFMPEG_BIN` 或 PATH 发现，也可显式传 `--chrome`、`--ffmpeg`。输出与配置放在技能目录外；模板不写入具体任务文案。

同名输出默认拒绝覆盖，优先另存版本；明确覆盖时传 `--overwrite`。`--fps` 支持 24 或 30，默认 24。局部导出、关键帧与 BT.709 编码选项见 [references/rendering.md](references/rendering.md)。

## 验收与交付

渲染器检查时间轴、文字边界、滚动后可见性和任意定位一致性；编码后核对尺寸、帧数、时间戳与完整解码。检查失败则修正配置，不交付失败产物。先查看输出旁 `_source/contact.jpg`，长对话检查末段，确认文字完整、无光标、无裁切。

最终内嵌绝对路径视频，简短说明画幅、界面、出现方式及无声状态。保留源码、配置、`report.json`、字体与 OFL 许可，便于复现。

界面为独立风格化重绘，不能称为真实产品录屏。优先使用已安装系统字体，缺失时回退到随包 OFL 中文字体；不同系统字形可能稍有差异。设计依据和字体说明见 [references/design.md](references/design.md)。
