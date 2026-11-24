# 从动作写成画面

用户给一段自然语言和一个画风名即可。由 Agent 把文字编成一个场景 JS，再把规则应用到画面。创作阶段可完全离线。从技能根目录执行下列命令，场景文件、输出文件可放在自己的项目中。

## 从文字到新主体

例如用户说「纸船松绳后穿过桥洞，浮世绘」。先写出三个可观察的时刻：松绳前绳端与船头重合、船在桥墩后局部被遮住、船从桥的另一侧出现。固定船头系绳点、船体折线、桥洞的轮廓和前后层级。这些属于动作。其次读浮世绘规则，把纸面分成几块独立色版，折线交给木刻主版，水面用渐层。几何是新画的船、桥和绳，画材来自木版分场。[完整场景源码](../examples/paper-boat.js)

1. 逐句标出主体、受力部分、道具、前后关系、镜头变化、接触/释放和终态。按剧本选时长与画幅。省略的细节可由 Agent 作可逆的创作决定。
2. 运行 `node scripts/style-scene.mjs rules "画风名"`。把返回的「造型、画材、空间、运动、验收」分别写进本镜头的实际画法。比如「皮影」要让可动片围绕铰点转，「白描」要给软轮廓和刚性结构分配不同线法。
3. 用下面的接口编写 `const scene`。在同一函数计算动作、镜头和遮挡。比较几种画风时把这些计算放在共用位置，背景、主体、道具按绘制顺序入画。视觉上需要不同轮廓或装饰时，用 `p.styleId` 选相应局部轮廓，继续共用接触锚点与运动时间。
4. 用 `build` 打包，然后在浏览器实际打开输出。交付可修改的动作源和可播放的 HTML。需要视频再用 `capture-frames.mjs --html` 导出。

### 已有动作脚本怎么接

已有 Canvas、SVG 或其他逐帧源码时，先找到「给定秒数返回姿态」的位置。沿用原来的关键帧、缓动、骨架、物件附着关系和镜头矩阵。把每个可见部件在该时刻的局部轮廓传给 `p.shape`、`p.path` 或 `p.strokePath`，把原来的部件变换放进 `p.group`。例如夹爪在 2.4 秒合拢，就以原脚本给出的两个爪尖坐标验收；木版的错色与白描的收锋在这一步之后绘制。有多镜头时按原剪辑点分派不同的绘制函数，并在切点两侧各取一帧。

## 场景接口

普通 JavaScript，无需导入。浏览器每次独立调用 `scene.draw(p,t)`，`t` 是从零起算的秒。场景中可自写函数、数学表达式、运动学、遮挡、镜头切换和构件，没有动作词表。画幅单位为画布像素，角度为弧度。时间控制不依赖帧序或墙上时钟。

```js
const scene = {
  title: '盖子打开，露出盒中的珠子', width: 640, height: 360, duration: 4,
  draw(p, t) {
    const angle = p.key(t, [[0,0], [0.7,0], [2.6,-1.3], [4,-1.3]]);
    p.ellipse(320,198,16,16,'accent',{feature:true});
    p.rect(228,201,185,38,'body',{width:2});
    p.group({x:228,y:182,rotate:angle},()=>{
      p.rect(0,-8,185,12,'secondary',{feature:true});
      p.anchor('盖铰点',0,0);
    });
  }
};
```

| 调用 | 用法 |
| --- | --- |
| `p.shape([[x,y],…], fill, opt)` / `p.line(points, stroke, width, opt)` | 闭合面 / 开放线。直角、铰链或精确接触点宜用显式顶点。 |
| `p.path(svgD, fill, opt)` / `p.strokePath(svgD, stroke, width, opt)` | 单条连续 SVG 路径的闭合面 / 开放曲线。多个子路径分别传入；桥洞等开口可用连续的内外缘画成一个面。 |
| `p.rect(x,y,w,h,fill,opt)` / `p.ellipse(cx,cy,rx,ry,fill,opt)` | 矩形与椭圆；矩形默认硬边。 |
| `p.group({x,y,rotate,sx,sy,alpha},()=>{…})` | 嵌套部件或整个镜头的局部坐标；先缩放，再旋转，再平移。 |
| `p.key(t, [[秒,值], …])` | 标量关键帧按时间递增，默认平滑插值。目标帧第三项写 `'linear'` 可匀速进入，首尾之外保持端值。 |
| `p.anchor('名称',x,y)` | 记下局部点经过组变换后的画布位置。`focus` 是手机取景框关注点。通过 `window.__sceneState.anchors` 可核对各画风同刻的位置。 |
| `p.styleId` / `p.styleNumber` | 当前画风的稳定代码或 1–20 编号。用在特定画风的造型与构图上。 |

`fill` 和 `stroke` 可用 `ground` 底材、`ink` 墨线、`body` 主体、`secondary` 配角、`accent` 点色、`light` 亮面、`muted` 远层。默认轮廓用墨线。面选项可写 `{stroke:null}` 或 `{width:2,edge:'rigid',feature:true,grainAngle:0.35,seed:21}`。其中 `feature` 标出主形体供皮影镂孔、默片投影、镀铬和傅里叶等画法使用；`seed` 固定局部笔触；`grainAngle` 使皴点和油画的笔触跟随表面方向。点色宜集中在叙事关键处。

## 播放、比较和导出

```sh
node scripts/style-scene.mjs build --scene examples/paper-boat.js --style 浮世绘 --style 唐代白描 --out boat.html
node scripts/style-scene.mjs build --scene examples/cam-stamp.js --style all --out press.html
node scripts/capture-frames.mjs --html boat.html --times 1.65,4.7,9 --out stills
node scripts/capture-frames.mjs --html boat.html --clip-start 0 --clip-seconds 9 --fps 30 --out movie
```

HTML 默认用第一种画风；暂停后切换下拉菜单会保留时间。可直接从这张 HTML 中导出任一种已打包的画风，例如 `node scripts/capture-frames.mjs --html boat.html --style 唐代白描 --times 1.65 --out tang`。省略 `--style` 时导出第一种。浏览器控制 `__seek(t)` 可暂停定位；`setSceneStyle('s11_ukiyoe')` 可在已打包的画风间切换；`captureFrameAt(t)` 返回画布 PNG 的 Base64；`__dur` 是秒数。后缀 `?capture=1` 打开后停在首帧。`?style=s11_ukiyoe` 可指定首选画风。

导出 PNG 需要 Node.js 22+ 与本机 Chrome/Chromium；MP4 另需 FFmpeg。Chrome 可用 `--chrome` 或 `CHROME_BIN` 指定，FFmpeg 可用 `FFMPEG_BIN` 指定。MP4 与帧序列在指定输出目录内，文件名为 `clip.mp4`、`clip-frames/`。输出画幅跟随场景。渲染默认为无声。

## 验证

在准备、接触、释放、终态各取一帧。拿在手里的物件要共享手的变换，释放后从释放点继续。检查先后遮挡，远层和笔纹不应遮住关键动作。将同一时刻在多个画风中来回切换，核对锚点、主体位置与构图可读性，再按所选规则的验收项检查媒介。遇到技能未内建的专属道具、动作或镜头语言，直接在场景中绘制；常用的材质行为集中在 `assets/medium/materials.js`。

验收动作动词本身。例如「蜗牛伸出触角，碰到露珠再缩回」应当同时观察触角根部到尖端的长度和尖端到露珠表面的距离。这样能发现只让触角转向、没有实际伸长的情况。
