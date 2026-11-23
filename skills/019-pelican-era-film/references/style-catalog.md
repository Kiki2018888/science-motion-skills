# 20 场风格目录

运行时以 `src/beat/timeline.js` 的 `SCENES` 为准。每场 6.0 秒，画布内部分辨率 1000×1000，道路锁在 `y = 680`，全片输出 1920×1080。第 `n` 场：

`t0 = 5 + (n - 1) * 6`，中点 `t0 + 3`，结束 `t0 + 6`。

README 的年代是对外索引，有 9 处和 `timeline.js` 不一致。排期、展签和文件头以代码为准；不要只改 README。

| n | 代码 id | 文件 | 代码年代 | README 年代（若不同） | t0–t1 | 中点 |
| -: | --- | --- | --- | --- | --- | -: |
| 1 | `s01_sahara` | `src/scenes/s01_sahara.js` | 约前 4000 | 同 | 5–11 | 8 |
| 2 | `s02_egypt` | `src/scenes/s02_egypt.js` | 约前 1300 | 同 | 11–17 | 14 |
| 3 | `s03_han` | `src/scenes/s03_han.js` | 约 100 | 同 | 17–23 | 20 |
| 4 | `s04_tang` | `src/scenes/s04_tang.js` | 约 750 | 同 | 23–29 | 26 |
| 5 | `s05_song` | `src/scenes/s05_song.js` | 约 1000 | 同 | 29–35 | 32 |
| 6 | `s06_qingming` | `src/scenes/s06_qingming.js` | 约 1100 | 同 | 35–41 | 38 |
| 7 | `s07_maya` | `src/scenes/s07_maya.js` | 约 1200 | README 写约 1300 | 41–47 | 44 |
| 8 | `s08_mughal` | `src/scenes/s08_mughal.js` | 约 1600 | README 写约 1620 | 47–53 | 50 |
| 9 | `s09_bada` | `src/scenes/s09_bada.js` | 约 1690 | README 写约 1700 | 53–59 | 56 |
| 10 | `s10_wayang` | `src/scenes/s10_wayang.js` | 约 1800 | README 写约 1750 | 59–65 | 62 |
| 11 | `s11_ukiyoe` | `src/scenes/s11_ukiyoe.js` | 1830s | 同 | 65–71 | 68 |
| 12 | `s12_starry` | `src/scenes/s12_starry.js` | 1889 | 同 | 71–77 | 74 |
| 13 | `s13_scream` | `src/scenes/s13_scream.js` | 1893 | 同 | 77–83 | 80 |
| 14 | `s14_nosferatu` | `src/scenes/s14_nosferatu.js` | 1922 | 同 | 83–89 | 86 |
| 15 | `s15_oscilloscope` | `src/scenes/s15_oscilloscope.js` | 1950s | README 写 1958 | 89–95 | 92 |
| 16 | `s16_8bit` | `src/scenes/s16_8bit.js` | 1980s | README 写 1985 | 95–101 | 98 |
| 17 | `s17_chat` | `src/scenes/s17_chat.js` | 2000s | README 写 2001 | 101–107 | 104 |
| 18 | `s18_vaporwave` | `src/scenes/s18_vaporwave.js` | 2010s | README 写 2012 | 107–113 | 110 |
| 19 | `s19_shortvideo` | `src/scenes/s19_shortvideo.js` | 2020s | README 写 2020 | 113–119 | 116 |
| 20 | `s20_code` | `src/scenes/s20_code.js` | 2020s | 同 | 119–125 | 122 |

片头 `src/scenes/intro.js` 为 0–5 秒。片尾 `src/scenes/outro.js` 为 125–137 秒。`src/scenes/placeholder.js` 只在场景抛错或未注册时兜底。

## 可复用的机制，以及不能当成滤镜的部分

可复用、不绑定某一只鸟的部分：

- 确定性时钟：`renderFilmFrame(t)` 按毫秒种 `randomSeed` / `noiseSeed`。对外入口是 `window.renderAt(t)` 与 `window.renderFrameAt(t)`（见 `src/main.js`）。
- 画框池：`src/kit/kit.js` 的 `createKit`、`bake2D`、`bakeBrush`。`bakeBrush` 把 p5.brush 的一帧 WebGL 结果烤进二维缓存。多场把 `slot.usedFb` 设为 false，让片尾墙采样 `slot.g2d`。
- 七类装裱：`src/kit/frame.js` 的 `getBakedPanelFrame`。
- 跨框微物理：`src/kit/transitions.js` 的 `renderThresholdMicroPhysics`，只在接缝前后零点几秒发生。
- 量化时间：`quantizeTime(t, hz)`。第 10 场 10 Hz，第 16 场 12 Hz，第 17 场 10 Hz。

