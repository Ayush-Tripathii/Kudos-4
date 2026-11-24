/**
 * KUDOS — HTML build
 * src/index.src.html → index.html
 *  • <!--@img key="" alt="" sizes="" class="" pattrs="" priority=""-->  → responsive <picture>
 *  • <!--@dishes-->   → the dish grid (data below is the single source for dish copy)
 *  • <!--@jsonld-->   → Restaurant + FAQPage JSON-LD (FAQ text read from the rendered page)
 *  • /*@heroPreload*\/{} → per-state hero AVIF srcsets for the head preload script
 *
 * Usage: node build-html.mjs   (from /tools; run build-images.mjs first)
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const M = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/img/manifest.json'), 'utf8'));
let html = fs.readFileSync(path.join(ROOT, 'src/index.src.html'), 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const set = (k, ext) => M[k].widths.map((w) => `assets/img/${k}-${w}.${ext} ${w}w`).join(', ');

/** Responsive <picture> with AVIF → WebP → JPEG, explicit dimensions and a blur-up LQIP. */
function picture({ key, alt, sizes, cls = '', pattrs = '', priority = '' }) {
  const m = M[key];
  if (!m) throw new Error('unknown image ' + key);
  const mid = m.widths.find((w) => w >= 1200) || m.widths.at(-1);
  const extra = pattrs.replace(/'/g, '"');
  // priority tiles: lazy so display:none siblings never download; fetchpriority keeps
  // the visible one first in line (the head script also preloads it).
  const loadAttrs = priority ? 'loading="lazy" fetchpriority="high"' : 'loading="lazy"';
  return `<picture class="pic ${cls}" style="--pos:${m.pos};--lqip:url(${m.lqip})" ${extra}>` +
    `<source type="image/avif" srcset="${set(key, 'avif')}" sizes="${sizes}">` +
    `<source type="image/webp" srcset="${set(key, 'webp')}" sizes="${sizes}">` +
    `<img src="assets/img/${key}-${mid}.jpg" srcset="${set(key, 'jpg')}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${esc(alt)}" ${loadAttrs} decoding="async">` +
    `</picture>`;
}

const attrs = (s) => Object.fromEntries([...s.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1] === 'class' ? 'cls' : m[1], m[2]]));
html = html.replace(/<!--@img ([\s\S]*?)-->/g, (_, a) => picture(attrs(a)));

/* ── Dishes ──────────────────────────────────────────────────────────────
   cats: small | main  ×  indian | intl.   sig = signature (client to confirm).
   veg: 'v' | 'n' | '?' (unconfirmed → flagged placeholder).  desc ≤ 12 words.   */
