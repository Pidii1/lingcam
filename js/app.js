// Lingcam: the photo booth app
import { C, CUTS, cutById, geom, FRAMES, frameById, FRAME_CATS, SWATCHES, FILTERS, filterById, STICKER_CATS, STICKERS, FONTS, fontById, INKS } from './data.js';
import { loadImg, stickerImg, readyStickers, readyPics, fontsReady, filtered, drawBase, drawInk, drawItem, itemBox, renderStrip, renderPost, renderPrint, makeGif, toBlob, dateText } from './render.js';
import { Strips, Settings, MyStickers } from './store.js';
import * as N from './native.js';

export const VERSION = '1.2.0';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const main = $('#main');

const P = {
  cam: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.6"/>', back: '<path d="M15 5l-7 7 7 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  flip: '<path d="M4 9a8 8 0 0 1 14-3l2 2M20 15a8 8 0 0 1-14 3l-2-2"/><path d="M20 4v4h-4M4 20v-4h4"/>', timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M9.5 3h5"/>',
  sticker: '<path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4"/><circle cx="10" cy="12" r="1"/><path d="M8.5 15.5c1.5 1.5 4.5 1.5 6 0"/>', text: '<path d="M5 6h14M12 6v13"/>', pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
  frame: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><rect x="8" y="8" width="8" height="8"/>', download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', share: '<path d="M12 15V4M8 8l4-4 4 4M5 13v7h14v-7"/>',
  redo: '<path d="M4 12a8 8 0 1 0 3-6.2"/><path d="M4 4v5h5"/>', gif: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M8 10h-1.5v4H8v-1.5M11 10v4M14 14v-4h2.5M14 12h2"/>',
  grid: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v5m0-3a1.5 1.5 0 0 1 3 0v6c0 4-3 7-7 7h-1c-2.5 0-4-1-5.5-3L3.6 14a1.6 1.6 0 0 1 2.4-2.1L8 14"/>', minus: '<path d="M5 12h14"/>', home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',
  undo: '<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12"/>', redoA: '<path d="M15 7l5 5-5 5"/><path d="M20 12H10a6 6 0 0 0 0 12"/>',
  image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20 16l-5-5-8 8"/>', story: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M10 7h4"/>',
  print: '<path d="M7 9V4h10v5M7 17H5v-6h14v6h-2"/><rect x="7" y="14" width="10" height="6"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>', trash: '<path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>', filter: '<circle cx="9" cy="10" r="5"/><circle cx="15" cy="10" r="5"/><circle cx="12" cy="15" r="5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', plus: '<path d="M12 5v14M5 12h14"/>',
};
const ic = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;

// ---------------- state ----------------
const S = { stack: [], p: null, mode: 'camera', retake: null, stream: null, facing: 'user', tok: 0, busy: false, sheet: null, update: null };
function newProject() { return { id: uid(), created: Date.now(), cut: 'classic', frame: 'strawberry', frameColor: null, filter: 'none', photos: [], items: [], strokes: [], showName: true, showDate: true, rounded: false, caption: '', fave: false }; }
const clone = (o) => JSON.parse(JSON.stringify(o));

// ---------------- helpers ----------------
let toastT;
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
let actx;
function tone(f = 880, d = 0.09, v = 0.12, type = 'sine') {
  if (!Settings.get().sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + d);
    o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + d + 0.02);
  } catch (e) {}
}
function shutterSound() {
  if (!Settings.get().sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const len = actx.sampleRate * 0.12, b = actx.createBuffer(1, len, actx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = actx.createBufferSource(), g = actx.createGain(); g.gain.value = 0.35; s.buffer = b; s.connect(g).connect(actx.destination); s.start();
  } catch (e) {}
}
function flash() { const f = $('#flash'); f.classList.add('on'); requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => f.classList.remove('on'), 120))); }
function top(title, step, right = '') {
  return `<div class="top"><button class="ibtn" data-back aria-label="Back">${ic('back')}</button><h1>${step ? `<small>STEP ${step} OF 4</small>` : ''}${esc(title)}</h1>${right}</div>${step ? `<div class="prog" aria-hidden="true">${[1, 2, 3, 4].map((i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>` : ''}`;
}
function miniStrip(n, bg, t0, cls = '', ink = C.muted) {
  const tones = [['#f6d4dc', '#c98b9f'], ['#fbe6b8', '#cf9f6b'], ['#f3cfe0', '#b07a96'], ['#fde8cf', '#c7916f']];
  return `<div class="strip ${cls}" style="background:${bg}">${Array.from({ length: n }, (_, i) => { const [a, b] = tones[(t0 + i) % 4]; return `<div class="ph" style="--a:${a};--b:${b};${n === 4 ? 'height:50px;width:74px' : ''}"></div>`; }).join('')}<div class="ft" style="color:${ink}"><b>lingcam<i>.</i></b><span>${dateText()}</span></div></div>`;
}
// small picture of a strip layout with placeholder or real photos
function thumb(p, maxW, maxH, imgs = []) {
  const cut = geom(p), dpr = Math.min(2, window.devicePixelRatio || 1);
  const sc = Math.min(maxW / cut.W, maxH / cut.H);
  const cv = document.createElement('canvas'); cv.width = Math.round(cut.W * sc * dpr); cv.height = Math.round(cut.H * sc * dpr);
  cv.style.width = Math.round(cut.W * sc) + 'px'; cv.style.height = Math.round(cut.H * sc) + 'px';
  const ctx = cv.getContext('2d'); ctx.scale(sc * dpr, sc * dpr); drawBase(ctx, p, imgs);
  return cv;
}
function readImage(file, max = 1600) {
  return new Promise((ok, bad) => {
    const url = URL.createObjectURL(file); const im = new Image();
    im.onload = () => { const s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)); const cv = document.createElement('canvas'); cv.width = Math.round(im.naturalWidth * s); cv.height = Math.round(im.naturalHeight * s); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); ok(cv.toDataURL('image/jpeg', 0.9)); };
    im.onerror = () => { URL.revokeObjectURL(url); bad(new Error('That file is not a picture Lingcam can open')); };
    im.src = url;
  });
}
function pickFiles(multiple) {
  return new Promise((ok) => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = multiple; inp.style.display = 'none';
    inp.onchange = () => { ok([...inp.files]); inp.remove(); }; document.body.appendChild(inp); inp.click();
  });
}

// ---------------- navigation ----------------
const SCREENS = {};
function go(name, opt = {}) {
  leave();
  if (opt.reset) S.stack = [name]; else if (opt.replace) S.stack[S.stack.length - 1] = name; else S.stack.push(name);
  show(name);
}
function show(name) {
  closeSheet(true);
  $$('.side-a').forEach((a) => a.setAttribute('aria-current', String(a.dataset.nav === name || (a.dataset.nav === 'home' && !['strips', 'settings'].includes(name)))));
  SCREENS[name]();
  N.setBars(name === 'camera');
  const b = $('[data-back]', main); if (b) b.onclick = back;
  $$('[data-go]', main).forEach((el) => (el.onclick = () => go(el.dataset.go)));
  $$('[data-home]', main).forEach((el) => (el.onclick = goHome));
}
function goHome() { S.p = newProject(); S.mode = 'camera'; S.retake = null; E.reset(); go('home', { reset: true }); }
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas'); cv.className = 'confetti'; cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; document.body.appendChild(cv);
  const x = cv.getContext('2d'); x.scale(devicePixelRatio, devicePixelRatio);
  const cols = ['#ff7a9a', '#ffd23f', '#ffbfd3', '#fff3c4', '#c93a6e', '#7fa8e8', '#c9b6f2'];
  const P = Array.from({ length: 140 }, () => ({ x: innerWidth / 2 + (Math.random() - 0.5) * 80, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 15 - 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: cols[Math.floor(Math.random() * cols.length)], s: 5 + Math.random() * 6, h: Math.random() < 0.25 }));
  const t0 = performance.now();
  const step = (t) => {
    x.clearRect(0, 0, innerWidth, innerHeight);
    P.forEach((p) => { p.vy += 0.42; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c;
      if (p.h) { x.beginPath(); x.moveTo(0, p.s * 0.5); x.bezierCurveTo(-p.s, -p.s * 0.2, -p.s * 0.5, -p.s, 0, -p.s * 0.4); x.bezierCurveTo(p.s * 0.5, -p.s, p.s, -p.s * 0.2, 0, p.s * 0.5); x.fill(); } else x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      x.restore(); });
    if (t - t0 < 3200 && document.body.contains(cv)) requestAnimationFrame(step); else cv.remove();
  };
  requestAnimationFrame(step);
}
function back() {
  if (S.sheet) { closeSheet(); return true; }
  if (S.stack.length <= 1) return false;
  leave(); S.stack.pop(); show(S.stack[S.stack.length - 1]); return true;
}
function leave() { S.tok++; S.busy = false; S.waitTap = null; stopCamera(); if (S.gifAnim) { cancelAnimationFrame(S.gifAnim); S.gifAnim = null; } if (E.cleanup) E.cleanup(); }

function openSheet(html, cls = 'sheet') {
  closeSheet(true);
  const v = document.createElement('div'); v.className = 'veil';
  v.innerHTML = `<div class="${cls}" role="dialog" aria-modal="true">${cls === 'sheet' ? '<div class="grab"></div>' : ''}${html}</div>`;
  v.addEventListener('click', (e) => { if (e.target === v) closeSheet(); });
  document.body.appendChild(v); S.sheet = v;
  const f = v.querySelector('button, input'); if (f && cls !== 'sheet') f.focus();
  return v.firstElementChild;
}
function closeSheet(now) { if (!S.sheet) return; const v = S.sheet; S.sheet = null; if (v.onclose) v.onclose(); v.remove(); }
function confirmBox(title, text, yes = 'Delete') {
  return new Promise((ok) => {
    const d = openSheet(`<h2>${esc(title)}</h2><p>${esc(text)}</p><div class="row"><button class="btn alt" data-n>Keep it</button><button class="btn" data-y>${esc(yes)}</button></div>`, 'dlg');
    S.sheet.onclose = () => ok(false);
    d.querySelector('[data-n]').onclick = () => closeSheet();
    d.querySelector('[data-y]').onclick = () => { S.sheet.onclose = null; closeSheet(); ok(true); };
  });
}
const tog = (key, label, sub, on) => `<button class="tog" role="switch" aria-checked="${!!on}" data-tog="${key}"><div><b>${esc(label)}</b><small>${esc(sub)}</small></div><span class="sw" aria-hidden="true"></span></button>`;
const seg = (key, opts, on) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button aria-pressed="${String(v) === String(on)}" data-seg="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;

