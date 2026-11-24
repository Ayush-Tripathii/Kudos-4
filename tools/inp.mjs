// INP proxy: Event Timing API, 4x CPU throttle (≈ mid-range Android), real clicks/keys/drags.
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
async function run(w, h, fn) {
  const p = await b.newPage(); const mob = w < 800;
  await p.setViewport({ width: w, height: h, isMobile: mob, hasTouch: false, deviceScaleFactor: mob ? 2.6 : 1 });
  const cdp = await p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.goto('http://localhost:5178/index.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));
  await p.evaluate(() => { window.__ev = []; new PerformanceObserver(l => l.getEntries().forEach(e => e.interactionId && window.__ev.push({ n: e.name, d: e.duration, main: Math.round(e.processingEnd - e.startTime), t: e.target?.className || e.target?.tagName }))).observe({ type: 'event', buffered: false, durationThreshold: 16 }); window.__lf=[]; new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lf.push(Math.round(e.duration)))).observe({type:'long-animation-frame'}); });
  await fn(p);
  await new Promise(r => setTimeout(r, 1200));
  const ev = await p.evaluate(() => window.__ev); const lf = await p.evaluate(() => window.__lf); console.log('   long animation frames (>50ms):', lf.length, lf.length ? 'max '+Math.max(...lf)+'ms' : ''); await p.close(); return ev;
}
const sum = (label, ev) => { const m = ev.map(e => e.main).sort((a, b) => b - a); console.log(label, 'input delay + processing: worst', m[0] ?? '<16', 'ms, p75', m[Math.floor(m.length * .25)] ?? '<16', 'ms | headless event duration incl. presentation: worst', Math.max(0, ...ev.map(e => e.d)), 'ms'); };
const filter = await run(412, 915, async (p) => {
  await p.evaluate(() => document.querySelector('.filters').scrollIntoView({ block: 'center' })); await new Promise(r => setTimeout(r, 600));
  for (const f of ['small', 'main', 'indian', 'intl', 'all', 'main', 'all']) { await p.evaluate((f) => document.querySelector(`[data-filter=${f}]`).scrollIntoView({ block: 'nearest', inline: 'center' }), f); await p.click(`[data-filter=${f}]`); await new Promise(r => setTimeout(r, 900)); }
});
sum('Dish filter  @412px 4xCPU:', filter);
const scrub = await run(820, 1180, async (p) => {
  await p.evaluate(() => document.querySelector('.scrub').scrollIntoView({ block: 'center' })); await new Promise(r => setTimeout(r, Number(process.env.SETTLE || 800)));
  const box = await (await p.$('.scrub__track')).boundingBox();
  await p.mouse.move(box.x + 10, box.y + box.height / 2); await p.mouse.down();
  for (let i = 0; i <= 30; i++) { await p.mouse.move(box.x + 10 + i * (box.width - 20) / 30, box.y + box.height / 2); await new Promise(r => setTimeout(r, 40)); }
  await p.mouse.up();
  await p.focus('.scrub__handle'); for (let i = 0; i < 10; i++) { await p.keyboard.press('ArrowLeft'); await new Promise(r => setTimeout(r, 120)); }
  await p.keyboard.press('Home'); await new Promise(r => setTimeout(r, 300)); await p.keyboard.press('End');
});
sum('Hours scrubber @820px 4xCPU:', scrub);
await b.close();
