// Lingcam drawing: turns a project (cut + frame + photos + decorations) into a picture
import { cutById, geom, frameById, filterById, STICKERS, FONTS, fontById, roundRect, C, stk, readyAllStickers } from './data.js';

const imgCache = new Map();
export function loadImg(src) {
  if (imgCache.has(src)) return imgCache.get(src);
  const p = new Promise((ok, bad) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = bad; i.src = src; });
  imgCache.set(src, p);
  if (imgCache.size > 80) imgCache.delete(imgCache.keys().next().value);
  return p;
}
export const stickerImg = (k) => stk(k);
export async function readyStickers() { await readyAllStickers(); }
// pictures used as stickers (imported by the person), kept decoded by their data URL
const picImgs = new Map();
export function picImg(src) {
  let i = picImgs.get(src);
  if (!i) { i = new Image(); i.src = src; picImgs.set(src, i); if (picImgs.size > 60) picImgs.delete(picImgs.keys().next().value); }
  return i;
}
export async function readyPics(items) {
  await Promise.all((items || []).filter((it) => it.t === 'image').map((it) => { const i = picImg(it.src); return i.complete && i.naturalWidth ? 0 : new Promise((r) => { i.onload = r; i.onerror = r; }); }));
}
export async function fontsReady() {
  try {
    await Promise.all(['700 20px Fredoka', '600 20px Fredoka', '400 20px "DM Sans"', '700 20px "DM Sans"'].concat(FONTS.map((f) => `${f.style || 'normal'} ${f.weight} 20px "${f.css}"`)).map((f) => document.fonts.load(f)));
  } catch (e) {}
}

// ---- filters (done on pixels so the saved photo matches on every phone) ----
const filtCache = new WeakMap();
export function filtered(img, fid) {
  const f = filterById(fid);
  if (!f.m && !f.grain) return img;
  let m = filtCache.get(img); if (!m) { m = new Map(); filtCache.set(img, m); }
  if (m.has(fid)) return m.get(fid);
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const x = cv.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, w, h), a = d.data;
  const M = f.m || [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0]];
  const g = f.grain || 0;
  let seed = 1234567;
  for (let i = 0; i < a.length; i += 4) {
    const r = a[i], gg = a[i + 1], b = a[i + 2];
    let n = 0; if (g) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; n = ((seed / 0x7fffffff) - 0.5) * g; }
    a[i] = M[0][0] * r + M[0][1] * gg + M[0][2] * b + M[0][3] + n;
    a[i + 1] = M[1][0] * r + M[1][1] * gg + M[1][2] * b + M[1][3] + n;
    a[i + 2] = M[2][0] * r + M[2][1] * gg + M[2][2] * b + M[2][3] + n;
  }
  x.putImageData(d, 0, 0);
  m.set(fid, cv);
  return cv;
}