// ---------------- Home ----------------
SCREENS.home = () => {
  main.innerHTML = `<section class="scr">
  <div class="home-top"><span class="logo">lingcam<i>.</i></span><button class="ibtn" data-go="settings" aria-label="Settings">${ic('settings')}</button></div>
  <div class="scroll" style="display:flex;flex-direction:column">
  <div class="hero" aria-hidden="true">${miniStrip(3, C.paper, 0, 'h1')}${miniStrip(4, C.pink2, 1, 'h2', C.ink)}<span class="heart">♥</span><span class="starx">★</span><div class="badge321">3·2·1<br>smile!</div></div>
  <div class="home-h col"><h2>Your photo booth,<br>in your pocket.</h2><p>Pick a cut, pick a frame, strike a pose. Decorate it and keep the strip.</p></div>
  ${S.update ? `<button class="note col" id="upd" style="border:0;text-align:left;width:auto"><b style="color:var(--hot)">Lingcam ${esc(S.update.version)} is out.</b> Tap to update.</button>` : ''}
  <div class="home-b col">
    <button class="btn" id="start">${ic('cam')}<span>Start the booth</span></button>
    <div class="row"><button class="btn alt" data-go="strips">${ic('grid')}<span>My strips</span></button><button class="btn alt" id="fromPhotos">${ic('image')}<span>From photos</span></button></div>
  </div></div></section>`;
  $('#start').onclick = () => { S.p = newProject(); S.mode = 'camera'; S.retake = null; go('cut'); };
  $('#fromPhotos').onclick = () => { S.p = newProject(); S.mode = 'upload'; S.retake = null; go('cut'); };
  if ($('#upd')) $('#upd').onclick = () => updateDialog(S.update);
};

