#!/usr/bin/env node
/* Realms film renderer: drives comp/index.html in headless Chromium frame by frame.
 *
 *   node engine/render.mjs --out out/film.mp4 [--from s --to s] [--scene id] [--workers 3]
 *   node engine/render.mjs --stills 1.5,3,7.25 --outdir .work/stills [--scene id]
 *   node engine/render.mjs --contact .work/sheets --every 0.5 [--scene id] [--cols 6] [--width 320]
 *   node engine/render.mjs --serve 8090     (static server for previews in a desktop browser)
 *
 * Common options:
 *   --manifest scenes/manifest.demo.js   manifest to load (path relative to comp/)
 *   --scene id        render one scene alone (its local time becomes the master time)
 *   --fps 30          frame rate (also passed to the page as ctx.fps)
 *   --workers N       parallel browser workers (default 3)
 *   --scale 0.5       quick low-res drafts: the frame is captured downscaled (output = 1920*scale)
 *   --guides          overlay title/action-safe guides (previews only)
 *   --params 'a=1&b=2' extra URL params for the page
 *   --capture cdp|playwright   screenshot path (default cdp: Page.captureScreenshot, lossless PNG)
 * Video options:
 *   --crf 14  --preset slow  --tune animation|film|none (default none)  --gop 30
 *   --hashes file.txt   also write the sha256 of every frame PNG (determinism checks)
 *   --encode none       capture only, discard frames (benchmark the capture side)
 *   --keep-chunks       keep the per-worker chunk files
 * Exit code is non-zero if the page throws, logs console.error, or a request fails.
 */
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_PUBLIC = path.resolve(ROOT, '..', '..', 'public');
const W = 1920, H = 1080;

// ------------------------------------------------------------------------------------------
// CLI
// ------------------------------------------------------------------------------------------
function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new Error('unexpected argument: ' + a);
    const k = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) o[k] = true;
    else { o[k] = next; i++; }
  }
  return o;
}
const args = parseArgs(process.argv.slice(2));
if (args.help || args.h) {
  const src = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const lines = src.split('\n');
  console.log(lines.slice(1, lines.findIndex((l) => l.trim() === '*/')).map((l) => l.replace(/^ ?\* ?/, '')).join('\n'));
  process.exit(0);
}
const num = (v, d) => (v === undefined || v === true ? d : Number(v));
const FPS = num(args.fps, 30);
const WORKERS = Math.max(1, Math.floor(num(args.workers, 3)));
const SCALE = num(args.scale, 1);
const CAPTURE = args.capture || 'cdp';
const VERBOSE = !!args.verbose;
const mode = args.out ? 'video' : args.stills ? 'stills' : args.contact ? 'contact' : args.serve ? 'serve' : null;
if (!mode) {
  console.error('nothing to do: pass --out file.mp4, --stills t1,t2 --outdir dir, --contact dir or --serve [port] (see --help)');
  process.exit(2);
}

// ------------------------------------------------------------------------------------------
// Static server rooted at the project (fonts, node_modules, .work frames all reachable)
// ------------------------------------------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.map': 'application/json',
};
const CONTACT_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'JB';src:url(/node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2) format('woff2-variations');font-weight:100 800}
html,body{margin:0;background:#111}</style></head><body><canvas id="c"></canvas></body></html>`;

function startServer(port = 0) {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, 'http://x');
        if (url.pathname === '/__contact') {
          res.writeHead(200, { 'Content-Type': MIME['.html'] });
          res.end(CONTACT_HTML);
          return;
        }
        const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
        // /public/... is the repo's public/ folder (read-only mount, for logo/illustrations/photos)
        const mount = rel.startsWith('public/') && fs.existsSync(REPO_PUBLIC) ? REPO_PUBLIC : ROOT;
        const file = path.resolve(mount, mount === ROOT ? rel : rel.slice('public/'.length));
        if (file !== mount && !file.startsWith(mount + path.sep)) { res.writeHead(403); res.end(); return; }
        const st = await fsp.stat(file).catch(() => null);
        if (!st || !st.isFile()) { res.writeHead(404); res.end('not found: ' + rel); return; }
        res.writeHead(200, {
          'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
          'Content-Length': st.size,
          'Cache-Control': 'max-age=3600',
          'Access-Control-Allow-Origin': '*',
        });
        if (req.method === 'HEAD') { res.end(); return; }
        fs.createReadStream(file).pipe(res);
      } catch (e) {
        res.writeHead(500); res.end(String(e));
      }
    });
    server.keepAliveTimeout = 60000;
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

