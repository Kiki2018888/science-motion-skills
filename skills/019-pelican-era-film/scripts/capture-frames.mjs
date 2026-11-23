#!/usr/bin/env node
// 用本机已有的 Chrome 对 render.html 调用 renderFrameAt(t)。
// 只启动并关闭自己拉起的浏览器进程。不运行 pnpm install，不调用上游 tools/shot.mjs。
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startPreviewServer } from './preview-server.mjs';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pin = JSON.parse(fs.readFileSync(path.join(skillRoot, 'assets/upstream-pin.json'), 'utf8'));

function arg(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function usage() {
  console.error(`用法:
  node scripts/capture-frames.mjs --project <影片目录> --times 8,74 --out <输出目录>
      [--chrome <chrome 可执行文件>] [--clip-start 73 --clip-seconds 4 --fps 8]
      [--sheet contact.png] [--allow-diverged]

--times 的单位是秒，可重复同一时刻以检查字节是否稳定。
--clip-start 额外导出一段静音 PNG 序列，并在本机有 ffmpeg 时封装 mp4。
默认要求 git HEAD 等于技能 pin。工作区有未提交修改时仍会截帧，并在日志里写明。
--allow-diverged 允许 HEAD 不是 pin。`);
}

function findChrome(explicit) {
  const candidates = [
    explicit,
    process.env.CHROME_BIN,
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate.includes(path.sep) || path.isAbsolute(candidate)) {
      if (fs.existsSync(candidate)) return candidate;
      continue;
    }
    if (!/^[A-Za-z0-9._-]+$/.test(candidate)) continue;
    try {
      const found = execFileSync('bash', ['-lc', `command -v ${candidate}`], { encoding: 'utf8' }).trim();
      if (found) return found;
    } catch {
      // 下一个候选。
    }
  }
  return '';
}

function git(project, args) {
  try {
    return execFileSync('git', ['-C', project, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJson(port, pathname) {
  return new Promise((resolve, reject) => {
    const request = fetch(`http://127.0.0.1:${port}${pathname}`);
    request.then(async (response) => {
      if (!response.ok) {
        reject(new Error(`${pathname} -> HTTP ${response.status}`));
        return;
      }
      resolve(await response.json());
    }, reject);
  });
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 0;
    this.pending = new Map();
    this.errors = [];
    ws.addEventListener('message', (event) => {
      const text = typeof event.data === 'string' ? event.data : Buffer.from(event.data).toString('utf8');
      const message = JSON.parse(text);
      if (message.id && this.pending.has(message.id)) {
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        if (message.error) pending.reject(new Error(`${message.error.message || 'CDP error'}`));
        else pending.resolve(message.result || {});
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') {
        const details = message.params?.exceptionDetails;
        const textError = details?.exception?.description || details?.text || 'exception';
        this.errors.push(textError);
      } else if (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error') {
        const textError = (message.params.args || []).map((item) => item.value || item.description || '').join(' ');
        if (textError) this.errors.push(textError);
      }
    });
  }

  send(method, params = {}, timeoutMs = 120000) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP 超时: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

function openSocket(url) {
  const ws = new WebSocket(url);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`调试套接字超时: ${url}`)), 15000);
    ws.addEventListener('open', () => {
      clearTimeout(timer);
      resolve(ws);
    });
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error(`无法连接调试套接字: ${url}`));
    });
  });
}

async function launchChrome(chromeBin) {
  const userData = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pelican-chrome-'));
  const stderrChunks = [];
  const child = spawn(chromeBin, [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--hide-scrollbars',
    '--mute-audio',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--remote-allow-origins=*',
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=0',
    `--user-data-dir=${userData}`,
    '--window-size=1920,1080',
    'about:blank',
  ], { detached: true, stdio: ['ignore', 'ignore', 'pipe'] });
  child.stderr.on('data', (chunk) => {
    stderrChunks.push(chunk);
    if (stderrChunks.length > 40) stderrChunks.shift();
  });

  const kill = () => {
    try { process.kill(-child.pid, 'SIGKILL'); } catch { /* 进程组可能已退出 */ }
    try { child.kill('SIGKILL'); } catch { /* 已退出 */ }
  };

  const portFile = path.join(userData, 'DevToolsActivePort');
  const started = Date.now();
  let port = 0;
  while (Date.now() - started < 20000) {
    if (child.exitCode != null) {
      kill();
      throw new Error(`Chrome 提前退出 ${child.exitCode}: ${Buffer.concat(stderrChunks).toString('utf8').slice(-2000)}`);
    }
    if (fs.existsSync(portFile)) {
      port = Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]);
      if (port > 0) break;
    }
    await sleep(100);
  }
  if (!port) {
    kill();
    throw new Error('Chrome 没有写下 DevToolsActivePort。');
  }
  return { port, userData, kill };
}