const DISHES = [
  { key: 'dish-laal-maas', name: 'Laal Maas', cats: 'main indian', sig: true, veg: 'n',
    desc: 'Mutton on the bone, chilli-red and slow-cooked the Rajasthani way.',
    alt: 'Close-up of Laal Maas: mutton on the bone in a deep red chilli gravy, Kudos bowl' },
  { key: 'dish-seekh-naan', name: 'Chicken Seekh o Naan', cats: 'small indian', sig: true, veg: 'n',
    desc: 'Seekh kebab rolled in naan, still smoking from the coal.',
    alt: 'Chicken seekh kebab rolled in naan, cut into pieces, with charcoal smoke rising from the plate' },
  { key: 'dish-wonton', name: 'Wontons', cats: 'small intl', sig: false, veg: '?',
    desc: 'Hand-folded parcels, golden at the pleats, chilli dip on the side.',
    alt: 'Golden folded wontons in a white Kudos bowl with a small pot of red chilli dip' },
  { key: 'dish-sham-savera', name: 'Sham Savera', cats: 'main indian', sig: true, veg: 'v',
    desc: 'Spinach koftas with a paneer heart, sunk in silky tomato gravy.',
    alt: 'Overhead view of Sham Savera: green spinach koftas topped with cream in a tomato gravy' },
  { key: 'dish-tandoori', name: 'Tandoori Chicken', cats: 'small indian', sig: false, veg: 'n',
    desc: 'Charred at the edges, onion rings underneath. Eat it with your hands.',
    alt: 'A hand lifting a foil-wrapped tandoori chicken leg from a plate of onion rings' },
  { key: 'dish-pasta', name: 'Pasta Barbesca', cats: 'main intl', sig: false, veg: 'v',
    desc: 'Penne in a punchy tomato sauce, black olives, one basil leaf.',
    alt: 'A forkful of penne lifted from a bowl of Pasta Barbesca with black olives and basil' },
  { key: 'dish-beetroot-tikki', name: 'Beetroot Tikki', cats: 'small indian', sig: false, veg: 'v',
    desc: 'Deep-red patties, crisp outside, each finished with a dot of green chutney.',
    alt: 'Seven round beetroot tikkis, each topped with green chutney, in a white Kudos bowl' },
  { key: 'dish-veg-lasagna', name: 'Veg Lasagna', cats: 'main intl', sig: false, veg: 'v',
    desc: 'Layers that stretch when you lift them. Bring patience, or a fork.',
    alt: 'A slice of vegetable lasagna being lifted from the baking dish, cheese stretching beneath it' },
  { key: 'dish-mexican-rice', name: 'Mexican Rice', cats: 'main intl', sig: false, veg: 'v',
    desc: 'Baked under molten cheese, nachos standing guard around the bowl.',
    alt: 'A bowl of baked Mexican rice under melted cheese, ringed with nacho chips, on a wooden board' },
  { key: 'dish-egg-curry', name: 'Fried Egg Curry', cats: 'main indian', sig: false, veg: 'e',
    desc: 'Two sunny eggs on a spiced tomato gravy. Breakfast, after dark.',
    alt: 'Two sunny-side-up fried eggs on a spiced red tomato gravy in a white Kudos bowl' },
];
const vegMark = { v: '<span class="vg vg--v" title="Vegetarian"><span class="sr-only">Vegetarian</span></span>',
  n: '<span class="vg vg--n" title="Non-vegetarian"><span class="sr-only">Non-vegetarian</span></span>',
  e: '<span class="vg vg--e" title="Contains egg"><span class="sr-only">Contains egg</span></span>',
  '?': '<span class="vg vg--q ph" data-ph="VEG?" title="Veg status to confirm"><span class="sr-only">Veg status to be confirmed</span></span>' };

const dishLi = (d, i) => `
    <li class="dish" data-cat="${d.cats}" style="view-transition-name:dish-${i}">
      <button class="dish__btn" data-lb="food" aria-label="${esc(d.name)} — open larger photo">
        ${picture({ key: d.key, alt: d.alt, sizes: '(min-width:1440px) 330px, (min-width:1024px) 24vw, (min-width:768px) 32vw, 48vw', cls: 'hov', pattrs: `data-cap='${esc(d.name + ' — ' + d.desc)}'` })}
        <span class="dish__zoom" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>
        </span>
        ${d.sig ? '<span class="dish__sig-badge">Signature</span>' : ''}
      </button>
      <div class="dish__meta">
        <h3 class="dish__name">${d.name}</h3>
        <div class="dish__tags">
          ${vegMark[d.veg]}
        </div>
      </div>
      <p class="dish__desc">${d.desc}</p>
    </li>`;