// ------------------------------------------------------------------------------------------
// Browser workers
// ------------------------------------------------------------------------------------------
function loadPlaywright() {
  const tries = ['playwright', '/opt/node-tools/node_modules/playwright', 'playwright-core'];
  for (const t of tries) { try { return require(t); } catch (e) { /* next */ } }
  throw new Error('playwright not found (tried ' + tries.join(', ') + ')');
}
const CHROME_ARGS = [
  '--force-color-profile=srgb',
  '--hide-scrollbars',
  '--font-render-hinting=none',
  '--disable-lcd-text',
  '--disable-gpu',
  '--disable-checker-imaging',          // decode images synchronously at raster time, never a placeholder
  '--disable-partial-raster',
  '--run-all-compositor-stages-before-draw',
  '--disable-threaded-animation',
  '--disable-threaded-scrolling',
  '--disable-image-animation-resync',
  '--disable-new-content-rendering-timeout',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
  '--disable-ipc-flooding-protection',
  '--disable-features=PaintHolding,BackForwardCache,Translate,MediaRouter',
  '--mute-audio',
  '--no-first-run',
];

class Fatal extends Error {}
const fatalErrors = [];
let aborting = false;
function addFatal(msg) {
  fatalErrors.push(msg);
  if (!aborting) { aborting = true; }
}

async function openWorker(pw, baseUrl, query, id) {
  const browser = await pw.chromium.launch({ headless: true, args: CHROME_ARGS });
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'no-preference' });
  const page = await context.newPage();
  page.on('pageerror', (e) => addFatal(`[worker ${id}] page error: ${e.message}\n${e.stack || ''}`));
  page.on('console', (m) => {
    const type = m.type();
    if (type === 'error') addFatal(`[worker ${id}] console.error: ${m.text()}`);
    else if (type === 'warning') { if (id === 0) console.warn(`[page warn] ${m.text()}`); }
    else if (VERBOSE && id === 0) console.log(`[page] ${m.text()}`);
  });
  page.on('requestfailed', (r) => addFatal(`[worker ${id}] request failed: ${r.url()} (${r.failure() && r.failure().errorText})`));
  page.on('response', (r) => { if (r.status() >= 400) addFatal(`[worker ${id}] HTTP ${r.status()} for ${r.url()}`); });
  const url = baseUrl + '/comp/index.html?' + query;
  await page.goto(url, { waitUntil: 'load' });
  const info = await page.evaluate(async () => {
    try {
      const f = await window.__film.ready;
      return { ok: true, duration: f.duration, fps: f.fps, frames: f.frames, scenes: f.scenes, isolated: f.isolated, manifest: f.manifestSrc };
    } catch (e) {
      return { ok: false, error: String((e && e.message) || e) };
    }
  });
  if (!info.ok) throw new Fatal(`page failed to boot: ${info.error}`);
  const cdp = await context.newCDPSession(page);
  return { id, browser, context, page, cdp, info };
}

function withTimeout(p, ms, what) {
  let timer;
  return Promise.race([p, new Promise((_, rej) => { timer = setTimeout(() => rej(new Fatal(`timeout after ${ms} ms: ${what}`)), ms); })])
    .finally(() => clearTimeout(timer));
}

