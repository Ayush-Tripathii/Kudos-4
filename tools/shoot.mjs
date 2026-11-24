import puppeteer from 'puppeteer-core';
const OUT = process.argv[2]; const URL = 'http://localhost:5178/index.html';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
for (const [name, w, h, mobile] of [['desk', 1440, 900, false], ['mob', 390, 844, true]]) {
  const p = await b.newPage();
  const errs = [];
  p.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errs.push(m.text()));
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  p.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url().slice(0, 100)));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await p.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  // scroll through so lazy images load
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += h * 0.8) { await p.evaluate((y) => window.scrollTo(0, y), y); await new Promise(r => setTimeout(r, 250)); }
  await p.evaluate(() => window.scrollTo(0, 0)); await new Promise(r => setTimeout(r, 800));
  await p.screenshot({ path: `${OUT}/${name}-top.png` });
  await p.evaluate(() => document.querySelectorAll('.rv').forEach(e => e.classList.add('is-in')));
  await p.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: true });
  console.log(name, 'height', H, 'errors:', JSON.stringify(errs, null, 0));
  const st = await p.evaluate(() => ({ state: document.documentElement.dataset.state, pill: document.querySelector('[data-live=pill]').textContent, sunset: document.querySelector('[data-live=sunset]').textContent, hscroll: document.documentElement.scrollWidth > innerWidth }));
  console.log(JSON.stringify(st));
}
await b.close();
