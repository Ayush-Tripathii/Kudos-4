/**
 * KUDOS — image pipeline
 * original (2–24MB) → grade → 2400px long edge → AVIF + WebP + JPEG at srcset widths
 * → 24px base64 LQIP → assets/img/manifest.json (consumed by build-html.mjs)
 *
 * Hard rule from the brief: no served file above ~300KB. Every encode is checked and
 * re-encoded at lower quality until it fits.
 *
 * Usage: node build-images.mjs   (from /tools)
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('..');
const SRC = path.join(ROOT, '_src');
const OUT = path.join(ROOT, 'assets', 'img');
const CAP = 300 * 1024;
fs.mkdirSync(OUT, { recursive: true });

/* key → source file + deliberate object-position (tiles reframe on hover, so the
   resting crop must already sit on the subject). driveId kept for the image map. */
export const IMAGES = {
  // ── Dish grid (Folder A) ──
  'dish-wonton':        { src: 'dish/wonton.jpg',           pos: '58% 62%', drive: '1FChywn0cPZ5xjJZeV--OwhbRY8QffMAM' },
  'dish-mexican-rice':  { src: 'dish/mexican-rice.jpg',     pos: '50% 55%', drive: '18JEFCZWgW84r2I7Lx7kZP7jpJQXk4hFz' },
  'dish-beetroot-tikki':{ src: 'dish/beetroot-tikki.jpg',   pos: '50% 62%', drive: '19h228D8-vkakRhRN7mUV5tIQHfHwGuC7' },
  'dish-tandoori':      { src: 'dish/tandoori-chicken.jpg', pos: '50% 52%', drive: '1VfcFVU-oLpWLqpm8AFqcbv3MoaKa51kp' },
  'dish-seekh-naan':    { src: 'dish/seekh-naan.jpg',       pos: '55% 58%', drive: '1rOUHmvH26oRiyfVDG0a5Hw83Dm89onVL' },
  'dish-sham-savera':   { src: 'dish/sham-savera.jpg',      pos: '50% 48%', drive: '1_GqhRt6AhGeyRRKlNV3HrS_UK5Zg-mOZ' },
  'dish-pasta':         { src: 'dish/pasta-9.jpg',          pos: '50% 60%', drive: '12FUMImDCUbtLfr7c6a0cx3B2rgerWhDt' },
  'dish-laal-maas':     { src: 'dish/laal-11.jpg',          pos: '50% 45%', drive: '1PC132h6XcVjTkFrplGtz1PdAdgdJTWIa' },
  'dish-veg-lasagna':   { src: 'dish/veg-lasagna.jpg',      pos: '50% 60%', drive: '1c2ThB3cDMwrbfnzX2hLMl1pF1z8BSUin' },
  'dish-egg-curry':     { src: 'dish/fried-egg-curry.jpg',  pos: '50% 56%', drive: '1WeqKePpULZHM9uGLDoFdb8GkAffMV1R4' },
  // near-duplicates → gallery
  'gal-pasta-alt':      { src: 'dish/pasta-8.jpg',          pos: '50% 62%', drive: '1_cElnlizoCOdk9fgljV7cU8vfy8uPy-M' },
  'gal-laal-alt':       { src: 'dish/laal-10.jpg',          pos: '50% 55%', drive: '17bWNIz04GMkufkOhw8W5f_PFnxDjx-dL' },

  // ── Property (Folder B) ──
  // hero time-of-day states
  'hero-afternoon':     { src: 'prop/DSC08110.jpg',         pos: '42% 50%', drive: '1jZjicJh0lUUeWxv9e2ECO-UI25ukllvE' },
  'hero-golden':        { src: 'prop/DSC8254.jpg',          pos: '40% 55%', drive: '1e0wurY-d6-LR2Pd-XIINWIBHF5-nU5pn' },
  'hero-evening':       { src: 'prop/DSC09270.jpg',         pos: '45% 55%', drive: '1WvLh3BGI4beyY65Qs05fMCxjg8WjxLJG' },
  'hero-late':          { src: 'prop/DSC09281.jpg',         pos: '30% 50%', drive: '1ibpFg_tPmGnTQLZDrbjeIutxk71B8VNr' },
  // hours scrubber
  'hours-golden':       { src: 'prop/DSC09061.jpg',         pos: '35% 60%', drive: '1cNP-16x1Tjl7vUzEjGXT8PVypDIjmdVd' },
  'hours-evening':      { src: 'prop/DSC09159.jpg',         pos: '50% 62%', drive: '1hGGXoapCYt2QzWBl61RQL28pGAx5UaKx' },
  'hours-night':        { src: 'prop/DSC09293.jpg',         pos: '55% 58%', drive: '1GYVnmMEIIofSA--VdqYOyHBh_i8EP9Vj' },
  // story
  'story':              { src: 'prop/DSC09131.jpg',         pos: '50% 62%', drive: '1bNMxLXiam2OCvPUBlOBMAMYbj-QunhZr' },
  // events
  'events-stage':       { src: 'prop/DSC08527-HDR.jpg',     pos: '48% 58%', drive: '1czAfkb3FRYn_DNhcD2T3wNhbJVh-edq3' },
  // gallery
  'gal-terrace-wide':   { src: 'prop/DSC08944.jpg',         pos: '50% 60%', drive: '1KUy-x3liavpkshDjy3qoSY_HmZ2hCA2G' },
  'gal-terrace-lamps':  { src: 'prop/DSC09016.jpg',         pos: '45% 62%', drive: '1XZE3v_O6Nuqe-AGhrZNzsyrarlVym4Kd' },
  'gal-glass-room':     { src: 'prop/DSC09284.jpg',         pos: '50% 60%', drive: '1YChL_u_G3CkBegTNKyPNhLPEWRGFrd-N' },
};

