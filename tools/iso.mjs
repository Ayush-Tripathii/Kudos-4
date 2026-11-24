import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: process.env.GPU ? ['--enable-gpu','--use-angle=d3d11','--enable-features=Vulkan','--ignore-gpu-blocklist'] : [] });
async function trial(label, css, rate = 4, keysOnly = false) {
  const p = await b.newPage(); await p.setViewport({ width: 820, height: 1180 });
  const cdp = await p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await p.goto('http://localhost:5178/index.html', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2500));
  if (css) await p.addStyleTag({ content: css });
  await p.evaluate(() => document.querySelector('.scrub').scrollIntoView({ block: 'center' })); await new Promise(r => setTimeout(r, 1500));
  await p.evaluate(() => { window.__ev = []; new PerformanceObserver(l => l.getEntries().forEach(e => e.interactionId && window.__ev.push({ n: e.name, d: e.duration, pd: Math.round(e.startTime + e.duration - e.processingEnd), proc: Math.round(e.processingEnd - e.processingStart), inp: Math.round(e.processingStart - e.startTime) }))).observe({ type: 'event', durationThreshold: 16 }); });
  if (!keysOnly) { const box = await (await p.$('.scrub__track')).boundingBox(); await p.mouse.move(box.x + 10, box.y + 28); await p.mouse.down(); for (let i = 0; i <= 20; i++) { await p.mouse.move(box.x + 10 + i * (box.width - 20) / 20, box.y + 28); await new Promise(r => setTimeout(r, 40)); } await p.mouse.up(); }
  await p.focus('.scrub__handle'); for (let i = 0; i < 10; i++) { await p.keyboard.press('ArrowLeft'); await new Promise(r => setTimeout(r, Number(process.env.GAP||300))); } if (process.env.HE) { await p.keyboard.press('Home'); await new Promise(r => setTimeout(r, 300)); await p.keyboard.press('End'); }
  await new Promise(r => setTimeout(r, 800));
  const ev = await p.evaluate(() => window.__ev); await p.close();
  const k = ev.filter(e => e.n === 'keydown'); const w = [...ev].sort((a, b) => b.d - a.d)[0];
  console.log(label.padEnd(26), 'worst', w?.d ?? '<16', JSON.stringify(w || {}), '| keydown max', Math.max(0, ...k.map(e => e.d)));
}
const M=".hcard{opacity:1!important;visibility:visible!important;transition:none!important;will-change:auto!important}.hcard:not(.is-active) .hcard__copy{visibility:hidden}.hcard__media{opacity:0;transition:opacity 320ms}.hcard.is-active{z-index:1}.hcard.is-active .hcard__media{opacity:1}";
await trial("file CSS only", "");

await b.close();
