// Portable Canvas drawing operators from orbitoo/pelican-test, pinned at 59c8ca2657ce5b2cf067969b5bda19d6609af8ac.
// Copyright (c) 2026 Elbert, MIT. See references/upstream/LICENSE.
// The registry and the subject-independent contour adapter are from Science Motion Skills.
const mediumTools = {};

// src/scenes/s01_sahara.js
mediumTools[1] = (() => {
  function worleyRock(x, y, seed) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    let minD2 = 9.0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = ix + dx;
        const cy = iy + dy;
        const px = cx + hash2f(cx, cy, seed);
        const py = cy + hash2f(cx, cy, seed + 71);
        const ddx = px - x;
        const ddy = py - y;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < minD2) minD2 = d2;
      }
    }
    return Math.min(1.0, Math.sqrt(minD2));
  }

  function hash2f(ix, iy, seed = 1337) {
    let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) * 2.3283064365386963e-10;
  }
  return { worleyRock };
})();

// src/scenes/s02_egypt.js
mediumTools[2] = (() => {
  const EGYPT = { kohl: '#302420' };
  function rushStroke(
    ctx,
    pts,
    rng,
    {
      color = EGYPT.kohl,
      width = 1.9,
      tremor = 0.55,
      alpha = 0.95,
      dryTail = true,
      subStep = 9,
    } = {},
  ) {
    if (!pts || pts.length < 2) return;

    const dense = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const d = Math.hypot(x1 - x0, y1 - y0);
      const n = Math.max(1, Math.ceil(d / subStep));
      for (let k = 1; k <= n; k++) {
        const u = k / n;
        const midEnv = Math.sin(u * Math.PI);
        const jx = rng ? (rng() - 0.5) * tremor * (0.5 + midEnv * 0.8) : 0;
        const jy = rng ? (rng() - 0.5) * tremor * (0.5 + midEnv * 0.8) : 0;
        dense.push([x0 + (x1 - x0) * u + jx, y0 + (y1 - y0) * u + jy]);
      }
    }

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Primary reed nib body
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = 0; i < dense.length; i++) {
      const [px, py] = dense[i];
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Secondary frayed rush fiber edge + start nib ink-pooling accent
    if (width >= 1.3) {
      ctx.globalAlpha = alpha * 0.42;
      ctx.lineWidth = Math.max(0.7, width * 0.48);
      ctx.beginPath();
      const endLimit = dryTail ? Math.max(1, dense.length - 1) : dense.length;
      for (let i = 0; i < endLimit; i++) {
        const [px, py] = dense[i];
        const off = (rng ? rng() - 0.35 : 0.2) * width * 0.42;
        if (i === 0) ctx.moveTo(px + off, py + off * 0.6);
        else ctx.lineTo(px + off, py + off * 0.6);
      }
      ctx.stroke();

      // Subtle wet-ink nib press at stroke start
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * 0.38;
      const r0 = width * 0.58;
      ctx.fillRect(dense[0][0] - r0 * 0.5, dense[0][1] - r0 * 0.5, r0, r0 * 0.9);
    }

    ctx.restore();
  }
  return { rushStroke };
})();

