import puppeteer from 'puppeteer-core';
const [OUT, W, H, tag, ...sels] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage(); const mob = Number(W) < 800;
await p.setViewport({ width: Number(W), height: Number(H), isMobile: mob, hasTouch: mob });
await p.goto('http://localhost:5178/index.html', { waitUntil: 'networkidle0' });
for (const s of sels) {
  const [sel, off] = s.split('@');
  await p.evaluate((sel, off) => { const el = document.querySelector(sel); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 70 + Number(off || 0)); }, sel, off);
  await new Promise(r => setTimeout(r, 1400));
  await p.screenshot({ path: `${OUT}/${tag}-${sel.replace(/\W/g, '')}${off || ''}.png` });
}
await b.close();