// ---------------- 1 Cut ----------------
SCREENS.cut = () => {
  const p = S.p;
  main.innerHTML = `<section class="scr">${top('Choose your cut', 1)}<div class="scroll"><div class="grid2" role="group" aria-label="Cuts">${CUTS.map((c, i) => `<button class="card" style="--d:${i * 40}ms" data-cut="${c.id}" aria-pressed="${p.cut === c.id}"><div class="pv"></div><b>${esc(c.name)}</b><small>${esc(c.sub)}</small></button>`).join('')}</div></div>
  <div class="foot col"><button class="btn" id="next">Next: pick a frame</button></div></section>`;
  $$('[data-cut]').forEach((b) => {
    b.querySelector('.pv').appendChild(thumb({ ...p, cut: b.dataset.cut, frame: 'paper', photos: [] }, 112, 112));
    b.onclick = () => { p.cut = b.dataset.cut; p.photos = p.photos.slice(0, cutById(p.cut).cells.length); $$('[data-cut]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); };
    b.ondblclick = () => go('frame');
  });
  $('#next').onclick = () => go('frame');
};

// ---------------- 2 Frame ----------------
SCREENS.frame = () => {
  const p = S.p; let cat = 'All';
  main.innerHTML = `<section class="scr">${top('Pick a frame', 2)}<div style="padding:12px 18px 0"><div class="chips" role="group" aria-label="Frame types">${FRAME_CATS.map((c) => `<button class="chip" data-cat="${c}" aria-pressed="${c === cat}">${c}</button>`).join('')}</div></div>
  <div class="scroll"><div class="grid3" id="fg"></div><div class="note col">Every strip carries the lingcam name and the date. You can change the frame colour after the photos.</div></div>
  <div class="foot col"><button class="btn" id="next">${S.mode === 'upload' ? ic('image') + '<span>Choose photos</span>' : ic('cam') + '<span>Open camera</span>'}</button></div></section>`;
  const draw = () => {
    const fg = $('#fg'); fg.innerHTML = '';
    FRAMES.filter((f) => cat === 'All' || f.cat === cat).forEach((f) => {
      const b = document.createElement('button'); b.className = 'card fcard'; b.style.setProperty('--d', Math.min(fg.children.length, 18) * 25 + 'ms'); b.setAttribute('aria-pressed', String(p.frame === f.id && !p.frameColor));
      b.innerHTML = `<div class="pv"></div><b style="font-size:12px">${esc(f.name)}</b>`;
      b.querySelector('.pv').appendChild(thumb({ ...p, frame: f.id, frameColor: null, photos: [] }, 104, 140));
      b.onclick = () => { p.frame = f.id; p.frameColor = null; if (f.filter && p.filter === 'none') p.filter = f.filter; $$('#fg .card').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); };
      b.ondblclick = () => $('#next').click();
      fg.appendChild(b);
    });
  };
  $$('[data-cat]').forEach((b) => (b.onclick = () => { cat = b.dataset.cat; $$('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(); }));
  draw(); readyStickers().then(() => { if ($('#fg')) draw(); });
  $('#next').onclick = async () => {
    if (S.mode === 'upload') { if (await uploadInto(null)) go('review'); }
    else go('camera');
  };
};
async function uploadInto(index) {
  const p = S.p, n = cutById(p.cut).cells.length;
  const files = await pickFiles(index == null && n > 1);
  if (!files.length) return false;
  try {
    if (index != null) p.photos[index] = await readImage(files[0]);
    else { const imgs = await Promise.all(files.slice(0, n).map((f) => readImage(f))); p.photos = imgs; if (files.length < n) toast(`Add ${n - files.length} more photo${n - files.length > 1 ? 's' : ''} on the next screen`); }
    return true;
  } catch (e) { toast(e.message); return false; }
}

// ---------------- 3 Camera ----------------
SCREENS.camera = () => {
  const p = S.p, cut = cutById(p.cut), set = Settings.get();
  const n = cut.cells.length;
  main.innerHTML = `<section class="scr cam">
  <div class="cam-top"><button class="ibtn" data-back aria-label="Back">${ic('back')}</button><div class="slots" id="slots" aria-hidden="true">${cut.cells.map(() => '<i></i>').join('')}</div><button class="ibtn" id="bset" aria-label="Booth settings">${ic('settings')}</button></div>
  <div class="cam-body"><div class="vf-wrap" id="vfw"><div class="vf" id="vf"><video id="vid" playsinline muted autoplay></video><div class="tag" style="left:12px" id="pose"></div><div class="tag" style="right:12px" id="ftag">${esc(filterById(p.filter).name)}</div><div class="count" id="count" aria-live="assertive"></div></div></div>
  <div class="live"><small>Live strip</small><div id="live"></div><small style="font-weight:400;opacity:.8">Space bar = snap</small></div></div>
  <div class="fl-row" role="group" aria-label="Filters">${FILTERS.map((f, i) => `<button class="fl" data-f="${f.id}" aria-pressed="${p.filter === f.id}"><span class="th"><div class="ph" style="--a:#f6d4dc;--b:#c98b9f;filter:${f.css}"></div></span>${esc(f.name)}</button>`).join('')}</div>
  <div class="cam-ctl"><button class="ibtn" id="tmr" aria-label="Countdown">${ic('timer')}<span id="tmrv">${set.countdown}s</span></button><button class="shutter" id="shut" aria-label="Take photos"></button><button class="ibtn" id="flipb" aria-label="Switch camera">${ic('flip')}</button></div>
  </section>`;
  const vid = $('#vid');
  const fit = () => { const w = $('#vfw'); if (!w) return; const W = w.clientWidth, H = w.clientHeight; let vw = W, vh = W / cut.aspect; if (vh > H) { vh = H; vw = H * cut.aspect; } $('#vf').style.width = vw + 'px'; $('#vf').style.height = vh + 'px'; };
  fit(); window.addEventListener('resize', fit); E.cleanup = () => { window.removeEventListener('resize', fit); E.cleanup = null; };
  const applyLook = () => { const s = Settings.get(); vid.style.filter = filterById(p.filter).css; vid.classList.toggle('mirror', s.mirror && S.facing === 'user'); };
  applyLook(); updateSlots(); drawLive();
  $$('.fl').forEach((b) => (b.onclick = () => { p.filter = b.dataset.f; $$('.fl').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); $('#ftag').textContent = filterById(p.filter).name; applyLook(); drawLive(); }));
  $('#tmr').onclick = () => { const v = { 3: 5, 5: 10, 10: 3 }[Settings.get().countdown] || 3; Settings.set({ countdown: v }); $('#tmrv').textContent = v + 's'; toast(`Countdown: ${v} seconds`, 1400); };
  $('#flipb').onclick = () => { if (S.busy) return; S.facing = S.facing === 'user' ? 'environment' : 'user'; startCamera().then(applyLook); };
  $('#bset').onclick = () => boothSettings(applyLook);
  $('#shut').onclick = shoot;
  startCamera().then(applyLook);
};
function updateSlots(now) {
  const p = S.p, cut = cutById(p.cut), sl = $('#slots'); if (!sl) return;
  [...sl.children].forEach((el, i) => { el.className = (p.photos[i] ? 'done' : '') + (i === now ? ' now' : ''); el.style.backgroundImage = p.photos[i] ? `url(${p.photos[i]})` : ''; });
  const pose = $('#pose'); if (pose) { const i = now ?? (S.retake ?? p.photos.filter(Boolean).length); pose.textContent = S.retake != null ? `Retake photo ${S.retake + 1}` : `Pose ${Math.min(i + 1, cut.cells.length)} of ${cut.cells.length}`; }
}
async function drawLive() {
  const el = $('#live'); if (!el) return; const p = S.p;
  const imgs = await Promise.all(cutById(p.cut).cells.map((_, i) => (p.photos[i] ? loadImg(p.photos[i]) : null)));
  el.innerHTML = ''; el.appendChild(thumb(p, 220, 520, imgs));
}
async function startCamera() {
  stopCamera();
  const vf = $('#vf'); if (!vf) return;
  $$('.msg', vf).forEach((m) => m.remove());
  const tok = S.tok;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return camError('This browser cannot open the camera. Try Chrome, or pick photos from your gallery instead.');
  try {
    const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: S.facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
    if (tok !== S.tok || !$('#vid')) { st.getTracks().forEach((t) => t.stop()); return; }
    S.stream = st; const v = $('#vid'); v.srcObject = st; await v.play().catch(() => {});
  } catch (e) {
    const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
    camError(denied ? 'Lingcam needs your camera to take photos. Allow camera access, then try again.' : e && e.name === 'NotFoundError' ? 'No camera was found on this device.' : 'The camera could not start. Close other apps that use the camera, then try again.');
  }
}
function camError(text) {
  const vf = $('#vf'); if (!vf) return;
  const m = document.createElement('div'); m.className = 'msg';
  m.innerHTML = `${ic('cam').replace('<svg', '<svg style="width:46px;height:46px"')}<p>${esc(text)}</p><div class="row" style="flex-wrap:wrap;justify-content:center"><button class="btn sm" data-r>Try again</button><button class="btn alt sm" data-u>Use photos instead</button></div>`;
  vf.appendChild(m);
  m.querySelector('[data-r]').onclick = () => startCamera();
  m.querySelector('[data-u]').onclick = async () => { S.mode = 'upload'; if (await uploadInto(S.retake)) { S.retake = null; go('review', { replace: true }); } };
}
function stopCamera() { if (S.stream) { S.stream.getTracks().forEach((t) => t.stop()); S.stream = null; } }
function capture() {
  const v = $('#vid'); if (!v || !v.videoWidth) return null;
  const a = cutById(S.p.cut).aspect, vw = v.videoWidth, vh = v.videoHeight;
  let sw = vw, sh = vw / a; if (sh > vh) { sh = vh; sw = vh * a; }
  const sc = Math.min(1, 1400 / Math.max(sw, sh));
  const cv = document.createElement('canvas'); cv.width = Math.round(sw * sc); cv.height = Math.round(sh * sc);
  const x = cv.getContext('2d');
  if (Settings.get().mirror && S.facing === 'user') { x.translate(cv.width, 0); x.scale(-1, 1); }
  x.drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, cv.width, cv.height);
  return cv.toDataURL('image/jpeg', 0.9);
}
async function shoot() {
  if (S.waitTap) { const f = S.waitTap; S.waitTap = null; f(); return; }
  if (S.busy) return;
  if (!S.stream) { toast('The camera is not on yet'); return; }
  const p = S.p, cut = cutById(p.cut), set = Settings.get();
  const idxs = S.retake != null ? [S.retake] : cut.cells.map((_, i) => i);
  S.busy = true; const tok = S.tok; const sh = $('#shut'); sh.classList.add('busy'); sh.setAttribute('aria-label', 'Taking photos');
  const cnt = $('#count');
  for (let k = 0; k < idxs.length; k++) {
    const i = idxs[k]; updateSlots(i);
    if (k > 0 && !set.auto) {
      sh.classList.remove('busy'); sh.textContent = 'Next'; sh.setAttribute('aria-label', 'Take the next photo');
      await new Promise((r) => (S.waitTap = r)); if (tok !== S.tok) return;
      sh.textContent = ''; sh.classList.add('busy');
    }
    for (let c = set.countdown; c > 0; c--) {
      if (tok !== S.tok) return;
      cnt.textContent = c; cnt.classList.remove('pop'); void cnt.offsetWidth; cnt.classList.add('pop'); tone(c === 1 ? 1175 : 880);
      await sleep(1000);
    }
    if (tok !== S.tok) return;
    cnt.textContent = ''; if (set.flash) flash(); shutterSound();
    const shot = capture(); if (shot) p.photos[i] = shot;
    updateSlots(i); drawLive();
    await sleep(set.auto ? 650 : 250);
  }
  if (tok !== S.tok) return;
  S.busy = false;
  if (S.retake != null) { S.retake = null; back(); } else go('review', { replace: true });
}
function boothSettings(after) {
  const s = Settings.get();
  const d = openSheet(`<h2>Booth settings</h2>
  <div class="lbl">Countdown</div>${seg('countdown', [[3, '3 s'], [5, '5 s'], [10, '10 s']], s.countdown)}
  <div class="lbl">Between photos</div>${seg('auto', [['1', 'Auto'], ['0', 'Tap each']], s.auto ? '1' : '0')}
  ${tog('flash', 'Flash', 'The screen turns white for a bright selfie', s.flash)}
  ${tog('mirror', 'Mirror the selfie camera', 'Photos look the way you see them on screen', s.mirror)}
  ${tog('sound', 'Sounds', 'Beeps for the countdown and a shutter click', s.sound)}
  <button class="btn" data-done>Done</button>`);
  bindSettings(d, after);
  d.querySelector('[data-done]').onclick = () => closeSheet();
}
function bindSettings(root, after) {
  $$('[data-seg]', root).forEach((b) => (b.onclick = () => {
    const k = b.dataset.seg; let v = b.dataset.v; if (k === 'countdown') v = +v; if (k === 'auto') v = v === '1';
    Settings.set({ [k]: v }); $$(`[data-seg="${k}"]`, root).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (k === 'countdown' && $('#tmrv')) $('#tmrv').textContent = v + 's'; after && after();
  }));
  $$('[data-tog]', root).forEach((b) => (b.onclick = () => { const k = b.dataset.tog; const v = !Settings.get()[k]; Settings.set({ [k]: v }); b.setAttribute('aria-checked', String(v)); after && after(); }));
}

// ---------------- Review ----------------
SCREENS.review = () => {
  const p = S.p, cut = cutById(p.cut), up = S.mode === 'upload';
  main.innerHTML = `<section class="scr">${top('Check your photos', 3)}
  <div class="scroll"><p class="note col" style="background:none;padding:6px 0 0;margin:6px auto 0;max-width:524px">${up ? 'Tap Replace to swap a photo.' : 'Not happy with one? Retake just that photo.'}</p>
  <div class="rv col">${cut.cells.map((_, i) => `<div class="rv-row">${p.photos[i] ? `<img src="${p.photos[i]}" alt="Photo ${i + 1}">` : '<img alt="">'}<div><b>Photo ${i + 1}</b><small>${p.photos[i] ? 'Looks good' : 'Missing'}</small></div><button class="btn ${p.photos[i] ? 'alt' : ''} sm" data-re="${i}">${ic(up ? 'image' : 'redo')}<span>${p.photos[i] ? (up ? 'Replace' : 'Retake') : (up ? 'Add' : 'Take')}</span></button></div>`).join('')}</div></div>
  <div class="foot col"><button class="btn alt" id="all">${up ? 'Pick again' : 'Retake all'}</button><button class="btn" id="dec" style="flex:1.5" ${p.photos.some(Boolean) ? '' : 'disabled'}>Decorate</button></div></section>`;
  $$('[data-re]').forEach((b) => (b.onclick = async () => {
    const i = +b.dataset.re;
    if (up) { if (await uploadInto(i)) SCREENS.review(), rebind(); }
    else { S.retake = i; go('camera'); }
  }));
  $('#all').onclick = async () => { if (up) { if (await uploadInto(null)) SCREENS.review(), rebind(); } else { S.retake = null; p.photos = []; go('camera', { replace: true }); } };
  $('#dec').onclick = () => { E.reset(); go('decorate'); };
};
function rebind() { const b = $('[data-back]', main); if (b) b.onclick = back; }

// ---------------- 4 Decorate (editor) ----------------
const E = {
  tab: 'stickers', sel: -1, cat: 'cute', pen: { c: C.hot, w: 2, erase: false }, undo: [], redo: [], base: null, ink: document.createElement('canvas'), imgs: [], ptrs: new Map(), g: null, cleanup: null,
  view: { z: 1, tx: 0, ty: 0 }, hand: false, pops: [], mineEdit: false,
  reset() { this.tab = 'stickers'; this.sel = -1; this.undo = []; this.redo = []; this.view = { z: 1, tx: 0, ty: 0 }; this.hand = false; },
};
const SNAP_KEYS = ['items', 'strokes', 'frame', 'frameColor', 'filter', 'showName', 'showDate', 'rounded', 'caption'];
function snap() { const p = S.p; E.undo.push(JSON.stringify(SNAP_KEYS.map((k) => p[k]))); if (E.undo.length > 60) E.undo.shift(); E.redo = []; undoBtns(); }
function restore(json) { const v = JSON.parse(json); SNAP_KEYS.forEach((k, i) => (S.p[k] = v[i])); E.sel = -1; E.head = geom(S.p).head || 0; rebuildBase(); renderPane(); }
function doUndo() { if (!E.undo.length) return; E.redo.push(JSON.stringify(SNAP_KEYS.map((k) => S.p[k]))); restore(E.undo.pop()); undoBtns(); }
function doRedo() { if (!E.redo.length) return; E.undo.push(JSON.stringify(SNAP_KEYS.map((k) => S.p[k]))); restore(E.redo.pop()); undoBtns(); }
function undoBtns() { const u = $('#undo'), r = $('#redoB'); if (u) u.disabled = !E.undo.length; if (r) r.disabled = !E.redo.length; }
const zs = () => (E.css || 0.5) * E.view.z; // screen pixels per strip pixel

SCREENS.decorate = () => {
  const p = S.p;
  main.innerHTML = `<section class="scr">${top('Decorate', 4, `<button class="ibtn" id="undo" aria-label="Undo">${ic('undo')}</button><button class="ibtn" id="redoB" aria-label="Redo">${ic('redoA')}</button>`)}
  <div class="deco-body"><div class="stage-wrap" id="sw"><canvas class="stage" id="stage" aria-label="Your strip. Drag stickers and words to move them."></canvas>
  <div class="zoombar" role="group" aria-label="Zoom"><button id="hand" class="zb" aria-pressed="false" aria-label="Move the picture" title="Move the picture">${ic('hand')}</button><button id="zout" class="zb" aria-label="Zoom out">${ic('minus')}</button><button id="zfit" class="zb zt" aria-label="Fit to screen">100%</button><button id="zin" class="zb" aria-label="Zoom in">${ic('plus')}</button></div></div>
  <div class="panel"><div class="pane" id="pane"></div>
  <div class="tools" role="tablist">${[['stickers', 'sticker', 'Stickers'], ['text', 'text', 'Text'], ['draw', 'pen', 'Draw'], ['frame', 'frame', 'Frame'], ['filter', 'filter', 'Filter']].map(([t, i, l]) => `<button role="tab" data-tab="${t}" aria-pressed="${E.tab === t}" aria-selected="${E.tab === t}">${ic(i)}<span>${l}</span></button>`).join('')}</div>
  <button class="btn block" id="fin">Done</button></div></div></section>`;
  let cut = geom(p); const cv = $('#stage'); cv.width = cut.W; cv.height = cut.H; E.cv = cv; E.ctx = cv.getContext('2d'); E.head = cut.head || 0;
  const fit = () => { const w = $('#sw'); if (!w) return; cut = geom(S.p); const W = w.clientWidth - 36, H = w.clientHeight - 20; const s = Math.min(W / cut.W, H / cut.H); cv.style.width = Math.floor(cut.W * s) + 'px'; cv.style.height = Math.floor(cut.H * s) + 'px'; E.css = s; applyView(); draw(); };
  window.addEventListener('resize', fit); E.fit = fit;
  const key = (e) => {
    if (e.target.matches('input, textarea')) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && E.sel >= 0) { e.preventDefault(); delSel(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); }
    else if (e.key === 'Escape' && E.sel >= 0) { E.sel = -1; draw(); renderPane(); }
    else if (e.key === '+' || e.key === '=') zoomBy(1.25); else if (e.key === '-') zoomBy(0.8); else if (e.key === '0') setView(1, 0, 0);
  };
  document.addEventListener('keydown', key);
  E.cleanup = () => { window.removeEventListener('resize', fit); document.removeEventListener('keydown', key); E.cleanup = null; };
  $('#undo').onclick = doUndo; $('#redoB').onclick = doRedo; undoBtns();
  $('#zin').onclick = () => zoomBy(1.4); $('#zout').onclick = () => zoomBy(1 / 1.4); $('#zfit').onclick = () => setView(1, 0, 0);
  $('#hand').onclick = () => { E.hand = !E.hand; $('#hand').setAttribute('aria-pressed', String(E.hand)); toast(E.hand ? 'Drag to move the picture. Tap the hand again to draw.' : 'Hand off', 1800); };
  $('#sw').addEventListener('wheel', (e) => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); }, { passive: false });
  $$('[data-tab]').forEach((b) => (b.onclick = () => { E.tab = b.dataset.tab; $$('[data-tab]').forEach((x) => { x.setAttribute('aria-pressed', String(x === b)); x.setAttribute('aria-selected', String(x === b)); }); if (E.tab === 'draw') { E.sel = -1; if (E.view.z === 1) toast('Tip: pinch or tap + to zoom in for small details', 2400); } draw(); renderPane(); }));
  $('#fin').onclick = finish;
  bindStage(cv);
  (async () => {
    await fontsReady();
    E.imgs = await Promise.all(cut.cells.map((_, i) => (p.photos[i] ? loadImg(p.photos[i]) : null)));
    await readyStickers(); await readyPics(p.items);
    rebuildBase(); fit(); renderPane();
  })();
  renderPane();
  requestAnimationFrame(fit);
};