// src/scenes/s03_han.js
mediumTools[3] = (() => {
  const SOOT_BG = '#272723';
  function chiselVGroove(ctx, pts, maxWidth = 2.5, seed = 41, color = SOOT_BG) {
    if (!pts || pts.length < 2) return;
    const dense = pts.length <= 3 ? perturbChiselPoly(pts, 0.55, seed, false) : pts;
    const n = dense.length;
    if (n < 2) return;

    const left = [];
    const right = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const [px, py] = dense[i];
      const [xPrev, yPrev] = dense[Math.max(0, i - 1)];
      const [xNext, yNext] = dense[Math.min(n - 1, i + 1)];
      const tx = xNext - xPrev;
      const ty = yNext - yPrev;
      const tl = Math.hypot(tx, ty) || 1;
      const nx = -ty / tl;
      const ny = tx / tl;

      // Chisel entry & exit taper + stone-grain chatter
      const entryExit = u < 0.14 ? u / 0.14 : u > 0.84 ? (1 - u) / 0.16 : 1.0;
      const chatter = 0.72 + 0.46 * stoneHash(seed * 53 + i * 19);
      const hw = Math.max(0.28, 0.5 * maxWidth * (0.22 + 0.78 * entryExit) * chatter);
      left.push([px + nx * hw, py + ny * hw]);
      right.push([px - nx * hw, py - ny * hw]);
    }

    ctx.save();
    // Subtle damp-paper bevel shadow halo along groove rim
    ctx.strokeStyle = 'rgba(20, 18, 15, 0.26)';
    ctx.lineWidth = maxWidth * 0.95;
    ctx.lineJoin = 'bevel';
    ctx.beginPath();
    ctx.moveTo(dense[0][0], dense[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(dense[i][0], dense[i][1]);
    ctx.stroke();

    // Sharp V-groove core
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(left[i][0], left[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    ctx.fill();

    // Spalled micro stone-crumb chip at chisel turn/exit
    if (n >= 3 && maxWidth >= 1.7) {
      const midIdx = Math.floor(n * 0.5);
      const [mx, my] = dense[midIdx];
      const cr = 0.8 + stoneHash(seed + 11) * 1.4;
      ctx.fillStyle = color;
      ctx.fillRect(mx - cr * 0.5, my - cr * 0.5, cr * 1.3, cr * 0.9);
    }
    ctx.restore();
  }

  function stoneHash(n) {
    let x = Math.imul(n | 0, 0x27d4eb2d);
    x = (x ^ (x >>> 15)) >>> 0;
    x = Math.imul(x, 0x85ebca6b) >>> 0;
    return ((x ^ (x >>> 13)) >>> 0) * 2.3283064365386963e-10;
  }

  function perturbChiselPoly(pts, chipAmt = 1.05, seed = 13, closed = true) {
    if (pts.length < 2) return pts;
    const out = [];
    const count = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < count; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy) || 1;
      const steps = Math.max(1, Math.min(6, Math.round(len / 18)));
      const nx = -dy / len;
      const ny = dx / len;
      for (let s = 0; s < steps; s++) {
        const u = s / steps;
        const off =
          s === 0
            ? stoneNoise1D(i * 3.1, seed) * chipAmt * 0.45
            : stoneNoise1D(i * 7.3 + s * 1.9, seed) * chipAmt;
        out.push([lerp(x0, x1, u) + nx * off, lerp(y0, y1, u) + ny * off]);
      }
    }
    if (!closed) out.push(pts[pts.length - 1]);
    return out;
  }

  function stoneNoise1D(u, seed = 1) {
    const i = Math.floor(u);
    const f = u - i;
    const s = f * f * (3 - 2 * f);
    return lerp(stoneHash(i + seed * 131), stoneHash(i + 1 + seed * 131), s) * 2 - 1;
  }
  return { chiselVGroove };
})();

// src/scenes/s04_tang.js
mediumTools[4] = (() => {
  const INK_SHADES = {
    jiao: '#282520',
    dan: '#b8aba0',
    nong: '#484137',
    qing: 'rgba(82,79,72,.23)',
  };
  function drawLanyeStroke(
    ctx,
    pts,
    {
      minW = 0.65,
      maxW = 5.4,
      color = INK_SHADES.jiao,
      haloColor = INK_SHADES.dan,
      alpha = 1.0,
      waves = 2.0,
      phase = 0.0,
      sharpTail = true,
      tailStart = 0.68,
      tremor = 0.42,
      halo = true,
      splitFilaments = 0,
      seed = 19,
    } = {},
  ) {
    const n = pts.length;
    if (n < 2) return;

    const leftBone = [];
    const rightBone = [];
    const leftHalo = [];
    const rightHalo = [];
    const normals = [];
    const halfWidths = [];
    const centers = [];

    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const [rawX, rawY] = pts[i];
      const [prevX, prevY] = pts[Math.max(0, i - 1)];
      const [nextX, nextY] = pts[Math.min(n - 1, i + 1)];
      const tx = nextX - prevX;
      const ty = nextY - prevY;
      const tl = Math.hypot(tx, ty) || 1;
      const nx = -ty / tl;
      const ny = tx / tl;

      // Subtle calligrapher wrist tremor (pinned to 0 at endpoints if sharpTail=false so joints stay exact!)
      const endPin = sharpTail
        ? smoothstep(0, 0.08, u)
        : smoothstep(0, 0.12, u) * smoothstep(0, 0.12, 1 - u);
      const jitter = tremor > 0 ? wristNoise1D(u * 7.5 + phase, seed) * tremor * endPin : 0;
      const px = rawX + nx * jitter;
      const py = rawY + ny * jitter;

      let env;
      if (u < 0.08) {
        // 藏锋起笔: crisp press-in dwell
        env = 0.26 + 0.74 * Math.sin((u / 0.08) * (Math.PI * 0.5));
      } else if (sharpTail && u > tailStart) {
        // 长锋出锋: extended supple wolf-hair whip exit
        const k = (1 - u) / Math.max(0.05, 1 - tailStart);
        env = Math.pow(Math.max(0, k), 1.52);
      } else {
        env = 0.96;
      }

      // Curvature dwell bonus (`折钗/顿挫驻笔蓄墨`)
      let turnBonus = 0;
      if (i > 0 && i < n - 1) {
        const dxA = rawX - prevX;
        const dyA = rawY - prevY;
        const dxB = nextX - rawX;
        const dyB = nextY - rawY;
        const lA = Math.hypot(dxA, dyA) || 1;
        const lB = Math.hypot(dxB, dyB) || 1;
        const cosTurn = clamp((dxA * dxB + dyA * dyB) / (lA * lB), -1, 1);
        turnBonus = (1 - cosTurn) * 0.35;
      }

      const swell = Math.pow(0.5 + 0.5 * Math.sin(u * Math.PI * waves + phase), 0.85);
      const w = lerp(minW, maxW, clamp(env * (0.3 + 0.7 * swell + turnBonus), 0.02, 1.0));
      const hw = 0.5 * w;
      const haloExtra = halo ? Math.min(0.85, 0.32 + hw * 0.24) : 0;

      centers.push([px, py]);
      normals.push([nx, ny]);
      halfWidths.push(hw);

      leftBone.push([px + nx * hw, py + ny * hw]);
      rightBone.push([px - nx * hw, py - ny * hw]);
      if (halo) {
        leftHalo.push([px + nx * (hw + haloExtra), py + ny * (hw + haloExtra)]);
        rightHalo.push([px - nx * (hw + haloExtra), py - ny * (hw + haloExtra)]);
      }
    }

    ctx.save();

    // 1. Pale-ink sizing fiber-diffusion halo (`淡韵渗边`)
    if (halo && maxW >= 1.6) {
      ctx.globalAlpha = alpha * 0.24;
      ctx.fillStyle = haloColor;
      ctx.beginPath();
      ctx.moveTo(leftHalo[0][0], leftHalo[0][1]);
      for (let i = 1; i < n; i++) ctx.lineTo(leftHalo[i][0], leftHalo[i][1]);
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(rightHalo[i][0], rightHalo[i][1]);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Dense center-tip carbon ink bone (`中锋浓墨骨线`)
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(leftBone[0][0], leftBone[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(leftBone[i][0], leftBone[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(rightBone[i][0], rightBone[i][1]);
    ctx.closePath();
    ctx.fill();

    // 3. Multi-filament wolf-hair dry-brush tip split (`5~9 丝狼毫分叉飞白`)
    if (splitFilaments >= 3 && n >= 6) {
      const startIdx = Math.max(1, Math.floor(n * 0.62));
      const endPt = centers[n - 1];
      const prevPt = centers[n - 2];
      const dirX = endPt[0] - prevPt[0];
      const dirY = endPt[1] - prevPt[1];
      const dirL = Math.hypot(dirX, dirY) || 1;
      const ux = dirX / dirL;
      const uy = dirY / dirL;
      const unx = -uy;
      const uny = ux;

      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      for (let f = 0; f < splitFilaments; f++) {
        const fNorm = (f / (splitFilaments - 1)) * 2 - 1; // [-1..1]
        const fLenExtra = (4 + brushHash(seed * 31 + f * 17) * 14) * (1 - 0.35 * Math.abs(fNorm));
        ctx.lineWidth = Math.max(0.32, 0.72 - 0.25 * Math.abs(fNorm));
        ctx.globalAlpha = alpha * (0.36 + 0.38 * (1 - Math.abs(fNorm)));
        ctx.beginPath();
        for (let i = startIdx; i < n; i++) {
          const k = (i - startIdx) / Math.max(1, n - 1 - startIdx);
          const spread = fNorm * (halfWidths[startIdx] * 1.15 + k * 2.8);
          const fx = centers[i][0] + normals[i][0] * spread;
          const fy = centers[i][1] + normals[i][1] * spread;
          if (i === startIdx) ctx.moveTo(fx, fy);
          else ctx.lineTo(fx, fy);
        }
        ctx.lineTo(
          endPt[0] + ux * fLenExtra + unx * fNorm * 3.4,
          endPt[1] + uy * fLenExtra + uny * fNorm * 3.4,
        );
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function drawTiexianStroke(
    ctx,
    pts,
    width = 1.55,
    color = INK_SHADES.nong,
    alpha = 1.0,
    seed = 29,
  ) {
    if (!pts || pts.length < 2) return;
    drawLanyeStroke(ctx, pts, {
      minW: width * 0.72,
      maxW: width * 1.18,
      color,
      alpha,
      waves: 1.5,
      phase: seed * 0.3,
      sharpTail: false,
      tremor: 0.24,
      halo: false,
      seed,
    });
  }

  function brushHash(n) {
    let x = Math.imul(n | 0, 0x27d4eb2d);
    x = (x ^ (x >>> 15)) >>> 0;
    x = Math.imul(x, 0x85ebca6b) >>> 0;
    return ((x ^ (x >>> 13)) >>> 0) * 2.3283064365386963e-10;
  }

  function wristNoise1D(u, seed = 1) {
    const i = Math.floor(u);
    const f = u - i;
    const s = f * f * (3 - 2 * f);
    return lerp(brushHash(i + seed * 137), brushHash(i + 1 + seed * 137), s) * 2 - 1;
  }
  return { drawLanyeStroke, drawTiexianStroke };
})();

// src/scenes/s05_song.js
mediumTools[5] = (() => {
  function drawRaindropCunDab(ctx, x, y, len, width, angle, curve, rng) {
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const nx = -sa;
    const ny = ca;

    const hwTop = width * (0.52 + 0.16 * rng());
    const hwMid = width * (0.38 + 0.12 * rng());
    const bend = curve * len;

    const headX = x - ca * hwTop * 0.55;
    const headY = y - sa * hwTop * 0.55;
    const midX = x + ca * len * 0.46 + nx * bend * 0.55;
    const midY = y + sa * len * 0.46 + ny * bend * 0.55;
    const tipX = x + ca * len + nx * bend;
    const tipY = y + sa * len + ny * bend;

    ctx.beginPath();
    ctx.moveTo(headX, headY);
    // Left belly of sesame/raindrop dab
    ctx.quadraticCurveTo(
      x + ca * len * 0.18 + nx * hwTop,
      y + sa * len * 0.18 + ny * hwTop,
      midX + nx * hwMid,
      midY + ny * hwMid,
    );
    ctx.quadraticCurveTo(
      x + ca * len * 0.78 + nx * (bend * 0.85 + hwMid * 0.35),
      y + sa * len * 0.78 + ny * (bend * 0.85 + hwMid * 0.35),
      tipX,
      tipY,
    );
    // Split dry-brush notch on larger cun dabs (`渴笔分叉尾梢`)
    if (len > 5.8 && rng() < 0.42) {
      ctx.lineTo(
        x + ca * len * 0.82 + nx * (bend * 0.75),
        y + sa * len * 0.82 + ny * (bend * 0.75),
      );
      ctx.lineTo(
        tipX - nx * width * 0.34 - ca * len * 0.08,
        tipY - ny * width * 0.34 - sa * len * 0.08,
      );
    }
    // Right belly back to tucked entry
    ctx.quadraticCurveTo(
      midX - nx * hwMid,
      midY - ny * hwMid,
      x + ca * len * 0.16 - nx * hwTop * 0.92,
      y + sa * len * 0.16 - ny * hwTop * 0.92,
    );
    ctx.closePath();
    ctx.fill();
  }
  return { drawRaindropCunDab };
})();

// src/scenes/s06_qingming.js
mediumTools[6] = (() => {
  const INK_SHADES = {
    jiao: '#282520',
    dan: '#b8aba0',
    nong: '#484137',
    qing: 'rgba(82,79,72,.23)',
  };
  function jiehuaStroke(ctx, x0, y0, x1, y1, width = 1.2, color = INK_SHADES.jiao, alpha = 0.9) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len < 0.4) return;

    const nx = -dy / len;
    const ny = dx / len;
    const seed = (x0 * 17 + y0 * 31 + x1 * 47 + y1 * 13) | 0;
    const segs = Math.max(2, Math.min(7, Math.ceil(len / 28)));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';

    let px = x0;
    let py = y0;
    for (let s = 1; s <= segs; s++) {
      const u = s / segs;
      const h = brushHash(seed + s * 71);
      const jitter = s < segs ? (h - 0.5) * 0.36 : 0;
      const qx = lerp(x0, x1, u) + nx * jitter;
      const qy = lerp(y0, y1, u) + ny * jitter;
      const endPress = s === 1 || s === segs ? 1.16 : 0.88 + 0.24 * h;
      ctx.lineWidth = Math.max(0.45, width * endPress);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(qx, qy);
      ctx.stroke();
      px = qx;
      py = qy;
    }

    // Tiny irregular brush pause ink beads (`藏锋起笔与驻锋收笔墨节`)
    if (width >= 0.9) {
      const r0 = width * 0.62;
      ctx.beginPath();
      ctx.moveTo(x0 - r0, y0);
      ctx.lineTo(x0, y0 - r0 * 0.85);
      ctx.lineTo(x0 + r0, y0 + r0 * 0.15);
      ctx.lineTo(x0, y0 + r0 * 0.85);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x1 - r0 * 0.9, y1);
      ctx.lineTo(x1, y1 - r0 * 0.8);
      ctx.lineTo(x1 + r0 * 0.95, y1);
      ctx.lineTo(x1, y1 + r0 * 0.85);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function brushHash(n) {
    let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    return ((x ^ (x >>> 16)) >>> 0) * 2.3283064365386963e-10;
  }
  return { jiehuaStroke };
})();

// src/scenes/s07_maya.js
mediumTools[7] = (() => {
  const COL = { charcoal: '#312521' };
  function drawQuillRibbon(
    ctx,
    pts,
    {
      wStart = 2.6,
      wEnd = 2.2,
      color = COL.charcoal,
      seed = 1,
      wobble = 0.45,
      poolCorners = true,
      drySplit = false,
    } = {},
  ) {
    if (!pts || pts.length < 2) return;
    const n = pts.length;
    const left = [];
    const right = [];

    for (let i = 0; i < n; i++) {
      const pPrev = pts[Math.max(0, i - 1)];
      const pCurr = pts[i];
      const pNext = pts[Math.min(n - 1, i + 1)];
      let tx = pNext[0] - pPrev[0];
      let ty = pNext[1] - pPrev[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const nx = -ty;
      const ny = tx;

      const u = i / (n - 1);
      // Agave-quill entry dab swell + mid-stroke modulation + slight exit taper
      const entrySwell = i === 0 ? 1.18 : i === n - 1 ? 0.86 : 1.0;
      const pressureWave =
        1 + 0.18 * Math.sin(u * Math.PI * 3.2 + seed * 1.7) + (hash2(i, seed, 41) - 0.5) * 0.22;
      const halfW = Math.max(0.45, lerp(wStart, wEnd, u) * 0.5 * entrySwell * pressureWave);
      const tremor = (hash2(i, seed, 73) - 0.5) * 2 * wobble;

      left.push([pCurr[0] + nx * (halfW + tremor), pCurr[1] + ny * (halfW + tremor)]);
      right.push([pCurr[0] - nx * (halfW - tremor), pCurr[1] - ny * (halfW - tremor)]);
    }

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(left[i][0], left[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    ctx.fill();

    // Subtle ink-pooling bead at sharp Maya calligraphic turns
    if (poolCorners && n >= 3) {
      for (let i = 1; i < n - 1; i++) {
        const ax = pts[i][0] - pts[i - 1][0];
        const ay = pts[i][1] - pts[i - 1][1];
        const bx = pts[i + 1][0] - pts[i][0];
        const by = pts[i + 1][1] - pts[i][1];
        const la = Math.hypot(ax, ay);
        const lb = Math.hypot(bx, by);
        if (la > 1.5 && lb > 1.5) {
          const dot = (ax * bx + ay * by) / (la * lb);
          if (dot < 0.45) {
            const pr = Math.max(1.1, wStart * 0.56);
            const poolPts = buildHandDiscPoints(
              pts[i][0],
              pts[i][1],
              pr,
              pr * 0.9,
              i * 0.7,
              7,
              seed + i,
              0.12,
            );
            ctx.beginPath();
            ctx.moveTo(poolPts[0][0], poolPts[0][1]);
            for (let k = 1; k < poolPts.length; k++) ctx.lineTo(poolPts[k][0], poolPts[k][1]);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    }

    // Optional dry-bristle split scratch exposing lime gesso inside thick border strokes
    if (drySplit && wStart >= 2.8 && n >= 4) {
      ctx.strokeStyle = 'rgba(244, 232, 204, 0.34)';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      const i0 = Math.floor(n * 0.25);
      const i1 = Math.min(n - 1, Math.floor(n * 0.78));
      for (let i = i0; i <= i1; i++) {
        if (i === i0) ctx.moveTo(pts[i][0] + 0.5, pts[i][1] - 0.4);
        else ctx.lineTo(pts[i][0] + 0.5, pts[i][1] - 0.4);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function hash2(ix, iy, seed = 1) {
    let h =
      (Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed, 1442695041)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) * 2.3283064365386963e-10;
  }

  function buildHandDiscPoints(cx, cy, rx, ry = rx, rot = 0, steps = 20, seed = 5, wobble = 0.045) {
    const pts = [];
    const ca = Math.cos(rot);
    const sa = Math.sin(rot);
    for (let i = 0; i <= steps; i++) {
      const idx = i % steps;
      const a = (idx / steps) * Math.PI * 2;
      const rScale = 1 + (hash2(idx, seed, 19) - 0.5) * 2 * wobble;
      const lx = Math.cos(a) * rx * rScale;
      const ly = Math.sin(a) * ry * rScale;
      pts.push([cx + lx * ca - ly * sa, cy + lx * sa + ly * ca]);
    }
    return pts;
  }
  return { drawQuillRibbon };
})();

// src/scenes/s08_mughal.js
mediumTools[8] = (() => {
  const MUG = { qalamSepia: '#47301f' };
  function drawQalamStroke(
    ctx,
    pts,
    {
      wStart = 0.75,
      wMid = 0.92,
      wEnd = 0.55,
      color = MUG.qalamSepia,
      seed = 1,
      wobble = 0.14,
    } = {},
  ) {
    if (!pts || pts.length < 2) return;
    const n = pts.length;
    const left = [];
    const right = [];

    for (let i = 0; i < n; i++) {
      const pPrev = pts[Math.max(0, i - 1)];
      const pCurr = pts[i];
      const pNext = pts[Math.min(n - 1, i + 1)];
      let tx = pNext[0] - pPrev[0];
      let ty = pNext[1] - pPrev[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      const nx = -ty;
      const ny = tx;

      const u = i / (n - 1);
      const wProfile = u < 0.5 ? lerp(wStart, wMid, u * 2) : lerp(wMid, wEnd, (u - 0.5) * 2);
      const halfW = Math.max(0.24, wProfile * 0.5);
      const trem = (hash2(i, seed, 19) - 0.5) * 2 * wobble;
      left.push([pCurr[0] + nx * (halfW + trem), pCurr[1] + ny * (halfW + trem)]);
      right.push([pCurr[0] - nx * (halfW - trem), pCurr[1] - ny * (halfW - trem)]);
    }

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(left[i][0], left[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function paintPardazStipple(ctx, cx, cy, rx, ry, count, color, alpha = 0.24, seed = 1) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(hash2(i, 1, seed));
      const a = hash2(i, 2, seed + 7) * Math.PI * 2;
      const dx = cx + Math.cos(a) * rx * r;
      const dy = cy + Math.sin(a) * ry * r;
      ctx.fillRect(dx - 0.55, dy - 0.55, 1.15, 1.15);
    }
    ctx.restore();
  }

  function hash2(ix, iy, seed = 1) {
    let h =
      (Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed, 1442695041)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) * 2.3283064365386963e-10;
  }
  return { drawQalamStroke, paintPardazStipple };
})();

// src/scenes/s09_bada.js
mediumTools[9] = (() => {
  const INK_SHADES = {
    jiao: '#282520',
    dan: '#b8aba0',
    nong: '#484137',
    qing: 'rgba(82,79,72,.23)',
  };
  function drawSealBrushStroke(
    ctx,
    ctrlPts,
    rng,
    {
      color = INK_SHADES.jiao,
      wStart = 5.2,
      wMid = 4.0,
      wEnd = 1.6,
      dryness = 0.34,
      dryStartU = 0.38,
      bristles = 7,
      alpha = 0.94,
      samplesPerSeg = 10,
      angularity = 0.0,
      rimStain = true,
    } = {},
  ) {
    if (ctrlPts.length < 2) return;
    const dense =
      angularity > 0.5
        ? sampleCatmullRom(ctrlPts, Math.max(4, Math.round(samplesPerSeg * 0.6)))
        : sampleCatmullRom(ctrlPts, samplesPerSeg);
    const n = dense.length;
    if (n < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;

    const ph = rng() * Math.PI * 2;
    const widthAt = (u) => {
      const cadence =
        1 + 0.19 * Math.sin(u * Math.PI * 3.1 + ph) + 0.09 * Math.cos(u * Math.PI * 6.7);
      const base = u < 0.44 ? lerp(wStart, wMid, u / 0.44) : lerp(wMid, wEnd, (u - 0.44) / 0.56);
      return Math.max(0.55, base * cadence);
    };

    // Faint raw-Xuan capillary bleed edge (`生宣水晕微渗`) on wetter entry half
    if (rimStain && dryness < 0.62) {
      ctx.strokeStyle = INK_SHADES.qing;
      for (let i = 0; i < Math.floor((n - 1) * 0.62); i += 2) {
        const u = i / (n - 1);
        if (rng() < dryness * 0.65) continue;
        ctx.globalAlpha = alpha * 0.14 * (1 - u);
        ctx.lineWidth = widthAt(u) * 1.48;
        ctx.beginPath();
        ctx.moveTo(dense[i][0], dense[i][1]);
        ctx.lineTo(dense[Math.min(n - 1, i + 2)][0], dense[Math.min(n - 1, i + 2)][1]);
        ctx.stroke();
      }
      ctx.strokeStyle = color;
    }

    // Core ink belly before brush splits into dry bristles
    for (let i = 0; i < n - 1; i++) {
      const u = i / (n - 1);
      const dryFactor = dryness > 0 && u > dryStartU ? (u - dryStartU) / (1 - dryStartU) : 0;
      if (dryFactor * dryness > 0.28 && rng() < dryFactor * dryness * 1.25) continue;

      ctx.globalAlpha = alpha * (1 - dryFactor * dryness * 0.54);
      ctx.lineWidth = widthAt(u) * (1 - dryFactor * dryness * 0.42);
      ctx.beginPath();
      ctx.moveTo(dense[i][0], dense[i][1]);
      ctx.lineTo(dense[i + 1][0], dense[i + 1][1]);
      ctx.stroke();
    }

    // Multi-bristle flying-white hair tracks (`飞白丝缕`)
    if (dryness > 0.08) {
      for (let b = 0; b < bristles; b++) {
        const lane = b / Math.max(1, bristles - 1) - 0.5 + (rng() - 0.5) * 0.08;
        ctx.lineWidth = Math.max(
          0.55,
          (Math.max(wStart, wMid) / bristles) * (1.22 - dryness * 0.25),
        );
        ctx.globalAlpha = alpha * (0.36 + (1 - Math.abs(lane)) * 0.48);
        ctx.beginPath();
        let down = false;
        for (let i = 0; i < n; i++) {
          const u = i / (n - 1);
          const [px, py] = dense[i];
          const [qx, qy] = dense[Math.min(n - 1, i + 1)];
          const [rx, ry] = dense[Math.max(0, i - 1)];
          const tx = qx - rx;
          const ty = qy - ry;
          const tl = Math.hypot(tx, ty) || 1;
          const nx = -ty / tl;
          const ny = tx / tl;
          const spread = widthAt(u) * (0.88 + dryness * 0.4);
          const jitter = (rng() - 0.5) * 0.75 * dryness;
          const bx = px + nx * (lane * spread + jitter);
          const by = py + ny * (lane * spread + jitter);

          const gapProb = u > dryStartU * 0.65 ? dryness * (0.26 + 0.88 * u) : dryness * 0.14;
          if (i > 0 && rng() < gapProb) {
            down = false;
          } else if (!down) {
            ctx.moveTo(bx, by);
            down = true;
          } else {
            ctx.lineTo(bx, by);
          }
        }
        ctx.stroke();
      }
    }

    // Irregular 藏锋/顿笔 ink knot at entry (built with organic polygon, never geometric circle)
    ctx.globalAlpha = alpha * 0.88;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      const rr = wStart * (0.38 + 0.18 * rng());
      const kx = dense[0][0] + Math.cos(a) * rr;
      const ky = dense[0][1] + Math.sin(a) * rr * 0.84;
      if (k === 0) ctx.moveTo(kx, ky);
      else ctx.lineTo(kx, ky);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function sampleCatmullRom(pts, samplesPerSeg = 10) {
    if (pts.length <= 2) {
      if (pts.length < 2) return pts.slice();
      const out = [];
      for (let i = 0; i <= samplesPerSeg; i++) {
        const u = i / samplesPerSeg;
        out.push([lerp(pts[0][0], pts[1][0], u), lerp(pts[0][1], pts[1][1], u)]);
      }
      return out;
    }

    const out = [];
    const n = pts.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(n - 1, i + 2)];
      const steps = i === n - 2 ? samplesPerSeg : samplesPerSeg - 1;
      for (let s = 0; s <= steps; s++) {
        const t = s / samplesPerSeg;
        const t2 = t * t;
        const t3 = t2 * t;
        const x =
          0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
        const y =
          0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
        out.push([x, y]);
      }
    }
    return out;
  }
  return { drawSealBrushStroke };
})();

// src/scenes/s10_wayang.js
mediumTools[10] = (() => {
  function punchHoleRow(ctx, x0, y0, x1, y1, count, radius, seed = 1) {
    for (let i = 0; i < count; i++) {
      const u = count === 1 ? 0.5 : i / (count - 1);
      const jitter = Math.sin(seed * 7.13 + i * 3.71) * 0.14;
      const r = Math.max(0.8, radius * (1 + jitter));
      const cx = lerp(x0, x1, u);
      const cy = lerp(y0, y1, u);
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + i * 0.3;
        const rr = r * (k % 2 === 0 ? 1.04 : 0.94);
        if (k === 0) ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        else ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  return { punchHoleRow };
})();

// src/scenes/s11_ukiyoe.js
mediumTools[11] = (() => {
  function drawCarvedKeyblockCurve(ctx, pts, wStart, wMid, wEnd, color = '#171512', seed = 1) {
    if (pts.length < 2) return;
    const n = pts.length;
    const left = [];
    const right = [];

    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const baseW =
        u < 0.5
          ? lerp(wStart, wMid, smoothstep(0, 0.5, u))
          : lerp(wMid, wEnd, smoothstep(0.5, 1, u));
      const chatter = 1 + (hash11(i * 3.7 + seed * 19.3) - 0.5) * 0.24;
      const w = Math.max(0.55, baseW * chatter);

      const pPrev = pts[Math.max(0, i - 1)];
      const pNext = pts[Math.min(n - 1, i + 1)];
      let tx = pNext.x - pPrev.x;
      let ty = pNext.y - pPrev.y;
      const len = Math.hypot(tx, ty) || 1;
      tx /= len;
      ty /= len;

      const wob = (hash11(i * 7.1 + seed * 5.9) - 0.5) * Math.min(0.85, baseW * 0.22);
      const nx = -ty * (w * 0.5) + -ty * wob;
      const ny = tx * (w * 0.5) + tx * wob;
      left.push({ x: pts[i].x + nx, y: pts[i].y + ny });
      right.push({ x: pts[i].x - nx, y: pts[i].y - ny });
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    // Angled chisel entry nib (入木)
    ctx.moveTo(left[0].x, left[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(left[i].x, left[i].y);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
    ctx.closePath();
    ctx.fill();
  }

  function withColorPlate(ctx, plateOffset, alpha, fn) {
    ctx.save();
    ctx.translate(plateOffset.dx, plateOffset.dy);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = alpha;
    fn();
    ctx.restore();
  }

  function hash11(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return s - Math.floor(s);
  }
  return { drawCarvedKeyblockCurve, withColorPlate };
})();

// src/scenes/s12_starry.js
mediumTools[12] = (() => {
  const PALETTE_SPEC = [
    { base: '#061229', hi: '#1a3668', lo: '#020610', marl: '#142f5e' }, // 0 PRUSSIAN_DARK
    { base: '#0f2752', hi: '#2b5291', lo: '#051126', marl: '#1e4b8f' }, // 1 PRUSSIAN
    { base: '#1b4285', hi: '#4374c2', lo: '#0b214a', marl: '#2b8a85' }, // 2 ULTRAMARINE
    { base: '#2b65b5', hi: '#649fe8', lo: '#143a70', marl: '#88bff2' }, // 3 COBALT
    { base: '#5092d4', hi: '#8ec4f5', lo: '#285a8f', marl: '#fde452' }, // 4 CERULEAN
    { base: '#2b8a85', hi: '#64c4bd', lo: '#134c49', marl: '#f6e49b' }, // 5 TURQUOISE
    { base: '#a6dbd4', hi: '#e3faf6', lo: '#649e97', marl: '#ffffff' }, // 6 PALE_ICE
    { base: '#f8f5e6', hi: '#ffffff', lo: '#bfb8a2', marl: '#a6dbd4' }, // 7 TITANIUM
    { base: '#f6e49b', hi: '#fff9d9', lo: '#bfa756', marl: '#ffffff' }, // 8 NAPLES_YELLOW
    { base: '#fde452', hi: '#fffbb8', lo: '#c4a516', marl: '#ffffff' }, // 9 LEMON_YELLOW
    { base: '#f5b61e', hi: '#ffe585', lo: '#ad7506', marl: '#eb781e' }, // 10 CHROME_YELLOW
    { base: '#eb781e', hi: '#ffb363', lo: '#994106', marl: '#fde452' }, // 11 CADMIUM_ORANGE
    { base: '#d93f22', hi: '#ff7d5e', lo: '#851908', marl: '#f5b61e' }, // 12 CADMIUM_RED
    { base: '#091b12', hi: '#234533', lo: '#020905', marl: '#693919' }, // 13 CYPRESS_DARK
    { base: '#264421', hi: '#4e7845', lo: '#10210d', marl: '#2b8a85' }, // 14 CYPRESS_OLIVE
    { base: '#693919', hi: '#a36336', lo: '#361a07', marl: '#eb781e' }, // 15 BURNT_UMBER
  ];

  const VARIANTS = 8;
  const CELL_W = 72;
  const CELL_H = 32;
  function getImpastoAtlas(kit) {
    return kit.bake2D(
      's12_impasto_atlas_r3',
      (_g, ctx, rng) => {
        ctx.clearRect(0, 0, CELL_W * VARIANTS, CELL_H * PALETTE_SPEC.length);

        for (let idx = 0; idx < PALETTE_SPEC.length; idx++) {
          const spec = PALETTE_SPEC[idx];
          for (let v = 0; v < VARIANTS; v++) {
            const ox = v * CELL_W;
            const oy = idx * CELL_H;
            const cx = ox + CELL_W * 0.5;
            const cy = oy + CELL_H * 0.5;

            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (v === 1) {
              // Variant 1: Palette-Knife Wedge (sharp straight-scraped top ridge + thick bottom impasto lip!)
              ctx.fillStyle = spec.lo;
              ctx.globalAlpha = 0.88;
              ctx.beginPath();
              ctx.moveTo(cx - 29, cy + 1);
              ctx.lineTo(cx + 26, cy - 3);
              ctx.lineTo(cx + 30, cy + 8.5);
              ctx.lineTo(cx - 25, cy + 10.5);
              ctx.closePath();
              ctx.fill();

              ctx.globalAlpha = 0.99;
              ctx.fillStyle = spec.base;
              ctx.beginPath();
              ctx.moveTo(cx - 30, cy - 4.5);
              ctx.lineTo(cx + 28, cy - 7.5);
              ctx.lineTo(cx + 29, cy + 5.5);
              ctx.quadraticCurveTo(cx, cy + 9.5, cx - 27, cy + 6.5);
              ctx.closePath();
              ctx.fill();

              // Razor-bright palette-knife grazing highlight crest!
              ctx.strokeStyle = spec.hi;
              ctx.lineWidth = 2.8;
              ctx.globalAlpha = 0.9;
              ctx.beginPath();
              ctx.moveTo(cx - 28, cy - 4.0);
              ctx.lineTo(cx + 26, cy - 6.8);
              ctx.stroke();
            } else if (v === 2) {
              // Variant 2: Curved Turbulent Comma Stroke (arched hog-bristle follow-through)
              for (const pass of [
                { dy: 2.4, col: spec.lo, w: 12.5, a: 0.84 },
                { dy: 0, col: spec.base, w: 11.5, a: 0.98 },
                { dy: -2.2, col: spec.hi, w: 3.2, a: 0.72 },
              ]) {
                ctx.strokeStyle = pass.col;
                ctx.lineWidth = pass.w;
                ctx.globalAlpha = pass.a;
                ctx.beginPath();
                ctx.moveTo(cx - 26, cy + 4 + pass.dy);
                ctx.quadraticCurveTo(cx - 2, cy - 9 + pass.dy, cx + 26, cy + 3 + pass.dy);
                ctx.stroke();
              }
            } else if (v === 5) {
              // Variant 5: Asymmetric Flame-Tongue Lick (thick bulbous root -> sharp whipping tip)
              ctx.fillStyle = spec.lo;
              ctx.globalAlpha = 0.85;
              ctx.beginPath();
              ctx.moveTo(cx - 28, cy + 2);
              ctx.quadraticCurveTo(cx - 8, cy - 8, cx + 31, cy + 1.5);
              ctx.quadraticCurveTo(cx - 6, cy + 11, cx - 28, cy + 2);
              ctx.fill();

              ctx.fillStyle = spec.base;
              ctx.globalAlpha = 0.98;
              ctx.beginPath();
              ctx.moveTo(cx - 29, cy - 0.5);
              ctx.quadraticCurveTo(cx - 10, cy - 10.5, cx + 31, cy - 0.5);
              ctx.quadraticCurveTo(cx - 8, cy + 8.5, cx - 29, cy - 0.5);
              ctx.fill();

              ctx.strokeStyle = spec.hi;
              ctx.lineWidth = 2.1;
              ctx.globalAlpha = 0.76;
              ctx.beginPath();
              ctx.moveTo(cx - 24, cy - 2.8);
              ctx.quadraticCurveTo(cx - 6, cy - 6.8, cx + 22, cy - 1.0);
              ctx.stroke();
            } else {
              // Variants 0, 3, 4, 6, 7: Multi-bristle Hog-Hair Ribbons with Dry-Scrape Linen Gaps & Wet-on-Wet Marling!
              const rx = v === 3 ? 17.5 : v === 7 ? 14.5 : 28.5;
              const ry = v === 3 ? 10.8 : v === 7 ? 11.5 : 8.6;
              const dryRate = v === 6 ? 0.36 : v === 0 ? 0.18 : 0.06;

              // Thick cast shadow underneath bristle load
              ctx.fillStyle = spec.lo;
              ctx.globalAlpha = 0.82;
              ctx.beginPath();
              ctx.moveTo(cx - rx + 1, cy + 2.5);
              ctx.quadraticCurveTo(cx, cy - ry * 0.65 + 2.5, cx + rx * 0.9, cy + 2.5);
              ctx.quadraticCurveTo(cx, cy + ry * 1.15 + 2.5, cx - rx + 1, cy + 2.5);
              ctx.fill();

              // Individual hog-bristle tracks with splayed frayed tail & canvas-tooth skips!
              const bristles = 7;
              for (let b = 0; b < bristles; b++) {
                const bf = (b / (bristles - 1)) * 2 - 1; // -1..+1
                const by0 = cy + bf * ry * 0.78;
                const splayEnd =
                  cy + bf * ry * (v === 0 || v === 6 ? 1.12 : 0.72) + (rng() - 0.5) * 2.2;
                const xStart = cx - rx + Math.abs(bf) * 3.2 + (rng() - 0.5) * 2.5;
                const xEnd = cx + rx - rng() * (v === 0 || v === 6 ? 7.5 : 2.5);

                ctx.lineWidth = v === 7 ? 4.2 : 3.0;
                ctx.globalAlpha = 0.96;
                ctx.strokeStyle =
                  v === 4 && (b === 2 || b === 4)
                    ? spec.marl // Wet-on-wet unmixed streak!
                    : bf < -0.35
                      ? spec.hi
                      : bf > 0.45
                        ? spec.lo
                        : spec.base;

                ctx.beginPath();
                const segs = 9;
                let penDown = false;
                for (let s = 0; s <= segs; s++) {
                  const u = s / segs;
                  if (u > 0.55 && rng() < dryRate) {
                    penDown = false;
                    continue;
                  }
                  const sx = lerp(xStart, xEnd, u);
                  const sy = lerp(by0, splayEnd, u) + Math.sin(u * Math.PI) * (-1.2 + bf * 0.6);
                  if (!penDown) {
                    ctx.moveTo(sx, sy);
                    penDown = true;
                  } else {
                    ctx.lineTo(sx, sy);
                  }
                }
                ctx.stroke();
              }

              // Thick butter-ridge impasto catchlight at brush-down head!
              ctx.fillStyle = spec.hi;
              ctx.globalAlpha = v === 7 ? 0.68 : 0.48;
              ctx.beginPath();
              ctx.moveTo(cx - rx * 0.82, cy - ry * 0.45);
              ctx.quadraticCurveTo(cx - rx * 0.1, cy - ry * 0.78, cx + rx * 0.35, cy - ry * 0.32);
              ctx.quadraticCurveTo(cx - rx * 0.2, cy - ry * 0.12, cx - rx * 0.82, cy - ry * 0.45);
              ctx.fill();
            }

            ctx.restore();
          }
        }
      },
      CELL_W * VARIANTS,
      CELL_H * PALETTE_SPEC.length,
    );
  }

  function createDabPainter(ctx, atlas) {
    const img = atlas.canvas;
    const base = ctx.getTransform();

    function dab(colIdx, x, y, angle, len, wid, variant = 0) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const sx = (variant & 7) * CELL_W;
      const sy = colIdx * CELL_H;
      ctx.setTransform(
        base.a * c + base.c * s,
        base.b * c + base.d * s,
        base.a * -s + base.c * c,
        base.b * -s + base.d * c,
        base.a * x + base.c * y + base.e,
        base.b * x + base.d * y + base.f,
      );
      ctx.drawImage(img, sx, sy, CELL_W, CELL_H, -len * 0.5, -wid * 0.5, len, wid);
    }

    function restore() {
      ctx.setTransform(base);
    }

    return { dab, restore };
  }
  return { getImpastoAtlas, createDabPainter };
})();

// src/scenes/s13_scream.js
mediumTools[13] = (() => {
  function drawDryPastelRibbon(ctx, pts, opts = {}) {
    const {
      color = '#d94e28',
      width = 6.5,
      alpha = 0.9,
      waviness = 1.8,
      freq = 0.12,
      phase = 0,
      bristles = 3,
      dryness = 0.24, // 0 = wet casein, 0.45 = chalky dry pastel skipping over cardboard tooth
      crumbs = false,
      taper = true,
    } = opts;
    if (!pts || pts.length < 2) return;

    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineJoin = 'bevel';
    ctx.lineCap = 'butt';

    const seedBase = Math.floor((phase * 97.3 + width * 31.7) * 100) | 0;

    for (let b = 0; b < bristles; b++) {
      const bNorm = bristles === 1 ? 0 : (b / (bristles - 1)) * 2 - 1;
      const bAlpha =
        alpha *
        (bristles === 1 ? 1 : 0.54 + 0.42 * (1 - Math.abs(bNorm))) *
        (0.88 + 0.12 * toothHash(seedBase + b * 17));
      if (bAlpha <= 0.02) continue;

      const baseHalfW =
        Math.max(0.45, (width / Math.pow(bristles, 0.56)) * 0.54) * (1 - 0.22 * Math.abs(bNorm));

      // Build left/right variable-width polygon strip with dry-drag skip breaks
      let leftStrip = [];
      let rightStrip = [];
      let dist = 0;

      const flushSubStrip = () => {
        if (leftStrip.length < 2) {
          leftStrip.length = 0;
          rightStrip.length = 0;
          return;
        }
        ctx.globalAlpha = clamp(bAlpha, 0, 1);
        ctx.beginPath();
        ctx.moveTo(leftStrip[0][0], leftStrip[0][1]);
        for (let k = 1; k < leftStrip.length; k++) {
          ctx.lineTo(leftStrip[k][0], leftStrip[k][1]);
        }
        for (let k = rightStrip.length - 1; k >= 0; k--) {
          ctx.lineTo(rightStrip[k][0], rightStrip[k][1]);
        }
        ctx.closePath();
        ctx.fill();
        leftStrip.length = 0;
        rightStrip.length = 0;
      };

      for (let i = 0; i < pts.length; i++) {
        const [px, py] = pts[i];
        let tx = 1;
        let ty = 0;
        if (i < pts.length - 1) {
          const dx = pts[i + 1][0] - px;
          const dy = pts[i + 1][1] - py;
          const len = Math.hypot(dx, dy) || 1;
          tx = dx / len;
          ty = dy / len;
          if (i > 0) dist += len;
        } else {
          const dx = px - pts[i - 1][0];
          const dy = py - pts[i - 1][1];
          const len = Math.hypot(dx, dy) || 1;
          tx = dx / len;
          ty = dy / len;
          dist += len;
        }
        const nx = -ty;
        const ny = tx;

        const u = i / (pts.length - 1);
        const env = taper ? Math.pow(Math.sin(Math.PI * clamp(u, 0.03, 0.97)), 0.62) : 1;
        const hVal = toothHash(seedBase + b * 131 + i * 37);

        // Dry pastel skips across valleys of the rough wood-pulp cardboard near bristle ends/edges
        const skipThresh = dryness * (0.35 + 0.55 * Math.abs(bNorm) + 0.35 * (1 - env));
        if (dryness > 0.05 && i > 0 && i < pts.length - 1 && hVal < skipThresh * 0.48) {
          flushSubStrip();
          continue;
        }

        const spread = bNorm * width * 0.36 * (0.78 + 0.22 * env);
        const tremor =
          Math.sin(dist * freq + phase + b * 2.05) * waviness * env +
          (hVal - 0.5) * waviness * 0.85;
        const pressureMod = 0.62 + 0.68 * toothHash(seedBase + b * 73 + i * 19);
        const hw = baseHalfW * env * pressureMod;

        const cx = px + nx * (spread + tremor);
        const cy = py + ny * (spread + tremor);
        leftStrip.push([cx - nx * hw, cy - ny * hw]);
        rightStrip.push([cx + nx * hw, cy + ny * hw]);

        // Chalky pastel dust crumbs shed along high-contrast edges
        if (crumbs && (i + b) % 2 === 0 && hVal > 0.52) {
          ctx.globalAlpha = clamp(bAlpha * 0.72, 0, 1);
          const side = hVal > 0.76 ? 1 : -1;
          const cOff = hw + (0.8 + hVal * 2.8);
          const cw = 1.1 + hVal * 2.1;
          const ch = 0.8 + (1 - hVal) * 1.6;
          ctx.fillRect(cx + nx * side * cOff - cw * 0.5, cy + ny * side * cOff - ch * 0.5, cw, ch);
        }
      }
      flushSubStrip();
    }

    ctx.restore();
  }

  function toothHash(n) {
    let x = Math.imul(n | 0, 0x27d4eb2d);
    x = (x ^ (x >>> 15)) >>> 0;
    x = Math.imul(x, 0x85ebca6b) >>> 0;
    return ((x ^ (x >>> 13)) >>> 0) * 2.3283064365386963e-10;
  }
  return { drawDryPastelRibbon };
})();

// src/scenes/s14_nosferatu.js
mediumTools[14] = (() => {
  function orthochromaticSplitToneRGB(lum) {
    const L = clamp(lum, 0, 1);
    if (L < 0.22) {
      const u = L / 0.22;
      return [lerp(9, 44, u), lerp(9, 39, u), lerp(12, 34, u)];
    }
    if (L < 0.64) {
      const u = (L - 0.22) / 0.42;
      return [lerp(44, 186, u), lerp(39, 161, u), lerp(34, 118, u)];
    }
    const u = (L - 0.64) / 0.36;
    return [lerp(186, 244, u), lerp(161, 226, u), lerp(118, 178, u)];
  }
  return { orthochromaticSplitToneRGB };
})();

// src/scenes/s15_oscilloscope.js
mediumTools[15] = (() => {
  function analogNoise(a, b) {
    const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
    return (s - Math.floor(s)) * 2 - 1;
  }
  return { analogNoise };
})();

// src/scenes/s16_8bit.js
mediumTools[16] = (() => {
  function pline(targetFn, x0, y0, x1, y1, c, thick = 1) {
    let ix0 = Math.round(x0);
    let iy0 = Math.round(y0);
    const ix1 = Math.round(x1);
    const iy1 = Math.round(y1);
    const dx = Math.abs(ix1 - ix0);
    const sx = ix0 < ix1 ? 1 : -1;
    const dy = -Math.abs(iy1 - iy0);
    const sy = iy0 < iy1 ? 1 : -1;
    let err = dx + dy;

    for (let guard = 0; guard <= dx - dy; guard++) {
      if (thick <= 1) {
        targetFn(ix0, iy0, c);
      } else if (thick === 2) {
        targetFn(ix0, iy0, c);
        targetFn(ix0 + 1, iy0, c);
        targetFn(ix0, iy0 + 1, c);
        targetFn(ix0 + 1, iy0 + 1, c);
      } else {
        for (let oy = -1; oy <= 1; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            targetFn(ix0 + ox, iy0 + oy, c);
          }
        }
      }
      if (ix0 === ix1 && iy0 === iy1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        ix0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        iy0 += sy;
      }
    }
  }

  function tileHash(a, b) {
    let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) ^ 0x5bf03635;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) % 100;
  }
  return { pline, tileHash };
})();

// src/scenes/s17_chat.js
mediumTools[17] = (() => {
  function snapWebSafe(v, bayerNorm, spread = 46) {
    return Math.max(0, Math.min(5, Math.round((v + bayerNorm * spread) / 51))) * 51;
  }

  function drawBevelBox(
    ctx,
    x,
    y,
    w,
    h,
    {
      fill = '#d4d0c8',
      sunken = false,
      outerLight = '#ffffff',
      innerLight = '#eae8e1',
      innerDark = '#808080',
      outerDark = '#404040',
    } = {},
  ) {
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
    }

    const tlOut = sunken ? innerDark : outerLight;
    const tlIn = sunken ? outerDark : innerLight;
    const brIn = sunken ? innerLight : innerDark;
    const brOut = sunken ? outerLight : outerDark;

    ctx.fillStyle = tlOut;
    ctx.fillRect(x, y, w - 1, 1);
    ctx.fillRect(x, y, 1, h - 1);

    ctx.fillStyle = brOut;
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x + w - 1, y, 1, h);

    ctx.fillStyle = tlIn;
    ctx.fillRect(x + 1, y + 1, w - 3, 1);
    ctx.fillRect(x + 1, y + 1, 1, h - 3);

    ctx.fillStyle = brIn;
    ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
    ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
  }
  return { snapWebSafe, drawBevelBox };
})();

// src/scenes/s18_vaporwave.js
mediumTools[18] = (() => {
  function sampleSkyEarthChromeEnv(ryBase, rxBase = 0, shimmerPhase = 0, specBoost = 0) {
    const ry = clamp(ryBase + Math.sin(shimmerPhase) * 0.042, -1, 1);
    let r, g, b;

    if (ry < -0.52) {
      // Deep zenith dome: Midnight Indigo (#140b42) <- Royal Cobalt (#2155cd)
      const u = clamp((-ry - 0.52) / 0.48, 0, 1);
      r = lerp(33, 20, u);
      g = lerp(85, 11, u);
      b = lerp(205, 66, u);
    } else if (ry < -0.2) {
      // Upper sky band: Royal Cobalt (#2155cd) -> High-Saturation Electric Cyan (#00f5ff)
      const u = clamp((ry + 0.52) / 0.32, 0, 1);
      r = lerp(33, 0, u);
      g = lerp(85, 245, u);
      b = lerp(205, 255, u);
    } else if (ry < -0.07) {
      // Horizon cyan approach: Electric Cyan (#00f5ff) -> Laser White (#ffffff)
      const u = clamp((ry + 0.2) / 0.13, 0, 1);
      r = lerp(0, 255, u * 0.85);
      g = lerp(245, 255, u);
      b = 255;
    } else if (ry < 0.03) {
      // Blazing POV-Ray Horizon Specular Core: Pure Laser White (#ffffff)!
      r = 255;
      g = 255;
      b = 255;
    } else if (ry < 0.14) {
      // Classic 1995 Raytracer Horizon Discontinuity: Dark Indigo Cut (#18083e) -> Hot Neon Magenta (#ff2a9d)!
      const u = clamp((ry - 0.03) / 0.11, 0, 1);
      if (u < 0.45) {
        r = 24;
        g = 8;
        b = 62;
      } else {
        const k = (u - 0.45) / 0.55;
        r = lerp(24, 255, k);
        g = lerp(8, 42, k);
        b = lerp(62, 157, k);
      }
    } else if (ry < 0.48) {
      // Lower sunset reflection: Hot Neon Magenta (#ff2a9d) -> Sunset Amber-Gold (#ffb703)!
      const u = clamp((ry - 0.14) / 0.34, 0, 1);
      r = 255;
      g = lerp(42, 183, u);
      b = lerp(157, 3, u);
    } else {
      // Ventral grid bounce: Sunset Amber-Gold (#ffb703) <-> Hot Magenta (#ff2a9d) / Electric Cyan (#00f5ff)
      const gridWave = 0.5 + 0.5 * Math.sin(rxBase * 6.2 + shimmerPhase * 1.4);
      if (gridWave < 0.55) {
        const k = gridWave / 0.55;
        r = 255;
        g = lerp(183, 42, k);
        b = lerp(3, 157, k);
      } else {
        const k = (gridWave - 0.55) / 0.45;
        r = lerp(255, 0, k * 0.85);
        g = lerp(42, 245, k);
        b = lerp(157, 255, k);
      }
    }

    return `rgb(${clamp(Math.round(r + specBoost), 0, 255)}, ${clamp(Math.round(g + specBoost), 0, 255)}, ${clamp(Math.round(b + specBoost), 0, 255)})`;
  }
  return { sampleSkyEarthChromeEnv };
})();

// src/scenes/s19_shortvideo.js
mediumTools[19] = (() => {
  function evalHermiteSegment(x, x0, x1, y0, y1, m0, m1) {
    const h = x1 - x0;
    const t = clamp((x - x0) / h, 0, 1);
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * y0 +
      (t3 - 2 * t2 + t) * h * m0 +
      (-2 * t3 + 3 * t2) * y1 +
      (t3 - t2) * h * m1
    );
  }
  return { evalHermiteSegment };
})();

// src/scenes/s20_code.js
mediumTools[20] = (() => {
  // Adapted from getPelicanFourierData. The caller supplies the current subject contour.
  function reconstructContour(points) {
    const raw = points.map(([x, y]) => ({ x, y }));
    // Uniform arc-length resampling to M = 256 equidistant contour vertices
    const M = 64;
    const cum = [0];
    for (let i = 0; i < raw.length; i++) {
      const a = raw[i];
      const b = raw[(i + 1) % raw.length];
      cum.push(cum[i] + Math.hypot(b.x - a.x, b.y - a.y));
    }
    const totalLen = cum[cum.length - 1];
    const samples = [];
    let seg = 0;
    for (let m = 0; m < M; m++) {
      const target = (m / M) * totalLen;
      while (seg < raw.length - 1 && cum[seg + 1] < target) seg++;
      const a = raw[seg];
      const b = raw[(seg + 1) % raw.length];
      const span = Math.max(1e-6, cum[seg + 1] - cum[seg]);
      const u = (target - cum[seg]) / span;
      samples.push({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
    }

    // Exact DC centroid c_0 and complex DFT coefficients c_k = (1/M) Σ (z_m - c_0) e^{-i 2π k m / M}
    let c0x = 0;
    let c0y = 0;
    for (let m = 0; m < M; m++) {
      c0x += samples[m].x / M;
      c0y += samples[m].y / M;
    }

    const allTerms = [];
    const K_MAX = 16;
    for (let k = -K_MAX; k <= K_MAX; k++) {
      if (k === 0) continue;
      let re = 0;
      let im = 0;
      for (let m = 0; m < M; m++) {
        const ang = (-2 * Math.PI * k * m) / M;
        const dx = samples[m].x - c0x;
        const dy = samples[m].y - c0y;
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        re += (dx * ca - dy * sa) / M;
        im += (dx * sa + dy * ca) / M;
      }
      const amp = Math.hypot(re, im);
      allTerms.push({ k, re, im, amp, phase: Math.atan2(im, re) });
    }

    // Sort by descending |c_k| so largest epicycle rings sit at the core and fine harmonics at the tip
    allTerms.sort((a, b) => b.amp - a.amp);
    const terms = allTerms.slice(0, 12);

    // Pre-evaluate exact reconstructed closed curve across [0, 2π) for zero-cost trail rendering
    const recon = new Array(64);
    for (let j = 0; j < 64; j++) {
      const th = (j / 64) * Math.PI * 2;
      let rx = c0x;
      let ry = c0y;
      for (let ti = 0; ti < terms.length; ti++) {
        const t = terms[ti];
        const a = t.k * th + t.phase;
        rx += t.amp * Math.cos(a);
        ry += t.amp * Math.sin(a);
      }
      recon[j] = { x: rx, y: ry };
    }

    return recon.map((p) => [p.x, p.y]);
  }
  return { reconstructContour };
})();
