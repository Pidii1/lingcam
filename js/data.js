// Lingcam data: cuts (layouts), frames, filters, stickers
export const C = {
  pink: '#ffd9e5', pink2: '#ffbfd3', yel: '#fff3c4', yel2: '#ffe589', ink: '#3d2433', muted: '#7a5466', hot: '#c93a6e', paper: '#fffdf7',
};

// ---------- Cuts ----------
// Every size is in strip pixels. foot = space under the photos for the lingcam name and date.
function grid(id, name, sub, cols, rows, W, pad, gap, aspect, foot) {
  const cw = Math.round((W - pad * 2 - gap * (cols - 1)) / cols);
  const ch = Math.round(cw / aspect);
  const H = pad + rows * ch + (rows - 1) * gap + foot;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ x: pad + c * (cw + gap), y: pad + r * (ch + gap), w: cw, h: ch });
  return { id, name, sub, cols, rows, W, H, pad, foot, cells, aspect, kind: cols === 1 && rows > 1 ? 'strip' : 'grid' };
}
export const CUTS = [
  grid('classic', 'Classic strip', '3 photos', 1, 3, 600, 36, 24, 4 / 3, 150),
  grid('long', 'Long strip', '4 photos', 1, 4, 600, 36, 22, 3 / 2, 150),
  grid('square', 'Square grid', '4 photos', 2, 2, 1200, 44, 26, 4 / 5, 180),
  grid('big', 'Big grid', '6 photos', 2, 3, 1200, 44, 26, 4 / 3, 180),
  grid('polaroid', 'Polaroid', '1 photo', 1, 1, 1000, 60, 0, 1, 250),
  grid('duo', 'Wide duo', '2 photos', 2, 1, 1400, 44, 26, 4 / 5, 180),
];
export const cutById = (id) => CUTS.find((c) => c.id === id) || CUTS[0];

// ---------- Frames ----------
// bg(ctx, W, H, s) paints the frame. s = scale (strip width / 600). deco paints fixed extras on top of photos.
const dots = (base, dot, step) => (ctx, W, H, s) => {
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = dot; const st = step * s, r = st * 0.2;
  for (let y = 0, row = 0; y < H + st; y += st, row++) for (let x = (row % 2) * st / 2; x < W + st; x += st) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
};
const solid = (c) => (ctx, W, H) => { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); };
function star(ctx, x, y, r, color, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r; const a = (i * Math.PI) / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}
function heart(ctx, x, y, r, color, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(r / 10, r / 10); ctx.beginPath();
  ctx.moveTo(0, 6); ctx.bezierCurveTo(-12, -2, -6, -12, 0, -5); ctx.bezierCurveTo(6, -12, 12, -2, 0, 6); ctx.closePath();
  ctx.fillStyle = color; ctx.fill(); ctx.restore();
}
function cloud(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath();
  ctx.arc(x, y, r, 0, 7); ctx.arc(x + r * 0.9, y - r * 0.3, r * 0.8, 0, 7); ctx.arc(x + r * 1.7, y, r * 0.7, 0, 7); ctx.arc(x + r * 0.8, y + r * 0.25, r * 0.8, 0, 7); ctx.fill();
}
// little marks scattered on the margins (never on the photos)
function scatter(cut, n, seed, fn) {
  let r = seed; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const out = []; let tries = 0;
  while (out.length < n && tries++ < 400) {
    const last = cut.cells[cut.cells.length - 1]; const x = rnd() * cut.W, y = rnd() * (last.y + last.h + cut.foot * 0.12);
    const inside = cut.cells.some((c) => x > c.x - 6 && x < c.x + c.w + 6 && y > c.y - 6 && y < c.y + c.h + 6);
    if (!inside) out.push([x, y, rnd()]);
  }
  return (ctx, s) => out.forEach(([x, y, k]) => fn(ctx, x, y, s, k));
}
export const FRAMES = [
  { id: 'strawberry', name: 'Strawberry milk', cat: 'Cute', bg: solid('#ffbfd3'), text: C.ink, cell: '#f7a9c1',
    deco: (cut) => scatter(cut, 8, 7, (ctx, x, y, s, k) => heart(ctx, x, y, (13 + k * 9) * s, k > 0.5 ? '#ffffff' : C.hot, (k - 0.5))) },
  { id: 'butter', name: 'Butter stars', cat: 'Cute', bg: solid('#fff3c4'), text: C.muted, cell: '#ffe589',
    deco: (cut) => scatter(cut, 9, 3, (ctx, x, y, s, k) => star(ctx, x, y, (13 + k * 9) * s, k > 0.6 ? '#ffd23f' : '#e3b400', k)) },
  { id: 'pinkdots', name: 'Pink dots', cat: 'Cute', bg: dots('#ff9fbe', '#ffffff', 30), text: C.ink, cell: '#ffd0de' },
  { id: 'gingham', name: 'Lemon gingham', cat: 'Cute', text: C.muted, cell: '#fff3c4',
    bg: (ctx, W, H, s) => { ctx.fillStyle = '#fffdf2'; ctx.fillRect(0, 0, W, H); const st = 14 * s; ctx.fillStyle = 'rgba(255,213,74,.45)'; for (let x = 0; x < W; x += st * 2) ctx.fillRect(x, 0, st, H); for (let y = 0; y < H; y += st * 2) ctx.fillRect(0, y, W, st); } },
  { id: 'paper', name: 'Paper white', cat: 'Plain', bg: solid('#fffdf7'), text: C.muted, cell: '#f1e8e0' },
  { id: 'butterplain', name: 'Soft butter', cat: 'Plain', bg: solid('#ffe589'), text: C.ink, cell: '#fff3c4' },
  { id: 'babypink', name: 'Baby pink', cat: 'Plain', bg: solid('#ffd9e5'), text: C.ink, cell: '#ffbfd3' },
  { id: 'cherry', name: 'Cherry film', cat: 'Film', text: '#ffd9e5', cell: '#2a1520',
    bg: (ctx, W, H, s) => { ctx.fillStyle = '#7a1f3a'; ctx.fillRect(0, 0, W, H); } ,
    deco: (cut) => (ctx, s) => { ctx.fillStyle = 'rgba(255,217,229,.85)'; const hw = 10 * s, hh = 14 * s, side = cut.pad / 2; for (let y = 18 * s; y < cut.H - cut.foot; y += 32 * s) { [side, cut.W - side].forEach((x) => { roundRect(ctx, x - hw / 2, y, hw, hh, 3 * s); ctx.fill(); }); } } },
  { id: 'sepia', name: 'Old film', cat: 'Film', bg: solid('#efe1c6'), text: '#6b4433', cell: '#d8c3a0', filter: 'film' },
  { id: 'midnight', name: 'Midnight', cat: 'Film', bg: solid('#211820'), text: '#ffe589', cell: '#3a2a35',
    deco: (cut) => scatter(cut, 10, 11, (ctx, x, y, s, k) => star(ctx, x, y, (8 + k * 8) * s, k > 0.5 ? '#ffe589' : '#ffbfd3', k)) },
  { id: 'denim', name: 'Denim', cat: 'Denim', text: '#ffd9e5', cell: '#2b4467',
    bg: (ctx, W, H, s) => { ctx.fillStyle = '#3b5a85'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = 'rgba(20,35,60,.35)'; ctx.lineWidth = 2 * s; for (let i = -H; i < W; i += 5 * s) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke(); } ctx.setLineDash([10 * s, 7 * s]); ctx.strokeStyle = '#e8b04a'; ctx.lineWidth = 3 * s; const m = 12 * s; ctx.strokeRect(m, m, W - m * 2, H - m * 2); ctx.setLineDash([]); },
    deco: (cut) => scatter(cut, 5, 5, (ctx, x, y, s, k) => heart(ctx, x, y, (13 + k * 7) * s, '#ffbfd3', k - 0.5)) },
  { id: 'lightdenim', name: 'Light denim', cat: 'Denim', text: C.ink, cell: '#9db7d8',
    bg: (ctx, W, H, s) => { ctx.fillStyle = '#b9cde6'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = 'rgba(60,90,130,.18)'; ctx.lineWidth = 2 * s; for (let i = -H; i < W; i += 5 * s) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke(); } ctx.setLineDash([10 * s, 7 * s]); ctx.strokeStyle = '#ff9fbe'; ctx.lineWidth = 3 * s; const m = 12 * s; ctx.strokeRect(m, m, W - m * 2, H - m * 2); ctx.setLineDash([]); },
    deco: (cut) => scatter(cut, 6, 9, (ctx, x, y, s, k) => star(ctx, x, y, (12 + k * 7) * s, '#fff3c4', k)) },
  { id: 'cocoa', name: 'Cocoa dots', cat: 'Cute', bg: dots('#6b4433', '#f3e1c8', 30), text: '#ffe9d6', cell: '#4f3125' },
  { id: 'clouds', name: 'Sky clouds', cat: 'Cute', text: '#4a6a8f', cell: '#e3f1ff',
    bg: (ctx, W, H) => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#bfe0ff'); g.addColorStop(1, '#f2f9ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); },
    deco: (cut) => scatter(cut, 5, 4, (ctx, x, y, s, k) => cloud(ctx, x - 14 * s, y, (9 + k * 6) * s)) },
];
export const frameById = (id) => FRAMES.find((f) => f.id === id) || FRAMES[0];

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ---------- Filters ----------
// css = live camera preview; m = colour matrix [r,g,b,offset] x3 used for the saved photo; grain/fade extras
const lum = [0.2126, 0.7152, 0.0722];
function sat(s) { const [r, g, b] = lum; return [[r * (1 - s) + s, g * (1 - s), b * (1 - s), 0], [r * (1 - s), g * (1 - s) + s, b * (1 - s), 0], [r * (1 - s), g * (1 - s), b * (1 - s) + s, 0]]; }
function sepia(a) { const S = [[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]]; return S.map((row, i) => row.map((v, j) => v * a + (i === j ? 1 - a : 0)).concat(0)); }
function mul(A, B) { // A after B
  return A.map((ra) => [0, 1, 2].map((j) => ra[0] * B[0][j] + ra[1] * B[1][j] + ra[2] * B[2][j]).concat(ra[0] * B[0][3] + ra[1] * B[1][3] + ra[2] * B[2][3] + ra[3]));
}
const lin = (k, o = 0) => [[k, 0, 0, o], [0, k, 0, o], [0, 0, k, o]];
const contrast = (c) => lin(c, 128 * (1 - c));
const tint = (r, g, b) => [[1, 0, 0, r], [0, 1, 0, g], [0, 0, 1, b]];
export const FILTERS = [
  { id: 'none', name: 'Original', css: 'none', m: null },
  { id: 'softpink', name: 'Soft pink', css: 'saturate(1.1) sepia(.12) hue-rotate(-12deg) brightness(1.05)', m: mul(tint(16, -2, 8), mul(lin(1.04), sat(1.08))) },
  { id: 'butter', name: 'Butter', css: 'sepia(.28) saturate(1.25) brightness(1.06)', m: mul(tint(10, 6, -10), mul(sat(1.2), sepia(0.25))) },
  { id: 'bw', name: 'B&W', css: 'grayscale(1) contrast(1.1)', m: mul(contrast(1.1), sat(0)) },
  { id: 'film', name: 'Film', css: 'sepia(.45) contrast(1.05) brightness(1.02)', m: mul(lin(0.92, 18), mul(contrast(1.05), sepia(0.45))) },
  { id: 'dreamy', name: 'Dreamy', css: 'brightness(1.1) saturate(.8) contrast(.92)', m: mul(lin(0.9, 34), mul(sat(0.8), lin(1.08))) },
  { id: 'grain', name: 'Grain', css: 'contrast(1.15) saturate(.9)', m: mul(contrast(1.15), sat(0.9)), grain: 22 },
  { id: 'cool', name: 'Cool', css: 'saturate(1.05) hue-rotate(8deg) brightness(1.04)', m: mul(tint(-8, 2, 16), sat(1.05)) },
];
export const filterById = (id) => FILTERS.find((f) => f.id === id) || FILTERS[0];