// ---- zoom and move the picture ----
function canvasOrigin() { const w = $('#sw').getBoundingClientRect(); return [w.left + E.cv.offsetLeft, w.top + E.cv.offsetTop]; }
function clampView(v) {
  if (v.z <= 1.001) return { z: 1, tx: 0, ty: 0 };
  const w = E.cv.offsetWidth, h = E.cv.offsetHeight, m = 60;
  v.tx = Math.min(w - m, Math.max(-w * v.z + m, v.tx)); v.ty = Math.min(h - m, Math.max(-h * v.z + m, v.ty));
  return v;
}
function applyView() { const v = E.view; if (!E.cv) return; E.cv.style.transform = v.z === 1 ? '' : `translate(${v.tx}px, ${v.ty}px) scale(${v.z})`; const t = $('#zfit'); if (t) t.textContent = Math.round(v.z * 100) + '%'; }
function setView(z, tx, ty) { E.view = clampView({ z, tx, ty }); applyView(); draw(); }
function zoomAround(z0, tx0, ty0, cx, cy, z, mx = cx, my = cy) {
  const [Lx, Ly] = canvasOrigin(); const px = (cx - Lx - tx0) / z0, py = (cy - Ly - ty0) / z0;
  z = Math.min(8, Math.max(1, z)); setView(z, mx - Lx - px * z, my - Ly - py * z);
}
function zoomBy(f, cx, cy) {
  const w = $('#sw').getBoundingClientRect(); if (cx == null) { cx = w.left + w.width / 2; cy = w.top + w.height / 2; }
  const v = E.view; zoomAround(v.z, v.tx, v.ty, cx, cy, v.z * f);
}

