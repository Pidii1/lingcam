// Lingcam share links: POST a JPEG, get a short id. The picture is deleted after 7 days.
// GET /api/share?id=xxxx returns the picture.
const { redis, creds } = require('./_redis');
const TTL = 7 * 24 * 3600;
const MAX = 1300000;
function cors(res) { res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); }
function json(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); }
async function body(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw = typeof req.body === 'string' ? req.body : Buffer.isBuffer(req.body) ? req.body.toString('utf8') : await new Promise((ok, bad) => { let s = ''; req.on('data', (c) => { s += c; if (s.length > MAX + 1000) { bad(new Error('big')); req.destroy(); } }); req.on('end', () => ok(s)); req.on('error', bad); });
  return JSON.parse(raw || '{}');
}
const ID = /^[A-Za-z0-9]{6,12}$/;
function newId() { const a = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://x'); const id = url.searchParams.get('id') || '';
      if (url.searchParams.get('status') !== null) return json(res, 200, { ok: true, storage: creds() ? 'redis' : 'none' });
      if (!ID.test(id)) return json(res, 400, { error: 'Bad link' });
      const v = await redis(['GET', 'lc:s:' + id]);
      if (!v) return json(res, 404, { error: 'This link has expired' });
      const m = /^data:(image\/(?:jpeg|png));base64,(.+)$/.exec(v); if (!m) return json(res, 404, { error: 'This link has expired' });
      res.statusCode = 200; res.setHeader('Content-Type', m[1]); res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.end(Buffer.from(m[2], 'base64'));
    }
    if (req.method === 'POST') {
      if (!creds()) return json(res, 503, { error: 'Links are not set up on this website yet (connect Upstash Redis in Vercel)' });
      let b; try { b = await body(req); } catch (e) { return json(res, 413, { error: 'That picture is too big' }); }
      const img = String(b && b.img || '');
      if (!/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(img)) return json(res, 400, { error: 'Not a picture' });
      if (img.length > MAX) return json(res, 413, { error: 'That picture is too big' });
      let id = newId();
      for (let i = 0; i < 3; i++) { const ok = await redis(['SET', 'lc:s:' + id, img, 'EX', TTL, 'NX']); if (ok) break; id = newId(); }
      return json(res, 200, { id, expires: Date.now() + TTL * 1000 });
    }
    return json(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    return json(res, e.code === 'no-redis' ? 503 : 500, { error: e.code === 'no-redis' ? 'Links are not set up on this website yet' : 'Something went wrong. Try again.' });
  }
};