// ---------- Stickers ----------
const O = 'stroke="#fff" stroke-width="6" stroke-linejoin="round" paint-order="stroke"';
const svg = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;
const S = {
  heart: svg(`<path ${O} fill="#e8407c" d="M50 86C14 62 8 42 18 28c9-12 25-11 32 3 7-14 23-15 32-3 10 14 4 34-32 58z"/><path fill="#fff" opacity=".55" d="M28 34c4-5 10-5 13 0-5 0-9 2-12 6z"/>`),
  heartpink: svg(`<path ${O} fill="#ffbfd3" d="M50 86C14 62 8 42 18 28c9-12 25-11 32 3 7-14 23-15 32-3 10 14 4 34-32 58z"/>`),
  star: svg(`<path ${O} fill="#ffd23f" d="M50 8l11 27 29 2-22 19 7 29-25-16-25 16 7-29-22-19 29-2z"/>`),
  sparkle: svg(`<path ${O} fill="#fff3a8" d="M50 6c4 26 12 36 40 44-28 8-36 18-40 44-4-26-12-36-40-44 28-8 36-18 40-44z"/>`),
  flower: svg(`<g ${O}><g fill="#ff8fb3">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${50 + 22 * Math.cos((a - 90) * Math.PI / 180)}" cy="${50 + 22 * Math.sin((a - 90) * Math.PI / 180)}" r="17"/>`).join('')}</g></g><circle cx="50" cy="50" r="13" fill="#ffd23f"/>`),
  smiley: svg(`<circle ${O} cx="50" cy="50" r="38" fill="#ffd23f"/><circle cx="37" cy="42" r="5" fill="#3d2433"/><circle cx="63" cy="42" r="5" fill="#3d2433"/><path d="M33 58c8 12 26 12 34 0" fill="none" stroke="#3d2433" stroke-width="5" stroke-linecap="round"/>`),
  bow: svg(`<g ${O} fill="#ff6fa0"><path d="M50 50L14 28c-6 0-8 44 0 44z"/><path d="M50 50l36-22c6 0 8 44 0 44z"/><path d="M46 52l-14 34 10-2 8 8 2-38zM54 52l14 34-10-2-8 8-2-38z"/></g><circle cx="50" cy="50" r="9" fill="#e8407c"/>`),
  cherry: svg(`<path d="M34 64C40 40 50 22 70 12M66 66C64 44 66 26 70 12" fill="none" stroke="#5a8a3a" stroke-width="5" stroke-linecap="round"/><circle ${O} cx="32" cy="70" r="17" fill="#d6224f"/><circle ${O} cx="66" cy="72" r="17" fill="#d6224f"/><circle cx="26" cy="64" r="4" fill="#fff" opacity=".7"/><circle cx="60" cy="66" r="4" fill="#fff" opacity=".7"/>`),
  cloud: svg(`<path ${O} fill="#e9f4ff" d="M26 74c-12 0-18-10-14-20 3-8 11-11 18-9 2-14 14-22 27-19 10 2 16 10 17 19 10-2 19 5 19 15 0 8-7 14-15 14z"/>`),
  moon: svg(`<path ${O} fill="#ffe589" d="M64 12C42 16 28 36 32 58c4 22 26 36 48 30-30 0-44-46-16-76z"/>`),
  butterfly: svg(`<g ${O}><path fill="#b48cf2" d="M50 50C36 18 8 18 12 38c2 12 18 16 38 12z"/><path fill="#b48cf2" d="M50 50C64 18 92 18 88 38c-2 12-18 16-38 12z"/><path fill="#ff9fbe" d="M50 52C34 54 20 66 28 78c8 10 20-6 22-26zM50 52c16 2 30 14 22 26-8 10-20-6-22-26z"/></g><rect x="47" y="34" width="6" height="40" rx="3" fill="#3d2433"/>`),
  crown: svg(`<path ${O} fill="#ffd23f" d="M14 74l-4-46 22 18 18-30 18 30 22-18-4 46z"/><circle cx="50" cy="60" r="6" fill="#e8407c"/><circle cx="28" cy="62" r="4" fill="#7fa8e8"/><circle cx="72" cy="62" r="4" fill="#7fa8e8"/>`),
  peace: svg(`<circle ${O} cx="50" cy="50" r="38" fill="#ff9fbe"/><circle cx="50" cy="50" r="28" fill="none" stroke="#fff" stroke-width="7"/><path d="M50 22v56M50 52L30 70M50 52l20 18" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`),
  chrome: svg(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#c9c3d9"/><stop offset=".55" stop-color="#8f88a8"/><stop offset="1" stop-color="#f1eefa"/></linearGradient></defs><path ${O} fill="url(#g)" d="M50 4l9 37 37 9-37 9-9 37-9-37-37-9 37-9z"/>`),
  flame: svg(`<path ${O} fill="#ff7a59" d="M50 92c-20 0-32-14-30-30 2-18 18-24 18-44 14 10 16 22 14 30 6-4 8-10 8-16 12 10 22 22 20 34-2 16-12 26-30 26z"/><path fill="#ffd23f" d="M50 86c-10 0-16-7-15-15 1-9 9-12 10-22 7 6 8 12 7 16 4-2 5-6 5-9 6 6 10 11 9 16-1 8-7 14-16 14z"/>`),
  shades: svg(`<path d="M8 40h84" stroke="#3d2433" stroke-width="6" stroke-linecap="round"/><path ${O} fill="#e8407c" d="M12 40h32c0 16-6 24-16 24S12 56 12 40zM56 40h32c0 16-6 24-16 24S56 56 56 40z"/>`),
  disco: svg(`<circle ${O} cx="50" cy="54" r="34" fill="#cfd3e6"/><g stroke="#8f95b2" stroke-width="2"><path d="M16 54h68M20 38h60M20 70h60M50 20v68M34 23c-6 20-6 42 0 62M66 23c6 20 6 42 0 62"/></g><path d="M50 4v16" stroke="#3d2433" stroke-width="3"/><path fill="#fff" d="M36 36h8v8h-8z"/>`),
  strawberry: svg(`<path ${O} fill="#e8304f" d="M50 92C26 76 16 56 22 40c6-12 22-14 28-8 6-6 22-4 28 8 6 16-4 36-28 52z"/><path fill="#5a9a3a" d="M30 32c8-2 14 0 20 4 6-4 12-6 20-4-4-8-12-10-20-6-8-4-16-2-20 6z"/>${[[38, 50], [56, 48], [46, 62], [62, 62], [36, 66], [52, 76]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="3" fill="#ffe589"/>`).join('')}`),
  icecream: svg(`<path ${O} fill="#e8b46b" d="M32 50h36L50 94z"/><circle ${O} cx="50" cy="40" r="22" fill="#ffbfd3"/><circle cx="62" cy="24" r="6" fill="#d6224f"/><g fill="#7fa8e8"><rect x="40" y="32" width="5" height="2" rx="1"/><rect x="54" y="40" width="5" height="2" rx="1"/></g>`),
  donut: svg(`<circle ${O} cx="50" cy="50" r="38" fill="#e8b46b"/><path fill="#ff9fbe" d="M50 16c20 0 34 14 34 32 0 6-4 4-8 6-6 3-6 10-12 10-5 0-6-6-14-6s-10 8-16 6c-6-2-4-8-10-10-6-2-10 0-10-6 0-18 16-32 36-32z"/><circle cx="50" cy="50" r="11" fill="#fff"/><g fill="#fff"><rect x="34" y="28" width="7" height="3" rx="1.5"/><rect x="62" y="34" width="7" height="3" rx="1.5"/><rect x="40" y="60" width="7" height="3" rx="1.5"/></g>`),
  boba: svg(`<path ${O} fill="#f3d9b8" d="M24 30h52l-6 62H30z"/><path d="M56 6l-8 40" stroke="#e8407c" stroke-width="7" stroke-linecap="round"/><rect x="20" y="24" width="60" height="9" rx="4" fill="#ffbfd3"/>${[[38, 82], [50, 84], [62, 82], [44, 74], [57, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#3d2433"/>`).join('')}`),
  cake: svg(`<path ${O} fill="#fff3c4" d="M14 56l72-20v40l-72 14z"/><path fill="#ffbfd3" d="M14 56l72-20v10l-72 20z"/><circle cx="62" cy="34" r="8" fill="#d6224f"/>`),
};
const D = (d, color = '#3d2433', w = 6) => svg(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`);
Object.assign(S, {
  arrow: D('M12 70c20-30 46-40 74-34M70 22l16 14-18 12', '#c93a6e'),
  squiggle: D('M8 56c10-16 18-16 24 0s14 16 22 0 14-16 22 0 10 12 16 4', '#e3b400'),
  swirl: D('M50 50c0-6 8-6 8 0 0 10-16 10-16 0 0-14 24-14 24 0 0 18-32 18-32 0 0-22 40-22 40 0', '#ff8fb3', 5),
  scribble: D('M20 40c20-20 60-20 64 6 4 26-50 40-64 18-10-16 14-34 40-32', '#c93a6e', 5),
  doodlecrown: D('M18 72l-4-40 20 18 16-28 16 28 20-18-4 40z', '#3d2433', 5),
  doodlestar: D('M50 10l10 28 30 2-24 18 8 30-24-16-24 16 8-30-24-18 30-2z', '#e3b400', 5),
  doodleheart: D('M50 84C16 62 10 42 20 30c9-11 24-10 30 4 6-14 21-15 30-4 10 12 4 32-30 54z', '#e8407c', 5),
  sparks: D('M30 20v18M21 29h18M70 54v22M59 65h22M38 70v10M33 75h10', '#e3b400', 5),
});
export const STICKERS = S;
export const fontById = (id) => FONTS.find((f) => f.id === id) || FONTS[0];

// ================= more stickers =================
const F = (inner) => svg(inner);
Object.assign(S, {
  rainbow: F(`<g fill="none" stroke-linecap="round" ${''}><path d="M14 74a36 36 0 0 1 72 0" stroke="#fff" stroke-width="30"/><path d="M14 74a36 36 0 0 1 72 0" stroke="#ff7a9a" stroke-width="7"/><path d="M21 74a29 29 0 0 1 58 0" stroke="#ffd23f" stroke-width="7"/><path d="M28 74a22 22 0 0 1 44 0" stroke="#7fd1a8" stroke-width="7"/><path d="M35 74a15 15 0 0 1 30 0" stroke="#7fa8e8" stroke-width="7"/></g><circle ${O} cx="16" cy="76" r="10" fill="#fff"/><circle ${O} cx="84" cy="76" r="10" fill="#fff"/>`),
  sun: F(`<g stroke="#ffb627" stroke-width="7" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M${50 + 30 * Math.cos(a * Math.PI / 180)} ${50 + 30 * Math.sin(a * Math.PI / 180)}L${50 + 42 * Math.cos(a * Math.PI / 180)} ${50 + 42 * Math.sin(a * Math.PI / 180)}"/>`).join('')}</g><circle ${O} cx="50" cy="50" r="22" fill="#ffd23f"/><circle cx="43" cy="47" r="3" fill="#3d2433"/><circle cx="57" cy="47" r="3" fill="#3d2433"/><path d="M43 56c4 4 10 4 14 0" fill="none" stroke="#3d2433" stroke-width="3" stroke-linecap="round"/>`),
  cat: F(`<path ${O} fill="#ffd9a8" d="M18 34l6-24 18 14h16l18-14 6 24c6 8 8 16 8 24 0 20-18 32-38 32S12 78 12 58c0-8 2-16 6-24z"/><circle cx="36" cy="54" r="5" fill="#3d2433"/><circle cx="64" cy="54" r="5" fill="#3d2433"/><path d="M46 64l4 3 4-3" fill="none" stroke="#3d2433" stroke-width="3" stroke-linecap="round"/><g stroke="#3d2433" stroke-width="2" stroke-linecap="round"><path d="M22 62h-12M22 68l-11 4M78 62h12M78 68l11 4"/></g><ellipse cx="28" cy="64" rx="5" ry="3" fill="#ff9fbe"/><ellipse cx="72" cy="64" rx="5" ry="3" fill="#ff9fbe"/>`),
  bear: F(`<circle ${O} cx="24" cy="26" r="13" fill="#b07a55"/><circle ${O} cx="76" cy="26" r="13" fill="#b07a55"/><circle ${O} cx="50" cy="56" r="36" fill="#b07a55"/><ellipse cx="50" cy="66" rx="16" ry="12" fill="#f1d3b3"/><circle cx="37" cy="50" r="4.5" fill="#3d2433"/><circle cx="63" cy="50" r="4.5" fill="#3d2433"/><ellipse cx="50" cy="61" rx="5" ry="4" fill="#3d2433"/><ellipse cx="28" cy="62" rx="5" ry="3" fill="#ff9fbe"/><ellipse cx="72" cy="62" rx="5" ry="3" fill="#ff9fbe"/>`),
  bunny: F(`<path ${O} fill="#fff" d="M32 46C24 30 24 6 34 6s12 22 8 40zM68 46c8-16 8-40-2-40S54 28 58 46z"/><path fill="#ffbfd3" d="M33 40c-4-10-4-26 1-27s6 15 5 27zM67 40c4-10 4-26-1-27s-6 15-5 27z"/><ellipse ${O} cx="50" cy="64" rx="32" ry="28" fill="#fff"/><circle cx="39" cy="60" r="4" fill="#3d2433"/><circle cx="61" cy="60" r="4" fill="#3d2433"/><path d="M46 69l4 3 4-3" fill="none" stroke="#3d2433" stroke-width="3" stroke-linecap="round"/><ellipse cx="31" cy="70" rx="5" ry="3" fill="#ff9fbe"/><ellipse cx="69" cy="70" rx="5" ry="3" fill="#ff9fbe"/>`),
  ghost: F(`<path ${O} fill="#fff" d="M20 88V46a30 30 0 0 1 60 0v42l-10-8-10 8-10-8-10 8-10-8z"/><ellipse cx="40" cy="46" rx="4" ry="6" fill="#3d2433"/><ellipse cx="60" cy="46" rx="4" ry="6" fill="#3d2433"/><ellipse cx="32" cy="58" rx="5" ry="3" fill="#ff9fbe"/><ellipse cx="68" cy="58" rx="5" ry="3" fill="#ff9fbe"/>`),
  coffee: F(`<path ${O} fill="#fff" d="M22 34h50l-6 54H28z"/><path fill="#c98f6b" d="M24 44h46l-2 18H26z"/><path d="M72 42c12 0 12 22-2 22" fill="none" stroke="#fff" stroke-width="8"/><path d="M72 42c12 0 12 22-2 22" fill="none" stroke="#3d2433" stroke-width="3"/><path d="M38 24c0-6 6-6 6-12M52 24c0-6 6-6 6-12" fill="none" stroke="#c93a6e" stroke-width="4" stroke-linecap="round"/><path fill="#ff8fb3" d="M47 72c-6-4-8-8-5-10 2-2 5-1 5 1 0-2 3-3 5-1 3 2 1 6-5 10z"/>`),
  camera: F(`<rect ${O} x="10" y="28" width="80" height="56" rx="12" fill="#ff9fbe"/><rect x="34" y="18" width="32" height="14" rx="5" fill="#ff9fbe"/><circle cx="50" cy="56" r="20" fill="#3d2433"/><circle cx="50" cy="56" r="12" fill="#7fa8e8"/><circle cx="45" cy="51" r="4" fill="#fff"/><circle cx="78" cy="40" r="5" fill="#ffe589"/>`),
  music: F(`<path ${O} fill="#c93a6e" d="M36 22l46-10v52a12 10 0 1 1-8-9V30l-30 7v35a12 10 0 1 1-8-9z"/>`),
  lips: F(`<path ${O} fill="#e8304f" d="M8 50c10-14 20-22 30-20 6 1 9 5 12 5s6-4 12-5c10-2 20 6 30 20-12 18-26 26-42 26S20 68 8 50z"/><path d="M14 50c12 4 24 6 36 6s24-2 36-6" fill="none" stroke="#a51d3a" stroke-width="3"/><path fill="#fff" opacity=".5" d="M30 62c6 3 12 4 18 4-6 2-14 1-18-4z"/>`),
  diamond: F(`<path ${O} fill="#bfe6ff" d="M24 18h52l18 22-44 50L6 40z"/><path d="M6 40h88M24 18l12 22 14 50 14-50 12-22M36 40l14-22 14 22" fill="none" stroke="#7fa8e8" stroke-width="2.5"/>`),
  cupcake: F(`<path ${O} fill="#ffbfd3" d="M24 56h52l-8 34H32z"/><path d="M34 58l2 30M50 58v30M66 58l-2 30" stroke="#f39bbb" stroke-width="3"/><path ${O} fill="#fff3c4" d="M18 58c-6-12 6-20 12-18 0-12 18-18 24-8 8-8 24-2 22 10 10 0 12 12 6 16z"/><circle cx="52" cy="22" r="7" fill="#d6224f"/><g fill="#7fa8e8"><rect x="34" y="44" width="6" height="3" rx="1.5"/><rect x="58" y="46" width="6" height="3" rx="1.5"/></g>`),
  balloon: F(`<path d="M50 70c-4 10 6 14 0 26" fill="none" stroke="#3d2433" stroke-width="2.5"/><ellipse ${O} cx="50" cy="38" rx="26" ry="32" fill="#ff7a9a"/><path fill="#e8407c" d="M45 68h10l-5 6z"/><ellipse cx="40" cy="26" rx="6" ry="9" fill="#fff" opacity=".5"/>`),
  gift: F(`<rect ${O} x="14" y="40" width="72" height="50" rx="6" fill="#ff9fbe"/><rect ${O} x="10" y="28" width="80" height="16" rx="5" fill="#ffbfd3"/><rect x="44" y="28" width="12" height="62" fill="#ffd23f"/><path ${O} fill="#ffd23f" d="M50 28c-14-18-30-10-22-2 4 4 22 2 22 2zM50 28c14-18 30-10 22-2-4 4-22 2-22 2z"/>`),
  mushroom: F(`<path ${O} fill="#fff3e6" d="M36 56h28l4 32H32z"/><path ${O} fill="#e8304f" d="M8 58c0-26 20-44 42-44s42 18 42 44z"/><circle cx="30" cy="38" r="7" fill="#fff"/><circle cx="56" cy="28" r="6" fill="#fff"/><circle cx="72" cy="46" r="6" fill="#fff"/>`),
  cactus: F(`<path ${O} fill="#7fc49a" d="M40 90V20a10 10 0 0 1 20 0v70zM40 60H28a8 8 0 0 1-8-8V38a6 6 0 0 1 12 0v10h8zM60 52h10V34a6 6 0 0 1 12 0v18a8 8 0 0 1-8 8H60z"/><circle cx="50" cy="14" r="6" fill="#ff8fb3"/>`),
  planet: F(`<circle ${O} cx="50" cy="50" r="28" fill="#c9b6f2"/><ellipse cx="50" cy="52" rx="46" ry="12" fill="none" stroke="#fff" stroke-width="10" transform="rotate(-18 50 52)"/><ellipse cx="50" cy="52" rx="46" ry="12" fill="none" stroke="#ffd23f" stroke-width="5" transform="rotate(-18 50 52)"/><circle cx="40" cy="40" r="5" fill="#b49de6"/>`),
  stareyes: F(`<circle ${O} cx="50" cy="50" r="38" fill="#ffd23f"/><path fill="#e8407c" d="M36 32l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1zM64 32l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"/><path d="M32 62c8 14 28 14 36 0z" fill="#3d2433"/>`),
  wink: F(`<circle ${O} cx="50" cy="50" r="38" fill="#ffd23f"/><circle cx="37" cy="44" r="5" fill="#3d2433"/><path d="M57 44c4-4 10-4 12 0" fill="none" stroke="#3d2433" stroke-width="4" stroke-linecap="round"/><path d="M34 60c8 10 24 10 32 0" fill="none" stroke="#3d2433" stroke-width="5" stroke-linecap="round"/><path fill="#e8407c" d="M60 66c4 8 12 6 10-2z"/>`),
  hearteyes: F(`<circle ${O} cx="50" cy="50" r="38" fill="#ffd23f"/><path fill="#e8407c" d="M37 52c-12-8-14-14-10-18 3-3 8-2 10 2 2-4 7-5 10-2 4 4 2 10-10 18zM63 52c-12-8-14-14-10-18 3-3 8-2 10 2 2-4 7-5 10-2 4 4 2 10-10 18z"/><path d="M34 62c8 12 24 12 32 0z" fill="#3d2433"/>`),
  laugh: F(`<circle ${O} cx="50" cy="50" r="38" fill="#ffd23f"/><path d="M30 42l10 4-10 4M70 42l-10 4 10 4" fill="none" stroke="#3d2433" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 56h44c0 16-10 24-22 24S28 72 28 56z" fill="#3d2433"/><path d="M38 72c6 4 18 4 24 0" fill="none" stroke="#e8407c" stroke-width="5"/><path fill="#7fc8f8" d="M20 50c-6 6-6 12 0 12s6-6 0-12zM80 50c-6 6-6 12 0 12s6-6 0-12z"/>`),
  sakura: F(`<g ${O}>${[0, 72, 144, 216, 288].map((a) => `<path fill="#ffc2d4" transform="rotate(${a} 50 50)" d="M50 50c-14-10-16-30-6-38l6 6 6-6c10 8 8 28-6 38z"/>`).join('')}</g><circle cx="50" cy="50" r="7" fill="#ff7aa2"/>`),
  tulip: F(`<path d="M50 56v38" stroke="#5a9a3a" stroke-width="6"/><path fill="#7fc49a" d="M50 80c-16 0-24-12-24-20 12 0 22 8 24 20zM50 84c14-2 22-14 22-22-12 2-20 10-22 22z"/><path ${O} fill="#ff7a9a" d="M28 22l11 10 11-18 11 18 11-10v20c0 14-10 22-22 22S28 56 28 42z"/>`),
  sunflower: F(`<g ${O}>${Array.from({ length: 12 }, (_, i) => `<ellipse cx="50" cy="20" rx="8" ry="16" fill="#ffd23f" transform="rotate(${i * 30} 50 50)"/>`).join('')}</g><circle cx="50" cy="50" r="16" fill="#8a5a3a"/>`),
  daisy: F(`<g ${O}>${Array.from({ length: 10 }, (_, i) => `<ellipse cx="50" cy="22" rx="8" ry="16" fill="#fff" transform="rotate(${i * 36} 50 50)"/>`).join('')}</g><circle cx="50" cy="50" r="12" fill="#ffd23f"/>`),
  clover: F(`<path d="M50 54c4 16 10 26 20 34" fill="none" stroke="#5a9a3a" stroke-width="5" stroke-linecap="round"/><g ${O} fill="#7fc49a">${[0, 90, 180, 270].map((a) => `<path transform="rotate(${a} 50 50)" d="M50 50c-6-8-22-10-22-22 0-8 10-12 16-6 2 2 4 4 6 8 2-4 4-6 6-8 6-6 16-2 16 6 0 12-16 14-22 22z"/>`).join('')}</g>`),
  leaf: F(`<path ${O} fill="#9fd4a8" d="M14 86C10 46 34 14 88 12c2 52-30 78-74 74z"/><path d="M14 86C34 62 52 44 76 26" fill="none" stroke="#5a9a3a" stroke-width="3"/>`),
  ketupat: F(`<path d="M50 6v12M50 82v12" stroke="#5a9a3a" stroke-width="4"/><path ${O} fill="#a9d36b" d="M50 16l34 34-34 34-34-34z"/><path d="M33 33l34 34M67 33L33 67M41 25l34 34M59 25L25 59M25 41l34 34M75 41L41 75" stroke="#e3b400" stroke-width="3"/>`),
  crescent: F(`<path ${O} fill="#ffd23f" d="M62 10C38 12 22 32 24 54s24 38 46 36C44 84 34 60 40 40s14-28 22-30z"/><path fill="#ffd23f" d="M74 30l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>`),
  pelita: F(`<path d="M50 14c-8 12-6 20 0 22 6-2 8-10 0-22z" fill="#ffb627"/><path ${O} fill="#e3b400" d="M20 52h60c0 16-14 26-30 26S20 68 20 52z"/><rect x="44" y="34" width="12" height="18" rx="3" fill="#fff3c4"/><path d="M30 86h40" stroke="#c98f00" stroke-width="5" stroke-linecap="round"/>`),
  partyhat: F(`<path ${O} fill="#7fa8e8" d="M50 8l30 80H20z"/><path d="M36 50l28 0M30 66l40 0M43 30l14 0" stroke="#ffd23f" stroke-width="6"/><circle ${O} cx="50" cy="10" r="8" fill="#ff7a9a"/>`),
  confetti: F(`${[['#ff7a9a', 18, 22, 20], ['#ffd23f', 70, 14, -30], ['#7fa8e8', 46, 46, 60], ['#7fc49a', 16, 70, -10], ['#c9b6f2', 78, 64, 40], ['#ff9fbe', 50, 84, 10]].map(([c, x, y, r]) => `<rect x="${x - 7}" y="${y - 3}" width="14" height="6" rx="2" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`).join('')}<circle cx="34" cy="38" r="4" fill="#ffd23f"/><circle cx="66" cy="38" r="4" fill="#ff7a9a"/><circle cx="30" cy="88" r="3" fill="#7fa8e8"/><circle cx="86" cy="86" r="4" fill="#7fc49a"/>`),
  pizza: F(`<path ${O} fill="#ffd23f" d="M14 22l76 0-38 70z"/><path fill="#e8b46b" d="M12 16h80l-4 10H16z"/><circle cx="40" cy="36" r="6" fill="#e8304f"/><circle cx="62" cy="40" r="6" fill="#e8304f"/><circle cx="52" cy="60" r="5" fill="#e8304f"/>`),
  boba2: F(`<path ${O} fill="#ffd9e5" d="M24 30h52l-6 62H30z"/><path d="M56 6l-8 40" stroke="#7fa8e8" stroke-width="7" stroke-linecap="round"/><rect x="20" y="24" width="60" height="9" rx="4" fill="#fff3c4"/>${[[38, 82], [50, 84], [62, 82], [44, 74], [57, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#3d2433"/>`).join('')}<circle cx="42" cy="52" r="3" fill="#3d2433"/><circle cx="58" cy="52" r="3" fill="#3d2433"/><path d="M46 58c2 2 6 2 8 0" fill="none" stroke="#3d2433" stroke-width="2.5" stroke-linecap="round"/>`),
  watermelon: F(`<path ${O} fill="#7fc49a" d="M8 34h84a42 42 0 0 1-84 0z"/><path fill="#ff7a9a" d="M16 34h68a34 34 0 0 1-68 0z"/>${[[34, 46], [50, 54], [66, 46], [42, 60], [58, 60]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.5" ry="4" fill="#3d2433"/>`).join('')}`),
  heartstack: F(`<path ${O} fill="#ff9fbe" d="M36 60C12 44 8 30 15 21c6-8 17-7 21 2 5-9 16-10 21-2 7 9 3 23-21 39z"/><path ${O} fill="#e8407c" d="M66 86C44 72 40 60 47 52c5-7 15-6 19 2 4-8 14-9 19-2 6 8 3 20-19 34z"/>`),
  bow2: F(`<g ${O} fill="#c9b6f2"><path d="M50 50L14 28c-6 0-8 44 0 44z"/><path d="M50 50l36-22c6 0 8 44 0 44z"/><path d="M46 52l-14 34 10-2 8 8 2-38zM54 52l14 34-10-2-8 8-2-38z"/></g><circle cx="50" cy="50" r="9" fill="#a88ae0"/>`),
  bowred: F(`<g ${O} fill="#e8304f"><path d="M50 50L14 28c-6 0-8 44 0 44z"/><path d="M50 50l36-22c6 0 8 44 0 44z"/><path d="M46 52l-14 34 10-2 8 8 2-38zM54 52l14 34-10-2-8 8-2-38z"/></g><circle cx="50" cy="50" r="9" fill="#a51d3a"/>`),
  starpink: F(`<path ${O} fill="#ff9fbe" d="M50 8l11 27 29 2-22 19 7 29-25-16-25 16 7-29-22-19 29-2z"/>`),
  starblue: F(`<path ${O} fill="#9cc4ee" d="M50 8l11 27 29 2-22 19 7 29-25-16-25 16 7-29-22-19 29-2z"/>`),
  sparkle2: F(`<path ${O} fill="#ffbfd3" d="M50 6c4 26 12 36 40 44-28 8-36 18-40 44-4-26-12-36-40-44 28-8 36-18 40-44z"/><path fill="#fff3a8" d="M80 10c1 8 4 11 12 13-8 2-11 5-12 13-1-8-4-11-12-13 8-2 11-5 12-13z"/>`),
  cherry2: F(`<path d="M34 64C40 40 50 22 70 12M66 66C64 44 66 26 70 12" fill="none" stroke="#5a9a3a" stroke-width="5" stroke-linecap="round"/><path fill="#7fc49a" d="M70 12c8-6 18-4 22 2-8 4-16 4-22-2z"/><circle ${O} cx="32" cy="70" r="17" fill="#ff7a9a"/><circle ${O} cx="66" cy="72" r="17" fill="#ff7a9a"/><circle cx="26" cy="64" r="4" fill="#fff" opacity=".7"/><circle cx="60" cy="66" r="4" fill="#fff" opacity=".7"/>`),
  phone: F(`<rect ${O} x="28" y="8" width="44" height="84" rx="10" fill="#ffbfd3"/><rect x="33" y="16" width="34" height="56" rx="4" fill="#fff3c4"/><circle cx="50" cy="82" r="4" fill="#fff"/><path fill="#e8407c" d="M50 54c-10-7-12-12-9-15 2-2 6-2 9 2 3-4 7-4 9-2 3 3 1 8-9 15z"/>`),
  cd: F(`<defs><linearGradient id="h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd9f0"/><stop offset=".35" stop-color="#c9f0ff"/><stop offset=".65" stop-color="#e8ffd9"/><stop offset="1" stop-color="#ffe0c9"/></linearGradient></defs><circle ${O} cx="50" cy="50" r="40" fill="url(#h)"/><circle cx="50" cy="50" r="12" fill="#fff" stroke="#c9c3d9" stroke-width="3"/><path d="M30 28a30 30 0 0 1 20-8" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`),
  angel: F(`<ellipse cx="50" cy="20" rx="20" ry="7" fill="none" stroke="#ffd23f" stroke-width="5"/><g ${O} fill="#fff"><path d="M48 56C30 30 6 32 8 48c2 14 22 18 40 8z"/><path d="M52 56c18-26 42-24 40-8-2 14-22 18-40 8z"/></g><path d="M20 46c8 0 14 2 20 6M80 46c-8 0-14 2-20 6" stroke="#c9c3d9" stroke-width="2.5" fill="none"/>`),
  devil: F(`<path ${O} fill="#e8304f" d="M18 40l-4-30 22 18zM82 40l4-30-22 18z"/><path d="M50 70c10 0 20-8 26-20" fill="none" stroke="#e8304f" stroke-width="5" stroke-linecap="round"/><path ${O} fill="#e8304f" d="M76 50l12-4-4 12z"/>`),
});
// washi tape pieces
const tape = (fill, extra = '') => svg(`<g transform="rotate(-12 50 50)"><path fill="${fill}" opacity=".88" d="M4 38l4 3-3 4 3 4-3 4 3 4-4 3h92l-4-3 3-4-3-4 3-4-3-4 4-3z"/>${extra}</g>`);
Object.assign(S, {
  tapepink: tape('#ffbfd3'), tapeyellow: tape('#ffe589'), tapemint: tape('#b8e6c9'), tapelilac: tape('#d8c9f5'),
  tapedots: tape('#ffd9e5', [12, 28, 44, 60, 76].map((x) => `<circle cx="${x + 4}" cy="45" r="3" fill="#fff"/><circle cx="${x + 12}" cy="55" r="3" fill="#fff"/>`).join('')),
  tapestripe: tape('#fff3c4', [10, 22, 34, 46, 58, 70, 82].map((x) => `<path d="M${x} 38l-6 24" stroke="#ff9fbe" stroke-width="4"/>`).join('')),
  tapegrid: tape('#cfe8ff', '<path d="M4 50h92M20 38v24M36 38v24M52 38v24M68 38v24M84 38v24" stroke="#fff" stroke-width="2"/>'),
  tapehearts: tape('#fff', [16, 36, 56, 76].map((x) => `<path fill="#ff7a9a" d="M${x} 54c-6-4-7-7-5-9 1-1 3-1 5 1 2-2 4-2 5-1 2 2 1 5-5 9z"/>`).join('')),
});
export const STK_IMG = {};
export function stk(k) {
  if (!STK_IMG[k] && S[k]) { const i = new Image(); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(S[k]); STK_IMG[k] = i; }
  return STK_IMG[k];
}
export function readyAllStickers() {
  return Promise.all(Object.keys(S).map((k) => { const i = stk(k); return i.complete && i.naturalWidth ? 0 : new Promise((r) => { i.onload = r; i.onerror = r; }); }));
}
export const STICKER_CATS = [
  { id: 'mine', name: '★ Mine', mine: true },
  { id: 'cute', name: 'Cute', items: ['heart', 'heartpink', 'heartstack', 'star', 'starpink', 'starblue', 'sparkle', 'sparkle2', 'flower', 'bow', 'bow2', 'bowred', 'cherry', 'cherry2', 'cloud', 'moon', 'butterfly', 'crown', 'rainbow', 'sun'] },
  { id: 'faces', name: 'Faces', items: ['smiley', 'wink', 'hearteyes', 'stareyes', 'laugh', 'cat', 'bear', 'bunny', 'ghost', 'angel', 'devil'] },
  { id: 'y2k', name: 'Y2K', items: ['chrome', 'cd', 'phone', 'peace', 'flame', 'shades', 'disco', 'lips', 'diamond', 'planet', 'camera', 'music'] },
  { id: 'nature', name: 'Nature', items: ['sakura', 'tulip', 'sunflower', 'daisy', 'clover', 'leaf', 'mushroom', 'cactus', 'rainbow', 'cloud', 'sun', 'moon'] },
  { id: 'food', name: 'Food', items: ['strawberry', 'cherry', 'icecream', 'donut', 'boba', 'boba2', 'cake', 'cupcake', 'coffee', 'pizza', 'watermelon'] },
  { id: 'party', name: 'Party', items: ['balloon', 'gift', 'partyhat', 'confetti', 'cake', 'cupcake', 'ketupat', 'crescent', 'pelita', 'sparkle', 'disco'] },
  { id: 'tape', name: 'Tape', items: ['tapepink', 'tapeyellow', 'tapemint', 'tapelilac', 'tapedots', 'tapestripe', 'tapegrid', 'tapehearts'] },
  { id: 'words', name: 'Words', words: ['besties!', 'xoxo', 'bff', 'love u', 'cutie', 'yay!', 'omg', 'smile :)', 'us <3', 'core memory', 'say cheese', 'lingcam', 'sayang', 'geng!', 'comel', 'best gila', 'kawan baik', 'jom!', 'hehe', 'lol', 'selamat hari raya', 'happy birthday', 'girls night', 'squad'] },
  { id: 'doodles', name: 'Doodles', items: ['arrow', 'squiggle', 'swirl', 'scribble', 'doodlecrown', 'doodlestar', 'doodleheart', 'sparks'] },
  { id: 'emoji', name: 'Emoji', emoji: ['😍', '🥰', '😎', '🤪', '😜', '🥹', '😘', '🤭', '😇', '🥳', '😋', '🫣', '💖', '💕', '💗', '✨', '🎀', '🌸', '🌷', '🍓', '🍒', '🧁', '🧸', '💋', '👑', '🦋', '🌈', '⭐', '🫶', '🎉', '📸', '💐', '🐰', '🐻', '🐱', '🍰'] },
];

// ================= fonts and colours =================
export const FONTS = [
  { id: 'script', name: 'Script', css: 'Caveat', weight: 700 },
  { id: 'round', name: 'Round', css: 'Fredoka', weight: 700 },
  { id: 'classic', name: 'Classic', css: 'Playfair Display', weight: 700, style: 'italic' },
  { id: 'type', name: 'Type', css: 'Special Elite', weight: 400 },
  { id: 'pacifico', name: 'Retro', css: 'Pacifico', weight: 400 },
  { id: 'lobster', name: 'Lobster', css: 'Lobster', weight: 400 },
  { id: 'dancing', name: 'Fancy', css: 'Dancing Script', weight: 700 },
  { id: 'marker', name: 'Marker', css: 'Permanent Marker', weight: 400 },
  { id: 'gochi', name: 'Hand', css: 'Gochi Hand', weight: 400 },
  { id: 'chewy', name: 'Chewy', css: 'Chewy', weight: 400 },
  { id: 'bubble', name: 'Bubble', css: 'Rubik Bubbles', weight: 400 },
  { id: 'bebas', name: 'Tall', css: 'Bebas Neue', weight: 400 },
  { id: 'righteous', name: 'Groovy', css: 'Righteous', weight: 400 },
  { id: 'pixel', name: 'Pixel', css: 'Silkscreen', weight: 700 },
];
export const INKS = ['#c93a6e', '#e8304f', '#ff7a9a', '#ffbfd3', '#3d2433', '#000000', '#ffffff', '#fff3c4', '#ffd23f', '#ffb627', '#7fc49a', '#5a9a3a', '#9cc4ee', '#3b6fd1', '#c9b6f2', '#8a5ad6', '#b07a55'];
export const SWATCHES = ['#fffdf7', '#ffbfd3', '#ffe589', '#ff9fbe', '#ffd9e5', '#fff3c4', '#e6dcff', '#cdeedd', '#ffd9c2', '#cfe8ff', '#7a1f3a', '#3b5a85', '#211820', '#e8304f', '#5a9a3a', '#000000'];
export const FRAME_CATS = ['All', 'Cute', 'Pastel', 'Pattern', 'Film', 'Y2K', 'Denim', 'Party', 'Plain'];

// ================= more frames =================
const grad = (stops, angle = 90) => (ctx, W, H) => { const a = angle * Math.PI / 180, x = Math.cos(a), y = Math.sin(a); const g = ctx.createLinearGradient(W / 2 - x * W / 2, H / 2 - y * H / 2, W / 2 + x * W / 2, H / 2 + y * H / 2); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
const stripes = (a, b, w, diag = false) => (ctx, W, H, s) => { ctx.fillStyle = a; ctx.fillRect(0, 0, W, H); ctx.fillStyle = b; const st = w * s; if (diag) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); for (let x = -H; x < W + H; x += st * 2) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + st, 0); ctx.lineTo(x + st + H, H); ctx.lineTo(x + H, H); ctx.fill(); } ctx.restore(); } else for (let x = 0; x < W; x += st * 2) ctx.fillRect(x, 0, st, H); };
const checker = (a, b, w) => (ctx, W, H, s) => { const st = w * s; ctx.fillStyle = a; ctx.fillRect(0, 0, W, H); ctx.fillStyle = b; for (let y = 0, r = 0; y < H; y += st, r++) for (let x = (r % 2) * st; x < W; x += st * 2) ctx.fillRect(x, y, st, st); };
const pattern = (base, fn, step) => (ctx, W, H, s) => { ctx.fillStyle = base; ctx.fillRect(0, 0, W, H); const st = step * s; for (let y = st / 2, r = 0; y < H + st; y += st, r++) for (let x = (r % 2) * st / 2 + st / 4; x < W + st; x += st) fn(ctx, x, y, s, r); };
const lines = (base, line, step, margin) => (ctx, W, H, s) => { ctx.fillStyle = base; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = line; ctx.lineWidth = 2 * s; for (let y = step * s; y < H; y += step * s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } if (margin) { ctx.strokeStyle = margin; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(18 * s, 0); ctx.lineTo(18 * s, H); ctx.stroke(); } };
const gridp = (base, line, step) => (ctx, W, H, s) => { ctx.fillStyle = base; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = line; ctx.lineWidth = 1.5 * s; for (let x = 0; x < W; x += step * s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += step * s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } };
const plaid = (base, a, b) => (ctx, W, H, s) => { ctx.fillStyle = base; ctx.fillRect(0, 0, W, H); ctx.fillStyle = a; for (let x = 0; x < W; x += 60 * s) ctx.fillRect(x, 0, 20 * s, H); for (let y = 0; y < H; y += 60 * s) ctx.fillRect(0, y, W, 20 * s); ctx.fillStyle = b; for (let x = 30 * s; x < W; x += 60 * s) ctx.fillRect(x, 0, 4 * s, H); for (let y = 30 * s; y < H; y += 60 * s) ctx.fillRect(0, y, W, 4 * s); };
const leopard = (base, spot, inner) => (ctx, W, H, s) => { ctx.fillStyle = base; ctx.fillRect(0, 0, W, H); let r = 17; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280); for (let i = 0; i < W * H / (900 * s * s); i++) { const x = rnd() * W, y = rnd() * H, k = (6 + rnd() * 7) * s; ctx.fillStyle = inner; ctx.beginPath(); ctx.ellipse(x, y, k, k * 0.8, rnd() * 3, 0, 7); ctx.fill(); ctx.strokeStyle = spot; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.ellipse(x, y, k, k * 0.8, rnd() * 3, 0.3, 4.6); ctx.stroke(); } };
const sprinkles = (base, cols) => (ctx, W, H, s) => { ctx.fillStyle = base; ctx.fillRect(0, 0, W, H); let r = 5; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280); for (let i = 0; i < W * H / (500 * s * s); i++) { ctx.save(); ctx.translate(rnd() * W, rnd() * H); ctx.rotate(rnd() * 6); ctx.fillStyle = cols[i % cols.length]; roundRect(ctx, -6 * s, -2 * s, 12 * s, 4 * s, 2 * s); ctx.fill(); ctx.restore(); } };
const stkDeco = (keys, n, size, seed = 3) => (cut) => scatter(cut, n, seed, (ctx, x, y, s, k) => { const im = stk(keys[Math.floor(k * 997) % keys.length]); if (im && im.complete && im.naturalWidth) { const z = (size + k * size * 0.5) * s; ctx.save(); ctx.translate(x, y); ctx.rotate((k - 0.5) * 0.8); ctx.drawImage(im, -z / 2, -z / 2, z, z); ctx.restore(); } });
const tapeDeco = (keys) => (cut) => (ctx, s) => { const cells = [cut.cells[0], cut.cells[cut.cells.length - 1]]; cells.forEach((c, i) => { const im = stk(keys[i % keys.length]); if (!im || !im.complete) return; const z = 120 * s; ctx.save(); ctx.translate(i ? c.x + c.w - z * 0.25 : c.x + z * 0.25, i ? c.y + c.h - 8 * s : c.y + 8 * s); ctx.rotate(i ? -0.6 : -0.6); ctx.drawImage(im, -z / 2, -z / 2, z, z); ctx.restore(); }); };
const holes = (color) => (cut) => (ctx, s) => { ctx.fillStyle = color; const hw = 10 * s, hh = 14 * s, side = cut.pad / 2; for (let y = 18 * s; y < cut.H - cut.foot * 0.6; y += 32 * s) [side, cut.W - side].forEach((x) => { roundRect(ctx, x - hw / 2, y, hw, hh, 3 * s); ctx.fill(); }); };
const both = (...fns) => (cut) => { const d = fns.map((f) => f(cut)); return (ctx, s) => d.forEach((f) => f(ctx, s)); };
const smallHeart = (c) => (ctx, x, y, s) => heart(ctx, x, y, 7 * s, c);
const smallStar = (c) => (ctx, x, y, s) => star(ctx, x, y, 8 * s, c);
const diamondK = (ctx, x, y, s, r) => { ctx.fillStyle = r % 2 ? '#e3b400' : 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(x, y - 9 * s); ctx.lineTo(x + 9 * s, y); ctx.lineTo(x, y + 9 * s); ctx.lineTo(x - 9 * s, y); ctx.fill(); };

