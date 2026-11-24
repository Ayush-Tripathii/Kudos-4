# Kudos Restro Lounge — build notes

One-page site, light theme only. **Stack:** a static `index.html` with vanilla JS and CSS, plus a small Node build step for images and HTML. There's no framework runtime, so it runs as-is from any static host (or XAMPP).

```
index.html            ← generated, do not edit (edit src/index.src.html)
src/index.src.html    ← page template + the client config block (#kudos-config)
assets/css/site.css   ← all styles (tokens, sections, motion, reduced-motion)
assets/js/site.js     ← live state, filter, lightbox, scrubber, rail, booking, map
assets/js/vendor/     ← Lenis 1.1.20 (self-hosted)
assets/fonts/         ← Clash Display 600, Switzer 400/500/600 (Fontshare, self-hosted)
assets/img/           ← 24 images × AVIF/WebP/JPEG × 4–5 widths + manifest.json
tools/                ← build-images.mjs, build-html.mjs, serve.mjs, test scripts
_src/                 ← the 24 Drive originals (284 MB) — never deploy
```

**Rebuild:** `cd tools && npm i && node build-images.mjs && node build-html.mjs`.
**Preview:** `node serve.mjs`, then open http://localhost:5178/.
**Deploy only:** `index.html`, `assets/`, `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `site.webmanifest`, `robots.txt`, `sitemap.xml`.

**Client data lives in one place:** the `<script id="kudos-config">` JSON block in `src/index.src.html`. It holds the phone, WhatsApp, Instagram, menu PDF, maps URL, lat/long, hours per day, last orders, recurring nights and dated events. Set `"showPlaceholders": false` to hide the clay `{{TOKEN}}` markers. The sample text underneath them stays.

---

## 1. Content decisions

**Used from the source (close to verbatim):** every line in ledger 2A.
- Hero: H1, sub-line, and the tile *Come for the view. Stay for the vibe.*
- Food: *Not too fine. Never ordinary.* is the section's H2. *A menu doesn't need fifty ingredients…* is the intro, and *The food should do the talking.* closes the section.
- Story: *We decided to rebuild while keeping the doors open.* is the H2. It also carries *We chose evolution over disruption* and the *continues to evolve* close.
- Founder note: signed Vathsaal Jogani.
- Hours: the golden hour, evening and night mood lines, plus *Different moods. One destination.* and *One destination. Multiple experiences.*
- Visit: *A guest should never feel like a transaction.*
- Footer: *Simple Food. Good Food. Great Evenings.*
- *Get the basics absolutely right.* appears once, in the kitchen line, and is the only trace of the five "Right" fundamentals.

**Cut beyond the 2B list, and why:**
- **The brief's caption "west terrace"** is kept in the hero chip, but I can't verify the terrace orientation from the photos. Client to confirm or change it.
- **The longer signature block** in the footer was cut, as the brief directs.
- **"Multi-cuisine"** appears only in the meta description and JSON-LD.
- **A seventh "statement" section** was not built. *Not too fine. Never ordinary.* does that job as the Food H2, so it doesn't need a thin section of its own.
- **Gallery as its own section** was not built. It's merged into Events, as the brief directs.

**Deviations from the brief (deliberate):**
- **Tonight and the footer are inset rounded forest panels, not full-bleed bands.** §5 asks for `--forest` sections, but §9 rejects any dark section. Inset panels keep the forest as large solid blocks while the page itself stays stone.
- **The fourth filter tab is "Rajasthani & Indian", not "Rajasthani".** Only Laal Maas is strictly Rajasthani. A one-dish tab looks broken, and labelling tandoori chicken as Rajasthani would be inaccurate.
- **Scroll entrances use IntersectionObserver as the fallback, not GSAP.** Native `animation-timeline: view()` runs where supported. GSAP would add about 70 KB to do what about 10 lines of IntersectionObserver code already do.
- **The dish grid has a fifth marker: veg / non-veg / egg dots.** Indian diners expect them. Wontons are marked "unconfirmed" (dashed).
- **The mobile bar appears after 30% of a viewport height,** not 30% of the page. On an 11,000px page, 30% of the page would only arrive after the Food section.
- **The coming-up list shows only the next three nights.** Six identical Saturday rows read as padding.

## 2. Original copy written (for client approval)

**Hero (tile B):**
> A covered rooftop above the old city, looking straight across Lake Pichola to the City Palace. Long lunches in the breeze, cocktails as the sun drops, music until late.

**Kitchen line (Food intro):**
> Rajasthani heat from the handi and the tandoor, a handful of favourites from further away, and one rule in the kitchen: get the basics absolutely right.

**Dish descriptors (each ≤ 12 words):**

| Dish | Descriptor | Marked as |
|---|---|---|
| Laal Maas | Mutton on the bone, chilli-red and slow-cooked the Rajasthani way. | signature, non-veg |
| Chicken Seekh o Naan | Seekh kebab rolled in naan, still smoking from the coal. | signature, non-veg |
| Wontons | Hand-folded parcels, golden at the pleats, chilli dip on the side. | **veg status unconfirmed** |
| Sham Savera | Spinach koftas with a paneer heart, sunk in silky tomato gravy. | signature, veg |
| Tandoori Chicken | Charred at the edges, onion rings underneath. Eat it with your hands. | non-veg |
| Pasta Barbesca | Penne in a punchy tomato sauce, black olives, one basil leaf. | veg |
| Beetroot Tikki | Deep-red patties, crisp outside, each finished with a dot of green chutney. | veg |
| Veg Lasagna | Layers that stretch when you lift them. Bring patience, or a fork. | veg |
| Mexican Rice | Baked under molten cheese, nachos standing guard around the bowl. | veg (assumed) |
| Fried Egg Curry | Two sunny eggs on a spiced tomato gravy. Breakfast, after dark. | egg |

- **Signature choices are mine.** The client should pick the real ones.
- **Every descriptor was written from the photograph,** and all ten dishes match their filenames.
- **Check the name "Pasta Barbesca".** It's kept as supplied, but the dish looks like a puttanesca (olives). Confirm the menu spelling.

**Menu tile:**
> Ten plates photographed. The menu runs longer.

**Tonight module:**
- Afternoon mood: *Lake breeze, long lunches and the palace in full daylight.*
- Closed mood: *The kitchen's resting. We open at noon, and the view will still be here.*
- Empty state: *Nothing ticketed tonight. The playlist, the lake and a table with your name on it.*
- Sunset countdown lines.

**Hours, one reason per state:**
- **Golden:** Ask for {{BEST_TABLE_FOR_SUNSET}} when you book. Get here half an hour before sunset and order the first round while the palace still holds the light.
- **Evening:** Around eight the bar hits its stride. Come as a group, order to share, and let somebody else choose the next song.
- **Late:** After ten the city lights do the decorating. The late crowd is locals, birthdays and people who said "one more" an hour ago.

**Story (≈120 words):** in `src/index.src.html`, `#story`. It covers only the emotional arc. There are no SOPs, no team restructure and no monitoring.

