/* ==========================================================================
   KUDOS RESTRO LOUNGE — site.js (vanilla, no framework)
   1  config + helpers          7  hours scrubber (spring, keyboard, now marker)
   2  IST clock + solar calc    8  gallery rail (drag + inertia, keys, progress)
   3  live state engine         9  booking composer → WhatsApp
   4  tonight + schedule       10  map (lazy, light-styled)
   5  dish filter (VT / FLIP)  11  chrome: topbar, mobile bar, Lenis, reveals
   6  lightbox (shared)        12  boot
   Everything time-based reads real Asia/Kolkata time, never scroll position.
   ========================================================================== */
(() => {
  'use strict';

  /* ── 1. Config + helpers ─────────────────────────────────────────────── */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const CFG = JSON.parse($('#kudos-config').textContent);
  if (!CFG.showPlaceholders) root.classList.remove('ph-on');

  const live = (k) => $$(`[data-live="${k}"]`);
  const setText = (k, v) => live(k).forEach((el) => { if (el.textContent !== v) el.textContent = v; });
  const setHref = (k, v) => live(k).forEach((el) => el.setAttribute('href', v));
  const phSpan = (key, txt) => `<span class="ph" data-ph="${key}">${txt}</span>`;

  const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const OPEN = toMin(CFG.hours.open);            // 720
  const CLOSE = toMin(CFG.hours.close);          // 60  (past midnight)
  const fmt12 = (min, short = false) => {
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    const h = Math.floor(min / 60), m = min % 60, ap = h < 12 ? 'AM' : 'PM', h12 = h % 12 || 12;
    return short && m === 0 ? `${h12} ${ap}` : `${h12}:${String(m).padStart(2, '0')} ${ap}`;
  };
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const wa = (text) => `https://wa.me/${(CFG.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  const tel = CFG.phone ? `tel:${CFG.phone.replace(/\s/g, '')}` : '#visit';

  /* ── 2. IST clock + solar calculation ────────────────────────────────── */
  const IST = 330; // minutes east of UTC — Udaipur, regardless of visitor's timezone
  function ist(t = Date.now()) {
    const d = new Date(t + IST * 60000);
    const h = d.getUTCHours(), mi = d.getUTCMinutes();
    return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay(), h, mi, s: d.getUTCSeconds(), min: h * 60 + mi, ts: t };
  }
  /** Calendar day in IST, offset by n days → {y,mo,d,wd} */
  function istDay(n = 0) { return ist(Date.now() + n * 86400000); }
  const dayLabel = (x) => `${DAYS[x.wd].slice(0, 3)}, ${x.d} ${MONTHS[x.mo]}`;
  const isoDay = (x) => `${x.y}-${String(x.mo + 1).padStart(2, '0')}-${String(x.d).padStart(2, '0')}`;

  /** Sunset in IST minutes — standard sunrise/sunset algorithm (Almanac for Computers,
   *  zenith 90.833° incl. refraction). Accurate to ~1–2 min; no API. */
  function sunsetIST(y, m1, d, lat, lng) {
    const R = Math.PI / 180;
    const N = Math.floor(275 * m1 / 9) - Math.floor((m1 + 9) / 12) * (1 + Math.floor((y - 4 * Math.floor(y / 4) + 2) / 3)) + d - 30;
    const lh = lng / 15, t = N + (18 - lh) / 24;
    const M = 0.9856 * t - 3.289;
    const L = (M + 1.916 * Math.sin(M * R) + 0.020 * Math.sin(2 * M * R) + 282.634 + 360) % 360;
    let RA = (Math.atan(0.91764 * Math.tan(L * R)) / R + 360) % 360;
    RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
    const sinD = 0.39782 * Math.sin(L * R), cosD = Math.cos(Math.asin(sinD));
    const cosH = (Math.cos(90.833 * R) - sinD * Math.sin(lat * R)) / (cosD * Math.cos(lat * R));
    if (cosH > 1 || cosH < -1) return null;
    const H = Math.acos(cosH) / R / 15;
    const UT = ((H + RA - 0.06571 * t - 6.622 - lh) % 24 + 24) % 24;
    return Math.round(UT * 60 + IST) % 1440;
  }
  const sunsetFor = (x) => sunsetIST(x.y, x.mo + 1, x.d, CFG.geo.lat, CFG.geo.lng) ?? 1110;

  /* ── 3. Live state engine ────────────────────────────────────────────── */
  const STATES = {
    afternoon: { pill: `Open · closes ${fmt12(CLOSE)}`, label: 'Open', big: 'Afternoon', caption: 'Lake Pichola · west terrace',
      mood: 'Lake breeze, long lunches and the palace in full daylight.' },
    golden: { pill: 'Golden hour now', label: 'Golden hour', big: 'Golden hour', caption: 'Golden hour · lake side',
      mood: 'The sun begins to settle over Udaipur. The city changes colour. Lake Pichola reflects the evening sky.' },
    evening: { pill: `Evening service · till ${fmt12(CLOSE, true)}`, label: 'Evening service', big: 'Evening', caption: 'Evening · bar side',
      mood: 'The music finds its rhythm. The bar becomes more active. Friends gather, couples settle in, conversations grow louder and the energy begins to build.' },
    late: { pill: `Late night · closes ${fmt12(CLOSE)}`, label: 'Late night', big: 'Late night', caption: 'City Palace, lit · after ten',
      mood: 'The night belongs to the people.' },
    closed: { pill: `Opens ${fmt12(OPEN)}`, label: `Opens ${fmt12(OPEN)}`, big: 'Resting', caption: 'Lake Pichola · west terrace',
      mood: "The kitchen's resting. We open at noon, and the view will still be here." },
  };

  /** State for a given IST minute. Golden hour tracks the real sunset:
   *  starts 75 min before it, hands over to evening 30 min after. */
  function stateAt(min, sunset) {
    if (CLOSE < OPEN ? (min >= CLOSE && min < OPEN) : (min >= CLOSE || min < OPEN)) return 'closed';
    if (min < 120) return 'late';                               // 00:00 → close
    if (min >= 1320) return 'late';                             // 22:00 →
    if (min >= sunset + 30) return 'evening';
    if (min >= sunset - 75) return 'golden';
    return 'afternoon';
  }

  let current = root.dataset.state;
  function applyState() {
    const now = ist(), ss = sunsetFor(now), s = stateAt(now.min, ss), S = STATES[s];
    if (s !== current) swapHero(current, s);
    current = s;
    root.dataset.state = s;
    setText('pill', S.pill);
    setText('stateLabel', S.label);
    setText('stateBig', S.big);
    setText('mood', S.mood);
    setText('heroCaption', S.caption);
    setText('todayWord', now.min >= 960 || now.min < CLOSE ? 'tonight' : 'today');
    renderSun(now, ss);
    renderTonight(now);
    return now;
  }

  /** Crossfade the hero photograph between time-of-day states. */
  function swapHero(from, to) {
    const out = $(`.hero-pic[data-for~="${from}"]`), inn = $(`.hero-pic[data-for~="${to}"]`);
    if (!inn || out === inn) return;
    out && out.classList.add('is-leaving');
    out && (out.style.display = 'block');
    inn.classList.add('is-entering');
    setTimeout(() => { inn.classList.remove('is-entering'); if (out) { out.classList.remove('is-leaving'); out.style.display = ''; } }, RM.matches ? 200 : 1300);
  }

  /** Clock tile: h:mm + seconds, digit-roll on change. */
  const clockEl = live('clock')[0];
  let lastClock = '';
  function tickClock() {
    const n = ist();
    const h12 = n.h % 12 || 12, ap = n.h < 12 ? 'AM' : 'PM';
    const main = `${h12}:${String(n.mi).padStart(2, '0')}`, sec = `:${String(n.s).padStart(2, '0')}`;
    const str = main + sec;
    if (!clockEl) return;
    if (str.length !== lastClock.length) {
      clockEl.innerHTML = [...main].map((c) => `<span class="dg">${c}</span>`).join('') +
        `<span class="sec">${[...sec].map((c) => `<span class="dg">${c}</span>`).join('')} ${ap}</span>`;
    } else {
      const digs = $$('.dg', clockEl);
      [...str].forEach((c, i) => {
        const el = digs[i];
        if (el && el.textContent !== c) {
          el.textContent = c;
          if (!RM.matches) { el.classList.remove('roll'); void el.offsetWidth; el.classList.add('roll'); }
        }
      });
      const secEl = $('.sec', clockEl); if (secEl && !secEl.textContent.endsWith(ap)) secEl.lastChild.textContent = ' ' + ap;
    }
    lastClock = str;
    clockEl.parentElement.setAttribute('aria-label', `Current time in Udaipur: ${h12}:${String(n.mi).padStart(2, '0')} ${ap}`);
  }

  /* ── 4. Tonight module + schedule ────────────────────────────────────── */
  function renderSun(now, ss) {
    const t = fmt12(ss);
    ['sunset', 'sunsetShort', 'sunsetShort2', 'sunsetShort3'].forEach((k) => setText(k, t));
    const until = ss - now.min, meter = live('sunMeter')[0];
    let msg, pct;
    if (until > 180) {
      msg = `Golden hour starts around ${fmt12(ss - 75)}. Book a railing table and get here early.`; pct = 0;
    } else if (until > 0 && until <= 180) {
      const h = Math.floor(until / 60), m = until % 60;
      msg = `Sunset in ${h ? h + 'h ' : ''}${m}m. ${until <= 75 ? 'The light is already turning.' : 'Still time to get a table by the railing.'}`;
      pct = (180 - until) / 180 * 100;
    } else if (until <= 0 && until > -40) {
      msg = 'The sun just went down behind the hills. The lake holds the colour for a while yet.'; pct = 100;
    } else {
      const tm = istDay(1);
      msg = `The sun's down. Tomorrow's sunset: ${fmt12(sunsetIST(tm.y, tm.mo + 1, tm.d, CFG.geo.lat, CFG.geo.lng) ?? ss)}.`; pct = 100;
    }
    setText('sunsetDetail', msg);
    if (meter) meter.style.width = pct + '%';
  }

  /** Events for an IST day: dated entries from config win, then recurring nights. */
  function eventsOn(x) {
    const iso = isoDay(x);
    const dated = (CFG.events || []).filter((e) => e.date === iso);
    const rec = (CFG.recurring || []).filter((r) => r.weekday === x.wd).map((r) => ({ ...r, date: iso }));
    return [...dated, ...rec];
  }
  const detailHTML = (s) => s && s.includes('{{') ? phSpan('EVENT_SCHEDULE', 'Start time to be announced') : (s || '');

  function renderTonight(now) {
    // after midnight but before close, "tonight" is still yesterday's service
    const day = now.min < CLOSE ? istDay(-1) : istDay(0);
    const ev = eventsOn(day)[0];
    const [nameEl] = live('eventName'), [detEl] = live('eventDetail');
    if (ev) {
      nameEl.textContent = ev.name;
      detEl.innerHTML = detailHTML(ev.detail);
    } else {
      nameEl.textContent = 'Just the roof';
      const nextSat = [...Array(7)].map((_, i) => istDay(i + 1)).find((d) => eventsOn(d).length);
      detEl.textContent = `Nothing ticketed tonight. The playlist, the lake and a table with your name on it.${nextSat ? ` Next up: ${eventsOn(nextSat)[0].name}, ${DAYS[nextSat.wd]}.` : ''}`;
    }
    setHref('waTonight', wa(`Hi Kudos! I'd like a table tonight (${dayLabel(day)}) for __ people, around __ PM.`));
  }

  function renderSchedule() {
    const list = live('schedule')[0]; if (!list) return;
    const rows = [];
    // next 3 nights only — a list of identical Saturdays reads as padding
    for (let i = 0; i < 42 && rows.length < 3; i++) {
      const x = istDay(i);
      eventsOn(x).forEach((e) => rows.length < 3 && rows.push({ x, e }));
    }
    if (!rows.length) return; // written empty state stays in the HTML
    list.innerHTML = rows.map(({ x, e }) => `
      <li><span class="sched__date">${dayLabel(x)}</span>
        <div><p class="sched__name">${e.name}</p><p class="sched__detail">${detailHTML(e.detail)}</p></div>
        <a class="btn btn--line btn--sm" href="${wa(`Hi Kudos! I'd like a table for ${e.name} on ${dayLabel(x)}, for __ people.`)}" target="_blank" rel="noopener">Book</a></li>`).join('');
    const pur = (CFG.recurring || []).find((r) => /purani/i.test(r.name));
    if (pur && pur.weekday != null) setText('puraniDay', `Every ${DAYS[pur.weekday]}`);
  }

  function renderHoursTable() {
    const t = live('hoursTable')[0]; if (!t) return;
    const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const today = (ist().wd + 6) % 7;
    t.innerHTML = '<tbody>' + keys.map((k, i) => {
      const v = CFG.hours.days[k];
      const val = v ? `${fmt12(toMin(v[0]))} – ${fmt12(toMin(v[1]))}` : 'Closed';
      return `<tr class="${i === today ? 'is-today' : ''}"><th scope="row">${names[i]}</th><td>${phSpan('HOURS', val)}</td></tr>`;
    }).join('') + '</tbody>';
  }

  /* ── 5. Dish filter — View Transitions, FLIP fallback ────────────────── */
  function initFilter() {
    const chips = $$('.fchip'), dishes = $$('.dish'), status = live('filterStatus')[0];
    const apply = (f) => {
      let n = 0;
      dishes.forEach((li) => {
        const c = li.dataset.cat.split(' ');
        const show = f === 'all' || c.includes('always') || c.includes(f);
        li.hidden = !show; if (show && !c.includes('always')) n++;
      });
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === f)));
      if (status) status.textContent = `${n} dishes shown`;
    };
    const flip = (f) => {
      const first = new Map(dishes.map((d) => [d, d.getBoundingClientRect()]));
      apply(f);
      dishes.forEach((d) => {
        if (d.hidden) return;
        const a = first.get(d), b = d.getBoundingClientRect();
        if (!a.width) { d.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }); return; }
        const dx = a.left - b.left, dy = a.top - b.top;
        if (dx || dy) d.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      });
    };
    chips.forEach((c) => c.addEventListener('click', () => {
      const f = c.dataset.filter;
      if (c.getAttribute('aria-pressed') === 'true') return;
      if (RM.matches) return apply(f);
      if (document.startViewTransition) document.startViewTransition(() => apply(f));
      else flip(f);
    }));
  }

  /* ── 6. Lightbox (shared by dishes + gallery) ────────────────────────── */
  function initLightbox() {
    const dlg = $('.lb'), stage = $('.lb__stage', dlg), cap = $('.lb__cap', dlg), count = $('.lb__count', dlg);
    let items = [], idx = 0, trigger = null;

    const groupItems = (g) => g === 'food' ? $$('.dish:not([hidden]) .dish__btn') : $$('button[data-lb="gallery"]');
    const render = () => {
      const btn = items[idx], pic = btn.querySelector('picture').cloneNode(true);
      pic.removeAttribute('class'); pic.className = 'pic';
      $$('source, img', pic).forEach((el) => el.setAttribute('sizes', '100vw'));
      const img = $('img', pic); img.loading = 'eager'; img.classList.add('is-in'); img.style.viewTransitionName = 'lb-img';
      stage.replaceChildren(pic);
      cap.textContent = btn.querySelector('picture').dataset.cap || img.alt;
      count.textContent = `${idx + 1} / ${items.length}`;
    };
    const vt = (fn) => (document.startViewTransition && !RM.matches) ? document.startViewTransition(fn) : fn();
    const open = (btn) => {
      trigger = btn; items = groupItems(btn.dataset.lb); idx = Math.max(0, items.indexOf(btn));
      const src = $('img', btn);
      src.style.viewTransitionName = 'lb-img';
      vt(() => { src.style.viewTransitionName = ''; render(); dlg.showModal(); window.__lenis && window.__lenis.stop(); });
    };
    const go = (d) => { idx = (idx + d + items.length) % items.length; trigger = items[idx]; vt(render); };
    const close = () => {
      const back = trigger && $('img', trigger);
      const done = () => { stage.replaceChildren(); dlg.close(); if (back) back.style.viewTransitionName = 'lb-img'; };
      const t = vt(done);
      const clear = () => { if (back) back.style.viewTransitionName = ''; trigger && trigger.focus({ preventScroll: true }); };
      t && t.finished ? t.finished.then(clear) : clear();
      window.__lenis && window.__lenis.start();
    };

    $$('[data-lb]').forEach((b) => b.tagName === 'BUTTON' && b.addEventListener('click', () => open(b)));
    $('[data-lb-prev]', dlg).addEventListener('click', () => go(-1));
    $('[data-lb-next]', dlg).addEventListener('click', () => go(1));
    $('[data-lb-close]', dlg).addEventListener('click', close);
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
    // swipe
    let sx = null;
    stage.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    stage.addEventListener('pointerup', (e) => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); });
    stage.addEventListener('click', (e) => { if (e.target === stage) close(); });
  }

  /* ── 7. Hours scrubber ───────────────────────────────────────────────── */
  function initScrubber() {
    const sect = $('#hours'), track = $('[data-scrub]'), handle = $('.scrub__handle'), nowEl = live('scrubNow')[0];
    if (!track) return;
    const SPAN = 480, START = 1020; // 17:00 → 01:00
    const cards = { golden: $('#hc-golden'), evening: $('#hc-evening'), night: $('#hc-night') };
    const bars = live('energy')[0];
    let target = 0, x = 0, v = 0, raf = 0, mood = '';
    const moodAt = (m) => m < 120 ? 'golden' : m < 300 ? 'evening' : 'night';
    const NAMES = { golden: 'golden hour', evening: 'evening', night: 'late night' };

    // track width cached (ResizeObserver) so painting never reads layout
    let W = track.clientWidth;
    new ResizeObserver(() => { W = track.clientWidth; paint(); }).observe(track);
    const paint = () => {
      track.style.setProperty('--pf', (x / SPAN).toFixed(4));
      handle.style.setProperty('--px', (x / SPAN * W).toFixed(1) + 'px');
    };
    const commit = () => {
      const m = Math.round(target / 5) * 5, md = moodAt(m), t = fmt12(START + m);
      setText('scrubTime', t);
      handle.setAttribute('aria-valuenow', String(m));
      handle.setAttribute('aria-valuetext', `${t}, ${NAMES[md]}`);
      bars.dataset.level = String(Math.min(5, 1 + Math.floor(m / 96)));
      if (md !== mood) {
        mood = md; sect.dataset.mood = md;
        Object.entries(cards).forEach(([k, el]) => el.classList.toggle('is-active', k === md));
      }
    };
    // spring: stiffness 180, damping 22, mass 1
    const step = () => {
      const dt = 1 / 60, F = -180 * (x - target) - 22 * v;
      v += F * dt; x += v * dt;
      if (Math.abs(x - target) < 0.05 && Math.abs(v) < 0.05) { x = target; v = 0; paint(); raf = 0; return; }
      paint(); raf = requestAnimationFrame(step);
    };
    const set = (m, instant) => {
      target = Math.max(0, Math.min(SPAN, m)); commit();
      if (instant || RM.matches) { x = target; v = 0; paint(); return; }
      if (!raf) raf = requestAnimationFrame(step);
    };
    const fromPointer = (e) => { const r = track.getBoundingClientRect(); return (e.clientX - r.left) / r.width * SPAN; };

    let dragging = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' && e.target !== handle) { /* allow vertical page scroll; tap still jumps */ }
      dragging = true; track.classList.add('is-drag'); track.setPointerCapture(e.pointerId);
      set(fromPointer(e)); handle.focus({ preventScroll: true });
    });
    track.addEventListener('pointermove', (e) => { if (dragging) set(fromPointer(e)); });
    const end = () => { dragging = false; track.classList.remove('is-drag'); };
    track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 15, ArrowUp: 15, ArrowLeft: -15, ArrowDown: -15, PageUp: 60, PageDown: -60 }[e.key];
      if (k) { e.preventDefault(); set(target + k); }
      else if (e.key === 'Home') { e.preventDefault(); set(0); }
      else if (e.key === 'End') { e.preventDefault(); set(SPAN); }
    });

    const nowOffset = () => { const m = ist().min; return m >= START ? m - START : m < 60 ? m + 420 : null; };
    const markNow = () => {
      const o = nowOffset();
      if (nowEl) { nowEl.hidden = o == null; if (o != null) track.style.setProperty('--now', (o / SPAN * 100) + '%'); }
      return o;
    };
    set(markNow() ?? 0, true);
    return markNow;
  }

  /* ── 8. Gallery rail: drag with inertia, never hijacks vertical scroll ─ */
  function initRail() {
    const rail = $('.rail'), bar = $('.rail__progress span'); if (!rail) return;
    const prog = () => { const max = rail.scrollWidth - rail.clientWidth; bar.style.setProperty('--rp', max > 0 ? Math.max(.08, (rail.scrollLeft + rail.clientWidth) / rail.scrollWidth) : 1); };
    rail.addEventListener('scroll', prog, { passive: true }); prog();

    const prevBtn = $('[data-rail-prev]'), nextBtn = $('[data-rail-next]');
    const scrollRail = (delta) => {
      const item = $('.rail__item', rail), w = item ? item.getBoundingClientRect().width + 16 : 420;
      rail.scrollBy({ left: delta * w, behavior: RM.matches ? 'auto' : 'smooth' });
    };
    if (prevBtn) prevBtn.addEventListener('click', () => scrollRail(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollRail(1));

    let down = false, sx = 0, sl = 0, lastX = 0, lastT = 0, vel = 0, moved = 0, inertia = 0;
    rail.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return; // touch uses native momentum scroll
      cancelAnimationFrame(inertia); down = true; moved = 0; sx = lastX = e.clientX; sl = rail.scrollLeft; lastT = performance.now(); vel = 0;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) { rail.classList.add('is-drag'); rail.scrollLeft = sl - dx; }
      const now = performance.now(); vel = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return; down = false;
      requestAnimationFrame(() => rail.classList.remove('is-drag'));
      if (RM.matches || moved < 5) return;
      let v = -vel * 16; // px per frame
      const glide = () => { rail.scrollLeft += v; v *= 0.92; if (Math.abs(v) > 0.4) inertia = requestAnimationFrame(glide); };
      inertia = requestAnimationFrame(glide);
    });
    rail.addEventListener('keydown', (e) => {
      if (e.target !== rail) return;
      const item = $('.rail__item', rail), w = item ? item.getBoundingClientRect().width + 16 : 400;
      const d = { ArrowRight: w, ArrowLeft: -w, Home: -1e5, End: 1e5 }[e.key];
      if (d) { e.preventDefault(); rail.scrollBy({ left: d, behavior: RM.matches ? 'auto' : 'smooth' }); }
    });
  }

  /* ── 9. Booking composer → live WhatsApp message ─────────────────────── */
  function initBooking() {
    const form = $('[data-book]'); if (!form) return;
    const timesEl = $('[data-times]', form), guestsEl = $('[data-guests]', form), occ = $('[data-occasion]', form), nameEl = $('[data-name]', form);
    const pick = $('[data-date-pick]', form), dateBtns = $$('[data-date]', form);
    timesEl.setAttribute('data-lenis-prevent', '');
    const lastSlot = Math.min(toMin(CFG.hours.lastOrders) + (toMin(CFG.hours.lastOrders) < OPEN ? 1440 : 0) - 30, 1440);
    let day = istDay(0), dayOffset = 0, slot = null, guests = 2;

    const slotsFor = () => { const s = []; for (let m = OPEN; m <= lastSlot; m += 30) s.push(m); return s; };
    function renderTimes(autoAdvance) {
      const now = ist(), isToday = isoDay(day) === isoDay(now);
      const cutoff = isToday ? (now.min < CLOSE ? -1 : now.min + 20) : -1;   // 20 min notice
      const slots = slotsFor();
      const avail = slots.filter((m) => m > cutoff);
      if (!avail.length && autoAdvance && dayOffset === 0) { setDay(1, true); setText('timeNote', "· today's done, showing tomorrow"); return; }
      if (slot == null || slot <= cutoff || !slots.includes(slot)) slot = avail[0] ?? null;
      timesEl.innerHTML = slots.map((m) => `<button type="button" class="chip-btn" data-slot="${m}" aria-pressed="${m === slot}" ${m <= cutoff ? 'disabled' : ''}>${fmt12(m)}</button>`).join('');
      compose();
    }
    function setDay(off, auto) {
      dayOffset = off; day = istDay(off);
      dateBtns.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.date) === off)));
      setText('pickLabel', 'Pick a date'); pick.closest('.chip-btn').setAttribute('aria-pressed', 'false');
      if (!auto) setText('timeNote', '');
      renderTimes(false);
    }
    function compose() {
      const n = (nameEl.value || '').trim(), o = occ.value;
      const lines = [
        `Hi Kudos! I'd like to book a table for ${guests} ${guests === 1 ? 'person' : 'people'} on ${dayLabel(day)} at ${slot != null ? fmt12(slot) : '—'}.`,
        o === 'sunset' ? 'A sunset-side table if possible, please.' : o ? `We're celebrating ${o}.` : '',
        n ? `Name: ${n}` : '',
      ].filter(Boolean);
      const msg = lines.join('\n');
      setText('bookMsg', msg);
      setHref('bookWa', wa(msg));
      const g = live('groupNote')[0]; if (g) g.hidden = guests <= 12;
      $$('[data-step]', form).forEach((b) => { b.disabled = (b.dataset.step < 0 && guests <= 1) || (b.dataset.step > 0 && guests >= 40); });
    }

    dateBtns.forEach((b) => b.addEventListener('click', () => setDay(Number(b.dataset.date))));
    pick.min = isoDay(istDay(0));
    pick.addEventListener('change', () => {
      if (!pick.value) return;
      const [y, m, d] = pick.value.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      day = { y, mo: m - 1, d, wd: dt.getUTCDay() }; dayOffset = -1;
      dateBtns.forEach((b) => b.setAttribute('aria-pressed', 'false'));
      pick.closest('.chip-btn').setAttribute('aria-pressed', 'true');
      setText('pickLabel', dayLabel(day)); setText('timeNote', '');
      renderTimes(false);
    });
    timesEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-slot]'); if (!b || b.disabled) return;
      slot = Number(b.dataset.slot);
      $$('[data-slot]', timesEl).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      compose();
    });
    $$('[data-step]', form).forEach((b) => b.addEventListener('click', () => {
      guests = Math.max(1, Math.min(40, guests + Number(b.dataset.step)));
      guestsEl.textContent = String(guests);
      if (!RM.matches) guestsEl.animate([{ transform: `translateY(${b.dataset.step > 0 ? 40 : -40}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
      compose();
    }));
    occ.addEventListener('change', compose);
    nameEl.addEventListener('input', compose);
    form.addEventListener('submit', (e) => e.preventDefault());
    renderTimes(true);
    return () => renderTimes(false); // re-evaluated every minute so past slots disable
  }

  /* ── 10. Map: lazy OpenStreetMap embed, light + warm via CSS filter ──── */
  function initMap() {
    const box = $('[data-map]'); if (!box) return;
    const { lat, lng } = CFG.geo, dl = 0.011, dg = 0.018;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - dg}%2C${lat - dl}%2C${lng + dg}%2C${lat + dl}&layer=mapnik`;
    const load = () => {
      const f = document.createElement('iframe');
      f.src = src; f.title = 'Map of the area around Kudos Restro Lounge, Lake Pichola, Udaipur'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer';
      box.replaceChildren(f);
    };
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { load(); io.disconnect(); } }, { rootMargin: '600px' });
    io.observe(box);
  }

  /* ── 11. Chrome: links, topbar, mobile bar, Lenis, reveals, images ───── */
  function initLinks() {
    const maps = CFG.mapsUrl || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Kudos Restro Lounge Udaipur');
    setHref('mapsLink', maps);
    ['tel', 'tel2', 'tel3'].forEach((k) => setHref(k, tel));
    const waHello = wa("Hi Kudos! I'd like to ask about a table.");
    ['waLink', 'waLink2'].forEach((k) => live(k).forEach((a) => { a.href = waHello; a.target = '_blank'; a.rel = 'noopener'; }));
    setHref('waPrivate', wa("Hi Kudos! I'm planning a private booking / celebration. Date: __, guests: __."));
    live('waPrivate').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
    if (CFG.instagram) setHref('igLink', CFG.instagram);
    ['menuLink', 'menuLink2', 'menuLink3'].forEach((k) => live(k).forEach((a) => { if (CFG.menuPdf) { a.href = CFG.menuPdf; a.target = '_blank'; a.rel = 'noopener'; } }));
    setText('year', String(ist().y));
  }

  function initImages() {
    $$('.pic img').forEach((img) => {
      if (img.complete && img.naturalWidth) { img.classList.add('is-in'); return; }
      img.addEventListener('load', () => img.classList.add('is-in'), { once: true });
      img.addEventListener('error', () => img.classList.add('is-in'), { once: true });
    });
    root.classList.add('js-ready');
  }

  function initChrome() {
    const bar = $('.topbar'), mbar = $('.mbar');
    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        bar.classList.toggle('is-scrolled', y > 8);
        mbar.classList.toggle('is-on', y > innerHeight * 0.3 && y < document.documentElement.scrollHeight - innerHeight * 1.4);
        ticking = false;
      });
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    // Lenis, lerp .09 — off under reduced motion. Shift+wheel passes through so the
    // gallery rail scrolls sideways natively.
    // Lenis measures the whole document on construction (forced layout), so start it
    // only once the page has loaded and the main thread is idle.
    const startLenis = () => {
      const lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, virtualScroll: (d) => !(d.event && d.event.shiftKey) });
      window.__lenis = lenis;
      const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
      $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
        const id = a.getAttribute('href'); if (id.length < 2) return;
        const el = $(id); if (!el) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: -76 }); history.pushState(null, '', id);
      }));
    };
    if (window.Lenis && !RM.matches) {
      const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 600));
      if (document.readyState === 'complete') idle(startLenis); else addEventListener('load', () => idle(startLenis), { once: true });
    }

    // entrances: native view() timeline where supported, else IO + 420ms (160ms fade under RM)
    $$('.rv').forEach((el) => { const sib = [...el.parentElement.children].filter((c) => c.classList.contains('rv')); el.style.setProperty('--i', sib.indexOf(el)); });
    if (RM.matches || !CSS.supports('animation-timeline: view()')) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
      $$('.rv').forEach((el) => io.observe(el));
    }
  }

  /* ── 12. Boot ────────────────────────────────────────────────────────── */
  // Critical, above the fold: live state + clock. Small DOM writes only.
  initImages();
  applyState();
  tickClock();
  setInterval(tickClock, 1000);
  // Everything else runs in separate tasks, yielding between modules, so no single
  // long task blocks input on a mid-range phone (TBT / INP).
  const yieldTask = () => (window.scheduler && scheduler.yield) ? scheduler.yield() : new Promise((r) => setTimeout(r, 0));
  let markNow = null, refreshSlots = null;
  const rest = [initLinks, renderHoursTable, renderSchedule, initFilter, initLightbox,
    () => { markNow = initScrubber(); }, initRail, () => { refreshSlots = initBooking(); }, initMap, initChrome];
  (async () => { for (const task of rest) { await yieldTask(); task(); } })();
  // Re-evaluate the live state every 60s, aligned to the minute
  const minute = () => { applyState(); markNow && markNow(); refreshSlots && refreshSlots(); renderHoursTable(); };
  setTimeout(() => { minute(); setInterval(minute, 60000); }, (60 - ist().s) * 1000);
})();