FRAMES.push(
  // pastel
  { id: 'lavender', name: 'Lavender', cat: 'Pastel', bg: solid('#e6dcff'), text: '#5b3f8f', cell: '#d4c6f7', deco: stkDeco(['starpink', 'sparkle', 'heartpink'], 8, 30, 21) },
  { id: 'mint', name: 'Mint milk', cat: 'Pastel', bg: solid('#cdeedd'), text: '#2f6b4f', cell: '#b5e2cb', deco: stkDeco(['daisy', 'clover', 'heartpink'], 8, 30, 8) },
  { id: 'peach', name: 'Peachy', cat: 'Pastel', bg: solid('#ffd9c2'), text: '#8a4a33', cell: '#ffc6a5', deco: stkDeco(['tulip', 'flower', 'sun'], 7, 32, 12) },
  { id: 'sky', name: 'Baby blue', cat: 'Pastel', bg: solid('#cfe8ff'), text: '#3b5a85', cell: '#b5d8fb', deco: stkDeco(['cloud', 'starblue', 'rainbow'], 7, 32, 2) },
  { id: 'sunset', name: 'Sunset', cat: 'Pastel', bg: grad(['#ffe589', '#ffbfd3', '#c9b6f2']), text: C.ink, cell: '#ffd0de' },
  { id: 'cotton', name: 'Cotton candy', cat: 'Pastel', bg: grad(['#ffbfd3', '#cfe8ff'], 45), text: C.ink, cell: '#fff', deco: stkDeco(['sparkle2', 'cloud'], 7, 30, 31) },
  { id: 'split', name: 'Pink + butter', cat: 'Pastel', text: C.ink, cell: '#fff', bg: (ctx, W, H) => { ctx.fillStyle = '#ffbfd3'; ctx.fillRect(0, 0, W, H / 2); ctx.fillStyle = '#ffe589'; ctx.fillRect(0, H / 2, W, H / 2); } },
  // pattern
  { id: 'pinkstripe', name: 'Pink stripes', cat: 'Pattern', bg: stripes('#fff', '#ffc6d6', 18), text: C.ink, cell: '#ffd9e5' },
  { id: 'candy', name: 'Candy stripes', cat: 'Pattern', bg: stripes('#fff', '#ff9fbe', 16, true), text: C.ink, cell: '#ffd9e5' },
  { id: 'butterstripe', name: 'Butter stripes', cat: 'Pattern', bg: stripes('#fffdf2', '#ffe589', 20), text: C.muted, cell: '#fff3c4' },
  { id: 'checkpink', name: 'Pink checks', cat: 'Pattern', bg: checker('#ffd9e5', '#ff9fbe', 24), text: C.ink, cell: '#fff' },
  { id: 'checkbutter', name: 'Butter checks', cat: 'Pattern', bg: checker('#fffdf2', '#ffe589', 24), text: C.ink, cell: '#fff3c4' },
  { id: 'checkbw', name: 'Racing checks', cat: 'Pattern', bg: checker('#ffffff', '#222222', 22), text: '#c93a6e', cell: '#eee' },
  { id: 'hearts', name: 'Lots of hearts', cat: 'Pattern', bg: pattern('#ffd9e5', smallHeart('#ff7a9a'), 34), text: C.ink, cell: '#fff' },
  { id: 'stars', name: 'Starry pink', cat: 'Pattern', bg: pattern('#ff9fbe', smallStar('#fff3c4'), 36), text: C.ink, cell: '#ffd9e5' },
  { id: 'butterdots', name: 'Butter dots', cat: 'Pattern', bg: dots('#ffe589', '#ff9fbe', 30), text: C.ink, cell: '#fff3c4' },
  { id: 'lilacdots', name: 'Lilac dots', cat: 'Pattern', bg: dots('#d8c9f5', '#ffffff', 26), text: '#5b3f8f', cell: '#ece4ff' },
  { id: 'plaid', name: 'Pink plaid', cat: 'Pattern', bg: plaid('#ffd9e5', 'rgba(255,127,165,.35)', 'rgba(255,255,255,.8)'), text: C.ink, cell: '#fff' },
  { id: 'picnic', name: 'Picnic', cat: 'Pattern', text: '#a51d3a', cell: '#fff', bg: (ctx, W, H, s) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); const st = 22 * s; ctx.fillStyle = 'rgba(232,48,79,.4)'; for (let x = 0; x < W; x += st * 2) ctx.fillRect(x, 0, st, H); for (let y = 0; y < H; y += st * 2) ctx.fillRect(0, y, W, st); }, deco: stkDeco(['strawberry', 'cherry'], 6, 34, 4) },
  { id: 'notebook', name: 'Notebook', cat: 'Pattern', bg: lines('#fffdf7', '#bcd7f2', 22, '#ff9fbe'), text: '#3b5a85', cell: '#eef4fb', deco: stkDeco(['doodleheart', 'doodlestar', 'squiggle'], 6, 34, 9) },
  { id: 'gridpaper', name: 'Grid paper', cat: 'Pattern', bg: gridp('#fffdf7', 'rgba(127,168,232,.35)', 20), text: C.ink, cell: '#eef4fb' },
  { id: 'leopard', name: 'Pink leopard', cat: 'Pattern', bg: leopard('#ffd9e5', '#3d2433', '#ff9fbe'), text: C.ink, cell: '#fff' },
  { id: 'sprinkles', name: 'Sprinkles', cat: 'Pattern', bg: sprinkles('#fff3e6', ['#ff7a9a', '#ffd23f', '#7fa8e8', '#7fc49a', '#c9b6f2']), text: C.ink, cell: '#ffd9e5' },
  { id: 'strawprint', name: 'Strawberry print', cat: 'Pattern', text: '#a51d3a', cell: '#ffd9e5', bg: (ctx, W, H, s) => { ctx.fillStyle = '#fff6f8'; ctx.fillRect(0, 0, W, H); const im = stk('strawberry'); if (!im || !im.complete) return; const st = 44 * s; for (let y = 0, r = 0; y < H + st; y += st, r++) for (let x = (r % 2) * st / 2; x < W + st; x += st) ctx.drawImage(im, x - 12 * s, y - 12 * s, 24 * s, 24 * s); } },
  // cute
  { id: 'sakura', name: 'Cherry blossom', cat: 'Cute', bg: solid('#ffe3ec'), text: '#a8406a', cell: '#ffc9da', deco: stkDeco(['sakura'], 10, 34, 13) },
  { id: 'bows', name: 'Bows', cat: 'Cute', bg: solid('#fff6f8'), text: C.hot, cell: '#ffd9e5', deco: stkDeco(['bow', 'bow2', 'bowred'], 8, 36, 17) },
  { id: 'butterflies', name: 'Butterflies', cat: 'Cute', bg: solid('#efe6ff'), text: '#5b3f8f', cell: '#dcd0fa', deco: stkDeco(['butterfly', 'sparkle'], 8, 36, 23) },
  { id: 'kitty', name: 'Kitty friends', cat: 'Cute', bg: dots('#fff3c4', '#ffd9a8', 34), text: C.muted, cell: '#fff', deco: stkDeco(['cat', 'bear', 'bunny'], 6, 38, 6) },
  { id: 'treats', name: 'Sweet treats', cat: 'Cute', bg: solid('#ffeef3'), text: C.hot, cell: '#ffd9e5', deco: stkDeco(['icecream', 'donut', 'cupcake', 'boba'], 8, 34, 15) },
  { id: 'rainbowsky', name: 'Rainbow sky', cat: 'Cute', bg: grad(['#cfe8ff', '#fff6fb']), text: '#3b5a85', cell: '#e3f1ff', deco: stkDeco(['rainbow', 'cloud', 'sun'], 7, 36, 19) },
  { id: 'washi', name: 'Washi tape', cat: 'Cute', bg: solid('#fffdf7'), text: C.muted, cell: '#f1e8e0', deco: tapeDeco(['tapepink', 'tapeyellow']) },
  { id: 'stickerbomb', name: 'Sticker bomb', cat: 'Cute', bg: solid('#fff3c4'), text: C.ink, cell: '#ffe589', deco: stkDeco(['heart', 'star', 'smiley', 'cherry', 'flower', 'peace', 'rainbow', 'sparkle'], 16, 36, 27) },
  // film
  { id: 'negative', name: 'Negative', cat: 'Film', bg: solid('#3a2416'), text: '#ffb36b', cell: '#1e130c', filter: 'film', deco: holes('rgba(255,200,150,.8)') },
  { id: 'goldfilm', name: 'Gold film', cat: 'Film', bg: solid('#ffcf3a'), text: '#3d2433', cell: '#e8b300', deco: holes('#2a1a24') },
  { id: 'blackfilm', name: 'Black film', cat: 'Film', bg: solid('#121212'), text: '#ffffff', cell: '#2a2a2a', filter: 'bw', deco: holes('rgba(255,255,255,.9)') },
  { id: 'kraft', name: 'Kraft paper', cat: 'Film', bg: dots('#d9b98c', 'rgba(255,255,255,.12)', 8), text: '#5a3a22', cell: '#c9a473' },
  // y2k
  { id: 'chromey2k', name: 'Chrome', cat: 'Y2K', bg: grad(['#f4f4f8', '#b9b6c9', '#8d89a3', '#e9e7f2', '#bdb8cf'], 70), text: '#3d2433', cell: '#d8d5e3', deco: stkDeco(['chrome', 'sparkle'], 7, 34, 7) },
  { id: 'holo', name: 'Holographic', cat: 'Y2K', bg: grad(['#ffd9f0', '#c9f0ff', '#e8ffd9', '#ffe0c9', '#e6d0ff'], 35), text: '#5b3f8f', cell: '#fff', deco: stkDeco(['cd', 'sparkle2', 'starblue'], 7, 34, 11) },
  { id: 'y2kgrid', name: 'Y2K grid', cat: 'Y2K', bg: gridp('#ff9fd0', 'rgba(140,60,200,.4)', 24), text: '#4a1a6b', cell: '#ffd0ea', deco: stkDeco(['chrome', 'butterfly', 'phone'], 6, 36, 29) },
  { id: 'cyber', name: 'Cyber night', cat: 'Y2K', bg: gridp('#14081c', 'rgba(255,79,170,.45)', 26), text: '#ff8fd0', cell: '#2a1238', deco: stkDeco(['starpink', 'sparkle'], 8, 28, 33) },
  { id: 'bubblegum', name: 'Bubblegum', cat: 'Y2K', bg: solid('#ff5fa2'), text: '#fff3c4', cell: '#ffa3c8', deco: stkDeco(['sparkle', 'heartpink', 'lips'], 8, 32, 35) },
  // denim
  { id: 'blackdenim', name: 'Black denim', cat: 'Denim', text: '#ffbfd3', cell: '#2b2b2b', bg: (ctx, W, H, s) => { ctx.fillStyle = '#353535'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2 * s; for (let i = -H; i < W; i += 5 * s) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke(); } ctx.setLineDash([10 * s, 7 * s]); ctx.strokeStyle = '#ff9fbe'; ctx.lineWidth = 3 * s; const m = 12 * s; ctx.strokeRect(m, m, W - m * 2, H - m * 2); ctx.setLineDash([]); }, deco: stkDeco(['starpink', 'heart'], 5, 30, 37) },
  // party / seasonal
  { id: 'raya', name: 'Hari Raya', cat: 'Party', bg: pattern('#1f6b46', diamondK, 34), text: '#ffe589', cell: '#2f8a5c', deco: stkDeco(['ketupat', 'crescent', 'pelita'], 7, 38, 41) },
  { id: 'birthday', name: 'Birthday', cat: 'Party', bg: sprinkles('#fff6fb', ['#ff7a9a', '#ffd23f', '#7fa8e8', '#7fc49a']), text: C.hot, cell: '#ffd9e5', deco: stkDeco(['balloon', 'gift', 'partyhat', 'cupcake'], 7, 38, 43) },
  { id: 'valentine', name: 'Valentine', cat: 'Party', bg: pattern('#e8304f', smallHeart('#ff7a9a'), 34), text: '#fff3c4', cell: '#ff9fbe', deco: stkDeco(['heart', 'lips', 'heartstack'], 6, 36, 45) },
  { id: 'confetti', name: 'Confetti', cat: 'Party', bg: solid('#ffffff'), text: C.ink, cell: '#f3eef6', deco: stkDeco(['confetti', 'sparkle'], 10, 40, 47) },
  // plain
  { id: 'lilacplain', name: 'Lilac', cat: 'Plain', bg: solid('#e6dcff'), text: '#5b3f8f', cell: '#d4c6f7' },
  { id: 'black', name: 'Black', cat: 'Plain', bg: solid('#1b1418'), text: '#ffd9e5', cell: '#33272f' },
  { id: 'cherryred', name: 'Cherry red', cat: 'Plain', bg: solid('#c8102e'), text: '#fff3c4', cell: '#a50d26' },
);
// tidy the first frames into the new groups
[['pinkdots', 'Pattern'], ['gingham', 'Pattern'], ['cocoa', 'Pattern'], ['clouds', 'Pastel'], ['midnight', 'Y2K']].forEach(([id, cat]) => { const f = FRAMES.find((x) => x.id === id); if (f) f.cat = cat; });
