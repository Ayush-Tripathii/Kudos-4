import sharp from 'sharp';
const [f, seg, outPrefix] = [process.argv[2], Number(process.argv[3]), process.argv[4]];
const m = await sharp(f).metadata(); let i = 0;
for (let y = 0; y < m.height; y += seg) { const h = Math.min(seg, m.height - y); await sharp(f).extract({ left: 0, top: y, width: m.width, height: h }).resize({ width: Math.min(m.width, 1100) }).jpeg({ quality: 70 }).toFile(`${outPrefix}-${i++}.jpg`); }
console.log(i);
