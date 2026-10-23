#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Measures what THIS machine's screencast can actually sustain. Screencast
 * throughput is roughly a fixed pixels-per-second budget (lesson 3), so the
 * right frame rate for a stage is a fact about the hardware doing the
 * encoding — every machine has its own answer, and any number quoted in a
 * doc (including this engine's own references) is only ever an example from
 * whatever machine happened to run this script, never a target to expect
 * elsewhere. Print what this run measured, not what another one did.
 *
 * Talks to Chrome over raw CDP rather than through Playwright: this script
 * has to run standalone, from `scripts/`, before any app's `node_modules`
 * exists to resolve `playwright` from, and the browser binary Playwright
 * already cached is enough on its own — Node's own `WebSocket` global is the
 * only thing this borrows.
 */

const SECONDS = Number(process.env.DEMO_PROBE_SECONDS ?? 5);
const MOTION_GAP = 0.05;

const STAGES = [
  { label: '1080p', width: 1920, height: 1080 },
  { label: '1440p', width: 2560, height: 1440 },
  { label: '4K', width: 3840, height: 2160 },
];

function findChromium() {
  if (process.env.DEMO_CHROMIUM_PATH) {
    return process.env.DEMO_CHROMIUM_PATH;
  }

  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    join(homedir(), 'Library/Caches/ms-playwright'),
    join(homedir(), '.cache/ms-playwright'),
  ].filter(Boolean);

  const relatives = [
    'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    'chrome-linux/chrome',
    'chrome-win/chrome.exe',
  ];

  for (const root of roots) {
    if (!existsSync(root)) {
      continue;
    }
    const versions = new Set();
    for (const name of safeReaddir(root)) {
      if (name.startsWith('chromium-')) {
        versions.add(name);
      }
    }
    for (const name of [...versions].sort().reverse()) {
      for (const relative of relatives) {
        const candidate = join(root, name, relative);
        if (existsSync(candidate)) {
          return candidate;
        }
      }
    }
  }

  return null;
}

function safeReaddir(dir) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

const PAGE_HTML = `<!doctype html><html><body style="margin:0;overflow:hidden;background:#10121a">
<div id="d" style="position:fixed;top:40%;left:0;width:120px;height:120px;border-radius:16px;
background:linear-gradient(135deg,#7c8cff,#33e6c8)"></div>
<script>
var d = document.getElementById('d');
function tick(t) {
  var w = window.innerWidth - 120;
  var x = (Math.sin(t / 500) * 0.5 + 0.5) * w;
  d.style.transform = 'translate(' + x.toFixed(2) + 'px,0)';
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
</script>
</body></html>`;

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        this.pending.get(message.id)(message);
        this.pending.delete(message.id);
        return;
      }
      for (const listener of this.listeners) {
        listener(message);
      }
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) {
      payload.sessionId = sessionId;
    }
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.ws.send(JSON.stringify(payload));
    });
  }

  on(handler) {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }
}

async function connect(execPath, width, height) {
  const child = spawn(
    execPath,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      '--hide-scrollbars',
      '--force-color-profile=srgb',
      '--font-render-hinting=none',
      '--disable-gpu-vsync',
      '--disable-frame-rate-limit',
      `--window-size=${width},${height}`,
      '--force-device-scale-factor=1',
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  );

  const browserUrl = await new Promise((resolve, reject) => {
    let buffer = '';
    const timeout = setTimeout(
      () => reject(new Error('chromium never printed a devtools ws url')),
      10_000
    );
    child.stderr.on('data', (chunk) => {
      buffer += chunk.toString();
      const match = buffer.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
  });

  const browserWs = new WebSocket(browserUrl);
  await new Promise((resolve) => browserWs.addEventListener('open', resolve));
  const browser = new CDP(browserWs);

  const { result: target } = await browser.send('Target.createTarget', {
    url: 'about:blank',
  });
  const { result: attached } = await browser.send('Target.attachToTarget', {
    targetId: target.targetId,
    flatten: true,
  });
  const sessionId = attached.sessionId;

  return { child, browser, sessionId };
}

async function probe(execPath, stage) {
  const { child, browser, sessionId } = await connect(
    execPath,
    stage.width,
    stage.height
  );

  try {
    await browser.send('Page.enable', {}, sessionId);
    await browser.send(
      'Emulation.setDeviceMetricsOverride',
      {
        width: stage.width,
        height: stage.height,
        deviceScaleFactor: 1,
        mobile: false,
      },
      sessionId
    );
    await browser.send(
      'Page.navigate',
      { url: `data:text/html,${encodeURIComponent(PAGE_HTML)}` },
      sessionId
    );
    await new Promise((resolve) => setTimeout(resolve, 300));

    const frames = [];
    const off = browser.on((message) => {
      if (
        message.method === 'Page.screencastFrame' &&
        message.sessionId === sessionId
      ) {
        const { data, sessionId: frameSessionId, metadata } = message.params;
        void data;
        frames.push(metadata?.timestamp ?? Date.now() / 1000);
        void browser.send(
          'Page.screencastFrameAck',
          { sessionId: frameSessionId },
          sessionId
        );
      }
    });

    await browser.send(
      'Page.startScreencast',
      { format: 'jpeg', quality: 80, everyNthFrame: 1 },
      sessionId
    );

    await new Promise((resolve) => setTimeout(resolve, SECONDS * 1000));

    await browser.send('Page.stopScreencast', {}, sessionId);
    off();

    const gaps = frames
      .slice(1)
      .map((at, index) => at - frames[index])
      .filter((gap) => gap > 0);
    const moving = gaps.filter((gap) => gap <= MOTION_GAP);
    const movingFor = moving.reduce((total, gap) => total + gap, 0);
    const measured = movingFor > 0 ? moving.length / movingFor : 0;

    return { frames: frames.length, measured };
  } finally {
    child.kill();
  }
}

const execPath = findChromium();
if (!execPath) {
  process.stderr.write(
    'probe-fps: no cached Chromium found. Fix: npx playwright install chromium\n' +
      '           or set DEMO_CHROMIUM_PATH to a Chrome/Chromium binary.\n'
  );
  process.exit(1);
}

process.stdout.write(`probe-fps: ${execPath}\n`);
process.stdout.write('sustained rate on this machine, measured just now:\n\n');

for (const stage of STAGES) {
  const { frames, measured } = await probe(execPath, stage);
  process.stdout.write(
    `  ${stage.label.padEnd(6)} ${String(stage.width).padStart(4)}x${stage.height}  ` +
      `${measured.toFixed(1).padStart(5)}fps sustained  (${frames} frames in ${SECONDS}s)\n`
  );
}

/**
 * The caveat matters more than the numbers.
 *
 * What this films is a moving box, which is about the cheapest thing a browser
 * can repaint. A real app is not: scaling text means re-rasterising every
 * glyph, and on the machine these figures came from a synthetic box held 52fps
 * at 4K while an actual app push-in on the same hardware managed 30. So this
 * is a ceiling, not a forecast, and reading it as a forecast is how somebody
 * talks themselves into 4K video and then wonders why the zooms step.
 */
process.stdout.write(
  '\n  These are an upper bound: a moving box is the cheapest thing a browser\n' +
    '  repaints, and a real app scaling real text is much dearer. Expect well\n' +
    '  under these figures in a scene, especially at 4K.\n' +
    '\n  The decision this informs: film video at the resolution that holds\n' +
    '  60fps comfortably and keep the stills at 2x, which are separate\n' +
    '  settings. See references/capture.md.\n'
);