function rebuildBase() {
  const p = S.p, cut = geom(p), head = cut.head || 0;
  if (E.head !== head) { // frame with a header: move stickers and drawing with the photos
    const d = head - (E.head || 0);
    p.items.forEach((it) => (it.y += d)); p.strokes.forEach((st) => st.pts.forEach((q) => (q[1] += d)));
    E.head = head;
  }
  if (E.cv && (E.cv.width !== cut.W || E.cv.height !== cut.H)) { E.cv.width = cut.W; E.cv.height = cut.H; if (E.fit) requestAnimationFrame(E.fit); }
  const b = E.base || document.createElement('canvas'); b.width = cut.W; b.height = cut.H;
  drawBase(b.getContext('2d'), p, E.imgs); E.base = b; draw();
}
const easeBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
let popRaf = 0;
function draw() {
  const p = S.p, x = E.ctx; if (!x || !E.base) return;
  const cut = geom(p); x.clearRect(0, 0, cut.W, cut.H); x.drawImage(E.base, 0, 0);
  drawInk(x, p, cut.W, cut.H, E.ink);
  const now = performance.now(); let anim = false;
  p.items.forEach((it) => {
    const pop = E.pops.find((q) => q.it === it);
    if (pop) { const t = Math.min(1, (now - pop.t0) / 320); if (t < 1) { anim = true; drawItem(x, { ...it, size: it.size * Math.max(0.05, easeBack(t)) }); return; } }
    drawItem(x, it);
  });
  E.pops = E.pops.filter((q) => now - q.t0 < 320);
  if (anim && !popRaf) popRaf = requestAnimationFrame(() => { popRaf = 0; draw(); });
  const it = p.items[E.sel];
  if (it && E.tab !== 'draw') {
    const b = itemBox(x, it), u = 1 / zs(), m = 6 * u;
    x.save(); x.translate(it.x, it.y); x.rotate(it.r || 0);
    x.setLineDash([8 * u, 6 * u]); x.lineWidth = 2.5 * u; x.strokeStyle = C.hot; x.strokeRect(-b.w / 2 - m, -b.h / 2 - m, b.w + m * 2, b.h + m * 2); x.setLineDash([]);
    const hr = 13 * u;
    x.fillStyle = C.hot; x.beginPath(); x.arc(b.w / 2 + m, -b.h / 2 - m, hr, 0, 7); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 2.6 * u; x.beginPath(); x.moveTo(b.w / 2 + m - 5 * u, -b.h / 2 - m - 5 * u); x.lineTo(b.w / 2 + m + 5 * u, -b.h / 2 - m + 5 * u); x.moveTo(b.w / 2 + m + 5 * u, -b.h / 2 - m - 5 * u); x.lineTo(b.w / 2 + m - 5 * u, -b.h / 2 - m + 5 * u); x.stroke();
    x.fillStyle = '#fff'; x.strokeStyle = C.hot; x.lineWidth = 3 * u; x.beginPath(); x.arc(b.w / 2 + m, b.h / 2 + m, hr, 0, 7); x.fill(); x.stroke();
    x.strokeStyle = C.hot; x.lineWidth = 2 * u; x.beginPath(); x.arc(b.w / 2 + m, b.h / 2 + m, 5.5 * u, -0.3, 4.2); x.stroke();
    x.restore();
  }
}
function toLocal(it, px, py) { const dx = px - it.x, dy = py - it.y, c = Math.cos(-(it.r || 0)), s = Math.sin(-(it.r || 0)); return [dx * c - dy * s, dx * s + dy * c]; }
function hitHandle(px, py) {
  const it = S.p.items[E.sel]; if (!it) return null;
  const b = itemBox(E.ctx, it), u = 1 / zs(), m = 6 * u, R = 22 * u;
  const [lx, ly] = toLocal(it, px, py);
  if (Math.hypot(lx - (b.w / 2 + m), ly - (-b.h / 2 - m)) < R) return 'del';
  if (Math.hypot(lx - (b.w / 2 + m), ly - (b.h / 2 + m)) < R) return 'size';
  return null;
}
function hitItem(px, py) {
  const items = S.p.items, u = 1 / zs();
  for (let i = items.length - 1; i >= 0; i--) { const b = itemBox(E.ctx, items[i]); const [lx, ly] = toLocal(items[i], px, py); const pad = 8 * u; if (Math.abs(lx) <= b.w / 2 + pad && Math.abs(ly) <= b.h / 2 + pad) return i; }
  return -1;
}
function bindStage(cv) {
  const pt = (e) => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * cv.width, ((e.clientY - r.top) / r.height) * cv.height]; };
  const cl = new Map(); // screen positions of each finger
  const startViewPinch = () => { const [a, b] = [...cl.values()]; const v = E.view; E.g = { mode: 'view', z0: v.z, tx0: v.tx, ty0: v.ty, d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mx0: (a[0] + b[0]) / 2, my0: (a[1] + b[1]) / 2 }; };
  const startPan = (e) => { const v = E.view; E.g = { mode: 'pan', x0: e.clientX, y0: e.clientY, tx0: v.tx, ty0: v.ty }; };
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId); const [x, y] = pt(e); E.ptrs.set(e.pointerId, [x, y]); cl.set(e.pointerId, [e.clientX, e.clientY]);
    const p = S.p;
    if (e.button === 1 || E.hand) { if (cl.size === 2) startViewPinch(); else startPan(e); return; }
    if (E.tab === 'draw') {
      if (cl.size === 2) { // second finger: zoom instead of drawing
        if (E.g && E.g.mode === 'draw') { p.strokes.pop(); E.undo.pop(); undoBtns(); }
        startViewPinch(); draw(); return;
      }
      if (cl.size > 2) return;
      snap(); const s = cutById(p.cut).W / 600;
      p.strokes.push({ c: E.pen.c, w: ([6, 12, 24][E.pen.w - 1] * s) / Math.pow(E.view.z, 0.8), erase: E.pen.erase, pts: [[Math.round(x), Math.round(y)]] }); E.g = { mode: 'draw' }; draw(); return;
    }
    if (cl.size === 2) {
      if (E.sel >= 0) { const it = p.items[E.sel]; const [a, b] = [...E.ptrs.values()]; if (E.g && E.g.mode === 'move' && !E.g.moved) { E.undo.pop(); } snap(); E.g = { mode: 'pinch', d0: Math.hypot(a[0] - b[0], a[1] - b[1]), a0: Math.atan2(b[1] - a[1], b[0] - a[0]), s0: it.size, r0: it.r || 0 }; }
      else startViewPinch();
      return;
    }
    const h = hitHandle(x, y);
    if (h === 'del') { delSel(); E.g = null; return; }
    if (h === 'size') { const it = p.items[E.sel]; snap(); E.g = { mode: 'size', d0: Math.hypot(x - it.x, y - it.y), a0: Math.atan2(y - it.y, x - it.x), s0: it.size, r0: it.r || 0 }; return; }
    const i = hitItem(x, y);
    if (i >= 0) {
      const changed = E.sel !== i; const it = p.items[i];
      p.items.push(p.items.splice(i, 1)[0]); E.sel = p.items.length - 1; // bring to front
      snap(); E.g = { mode: 'move', dx: x - it.x, dy: y - it.y, moved: false };
      draw(); if (changed || E.tab === 'text') { if (it.t === 'text' && E.tab !== 'text') { E.tab = 'text'; $$('[data-tab]').forEach((b) => { b.setAttribute('aria-pressed', String(b.dataset.tab === 'text')); b.setAttribute('aria-selected', String(b.dataset.tab === 'text')); }); } renderPane(); }
    } else {
      const had = E.sel >= 0; E.sel = -1; draw(); if (had) renderPane();
      if (E.view.z > 1) startPan(e); else E.g = null;
    }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!E.ptrs.has(e.pointerId)) return; const [x, y] = pt(e); E.ptrs.set(e.pointerId, [x, y]); cl.set(e.pointerId, [e.clientX, e.clientY]);
    const g = E.g, p = S.p; if (!g) return;
    if (g.mode === 'view' && cl.size >= 2) { const [a, b] = [...cl.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); zoomAround(g.z0, g.tx0, g.ty0, g.mx0, g.my0, g.z0 * d / g.d0, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); return; }
    if (g.mode === 'pan') { setView(E.view.z, g.tx0 + e.clientX - g.x0, g.ty0 + e.clientY - g.y0); return; }
    if (g.mode === 'draw') { const st = p.strokes[p.strokes.length - 1]; const L = st.pts[st.pts.length - 1]; if (Math.hypot(L[0] - x, L[1] - y) > 1.5 / E.view.z) { st.pts.push([Math.round(x * 2) / 2, Math.round(y * 2) / 2]); draw(); } return; }
    const it = p.items[E.sel]; if (!it) return;
    const minS = it.t === 'text' ? 12 : 24, maxS = cutById(p.cut).W * 1.6;
    if (g.mode === 'move') { it.x = x - g.dx; it.y = y - g.dy; g.moved = true; }
    else if (g.mode === 'size') { const d = Math.hypot(x - it.x, y - it.y); it.size = Math.max(minS, Math.min(maxS, g.s0 * d / Math.max(1, g.d0))); it.r = g.r0 + Math.atan2(y - it.y, x - it.x) - g.a0; }
    else if (g.mode === 'pinch' && E.ptrs.size >= 2) { const [a, b] = [...E.ptrs.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); it.size = Math.max(minS, Math.min(maxS, g.s0 * d / Math.max(1, g.d0))); it.r = g.r0 + Math.atan2(b[1] - a[1], b[0] - a[0]) - g.a0; }
    draw();
  });
  const up = (e) => {
    E.ptrs.delete(e.pointerId); cl.delete(e.pointerId);
    if (cl.size === 0) { if (E.g && E.g.mode === 'move' && !E.g.moved) E.undo.pop(), undoBtns(); E.g = null; }
    else if (E.g && (E.g.mode === 'pinch' || E.g.mode === 'view')) E.g = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
}
function delSel() { if (E.sel < 0) return; snap(); S.p.items.splice(E.sel, 1); E.sel = -1; draw(); renderPane(); }
function addItem(it) {
  const p = S.p, cut = geom(p); snap();
  const n = p.items.length;
  if (it.x == null) { // place it where the person is looking when zoomed in
    const w = $('#sw').getBoundingClientRect(), r = E.cv.getBoundingClientRect();
    const cx = ((w.left + w.width / 2 - r.left) / r.width) * cut.W, cy = ((w.top + w.height / 2 - r.top) / r.height) * cut.H;
    const jitter = ((n % 3) - 1) * cut.W * 0.1 / E.view.z;
    it.x = Math.min(cut.W, Math.max(0, (E.view.z > 1 ? cx : cut.W / 2) + jitter)); it.y = Math.min(cut.H, Math.max(0, E.view.z > 1 ? cy : cut.H * (0.3 + (n % 4) * 0.12)));
    it.size = it.size / Math.sqrt(E.view.z);
  }
  it.r = it.r ?? (Math.random() - 0.5) * 0.4;
  p.items.push(it); E.sel = p.items.length - 1; E.pops.push({ it, t0: performance.now() }); draw();
}
const colorDots = (attr, list, cur, label, custom = true) => `<div class="dots" role="group" aria-label="${label}">${list.map((c) => `<button class="dot" data-${attr}="${c}" aria-label="${label} ${c}" aria-pressed="${cur === c}" style="background:${c}"></button>`).join('')}${custom ? `<label class="dot pick" aria-pressed="${!!cur && !list.includes(cur)}" title="Any colour" style="${cur && !list.includes(cur) ? `background:${cur}` : ''}"><input type="color" data-${attr}-pick value="${/^#[0-9a-f]{6}$/i.test(cur || '') ? cur : '#c93a6e'}" aria-label="Pick any ${label.toLowerCase()}"></label>` : ''}</div>`;
async function renderMine(pane, base) {
  let list = []; try { list = await MyStickers.list(); } catch (e) {}
  const g = $('#mine', pane); if (!g) return;
  g.innerHTML = `<button class="stk add" id="addMine" aria-label="Add your own sticker">${ic('plus')}<small>Add</small></button>` + list.map((st) => `<button class="stk mine" data-mid="${st.id}" aria-label="Your sticker"><img alt="" src="${st.src}">${E.mineEdit ? `<span class="x" aria-hidden="true">×</span>` : ''}</button>`).join('');
  $('#addMine', pane).onclick = importSticker;
  $$('[data-mid]', pane).forEach((b) => (b.onclick = async () => {
    const st = list.find((q) => q.id === b.dataset.mid); if (!st) return;
    if (E.mineEdit) { if (await confirmBox('Delete this sticker?', 'It will be removed from your stickers. Strips that already use it keep it.')) { await MyStickers.del(st.id); renderMine(pane, base); } return; }
    await readyPics([{ t: 'image', src: st.src }]);
    addItem({ t: 'image', src: st.src, ar: st.ar || 1, size: base * 1.2 });
  }));
  const ed = $('#mineEdit', pane); if (ed) { ed.style.display = list.length ? '' : 'none'; ed.textContent = E.mineEdit ? 'Done' : 'Edit'; ed.onclick = () => { E.mineEdit = !E.mineEdit; renderMine(pane, base); }; }
}
function renderPane() {
  const pane = $('#pane'); if (!pane) return; const p = S.p, cut = cutById(p.cut), s = cut.W / 600;
  const base = Math.min(cut.W, cut.H) * 0.24;
  if (E.tab === 'stickers') {
    const cat = STICKER_CATS.find((c) => c.id === E.cat) || STICKER_CATS[1];
    pane.innerHTML = `<div class="chips" role="group" aria-label="Sticker packs">${STICKER_CATS.map((c) => `<button class="chip" data-sc="${c.id}" aria-pressed="${c.id === cat.id}">${c.name}</button>`).join('')}</div>
    ${cat.mine ? `<div class="row" style="justify-content:space-between"><span class="hint" style="text-align:left">Turn your own pictures into stickers.</span><button class="chip" id="mineEdit">Edit</button></div><div class="stk-grid" id="mine"></div>`
      : cat.words ? `<div class="words">${cat.words.map((w, i) => `<button class="word" data-w="${i}">${esc(w)}</button>`).join('')}</div>`
      : `<div class="stk-grid">${(cat.items || cat.emoji).map((k, i) => `<button class="stk" data-k="${i}" aria-label="Add sticker" style="--d:${i * 18}ms">${cat.emoji ? k : `<img alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(STICKERS[k])}">`}</button>`).join('')}</div>`}
    <div class="hint">Drag to move. Drag the round handle to resize and turn. Pinch works too.</div>`;
    $$('[data-sc]', pane).forEach((b) => (b.onclick = () => { E.cat = b.dataset.sc; E.mineEdit = false; renderPane(); }));
    $$('[data-k]', pane).forEach((b) => (b.onclick = () => { const k = (cat.items || cat.emoji)[+b.dataset.k]; addItem(cat.emoji ? { t: 'emoji', ch: k, size: base } : { t: 'sticker', k, size: k.startsWith('tape') ? base * 1.5 : base }); }));
    $$('[data-w]', pane).forEach((b) => (b.onclick = () => { const i = +b.dataset.w; const st = [[C.hot, C.yel2], [C.ink, C.pink2], [C.yel2, C.ink], ['#fff', '#7fa8e8'], ['#5b3f8f', '#e6dcff']][i % 5]; addItem({ t: 'text', text: cat.words[i], font: ['script', 'pacifico', 'round', 'marker', 'chewy'][i % 5], color: st[0], bg: st[1], size: 42 * s + 10 }); }));
    if (cat.mine) renderMine(pane, base);
  } else if (E.tab === 'text') {
    const it = p.items[E.sel] && p.items[E.sel].t === 'text' ? p.items[E.sel] : null;
    const cur = it || E.tdraft || (E.tdraft = { font: 'script', color: C.hot, bg: null, outline: null, shadow: null });
    const style = cur.outline ? 'outline' : cur.shadow ? 'shadow' : 'plain';
    pane.innerHTML = `<label class="lbl" for="tin">${it ? 'Edit your words' : 'Your words'}</label><textarea id="tin" class="tin" rows="2" maxlength="80" placeholder="best day ever">${esc(it ? it.text : '')}</textarea>
    <button class="btn sm" id="addt">${ic('plus')}<span>${it ? 'Add more words' : 'Add to strip'}</span></button>
    <div class="lbl">Font</div><div class="fonts" role="group" aria-label="Font">${FONTS.map((f) => `<button data-font="${f.id}" aria-pressed="${cur.font === f.id}" style="font-family:'${f.css}';font-weight:${f.weight};font-style:${f.style || 'normal'}">Aa<small>${f.name}</small></button>`).join('')}</div>
    <div class="lbl">Colour</div>${colorDots('col', INKS, cur.color, 'Text colour')}
    <div class="lbl">Style</div>${seg('tstyle', [['plain', 'Plain'], ['outline', 'Outline'], ['shadow', 'Shadow']], style)}
    <div class="lbl">Background</div><div class="dots" role="group" aria-label="Text background"><button class="dot" data-bg="" aria-label="No background" aria-pressed="${!cur.bg}" style="background:linear-gradient(135deg,#fff 45%,${C.hot} 47%,${C.hot} 53%,#fff 55%)"></button>${[C.yel2, C.pink2, '#ffffff', C.ink, C.hot, '#e6dcff', '#cdeedd', '#cfe8ff', '#000000'].map((c) => `<button class="dot sq" data-bg="${c}" aria-label="Background ${c}" aria-pressed="${cur.bg === c}" style="background:${c}"></button>`).join('')}<label class="dot sq pick" title="Any colour"><input type="color" data-bg-pick value="${/^#[0-9a-f]{6}$/i.test(cur.bg || '') ? cur.bg : '#ffe589'}" aria-label="Pick any background colour"></label></div>`;
    const tin = $('#tin');
    tin.oninput = () => { const t = p.items[E.sel]; if (t && t.t === 'text') { if (!E.typing) { snap(); E.typing = true; } t.text = tin.value || ' '; draw(); } };
    tin.onblur = () => (E.typing = false);
    $('#addt').onclick = () => {
      const txt = (it ? '' : tin.value.trim()) || 'best day ever';
      addItem({ t: 'text', text: txt, font: cur.font, color: cur.color, bg: cur.bg, outline: cur.outline, shadow: cur.shadow, size: 52 * s + 10 }); renderPane();
      setTimeout(() => { const t = $('#tin'); if (t) { t.focus(); t.select(); } }, 30);
    };
    const setv = (patch, keep) => { const t = p.items[E.sel]; if (t && t.t === 'text') { snap(); Object.assign(t, patch); draw(); } else Object.assign(E.tdraft, patch); if (!keep) renderPane(); };
    const dark = (c) => { const n = parseInt((c || '#000').slice(1), 16); return ((n >> 16) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) < 150; };
    $$('[data-font]', pane).forEach((b) => (b.onclick = () => setv({ font: b.dataset.font })));
    $$('[data-col]', pane).forEach((b) => (b.onclick = () => setv({ color: b.dataset.col, ...(cur.outline ? { outline: dark(b.dataset.col) ? '#ffffff' : C.ink } : {}) })));
    const cp = $('[data-col-pick]', pane); cp.oninput = () => setv({ color: cp.value }, true); cp.onchange = () => renderPane();
    $$('[data-seg="tstyle"]', pane).forEach((b) => (b.onclick = () => { const v = b.dataset.v, c = cur.color; setv({ outline: v === 'outline' ? (dark(c) ? '#ffffff' : C.ink) : null, shadow: v === 'shadow' ? (dark(c) ? '#ffbfd3' : C.ink) : null }); }));
    $$('[data-bg]', pane).forEach((b) => (b.onclick = () => setv({ bg: b.dataset.bg || null })));
    const bp = $('[data-bg-pick]', pane); bp.oninput = () => setv({ bg: bp.value }, true); bp.onchange = () => renderPane();
  } else if (E.tab === 'draw') {
    pane.innerHTML = `<div class="lbl">Pen colour</div>${colorDots('pc', INKS, E.pen.erase ? null : E.pen.c, 'Pen colour')}
    <div class="lbl">Size</div><div class="seg" role="group">${[1, 2, 3].map((w) => `<button data-pw="${w}" aria-pressed="${E.pen.w === w}" aria-label="Pen size ${w}"><span class="pen" style="width:${[5, 9, 15][w - 1]}px;height:${[5, 9, 15][w - 1]}px"></span></button>`).join('')}<button data-er aria-pressed="${E.pen.erase}">Eraser</button></div>
    <button class="btn alt sm" id="clr" ${p.strokes.length ? '' : 'disabled'}>${ic('trash')}<span>Clear drawing</span></button>
    <div class="hint">Pinch with two fingers (or tap +) to zoom in. Lines get finer when you zoom. Use the hand to move around.</div>`;
    $$('[data-pc]', pane).forEach((b) => (b.onclick = () => { E.pen.c = b.dataset.pc; E.pen.erase = false; renderPane(); }));
    const pp = $('[data-pc-pick]', pane); pp.oninput = () => { E.pen.c = pp.value; E.pen.erase = false; }; pp.onchange = () => renderPane();
    $$('[data-pw]', pane).forEach((b) => (b.onclick = () => { E.pen.w = +b.dataset.pw; renderPane(); }));
    $('[data-er]', pane).onclick = () => { E.pen.erase = !E.pen.erase; renderPane(); };
    $('#clr').onclick = () => { snap(); p.strokes = []; draw(); renderPane(); };
  } else if (E.tab === 'frame') {
    const fcat = E.fcat || 'All';
    pane.innerHTML = `<div class="lbl">Frame</div><div class="chips" role="group" aria-label="Frame types">${FRAME_CATS.map((c) => `<button class="chip" data-fcat="${c}" aria-pressed="${c === fcat}">${c}</button>`).join('')}</div><div class="frow" id="frow"></div>
    <div class="lbl">Frame colour</div><div class="dots" role="group" aria-label="Frame colour"><button class="dot sq" data-fc="" aria-label="Frame design" aria-pressed="${!p.frameColor}" style="background:conic-gradient(${C.pink2} 0 25%,${C.yel2} 0 50%,${C.pink2} 0 75%,${C.yel2} 0)"></button>${SWATCHES.map((c) => `<button class="dot sq" data-fc="${c}" aria-label="Colour ${c}" aria-pressed="${p.frameColor === c}" style="background:${c}"></button>`).join('')}<label class="dot sq pick" title="Any colour" aria-pressed="${!!p.frameColor && !SWATCHES.includes(p.frameColor)}" style="${p.frameColor && !SWATCHES.includes(p.frameColor) ? `background:${p.frameColor}` : ''}"><input type="color" data-fc-pick value="${/^#[0-9a-f]{6}$/i.test(p.frameColor || '') ? p.frameColor : '#ffbfd3'}" aria-label="Pick any frame colour"></label></div>
    ${tog('showName', 'lingcam name', 'Under your photos', p.showName !== false)}
    ${tog('showDate', 'Date', 'Or your own words below', p.showDate !== false)}
    ${tog('rounded', 'Rounded corners', 'Softer photo corners', p.rounded)}
    <label class="lbl" for="cap">Words instead of the date</label><input id="cap" class="tin" maxlength="24" placeholder="${dateText(p.created)}" value="${esc(p.caption || '')}">`;
    const fr = $('#frow');
    FRAMES.filter((f) => fcat === 'All' || f.cat === fcat).forEach((f) => { const b = document.createElement('button'); b.setAttribute('aria-pressed', String(p.frame === f.id && !p.frameColor)); b.setAttribute('aria-label', f.name); b.title = f.name; b.appendChild(thumb({ ...p, frame: f.id, frameColor: null, photos: [] }, 54, 80, E.imgs)); b.onclick = () => { snap(); p.frame = f.id; p.frameColor = null; rebuildBase(); renderPane(); }; fr.appendChild(b); });
    const sel = fr.querySelector('[aria-pressed="true"]'); if (sel) sel.scrollIntoView({ inline: 'center', block: 'nearest' });
    $$('[data-fcat]', pane).forEach((b) => (b.onclick = () => { E.fcat = b.dataset.fcat; renderPane(); }));
    $$('[data-fc]', pane).forEach((b) => (b.onclick = () => { snap(); p.frameColor = b.dataset.fc || null; rebuildBase(); renderPane(); }));
    const fp = $('[data-fc-pick]', pane); fp.oninput = () => { if (!E.typing) { snap(); E.typing = true; } p.frameColor = fp.value; rebuildBase(); }; fp.onchange = () => { E.typing = false; renderPane(); };
    $$('[data-tog]', pane).forEach((b) => (b.onclick = () => { snap(); const k = b.dataset.tog; p[k] = !(k === 'rounded' ? p[k] : p[k] !== false); rebuildBase(); renderPane(); }));
    const cap = $('#cap'); cap.oninput = () => { if (!E.typing) { snap(); E.typing = true; } p.caption = cap.value; rebuildBase(); }; cap.onblur = () => (E.typing = false);
  } else if (E.tab === 'filter') {
    pane.innerHTML = `<div class="lbl">Filter for all photos</div><div class="fl-row light" style="padding:0;flex-wrap:wrap" role="group" aria-label="Filters">${FILTERS.map((f) => `<button class="fl" data-fl="${f.id}" aria-pressed="${p.filter === f.id}"><span class="th"></span>${esc(f.name)}</button>`).join('')}</div>`;
    const src = E.imgs.find(Boolean);
    let small = null;
    if (src) { small = document.createElement('canvas'); small.width = small.height = 112; const x = small.getContext('2d'); const iw = src.naturalWidth, ih = src.naturalHeight, m = Math.min(iw, ih); x.drawImage(src, (iw - m) / 2, (ih - m) / 2, m, m, 0, 0, 112, 112); }
    $$('[data-fl]', pane).forEach((b) => {
      const th = b.querySelector('.th');
      if (small) { const c = filtered(small, b.dataset.fl); const out = document.createElement('canvas'); out.width = out.height = 112; out.getContext('2d').drawImage(c, 0, 0); th.appendChild(out); }
      b.onclick = () => { snap(); p.filter = b.dataset.fl; rebuildBase(); $$('[data-fl]', pane).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); };
    });
  }
}

// ---- your own stickers ----
function loadImage(file) { return new Promise((ok, bad) => { const u = URL.createObjectURL(file); const i = new Image(); i.onload = () => ok(i); i.onerror = () => bad(new Error('That file is not a picture Lingcam can open')); i.src = u; }); }
function removeBg(cv, tol = 42) {
  const w = cv.width, h = cv.height, x = cv.getContext('2d', { willReadFrequently: true }); const d = x.getImageData(0, 0, w, h), a = d.data;
  const seen = new Uint8Array(w * h); const st = [];
  const seed = (i) => { if (!seen[i] && a[i * 4 + 3] > 0) { seen[i] = 1; st.push([i, a[i * 4], a[i * 4 + 1], a[i * 4 + 2]]); } };
  for (let i = 0; i < w; i++) { seed(i); seed((h - 1) * w + i); } for (let j = 0; j < h; j++) { seed(j * w); seed(j * w + w - 1); }
  const t2 = tol * tol;
  while (st.length) {
    const [i, r, g, b] = st.pop(); a[i * 4 + 3] = 0;
    const px = i % w, py = (i / w) | 0;
    for (const [nx, ny] of [[px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const n = ny * w + nx; if (seen[n]) continue;
      const dr = a[n * 4] - r, dg = a[n * 4 + 1] - g, db = a[n * 4 + 2] - b;
      if (dr * dr + dg * dg + db * db < t2 && a[n * 4 + 3] > 0) { seen[n] = 1; st.push([n, a[n * 4], a[n * 4 + 1], a[n * 4 + 2]]); }
    }
  }
  // soften the cut edge
  for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) { const n = j * w + i; if (a[n * 4 + 3] === 255 && (a[(n - 1) * 4 + 3] === 0 || a[(n + 1) * 4 + 3] === 0 || a[(n - w) * 4 + 3] === 0 || a[(n + w) * 4 + 3] === 0)) a[n * 4 + 3] = 170; }
  x.putImageData(d, 0, 0); return cv;
}
function trim(cv) {
  const w = cv.width, h = cv.height, a = cv.getContext('2d').getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a[(y * w + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return cv; const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(cv, -x0, -y0); return o;
}
function shapeClip(ctx, shape, w, h) {
  ctx.beginPath();
  if (shape === 'circle') { const r = Math.min(w, h) / 2; ctx.arc(w / 2, h / 2, r, 0, 7); }
  else if (shape === 'heart') { const s = Math.min(w, h); ctx.save(); ctx.translate((w - s) / 2, (h - s) / 2); ctx.scale(s / 100, s / 100); ctx.moveTo(50, 92); ctx.bezierCurveTo(6, 62, 0, 36, 12, 20); ctx.bezierCurveTo(24, 6, 44, 8, 50, 26); ctx.bezierCurveTo(56, 8, 76, 6, 88, 20); ctx.bezierCurveTo(100, 36, 94, 62, 50, 92); ctx.restore(); }
  else if (shape === 'rounded') roundRect(ctx, 0, 0, w, h, Math.min(w, h) * 0.16);
  else ctx.rect(0, 0, w, h);
  ctx.closePath(); ctx.clip();
}
function buildSticker(img, o) {
  const max = 560, sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  let cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * sc); cv.height = Math.round(img.naturalHeight * sc);
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  if (o.cut) { cv = trim(removeBg(cv, o.tol)); }
  if (o.shape !== 'none') { const w = cv.width, h = cv.height, s = Math.min(w, h); const sq = document.createElement('canvas'); const sw = o.shape === 'rounded' ? w : s, sh = o.shape === 'rounded' ? h : s; sq.width = sw; sq.height = sh; const x = sq.getContext('2d'); shapeClip(x, o.shape, sw, sh); x.drawImage(cv, (sw - w) / 2, (sh - h) / 2); cv = sq; }
  if (o.border) {
    const b = Math.max(6, Math.round(Math.max(cv.width, cv.height) * 0.035));
    const out = document.createElement('canvas'); out.width = cv.width + b * 2; out.height = cv.height + b * 2;
    const sil = document.createElement('canvas'); sil.width = cv.width; sil.height = cv.height; const sx = sil.getContext('2d'); sx.drawImage(cv, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#fff'; sx.fillRect(0, 0, sil.width, sil.height);
    const x = out.getContext('2d'); x.shadowColor = 'rgba(61,36,51,.25)'; x.shadowBlur = b * 0.8; x.shadowOffsetY = b * 0.3;
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; x.drawImage(sil, b + Math.cos(a) * b, b + Math.sin(a) * b); }
    x.shadowColor = 'transparent'; x.drawImage(cv, b, b); cv = out;
  }
  return cv;
}
async function importSticker() {
  const files = await pickFiles(false); if (!files.length) return;
  let img; try { img = await loadImage(files[0]); } catch (e) { toast(e.message); return; }
  const o = { cut: false, tol: 42, shape: 'none', border: true };
  const d = openSheet(`<h2>Make a sticker</h2><div class="pvw checker" id="spv"></div>
  ${tog('cut', 'Remove background', 'Works best on a plain background', o.cut)}
  <div id="tolRow" style="display:none"><label class="lbl" for="tol">How much to remove</label><input id="tol" type="range" min="10" max="120" value="${o.tol}" style="width:100%"></div>
  <div class="lbl">Shape</div>${seg('shape', [['none', 'Original'], ['circle', 'Circle'], ['heart', 'Heart'], ['rounded', 'Rounded']], o.shape)}
  ${tog('border', 'White border', 'Looks like a real sticker', o.border)}
  <div class="row"><button class="btn alt" data-n>Cancel</button><button class="btn" data-y>${ic('check')}<span>Save sticker</span></button></div>`);
  let cv = null, t = 0;
  const redo = () => { clearTimeout(t); t = setTimeout(() => { cv = buildSticker(img, o); const box = $('#spv', d); box.innerHTML = ''; const im = new Image(); im.alt = 'Sticker preview'; im.src = cv.toDataURL('image/png'); box.appendChild(im); }, 60); };
  $$('[data-tog]', d).forEach((b) => (b.onclick = () => { const k = b.dataset.tog; o[k] = !o[k]; b.setAttribute('aria-checked', String(o[k])); $('#tolRow', d).style.display = o.cut ? '' : 'none'; redo(); }));
  $$('[data-seg]', d).forEach((b) => (b.onclick = () => { o.shape = b.dataset.v; $$('[data-seg]', d).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); redo(); }));
  $('#tol', d).oninput = (e) => { o.tol = +e.target.value; redo(); };
  d.querySelector('[data-n]').onclick = () => closeSheet();
  d.querySelector('[data-y]').onclick = async () => {
    if (!cv) cv = buildSticker(img, o);
    const src = cv.toDataURL('image/png'), st = { id: uid(), src, ar: cv.width / cv.height, created: Date.now() };
    try { await MyStickers.put(st); } catch (e) { toast('Could not save the sticker'); return; }
    closeSheet(); E.cat = 'mine'; await readyPics([{ t: 'image', src }]);
    const cut = cutById(S.p.cut); addItem({ t: 'image', src, ar: st.ar, size: Math.min(cut.W, cut.H) * 0.3 }); renderPane(); toast('Sticker saved to ★ Mine', 1800);
  };
  redo();
}
async function finish() {
  const p = S.p; E.sel = -1; draw();
  const btn = $('#fin'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
  try {
    const strip = await renderStrip(p, 1);
    const tw = 260, th = Math.round(strip.height * tw / strip.width), t = document.createElement('canvas'); t.width = tw; t.height = th; t.getContext('2d').drawImage(strip, 0, 0, tw, th);
    p.thumb = t.toDataURL('image/jpeg', 0.85); p.updated = Date.now(); p.mode = S.mode;
    await Strips.put(clone(p));
    S.doneStrip = strip;
    go('done');
  } catch (e) { console.error(e); toast('Could not save your strip. Your phone may be out of space.'); btn.disabled = false; btn.textContent = 'Done'; }
}

// ---------------- Done ----------------
SCREENS.done = () => {
  const p = S.p;
  main.innerHTML = `<section class="scr">${top('Your strip is ready', 0, `<button class="ibtn" id="homeB" aria-label="Home">${ic('home')}</button>`)}
  <div class="printer"><div class="slot"><span class="logo">lingcam<i>.</i></span></div><div class="paper" id="paper"></div></div>
  <div class="acts col"><button class="act" id="save">${ic('download')}<span>${N.isAndroidApp() ? 'Save to gallery' : 'Save'}</span></button><button class="act hot" id="shr">${ic('share')}<span>Share</span></button><button class="act" id="gifb">${ic('gif')}<span>Make GIF</span></button></div>
  <div class="foot col"><button class="btn alt" id="edit">${ic('pen')}<span>Edit</span></button><button class="btn alt" id="homeB2">${ic('home')}<span>Home</span></button><button class="btn" id="again" style="flex:1.3">${ic('cam')}<span>New booth</span></button></div></section>`;
  (async () => {
    const cv = S.doneStrip || (await renderStrip(p, 1)); S.doneStrip = null;
    const img = new Image(); img.alt = 'Your lingcam strip'; img.src = cv.toDataURL('image/jpeg', 0.92); $('#paper').appendChild(img);
    if (Settings.get().sound) setTimeout(() => tone(660, 0.6, 0.05, 'triangle'), 200);
  })();
  $('#save').onclick = () => saveAs(p, 'strip');
  $('#shr').onclick = () => shareSheet(p);
  $('#gifb').onclick = () => go('gif');
  $('#edit').onclick = () => { if (S.stack[S.stack.length - 2] === 'decorate') back(); else go('decorate'); };
  $('#again').onclick = () => { S.p = newProject(); S.mode = 'camera'; S.retake = null; E.reset(); go('cut', { reset: true }); S.stack = ['home', 'cut']; };
  $('#homeB').onclick = goHome; $('#homeB2').onclick = goHome;
  toast('Saved to My strips', 1800);
  setTimeout(confetti, 1900);
};
const fname = (p, ext, kind = 'strip') => `lingcam-${kind}-${dateText(p.created).replace(/\./g, '')}-${p.id.slice(-4)}.${ext}`;
async function asset(p, fmt, onProg) {
  if (fmt === 'gif') { const g = await makeGif(p, S.gifStyle || 'boomerang', S.gifSpeed || 'normal', onProg); return { blob: g.blob, name: fname(p, 'gif', 'gif') }; }
  if (fmt === 'story' || fmt === 'square') { const cv = await renderPost(p, fmt); return { blob: await toBlob(cv, 'image/jpeg', 0.92), name: fname(p, 'jpg', fmt), cv }; }
  if (fmt === 'print') { const cv = await renderPrint(p); return { blob: await toBlob(cv, 'image/jpeg', 0.95), name: fname(p, 'jpg', 'print'), cv }; }
  const cut = cutById(p.cut); const cv = await renderStrip(p, cut.W <= 600 ? 1.6 : 1);
  return { blob: await toBlob(cv, 'image/png'), name: fname(p, 'png'), cv };
}
async function saveAs(p, fmt) {
  try { const a = await asset(p, fmt); const r = await N.saveFile(a.blob, a.name); toast(r === 'gallery' ? 'Saved to your gallery (Lingcam album)' : 'Saved to your downloads'); }
  catch (e) { console.error(e); toast(/denied|permission/i.test(String(e && (e.message || e.code))) ? 'Lingcam needs permission to save photos' : 'Could not save. Try again.'); }
}
function shareSheet(p, startFmt = 'strip') {
  let fmt = startFmt; const cache = {};
  const winApp = N.isWindowsApp();
  const d = openSheet(`<h2>Share your strip</h2><div class="pvw" id="pvw"><span class="spin dark"></span></div>
  <div class="chips" role="group" aria-label="Format">${[['strip', 'Strip'], ['story', 'Story 9:16'], ['square', 'Square'], ['gif', 'GIF']].map(([k, l]) => `<button class="chip" data-fm="${k}" aria-pressed="${k === fmt}">${l}</button>`).join('')}</div>
  <div>
  <button class="srow" data-a="share"><span class="ic">${ic(winApp ? 'copy' : 'share')}</span><span><b>${winApp ? 'Copy picture' : 'Share to apps'}</b><small>${winApp ? 'Then paste it in WhatsApp, Instagram or anywhere' : 'WhatsApp, Instagram, Telegram and more'}</small></span></button>
  <button class="srow" data-a="save"><span class="ic">${ic('download')}</span><span><b>${N.isAndroidApp() ? 'Save to gallery' : 'Save picture'}</b><small id="savesub">PNG, full quality</small></span></button>
  <button class="srow" data-a="print"><span class="ic">${ic('print')}</span><span><b>Save for printing</b><small>4 × 6 in photo paper${cutById(p.cut).kind === 'strip' ? ', 2 strips side by side' : ''}</small></span></button>
  <button class="srow" data-a="link"><span class="ic">${ic('link')}</span><span><b>Copy a link</b><small id="linksub">Friends open it in any browser. Link lasts 7 days</small></span></button>
  </div>`);
  const pv = () => {
    const box = $('#pvw', d); box.innerHTML = '<span class="spin dark"></span>';
    $('#savesub', d).textContent = { strip: 'PNG, full quality', story: '1080 × 1920 JPG for Stories', square: '1080 × 1080 JPG for posts', gif: 'Animated GIF' }[fmt];
    $('[data-a="link"]', d).style.display = fmt === 'gif' ? 'none' : '';
    const f = fmt;
    (cache[f] = cache[f] || asset(p, f)).then((a) => { if (f !== fmt || !d.isConnected) return; const im = new Image(); im.alt = 'Preview'; im.src = URL.createObjectURL(a.blob); box.innerHTML = ''; box.appendChild(im); }).catch(() => { box.textContent = 'Could not make this picture'; });
  };
  $$('[data-fm]', d).forEach((b) => (b.onclick = () => { fmt = b.dataset.fm; $$('[data-fm]', d).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); pv(); }));
  pv();
  const busy = async (btn, fn) => { if (btn.dataset.busy) return; btn.dataset.busy = 1; const ic0 = btn.querySelector('.ic').innerHTML; btn.querySelector('.ic').innerHTML = '<span class="spin dark"></span>'; try { await fn(); } finally { delete btn.dataset.busy; btn.querySelector('.ic').innerHTML = ic0; } };
  $$('[data-a]', d).forEach((b) => (b.onclick = () => busy(b, async () => {
    const a = b.dataset.a;
    try {
      if (a === 'share') { const as = await (cache[fmt] = cache[fmt] || asset(p, fmt)); const r = await N.shareFile(as.blob, as.name, 'Made with lingcam ♥'); if (r === 'copied') toast('Picture copied. Paste it anywhere.'); else if (r === 'downloaded') toast('Saved. Share it from your downloads.'); }
      else if (a === 'save') { const as = await (cache[fmt] = cache[fmt] || asset(p, fmt)); const r = await N.saveFile(as.blob, as.name); toast(r === 'gallery' ? 'Saved to your gallery (Lingcam album)' : 'Saved to your downloads'); }
      else if (a === 'print') { const as = await asset(p, 'print'); const r = await N.saveFile(as.blob, as.name); toast(r === 'gallery' ? 'Print sheet saved to your gallery' : 'Print sheet saved. Print it at 4 × 6 in.'); }
      else if (a === 'link') { const url = await makeLink(p, fmt); const ok = await N.copyText(url); $('#linksub', d).innerHTML = `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url.replace(/^https?:\/\//, ''))}</a>`; toast(ok ? 'Link copied' : 'Here is your link'); }
    } catch (e) { console.error(e); toast(e && e.userMsg ? e.userMsg : 'Something went wrong. Try again.'); }
  })));
}
async function makeLink(p, fmt) {
  if (p.links && p.links[fmt] && p.links[fmt].exp > Date.now() + 3600e3) return p.links[fmt].url;
  const src = fmt === 'strip' ? await renderStrip(p, 1) : (await asset(p, fmt)).cv;
  const sc = Math.min(1, 1700 / Math.max(src.width, src.height));
  const cv = document.createElement('canvas'); cv.width = Math.round(src.width * sc); cv.height = Math.round(src.height * sc); cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
  let q = 0.86, data = cv.toDataURL('image/jpeg', q); while (data.length > 900000 && q > 0.5) { q -= 0.1; data = cv.toDataURL('image/jpeg', q); }
  let r;
  try { r = await fetch(N.api('api/share'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ img: data }) }); }
  catch (e) { const er = new Error('offline'); er.userMsg = 'No internet. Connect and try again.'; throw er; }
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.id) { const er = new Error('server'); er.userMsg = j.error || 'Links are not working right now'; throw er; }
  const url = N.site() + 's/' + j.id;
  p.links = { ...(p.links || {}), [fmt]: { url, exp: Date.now() + 7 * 864e5 } };
  Strips.get(p.id).then((rec) => rec && Strips.put({ ...rec, links: p.links })).catch(() => {});
  return url;
}