不能当成“风格滤镜”套到任意主体的部分：

- `src/rig/pelican.js` 是鹈鹕躯干、喉囊、翅膀和自行车曲柄的解析二骨 IK。`solveTwoBoneIK` 这个函数本身是通用平面 IK，但默认骨长和 `computePelicanRig` 的关节表不是通用角色。
- 每一场都按该媒介重画了鸟和车。换主体就要重写该场的造型代码。相邻场不会继承你的新造型。
- 第 14 场画面里没有实体鹈鹕，只有墙上的影子。第 5 场的鸟被缩成点景。第 20 场的轮廓来自这只鹈鹕的 36 阶傅里叶级数。
- 音轨是同一条 12 拍主题，按时代换调式和乐器。改画面不会改声音。

## 装裱七族

`src/kit/frame.js` 注释中的家族名：

| 家族 | 场 | 函数 |
| --- | --- | --- |
| `stone_arch` | 01 砂岩、02 埃及、03 汉画像 | `bakeSaharaFrame` / `bakeEgyptFrame` / `bakeHanFrame` |
| `silk_scroll` | 04、05、06 连卷，09 另做素绫 | `bakeSilkScrollFrame` |
| `codex_print` | 07 抄本、08 细密画、11 浮世绘 | `bakeMayaFrame` / `bakeMughalFrame` / `bakeUkiyoeFrame` |
| `wayang_proscenium` | 10 | `bakeWayangFrame` |
| `museum_easel` | 12、13 | `bakeMuseumEaselFrame` |
| `nitrate_strip` | 14 | `bakeNitrateFrame` |
| `hardware_digital` | 15–20 | `bakeOscilloscopeFrame`、`bake8BitFrame`、`bakeWin2000CRTFrame`、`bakeVaporwaveFrame`、`bakeShortvideoFrame`、`bakeCodeGlassFrame` |

第 1–14 场在画框下方有博物馆铜牌，文字来自 `scene.zh` 与 `scene.era`。第 15–20 场没有这块铜牌。

## 分场

每一场下面先写能借走的画法，再写绑在鹈鹕短片上的假设。

### 01 撒哈拉岩画

- 文件：`src/scenes/s01_sahara.js`。运动：匀速过框。装裱：砂岩拱。跨框 `k=0`：矿物粉。
- 可复用：Worley 与脊状 FBM 砂岩高度场、吹喷负形手印、干擦高岭土带。
- 鹈鹕假设：火弯金合欢弓梁自行车、石盘轮、赭石鹈鹕从牧群前骑过。音：`instruments_world.js` 手鼓与三共振峰吟唱。

### 02 埃及壁画

- 文件：`src/scenes/s02_egypt.js`。`motionProfile: freeze_bar2`，第 2 小节近乎定格。装裱：埃及。跨框 `k=1`：矿物。
- 可复用：石灰岩、草泥、石膏三层地仗，埃及蓝与石青颗粒，手绘芦笔路径，侧面律基线。
- 鹈鹕假设：王名框写“鹈鹕测试”，鎏金辇车自行车，覆羽神鸟。音：Hijaz 竖琴与叉铃。

### 03 汉画像石拓片

- 文件：`src/scenes/s03_han.js`。`inkMode: rubbing`。装裱：汉。跨框 `k=2`：拓片墨粉。
- 可复用：`bakeBrush` 炭笔与凿痕、绵连纸 `createPattern`、V 槽阴线、扑墨毛边。
- 鹈鹕假设：车马出行队列里的鹈鹕木轮车，榜题「車騎奇禽出行」。音：编钟与建鼓。

### 04 唐代白描

- 文件：`src/scenes/s04_tang.js`。`inkMode: baimiao`。装裱：连卷。跨框 `k=3`：墨晕，并带吴带当风的飘带上卷。
- 可复用：硬黄麻纸纤维遮挡、五墨 `drawLanyeStroke`、狼毫飞白。除朱印外不用彩色。
- 鹈鹕假设：披帛、香囊与弯木辇。片尾缩略图对这一场有单独的标题条。音：琵琶轮指与筚篥向的燕乐音阶 `tang_yanyue`。