const LAND = [480, 768, 1200, 1920, 2400];
const PORT = [480, 768, 1200, 1600]; // 1600w = 2400px long edge on a 2:3 portrait

/** Neutral-warm grade: lift the black floor, ease highlights, pull saturation back,
 *  nudge temperature a hair warm. Deliberately not the orange "restaurant" look. */
function grade(img) {
  return img
    .rotate()
    .linear(0.94, 9)                       // lifted shadows, softened highlights
    .modulate({ saturation: 0.9 })         // restrained saturation
    .recomb([[1.015, 0, 0], [0, 1, 0], [0, 0, 0.975]]); // ~neutral-warm
}

async function encodeCapped(pipe, fmt, file) {
  const q = { avif: [52, 44, 38, 32, 28], webp: [74, 66, 58, 50, 44, 38], jpeg: [78, 70, 62, 54, 48, 42] }[fmt];
  for (const quality of q) {
    const opts = fmt === 'avif' ? { quality, effort: 4 } : fmt === 'webp' ? { quality, effort: 5 } : { quality, mozjpeg: true };
    const buf = await pipe.clone()[fmt](opts).toBuffer();
    if (buf.length <= CAP || quality === q[q.length - 1]) {
      fs.writeFileSync(file, buf);
      return buf.length;
    }
  }
}

const manifest = {};
let biggest = 0;
const keys = Object.keys(IMAGES);
async function run(key) {
  const def = IMAGES[key];
  const base = grade(sharp(path.join(SRC, def.src)).withMetadata({ orientation: undefined }));
  const graded = await base.toBuffer({ resolveWithObject: true }); // decode once
  const { width: W, height: H } = graded.info;
  const portrait = H > W;
  const widths = portrait ? PORT : LAND;
  const ratio = H / W;
  const srcset = [];
  for (const w of widths) {
    const pipe = sharp(graded.data).resize({ width: w });
    for (const [fmt, ext] of [['avif', 'avif'], ['webp', 'webp'], ['jpeg', 'jpg']]) {
      const size = await encodeCapped(pipe, fmt, path.join(OUT, `${key}-${w}.${ext}`));
      biggest = Math.max(biggest, size);
      if (size > CAP) console.warn('OVER CAP', key, w, fmt, size);
    }
    srcset.push(w);
  }
  const lq = await sharp(graded.data).resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
  manifest[key] = {
    ...def,
    widths: srcset,
    w: srcset.at(-1),
    h: Math.round(srcset.at(-1) * ratio),
    lqip: 'data:image/webp;base64,' + lq.toString('base64'),
  };
  console.log('done', key, portrait ? 'portrait' : 'landscape');
}

// small concurrency so 24MB sources don't exhaust memory
const pool = 3;
for (let i = 0; i < keys.length; i += pool) await Promise.all(keys.slice(i, i + pool).map(run));
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));

// ── OG card + icons ──
await grade(sharp(path.join(SRC, IMAGES['hero-afternoon'].src))).resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(ROOT, 'assets', 'og-kudos.jpg'));
const icon = fs.readFileSync(path.join(ROOT, 'favicon.svg'));
await sharp(icon).resize(180, 180).png().toFile(path.join(ROOT, 'apple-touch-icon.png'));
await sharp(icon).resize(192, 192).png().toFile(path.join(ROOT, 'assets', 'icon-192.png'));
await sharp(icon).resize(512, 512).png().toFile(path.join(ROOT, 'assets', 'icon-512.png'));
await sharp(icon).resize(32, 32).png().toFile(path.join(ROOT, 'favicon-32.png'));
console.log('largest served file:', Math.round(biggest / 1024) + 'KB');