async function captureOne(page, seconds) {
  const evaluated = await page.send('Runtime.evaluate', {
    expression: `window.captureFrameAt(${Number(seconds)})`,
    awaitPromise: true,
    returnByValue: true,
  }, 180000);
  if (evaluated.exceptionDetails) {
    const details = evaluated.exceptionDetails;
    throw new Error(details.exception?.description || details.text || 'captureFrameAt 失败');
  }
  const value = evaluated.result?.value;
  if (typeof value !== 'string' || value.length < 32) {
    throw new Error(`captureFrameAt 没有返回 PNG 数据（t=${seconds}）`);
  }
  return Buffer.from(value, 'base64');
}

function runFfmpeg(args) {
  execFileSync('ffmpeg', ['-y', ...args], { stdio: 'inherit' });
}

const project = arg('--project');
const outDir = arg('--out');
const timesArg = arg('--times', '');
if (!project || !outDir || hasFlag('-h') || hasFlag('--help')) {
  usage();
  process.exit(project && outDir ? 0 : 2);
}

const projectAbs = path.resolve(project);
const outAbs = path.resolve(outDir);
const head = git(projectAbs, ['rev-parse', 'HEAD']);
const dirty = git(projectAbs, ['status', '--porcelain']) || '';
if (!head) {
  console.error('目标目录不是 git 检出，无法核对固定提交。');
  process.exit(2);
}
if (head !== pin.commit && !hasFlag('--allow-diverged')) {
  console.error(`HEAD ${head} 不是技能 pin ${pin.commit}。`);
  console.error('这不是固定版本。若确实要截修改过提交的树，加上 --allow-diverged。');
  process.exit(2);
}
if (dirty) {
  console.log(`[capture] 工作区有未提交修改（${dirty.split('\n').filter(Boolean).length} 条）。截帧反映的是磁盘上的文件。`);
} else {
  console.log('[capture] 工作区干净。');
}
console.log(`[capture] HEAD ${head}`);

const times = timesArg.split(',').map((item) => Number(item.trim())).filter((item) => Number.isFinite(item));
const clipStart = arg('--clip-start');
const clipSeconds = Number(arg('--clip-seconds', '0'));
const fps = Number(arg('--fps', '8'));
if (clipStart != null) {
  if (!Number.isFinite(clipSeconds) || clipSeconds <= 0 || clipSeconds > 8) {
    console.error('--clip-seconds 需要大于 0 且不超过 8。全片导出不在这个脚本里。');
    process.exit(2);
  }
  if (!Number.isFinite(fps) || fps < 1 || fps > 30) {
    console.error('--fps 需要在 1 到 30。');
    process.exit(2);
  }
  const count = Math.round(clipSeconds * fps);
  for (let index = 0; index < count; index += 1) times.push(Number(clipStart) + index / fps);
}
if (times.length === 0) {
  console.error('至少给出 --times 或 --clip-start。');
  process.exit(2);
}
if (times.some((time) => time < 0 || time > 137)) {
  console.error('时间必须在 0 到 137 秒。');
  process.exit(2);
}

const chromeBin = findChrome(arg('--chrome'));
if (!chromeBin) {
  console.error('找不到 Chrome/Chromium。设置 CHROME_BIN 或传入 --chrome。脚本不会下载浏览器。');
  process.exit(2);
}