### 05 宋代山水

- 文件：`src/scenes/s05_song.js`。`cameraMode: song_zoom`。装裱：连卷。跨框 `k=4`：墨晕。
- 可复用：茶褐熟绢、雨点皴与豆瓣皴点垛、折带与小斧劈、勾水法、`bakeBrush` 湿墨。
- 鹈鹕假设：鸟被缩到约 0.18 倍做点景，戴斗笠，骑 mortise 木自行车。镜头推近才找得到它。音：古琴散音到泛音。

### 06 清明上河图

- 文件：`src/scenes/s06_qingming.js`。`archBridge: true`，`inkMode: jiehua`。装裱：连卷。跨框 `k=5`：墨晕。
- 可复用：界画起收、退晕屋瓦、虹桥穿插木拱、绢丝卷摺。
- 鹈鹕假设：桥上人群回头看的是骑车鹈鹕；船上有落桅动作。音：梆笛与锣鼓。

### 07 玛雅抄本

- 文件：`src/scenes/s07_maya.js`。装裱：抄本。跨框 `k=6`：矿物，与 01–03 同一手势函数。
- 可复用：阿马特尔树皮、石灰灰泥剥落、折页铰链、玛雅蓝与胭脂虫红的 `bakeBrush`、羽管笔多边形。
- 鹈鹕假设：水鸟神、双头羽蛇木架、黑曜石轮，以及把踏板圈数画成点横数字。音：陶笛与木鼓。

### 08 莫卧儿细密画

- 文件：`src/scenes/s08_mughal.js`。装裱：金边抄本。跨框 `k=7`：金箔。
- 可复用：`bakeBrush` 不透明水粉、青金石与石绿、撕金箔、细笔点染。`solveTwoBoneIK` 在这一场也被用来画朝臣的袖子，这是少数把 IK 用在配角上的地方。
- 鹈鹕假设：玉石大马士革自行车、孔雀船首、朝臣指着骑车的鸟。音：Yaman 西塔琴与塔布拉，音阶 `indian_yaman`。

### 09 八大山人

- 文件：`src/scenes/s09_bada.js`。`inkMode: xieyi`。装裱：素绫，内边距比连卷更窄。跨框 `k=8`：墨晕。
- 可复用：大留白、宿墨 `fillBleed`、自定义笔 `s09_bada_hao` 与侧锋、一次烤好的墨件图集。
- 鹈鹕假设：翻白眼、残荷、一笔圆相当车轮、八大体落款。音：洞箫，大量静音。

### 10 爪哇皮影

- 文件：`src/scenes/s10_wayang.js`。`quantizeTime` 10 Hz。装裱：皮影台口。跨框 `k=9`：油灯火星。
- 可复用：棉幕透光、灯在幕后面而不是贴在前面、牛皮镂空、10 Hz 顿挫。
- 鹈鹕假设：伽楼罗辇、牛角操纵杆、达朗的手腕抖动都画在这只皮影鸟上。音：Slendro 甘美兰，音阶 `javanese_slendro`。

### 11 浮世绘

- 文件：`src/scenes/s11_ukiyoe.js`。装裱：木版纸。跨框 `k=10`：版画晕染。
- 可复用：马连筋、木目、套色错版、隅田川式浪头与霞。
- 鹈鹕假设：东海道上顶风的鹈鹕、豆绞手拭、煤竹车架、蛇目伞轮。音：都节音阶三味线，音阶 `edo_insen`。

### 12 星月夜

- 文件：`src/scenes/s12_starry.js`。装裱：画架。跨框 `k=11`：厚涂油彩。
- 可复用：`PALETTE_SPEC` 十六色湿碰湿、猪鬃与刮刀图集、亚麻底。改某一色的 `base` / `hi` / `lo` / `marl` 属于材质级改动，造型仍是这一场的漩涡、柏树和村庄。
- 鹈鹕假设：车轮是星云涡，车架是柏树枝。音：`scheduleEra12StarryNight` 的弦乐震音。

### 13 呐喊

- 文件：`src/scenes/s13_scream.js`。装裱：画架。跨框 `k=12`：表现主义油彩。
- 可复用：木浆纸板、酪素与色粉干擦、天空条带的笔触沸腾。
- 鹈鹕假设：桥上的尖叫者在躲这只冲过的鸟。音：`scheduleEra13Scream`。