// ---------------- GIF ----------------
SCREENS.gif = () => {
  const p = S.p; S.gifStyle = S.gifStyle || 'boomerang'; S.gifSpeed = S.gifSpeed || 'normal';
  main.innerHTML = `<section class="scr">${top('Make a GIF', 0, `<button class="ibtn" data-home aria-label="Home">${ic('home')}</button>`)}
  <div class="gif-box"><canvas id="gcv" width="10" height="10" aria-label="GIF preview"></canvas></div>
  <div class="gif-opts"><div class="lbl">Style</div>${seg('gstyle', [['loop', 'Loop'], ['boomerang', 'Boomerang'], ['flash', 'Flash']], S.gifStyle)}<div class="lbl">Speed</div>${seg('gspeed', [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']], S.gifSpeed)}</div>
  <div class="foot col"><button class="btn alt" id="gsave">${ic('download')}<span>Save</span></button><button class="btn" id="gshare" style="flex:1.4">${ic('share')}<span>Share GIF</span></button></div></section>`;
  let cur = null, tok = 0;
  const build = async () => {
    const t = ++tok; if (S.gifAnim) cancelAnimationFrame(S.gifAnim);
    $('#gsave').disabled = $('#gshare').disabled = true;
    const g = await makeGif(p, S.gifStyle, S.gifSpeed); if (t !== tok || !$('#gcv')) return;
    cur = g; $('#gsave').disabled = $('#gshare').disabled = false;
    const cv = $('#gcv'); cv.width = g.frames[0].c.width; cv.height = g.frames[0].c.height; const x = cv.getContext('2d');
    let i = 0, last = 0;
    const loop = (ts) => { if (!$('#gcv')) return; if (ts - last >= g.frames[i].d) { x.drawImage(g.frames[i].c, 0, 0); last = ts; i = (i + 1) % g.frames.length; } S.gifAnim = requestAnimationFrame(loop); };
    S.gifAnim = requestAnimationFrame(loop);
  };
  $$('[data-seg]').forEach((b) => (b.onclick = () => { const k = b.dataset.seg; if (k === 'gstyle') S.gifStyle = b.dataset.v; else S.gifSpeed = b.dataset.v; $$(`[data-seg="${k}"]`).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); build(); }));
  $('#gsave').onclick = async () => { if (!cur) return; try { const r = await N.saveFile(cur.blob, fname(p, 'gif', 'gif')); toast(r === 'gallery' ? 'GIF saved to your gallery' : 'GIF saved to your downloads'); } catch (e) { toast('Could not save the GIF'); } };
  $('#gshare').onclick = async () => { if (!cur) return; try { const r = await N.shareFile(cur.blob, fname(p, 'gif', 'gif'), 'Made with lingcam ♥'); if (r === 'downloaded' || r === 'copied') toast('GIF saved. Share it from your downloads.'); } catch (e) { toast('Could not share the GIF'); } };
  build();
};