**Events:**
- **Saturday Socials:** "The week's fullest night on the roof…"
- **Purani Playlist:** "Old songs, the ones somebody's parents sang along to in the car…"
- **Confirm:** the Purani Playlist copy assumes it's an old-songs night. The source gives only the name.

**Know before you go:** 10 items, each with a value line (placeholder) and 2–3 sentences of guest copy. The page text is the source of truth, and `build-html.mjs` builds the FAQPage JSON-LD from it.
- **Rain line, from the photographs:** the roof is under a canopy and the glass room is enclosed. Confirm the claim *"we'll move you inside before you have to ask"*.

**Lines I removed during review because they made claims the source doesn't support:** "a person replies, not a bot", "most-ordered plates", and a reference to a lift.

## 3. Image map

| Slot | Drive file (ID) | object-position |
|---|---|---|
| Hero · afternoon + closed | DSC08110 (`1jZjicJh…`) — table, Lake Pichola, City Palace, daylight | 42% 50% |
| Hero · golden hour | DSC8254 (`1e0wurY-…`) — terrace, warm sky, lake + palace | 40% 55% |
| Hero · evening | DSC09270 (`1WvLh3BG…`) — dusk, lamps on, bar lit | 45% 55% |
| Hero · late | DSC09281 (`1ibpFg_t…`) — night, City Palace lit across the lake | 30% 50% |
| Hours · golden | DSC09061 (`1cNP-16x…`) — open terrace over the lake, soft light | 35% 60% |
| Hours · evening | DSC09159 (`1hGGXoap…`) — the amber bar | 50% 62% |
| Hours · night | DSC09293 (`1GYVnmMEI…`) — glass room, city lights | 55% 58% |
| Story | DSC09131 (`1bNMxLXi…`) — dining room at dusk, red lamp | 50% 62% |
| Events · stage | DSC08527-HDR (`1czAfkb3…`) — stage + DJ booth | 48% 58% |
| Gallery | DSC08944 (`1KUy-x3l…`), DSC09016 (`1XZE3v_O…`), DSC09284 (`1YChL_u_…`) | 50/45/50% · 60–62% |
| Dish grid | 10 files from Folder A (see `tools/build-images.mjs`) | per dish, 45–62% y |
| Gallery (dish dupes) | 8. Pasta barbesca (`1_cElnli…`), 10. Laal mans (`17bWNIz0…`) | 50% 62% / 55% |

**Near-duplicates:**
- **Laal Maas:** #11 (bone close-up) is in the grid; #10 (whole plate) went to the gallery.
- **Pasta Barbesca:** #9 (fork lift) is in the grid; #8 (with garlic bread) went to the gallery.

**Coverage:** all 24 images are used, none repeated. The "afternoon" hero photo also serves the "closed" state; that's the same slot in a different state, not padding.