### 14 诺斯费拉图

- 文件：`src/scenes/s14_nosferatu.js`。`specialExit: electrify_to_crt`。装裱：硝酸片片孔。跨框 `k=13` 仍是油彩手势；`k=14` 才是进入示波器的电弧，时间窗更长。
- 可复用：灰泥剥落、半影随离墙距离变宽、18 Hz 手摇闸门、银盐颗粒。
- 鹈鹕假设：场内禁止画实体鸟和实体车，只画奥洛克式长影。音：酒馆钢琴与管风琴，`scheduleEra14Nosferatu`。

### 15 示波器

- 文件：`src/scenes/s15_oscilloscope.js`。`specialEntry: electrify_from_shadow`，`poseMode` 可走到 `lissajous`。装裱：仪器面板。无铜牌。
- 可复用：P1 余晖、速度反比亮度、格线玻璃视差、锤纹漆机箱。
- 鹈鹕假设：李萨如形变的是这只鸟的波形，旋钮和型号牌也是虚构的 PELISCOPE。音：`scheduleEra15Oscilloscope` 的正弦 FM。

### 16 8-bit

- 文件：`src/scenes/s16_8bit.js`。12 Hz 量化。装裱：电视塑料壳。无铜牌。
- 可复用：250×250 整数帧缓冲、有限调色板、扫描线与孔径栅。
- 鹈鹕假设：关卡、金币和 1UP 都是原创 PELI-QUEST，精灵是这只鸟。音：`scheduleEra16Chiptune8Bit` 方波与三角波。

### 17 千禧聊天窗

- 文件：`src/scenes/s17_chat.js`。10 Hz 量化。装裱：CRT 机壳。无铜牌。
- 可复用：整数像素 Win32 边框、Bayer 抖动、GIF 扫描线、窗口抖动残影。
- 鹈鹕假设：虚构 PeliChat 2003 里的动图是骑车鹈鹕。不要换成真实操作系统商标。音：`scheduleEra17ChatWindow`。

### 18 蒸汽波

- 文件：`src/scenes/s18_vaporwave.js`。装裱：监视器边框。无铜牌。
- 可复用：落日网格、石膏胸像法线、VHS 跟踪雪花、色度拖影。运动被写成约 0.79 倍的磁带变慢。
- 鹈鹕假设：铬反射网格上的主体仍是这只鸟和车。音：`src/audio/vaporwave.js`，先升调再按约 `0.7937` 降速。这个系数是音画各自实现的，改一边不会自动改另一边。

### 19 竖屏短视频

- 文件：`src/scenes/s19_shortvideo.js`。`cameraMode: vertical_9_16`。装裱：手机金属边，幕布收紧后外框会让开。无铜牌。
- 可复用：9:16 黑幕、快门模糊分层、镜头鬼影、爱心粒子。黑幕数学在 `src/beat/camera.js` 与 `src/main.js`，不在场景文件单独完成。
- 鹈鹕假设：车道上的主体、评论和热搜文案都是这只鸟的短视频。音：`scheduleEra19ShortVideo`。

### 20 代码美学

- 文件：`src/scenes/s20_code.js`。装裱：3px 铝玻璃。无铜牌。三幕时间写在文件头：约 0.12–2.28 秒傅里叶，2.25–4.65 秒网格，4.65–6 秒实体。
- 可复用：暗色工作台、复平面本轮 `Σ c_k · exp(i·k·ω·t)` 的绘制方式、贝塞尔手柄。
- 鹈鹕假设：36 个系数来自这只鹈鹕的剪影。换轮廓必须重算系数，不能只改窗标题。音：`scheduleEra20CodeArt`。

## 音频对照

主题动机在 `src/audio/score.js` 的 `MAIN_MELODY_MOTIF`。调式表也在该文件：`pentatonic_major`、`egypt_hijaz`、`tang_yanyue`、`indian_yaman`、`javanese_slendro`、`edo_insen` 等。

- 片头与第 1–11 场：`src/audio/instruments_world.js`
- 第 12–17、19、20 场与片尾：`src/audio/instruments_modern.js`
- 第 18 场：`src/audio/vaporwave.js`
- 环境声与跨框拟音：`src/audio/foley.js`

`tools/render-audio.mjs` 走 OfflineAudioContext，和画面截帧是两条管线。本技能的短截帧不包含声音。
