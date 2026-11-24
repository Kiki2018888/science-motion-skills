# 改动地图

本索引适用于原影片的源码维护。新的动作脚本走[通用画风流程](scene-authoring.md)。

先分类，再改文件。三种工作不能混称。

## A. 原片复现

不改 `src/`。用固定提交检出影片，打开播放器或对 `render.html` 调用 `renderFrameAt(t)`。

适合：用户要看某一时代、某一秒，或导出一段未改过的画面。

时间：

- 全片 `0 <= t <= 137`
- 片头 `0–5` 秒：`src/scenes/intro.js`
- 第 `n` 场（1–20）从 `t0 = 5 + (n - 1) * 6` 到 `t1 = t0 + 6`，中点 `t0 + 3`
- 片尾 `125–137` 秒：`src/scenes/outro.js`
- 相邻画框的跨框时刻：`t = 5 + 6 * k`，`k = 0..19`

## B. 材质、文案、装裱辅助

可以改，但改完要重截该场中点，并看相邻跨框有没有断路：

| 想改的东西 | 先看 | 限制 |
| --- | --- | --- |
| 展签中文名、年代、英文名、一句 gag | `src/beat/timeline.js` 里该场的 `zh` / `era` / `en` / `gag` | 第 1–14 场的墙面铜牌会读 `zh` 与 `era`。第 15–20 场的硬件外框不挂这块铜牌，场内标题往往另写在场景文件里。 |
| 外框颜色脉冲 | 同文件的 `frameColor` / `frameAccent` | 只影响装裱高光，不替换场内颜料。 |
| `scene.palette` | 同文件，再在对应 `src/scenes/sNN_*.js` 里搜索 `scene.palette` | 多数场把颜料写死在自己的常量表里。没被引用的 palette 改了也不会进画面。 |
| 一场里的颜料、纸纹、笔触参数 | 该场文件顶部的调色板或 `bakeBrush` 参数 | 这是材质辅助。不要顺手改关节、道路或角色轮廓。 |
| 装裱家族的边宽、绫色、金属倒角 | `src/kit/frame.js` 里对应的 `bake*Frame` | 七个家族按 `scene.id` 分发。改一个家族会影响列出的所有场。 |
| 跨框粉末、墨晕、金箔、油灯、电弧 | `src/kit/transitions.js` 的 `k` 分支 | 窗口只有零点几秒。`k = 14`（第 14 场进入第 15 场）更长。 |
| 场内标题、对话框、弹幕、代码窗标题 | 该场文件里的字符串 | 第 17–20 场的界面文字在场景内，不在铜牌上。 |

B 类改动仍然画的是这只鹈鹕和这辆自行车。它不是换题材。

## C. 需要重写的部分

下面任何一项都要明确告诉用户：只影响你改到的场，其余 19 场不会跟着变成新故事。

- 换物种、换交通工具、换情节：重写该场 `render()` 里的造型。每场的鸟和车都是按媒介重画的，不是共享网格套材质。
- 改骑行姿态、踏板、轮辐相位：`src/rig/pelican.js` 的 `computePelicanRig`。`poseMode` 含 `normal`、`egypt_freeze`、`bada_eye`、`jump`、`lissajous`。这是鹈鹕加自行车的解析 IK，不是通用角色骨架。
- 改每场时长、场数、BPM、道路高度：`src/beat/timeline.js` 的 `SCENE_SEC`、`NUM_SCENES`、`ROAD_EDGE_Y`。音轨、镜头和跨框时刻都绑在 6 秒一场、`y = 680` 上。
- 改镜头：`src/beat/camera.js`。第 5 场有推近，第 19 场有 9:16 幕布。
- 改音乐：`src/audio/score.js` 的音阶表，以及 `instruments_world.js`、`instruments_modern.js`、`vaporwave.js`、`foley.js`。画面改动不会自动换乐器。
- 新的一场：新模块导出 `render(kit, slot, scene, params)`，在 `src/scenes/index.js` 注册，并在 `SCENES` 里增加条目。不要假设能占掉别人的 6 秒还不改总时长。

`render` 收到的 `params` 有：`t`、`localT`、`rawLocalT`、`pelicanLocalX`、`pedalAngle`、`speedScale`、`isOutroThumbnail`。片尾缩略图会再调用同一 `render`。改画法时保持 `slot.usedFb` 的现有约定，否则片尾墙会空。

## 不要自动执行的上游脚本

`package.json` 的脚本会进入 `tools/`：

- `serve`、`shot`、`sheet`、`render`、`encode`、`cover`、`build`

`tools/shot.mjs` 只连接已经开着的 Chrome 调试端口（默认 `http://127.0.0.1:19222`），自己不启动浏览器，也不关闭用户的浏览器。`tools/render.mjs` 导出的是全片约 8220 帧。用户没有明确要求全片之前，不要跑 `render`、`encode`、`cover` 或 `build`。

预览和短截帧用本技能的 `scripts/preview-server.mjs` 与 `scripts/capture-frames.mjs`。这两个脚本不执行 `pnpm install`。截帧需要本机已有的 Chrome，以及可选的 FFmpeg。