function cover(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih), sw = w / s, sh = h / s;
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
}
export function dateText(ts) {
  const d = new Date(ts || Date.now());
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(2)}`;
}
function isDark(hex) {
  const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) < 140;
}

// base = frame + photos + footer (no decorations). Cached by the editor while dragging.
export function drawBase(ctx, p, imgs) {
  const cut = geom(p), fr = frameById(p.frame), s = cut.W / 600;
  ctx.save();
  if (p.frameColor) { ctx.fillStyle = p.frameColor; ctx.fillRect(0, 0, cut.W, cut.H); } else fr.bg(ctx, cut.W, cut.H, s);
  const rad = p.rounded ? 22 * s : 0;
  const styled = !p.frameColor;
  cut.cells.forEach((c, i) => {
    if (styled && fr.under) { ctx.save(); fr.under(ctx, c, s, i, cut); ctx.restore(); }
    ctx.save();
    if (styled && fr.clip) { fr.clip(ctx, c, s, i); ctx.clip(); }
    else if (rad) { roundRect(ctx, c.x, c.y, c.w, c.h, rad); ctx.clip(); }
    const img = imgs[i];
    if (img) cover(ctx, filtered(img, p.filter), c.x, c.y, c.w, c.h);
    else { ctx.fillStyle = p.frameColor ? 'rgba(0,0,0,.12)' : fr.cell; ctx.fillRect(c.x, c.y, c.w, c.h); }
    ctx.restore();
    if (styled && fr.cellOver) { ctx.save(); fr.cellOver(ctx, c, s, i, p, cut); ctx.restore(); }
  });
  if (fr.deco && styled) { if (!fr._d || fr._d.cut !== cut.id) fr._d = { cut: cut.id, fn: fr.deco(cut) }; fr._d.fn(ctx, s); }
  if (fr.over && styled) { ctx.save(); fr.over(ctx, cut, s, p); ctx.restore(); }
  // footer: lingcam name + date
  const textCol = p.frameColor ? (isDark(p.frameColor) ? '#fff3c4' : C.ink) : fr.text;
  const last = cut.cells[cut.cells.length - 1];
  const fy = last.y + last.h, fh = cut.H - fy;
  const size = Math.round(Math.min(fh * 0.36, 26 * s + 22));
  const mid = fy + fh * 0.5;
  ctx.textBaseline = 'middle';
  if (p.showName !== false) {
    ctx.font = `700 ${size}px Fredoka, "DM Sans", sans-serif`; ctx.fillStyle = textCol; ctx.textAlign = 'left';
    const x0 = cut.cells[0].x + 4 * s; ctx.fillText('lingcam', x0, mid);
    const w = ctx.measureText('lingcam').width; ctx.fillStyle = isDark(textCol) || textCol === C.muted ? C.hot : '#ffbfd3'; ctx.fillText('.', x0 + w, mid);
  }
  if (p.showDate !== false) {
    ctx.font = `700 ${Math.round(size * 1.05)}px Caveat, cursive`; ctx.fillStyle = textCol; ctx.textAlign = 'right';
    ctx.fillText(p.caption || dateText(p.created), cut.W - cut.cells[0].x - 4 * s, mid);
  }
  ctx.restore();
}

export function drawInk(ctx, p, W, H, layer) {
  if (!p.strokes || !p.strokes.length) return;
  const lc = layer || document.createElement('canvas');
  if (lc.width !== W || lc.height !== H) { lc.width = W; lc.height = H; }
  const x = lc.getContext('2d'); x.clearRect(0, 0, W, H);
  x.lineCap = 'round'; x.lineJoin = 'round';
  p.strokes.forEach((st) => {
    x.globalCompositeOperation = st.erase ? 'destination-out' : 'source-over';
    x.strokeStyle = st.c; x.fillStyle = st.c; x.lineWidth = st.w;
    const pts = st.pts; if (!pts.length) return;
    if (pts.length === 1) { x.beginPath(); x.arc(pts[0][0], pts[0][1], st.w / 2, 0, 7); x.fill(); return; }
    x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; x.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
    const L = pts[pts.length - 1]; x.lineTo(L[0], L[1]); x.stroke();
  });
  x.globalCompositeOperation = 'source-over';
  ctx.drawImage(lc, 0, 0);
}

export function textFont(it) { const f = fontById(it.font); return `${f.style || 'normal'} ${f.weight} ${Math.round(it.size)}px "${f.css}", cursive`; }
// local box of an item (centred on x,y, before rotation)
export function itemBox(ctx, it) {
  if (it.t === 'text') {
    ctx.save(); ctx.font = textFont(it); const lines = String(it.text || ' ').split('\n');
    const w = Math.max(...lines.map((l) => ctx.measureText(l || ' ').width)); ctx.restore();
    const lh = it.size * 1.15, padX = it.bg ? it.size * 0.45 : it.size * 0.1, padY = it.bg ? it.size * 0.22 : 0.05 * it.size;
    return { w: w + padX * 2, h: lh * lines.length + padY * 2, lines, lh };
  }
  if (it.t === 'image') { const a = it.ar || 1; return a >= 1 ? { w: it.size, h: it.size / a } : { w: it.size * a, h: it.size }; }
  return { w: it.size, h: it.size };
}
export function drawItem(ctx, it) {
  ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.r || 0);
  if (it.t === 'sticker') { const im = stickerImg(it.k); if (im && im.complete && im.naturalWidth) ctx.drawImage(im, -it.size / 2, -it.size / 2, it.size, it.size); }
  else if (it.t === 'image') { const im = picImg(it.src); if (im.complete && im.naturalWidth) { const b = itemBox(ctx, it); ctx.drawImage(im, -b.w / 2, -b.h / 2, b.w, b.h); } }
  else if (it.t === 'emoji') { ctx.font = `${Math.round(it.size * 0.86)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(it.ch, 0, it.size * 0.04); }
  else if (it.t === 'text') {
    const b = itemBox(ctx, it);
    if (it.bg) { ctx.fillStyle = it.bg; roundRect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, Math.min(b.h / 2, it.size * 0.5)); ctx.fill(); }
    ctx.font = textFont(it); ctx.fillStyle = it.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (it.outline) { ctx.lineWidth = it.size * 0.16; ctx.strokeStyle = it.outline; ctx.lineJoin = 'round'; }
    if (it.shadow) { ctx.shadowColor = it.shadow; ctx.shadowOffsetX = it.size * 0.07; ctx.shadowOffsetY = it.size * 0.07; ctx.shadowBlur = 0; }
    b.lines.forEach((l, i) => { const y = -b.h / 2 + (it.bg ? it.size * 0.22 : 0.05 * it.size) + b.lh * (i + 0.5); if (it.outline) ctx.strokeText(l, 0, y); ctx.fillText(l, 0, y); });
  }
  ctx.restore();
}

