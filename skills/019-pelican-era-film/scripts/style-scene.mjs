#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const cards = JSON.parse(read('assets/medium/styles.json'));
const args = process.argv.slice(2),
  command = args.shift();
const normalize = (s) =>
  String(s)
    .trim()
    .toLowerCase()
    .replace(/[\s_·-]/g, '');
function choose(name) {
  const key = normalize(name).replace(/(?:的)?(?:画风|风格|风)$/, '');
  const card = cards.find((c) =>
    [c.id, c.number, String(c.number).padStart(2, '0'), c.name, ...c.aliases].some(
      (v) => normalize(v) === key,
    ),
  );
  if (!card) throw new Error('找不到画风「' + name + '」。用 list 查看名称或编号。');
  return card;
}
const help = `用法
  node scripts/style-scene.mjs list
  node scripts/style-scene.mjs rules 唐代白描
  node scripts/style-scene.mjs build --scene 动作.js --style 唐代白描 [--style 爪哇皮影] --out 预览.html
  --style all 会将二十种画法全部加入同一张展示页。`;
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const script = (s) => s.replace(/<\/script/gi, '<\\/script');
function build() {
  let input, output;
  const chosen = [];
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i],
      value = args[i + 1];
    if (!value || value.startsWith('--')) throw new Error('缺少 ' + flag + ' 的值');
    if (flag === '--scene') input = value;
    else if (flag === '--out') output = value;
    else if (flag === '--style') chosen.push(...(value === 'all' ? cards : [choose(value)]));
    else throw new Error('未知参数 ' + flag);
  }
  if (!input || !output || !chosen.length) throw new Error(help);
  if (path.resolve(input) === path.resolve(output)) throw new Error('源文件和输出路径重复');
  const styles = [...new Map(chosen.map((c) => [c.id, c])).values()];
  const scene = fs.readFileSync(input, 'utf8').replace(/^\uFEFF/, '');
  new Script(scene, { filename: input });
  const source = ['materials', 'brushes', 'player']
    .map((s) => read('assets/medium/' + s + '.js'))
    .join('\n');
  const pin = JSON.parse(read('assets/upstream-pin.json')).commit;
  const body =
    source +
    '\nconst authoredScene=(()=>{\n' +
    scene +
    '\nreturn scene;\n})();\nstartScene(authoredScene,' +
    JSON.stringify(styles) +
    ');';
  const notes = [
    'references/upstream/LICENSE',
    'LICENSE',
    'references/upstream/THIRD_PARTY_NOTICES.md',
  ]
    .map((f) => escape(read(f)))
    .join('\n\n');
  const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>动作画风预览</title>
<style>*{box-sizing:border-box}html{color-scheme:dark;font:15px system-ui,sans-serif;background:#141615;color:#f4f1e9}body{margin:0;display:grid;grid-template-rows:minmax(0,1fr) auto;height:100vh;height:100dvh}main{min-height:0;display:grid;place-items:center;padding:6px}canvas{display:block;width:100%;height:100%;object-fit:contain}footer{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 14px;background:#20231f}h1{font-size:15px;margin:0 auto 0 0}button,select{background:#343932;color:inherit;border:1px solid #60665b;padding:6px 10px;border-radius:4px;font:inherit}input{flex:1;min-width:70px;accent-color:#d7c495}output{font-variant-numeric:tabular-nums;font-size:13px}details{font-size:12px}summary{cursor:pointer}article{position:fixed;z-index:2;right:1em;bottom:4.5em;background:#252922;padding:1em;border:1px solid #686c60;max-height:65vh;width:min(520px,92vw);overflow:auto}pre{white-space:pre-wrap}a{color:#cddac0}</style>
<main><canvas aria-label="动画主画面"></canvas></main><footer><h1></h1><label>画风 <select></select></label><button id="play">播放</button><input type="range" min="0" step=".001" value="0" aria-label="时间轴"><output></output><button id="full">全屏</button><details><summary>署名</summary><article>画材源自 Elbert 的 <a href="https://github.com/orbitoo/pelican-test/tree/${pin}">Pelican Test</a>。通用画风适配与播放器由 Science Motion Skills 制作。<pre>${notes}</pre></article></details></footer>
<script>'use strict';try{${script(body)}}catch(e){document.querySelector('h1').textContent='绘制失败 · '+e.message;throw e;}</script></html>`;
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, html);
  console.log(output + ' · ' + styles.map((c) => c.name).join(' / '));
}
try {
  if (command === 'list')
    cards.forEach((c) =>
      console.log(String(c.number).padStart(2, '0') + '  ' + c.name + '  ' + c.id),
    );
  else if (command === 'rules') {
    const c = choose(args.join(' '));
    console.log(
      [
        c.name + ' · ' + c.id,
        '造型  ' + c.form,
        '画材  ' + c.mark,
        '空间  ' + c.space,
        '运动  ' + c.motion,
        '验收  ' + c.check,
        '原作  ' + c.source + '  ' + c.operators.join(', '),
      ].join('\n'),
    );
  } else if (command === 'build') build();
  else if (command === '--help' || command === '-h') console.log(help);
  else throw new Error(help);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
