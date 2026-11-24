// 动作脚本：系在左岸的折纸船松绳，横穿石桥的桥洞，最后漂到右岸。全长九秒。
const scene = {
  title: '松绳，纸船过桥',
  width: 960,
  height: 540,
  duration: 9,
  draw(p, t) {
    const water = 386;
    const x = p.key(t, [
      [0, 155],
      [1.65, 155],
      [3.8, 361],
      [6.4, 633, 'linear'],
      [9, 818],
    ]);
    const sway = Math.sin(t * 2.4) * 2;
    const boatY = water - 9 + sway,
      angle = Math.sin(t * 2.15) * 0.025;
    const tip = [
      x - 59 * Math.cos(angle) - 4 * Math.sin(angle),
      boatY - 59 * Math.sin(angle) + 4 * Math.cos(angle),
    ];
    const noEdge = { stroke: null },
      stone = { edge: 'rigid', width: 2 };
    // Hills, water, and the far bank establish an unobstructed path to the bridge.
    p.ellipse(724, 104, 35, 35, 'accent', { width: 1 });
    p.path(
      'M0 253 Q91 225 144 183 Q167 165 196 191 Q228 218 272 207 Q318 191 365 156 Q391 134 417 161 Q503 243 601 205 Q649 185 687 160 Q730 126 778 165 Q844 220 960 173 L960 333 L0 333 Z',
      'muted',
      noEdge,
    );
    p.path(
      'M0 284 Q83 269 163 288 Q258 309 359 275 Q425 250 510 272 Q624 298 720 254 Q806 225 960 245 L960 344 L0 344 Z',
      'secondary',
      { width: 1 },
    );
    p.path('M0 323 Q189 309 375 323 Q534 333 726 311 Q844 297 960 309 L960 540 L0 540 Z', 'muted', {
      width: 1,
    });
    for (let j = 0; j < 21; j++) {
      const xx = (j * 89 + 14) % 950,
        yy = 340 + ((j * 31) % 160),
        len = 12 + ((j * 7) % 45),
        drift = Math.sin(t * 0.8 + j) * 3;
      p.strokePath(
        'M' + (xx + drift) + ' ' + yy + ' q' + len * 0.5 + ' 3 ' + len + ' 0',
        'light',
        1.4,
        { seed: 31 + j },
      );
    }
    // The mooring cord is attached to the left bow until 1.65 s, then its free end drops.
    const release = 1.65,
      blend = p.key(t, [
        [0, 0],
        [release, 0],
        [2.3, 1],
      ]);
    const atRelease = [
      155 -
        59 * Math.cos(Math.sin(release * 2.15) * 0.025) -
        4 * Math.sin(Math.sin(release * 2.15) * 0.025),
      water -
        9 +
        Math.sin(release * 2.4) * 2 -
        59 * Math.sin(Math.sin(release * 2.15) * 0.025) +
        4 * Math.cos(Math.sin(release * 2.15) * 0.025),
    ];
    const cord =
      t <= release
        ? tip
        : [
            atRelease[0] + (76 - atRelease[0]) * blend,
            atRelease[1] + (water + 9 - atRelease[1]) * blend,
          ];
    p.strokePath('M64 353 Q73 384 ' + cord[0] + ' ' + cord[1], 'ink', 2.6);
    p.anchor('绳端', ...cord);
    // A single cut-paper hull, with a visible central fold and two different planes.
    p.group({ x, y: boatY, rotate: angle }, () => {
      p.shape(
        [
          [-64, -6],
          [-26, -16],
          [0, -48],
          [22, -17],
          [68, -7],
          [44, 12],
          [-39, 14],
        ],
        'light',
        { feature: true, width: 2.8 },
      );
      p.shape(
        [
          [-64, -6],
          [-3, 2],
          [68, -7],
          [43, 13],
          [-39, 15],
        ],
        'accent',
        { width: 2 },
      );
      p.shape(
        [
          [-26, -16],
          [0, -48],
          [4, -8],
          [-3, 2],
        ],
        'secondary',
        { width: 1.6 },
      );
      p.line(
        [
          [4, -8],
          [22, -17],
          [65, -7],
        ],
        'ink',
        1.4,
        { edge: 'rigid' },
      );
      p.line(
        [
          [-59, 4],
          [-42, 11],
        ],
        'ink',
        1.4,
      );
      p.anchor('船头系绳点', -59, 4);
      p.anchor('focus', 0, -12);
    });
    // Draw the continuous top and the arch intrados after the boat. The opening below the arch is transparent.
    p.path(
      'M338 308 Q359 286 390 270 Q466 222 550 232 Q607 237 664 279 L678 350 L645 364 Q627 350 620 333 Q611 309 589 299 Q542 272 491 281 Q438 285 414 314 Q395 337 392 369 L344 376 Z',
      'body',
      { ...stone, feature: true },
    );
    p.strokePath('M345 305 Q460 204 576 239 Q630 253 663 277', 'light', 4.1, { edge: 'rigid' });
    p.strokePath('M381 366 Q387 310 430 284 Q498 246 573 270 Q627 285 637 341', 'ink', 2.3);
    for (const [ax, ay, bx, by] of [
      [390, 299, 397, 310],
      [409, 284, 418, 297],
      [437, 267, 442, 282],
      [470, 254, 473, 271],
      [506, 251, 506, 266],
      [544, 254, 541, 270],
      [575, 260, 568, 276],
      [600, 272, 590, 287],
      [625, 288, 611, 301],
    ])
      p.line(
        [
          [ax, ay],
          [bx, by],
        ],
        'ink',
        1.25,
        { edge: 'rigid' },
      );
    for (let j = 0; j < 8; j++) {
      const px = 348 + j * 43,
        py = 303 - 64 * Math.sin((j * Math.PI) / 7) - j * 2.9;
      p.line(
        [
          [px, py],
          [px - 1, py - 18],
        ],
        'ink',
        3,
        { edge: 'rigid' },
      );
    }
    p.strokePath('M347 285 Q461 185 578 223 Q633 241 650 254', 'ink', 2.1);
    p.path('M0 345 Q28 334 59 346 L89 373 L67 385 L0 389 Z', 'body', stone);
    p.rect(58, 329, 9, 47, 'secondary', stone);
    p.ellipse(62.5, 329, 5.2, 2.4, 'light', { width: 1 });
    // Sparing reeds in the near bank supply scale without obscuring the boat.
    for (const [base, yy, dir] of [
      [905, 469, 1],
      [922, 471, -1],
      [54, 491, -1],
      [72, 495, 1],
    ]) {
      const bend = dir * (10 + Math.sin(t + 0.3 * base) * 2);
      p.strokePath(
        'M' + base + ' ' + yy + ' q' + bend + ' -37 ' + (bend + 7) + ' -69',
        'secondary',
        2.3,
      );
      p.group({ x: base + bend + 7, y: yy - 70, rotate: dir * 0.16 }, () =>
        p.ellipse(0, 0, 2.6, 10, 'body', { width: 1 }),
      );
    }
  },
};
