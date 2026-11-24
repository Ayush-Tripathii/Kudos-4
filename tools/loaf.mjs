import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage(); await p.setViewport({ width: 820, height: 1180 });
const cdp = await p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await p.goto('http://localhost:5178/index.html', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2500));
await p.evaluate(() => document.querySelector('.scrub').scrollIntoView({ block: 'center' })); await new Promise(r => setTimeout(r, 1500));
await p.evaluate(() => { window.__lf = []; new PerformanceObserver(l => l.getEntries().forEach(e => window.__lf.push({ d: Math.round(e.duration), render: Math.round(e.renderStart ? e.startTime + e.duration - e.renderStart : 0), style: Math.round(e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0), scripts: e.scripts.map(s => (s.sourceFunctionName || s.invoker) + ':' + Math.round(s.duration)).join(',') }))).observe({ type: 'long-animation-frame' }); });
await new Promise(r => setTimeout(r, 2000));
const idle = await p.evaluate(() => window.__lf.splice(0));
console.log('IDLE 2s frames>50ms:', idle.length, JSON.stringify(idle.slice(0, 4)));
const box = await (await p.$('.scrub__track')).boundingBox(); await p.mouse.move(box.x+10, box.y+box.height/2); await p.mouse.down(); for (let i=0;i<=30;i++){ await p.mouse.move(box.x+10+i*(box.width-20)/30, box.y+box.height/2); await new Promise(r=>setTimeout(r,40)); } await p.mouse.up(); console.log('DRAG:', JSON.stringify(await p.evaluate(() => window.__lf.splice(0).slice(0,5)))); await p.focus('.scrub__handle');
for (let i = 0; i < 4; i++) { await p.keyboard.press('ArrowRight'); await new Promise(r => setTimeout(r, 400)); }
console.log('KEYS:', JSON.stringify(await p.evaluate(() => window.__lf.slice(0, 6))));
console.log(await p.evaluate(() => ({ els: document.querySelectorAll('*').length, rv: document.querySelectorAll('.rv').length, anims: document.getAnimations().length, animNames: [...new Set(document.getAnimations().map(a => a.animationName || a.constructor.name))] })));
await b.close();