async function seek(w, t) {
  await withTimeout(w.page.evaluate((tt) => window.__film.seek(tt), t), 60000, `seek(${t})`);
  if (fatalErrors.length) throw new Fatal(fatalErrors[0]);
}
async function capture(w, scale) {
  if (CAPTURE === 'playwright' && !scale) return w.page.screenshot({ type: 'png', animations: 'allow', caret: 'initial' });
  const params = { format: 'png', optimizeForSpeed: true, captureBeyondViewport: false, fromSurface: true };
  if (scale) params.clip = { x: 0, y: 0, width: W, height: H, scale };
  const { data } = await withTimeout(w.cdp.send('Page.captureScreenshot', params), 60000, 'captureScreenshot');
  return Buffer.from(data, 'base64');
}

function splitContiguous(items, n) {
  const out = [];
  const per = Math.floor(items.length / n), extra = items.length % n;
  let k = 0;
  for (let i = 0; i < n; i++) {
    const len = per + (i < extra ? 1 : 0);
    out.push(items.slice(k, k + len));
    k += len;
  }
  return out.filter((c) => c.length);
}

// ------------------------------------------------------------------------------------------
// ffmpeg helpers
// ------------------------------------------------------------------------------------------
function run(cmd, argv, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, argv, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve({ out, err }) : reject(new Error(`${cmd} exited ${code}: ${err.slice(-2000)}`))));
  });
}
function x264Args(outFile) {
  const crf = String(num(args.crf, 14));
  const preset = args.preset || 'slow';
  const gop = String(num(args.gop, FPS));
  const a = [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv:flags=bicubic+accurate_rnd+full_chroma_int,format=yuv420p',
    '-c:v', 'libx264', '-preset', preset, '-crf', crf, '-g', gop, '-pix_fmt', 'yuv420p',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
  ];
  if (args.tune && args.tune !== 'none') a.push('-tune', String(args.tune));
  if (args['x264-params']) a.push('-x264-params', String(args['x264-params']));
  a.push('-movflags', '+faststart', '-r', String(FPS), outFile);
  return a;
}
function spawnEncoder(outFile) {
  const p = spawn('ffmpeg', x264Args(outFile), { stdio: ['pipe', 'ignore', 'pipe'] });
  let err = '';
  p.stderr.on('data', (d) => (err += d));
  const done = new Promise((resolve, reject) => {
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg (${path.basename(outFile)}) exited ${code}: ${err.slice(-2000)}`))));
  });
  p.stdin.on('error', (e) => addFatal(`ffmpeg stdin: ${e.message} ${err.slice(-500)}`));
  return { proc: p, done };
}
function writeAsync(stream, buf) {
  return new Promise((resolve) => { if (stream.write(buf)) resolve(); else stream.once('drain', resolve); });
}

// ------------------------------------------------------------------------------------------
// Main
// ------------------------------------------------------------------------------------------
function pageQuery() {
  const q = new URLSearchParams();
  if (args.manifest) q.set('manifest', String(args.manifest));
  if (args.scene) q.set('scene', String(args.scene));
  q.set('fps', String(FPS));
  if (args.guides) q.set('guides', '1');
  if (args.params) for (const [k, v] of new URLSearchParams(String(args.params))) q.set(k, v);
  return q.toString();
}
const fmtT = (t) => t.toFixed(3);
function activeScenes(info, t) {
  return info.scenes.filter((s, i) => t >= s.start - 1e-6 && (t < s.end - 1e-6 || i === info.scenes.length - 1)).map((s) => s.id);
}

let server, workers = [];
async function cleanup() {
  await Promise.all(workers.map((w) => w.browser.close().catch(() => {})));
  if (server) server.close();
}

async function main() {
  const t0 = performance.now();
  if (mode === 'serve') {
    server = await startServer(args.serve === true ? 8090 : Number(args.serve));
    const u = `http://127.0.0.1:${server.address().port}/comp/index.html`;
    console.log(`[serve] ${ROOT} on http://127.0.0.1:${server.address().port}  (Ctrl+C to stop)`);
    console.log(`[serve] film:   ${u}?guides=1&hud=1`);
    console.log(`[serve] scene:  ${u}?scene=<id>&t=2.5     demo: ${u}?manifest=scenes/manifest.demo.js&play=1`);
    await new Promise(() => {});
  }
  server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const pw = loadPlaywright();
  const query = pageQuery();

  // how many workers do we actually need?
  let nWorkers = WORKERS;
  if (mode === 'stills') nWorkers = Math.min(WORKERS, String(args.stills).split(',').length);
  workers = await Promise.all(Array.from({ length: nWorkers }, (_, i) => openWorker(pw, base, query, i)));
  const info = workers[0].info;
  const bootMs = performance.now() - t0;
  const label = args.scene ? `scene ${args.scene}` : `manifest ${info.manifest}`;
  console.log(`[render] ${label}: ${info.duration.toFixed(3)} s, ${info.frames} frames @ ${FPS} fps, ${info.scenes.length} scene(s); ${nWorkers} worker(s) booted in ${(bootMs / 1000).toFixed(1)} s`);
  for (const s of info.scenes) console.log(`         ${s.id.padEnd(22)} ${fmtT(s.start).padStart(8)} -> ${fmtT(s.end).padStart(8)}  (${s.duration}s${s.overlapIn ? ', overlaps previous by ' + s.overlapIn + 's' : ''})`);

  if (mode === 'video') await renderVideo(info);
  else if (mode === 'stills') await renderStills(info);
  else await renderContact(info);
  console.log(`[render] done in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
}

async function renderVideo(info) {
  const total = info.frames;
  const f0 = args.from !== undefined ? Math.max(0, Math.round(Number(args.from) * FPS)) : 0;
  const f1 = args.to !== undefined ? Math.min(total, Math.round(Number(args.to) * FPS)) : total;
  if (!(f1 > f0)) throw new Fatal(`empty frame range ${f0}..${f1}`);
  const frames = Array.from({ length: f1 - f0 }, (_, i) => f0 + i);
  const chunks = splitContiguous(frames, workers.length);
  const out = path.resolve(String(args.out));
  const noEncode = args.encode === 'none';
  await fsp.mkdir(path.dirname(out), { recursive: true });
  const chunkDir = path.join(ROOT, '.work', 'render-tmp', `${path.basename(out)}.${process.pid}`);
  if (!noEncode) await fsp.mkdir(chunkDir, { recursive: true });
  const encoders = [];
  const hashes = args.hashes ? new Array(frames.length) : null;
  console.log(`[render] frames ${f0}..${f1 - 1} (${frames.length}) in ${chunks.length} chunk(s): ${chunks.map((c) => c[0] + '-' + c[c.length - 1]).join(', ')}`);

  let done = 0, tCaptured = 0;
  const tStart = performance.now();
  const prog = setInterval(() => {
    const el = (performance.now() - tStart) / 1000;
    const fps = done / el;
    const eta = fps > 0 ? (frames.length - done) / fps : 0;
    console.log(`[render] ${done}/${frames.length} frames  ${(100 * done / frames.length).toFixed(1)}%  ${fps.toFixed(2)} fps  ETA ${eta.toFixed(0)} s`);
  }, 3000);

  const chunkFiles = [];
  try {
    await Promise.all(chunks.map(async (chunk, ci) => {
      const w = workers[ci];
      const file = path.join(chunkDir, `chunk_${String(ci).padStart(3, '0')}.mp4`);
      chunkFiles[ci] = file;
      const enc = noEncode ? null : spawnEncoder(file);
      if (enc) encoders.push(enc);
      for (const f of chunk) {
        if (fatalErrors.length) throw new Fatal(fatalErrors[0]);
        await seek(w, f / FPS);
        const png = await capture(w, SCALE !== 1 ? SCALE : 0);
        if (hashes) hashes[f - f0] = crypto.createHash('sha256').update(png).digest('hex');
        if (enc) await writeAsync(enc.proc.stdin, png);
        if (++done === frames.length) tCaptured = performance.now();
      }
      if (enc) { enc.proc.stdin.end(); await enc.done; }
    }));
  } catch (e) {
    clearInterval(prog);
    for (const enc of encoders) enc.proc.kill('SIGKILL');
    await fsp.rm(chunkDir, { recursive: true, force: true }).catch(() => {});
    throw e;
  }
  clearInterval(prog);
  const el = (performance.now() - tStart) / 1000;
  const elCap = ((tCaptured || performance.now()) - tStart) / 1000;
  console.log(`[render] rendered ${frames.length} frames in ${el.toFixed(1)} s = ${(frames.length / el).toFixed(2)} frames/s with ${workers.length} worker(s) (capture finished at ${elCap.toFixed(1)} s${noEncode ? ', no encode' : ', then waited for x264'})`);

  if (hashes) {
    await fsp.writeFile(path.resolve(String(args.hashes)), hashes.map((h, i) => `${f0 + i}\t${fmtT((f0 + i) / FPS)}\t${h}`).join('\n') + '\n');
    console.log(`[render] frame hashes -> ${args.hashes}`);
  }
  if (noEncode) return;

  // lossless concat of the chunks
  const list = path.join(chunkDir, 'list.txt');
  await fsp.writeFile(list, chunkFiles.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]);
  if (!args['keep-chunks']) await fsp.rm(chunkDir, { recursive: true, force: true });
  const probe = await run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries',
    'stream=width,height,r_frame_rate,pix_fmt,color_space,color_primaries,color_transfer,nb_frames', '-of', 'default=nw=1', out]);
  const p = Object.fromEntries(probe.out.trim().split('\n').map((l) => l.split('=')));
  const st = await fsp.stat(out);
  console.log(`[render] wrote ${out} (${(st.size / 1e6).toFixed(1)} MB): ${p.width}x${p.height} ${p.r_frame_rate} ${p.pix_fmt} ${p.color_space}/${p.color_primaries}/${p.color_transfer}, ${p.nb_frames} frames`);
  if (Number(p.nb_frames) !== frames.length) throw new Fatal(`frame count mismatch: expected ${frames.length}, file has ${p.nb_frames}`);
}

async function renderStills(info) {
  const times = String(args.stills).split(',').map((s) => Number(s.trim())).filter((t) => isFinite(t));
  const outdir = path.resolve(String(args.outdir || '.work/stills'));
  await fsp.mkdir(outdir, { recursive: true });
  const prefix = args.scene ? `${args.scene}_` : '';
  const jobs = splitContiguous(times.map((t, i) => ({ t, i })), workers.length);
  const written = [];
  await Promise.all(jobs.map(async (job, wi) => {
    const w = workers[wi];
    for (const { t } of job) {
      if (t > info.duration + 1e-6) console.warn(`[render] still ${t}s is past the end (${info.duration}s); clamped`);
      await seek(w, t);
      const png = await capture(w);
      const file = path.join(outdir, `${prefix}t${fmtT(t).padStart(8, '0')}.png`);
      await fsp.writeFile(file, png);
      written.push({ t, file, sha: crypto.createHash('sha256').update(png).digest('hex').slice(0, 16) });
    }
  }));
  written.sort((a, b) => a.t - b.t).forEach((x) => console.log(`[render] still ${fmtT(x.t)}s -> ${x.file}  sha256:${x.sha}`));
}

async function renderContact(info) {
  const every = num(args.every, 0.5);
  const cols = Math.max(1, num(args.cols, 6));
  const tw = Math.round(num(args.width, 320));
  const th = Math.round(tw * H / W);
  const rowsPer = Math.max(0, num(args.rows, 6));
  const from = num(args.from, 0), to = Math.min(num(args.to, info.duration), info.duration);
  const times = [];
  for (let k = 0; ; k++) {
    const t = +(from + k * every).toFixed(6);
    if (t >= to - 1e-9) break;
    times.push(t);
  }
  const lastFrameT = Math.max(0, (Math.round(to * FPS) - 1) / FPS);
  if (!times.length || lastFrameT - times[times.length - 1] > every * 0.5) times.push(+lastFrameT.toFixed(6));
  const outdir = path.resolve(String(args.contact));
  await fsp.mkdir(outdir, { recursive: true });
  const thumbs = new Array(times.length);
  const jobs = splitContiguous(times.map((t, i) => ({ t, i })), workers.length);
  const scale = tw / W;
  await Promise.all(jobs.map(async (job, wi) => {
    const w = workers[wi];
    for (const { t, i } of job) {
      await seek(w, t);
      thumbs[i] = (await capture(w, scale)).toString('base64');
    }
  }));
  // compose the sheet(s) in a page (canvas), labels burned in
  const page = await workers[0].context.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/__contact`);
  const name = args.scene ? String(args.scene) : path.basename(info.manifest || 'film').replace(/\.js$/, '').replace(/^manifest\.?/, '') || 'film';
  const perSheet = rowsPer > 0 ? rowsPer * cols : times.length;
  const nSheets = Math.ceil(times.length / perSheet);
  for (let s = 0; s < nSheets; s++) {
    const idx = times.map((_, i) => i).slice(s * perSheet, (s + 1) * perSheet);
    const items = idx.map((i) => ({ t: times[i], f: Math.round(times[i] * FPS), scenes: activeScenes(info, times[i]).join('+'), png: thumbs[i] }));
    const title = `${name.toUpperCase()}  ·  ${fmtT(items[0].t)}s to ${fmtT(items[items.length - 1].t)}s  ·  every ${every}s  ·  sheet ${s + 1}/${nSheets}`;
    const dataUrl = await page.evaluate(async ({ items, cols, tw, th, title }) => {
      await document.fonts.load('500 12px JB');
      const pad = 8, head = 40, lab = 0;
      const rows = Math.ceil(items.length / cols);
      const c = document.getElementById('c');
      c.width = pad + cols * (tw + pad);
      c.height = head + rows * (th + pad + lab) + pad;
      const g = c.getContext('2d');
      g.fillStyle = '#16161a'; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#efbd70'; g.font = '600 15px JB'; g.textBaseline = 'middle';
      g.fillText(title, pad + 2, head / 2);
      const imgs = await Promise.all(items.map((it) => { const im = new Image(); im.src = 'data:image/png;base64,' + it.png; return im.decode().then(() => im); }));
      items.forEach((it, i) => {
        const x = pad + (i % cols) * (tw + pad), y = head + Math.floor(i / cols) * (th + pad + lab);
        g.drawImage(imgs[i], x, y, tw, th);
        const txt = `${it.t.toFixed(2)}s  f${it.f}  ${it.scenes}`;
        g.font = '500 11px JB';
        const mw = g.measureText(txt).width;
        g.fillStyle = 'rgba(0,0,0,0.72)'; g.fillRect(x, y + th - 17, mw + 10, 17);
        g.fillStyle = '#f2eee7'; g.textBaseline = 'middle'; g.fillText(txt, x + 5, y + th - 8);
      });
      return c.toDataURL('image/jpeg', 0.9);
    }, { items, cols, tw, th, title });
    const suffix = nSheets > 1 ? `_${String(s + 1).padStart(2, '0')}` : '';
    const range = args.from !== undefined || args.to !== undefined ? `_${fmtT(from)}-${fmtT(to)}` : '';
    const file = path.join(outdir, `contact_${name}${range}${suffix}.jpg`);
    await fsp.writeFile(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log(`[render] contact sheet (${items.length} frames) -> ${file}`);
  }
  await page.close();
}

main().then(async () => {
  await cleanup();
  if (fatalErrors.length) {
    console.error('[render] FAILED with page errors:\n' + fatalErrors.slice(0, 20).join('\n'));
    process.exit(1);
  }
  process.exit(0);
}).catch(async (e) => {
  console.error('[render] FAILED: ' + (e && e.message ? e.message : e));
  if (fatalErrors.length) console.error('[render] page errors:\n' + fatalErrors.slice(0, 20).join('\n'));
  await cleanup();
  process.exit(1);
});
