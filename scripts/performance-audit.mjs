/* global PerformanceObserver, process, setTimeout, window */

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createConnection, createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Refuse to connect to a preview or debugging process owned by someone else.
for (const port of [32502, 32503]) {
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen({ host: '127.0.0.1', port, exclusive: true }, () => probe.close(resolve));
  });
}
const baseUrl = 'http://127.0.0.1:32502/menu';
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const preview = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', '32502', '--strictPort'], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let previewOutput = '';
preview.stdout.on('data', (chunk) => { previewOutput += chunk.toString(); });
preview.stderr.on('data', (chunk) => { previewOutput += chunk.toString(); });

const isPreviewListening = () => new Promise((resolve) => {
  const socket = createConnection({ host: '127.0.0.1', port: 32502 });
  socket.once('connect', () => {
    socket.end();
    resolve(true);
  });
  socket.once('error', () => {
    socket.destroy();
    resolve(false);
  });
});

const waitForPreview = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (preview.exitCode !== null) throw new Error(`Vite preview exited.\n${previewOutput}`);
    if (await isPreviewListening()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Vite preview did not start.\n${previewOutput}`);
};

const median = (values) => {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.floor(ordered.length / 2)];
};

let chrome;
try {
  await waitForPreview();
  chrome = await launch({
    port: 32503,
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  });

  const runs = [];
  for (let index = 0; index < 3; index += 1) {
    const result = await lighthouse(baseUrl, {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
    });
    if (!result) throw new Error('Lighthouse returned no result.');
    runs.push({
      lcpMs: result.lhr.audits['largest-contentful-paint'].numericValue,
      cls: result.lhr.audits['cumulative-layout-shift'].numericValue,
      performanceScore: result.lhr.categories.performance.score,
    });
  }

  const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
  const client = await page.createCDPSession();
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: 1_600_000 / 8,
    uploadThroughput: 750_000 / 8,
    connectionType: 'cellular4g',
  });
  await page.evaluateOnNewDocument(() => {
    window.__napoliEventDurations = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.interactionId > 0) window.__napoliEventDurations.push(entry.duration);
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 0 });
  });
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  const favorite = await page.waitForSelector('[data-product-card] button[aria-label^="Добавить в избранное"]');
  await favorite.click();
  await new Promise((resolve) => setTimeout(resolve, 800));
  const eventDurations = await page.evaluate(() => window.__napoliEventDurations);
  await page.close();
  await browser.disconnect();

  const summary = {
    profile: 'Lighthouse default mobile simulated throttling; 390x844 Event Timing at 4x CPU and 1.6 Mbps/150 ms',
    runs,
    medianLcpMs: median(runs.map((run) => run.lcpMs)),
    medianCls: median(runs.map((run) => run.cls)),
    observedInpMs: eventDurations.length > 0 ? Math.max(...eventDurations) : null,
    targets: { lcpMs: 2500, cls: 0.1, inpMs: 200 },
  };

  await mkdir(path.join(root, 'artifacts', 'm12'), { recursive: true });
  await writeFile(
    path.join(root, 'artifacts', 'm12', 'performance-summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8',
  );
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (summary.medianLcpMs > summary.targets.lcpMs) throw new Error('LCP budget exceeded.');
  if (summary.medianCls > summary.targets.cls) throw new Error('CLS budget exceeded.');
  if (summary.observedInpMs === null) throw new Error('No Event Timing interaction was captured.');
  if (summary.observedInpMs > summary.targets.inpMs) throw new Error('INP budget exceeded.');
} finally {
  if (chrome) await chrome.kill();
  preview.kill();
}
