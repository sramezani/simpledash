// Retakes the docs screenshots that show SimpleDash itself, from the /ui-kit previews on sample
// data, with the Chrome already on this Mac (no package needed) (docs/SPEC.md section 30).
// Start `npm run dev` first, then: npm run content:screenshots [-- slot-id ...]
// Each shot is saved as public/content/<id>.webp at twice the screen size, cropped to the part
// the page talks about. Screens from Google, Stripe and site builders are taken by hand.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = join(process.cwd(), "public", "content");
const ONLY = process.argv.slice(2);
const BASE = process.env.SCREENSHOT_URL ?? "http://localhost:3000";
const PORT = 9333;
const CHROME =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DPR = 2;
const TARGET_WIDTH = 1600;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = mkdtempSync(join(tmpdir(), "simpledash-shots-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--force-prefers-reduced-motion",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ],
  { stdio: "ignore" },
);

let ws;
let nextId = 1;
const pending = new Map();
const listeners = [];
function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject, method }));
}
function once(event) {
  return new Promise((resolve) => listeners.push({ event, resolve }));
}
async function evaluate(expression) {
  const r = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails)
    throw new Error(
      `${expression.slice(0, 80)}: ${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description ?? ""}`,
    );
  return r.result.value;
}

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const pages = (await res.json()).filter((t) => t.type === "page");
      if (pages[0]) return pages[0].webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("Chrome didn't start");
}

// Makes the page look like the real one: no preview nav, no dev badge, no cookie banner, no motion.
const PREP = `(async () => {
  const style = document.createElement('style');
  style.textContent = 'nav[aria-label="Preview states"], nextjs-portal { display: none !important } *, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; caret-color: transparent !important }';
  document.head.appendChild(style);
  const decline = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Decline');
  if (decline) decline.click();
  // Docs show the real address, not the dev server's.
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode()); ) if (n.nodeValue.includes('localhost:3000')) n.nodeValue = n.nodeValue.replaceAll('localhost:3000', 'simpledash.app');
  await new Promise(r => setTimeout(r, 400));
  return true;
})()`;

async function go(path, width, height = 1800) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: DPR,
    mobile: false,
  });
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url: BASE + path });
  await loaded;
  await sleep(3500); // streamed sections and lazy charts
  await evaluate(PREP);
  await sleep(800);
}

/** A rectangle in page coordinates from a JS expression returning {x, y, w, h}. */
async function shot(id, rectExpression) {
  const rect = await evaluate(`(() => { ${rectExpression} })()`);
  if (!rect || !rect.w || !rect.h) throw new Error(`${id}: nothing to capture`);
  const scale = Math.min(1, TARGET_WIDTH / (rect.w * DPR));
  const { data } = await send("Page.captureScreenshot", {
    format: "webp",
    quality: 90,
    // Capturing beyond the viewport resizes the page, which moves popovers and menus.
    captureBeyondViewport: rect.y + rect.h > (await evaluate("innerHeight + scrollY")),
    clip: { x: rect.x, y: rect.y, width: rect.w, height: rect.h, scale },
  });
  const file = join(OUT, `${id}.webp`);
  writeFileSync(file, Buffer.from(data, "base64"));
  console.log(`${id}: ${Math.round(rect.w * DPR * scale)}×${Math.round(rect.h * DPR * scale)}`);
}

// Rect helpers available inside expressions.
/** Hides everything around one element (so neighbours don't show at the crop's edges) and waits for its images. */
async function focus(selector) {
  await evaluate(`(async () => {
    const el = document.querySelector(${JSON.stringify(selector)});
    el.scrollIntoView({ block: 'center' });
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      for (const sib of n.parentElement?.children ?? []) if (sib !== n && !sib.matches('style, script, [popover]')) sib.style.visibility = 'hidden';
    }
    for (const img of el.querySelectorAll('img')) { img.loading = 'eager'; if (!img.complete) await new Promise(r => { img.onload = img.onerror = r; }); }
    await new Promise(r => setTimeout(r, 300));
  })()`);
}

const H = `
  const box = (el, pad = 0) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX - pad, y: r.top + scrollY - pad, w: r.width + pad * 2, h: r.height + pad * 2 }; };
  const union = (els, pad = 0) => { const rs = els.filter(Boolean).map(e => e.getBoundingClientRect()); const l = Math.min(...rs.map(r => r.left)), t = Math.min(...rs.map(r => r.top)), rr = Math.max(...rs.map(r => r.right)), b = Math.max(...rs.map(r => r.bottom)); return { x: l + scrollX - pad, y: t + scrollY - pad, w: rr - l + pad * 2, h: b - t + pad * 2 }; };
  const byText = (sel, text) => [...document.querySelectorAll(sel)].find(e => e.textContent.includes(text));
`;