**Pipeline:**
- Grade: neutral-warm (lifted blacks, saturation 0.9, slight warm recomb).
- 2400px long edge.
- AVIF, WebP and JPEG at 480/768/1200/1920/2400 for landscape, or 480/768/1200/1600 for portrait.
- 24px LQIP blur-up.
- **Largest served file: 299 KB**, and every encode is checked against the 300 KB cap.

## 4. Client action list (most damaging first)

1. **`{{WHATSAPP}}`** — every booking CTA depends on it. Until it's set, links open WhatsApp's "choose a contact" picker.
2. **`{{PHONE}}`** — the Call buttons currently scroll to #visit.
3. **`{{ADDRESS}}` + landmark + `{{EXACT_LAT_LNG}}`** — the map pin currently sits on the centre of Lake Pichola and is labelled as a placeholder. The same coordinates drive the sunset maths, which is ±1 minute either way.
4. **`{{HOURS}}` per day + `{{LAST_ORDERS}}`** — 12 PM–1 AM is from the brief and is unconfirmed. It drives the live status, time slots, the hours table and the JSON-LD.
5. **`{{MENU_PDF_URL}}`** — "Download the full menu" points back to #food until it's set.
6. **`{{PRICE_RANGE}}`** — ₹1,200 for two is the brief's example, not a real figure.
7. **`{{EVENT_SCHEDULE}}`** — Saturday Socials start time; Purani Playlist night and time (set `weekday` in config); dated events go in `events[]`.
8. **`{{SITE_URL}}`** — canonical, OG, sitemap and robots. This is also the only remaining Lighthouse SEO failure.
9. **`{{BEST_TABLE_FOR_SUNSET}}`** — appears in the hero, hours and Know-before-you-go.
10. **`{{WEATHER_POLICY}}`**, **`{{RESERVATION_LEAD_TIME}}`**, **`{{LARGE_GROUPS}}`**, **`{{PARKING}}`**
11. **`{{VEG_POLICY}}`**, **`{{CHILDREN}}`**, **`{{DRESS_CODE}}`**, **`{{INSTAGRAM}}`**
12. **Dish facts:** veg status of the wontons and Mexican Rice, the real signature dishes, and the spelling of "Barbesca".
13. **Captions:** confirm "west terrace" and the Purani Playlist premise.
14. **`{{ASSET NEEDED}}`** — cocktails/bar in use, team, a full Saturday. The gallery rail ends with a labelled tile asking for these. There's no drinks photography at all, so "cocktails" is claimed in copy but never shown.

## 5. Measurements

Measured locally on Lighthouse 12.3 with headless Chrome, served by `tools/serve.mjs` on 21 Nov 2026.

| | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| Mobile (Moto G-class sim, 4× CPU, slow 4G) | 87–92 | 100 | 100 | 85* | 2.9–3.0 s | 130–280 ms | 0 |
| Desktop | 100 | 100 | 100 | 85* | 0.7 s | 10 ms | 0 |

\* SEO's only failure is the placeholder `{{SITE_URL}}` canonical. It should score 100 once a real URL is set.

**Fixes made from these runs:**
- Contrast: clay text on stone darkened, white labels on clay, placeholder text set to ink.
- Boot split into yielding tasks, with Lenis started on idle. This took mobile TBT from 500 ms to 130–280 ms.

**Interaction latency** (Event Timing API, real clicks, drags and keys; 4× CPU throttle as a mid-range Android stand-in):

| | Input delay + processing (worst / p75) | Long frames during test |
|---|---|---|
| Dish filter, 412px | 16 ms / 8 ms | View-Transition snapshot frames, up to ~540 ms throttled |
| Hours scrubber, 820px (drag, 10 keys, Home/End) | 24 ms / 12 ms | 2 frames, max ~430 ms (first drag across all three photos) |

**What these numbers do and don't show:**
- **Handlers are cheap.** The main thread clears every interaction in ≤ 24 ms.
- **This is not a true device INP.** Headless Chrome uses a software compositor. It also presents no frame for interactions that cause no visual change, so its full event durations (up to ~1.5 s) mostly measure the wait until the clock's next repaint.
- **Found and fixed during testing:** the hours crossfade first faded whole stacked cards for 600 ms, which delayed presentation by ~350 ms per drag even unthrottled. It now fades only the photograph (320 ms) and swaps the copy instantly. In isolation, that dropped every scrubber interaction to < 16 ms.
- **Still to do: real-device INP.** Run it on a physical mid-range Android with Chrome DevTools' Performance panel, or WebPageTest on a Moto G4/G7, before launch.
- **Known residual risk:** the filter's View Transition snapshots up to 11 photo tiles. If a real device shows a slow frame there, the FLIP fallback already in `site.js` is the cheaper path.

**Not measured:** Safari/iOS, Firefox, real-network LCP from a production host/CDN, and the reduced-motion visual pass. Reduced motion is implemented — no drift, no rolls, no springs, 160 ms fades, and controls still work — but I only checked it in code.
