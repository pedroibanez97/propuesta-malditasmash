#!/usr/bin/env node
/**
 * Exporta la propuesta a PDF (A4 apaisado, una página por sección) usando
 * Chrome / Chromium / Edge en modo headless. Sin dependencias (Node 22+).
 *
 *   node tools/export-pdf.mjs                 → ./Maldita-Smash-Propuesta.pdf
 *   node tools/export-pdf.mjs salida.pdf
 *   CHROME_PATH="/ruta/a/chrome" node tools/export-pdf.mjs
 */
import { spawn, execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const out = resolve(process.cwd(), process.argv[2] || join(root, 'Maldita-Smash-Propuesta.pdf'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
    try { return execSync(`command -v ${bin}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* sigue */ }
  }
  throw new Error('No encontré Chrome/Chromium. Indicá la ruta con CHROME_PATH.');
}

const profile = mkdtempSync(join(tmpdir(), 'ms-pdf-'));
const chrome = spawn(findChrome(), [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' });

try {
  // Chrome escribe el puerto elegido en DevToolsActivePort
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    await sleep(100);
    try { port = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch { /* espera */ }
  }
  if (!port) throw new Error('Chrome no inició el puerto de depuración.');

  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    else if (d.method) listeners.forEach((fn) => fn(d));
  });
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
  });

  await send('Page.enable');
  const loaded = new Promise((r) => listeners.push((d) => d.method === 'Page.loadEventFired' && r()));
  await send('Page.navigate', { url: pathToFileURL(join(root, 'index.html')).href });
  await loaded;
  // fuentes + todas las imágenes (incluidas las de carga diferida) listas
  await send('Runtime.evaluate', {
    awaitPromise: true,
    expression: `(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((img) => { img.loading = 'eager'; return img.decode().catch(() => {}); }));
      window.dispatchEvent(new Event('beforeprint'));
    })()`,
  });
  await sleep(500);
  const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
  if (!pdf.result) throw new Error('printToPDF falló: ' + JSON.stringify(pdf.error));
  writeFileSync(out, Buffer.from(pdf.result.data, 'base64'));
  console.log('PDF generado:', out);
  ws.close();
} finally {
  chrome.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