fs.mkdirSync(outAbs, { recursive: true });
const preview = await startPreviewServer(projectAbs, '127.0.0.1', 0);
let chrome;
const stillPaths = [];
try {
  console.log(`[capture] chrome ${chromeBin}`);
  console.log(`[capture] preview ${preview.baseUrl}/render.html`);
  chrome = await launchChrome(chromeBin);
  const version = await getJson(chrome.port, '/json/version');
  const browserWs = await openSocket(version.webSocketDebuggerUrl);
  const browser = new Cdp(browserWs);
  const created = await browser.send('Target.createTarget', {
    url: `${preview.baseUrl}/render.html`,
  });
  const targets = await getJson(chrome.port, '/json/list');
  const pageInfo = targets.find((item) => item.id === created.targetId);
  if (!pageInfo?.webSocketDebuggerUrl) throw new Error('没有拿到页面调试地址。');
  const pageWs = await openSocket(pageInfo.webSocketDebuggerUrl);
  const page = new Cdp(pageWs);
  await page.send('Runtime.enable');
  await page.send('Page.enable');
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const readyStart = Date.now();
  let ready = false;
  while (Date.now() - readyStart < 45000) {
    const probed = await page.send('Runtime.evaluate', {
      expression: 'window.__PELICAN_READY__ === true',
      returnByValue: true,
    }, 10000);
    if (probed.result?.value === true) {
      ready = true;
      break;
    }
    await sleep(250);
  }
  if (!ready) {
    throw new Error(`渲染宿主未就绪。页面错误: ${page.errors.join(' | ') || '无'}`);
  }

  let clipIndex = 0;
  const clipDir = path.join(outAbs, 'clip-frames');
  if (clipStart != null) fs.mkdirSync(clipDir, { recursive: true });
  const clipCount = clipStart != null ? Math.round(clipSeconds * fps) : 0;
  const stillCount = times.length - clipCount;

  for (let index = 0; index < times.length; index += 1) {
    const time = times[index];
    const started = Date.now();
    const png = await captureOne(page, time);
    const elapsed = Date.now() - started;
    const isClip = index >= stillCount;
    const file = isClip
      ? path.join(clipDir, `frame_${String(clipIndex + 1).padStart(3, '0')}.png`)
      : path.join(outAbs, `t_${time.toFixed(2).replace('.', '_')}s_${index}.png`);
    if (isClip) clipIndex += 1;
    else stillPaths.push(file);
    fs.writeFileSync(file, png);
    console.log(`[capture] t=${time.toFixed(3)} ${png.length} bytes ${elapsed} ms -> ${file}`);
    if (page.errors.length) {
      console.error(`[capture] 页面错误: ${page.errors.join(' | ')}`);
      process.exitCode = 1;
    }
  }

  const sheet = arg('--sheet');
  if (sheet) {
    if (stillPaths.length < 2) throw new Error('--sheet 需要至少两张静帧。');
    const sheetPath = path.resolve(outAbs, sheet);
    const inputs = stillPaths.flatMap((file) => ['-i', file]);
    const scaled = stillPaths.map((_, index) => `[${index}]scale=640:360,setsar=1[s${index}]`).join(';');
    const rowA = stillPaths.length >= 3
      ? '[s0][s1][s2]hstack=inputs=3[r0]'
      : `[s0][s1]hstack=inputs=2[r0]`;
    let filter = `${scaled};${rowA}`;
    if (stillPaths.length >= 6) {
      filter += ';[s3][s4][s5]hstack=inputs=3[r1];[r0][r1]vstack=inputs=2[out]';
    } else {
      filter += ';[r0]copy[out]';
    }
    runFfmpeg([...inputs, '-filter_complex', filter, '-map', '[out]', '-frames:v', '1', '-update', '1', sheetPath]);
    console.log(`[capture] sheet ${sheetPath}`);
  }

  if (clipStart != null) {
    const mp4 = path.join(outAbs, 'clip.mp4');
    runFfmpeg([
      '-framerate', String(fps),
      '-i', path.join(clipDir, 'frame_%03d.png'),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', '18',
      '-movflags', '+faststart',
      mp4,
    ]);
    const stat = fs.statSync(mp4);
    console.log(`[capture] clip ${mp4} ${stat.size} bytes（无音轨）`);
  }
} finally {
  if (chrome) chrome.kill();
  await preview.close();
}

if (process.exitCode) {
  console.error('[capture] 完成，但页面报告过错误。');
  process.exit(process.exitCode);
}
console.log('[capture] 完成。');