// ---------------- My strips ----------------
SCREENS.strips = () => {
  let filt = 'all';
  main.innerHTML = `<section class="scr">${top('My strips', 0, '<span id="cnt" style="font-weight:700;color:var(--muted)"></span>')}
  <div style="padding:8px 18px 0"><div class="chips" role="group" aria-label="Show">${[['all', 'All'], ['strip', 'Strips'], ['grid', 'Grids'], ['fave', '♥ Faves']].map(([k, l]) => `<button class="chip" data-sf="${k}" aria-pressed="${k === filt}">${l}</button>`).join('')}</div></div>
  <div class="scroll" id="sl"><div class="empty"><span class="spin dark"></span></div></div></section>`;
  if (S.stack.length === 1) $('[data-back]').style.visibility = 'hidden';
  const list = async () => {
    let all = []; try { all = await Strips.list(); } catch (e) {}
    if (!$('#sl')) return;
    $('#cnt').textContent = all.length || '';
    const rows = all.filter((r) => filt === 'all' || (filt === 'fave' ? r.fave : cutById(r.cut).kind === filt));
    const fmtD = (t) => { const d = new Date(t), now = new Date(); if (d.toDateString() === now.toDateString()) return 'Today'; return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); };
    $('#sl').innerHTML = rows.length ? `<div class="sgrid">${rows.map((r) => `<button class="sitem" data-id="${r.id}"><img src="${r.thumb || ''}" alt="Strip from ${fmtD(r.created)}"><span>${fmtD(r.created)}</span>${r.fave ? '<span class="fav" aria-label="Favourite">♥</span>' : ''}</button>`).join('')}</div>`
      : `<div class="empty">${miniStrip(3, C.paper, 0)}<b>${filt === 'fave' ? 'No faves yet' : 'No strips yet'}</b><span>${filt === 'fave' ? 'Tap the heart on a strip to keep it here.' : 'Your strips stay here on this device.'}</span>${filt === 'all' ? `<button class="btn" id="mk">${ic('cam')}<span>Start the booth</span></button>` : ''}</div>`;
    $$('[data-id]').forEach((b) => (b.onclick = () => stripSheet(b.dataset.id, list)));
    if ($('#mk')) $('#mk').onclick = () => { S.p = newProject(); S.mode = 'camera'; go('cut'); };
  };
  $$('[data-sf]').forEach((b) => (b.onclick = () => { filt = b.dataset.sf; $$('[data-sf]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); list(); }));
  list();
};
async function stripSheet(id, refresh) {
  const rec = await Strips.get(id); if (!rec) return;
  const d = openSheet(`<div class="pvw" style="height:300px"><img src="${rec.thumb}" alt="Your strip" style="max-height:280px"></div>
  <div class="acts" style="padding:0"><button class="act hot" data-s="share">${ic('share')}<span>Share</span></button><button class="act" data-s="edit">${ic('pen')}<span>Edit again</span></button><button class="act" data-s="fave" aria-pressed="${!!rec.fave}">${ic('heart')}<span>${rec.fave ? 'Unfave' : 'Fave'}</span></button></div>
  <div class="row"><button class="btn alt block" data-s="gif">${ic('gif')}<span>Make GIF</span></button><button class="btn alt block" data-s="del" style="color:var(--hot)">${ic('trash')}<span>Delete</span></button></div>`);
  renderStrip(rec, 0.6).then((cv) => { const im = d.querySelector('.pvw img'); if (im) im.src = cv.toDataURL('image/jpeg', 0.9); }).catch(() => {});
  $$('[data-s]', d).forEach((b) => (b.onclick = async () => {
    const a = b.dataset.s;
    if (a === 'share') { closeSheet(); shareSheet(rec); }
    else if (a === 'edit') { S.p = clone(rec); delete S.p.thumb; S.mode = rec.mode || 'camera'; E.reset(); closeSheet(); go('decorate'); }
    else if (a === 'gif') { S.p = clone(rec); closeSheet(); go('gif'); }
    else if (a === 'fave') { rec.fave = !rec.fave; await Strips.put(rec); closeSheet(); refresh(); toast(rec.fave ? 'Added to faves' : 'Removed from faves', 1400); }
    else if (a === 'del') { closeSheet(); if (await confirmBox('Delete this strip?', 'It will be gone from this device. This cannot be undone.')) { await Strips.del(id); refresh(); toast('Strip deleted', 1400); } }
  }));
}

// ---------------- Settings ----------------
SCREENS.settings = () => {
  const s = Settings.get(), app = N.isApp();
  main.innerHTML = `<section class="scr">${top('Settings')}<div class="scroll"><div class="sets col">
  <div class="box"><h3>Booth</h3><div class="lbl">Countdown</div>${seg('countdown', [[3, '3 s'], [5, '5 s'], [10, '10 s']], s.countdown)}
  <div class="lbl">Between photos</div>${seg('auto', [['1', 'Auto'], ['0', 'Tap each']], s.auto ? '1' : '0')}
  ${tog('flash', 'Flash', 'The screen turns white for a bright selfie', s.flash)}${tog('mirror', 'Mirror the selfie camera', 'Photos look the way you see them on screen', s.mirror)}${tog('sound', 'Sounds', 'Countdown beeps and shutter click', s.sound)}</div>
  ${app ? `<div class="box"><h3>Lingcam website</h3><p>Used for share links and updates. Leave empty to use ${esc(N.DEFAULT_SITE)}</p><input class="tin" id="site" inputmode="url" placeholder="${esc(N.DEFAULT_SITE)}" value="${esc(s.site)}"><button class="btn alt sm" id="siteSave">Save</button></div>` : ''}
  <div class="box"><h3>Updates</h3><p>${app ? 'Lingcam checks your website for a newer version.' : 'The website updates by itself. Get the apps here:'}</p>${app ? '<button class="btn alt sm" id="upd">Check for updates</button>' : '<div class="row" style="flex-wrap:wrap"><button class="btn alt sm" id="getA">Android app</button><button class="btn alt sm" id="getW">Windows app</button></div>'}</div>
  <div class="box"><h3>Privacy</h3><p>Your photos and strips are kept only on this device. Nothing is uploaded unless you tap <b>Copy a link</b>; then one picture is put on your Lingcam website and is deleted after 7 days.</p><p id="scount"></p></div>
  <p class="ver">Lingcam ${VERSION} · ${N.platformName() === 'web' ? 'website' : N.platformName() === 'android' ? 'Android' : 'Windows'} · no account, no ads</p>
  </div></div></section>`;
  if (S.stack.length === 1) $('[data-back]').style.visibility = 'hidden';
  bindSettings(main);
  Strips.count().then((n) => { const el = $('#scount'); if (el) el.textContent = `${n} strip${n === 1 ? '' : 's'} on this device.`; }).catch(() => {});
  if ($('#siteSave')) $('#siteSave').onclick = () => { Settings.set({ site: $('#site').value.trim() }); toast('Saved'); };
  if ($('#upd')) $('#upd').onclick = () => checkUpdate(true);
  const getApp = async (k) => { try { const j = await (await fetch(N.api('version.json') + '?t=' + Date.now(), { cache: 'no-store' })).json(); const u = j[k]; if (!u) return toast('Not available yet'); N.openUrl(/^https?:/.test(u) ? u : N.site() + u); } catch (e) { toast('Could not reach the website'); } };
  if ($('#getA')) $('#getA').onclick = () => getApp('android');
  if ($('#getW')) $('#getW').onclick = () => getApp('windows');
};

// ---------------- updates ----------------
const newer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) > (y[i] || 0)) return true; if ((x[i] || 0) < (y[i] || 0)) return false; } return false; };
async function checkUpdate(manual) {
  if (!N.isApp()) return;
  try {
    const r = await fetch(N.api('version.json') + '?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    if (newer(j.version, VERSION)) { S.update = j; if (manual) updateDialog(j); else if (S.stack[S.stack.length - 1] === 'home') show('home'); }
    else if (manual) toast(`You have the newest version (${VERSION})`);
  } catch (e) { if (manual) toast("Couldn't check for updates. Check the Lingcam website in Settings."); }
}
function updateDialog(j) {
  const k = N.isAndroidApp() ? 'android' : 'windows'; const u = j[k];
  const d = openSheet(`<h2>Lingcam ${esc(j.version)}</h2>${(j.notes || []).length ? `<ul>${j.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : '<p>A newer version is ready.</p>'}<p>${k === 'android' ? 'Download the new APK and open it to update. Your strips stay.' : 'Download the new installer and run it. Your strips stay.'}</p><div class="row"><button class="btn alt" data-n>Later</button><button class="btn" data-y ${u ? '' : 'disabled'}>Download</button></div>`, 'dlg');
  d.querySelector('[data-n]').onclick = () => closeSheet();
  d.querySelector('[data-y]').onclick = () => { closeSheet(); N.openUrl(/^https?:/.test(u) ? u : N.site() + u); };
}

// ---------------- start ----------------
function start() {
  $$('.side-a').forEach((a) => (a.onclick = () => { const n = a.dataset.nav; if (n === 'home') go('home', { reset: true }); else go(n, { reset: true }); }));
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && S.stack[S.stack.length - 1] === 'camera' && !e.target.matches('input, textarea, button')) { e.preventDefault(); shoot(); }
    if (e.key === 'Escape' && S.sheet) closeSheet();
  });
  document.addEventListener('visibilitychange', () => {
    if (S.stack[S.stack.length - 1] !== 'camera') return;
    if (document.hidden) { S.tok++; S.busy = false; S.waitTap = null; stopCamera(); }
    else { show('camera'); }
  });
  N.onBack(() => back());
  if (!N.isApp()) { history.pushState({ lc: 1 }, ''); window.addEventListener('popstate', () => { if (back()) history.pushState({ lc: 1 }, ''); }); }
  fontsReady(); readyStickers();
  go('home', { reset: true });
  if (N.isApp()) setTimeout(() => checkUpdate(false), 2500);
  if (!N.isApp() && 'serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
start();
window.__lc = { S, E, go };