// full picture
export async function renderStrip(p, scale = 1) {
  await fontsReady();
  const cut = geom(p);
  const imgs = await Promise.all(cut.cells.map((_, i) => (p.photos[i] ? loadImg(p.photos[i]) : null)));
  await readyStickers(); await readyPics(p.items);
  const cv = document.createElement('canvas'); cv.width = Math.round(cut.W * scale); cv.height = Math.round(cut.H * scale);
  const ctx = cv.getContext('2d'); ctx.scale(scale, scale);
  drawBase(ctx, p, imgs);
  drawInk(ctx, p, cut.W, cut.H);
  (p.items || []).forEach((it) => drawItem(ctx, it));
  return cv;
}

// one photo in its frame, used for GIF frames
export async function renderCard(p, i, W = 540) {
  await fontsReady(); await readyAllStickers();
  const cut = cutById(p.cut), fr = frameById(p.frame);
  const pad = W * 0.06, cw = W - pad * 2, ch = cw / cut.aspect, foot = W * 0.17, H = Math.round(pad + ch + foot);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  const one = { ...cut, W, H, foot, cells: [{ x: pad, y: pad, w: cw, h: ch }], id: cut.id + '-card' };
  const s = W / 600;
  if (p.frameColor) { ctx.fillStyle = p.frameColor; ctx.fillRect(0, 0, W, H); } else fr.bg(ctx, W, H, s);
  const img = p.photos[i] ? await loadImg(p.photos[i]) : null;
  ctx.save(); if (p.rounded) { roundRect(ctx, pad, pad, cw, ch, 22 * s); ctx.clip(); }
  if (img) cover(ctx, filtered(img, p.filter), pad, pad, cw, ch); ctx.restore();
  if (fr.deco && !p.frameColor) fr.deco(one)(ctx, s);
  const textCol = p.frameColor ? (isDark(p.frameColor) ? '#fff3c4' : C.ink) : fr.text;
  const mid = pad + ch + foot * 0.5, size = Math.round(foot * 0.36);
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${size}px Fredoka, sans-serif`; ctx.fillStyle = textCol; ctx.textAlign = 'left'; ctx.fillText('lingcam', pad, mid);
  ctx.fillStyle = isDark(textCol) || textCol === C.muted ? C.hot : '#ffbfd3'; ctx.fillText('.', pad + ctx.measureText('lingcam').width, mid);
  if (p.showDate !== false) { ctx.font = `700 ${size}px Caveat, cursive`; ctx.fillStyle = textCol; ctx.textAlign = 'right'; ctx.fillText(p.caption || dateText(p.created), W - pad, mid); }
  return cv;
}

// Story (9:16) and square posts: the strip on a pink and yellow background
export async function renderPost(p, kind) {
  const strip = await renderStrip(p, 1);
  const W = 1080, H = kind === 'story' ? 1920 : 1080;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H); g.addColorStop(0, '#fff3c4'); g.addColorStop(0.5, '#fff8ec'); g.addColorStop(1, '#ffbfd3'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  for (let y = 0; y < H; y += 54) for (let x = (y / 54) % 2 ? 27 : 0; x < W; x += 54) { ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); }
  const maxH = H * (kind === 'story' ? 0.74 : 0.8), maxW = W * 0.78;
  const sc = Math.min(maxH / strip.height, maxW / strip.width);
  const sw = strip.width * sc, sh = strip.height * sc;
  ctx.save(); ctx.translate(W / 2, H * (kind === 'story' ? 0.46 : 0.5)); ctx.rotate(-0.025);
  ctx.shadowColor = 'rgba(201,58,110,.28)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
  ctx.drawImage(strip, -sw / 2, -sh / 2, sw, sh); ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (kind === 'story') {
    ctx.font = '700 52px Fredoka, sans-serif'; ctx.fillStyle = C.ink; ctx.fillText('lingcam', W / 2 - 8, H - 150);
    ctx.fillStyle = C.hot; ctx.fillText('.', W / 2 + ctx.measureText('lingcam').width / 2 - 4, H - 150);
    ctx.font = '700 40px Caveat, cursive'; ctx.fillStyle = C.muted; ctx.fillText('made in my pocket photo booth', W / 2, H - 92);
  }
  return cv;
}

// 4 x 6 inch print sheet (1200 x 1800): two strips side by side, or one picture centred
export async function renderPrint(p) {
  const strip = await renderStrip(p, 1);
  const W = 1200, H = 1800; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  const cut = geom(p);
  if (cut.kind === 'strip') {
    const sc = Math.min((H - 60) / strip.height, (W / 2 - 40) / strip.width), sw = strip.width * sc, sh = strip.height * sc;
    [W / 4, (3 * W) / 4].forEach((cx) => ctx.drawImage(strip, cx - sw / 2, (H - sh) / 2, sw, sh));
    ctx.strokeStyle = '#ddd'; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  } else {
    const sc = Math.min((W - 80) / strip.width, (H - 80) / strip.height), sw = strip.width * sc, sh = strip.height * sc;
    ctx.drawImage(strip, (W - sw) / 2, (H - sh) / 2, sw, sh);
  }
  return cv;
}

// GIF: Loop, Boomerang or Flash
export async function makeGif(p, style = 'boomerang', speed = 'normal', onProgress) {
  const { GIFEncoder, quantize, applyPalette } = await import('../vendor/gifenc.esm.js');
  const n = cutById(p.cut).cells.length;
  const cards = []; for (let i = 0; i < n; i++) cards.push(await renderCard(p, i, 480));
  const W = cards[0].width, H = cards[0].height;
  let order = [...Array(n).keys()];
  if (style === 'boomerang' && n > 2) order = order.concat(order.slice(1, -1).reverse());
  const delay = { slow: 900, normal: 550, fast: 300 }[speed] || 550;
  const frames = [];
  order.forEach((i) => { frames.push({ c: cards[i], d: delay }); if (style === 'flash') frames.push({ c: 'white', d: 90 }); });
  if (n === 1) frames.push({ c: cards[0], d: delay });
  const white = document.createElement('canvas'); white.width = W; white.height = H; const wx = white.getContext('2d'); wx.fillStyle = '#fff'; wx.fillRect(0, 0, W, H);
  const gif = GIFEncoder();
  frames.forEach((f, k) => {
    const cv = f.c === 'white' ? white : f.c;
    const data = cv.getContext('2d').getImageData(0, 0, W, H).data;
    const pal = quantize(data, 256); const idx = applyPalette(data, pal);
    gif.writeFrame(idx, W, H, { palette: pal, delay: f.d, repeat: 0 });
    onProgress && onProgress((k + 1) / frames.length);
  });
  gif.finish();
  return { blob: new Blob([gif.bytes()], { type: 'image/gif' }), cards, order, frames: frames.map((f) => ({ c: f.c === 'white' ? white : f.c, d: f.d })) };
}

export const toBlob = (cv, type = 'image/png', q = 0.92) => new Promise((ok) => cv.toBlob((b) => ok(b), type, q));
