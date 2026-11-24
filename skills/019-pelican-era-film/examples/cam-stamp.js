// 动作脚本：摇柄转一圈，偏心轮把滑杆顶高，印头碰到上面的纸面，再降回起点。竖幅七秒半。
const scene = {
  title: '偏心轮顶起印章',
  width: 480,
  height: 640,
  duration: 7.5,
  draw(p, t) {
    const turn = p.key(t, [
        [0, 0],
        [1, 0],
        [6.5, 1],
        [7.5, 1],
      ]),
      ang = turn * Math.PI * 2;
    const cx = 240,
      axleY = 460,
      offset = 36,
      r = 58,
      camY = axleY + offset * Math.cos(ang);
    const diskX = cx + offset * Math.sin(ang),
      foot = camY - r,
      head = foot - 124,
      paperY = axleY - offset - r - 124;
    const rigid = { edge: 'rigid', width: 2 };
    p.path('M50 106 L430 106 L430 138 L406 148 L74 148 L50 138 Z', 'body', {
      ...rigid,
      feature: true,
    });
    p.rect(71, 148, 15, 389, 'secondary', rigid);
    p.rect(394, 148, 15, 389, 'secondary', rigid);
    p.rect(112, paperY - 8, 256, 8, 'light', rigid);
    p.rect(187, 276, 106, 40, 'secondary', rigid);
    p.rect(204, 281, 72, 30, 'muted', { width: 1 });
    p.rect(cx - 9, head + 22, 18, foot - head - 22, 'light', rigid);
    p.shape(
      [
        [cx - 43, head],
        [cx + 43, head],
        [cx + 43, head + 12],
        [cx + 19, head + 25],
        [cx - 19, head + 25],
        [cx - 43, head + 12],
      ],
      'accent',
      { ...rigid, feature: true },
    );
    p.rect(cx - 52, foot - 8, 104, 8, 'body', rigid);
    p.anchor('印面', cx, head);
    p.anchor('纸面', cx, paperY);
    p.ellipse(diskX, camY, r, r, 'secondary', { feature: true, width: 2.8 });
    p.ellipse(diskX, camY, r - 10, r - 10, 'body', { width: 1.4 });
    p.anchor('轮顶', diskX, foot);
    p.anchor('滑脚接触', diskX, foot);
    p.group({ x: cx, y: axleY, rotate: -ang }, () => {
      p.line(
        [
          [0, 0],
          [0, 45],
        ],
        'ink',
        9,
        { edge: 'rigid' },
      );
      p.ellipse(0, 45, 8, 8, 'accent', { width: 2 });
    });
    p.ellipse(cx, axleY, 9, 9, 'light', { width: 2 });
    p.rect(51, 538, 378, 23, 'body', rigid);
    p.line(
      [
        [38, 563],
        [442, 563],
      ],
      'ink',
      2,
    );
    for (const x of [78, 401])
      for (const y of [124, 550]) p.ellipse(x, y, 4, 4, 'light', { width: 1.6 });
    p.anchor('focus', cx, head);
  },
};
