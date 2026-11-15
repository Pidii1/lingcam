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

// layout of a project: the cut, plus room on top when the frame has a header
const geomCache = new Map();
export function geom(p) {
  const cut = cutById(p.cut), fr = frameById(p.frame);
  const head = p.frameColor ? 0 : Math.round((fr.head || 0) * (cut.W / 600) * (cut.cols > 1 ? 0.75 : 1));
  if (!head) return cut;
  const k = cut.id + '|' + head; if (geomCache.has(k)) return geomCache.get(k);
  const g = { ...cut, H: cut.H + head, head, cells: cut.cells.map((c) => ({ ...c, y: c.y + head })), id: cut.id + '+h' + head };
  geomCache.set(k, g); return g;
}

// ================= designed frames (real photo booth looks) =================
const txt = (ctx, t, x, y, font, color, align = 'center', base = 'middle') => { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillText(t, x, y); };
const fit = (ctx, t, font, maxW, size) => { let z = size; ctx.font = font.replace('$', z); while (ctx.measureText(t).width > maxW && z > 6) { z -= 1; ctx.font = font.replace('$', z); } return font.replace('$', z); };
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const dstr = (p) => { const d = new Date(p.created || Date.now()); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`; };
const border = (color, w) => (ctx, c, s) => { ctx.strokeStyle = color; ctx.lineWidth = w * s; ctx.strokeRect(c.x - w * s / 2, c.y - w * s / 2, c.w + w * s, c.h + w * s); };
function scallopEdge(ctx, x, y, w, h, r, color) { ctx.fillStyle = color; const n = Math.max(2, Math.round(w / (r * 1.6))), m = Math.max(2, Math.round(h / (r * 1.6))); for (let i = 0; i <= n; i++) { const px = x + (w * i) / n; ctx.beginPath(); ctx.arc(px, y, r, 0, 7); ctx.arc(px, y + h, r, 0, 7); ctx.fill(); } for (let j = 0; j <= m; j++) { const py = y + (h * j) / m; ctx.beginPath(); ctx.arc(x, py, r, 0, 7); ctx.arc(x + w, py, r, 0, 7); ctx.fill(); } ctx.fillRect(x, y, w, h); }
function burst(ctx, x, y, r, fill, label, s) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.15); ctx.beginPath(); for (let i = 0; i < 24; i++) { const rr = i % 2 ? r * 0.72 : r; const a = (i / 24) * Math.PI * 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 4 * s; ctx.strokeStyle = '#111'; ctx.stroke(); txt(ctx, label, 0, 2 * s, `400 ${Math.round(r * 0.55)}px "Bebas Neue", sans-serif`, '#111'); ctx.restore(); }
function bulbs(ctx, x, y, w, h, r, on, off) { let k = 0; const step = r * 3.2; const put = (px, py) => { ctx.fillStyle = k++ % 2 ? off : on; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill(); }; for (let px = x; px <= x + w; px += step) { put(px, y); put(px, y + h); } for (let py = y + step; py < y + h; py += step) { put(x, py); put(x + w, py); } }
function chalkLine(ctx, pts, s) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3 * s; ctx.lineCap = 'round'; for (let k = 0; k < 2; k++) { ctx.beginPath(); pts.forEach(([x, y], i) => { const j = (Math.sin(i * 7.3 + k) * 1.5) * s; i ? ctx.lineTo(x + j, y - j) : ctx.moveTo(x + j, y + j); }); ctx.stroke(); } }
function pin(ctx, x, y, s, col) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(x + 3 * s, y + 4 * s, 11 * s, 0, 7); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 11 * s, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(x - 4 * s, y - 4 * s, 3.5 * s, 0, 7); ctx.fill(); }
function tornPaper(ctx, c, s, seed) { let r = seed * 97 + 13; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280); const m = 10 * s, x0 = c.x - m, y0 = c.y - m, x1 = c.x + c.w + m, y1 = c.y + c.h + m; ctx.beginPath(); ctx.moveTo(x0, y0); for (let x = x0; x < x1; x += 8 * s) ctx.lineTo(x, y0 + rnd() * 5 * s); for (let y = y0; y < y1; y += 8 * s) ctx.lineTo(x1 - rnd() * 5 * s, y); for (let x = x1; x > x0; x -= 8 * s) ctx.lineTo(x, y1 - rnd() * 5 * s); for (let y = y1; y > y0; y -= 8 * s) ctx.lineTo(x0 + rnd() * 5 * s, y); ctx.closePath(); ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 8 * s; ctx.shadowOffsetY = 3 * s; ctx.fillStyle = '#fffdf7'; ctx.fill(); }
function tapeAt(ctx, x, y, w, rot, col, s) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = col; ctx.globalAlpha = 0.82; ctx.fillRect(-w / 2, -11 * s, w, 22 * s); ctx.globalAlpha = 1; ctx.restore(); }
const halftone = (base, dot, step) => (ctx, W, H, s) => { ctx.fillStyle = base; ctx.fillRect(0, 0, W, H); ctx.fillStyle = dot; const st = step * s; for (let y = 0, r = 0; y < H + st; y += st, r++) for (let x = (r % 2) * st / 2; x < W + st; x += st) { const k = 0.5 + 0.5 * Math.sin((x + y) / (90 * s)); ctx.beginPath(); ctx.arc(x, y, st * 0.18 * (0.6 + k), 0, 7); ctx.fill(); } };
const speckle = (base, dots, n = 1, seed = 9) => (ctx, W, H, s) => { ctx.fillStyle = base; ctx.fillRect(0, 0, W, H); let r = seed; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280); for (let i = 0; i < W * H / (120 * s * s) * n; i++) { ctx.fillStyle = dots[i % dots.length]; ctx.fillRect(rnd() * W, rnd() * H, 2 * s, 2 * s); } };

FRAMES.push(
  { id: 'marquee', name: 'Classic booth', cat: 'Booth', head: 128, text: '#7a1f3a', cell: '#e8d9c4',
    bg: (ctx, W, H, s) => { ctx.fillStyle = '#fff3df'; ctx.fillRect(0, 0, W, H); },
    over: (ctx, cut, s) => { const h = cut.head, m = 14 * s; ctx.fillStyle = '#b3122e'; roundRect(ctx, m, m, cut.W - m * 2, h - m * 1.6, 16 * s); ctx.fill(); bulbs(ctx, m + 14 * s, m + 12 * s, cut.W - m * 2 - 28 * s, h - m * 1.6 - 24 * s, 5 * s, '#ffe589', '#fff7d1'); txt(ctx, 'PHOTO BOOTH', cut.W / 2, m + (h - m * 1.6) / 2 + 2 * s, fit(ctx, 'PHOTO BOOTH', '400 $px "Bebas Neue", sans-serif', cut.W - 120 * s, Math.round(h * 0.48)), '#ffd23f'); },
    cellOver: border('#3d2433', 3) },
  { id: 'magazine', name: 'Magazine cover', cat: 'Booth', head: 150, text: '#111', cell: '#eee', filter: 'none',
    bg: solid('#ffffff'),
    over: (ctx, cut, s, p) => { const h = cut.head; txt(ctx, 'lingcam', cut.W / 2, h * 0.5, fit(ctx, 'lingcam', 'italic 700 $px "Playfair Display", serif', cut.W - 50 * s, Math.round(h * 0.78)), '#c93a6e'); ctx.fillStyle = '#111'; ctx.fillRect(28 * s, h * 0.9, cut.W - 56 * s, 2 * s); txt(ctx, `ISSUE Nº 01  ·  ${dstr(p)}  ·  THE BESTIE ISSUE`, cut.W / 2, h * 0.08 + 6 * s, `700 ${Math.round(11 * s + 2)}px "DM Sans", sans-serif`, '#111'); },
    cellOver: (ctx, c, s, i) => { const lines = [['BEST DAY', 'EVER'], ['10 WAYS TO', 'LOOK CUTE'], ['CORE', 'MEMORY'], ['EXCLUSIVE:', 'US <3'], ['SPRING', 'GLOW UP'], ['THE', 'SQUAD']][i % 6]; ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 6 * s; lines.forEach((l, k) => txt(ctx, l, c.x + 14 * s, c.y + c.h - (lines.length - k) * 24 * s - 4 * s, `400 ${Math.round(26 * s)}px "Bebas Neue", sans-serif`, k ? '#ffe589' : '#fff', 'left', 'top')); } },
  { id: 'newspaper', name: 'Newspaper', cat: 'Booth', head: 150, text: '#111', cell: '#ccc', filter: 'bw',
    bg: speckle('#efe9dc', ['rgba(0,0,0,.06)'], 1, 3),
    over: (ctx, cut, s, p) => { const h = cut.head; txt(ctx, 'The Daily Bestie', cut.W / 2, h * 0.45, fit(ctx, 'The Daily Bestie', 'italic 700 $px "Playfair Display", serif', cut.W - 50 * s, Math.round(h * 0.42)), '#111'); ctx.fillStyle = '#111'; ctx.fillRect(24 * s, h * 0.74, cut.W - 48 * s, 3 * s); ctx.fillRect(24 * s, h * 0.9, cut.W - 48 * s, 1.5 * s); txt(ctx, `VOL. 1  —  ${dstr(p)}  —  FREE  ·  BESTIES SPOTTED HAVING THE BEST DAY`, cut.W / 2, h * 0.82, fit(ctx, `VOL. 1  —  ${dstr(p)}  —  FREE  ·  BESTIES SPOTTED HAVING THE BEST DAY`, '400 $px "Special Elite", monospace', cut.W - 60 * s, Math.round(11 * s + 2)), '#111'); txt(ctx, 'EXTRA! EXTRA!', cut.W / 2, h * 0.11, `400 ${Math.round(14 * s)}px "Bebas Neue", sans-serif`, '#111'); },
    cellOver: border('#111', 2) },
  { id: 'win98', name: 'Old computer', cat: 'Fun', head: 64, text: '#000080', cell: '#a0a0a0',
    bg: (ctx, W, H, s) => { ctx.fillStyle = '#c3c3c3'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, 3 * s); ctx.fillRect(0, 0, 3 * s, H); ctx.fillStyle = '#5a5a5a'; ctx.fillRect(W - 3 * s, 0, 3 * s, H); ctx.fillRect(0, H - 3 * s, W, 3 * s); },
    over: (ctx, cut, s) => { const h = cut.head, m = 8 * s; const g = ctx.createLinearGradient(m, 0, cut.W - m, 0); g.addColorStop(0, '#000080'); g.addColorStop(1, '#1084d0'); ctx.fillStyle = g; ctx.fillRect(m, m, cut.W - m * 2, h - m * 2.2); txt(ctx, '♥ besties.exe', m + 12 * s, m + (h - m * 2.2) / 2, `700 ${Math.round(h * 0.34)}px "DM Sans", sans-serif`, '#fff', 'left'); const bw = (h - m * 2.2) * 0.72; ['×', '□', '_'].forEach((t, k) => { const x = cut.W - m - 8 * s - (k + 1) * (bw + 4 * s); const y = m + (h - m * 2.2 - bw) / 2; ctx.fillStyle = '#c3c3c3'; ctx.fillRect(x, y, bw, bw); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, bw, 2 * s); ctx.fillRect(x, y, 2 * s, bw); ctx.fillStyle = '#5a5a5a'; ctx.fillRect(x + bw - 2 * s, y, 2 * s, bw); ctx.fillRect(x, y + bw - 2 * s, bw, 2 * s); txt(ctx, t, x + bw / 2, y + bw / 2 + 1 * s, `700 ${Math.round(bw * 0.7)}px "DM Sans", sans-serif`, '#000'); }); },
    cellOver: (ctx, c, s) => { const b = 3 * s; ctx.fillStyle = '#5a5a5a'; ctx.fillRect(c.x - b, c.y - b, c.w + b * 2, b); ctx.fillRect(c.x - b, c.y - b, b, c.h + b * 2); ctx.fillStyle = '#fff'; ctx.fillRect(c.x - b, c.y + c.h, c.w + b * 2, b); ctx.fillRect(c.x + c.w, c.y - b, b, c.h + b * 2); } },
  { id: 'browser', name: 'Y2K browser', cat: 'Y2K', head: 82, text: '#a8406a', cell: '#ffd9e5',
    bg: (ctx, W, H, s) => { ctx.fillStyle = '#ffc6e0'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5 * s; for (let y = 0; y < H; y += 6 * s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } },
    over: (ctx, cut, s) => { const h = cut.head, m = 14 * s; ctx.fillStyle = '#fff'; roundRect(ctx, m, m, cut.W - m * 2, h - m * 1.4, 14 * s); ctx.fill(); ['#ff6b6b', '#ffd23f', '#7fd18a'].forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(m + 22 * s + k * 20 * s, m + (h - m * 1.4) / 2, 6.5 * s, 0, 7); ctx.fill(); }); const bx = m + 90 * s, bw = cut.W - m * 2 - 104 * s; ctx.fillStyle = '#ffe3ef'; roundRect(ctx, bx, m + 9 * s, bw, h - m * 1.4 - 18 * s, 12 * s); ctx.fill(); txt(ctx, 'www.lingcam.com/besties ♥', bx + 12 * s, m + (h - m * 1.4) / 2, fit(ctx, 'www.lingcam.com/besties ♥', '700 $px "DM Sans", sans-serif', bw - 24 * s, Math.round(15 * s)), '#a8406a', 'left'); },
    cellOver: border('#ff5fa2', 3), deco: (cut) => scatter(cut, 8, 51, (ctx, x, y, s, k) => star(ctx, x, y, (9 + k * 7) * s, '#fff', k)) },
  { id: 'viewfinder', name: 'Camcorder', cat: 'Booth', text: '#ffffff', cell: '#222', bg: solid('#0f0f10'),
    cellOver: (ctx, c, s, i) => { const L = Math.min(c.w, c.h) * 0.14, m = 12 * s; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * s; [[c.x + m, c.y + m, 1, 1], [c.x + c.w - m, c.y + m, -1, 1], [c.x + m, c.y + c.h - m, 1, -1], [c.x + c.w - m, c.y + c.h - m, -1, -1]].forEach(([x, y, dx, dy]) => { ctx.beginPath(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y); ctx.lineTo(x + dx * L, y); ctx.stroke(); }); const f = Math.round(15 * s); ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(c.x + m + 16 * s, c.y + m + 20 * s, 6 * s, 0, 7); ctx.fill(); txt(ctx, 'REC', c.x + m + 28 * s, c.y + m + 21 * s, `700 ${f}px "Silkscreen", monospace`, '#fff', 'left'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * s; const bx = c.x + c.w - m - 44 * s, by = c.y + m + 13 * s; ctx.strokeRect(bx, by, 30 * s, 14 * s); ctx.fillStyle = '#fff'; ctx.fillRect(bx + 30 * s, by + 4 * s, 3 * s, 6 * s); ctx.fillRect(bx + 3 * s, by + 3 * s, 18 * s, 8 * s); txt(ctx, `00:0${i}:${String(17 + i * 9).padStart(2, '0')}`, c.x + c.w - m - 6 * s, c.y + c.h - m - 14 * s, `700 ${f}px "Silkscreen", monospace`, '#fff', 'right'); ctx.beginPath(); ctx.moveTo(c.x + c.w / 2 - 10 * s, c.y + c.h / 2); ctx.lineTo(c.x + c.w / 2 + 10 * s, c.y + c.h / 2); ctx.moveTo(c.x + c.w / 2, c.y + c.h / 2 - 10 * s); ctx.lineTo(c.x + c.w / 2, c.y + c.h / 2 + 10 * s); ctx.stroke(); } },
  { id: 'film35', name: '35mm film', cat: 'Booth', text: '#ff9f43', cell: '#2a1d14', filter: 'film', bg: solid('#1b130d'),
    deco: (cut) => (ctx, s) => { holes('rgba(255,236,210,.9)')(cut)(ctx, s); cut.cells.forEach((c, i) => { ctx.save(); ctx.translate(cut.pad * 0.25 + 3 * s, c.y + c.h / 2); ctx.rotate(-Math.PI / 2); txt(ctx, `${i + 1}  ▸  ${i + 1}A`, 0, 0, `700 ${Math.round(9 * s + 1)}px "Silkscreen", monospace`, '#ff9f43'); ctx.restore(); ctx.save(); ctx.translate(cut.W - cut.pad * 0.25 - 3 * s, c.y + c.h / 2); ctx.rotate(Math.PI / 2); txt(ctx, 'LINGCAM 400', 0, 0, `700 ${Math.round(9 * s + 1)}px "Silkscreen", monospace`, '#ff9f43'); ctx.restore(); }); } },
  { id: 'polaroids', name: 'Polaroids', cat: 'Booth', text: '#6b4433', cell: '#ddd', bg: speckle('#f2dfc8', ['rgba(120,80,40,.10)'], 1.2, 5),
    under: (ctx, c, s) => { const m = 9 * s; ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = 10 * s; ctx.shadowOffsetY = 4 * s; ctx.fillStyle = '#fff'; ctx.fillRect(c.x - m, c.y - m, c.w + m * 2, c.h + m * 2); },
    cellOver: (ctx, c, s, i) => tapeAt(ctx, c.x + c.w / 2, c.y - 6 * s, c.w * 0.3, (i % 2 ? 0.08 : -0.06), ['#ffbfd3', '#ffe589', '#cdeedd', '#cfe8ff'][i % 4], s) },
  { id: 'scrapbook', name: 'Scrapbook', cat: 'Fun', text: '#5a3a22', cell: '#e7d6bd', bg: speckle('#d8b98f', ['rgba(255,255,255,.18)', 'rgba(90,58,34,.12)'], 1.4, 7),
    under: (ctx, c, s, i) => tornPaper(ctx, c, s, i + 1),
    cellOver: (ctx, c, s, i) => { tapeAt(ctx, i % 2 ? c.x + c.w - 8 * s : c.x + 8 * s, c.y + 2 * s, c.w * 0.26, i % 2 ? 0.7 : -0.7, ['#ff9fbe', '#ffe589', '#b8e6c9', '#d8c9f5'][i % 4], s); },
    deco: stkDeco(['doodlestar', 'doodleheart', 'sparks', 'squiggle'], 6, 34, 61) },
  { id: 'ticket', name: 'Admit one', cat: 'Booth', head: 92, text: '#7a1f3a', cell: '#ffcfa0',
    bg: (ctx, W, H) => { ctx.fillStyle = '#ffe3b8'; ctx.fillRect(0, 0, W, H); },
    clip: (ctx, c, s) => { const r = 16 * s; ctx.beginPath(); ctx.moveTo(c.x + r, c.y); ctx.lineTo(c.x + c.w - r, c.y); ctx.arc(c.x + c.w, c.y, r, Math.PI, Math.PI / 2, true); ctx.lineTo(c.x + c.w, c.y + c.h - r); ctx.arc(c.x + c.w, c.y + c.h, r, -Math.PI / 2, Math.PI, true); ctx.lineTo(c.x + r, c.y + c.h); ctx.arc(c.x, c.y + c.h, r, 0, -Math.PI / 2, true); ctx.lineTo(c.x, c.y + r); ctx.arc(c.x, c.y, r, Math.PI / 2, 0, true); ctx.closePath(); },
    over: (ctx, cut, s) => { const h = cut.head; txt(ctx, '★ ADMIT ONE ★', cut.W / 2, h * 0.5, fit(ctx, '★ ADMIT ONE ★', '400 $px "Bebas Neue", sans-serif', cut.W - 60 * s, Math.round(h * 0.6)), '#b3122e'); txt(ctx, 'No. 000127', cut.W - 20 * s, h * 0.86, `400 ${Math.round(10 * s + 2)}px "Special Elite", monospace`, '#7a1f3a', 'right'); ctx.setLineDash([8 * s, 6 * s]); ctx.strokeStyle = '#b3122e'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(10 * s, h - 4 * s); ctx.lineTo(cut.W - 10 * s, h - 4 * s); ctx.stroke(); cut.cells.slice(0, -1).forEach((c) => { if (cut.cols === 1) { const y = c.y + c.h + (cut.cells[1].y - c.y - c.h) / 2; ctx.beginPath(); ctx.moveTo(10 * s, y); ctx.lineTo(cut.W - 10 * s, y); ctx.stroke(); } }); ctx.setLineDash([]); } },
  { id: 'receipt', name: 'Receipt', cat: 'Booth', head: 140, text: '#222', cell: '#ddd', filter: 'bw',
    bg: (ctx, W, H, s) => { ctx.fillStyle = '#fbfbf7'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#e9e6dd'; for (let x = 0; x < W; x += 16 * s) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 8 * s, H - 8 * s); ctx.lineTo(x + 16 * s, H); ctx.fill(); } },
    over: (ctx, cut, s, p) => { const h = cut.head, f = '400 $px "Special Elite", monospace'; txt(ctx, 'LINGCAM PHOTO CO.', cut.W / 2, h * 0.22, fit(ctx, 'LINGCAM PHOTO CO.', f, cut.W - 60 * s, Math.round(26 * s)), '#222'); txt(ctx, '*** BESTIE RECEIPT ***', cut.W / 2, h * 0.46, `400 ${Math.round(13 * s)}px "Special Elite", monospace`, '#222'); const d = new Date(p.created || Date.now()); txt(ctx, `${dstr(p)}   ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}   TABLE 02`, cut.W / 2, h * 0.66, `400 ${Math.round(11 * s + 1)}px "Special Elite", monospace`, '#222'); ctx.setLineDash([5 * s, 4 * s]); ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.moveTo(20 * s, h * 0.86); ctx.lineTo(cut.W - 20 * s, h * 0.86); ctx.stroke(); ctx.setLineDash([]); } },
  { id: 'arch', name: 'Arches', cat: 'Fun', text: '#4f6b45', cell: '#c9d8bd', bg: solid('#e4ecd9'),
    clip: (ctx, c) => { const r = c.w / 2; ctx.beginPath(); ctx.moveTo(c.x, c.y + c.h); ctx.lineTo(c.x, c.y + Math.min(r, c.h * 0.55)); ctx.arc(c.x + r, c.y + Math.min(r, c.h * 0.55), r, Math.PI, 0); ctx.lineTo(c.x + c.w, c.y + c.h); ctx.closePath(); },
    deco: stkDeco(['daisy', 'leaf', 'tulip'], 8, 30, 63) },
  { id: 'heartcells', name: 'Heart photos', cat: 'Cute', text: C.hot, cell: '#ffc6d6', bg: dots('#ffd9e5', '#ffffff', 22),
    clip: (ctx, c) => { const sz = Math.min(c.w, c.h * 1.1), x = c.x + (c.w - sz) / 2, y = c.y + (c.h - sz * 0.92) / 2; ctx.beginPath(); ctx.moveTo(x + sz / 2, y + sz * 0.92); ctx.bezierCurveTo(x - sz * 0.05, y + sz * 0.55, x, y + sz * 0.08, x + sz * 0.27, y + sz * 0.04); ctx.bezierCurveTo(x + sz * 0.42, y, x + sz * 0.5, y + sz * 0.14, x + sz / 2, y + sz * 0.2); ctx.bezierCurveTo(x + sz * 0.5, y + sz * 0.14, x + sz * 0.58, y, x + sz * 0.73, y + sz * 0.04); ctx.bezierCurveTo(x + sz, y + sz * 0.08, x + sz * 1.05, y + sz * 0.55, x + sz / 2, y + sz * 0.92); ctx.closePath(); },
    deco: stkDeco(['sparkle', 'heartpink'], 6, 26, 65) },
  { id: 'lace', name: 'Lace doily', cat: 'Cute', text: '#a8406a', cell: '#ffd9e5', bg: solid('#ffeef3'),
    under: (ctx, c, s) => scallopEdge(ctx, c.x - 4 * s, c.y - 4 * s, c.w + 8 * s, c.h + 8 * s, 9 * s, '#ffffff'),
    over: (ctx, cut, s) => { ctx.fillStyle = '#fff'; const r = 10 * s; for (let x = 0; x <= cut.W; x += r * 1.8) { ctx.beginPath(); ctx.arc(x, 0, r, 0, 7); ctx.arc(x, cut.H, r, 0, 7); ctx.fill(); } for (let y = 0; y <= cut.H; y += r * 1.8) { ctx.beginPath(); ctx.arc(0, y, r, 0, 7); ctx.arc(cut.W, y, r, 0, 7); ctx.fill(); } ctx.fillStyle = '#ffbfd3'; for (let x = r * 0.9; x <= cut.W; x += r * 1.8) { ctx.beginPath(); ctx.arc(x, r * 1.6, 2.2 * s, 0, 7); ctx.arc(x, cut.H - r * 1.6, 2.2 * s, 0, 7); ctx.fill(); } },
    deco: stkDeco(['bow', 'bow2'], 4, 36, 67) },
  { id: 'cloudy', name: 'Cloud frames', cat: 'Pastel', text: '#3b5a85', cell: '#e3f1ff', bg: grad(['#bfe0ff', '#e9f5ff']),
    under: (ctx, c, s) => scallopEdge(ctx, c.x - 2 * s, c.y - 2 * s, c.w + 4 * s, c.h + 4 * s, 15 * s, '#ffffff'),
    deco: stkDeco(['starblue', 'sparkle', 'rainbow'], 6, 28, 69) },
  { id: 'comic', name: 'Comic', cat: 'Fun', text: '#111', cell: '#fff3a8', bg: halftone('#ffe14d', 'rgba(255,90,90,.55)', 16),
    cellOver: border('#111', 6),
    deco: (cut) => { const pts = []; const labels = ['POW!', 'WOW!', 'OMG!', 'YAY!', 'ZAP!', 'LOL!']; cut.cells.forEach((c, i) => pts.push([i % 2 ? c.x + c.w - 6 : c.x + 6, c.y + c.h - 10, labels[i % labels.length], ['#ff5a5a', '#5ac8ff', '#fff'][i % 3]])); return (ctx, s) => pts.forEach(([x, y, l, f]) => burst(ctx, x, y, 46 * s, f, l, s)); } },
  { id: 'chalk', name: 'Chalkboard', cat: 'Fun', text: '#ffffff', cell: '#3b5a48', bg: speckle('#2e473a', ['rgba(255,255,255,.05)'], 2, 11),
    cellOver: (ctx, c, s) => chalkLine(ctx, [[c.x - 6 * s, c.y - 6 * s], [c.x + c.w + 6 * s, c.y - 6 * s], [c.x + c.w + 6 * s, c.y + c.h + 6 * s], [c.x - 6 * s, c.y + c.h + 6 * s], [c.x - 6 * s, c.y - 6 * s]], s),
    deco: (cut) => scatter(cut, 7, 71, (ctx, x, y, s, k) => { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.5 * s; ctx.beginPath(); if (k > 0.5) { for (let i = 0; i < 11; i++) { const rr = i % 2 ? 5 * s : 12 * s; const a = (i * Math.PI) / 5 - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } } else { ctx.moveTo(x, y + 8 * s); ctx.bezierCurveTo(x - 14 * s, y - 2 * s, x - 6 * s, y - 12 * s, x, y - 4 * s); ctx.bezierCurveTo(x + 6 * s, y - 12 * s, x + 14 * s, y - 2 * s, x, y + 8 * s); } ctx.stroke(); ctx.restore(); }) },
  { id: 'boarding', name: 'Boarding pass', cat: 'Fun', head: 120, text: '#3b6fd1', cell: '#dbe7fb', bg: solid('#ffffff'),
    over: (ctx, cut, s) => { const h = cut.head; ctx.fillStyle = '#3b6fd1'; ctx.fillRect(0, 0, cut.W, h * 0.46); txt(ctx, 'BOARDING PASS', 20 * s, h * 0.24, fit(ctx, 'BOARDING PASS', '400 $px "Bebas Neue", sans-serif', cut.W * 0.62, Math.round(h * 0.3)), '#fff', 'left'); txt(ctx, '✈ BFF AIR', cut.W - 20 * s, h * 0.24, `700 ${Math.round(h * 0.14)}px "DM Sans", sans-serif`, '#fff', 'right'); const f = `700 ${Math.round(h * 0.12)}px "DM Sans", sans-serif`, f2 = `400 ${Math.round(h * 0.2)}px "Bebas Neue", sans-serif`; [['FROM', 'KUL', 20], ['TO', 'FUN', 130], ['SEAT', '01A', 240]].forEach(([a, b, x]) => { txt(ctx, a, x * s, h * 0.58, f, '#7a8fb5', 'left'); txt(ctx, b, x * s, h * 0.8, f2, '#1f3d78', 'left'); }); let bx = cut.W - 20 * s; for (let k = 0; k < 34; k++) { const w = ((k * 7) % 3 + 1) * 1.6 * s; bx -= w + 1.8 * s; if (bx < cut.W * 0.62) break; ctx.fillStyle = '#1f3d78'; ctx.fillRect(bx, h * 0.54, w, h * 0.36); } } },
  { id: 'nowplaying', name: 'Now playing', cat: 'Fun', head: 156, text: '#5b3f8f', cell: '#d8c9f5', bg: grad(['#e6dcff', '#ffd9e5']),
    over: (ctx, cut, s) => { const h = cut.head, m = 16 * s; ctx.fillStyle = 'rgba(255,255,255,.82)'; roundRect(ctx, m, m, cut.W - m * 2, h - m * 1.5, 18 * s); ctx.fill(); const a = h - m * 1.5 - 24 * s; ctx.fillStyle = '#ff9fbe'; roundRect(ctx, m + 12 * s, m + 12 * s, a, a, 10 * s); ctx.fill(); heart(ctx, m + 12 * s + a / 2, m + 12 * s + a / 2, a * 0.32, '#fff'); const tx = m + 24 * s + a, tw = cut.W - tx - m - 12 * s; txt(ctx, 'best day ever', tx, m + 26 * s, fit(ctx, 'best day ever', '700 $px Fredoka, sans-serif', tw, Math.round(22 * s)), '#3d2433', 'left'); txt(ctx, 'lingcam & besties', tx, m + 50 * s, `400 ${Math.round(13 * s)}px "DM Sans", sans-serif`, '#7a5466', 'left'); const py = m + 72 * s; ctx.fillStyle = '#e3d6f2'; roundRect(ctx, tx, py, tw, 5 * s, 3 * s); ctx.fill(); ctx.fillStyle = '#8a5ad6'; roundRect(ctx, tx, py, tw * 0.62, 5 * s, 3 * s); ctx.fill(); ctx.beginPath(); ctx.arc(tx + tw * 0.62, py + 2.5 * s, 6 * s, 0, 7); ctx.fill(); const cy = py + 26 * s, cx = tx + tw / 2; ctx.fillStyle = '#3d2433'; const tri = (x, y, r, d) => { ctx.beginPath(); ctx.moveTo(x - d * r * 0.6, y - r); ctx.lineTo(x + d * r * 0.9, y); ctx.lineTo(x - d * r * 0.6, y + r); ctx.fill(); }; tri(cx - 40 * s, cy, 7 * s, -1); tri(cx - 48 * s, cy, 7 * s, -1); ctx.fillRect(cx - 6 * s, cy - 9 * s, 4 * s, 18 * s); ctx.fillRect(cx + 3 * s, cy - 9 * s, 4 * s, 18 * s); tri(cx + 42 * s, cy, 7 * s, 1); tri(cx + 50 * s, cy, 7 * s, 1); } },
  { id: 'gameboy', name: 'Pixel game', cat: 'Fun', head: 78, text: '#0f380f', cell: '#8bac0f', bg: solid('#9bbc0f'),
    over: (ctx, cut, s) => { const h = cut.head; txt(ctx, 'PLAYER 1', 20 * s, h * 0.5, `700 ${Math.round(h * 0.26)}px "Silkscreen", monospace`, '#0f380f', 'left'); txt(ctx, 'SCORE 9999', cut.W - 20 * s, h * 0.5, `700 ${Math.round(h * 0.26)}px "Silkscreen", monospace`, '#0f380f', 'right'); const px = 3 * s, heartPx = ['01100110', '11111111', '11111111', '01111110', '00111100', '00011000']; [0, 1, 2].forEach((k) => heartPx.forEach((row, ry) => [...row].forEach((v, rx) => { if (v === '1') { ctx.fillStyle = '#0f380f'; ctx.fillRect(cut.W / 2 - 40 * s + k * 28 * s + rx * px, h * 0.5 - 9 * s + ry * px, px, px); } }))); },
    cellOver: (ctx, c, s) => { const b = 6 * s; ctx.fillStyle = '#306230'; ctx.fillRect(c.x - b, c.y - b, c.w + b * 2, b); ctx.fillRect(c.x - b, c.y + c.h, c.w + b * 2, b); ctx.fillRect(c.x - b, c.y, b, c.h); ctx.fillRect(c.x + c.w, c.y, b, c.h); ctx.fillStyle = '#9bbc0f'; [[c.x - b, c.y - b], [c.x + c.w, c.y - b], [c.x - b, c.y + c.h], [c.x + c.w, c.y + c.h]].forEach(([x, y]) => ctx.fillRect(x, y, b, b)); } },
  { id: 'sunburst', name: '70s sunburst', cat: 'Fun', text: '#7a2e12', cell: '#ffd59a',
    bg: (ctx, W, H) => { const cx = W / 2, cy = H * 1.05, cols = ['#ff9a5a', '#ffcf5a', '#ff6f91']; for (let i = 0; i < 36; i++) { ctx.fillStyle = cols[i % 3]; ctx.beginPath(); ctx.moveTo(cx, cy); const a0 = (i / 36) * Math.PI * 2, a1 = ((i + 1) / 36) * Math.PI * 2; ctx.lineTo(cx + Math.cos(a0) * H * 2, cy + Math.sin(a0) * H * 2); ctx.lineTo(cx + Math.cos(a1) * H * 2, cy + Math.sin(a1) * H * 2); ctx.fill(); } },
    under: (ctx, c, s) => { ctx.fillStyle = '#fff6e6'; roundRect(ctx, c.x - 7 * s, c.y - 7 * s, c.w + 14 * s, c.h + 14 * s, 20 * s); ctx.fill(); },
    clip: (ctx, c, s) => roundRect(ctx, c.x, c.y, c.w, c.h, 16 * s) },
  { id: 'cork', name: 'Cork board', cat: 'Fun', text: '#4a2e18', cell: '#e6d3b5', bg: speckle('#c99a6b', ['rgba(80,45,15,.25)', 'rgba(255,230,190,.25)'], 3, 13),
    under: (ctx, c, s) => { ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 8 * s; ctx.shadowOffsetY = 4 * s; ctx.fillStyle = '#fff'; ctx.fillRect(c.x - 7 * s, c.y - 7 * s, c.w + 14 * s, c.h + 14 * s); },
    cellOver: (ctx, c, s, i) => pin(ctx, c.x + c.w / 2, c.y - 2 * s, s, ['#e8304f', '#3b6fd1', '#ffd23f', '#5a9a3a'][i % 4]) },
  { id: 'loveletter', name: 'Love letter', cat: 'Cute', head: 112, text: '#a8406a', cell: '#ffc9da', bg: solid('#ffe1ea'),
    over: (ctx, cut, s) => { const h = cut.head; ctx.fillStyle = '#ffc2d4'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(cut.W, 0); ctx.lineTo(cut.W / 2, h * 0.92); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#ff9fbe'; ctx.lineWidth = 2 * s; ctx.stroke(); ctx.fillStyle = '#c8102e'; ctx.beginPath(); ctx.arc(cut.W / 2, h * 0.62, h * 0.2, 0, 7); ctx.fill(); heart(ctx, cut.W / 2, h * 0.63, h * 0.1, '#ffd9e5'); const st = 46 * s, sx = cut.W - st - 14 * s, sy = 12 * s; ctx.fillStyle = '#fff'; ctx.fillRect(sx, sy, st, st * 1.2); ctx.setLineDash([3 * s, 3 * s]); ctx.strokeStyle = '#ff9fbe'; ctx.strokeRect(sx + 3 * s, sy + 3 * s, st - 6 * s, st * 1.2 - 6 * s); ctx.setLineDash([]); heart(ctx, sx + st / 2, sy + st * 0.6, st * 0.22, '#e8304f'); txt(ctx, 'to: my besties', 18 * s, h * 0.2, `700 ${Math.round(h * 0.2)}px Caveat, cursive`, '#a8406a', 'left'); } },
  { id: 'starry', name: 'Starry night', cat: 'Y2K', text: '#ffe589', cell: '#2a3360',
    bg: (ctx, W, H, s) => { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#141a3d'); g.addColorStop(1, '#3d2a6b'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); let r = 3; const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280); for (let i = 0; i < W * H / (700 * s * s); i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, (0.6 + rnd() * 1.6) * s, 0, 7); ctx.fill(); } },
    under: (ctx, c, s) => { ctx.shadowColor = 'rgba(255,229,137,.65)'; ctx.shadowBlur = 18 * s; ctx.fillStyle = '#ffe589'; ctx.fillRect(c.x - 2 * s, c.y - 2 * s, c.w + 4 * s, c.h + 4 * s); },
    deco: stkDeco(['moon', 'starpink', 'sparkle', 'planet'], 7, 30, 73) },
  { id: 'bunting', name: 'Party bunting', cat: 'Party', head: 116, text: C.hot, cell: '#ffd9e5', bg: sprinkles('#fffaf0', ['#ff7a9a', '#ffd23f', '#7fa8e8', '#7fc49a', '#c9b6f2']),
    over: (ctx, cut, s) => { const h = cut.head, word = 'HAPPY DAY!', n = word.length, w = (cut.W - 30 * s) / n; ctx.strokeStyle = '#7a5466'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(10 * s, h * 0.18); ctx.quadraticCurveTo(cut.W / 2, h * 0.42, cut.W - 10 * s, h * 0.18); ctx.stroke(); const cols = ['#ff7a9a', '#ffd23f', '#7fa8e8', '#7fc49a', '#c9b6f2']; [...word].forEach((ch, i) => { const x = 15 * s + i * w, t = (i + 0.5) / n, y = h * 0.18 + Math.sin(t * Math.PI) * h * 0.12; ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(x + 2 * s, y); ctx.lineTo(x + w - 2 * s, y); ctx.lineTo(x + w / 2, y + h * 0.62); ctx.closePath(); ctx.fill(); if (ch !== ' ') txt(ctx, ch, x + w / 2, y + h * 0.22, `400 ${Math.round(Math.min(w * 0.7, h * 0.3))}px "Bebas Neue", sans-serif`, '#fff'); }); } },
  { id: 'rayabanner', name: 'Raya banner', cat: 'Party', head: 120, text: '#ffe589', cell: '#2f8a5c', bg: pattern('#17583a', diamondK, 34),
    over: (ctx, cut, s) => { const h = cut.head; const im = stk('ketupat'); [0.12, 0.88].forEach((fx) => { ctx.strokeStyle = '#e3b400'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(cut.W * fx, 0); ctx.lineTo(cut.W * fx, h * 0.25); ctx.stroke(); if (im && im.complete) ctx.drawImage(im, cut.W * fx - h * 0.38, h * 0.18, h * 0.76, h * 0.76); }); txt(ctx, 'Selamat Hari Raya', cut.W / 2, h * 0.45, fit(ctx, 'Selamat Hari Raya', '700 $px "Dancing Script", cursive', cut.W * 0.62, Math.round(h * 0.4)), '#ffe589'); txt(ctx, 'MAAF ZAHIR & BATIN', cut.W / 2, h * 0.8, `400 ${Math.round(h * 0.16)}px "Bebas Neue", sans-serif`, '#fff3c4'); } },
  { id: 'calendar', name: 'Calendar page', cat: 'Fun', head: 140, text: '#c8102e', cell: '#f3e8e8', bg: solid('#ffffff'),
    over: (ctx, cut, s, p) => { const h = cut.head, d = new Date(p.created || Date.now()); ctx.fillStyle = '#c8102e'; ctx.fillRect(0, 0, cut.W, h * 0.42); txt(ctx, MONTHS[d.getMonth()] + ' ' + d.getFullYear(), cut.W / 2, h * 0.23, fit(ctx, MONTHS[d.getMonth()] + ' ' + d.getFullYear(), '400 $px "Bebas Neue", sans-serif', cut.W - 40 * s, Math.round(h * 0.28)), '#fff'); ctx.fillStyle = '#3d2433'; for (let x = 60 * s; x < cut.W - 40 * s; x += 80 * s) { ctx.beginPath(); ctx.arc(x, 6 * s, 7 * s, 0, 7); ctx.fill(); } txt(ctx, String(d.getDate()), cut.W / 2, h * 0.74, `400 ${Math.round(h * 0.5)}px "Bebas Neue", sans-serif`, '#3d2433'); txt(ctx, ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][d.getDay()], cut.W - 20 * s, h * 0.74, `700 ${Math.round(h * 0.1)}px "DM Sans", sans-serif`, '#c8102e', 'right'); txt(ctx, 'today ♥', 20 * s, h * 0.74, `700 ${Math.round(h * 0.17)}px Caveat, cursive`, '#c8102e', 'left'); } },
  { id: 'graduation', name: 'Graduation', cat: 'Party', head: 110, text: '#ffd23f', cell: '#24305e', bg: solid('#151d3f'),
    over: (ctx, cut, s, p) => { const h = cut.head, y = new Date(p.created || Date.now()).getFullYear(); txt(ctx, `CLASS OF ${y}`, cut.W / 2, h * 0.55, fit(ctx, `CLASS OF ${y}`, '400 $px "Bebas Neue", sans-serif', cut.W - 140 * s, Math.round(h * 0.55)), '#ffd23f'); const cap = (x) => { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(x, h * 0.3); ctx.lineTo(x + 28 * s, h * 0.42); ctx.lineTo(x, h * 0.54); ctx.lineTo(x - 28 * s, h * 0.42); ctx.closePath(); ctx.fill(); ctx.fillRect(x - 14 * s, h * 0.46, 28 * s, 14 * s); }; cap(40 * s); cap(cut.W - 40 * s); },
    deco: stkDeco(['sparkle', 'starpink'], 6, 26, 75) },
);
FRAME_CATS.splice(1, 0, 'Booth', 'Fun');

// ================= photo booth props, bubbles and labels =================
const T = (t, x, y, size, fill = '#3d2433', extra = '') => `<text x="${x}" y="${y}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-weight="900" font-size="${size}" text-anchor="middle" dominant-baseline="middle" fill="${fill}" ${extra}>${t}</text>`;
const bubble = (t, fill, ink = '#3d2433', size = 22) => svg(`<path ${O} fill="${fill}" d="M14 18h72a10 10 0 0 1 10 10v34a10 10 0 0 1-10 10H44l-18 16 4-16H14A10 10 0 0 1 4 62V28a10 10 0 0 1 10-10z"/>${T(t, 50, 46, size, ink)}`);
const think = (t, fill) => svg(`<g ${O} fill="${fill}"><ellipse cx="54" cy="40" rx="42" ry="28"/><circle cx="20" cy="78" r="7"/><circle cx="10" cy="92" r="4"/></g>${T(t, 54, 41, 18)}`);
const burstS = (t, fill, ink = '#3d2433') => svg(`<path ${O} fill="${fill}" d="${Array.from({ length: 24 }, (_, i) => { const r = i % 2 ? 32 : 46, a = (i / 24) * Math.PI * 2; return `${i ? 'L' : 'M'}${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)}`; }).join('')}z"/>${T(t, 50, 51, 20, ink)}`);
const label = (t, fill, dir = 1) => svg(`<path d="${dir > 0 ? 'M70 78c-4-14-14-22-30-24M40 54l8-6M40 54l9 5' : 'M30 78c4-14 14-22 30-24M60 54l-8-6M60 54l-9 5'}" fill="none" stroke="#3d2433" stroke-width="4" stroke-linecap="round"/><rect ${O} x="10" y="14" width="80" height="32" rx="16" fill="${fill}"/>${T(t, 50, 31, 17)}`);
Object.assign(S, {
  // props
  mustache: svg(`<path ${O} fill="#3d2433" d="M50 46c-6-8-16-12-26-8-8 3-14 10-20 6 2 14 16 22 30 18 8-2 14-8 16-12 2 4 8 10 16 12 14 4 28-4 30-18-6 4-12-3-20-6-10-4-20 0-26 8z"/>`),
  heartglasses: svg(`<path d="M44 44h12M10 40l-6-6M90 40l6-6" stroke="#3d2433" stroke-width="5" stroke-linecap="round"/><g ${O} fill="#ff4f8b"><path d="M27 66C6 52 4 40 10 32c5-6 13-5 17 1 4-6 12-7 17-1 6 8 4 20-17 34z"/><path d="M73 66C52 52 50 40 56 32c5-6 13-5 17 1 4-6 12-7 17-1 6 8 4 20-17 34z"/></g><path d="M14 36c3-3 7-3 9-1M60 36c3-3 7-3 9-1" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`),
  starglasses: svg(`<path d="M44 46h12" stroke="#3d2433" stroke-width="5"/><g ${O} fill="#ffd23f">${[27, 73].map((cx) => `<path d="${Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 9 : 21, a = (i * Math.PI) / 5 - Math.PI / 2; return `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)} ${(48 + Math.sin(a) * r).toFixed(1)}`; }).join('')}z"/>`).join('')}</g><circle cx="27" cy="49" r="6" fill="#3d2433" opacity=".8"/><circle cx="73" cy="49" r="6" fill="#3d2433" opacity=".8"/>`),
  nerdglasses: svg(`<g ${O}><rect x="8" y="34" width="36" height="28" rx="8" fill="rgba(200,230,255,.55)" stroke-width="6"/><rect x="56" y="34" width="36" height="28" rx="8" fill="rgba(200,230,255,.55)"/></g><g fill="none" stroke="#3d2433" stroke-width="5"><rect x="8" y="34" width="36" height="28" rx="8"/><rect x="56" y="34" width="36" height="28" rx="8"/><path d="M44 44c4-3 8-3 12 0"/></g>`),
  partyglasses: svg(`<path d="M44 46h12" stroke="#3d2433" stroke-width="5"/><g ${O}><path fill="#7fa8e8" d="M6 32h38l-4 26H12z"/><path fill="#ff7a9a" d="M56 32h38l-6 26H60z"/></g><path d="M10 34l10-10M86 34l6-12" stroke="#ffd23f" stroke-width="4" stroke-linecap="round"/><circle cx="20" cy="22" r="4" fill="#ffd23f"/><circle cx="92" cy="20" r="4" fill="#ffd23f"/>`),
  tophat: svg(`<path ${O} fill="#3d2433" d="M28 18h44l-4 52H32z"/><ellipse ${O} cx="50" cy="72" rx="44" ry="10" fill="#3d2433"/><rect x="30" y="56" width="40" height="9" fill="#e8407c"/>`),
  bowtie: svg(`<g ${O} fill="#e8304f"><path d="M50 50L10 26v48z"/><path d="M50 50l40-24v48z"/></g><rect x="42" y="40" width="16" height="20" rx="5" fill="#a51d3a"/><g fill="#fff" opacity=".8"><circle cx="24" cy="44" r="3"/><circle cx="26" cy="58" r="3"/><circle cx="76" cy="44" r="3"/><circle cx="74" cy="58" r="3"/></g>`),
  tiara: svg(`<path ${O} fill="#ffe589" d="M8 74c10-24 22-38 42-50 20 12 32 26 42 50-26-8-58-8-84 0z"/><path d="M50 30v34M30 46l8 20M70 46l-8 20" stroke="#e3b400" stroke-width="3"/><circle cx="50" cy="26" r="7" fill="#ff7aa2"/><circle cx="28" cy="50" r="5" fill="#9cc4ee"/><circle cx="72" cy="50" r="5" fill="#9cc4ee"/>`),
  flowercrown: svg(`<path d="M6 66c28-18 60-18 88 0" fill="none" stroke="#5a9a3a" stroke-width="5"/>${[[14, 60, '#ff9fbe'], [32, 52, '#fff3a8'], [50, 50, '#ff7a9a'], [68, 52, '#c9b6f2'], [86, 60, '#ff9fbe']].map(([x, y, c]) => `<g ${O}>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + 7 * Math.cos((a - 90) * Math.PI / 180)).toFixed(1)}" cy="${(y + 7 * Math.sin((a - 90) * Math.PI / 180)).toFixed(1)}" r="6" fill="${c}"/>`).join('')}</g><circle cx="${x}" cy="${y}" r="4" fill="#ffd23f"/>`).join('')}<path fill="#7fc49a" d="M22 66c-4 6-10 6-12 4 4-4 8-5 12-4zM78 66c4 6 10 6 12 4-4-4-8-5-12-4z"/>`),
  bunnyears: svg(`<g ${O} fill="#fff"><path d="M30 92C18 62 18 10 32 8s16 44 10 84z"/><path d="M70 92c12-30 12-82-2-84S52 52 58 92z"/></g><path fill="#ffbfd3" d="M31 84c-8-24-8-62 2-64s10 34 6 64zM69 84c8-24 8-62-2-64s-10 34-6 64z"/><rect x="18" y="86" width="64" height="8" rx="4" fill="#ff9fbe"/>`),
  catears: svg(`<g ${O} fill="#3d2433"><path d="M10 80L18 22l34 34z"/><path d="M90 80L82 22 48 56z"/></g><path fill="#ff9fbe" d="M20 66l5-32 18 20zM80 66l-5-32-18 20z"/><path d="M6 82c28-12 60-12 88 0" fill="none" stroke="#3d2433" stroke-width="7" stroke-linecap="round"/>`),
  horns: svg(`<g ${O} fill="#e8304f"><path d="M22 74C10 54 12 30 26 14c-2 20 6 34 20 44z"/><path d="M78 74c12-20 10-44-4-60 2 20-6 34-20 44z"/></g><path d="M8 82c28-12 56-12 84 0" fill="none" stroke="#a51d3a" stroke-width="6" stroke-linecap="round"/>`),
  halo: svg(`<ellipse cx="50" cy="50" rx="40" ry="14" fill="none" stroke="#fff" stroke-width="16"/><ellipse cx="50" cy="50" rx="40" ry="14" fill="none" stroke="#ffd23f" stroke-width="8"/><path d="M20 44c10-4 22-6 30-6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`),
  blush: svg(`<ellipse cx="22" cy="50" rx="18" ry="11" fill="#ff7aa2" opacity=".55"/><ellipse cx="78" cy="50" rx="18" ry="11" fill="#ff7aa2" opacity=".55"/><g stroke="#ff4f8b" stroke-width="2.5" stroke-linecap="round" opacity=".8"><path d="M14 46l-3 7M22 45l-3 8M30 46l-3 7M70 46l-3 7M78 45l-3 8M86 46l-3 7"/></g>`),
  kiss: svg(`<path fill="#e8304f" opacity=".9" d="M14 52c8-10 16-16 24-14 5 1 8 4 12 4s7-3 12-4c8-2 16 4 24 14-8 6-16 6-20 4-4 6-10 10-16 10S38 62 34 56c-4 2-12 2-20-4z"/><path d="M20 52c10 2 20 3 30 3s20-1 30-3" stroke="#a51d3a" stroke-width="2" fill="none" opacity=".6"/>`),
  tongue: svg(`<path ${O} fill="#3d2433" d="M14 34h72c0 22-16 34-36 34S14 56 14 34z"/><path fill="#ff7a9a" d="M36 52h28v18a14 14 0 0 1-28 0z"/><path d="M50 54v14" stroke="#e8407c" stroke-width="2.5"/><rect x="24" y="34" width="52" height="8" rx="2" fill="#fff"/>`),
  dognose: svg(`<ellipse ${O} cx="50" cy="44" rx="26" ry="18" fill="#3d2433"/><ellipse cx="42" cy="38" rx="7" ry="4" fill="#fff" opacity=".5"/><path ${O} fill="#ff7a9a" d="M38 62h24v16a12 12 0 0 1-24 0z"/>`),
  tear: svg(`<path ${O} fill="#7fc8f8" d="M50 10c16 24 26 38 26 54a26 26 0 0 1-52 0c0-16 10-30 26-54z"/><ellipse cx="40" cy="60" rx="5" ry="9" fill="#fff" opacity=".7"/>`),
  sweat: svg(`<path ${O} fill="#9cd6fb" d="M70 10c10 16 16 26 16 36a16 16 0 0 1-32 0c0-10 6-20 16-36z"/><path ${O} fill="#9cd6fb" d="M30 44c8 12 12 20 12 28a12 12 0 0 1-24 0c0-8 4-16 12-28z"/>`),
  anger: svg(`<g fill="#e8304f" ${O}><path d="M30 14h12l2 20-16 2z"/><path d="M58 14h12l-2 22-16-2z"/><path d="M30 86h12l2-20-16-2z"/><path d="M58 86h12l-2-22-16 2z"/></g>`),
  sparkleeyes: svg(`<g ${O} fill="#fff"><circle cx="28" cy="50" r="20"/><circle cx="72" cy="50" r="20"/></g><circle cx="28" cy="52" r="14" fill="#3d2433"/><circle cx="72" cy="52" r="14" fill="#3d2433"/><circle cx="23" cy="46" r="5" fill="#fff"/><circle cx="67" cy="46" r="5" fill="#fff"/><path fill="#fff" d="M33 58l1 3 3 1-3 1-1 3-1-3-3-1 3-1zM77 58l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>`),
  lightning: svg(`<path ${O} fill="#ffd23f" d="M58 4L18 56h26l-8 40 46-56H54z"/>`),
  film: svg(`<rect ${O} x="10" y="22" width="80" height="56" rx="4" fill="#3d2433"/>${[18, 34, 50, 66, 82].map((x) => `<rect x="${x - 4}" y="26" width="8" height="6" rx="1.5" fill="#fff"/><rect x="${x - 4}" y="68" width="8" height="6" rx="1.5" fill="#fff"/>`).join('')}<rect x="18" y="36" width="28" height="28" fill="#ffbfd3"/><rect x="54" y="36" width="28" height="28" fill="#ffe589"/>`),
  polaroidmini: svg(`<g transform="rotate(-8 50 50)"><rect ${O} x="18" y="12" width="64" height="76" rx="3" fill="#fff"/><rect x="24" y="18" width="52" height="48" fill="#ffbfd3"/><path fill="#ff4f8b" d="M50 52c-10-7-12-12-9-15 2-2 6-2 9 2 3-4 7-4 9-2 3 3 1 8-9 15z"/></g>`),
  hundred: svg(`${T('100', 50, 46, 34, '#e8304f', 'font-style="italic"')}<path d="M18 66c22 6 44 6 64 0M22 76c20 5 38 5 56 0" stroke="#e8304f" stroke-width="5" fill="none" stroke-linecap="round"/>`),
  // speech bubbles
  bubhi: bubble('HI!', '#fff3a8'), buomg: bubble('OMG', '#ffbfd3'), bublol: bubble('LOL', '#cfe8ff'), bubheart: bubble('♥♥', '#ffffff', '#e8304f', 26), bubcute: bubble('cute!', '#d8c9f5', '#3d2433', 20), bubhehe: bubble('hehe', '#cdeedd', '#3d2433', 20), bubwow: bubble('WOW', '#ffd23f'), bubsayang: bubble('sayang', '#ffd9e5', '#c93a6e', 17),
  thinkyum: think('hmm...', '#fff'), thinklove: think('love u', '#ffe3ec'),
  burstwow: burstS('WOW!', '#ffd23f'), burstpow: burstS('POW!', '#ff7a7a'), burstyay: burstS('YAY!', '#7fd1ff'), burstnew: burstS('NEW!', '#ff9fbe'),
  // labels with arrows
  lblme: label('me', '#fff3a8', 1), lblher: label('her', '#ffbfd3', -1), lblhim: label('him', '#cfe8ff', -1), lblbestie: label('bestie', '#cdeedd', 1), lblcutie: label('cutie', '#d8c9f5', -1), lblqueen: label('queen', '#ffe589', 1), lblbaby: label('baby', '#ffd9e5', -1), lblmain: label('main char', '#fff', 1),
});
const cats = STICKER_CATS;
cats.splice(2, 0,
  { id: 'props', name: 'Props', items: ['heartglasses', 'starglasses', 'nerdglasses', 'partyglasses', 'mustache', 'tophat', 'bowtie', 'tiara', 'crown', 'flowercrown', 'bunnyears', 'catears', 'horns', 'halo', 'blush', 'kiss', 'lips', 'tongue', 'dognose', 'sparkleeyes', 'tear', 'sweat', 'anger', 'shades'] },
  { id: 'bubbles', name: 'Bubbles', items: ['bubhi', 'buomg', 'bublol', 'bubheart', 'bubcute', 'bubhehe', 'bubwow', 'bubsayang', 'thinkyum', 'thinklove', 'burstwow', 'burstpow', 'burstyay', 'burstnew', 'hundred'] },
  { id: 'labels', name: 'Labels', items: ['lblme', 'lblher', 'lblhim', 'lblbestie', 'lblcutie', 'lblqueen', 'lblbaby', 'lblmain'] },
);
cats.find((c) => c.id === 'y2k').items.push('film', 'polaroidmini', 'lightning');
