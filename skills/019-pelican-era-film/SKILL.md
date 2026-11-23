---
name: 019-pelican-era-film
description: "以《鹈鹕测试》Pelican Test 的 20 种时代画风做程序化动画。附机器人打羽毛球的离线全屏展示，支持同一帧换画风。可按固定提交预览原片，修改指定场景的材质、重画新主体或导出短片段。适用于鹈鹕、时代画风、程序化艺术史、renderAt、场景模块或 orbitoo/pelican-test。"
license: MIT
compatibility: "Codex 的 Agent Skill 目录。需要 git、Node.js 与本机 Chrome/Chromium 才能截帧。不会自行安装到用户电脑。未覆盖 DeepSeek Harness。"
metadata:
  version: "1.1.0"
  upstream_commit: "59c8ca2657ce5b2cf067969b5bda19d6609af8ac"
---

# 鹈鹕时代短片

用固定提交的《鹈鹕测试》做时代画面的复现、有限改动和短导出。上游是 https://github.com/orbitoo/pelican-test ，提交 `59c8ca2657ce5b2cf067969b5bda19d6609af8ac`（2026-11-11）。全片 137.0 秒、120 BPM、1920×1080、20 个各 6 秒的场景。运行时调度在 `src/main.js` 的 `renderFilmFrame(t)`，浏览器里的入口是 `renderAt(t)` 与 `renderFrameAt(t)`。

本技能未在 DeepSeek Harness 上测试。不要报告 DSH 可用。

## 20 种画风的大画面展示

[在线播放](https://kiki2018888.github.io/science-motion-skills/) · [下载单文件 HTML](https://raw.githubusercontent.com/Kiki2018888/science-motion-skills/main/skills/019-pelican-era-film/assets/showcase.html)

在浏览器打开 [机器人羽毛球 · 单文件展示](assets/showcase.html)，即可看到两台机器人完成同一个六秒、五拍的回合。每次展示一种画风。可以连播二十场，也可以在同一帧换画风。按 F 全屏，按空格暂停或播放，左右方向键换画风，M 开关击球声。按钮同样支持触屏。

展示页内含二十个分场绘制函数和击球声，可离线运行。程序入口 `renderAt(t)` 以秒定位，时间范围为 0 至 120，每场六秒。预览当前示例时直接打开这一页即可。要开发新题材或重现骑车的鹈鹕，再使用下面的上游工程流程。

画风顺序、部分画材算法与双骨骼运动学来自 Elbert 的《鹈鹕测试》。机器人造型、比赛动作、球路、击球声与展示播放器由 Science Motion Skills 为本例制作。页面的「原作与署名」保留了上游和技能包的 MIT 许可全文。[上游仓库](https://github.com/orbitoo/pelican-test) · [固定版本](https://github.com/orbitoo/pelican-test/tree/59c8ca2657ce5b2cf067969b5bda19d6609af8ac)

## 先分类

读完用户简述后，先用一句话选定类别，再动手。

- **A 原片复现**：不改 `src/`。按目录里的时刻截现有画面。
- **B 材质或文案**：改展签、一场里的颜料表、纸纹、装裱或跨框粉末。主体仍是这只鹈鹕和这辆自行车。
- **C 重写**：换物种、换车、换故事、改时长或把一种画法搬到新主体。只承诺改到的那一场。其余场不会跟着变。

不要把任意题材一键套到全部 20 种风格。每种画法都是独立场景文件里重画的，不是共享模型的滤镜。细节见 [references/style-catalog.md](references/style-catalog.md) 和 [references/edit-map.md](references/edit-map.md)。

## 步骤

1. 让用户选定空的工作目录。运行 `scripts/fetch-upstream.sh <目录>`。目录非空就停，不要删除里面的文件。脚本只检出 pin 里的提交，不运行 `pnpm install` 或上游 `tools/`。
2. 核对 `<目录>` 的 `git rev-parse HEAD` 等于 `59c8ca2657ce5b2cf067969b5bda19d6609af8ac`，并确认 `LICENSE` 与 `THIRD_PARTY_NOTICES.md` 还在。许可边界见 [references/notices.md](references/notices.md)。
3. 按类别改文件。B 类先在场景文件里搜索 `scene.palette`；很多颜料写在该场自己的常量表里。改完用 `node --check` 检查改过的 `.js`。
4. 预览：`node scripts/preview-server.mjs --root <目录> --port 41731`，打开打印出的地址。播放器是 `/`，离屏宿主是 `/render.html`。不要改用上游 `pnpm serve`，除非用户读过 `tools/serve.mjs` 并明确要求。
5. 截帧：`node scripts/capture-frames.mjs --project <目录> --times <中点秒> --out <输出目录>`。需要本机 Chrome。脚本会自己启动一个独立的 headless 进程，结束时只关掉这个进程。它不连接、不关闭用户已经开着的浏览器。1920×1080 画面是滑轨镜头：一场的中点通常仍能看到左右邻框，这不是截错时刻。
6. 在同一次截帧进程里把同一时刻放进 `--times` 两次。本次云环境测试里，这两张 PNG 字节相同；重新启动浏览器之后不保证字节相同。跨进程哈希不同，而画面没有变，不要当成回归。
7. 短导出加上 `--clip-start <秒> --clip-seconds 4 --fps 8`。片段最长 8 秒，且没有音轨。用户没有明确要求之前，不要跑全片 `tools/render.mjs`（约 8220 帧）或 `tools/encode.sh`。

第 `n` 场中点是 `5 + (n - 1) * 6 + 3`。跨框时刻是 `5 + 6 * k`。

## 质检

- 改一场后，截该场中点，再截 `t0` 附近 0.2 秒，看道路 `y = 680` 和车轮有没有接上。
- 看终端里的 `[capture] 页面错误`。场景抛错时会被画成占位稿，不能当成成品。
- B 类改动若只改了 `timeline.js` 的 `zh`，确认该场编号小于等于 14，否则墙面铜牌不存在，文字要到场景文件里改。
- C 类交付时列出没改的场景编号，避免用户以为 20 场都换了主体。
- 画面脚本不合成音频。要声音时另读 `src/audio/`，并单独说明还没渲染音轨。
- 再分发影片树时保留 `LICENSE`、`THIRD_PARTY_NOTICES.md` 和字体的 OFL 声明。

## 安装与校验

给人看的安装步骤在 [使用说明.md](使用说明.md)。Codex 的发现路径只引用一手文档，写在 [references/codex-install.md](references/codex-install.md)。

改完技能后运行 `node scripts/validate-skill.mjs`。
