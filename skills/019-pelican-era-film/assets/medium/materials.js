// Medium adapters for subject-independent contours. Scene coordinates and time belong to the author.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, u) => a + (b - a) * u;
function smoothstep(a, b, v) {
  const u = clamp((v - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
}
function randomStream(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
function localPath(points, closed) {
  const path = new Path2D();
  points.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
  if (closed) path.closePath();
  return path;
}
function boundsOf(pts) {
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (const [x, y] of pts) {
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  return { x: left, y: top, w: Math.max(0.01, right - left), h: Math.max(0.01, bottom - top) };
}
function subdivide(points, step) {
  const sampled = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i - 1],
      [tx, ty] = points[i];
    const n = Math.max(1, Math.ceil(Math.hypot(tx - x, ty - y) / step));
    for (let j = 1; j <= n; j++) sampled.push([lerp(x, tx, j / n), lerp(y, ty, j / n)]);
  }
  return sampled;
}
function strokePlain(c, pts, color, width) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.stroke(localPath(pts, false));
}
function gradient(c, b, stops) {
  const g = c.createLinearGradient(0, b.y, 0, b.y + b.h);
  for (const [u, color] of stops) g.addColorStop(u, color);
  return g;
}
function lightMix(a, b, u) {
  const parts = [1, 3, 5].map((i) =>
    Math.round(lerp(parseInt(a.slice(i, i + 2), 16), parseInt(b.slice(i, i + 2), 16), u)),
  );
  return 'rgb(' + parts.join(',') + ')';
}
const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function textureCanvas(n, p) {
  const tile = document.createElement('canvas');
  tile.width = tile.height = 120;
  const c = tile.getContext('2d'),
    rand = randomStream(3181 + n),
    ops = mediumTools[n];
  for (let i = 0; i < 720; i++) {
    const x = rand() * 120,
      y = rand() * 120;
    c.fillStyle = i % 3 ? p.ink : p.light;
    c.globalAlpha = 0.1 + rand() * 0.17;
    if (n === 1) {
      const tooth = ops.worleyRock(x / 7, y / 7, 27);
      c.fillRect(x, y, 0.6 + tooth * 2, 0.8 + tooth * 1.8);
    } else if ([4, 6, 7, 8, 9, 11, 13].includes(n)) c.fillRect(x, y, rand() * 4 + 0.4, 0.45);
    else c.fillRect(x, y, 1, 1);
  }
  return tile;
}
function newMedium(style) {
  const n = style.number,
    p = style.palette,
    ops = mediumTools[n],
    tile = textureCanvas(n, p);
  const reconCache = new Map();
  const desktopTiles = new Map();
  let atlas;
  if (n === 12)
    atlas = ops.getImpastoAtlas({
      bake2D(_key, draw, w, h) {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        draw(null, canvas.getContext('2d'), randomStream(683));
        return { canvas };
      },
    });
  const pigment = { ground: 1, ink: 0, body: 4, secondary: 14, accent: 10, light: 8, muted: 3 };
  function oil(c, b, role, rand, count, flow = 0) {
    const painter = ops.createDabPainter(c, atlas);
    for (let i = 0; i < count; i++) {
      const x = b.x + rand() * b.w,
        y = b.y + rand() * b.h;
      const angle = flow + Math.sin((x - b.x) / 47 + (y - b.y) / 37) * 0.65;
      painter.dab(
        i % 7 === 0 ? (role === 'accent' ? 8 : 6) : (pigment[role] ?? 3),
        x,
        y,
        angle,
        8 + rand() * 18,
        2 + rand() * 5,
        i,
      );
    }
    painter.restore();
  }
  function paper(c, w, h) {
    c.fillStyle = p.ground;
    c.fillRect(0, 0, w, h);
    const rand = randomStream(780 + n),
      b = { x: 0, y: 0, w, h };
    if (n === 10 || n === 14) {
      const g = c.createRadialGradient(
        w * 0.45,
        h * 0.43,
        h * 0.05,
        w * 0.48,
        h * 0.49,
        Math.max(w * 0.7, h * 0.8),
      );
      g.addColorStop(0, p.light);
      g.addColorStop(0.62, p.ground);
      g.addColorStop(1, n === 14 ? p.secondary : p.muted);
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
    }
    if (n === 2 || n === 6 || n === 7 || n === 8) {
      c.strokeStyle = p.muted;
      c.lineWidth = 1;
      if (n === 7) {
        for (let x = w / 3; x < w; x += w / 3) {
          c.fillStyle = 'rgba(87,57,32,.08)';
          c.fillRect(x, 0, 3, h);
        }
      } else if (n === 8) {
        c.strokeRect(w * 0.018, h * 0.026, w * 0.964, h * 0.948);
        c.strokeRect(w * 0.023, h * 0.033, w * 0.954, h * 0.934);
      } else if (n === 2) {
        c.fillStyle = p.muted;
        c.fillRect(0, h * 0.036, w, 2);
        c.fillRect(0, h * 0.957, w, 2);
      }
    }
    if (n === 12) oil(c, b, 'ground', rand, Math.ceil((w * h) / 430), -0.35);
    if (n === 13) {
      for (let j = 0; j < 17; j++) {
        const y = (h * j) / 16;
        const pts = Array.from({ length: 32 }, (_, i) => [
          (w * i) / 31,
          y + Math.sin(i * 0.23 + j * 0.16) * h * 0.055,
        ]);
        ops.drawDryPastelRibbon(c, pts, {
          color: [p.accent, p.body, p.secondary][j % 3],
          width: h * 0.041,
          alpha: 0.36,
          waviness: 1.2,
          bristles: 2,
          phase: j,
        });
      }
    }
    if ([15, 18, 20].includes(n)) {
      c.save();
      c.globalAlpha = n === 18 ? 0.42 : 0.32;
      if (n === 18) {
        const g = gradient(c, b, [
          [0, p.ground],
          [0.55, p.secondary],
          [0.6, p.muted],
          [1, p.ground],
        ]);
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
        for (let i = -10; i <= 10; i++)
          strokePlain(
            c,
            [
              [w * 0.5 + i * w * 0.025, h * 0.56],
              [w * 0.5 + i * w * 0.2, h],
            ],
            p.secondary,
            1.4,
          );
        for (let i = 0; i < 10; i++) {
          const y = h * (0.56 + 0.44 * (i / 9) ** 1.8);
          strokePlain(
            c,
            [
              [0, y],
              [w, y],
            ],
            p.secondary,
            1,
          );
        }
      } else {
        const step = Math.max(18, Math.min(w, h) / 12);
        for (let x = 0; x < w; x += step)
          strokePlain(
            c,
            [
              [x, 0],
              [x, h],
            ],
            p.muted,
            1,
          );
        for (let y = 0; y < h; y += step)
          strokePlain(
            c,
            [
              [0, y],
              [w, y],
            ],
            p.muted,
            1,
          );
      }
      c.restore();
    }
    if (n === 17) {
      ops.drawBevelBox(c, 0, 0, w, h, { fill: p.ground });
      c.fillStyle = p.ink;
      c.fillRect(4, 4, w - 8, Math.min(16, h * 0.035));
    }
    if (n < 15) {
      c.fillStyle = c.createPattern(tile, 'repeat');
      c.globalAlpha = n === 1 ? 0.95 : 0.58;
      c.fillRect(0, 0, w, h);
      c.globalAlpha = 1;
    }
  }
  function contour(c, pts, role, width, opt, seed, closed) {
    if (width <= 0 || pts.length < 2) return;
    const color = p[role],
      line = closed ? [...pts, pts[0]] : pts,
      rand = randomStream(seed);
    const dense = () => subdivide(line, Math.max(3, width * 1.8));
    switch (n) {
      case 1: {
        strokePlain(c, line, color, width);
        const d = dense();
        c.fillStyle = p.ground;
        c.globalAlpha *= 0.45;
        for (const [x, y] of d)
          if (rand() < 0.38) c.fillRect(x - rand() * width, y, width * 0.7, width * 0.4);
        break;
      }
      case 2:
        ops.rushStroke(c, line, rand, { color, width, tremor: 0.28, alpha: 1 });
        break;
      case 3:
        ops.chiselVGroove(c, dense(), width * 1.35, seed, color);
        break;
      case 4:
        if (opt.edge === 'rigid') ops.drawTiexianStroke(c, dense(), width * 0.83, color, 1, seed);
        else
          ops.drawLanyeStroke(c, dense(), {
            minW: width * 0.2,
            maxW: width * 1.85,
            color,
            halo: false,
            phase: 0.2,
            seed,
          });
        break;
      case 5:
        strokePlain(c, line, color, width * 0.74);
        break;
      case 6:
        if (opt.edge === 'rigid' || pts.length <= 5)
          for (let i = 1; i < line.length; i++)
            ops.jiehuaStroke(c, ...line[i - 1], ...line[i], width * 0.83, color, 1);
        else strokePlain(c, line, color, width * 0.78);
        break;
      case 7:
        ops.drawQuillRibbon(c, dense(), {
          color,
          wStart: width * 1.3,
          wEnd: width * 0.78,
          seed,
          poolCorners: true,
        });
        break;
      case 8:
        ops.drawQalamStroke(c, dense(), {
          color,
          wStart: width * 0.75,
          wMid: width,
          wEnd: width * 0.55,
          seed,
        });
        break;
      case 9:
        ops.drawSealBrushStroke(c, opt.edge === 'rigid' ? dense() : line, rand, {
          color,
          wStart: width * 1.4,
          wMid: width * 1.2,
          wEnd: width * 0.38,
          dryness: 0.48,
          bristles: 4,
          samplesPerSeg: 4,
        });
        break;
      case 11:
        ops.drawCarvedKeyblockCurve(
          c,
          dense().map(([x, y]) => ({ x, y })),
          width * 0.65,
          width * 1.26,
          width * 0.59,
          color,
          seed,
        );
        break;
      case 13:
        ops.drawDryPastelRibbon(c, dense(), {
          color,
          width: width * 1.7,
          alpha: 0.95,
          bristles: 3,
          phase: seed * 0.03,
        });
        break;
      case 15:
        c.shadowColor = color;
        c.shadowBlur = 5;
        strokePlain(c, line, color, width * 1.38);
        c.shadowBlur = 0;
        strokePlain(c, line, p.light, Math.max(0.65, width * 0.35));
        break;
      case 16: {
        const grid = Math.max(1, opt.pixelSize),
          setPixel = (x, y) => c.fillRect(x * grid, y * grid, grid, grid);
        c.fillStyle = color;
        for (let j = 1; j < line.length; j++)
          ops.pline(
            setPixel,
            line[j - 1][0] / grid,
            line[j - 1][1] / grid,
            line[j][0] / grid,
            line[j][1] / grid,
            color,
            clamp(Math.round(width / grid), 1, 3),
          );
        break;
      }
      default:
        strokePlain(c, line, color, width);
    }
  }
  function surface(c, pts, role, opt, seed, t, progress) {
    const b = boundsOf(pts),
      path = localPath(pts, true),
      col = p[role],
      rand = randomStream(seed),
      area = b.w * b.h;
    let base = col;
    if (n === 15) base = role === 'ground' ? col : lightMix(p.ground, col, 0.115);
    if (n === 4 && role !== 'ink') base = lightMix(p.light, col, 0.5);
    if (n === 11 || n === 5 || n === 9)
      base = gradient(c, b, [
        [0, lightMix(col, p.light, n === 11 ? 0.25 : 0.37)],
        [0.65, col],
        [1, lightMix(col, p.ink, 0.12)],
      ]);
    if (n === 14) {
      const L = {
        ink: 0.075,
        body: 0.25,
        secondary: 0.46,
        accent: 0.65,
        light: 0.92,
        muted: 0.56,
        ground: 0.72,
      }[role];
      base = 'rgb(' + ops.orthochromaticSplitToneRGB(L).map(Math.round).join(',') + ')';
      if (opt.feature) {
        c.save();
        c.transform(1, 0, -0.18, 0.92, b.y * 0.18 + 6, b.y * 0.08 + 6);
        c.fillStyle = 'rgba(32,28,30,.48)';
        c.fill(path);
        c.restore();
      }
    }
    if (n === 18) {
      base = gradient(
        c,
        b,
        Array.from({ length: 17 }, (_, i) => [
          i / 16,
          ops.sampleSkyEarthChromeEnv(i / 8 - 1, 0.3, t * 0.55, opt.feature ? 8 : 0),
        ]),
      );
      if (!opt.feature)
        base = gradient(c, b, [
          [0, lightMix(col, p.light, 0.35)],
          [0.48, col],
          [0.52, lightMix(col, p.ink, 0.2)],
          [1, col],
        ]);
    }
    c.fillStyle = base;
    if (n === 2 || n === 11) {
      c.fillStyle = n === 11 ? p.light : p.ground;
      c.fill(path);
      c.fillStyle = base;
      if (n === 11) ops.withColorPlate(c, { dx: 1.5, dy: -0.8 }, 0.91, () => c.fill(path));
      else {
        c.save();
        c.translate(0.9, -0.45);
        c.fill(path);
        c.restore();
      }
    } else c.fill(path);
    c.save();
    c.clip(path);
    const count = Math.min(230, Math.ceil(area / 600));
    if (n === 2 && opt.feature && b.h > 16) {
      const y = b.y + b.h * 0.71;
      c.globalAlpha *= 0.64;
      c.fillStyle = p.secondary;
      c.fillRect(b.x, y, b.w, Math.min(3, b.h * 0.07));
      c.fillStyle = p.light;
      c.fillRect(b.x, y + 3, b.w, 1);
    }
    if (n === 6 && opt.edge === 'rigid' && b.w > 9 && b.h > 7) {
      c.globalAlpha *= 0.42;
      const inset = pts.map(([x, y]) => [
        lerp(x, b.x + b.w * 0.5, 0.08),
        lerp(y, b.y + b.h * 0.5, 0.12),
      ]);
      const chain = [...inset, inset[0]];
      for (let j = 1; j < chain.length; j++)
        ops.jiehuaStroke(c, ...chain[j - 1], ...chain[j], 0.8, p.ink, 0.8);
    }
    if (n === 7 && opt.feature && b.w > 25 && b.h > 13) {
      const spacing = clamp(b.h * 0.25, 9, 21),
        y = b.y + b.h * 0.65;
      for (let x = b.x + spacing * 0.35; x < b.x + b.w; x += spacing * 1.3) {
        ops.drawQuillRibbon(
          c,
          [
            [x, y],
            [x + spacing * 0.34, y - spacing * 0.4],
            [x + spacing * 0.7, y],
            [x + spacing * 0.35, y + spacing * 0.24],
          ],
          { wStart: 1.6, wEnd: 1, color: p.ink, seed, poolCorners: false },
        );
      }
    }
    if (n === 1 || n === 3) {
      c.fillStyle = c.createPattern(tile, 'repeat');
      c.fillRect(b.x, b.y, b.w, b.h);
      c.fillStyle = p.ground;
      c.globalAlpha *= 0.6;
      for (let i = 0; i < count * 2; i++)
        c.fillRect(b.x + rand() * b.w, b.y + rand() * b.h, 1 + rand() * 2, 1);
    }
    if (n === 5) {
      c.fillStyle = p.ink;
      c.globalAlpha *= role === 'muted' ? 0.13 : 0.32;
      for (let i = 0; i < count * 2; i++)
        ops.drawRaindropCunDab(
          c,
          b.x + rand() * b.w,
          b.y + rand() * b.h,
          3 + rand() * 7,
          1 + rand() * 1.3,
          1.9 + (opt.grainAngle || 0),
          0.18,
          rand,
        );
    }
    if (n === 8) {
      ops.paintPardazStipple(
        c,
        b.x + b.w * 0.56,
        b.y + b.h * 0.56,
        b.w * 0.52,
        b.h * 0.55,
        Math.min(1200, count * 9),
        p.ink,
        0.39,
        seed,
      );
      if (opt.feature && b.h > 15) {
        c.save();
        c.translate(1.2, 1.2);
        c.lineWidth = 2.4;
        c.strokeStyle = '#c9a45c';
        c.stroke(path);
        c.restore();
      }
    }
    if (n === 9) {
      c.fillStyle = p.light;
      c.globalAlpha *= 0.22;
      for (let i = 0; i < count; i++)
        c.fillRect(b.x + rand() * b.w, b.y + rand() * b.h, 1 + rand() * 6, 0.8);
    }
    if (n === 10 && opt.feature && b.w > 13 && b.h > 10) {
      c.fillStyle = p.light;
      for (let row = 0; row < 2; row++)
        ops.punchHoleRow(
          c,
          b.x + b.w * 0.2,
          b.y + b.h * (0.38 + row * 0.23),
          b.x + b.w * 0.8,
          b.y + b.h * (0.27 + row * 0.23),
          Math.min(15, Math.max(3, Math.round(b.w / 9))),
          Math.min(2, b.h * 0.055),
          row + seed,
        );
    }
    if (n === 12) oil(c, b, role, rand, Math.min(520, Math.ceil(area / 97)), opt.grainAngle || 0);
    if (n === 13) {
      for (let j = 0; j < Math.min(16, Math.ceil(b.h / 7)); j++) {
        const y = b.y + j * 8;
        const q = Array.from({ length: 15 }, (_, i) => [
          b.x + (i * b.w) / 14,
          y + Math.sin(i * 0.39 + seed) * 3,
        ]);
        ops.drawDryPastelRibbon(c, q, {
          color: j % 2 ? col : p.light,
          width: 2,
          alpha: 0.3,
          phase: j,
          bristles: 1,
        });
      }
    }
    if (n === 16 && area > 100) {
      const g = opt.pixelSize;
      c.fillStyle = p.ink;
      c.globalAlpha *= 0.16;
      for (let y = Math.floor((b.y + b.h * 0.74) / g) * g; y < b.y + b.h; y += g)
        for (let x = Math.floor(b.x / g) * g; x < b.x + b.w; x += g)
          if (ops.tileHash(x, y) < 24) c.fillRect(x, y, g, g);
    }
    if (n === 17) {
      if (!desktopTiles.has(col)) {
        const tileCanvas = document.createElement('canvas');
        tileCanvas.width = tileCanvas.height = 4;
        const px = tileCanvas.getContext('2d');
        for (let i = 0; i < 16; i++) {
          const rgb = [1, 3, 5].map((k) =>
            ops.snapWebSafe(parseInt(col.slice(k, k + 2), 16), bayer[i] / 16 - 0.5),
          );
          px.fillStyle = 'rgb(' + rgb.join(',') + ')';
          px.fillRect(i % 4, i >> 2, 1, 1);
        }
        desktopTiles.set(col, c.createPattern(tileCanvas, 'repeat'));
      }
      c.fillStyle = desktopTiles.get(col);
      c.globalAlpha *= 0.67;
      c.fillRect(b.x, b.y, b.w, b.h);
    }
    if (n === 19 && opt.feature) {
      c.save();
      c.globalAlpha *= 0.32;
      c.translate(-1.2, 0);
      c.strokeStyle = '#35c7d5';
      c.lineWidth = 2.4;
      c.stroke(path);
      c.translate(2.4, 0);
      c.strokeStyle = '#e07773';
      c.stroke(path);
      c.restore();
    }
    c.restore();
    if (n === 20 && opt.feature && area > 80) {
      const key = pts.map(([x, y]) => x + ',' + y).join('|');
      let reconstructed = reconCache.get(key);
      if (!reconstructed) {
        reconstructed = ops.reconstructContour(pts);
        if (reconCache.size >= 160) reconCache.clear();
        reconCache.set(key, reconstructed);
      }
      c.save();
      c.globalAlpha *= 0.62;
      strokePlain(c, [...reconstructed, reconstructed[0]], p.light, 0.9);
      const k = Math.min(63, Math.floor(progress * 63)),
        [cx, cy] = reconstructed[k];
      c.fillStyle = p.accent;
      c.fillRect(cx - 1.5, cy - 1.5, 3, 3);
      c.restore();
    }
  }
  function finish(c, w, h, t, anchors) {
    if (n === 15) {
      c.fillStyle = p.light;
      c.globalAlpha = 0.045 * (1 + ops.analogNoise(Math.floor(t * 30), 12) * 0.35);
      for (let y = 1; y < h; y += 4) c.fillRect(0, y, w, 1);
      c.globalAlpha = 1;
    }
    if (n === 19) {
      const target = anchors.focus || [w / 2, h / 2],
        x = clamp(target[0], w * 0.045, w * 0.955),
        y = clamp(target[1], h * 0.055, h * 0.945);
      const pulse = ops.evalHermiteSegment(t % 1, 0, 1, 0, 1, 0, 0),
        r = Math.min(w, h) * (0.041 + 0.008 * pulse);
      c.save();
      c.globalAlpha = 0.67;
      for (const dx of [-1, 1])
        for (const dy of [-1, 1])
          strokePlain(
            c,
            [
              [x + dx * r * 0.52, y + dy * r],
              [x + dx * r, y + dy * r],
              [x + dx * r, y + dy * r * 0.55],
            ],
            p.light,
            1.3,
          );
      c.restore();
    }
  }
  return { paper, contour, surface, finish };
}
