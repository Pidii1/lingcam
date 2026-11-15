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
export const FRAME_CATS = ['All', 'Cute', 'Plain', 'Film', 'Denim'];
export const SWATCHES = ['#fffdf7', '#ffbfd3', '#ffe589', '#ff9fbe', '#ffd9e5', '#fff3c4', '#7a1f3a', '#3b5a85', '#211820', '#bfe0ff', '#c9b6f2', '#b8e6c9'];

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
export const STICKER_CATS = [
  { id: 'cute', name: 'Cute', items: ['heart', 'heartpink', 'star', 'sparkle', 'flower', 'smiley', 'bow', 'cherry', 'cloud', 'moon', 'butterfly', 'crown'] },
  { id: 'y2k', name: 'Y2K', items: ['chrome', 'peace', 'flame', 'shades', 'disco', 'butterfly', 'sparkle', 'heart'] },
  { id: 'words', name: 'Words', words: ['besties!', 'xoxo', 'bff', 'love u', 'cutie', 'yay!', 'omg', 'smile :)', 'us <3', 'core memory', 'say cheese', 'lingcam'] },
  { id: 'doodles', name: 'Doodles', items: ['arrow', 'squiggle', 'swirl', 'scribble', 'doodlecrown', 'doodlestar', 'doodleheart', 'sparks'] },
  { id: 'food', name: 'Food', items: ['strawberry', 'cherry', 'icecream', 'donut', 'boba', 'cake'] },
  { id: 'emoji', name: 'Emoji', emoji: ['😍', '🥰', '😎', '🤪', '😜', '🥹', '💖', '✨', '🎀', '🌸', '🍓', '🧸', '💋', '👑', '🦋', '🌈', '⭐', '🫶'] },
];
export const FONTS = [
  { id: 'script', name: 'Script', css: 'Caveat', weight: 700 },
  { id: 'round', name: 'Round', css: 'Fredoka', weight: 700 },
  { id: 'classic', name: 'Classic', css: 'Playfair Display', weight: 700, style: 'italic' },
  { id: 'type', name: 'Type', css: 'Special Elite', weight: 400 },
];
export const fontById = (id) => FONTS.find((f) => f.id === id) || FONTS[0];
export const INKS = ['#c93a6e', '#3d2433', '#ffffff', '#e3b400', '#7fa8e8', '#ff8fb3', '#5a9a3a', '#000000'];
