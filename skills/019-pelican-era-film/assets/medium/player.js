// The scene owns the action. The player supplies material-aware drawing primitives and a seekable clock.
function startScene(scene, styles) {
  const { width: w, height: h, duration } = scene;
  if (
    !Number.isInteger(w) ||
    !Number.isInteger(h) ||
    w <= 0 ||
    h <= 0 ||
    !Number.isFinite(duration) ||
    duration <= 0 ||
    typeof scene.draw !== 'function'
  )
    throw new Error('场景需要正整数 width、height，正数 duration 和 draw(p,t)。');
  const canvas = document.querySelector('canvas'),
    ctx = canvas.getContext('2d');
  canvas.width = w;
  canvas.height = h;
  const select = document.querySelector('select'),
    slider = document.querySelector('[type=range]'),
    clock = document.querySelector('output');
  const playButton = document.querySelector('#play'),
    title = document.querySelector('h1');
  document.title = title.textContent = scene.title || '动作画风预览';
  slider.max = duration;
  styles.forEach((s) => {
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.name;
    select.appendChild(o);
  });
  const query = new URLSearchParams(location.search),
    requested = styles.find((s) => s.id === query.get('style'));
  const brushes = new Map(),
    paths = new Map();
  let style = requested || styles[0],
    material,
    time = 0,
    playing = false,
    origin = 0,
    raf = 0;
  function choose(s) {
    style = s;
    select.value = s.id;
    if (!brushes.has(s.id)) brushes.set(s.id, newMedium(s));
    material = brushes.get(s.id);
  }
  choose(style);
  function pathPoints(d) {
    if (paths.has(d)) return paths.get(d);
    const e = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    e.setAttribute('d', d);
    const length = e.getTotalLength(),
      samples = Math.max(2, Math.ceil(length / 3)),
      pts = [];
    for (let i = 0; i <= samples; i++) {
      const v = e.getPointAtLength((i * length) / samples);
      pts.push([v.x, v.y]);
    }
    if (pts.length > 2 && Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]) < 0.001)
      pts.pop();
    if (paths.size >= 480) paths.clear();
    paths.set(d, pts);
    return pts;
  }
  const substrate = document.createElement('canvas');
  substrate.width = w;
  substrate.height = h;
  const pixelSize = Math.max(2, Math.round(Math.min(w, h) / 135));
  const spriteScreen = document.createElement('canvas');
  spriteScreen.width = Math.ceil(w / pixelSize);
  spriteScreen.height = Math.ceil(h / pixelSize);
  let paperId = '';
  function render(value) {
    const t = Number(value);
    if (!Number.isFinite(t)) throw new Error('时间须为有限秒数');
    time = clamp(t, 0, duration);
    if (paperId !== style.id) {
      material.paper(substrate.getContext('2d'), w, h);
      paperId = style.id;
    }
    ctx.resetTransform();
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(substrate, 0, 0);
    const anchors = Object.create(null);
    function role(name) {
      if (!Object.hasOwn(style.palette, name)) throw new Error('未知颜色角色 ' + name);
      return name;
    }
    function drawPoints(pts, fill, opt = {}, lineOnly = false) {
      if (!Array.isArray(pts) || pts.length < (lineOnly ? 2 : 3)) return;
      const seed = opt.seed ?? 31;
      if (!pts.every((a) => Array.isArray(a) && a.length === 2 && a.every(Number.isFinite)))
        throw new Error('路径坐标须为有限数值 [x,y]');
      const points =
        style.number === 16
          ? pts.map(([x, y]) => [
              Math.round(x / pixelSize) * pixelSize,
              Math.round(y / pixelSize) * pixelSize,
            ])
          : pts;
      const options = { ...opt, pixelSize };
      ctx.save();
      try {
        if (!lineOnly)
          material.surface(ctx, points, role(fill), options, seed, time, time / duration);
        const stroke = lineOnly ? fill : opt.stroke === undefined ? 'ink' : opt.stroke;
        if (stroke !== null) {
          const width = opt.width ?? Math.max(1.2, Math.min(w, h) / 250);
          material.contour(ctx, points, role(stroke), width, options, seed, !lineOnly);
        }
      } finally {
        ctx.restore();
      }
    }
    const p = {
      styleId: style.id,
      styleNumber: style.number,
      shape: (pts, fill = 'body', opt) => drawPoints(pts, fill, opt),
      line: (pts, stroke = 'ink', width = 2, opt = {}) =>
        drawPoints(pts, stroke, { ...opt, width }, true),
      path: (d, fill = 'body', opt = {}) => drawPoints(pathPoints(d), fill, opt),
      strokePath: (d, stroke = 'ink', width = 2, opt = {}) =>
        drawPoints(pathPoints(d), stroke, { ...opt, width }, true),
      rect(x, y, rw, rh, fill = 'body', opt = {}) {
        drawPoints(
          [
            [x, y],
            [x + rw, y],
            [x + rw, y + rh],
            [x, y + rh],
          ],
          fill,
          { edge: 'rigid', ...opt },
        );
      },
      ellipse(x, y, rx, ry, fill = 'body', opt = {}) {
        const count = clamp(Math.ceil(Math.max(rx, ry) * 0.72), 14, 84);
        const pts = Array.from({ length: count }, (_, i) => [
          x + rx * Math.cos((i * Math.PI * 2) / count),
          y + ry * Math.sin((i * Math.PI * 2) / count),
        ]);
        drawPoints(pts, fill, opt);
      },
      group({ x = 0, y = 0, rotate = 0, sx = 1, sy = 1, alpha = 1 }, fn) {
        ctx.save();
        try {
          ctx.translate(x, y);
          ctx.rotate(rotate);
          ctx.scale(sx, sy);
          ctx.globalAlpha *= alpha;
          fn();
        } finally {
          ctx.restore();
        }
      },
      anchor(name, x, y) {
        const pt = new DOMPoint(x, y).matrixTransform(ctx.getTransform());
        anchors[name] = [pt.x, pt.y];
      },
      key(t, keys) {
        if (t <= keys[0][0]) return keys[0][1];
        for (let i = 1; i < keys.length; i++)
          if (t <= keys[i][0]) {
            const [a, from] = keys[i - 1],
              [b, to, ease] = keys[i];
            const u = clamp((t - a) / (b - a), 0, 1);
            return lerp(from, to, ease === 'linear' ? u : u * u * (3 - 2 * u));
          }
        return keys.at(-1)[1];
      },
    };
    scene.draw(p, time);
    material.finish(ctx, w, h, time, anchors);
    if (style.number === 16) {
      const low = spriteScreen.getContext('2d');
      low.imageSmoothingEnabled = false;
      low.drawImage(canvas, 0, 0, spriteScreen.width, spriteScreen.height);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spriteScreen, 0, 0, w, h);
      ctx.restore();
    }
    window.__sceneState = { time, anchors, style: style.id };
    slider.value = time;
    clock.value = time.toFixed(2) + ' / ' + duration.toFixed(2) + ' s';
    return time;
  }
  function stop() {
    playing = false;
    cancelAnimationFrame(raf);
    playButton.textContent = '播放';
  }
  function seek(t) {
    stop();
    return render(t);
  }
  function frame(now) {
    if (!playing) return;
    render(((now - origin) / 1000) % duration);
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (playing) {
      stop();
      return;
    }
    playing = true;
    playButton.textContent = '暂停';
    origin = performance.now() - time * 1000;
    raf = requestAnimationFrame(frame);
  }
  function setStyle(id) {
    const s = styles.find((v) => v.id === id);
    if (!s) throw new Error('未打包该画风 ' + id);
    choose(s);
    render(time);
  }
  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }
  select.onchange = () => setStyle(select.value);
  slider.oninput = () => seek(Number(slider.value));
  playButton.onclick = play;
  document.querySelector('#full').onclick = fullscreen;
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'BUTTON', 'SUMMARY'].includes(e.target.tagName)) return;
    if (e.code === 'Space') {
      e.preventDefault();
      play();
    }
    if (e.key.toLowerCase() === 'f') fullscreen();
  });
  Object.assign(window, {
    __dur: duration,
    __seek: seek,
    renderAt: seek,
    setSceneStyle: setStyle,
    captureFrameAt(t) {
      seek(t);
      return canvas.toDataURL('image/png').split(',')[1];
    },
  });
  render(0);
  window.__PELICAN_READY__ = true;
  if (!query.has('capture')) play();
}