const menuTile = `
    <li class="dish dish--menu" data-cat="always" style="view-transition-name:dish-menu">
      <div class="menutile tile tile--forest">
        <div class="menutile__badge">Full Culinary Experience</div>
        <p class="label">Rooftop Dining &amp; Bar</p>
        <p class="menutile__h">Ten plates photographed. The menu runs longer.</p>
        <p class="menutile__sub">Handi curries, charcoal tandoor, artisanal pastas, thin-crust pizzas &amp; signature lakeside cocktails.</p>
        <div class="menutile__actions">
          <a class="btn btn--clay" data-live="menuLink3" href="#food" target="_blank" rel="noopener">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Menu <span class="small">(PDF)</span>
          </a>
          <a class="btn btn--line-light" href="#visit">Reserve a table</a>
        </div>
        <p class="small menutile__p"><span class="ph" data-ph="PRICE_RANGE">About ₹1,200 for two</span> · Dedicated veg &amp; non-veg preparations</p>
      </div>
    </li>`;

const items = DISHES.map(dishLi);
items.push(menuTile);
html = html.replace('<!--@dishes-->', `<ul class="dishes" role="list" data-dishes>${items.join('')}\n  </ul>`);

/* ── Hero preload map (per live state) ── */
const hp = { afternoon: 'hero-afternoon', closed: 'hero-afternoon', golden: 'hero-golden', evening: 'hero-evening', late: 'hero-late' };
html = html.replace('/*@heroPreload*/{}', JSON.stringify(Object.fromEntries(Object.entries(hp).map(([s, k]) => [s, set(k, 'avif')]))));

/* ── JSON-LD ── */
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const faq = [...html.matchAll(/<article class="kb[^"]*" data-q="([^"]+)">([\s\S]*?)<\/article>/g)].map(([, q, body]) => {
  const v = strip((body.match(/class="kb__v">([\s\S]*?)<\/p>/) || body.match(/<table[\s\S]*?<\/table>/) || ['', ''])[1] || '');
  const a = strip((body.match(/class="kb__a">([\s\S]*?)<\/p>/) || ['', ''])[1]);
  return { '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: (v ? v + '. ' : '') + a } };
});
const SITE_URL = 'https://ayush-tripathii.github.io/Kudos-4';
const restaurant = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  '@id': `${SITE_URL}/#restaurant`,
  name: 'Kudos Restro Lounge',
  description: 'Rooftop restro lounge and multi-cuisine restaurant in Udaipur with a Lake Pichola and City Palace view. Sunset dining, cocktails, and music nights including Saturday Socials and Purani Playlist.',
  url: `${SITE_URL}/`,
  image: [`${SITE_URL}/assets/og-kudos.jpg`],
  servesCuisine: ['Rajasthani', 'North Indian', 'Italian', 'Mexican', 'Pan-Asian', 'Multi-cuisine'],
  priceRange: '₹1,200 approx.',
  telephone: '+91 98290 12345',
  menu: `${SITE_URL}/#food`,
  hasMap: 'https://maps.google.com/?q=Kudos+Restro+Lounge+Udaipur',
  acceptsReservations: 'True',
  address: { '@type': 'PostalAddress', streetAddress: 'Top Floor, 57 Ambavgarh, near Lake Pichola', addressLocality: 'Udaipur', addressRegion: 'Rajasthan', postalCode: '313001', addressCountry: 'IN' },
  geo: { '@type': 'GeoCoordinates', latitude: '24.5764', longitude: '73.6835' },
  openingHours: ['Mo-Su 12:00-01:00'],
  sameAs: ['https://instagram.com/kudos.udaipur'],
  founder: { '@type': 'Person', name: 'Vathsaal Jogani' },
  event: [{ '@type': 'Event', name: 'Saturday Socials', eventSchedule: { '@type': 'Schedule', byDay: 'https://schema.org/Saturday', repeatFrequency: 'P1W' }, location: { '@id': `${SITE_URL}/#restaurant` } }],
};
const ld = `<script type="application/ld+json">${JSON.stringify(restaurant)}</script>\n` +
  `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq })}</script>`;
html = html.replace('<!--@jsonld-->', ld);

fs.writeFileSync(path.join(ROOT, 'index.html'), html);
console.log('index.html written —', faq.length, 'FAQ entries,', DISHES.length, 'dishes,', Math.round(html.length / 1024) + 'KB');
