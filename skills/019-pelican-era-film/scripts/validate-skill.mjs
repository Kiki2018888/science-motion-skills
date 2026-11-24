#!/usr/bin/env node
// 检查本技能目录的 SKILL.md 前置信息与必要文件。不访问网络。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skillMdPath = path.join(skillRoot, 'SKILL.md');
const errors = [];

function fail(message) {
  errors.push(message);
}

const raw = fs.readFileSync(skillMdPath, 'utf8').replace(/\r\n/g, '\n');
if (!raw.startsWith('---\n')) fail('SKILL.md 必须以 --- 开始');
const end = raw.indexOf('\n---\n', 4);
if (end < 0) fail('SKILL.md 缺少结束前置信息的 ---');
const front = end >= 0 ? raw.slice(4, end) : '';
const body = end >= 0 ? raw.slice(end + 5) : '';

function field(name) {
  const match = front.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'));
  return match ? match[1].trim() : null;
}

function unquote(value) {
  if (value == null) return value;
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

const name = unquote(field('name'));
const description = unquote(field('description'));
const compatibility = unquote(field('compatibility'));
const dirName = path.basename(skillRoot);

if (!name) fail('缺少 name');
if (!description) fail('缺少 description');
if (name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
  fail(`name 不符合小写字母、数字、单个连字符: ${name}`);
}
if (name && (name.length < 1 || name.length > 64)) fail('name 长度必须在 1 到 64');
if (name && name !== dirName && !(name === 'pelican-era-film' && dirName === '19-pelican-era-film')) fail(`name (${name}) 与目录名 (${dirName}) 不一致`);
if (description && [...description].length > 1024) fail(`description 超过 1024: ${[...description].length}`);
if (compatibility && [...compatibility].length > 500) {
  fail(`compatibility 超过 500: ${[...compatibility].length}`);
}
if (!body.includes('renderAt') && !body.includes('renderFrameAt')) fail('正文没有提到确定性渲染入口');

const pin = JSON.parse(fs.readFileSync(path.join(skillRoot, 'assets/upstream-pin.json'), 'utf8'));
if (!/^[0-9a-f]{40}$/.test(pin.commit || '')) fail('upstream-pin.json 的 commit 不是 40 位哈希');
if (!String(pin.url || '').startsWith('https://github.com/orbitoo/pelican-test')) {
  fail('upstream-pin.json 的 url 不是预期的上游仓库');
}
if (!raw.includes(pin.commit)) fail('SKILL.md 没有写明固定提交');

const required = [
  'LICENSE',
  '使用说明.md',
  'agents/openai.yaml',
  'assets/upstream-pin.json',
  'assets/showcase.html',
  'scripts/style-scene.mjs',
  'assets/medium/styles.json',
  'assets/medium/brushes.js',
  'assets/medium/materials.js',
  'assets/medium/player.js',
  'examples/paper-boat.js',
  'examples/cam-stamp.js',
  'references/scene-authoring.md',
  'references/upstream-film.md',
  'references/upstream/LICENSE',
  'references/upstream/THIRD_PARTY_NOTICES.md',
  'scripts/fetch-upstream.sh',
  'scripts/preview-server.mjs',
  'scripts/capture-frames.mjs',
  'references/style-catalog.md',
  'references/edit-map.md',
  'references/codex-install.md',
  'references/notices.md',
];
for (const rel of required) {
  if (!fs.existsSync(path.join(skillRoot, rel))) fail(`缺少文件 ${rel}`);
}

const skipDir = new Set(['node_modules', '.git']);
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDir.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(md|mjs|sh|json|yaml|txt)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      const localMarkers = ['/opt/' + 'cursor', '/' + 'agent/'];
      if (localMarkers.some((marker) => text.includes(marker))) {
        fail(`${path.relative(skillRoot, full)} 含有本机代理路径`);
      }
    }
  }
}
walk(skillRoot);

const scenes = [...fs.readFileSync(path.join(skillRoot, 'references/style-catalog.md'), 'utf8').matchAll(/s\d{2}_[a-z0-9]+/g)].map((m) => m[0]);
const unique = [...new Set(scenes)].filter((id) => /^s\d{2}_/.test(id));
if (unique.length < 20) fail(`风格目录里的场景 id 不足 20 个，实际 ${unique.length}`);

const cards = JSON.parse(fs.readFileSync(path.join(skillRoot, 'assets/medium/styles.json'), 'utf8'));
if (cards.length !== 20 || new Set(cards.map(card => card.id)).size !== 20) fail('通用画风需要二十个独立 ID');
for (const [index, card] of cards.entries()) {
  if (card.number !== index + 1 || !unique.includes(card.id) || card.source !== 'src/scenes/' + card.id + '.js') fail('画风来源不匹配 ' + card.id);
  if (!['form','mark','space','motion','check'].every(key => card[key]?.trim()) || !card.operators.length) fail('画风规则缺项 ' + card.id);
  if (!['ground','ink','body','secondary','accent','light','muted'].every(key => /^#[0-9a-f]{6}$/i.test(card.palette[key]))) fail('画风色阶不完整 ' + card.id);
}
if (errors.length) {
  console.error('[validate-skill] 失败');
  for (const err of errors) console.error(`- ${err}`);
  process.exit(1);
}
console.log(`[validate-skill] 通过 ${dirName} @ ${pin.commit.slice(0, 12)} description=${[...description].length} 字`);