const SHOTS = {
  async "dashboard-overview"() {
    await go("/ui-kit/dashboard?state=pro&range=7d", 1440);
    await evaluate(
      `(() => { const n = [...document.querySelectorAll('main *')].find(e => e.children.length < 6 && e.textContent.trim().startsWith("Every Monday we'll email")); n?.closest('div.rounded-2xl, section, [class*="rounded"]')?.remove(); })()`,
    );
    await sleep(300);
    await shot(
      "dashboard-overview",
      `${H} const end = document.getElementById('what-changed'); const r = end.getBoundingClientRect(); return { x: 0, y: 0, w: innerWidth, h: r.bottom + scrollY + 16 };`,
    );
  },
  async "what-changed-card"() {
    await go("/ui-kit/dashboard?state=pro&range=7d", 1100);
    await focus("#what-changed");
    await evaluate(
      `(() => { const s = [...document.querySelectorAll('#what-changed details > summary')].find(e => e.textContent.includes('Google') && e.offsetParent); s?.click(); })()`,
    );
    await sleep(400);
    await shot(
      "what-changed-card",
      `${H} return box(document.getElementById('what-changed'), 16);`,
    );
  },
  async "what-brings-customers-card"() {
    await go("/ui-kit/dashboard?state=pro&range=30d", 1100);
    await focus("#sales");
    await shot(
      "what-brings-customers-card",
      `${H} return box(document.getElementById('sales'), 16);`,
    );
  },
  async "search-this-week"() {
    await go("/ui-kit/dashboard?state=pro&range=30d", 1100);
    await focus("#search");
    await shot(
      "search-this-week",
      `${H} const card = document.getElementById('search'); const panel = document.querySelector('[aria-labelledby=search-action-title]'); const c = card.getBoundingClientRect(), p = panel.getBoundingClientRect(); return { x: c.left + scrollX - 16, y: c.top + scrollY - 16, w: c.width + 32, h: p.bottom - c.top + 30 };`,
    );
  },
  async "signups-picker"() {
    await go("/ui-kit/dashboard?state=no-signup-event&range=7d", 1280, 1400);
    await evaluate(
      `(() => { [...document.querySelectorAll('button')].find(b => b.textContent.includes('Choose your signup event'))?.click(); })()`,
    );
    await sleep(800);
    await evaluate(
      `(() => { const sel = document.querySelector('[popover]:popover-open select'); if (sel && [...sel.options].some(o => o.value === 'sign_up')) { sel.value = 'sign_up'; sel.dispatchEvent(new Event('change', { bubbles: true })); } })()`,
    );
    await sleep(300);
    await shot(
      "signups-picker",
      `${H} const panel = document.querySelector('[popover]:popover-open'); const trigger = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Choose your signup event')); const label = [...document.querySelectorAll('main span, main p, main dt, main div')].find(e => e.children.length === 0 && e.textContent.trim() === 'Signups'); const u = union([label, trigger, panel], 24); return { ...u, y: u.y - 16, h: u.h + 16 };`,
    );
  },
  async "site-menu"() {
    await go("/ui-kit/dashboard?state=pro&range=7d", 1280, 1100);
    await evaluate(
      `(() => { const t = [...document.querySelectorAll('main button')].find(b => b.textContent.includes('yoursite.com')); t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' })); })()`,
    );
    await sleep(1500);
    await shot(
      "site-menu",
      `${H} const t = [...document.querySelectorAll('main button')].find(b => b.textContent.includes('yoursite.com')); const menu = document.querySelector('[role=menu], [role=dialog], [popover]:popover-open'); return union([t, menu], 20);`,
    );
  },
  async "settings-pages"() {
    await go("/ui-kit/settings?state=pro&page=billing", 1100, 1000);
    await shot(
      "settings-pages",
      `const bottoms = [...document.querySelectorAll('main *')].filter(e => e.offsetParent && e.textContent.trim()).map(e => e.getBoundingClientRect().bottom); return { x: 0, y: 0, w: innerWidth, h: Math.max(...bottoms) + scrollY + 48 };`,
    );
  },
  async "public-page-settings"() {
    await go("/ui-kit/settings?state=public-on&page=site", 1100);
    await focus("#public");
    await shot("public-page-settings", `${H} return box(document.getElementById('public'), 16);`);
  },
  async "what-counts-as-a-sale"() {
    await go("/ui-kit/settings?state=pro&page=site", 1100);
    await focus("#sales");
    await shot("what-counts-as-a-sale", `${H} return box(document.getElementById('sales'), 16);`);
  },
  async "monday-email"() {
    await go("/ui-kit/email", 760, 1400);
    await shot(
      "monday-email",
      `${H} let n = [...document.querySelectorAll('a')].find(a => a.textContent.includes('Unsubscribe')); while (n && getComputedStyle(n).borderTopWidth === '0px') n = n.parentElement; return box(n, 24);`,
    );
  },
  async "public-stats-page"() {
    await go("/ui-kit/public?range=30d", 1280, 1600);
    await shot(
      "public-stats-page",
      `const tab = [...document.querySelectorAll('main label, main span')].find(e => e.textContent.trim() === 'Sources'); const card = tab.closest('section'); return { x: 0, y: 0, w: innerWidth, h: card.getBoundingClientRect().bottom + scrollY + 12 };`,
    );
  },
};

try {
  mkdirSync(OUT, { recursive: true });
  ws = new WebSocket(await connect());
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(`${p.method}: ${msg.error.message}`));
      else p.resolve(msg.result);
    } else if (msg.method) {
      for (let i = listeners.length - 1; i >= 0; i--) {
        if (listeners[i].event === msg.method) listeners.splice(i, 1)[0].resolve(msg.params);
      }
    }
  };
  await send("Page.enable");
  await send("Runtime.enable");
  for (const [id, run] of Object.entries(SHOTS)) {
    if (ONLY.length && !ONLY.includes(id)) continue;
    try {
      await run();
    } catch (error) {
      console.log(`${id}: FAILED ${error.message}`);
    }
  }
} finally {
  ws?.close();
  chrome.kill();
}
// Tick the new shots off in docs/CONTENT-IMAGES.md.
spawnSync(process.execPath, [join(process.cwd(), "scripts", "content-images.mjs")], {
  stdio: "inherit",
});
