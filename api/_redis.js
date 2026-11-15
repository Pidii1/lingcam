// Upstash Redis over its REST API. Works with the env names Vercel and Upstash create
// (KV_REST_API_URL / KV_REST_API_TOKEN, UPSTASH_REDIS_REST_URL / _TOKEN, or any prefix ending the same way).
function creds() {
  const env = process.env;
  const pick = (ends) => { for (const k of Object.keys(env)) for (const e of ends) if (k.endsWith(e) && env[k]) return env[k]; return ''; };
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || pick(['_KV_REST_API_URL', '_REDIS_REST_URL', 'REST_API_URL']);
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || pick(['_KV_REST_API_TOKEN', '_REDIS_REST_TOKEN', 'REST_API_TOKEN']);
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}
async function redis(cmd) {
  const c = creds(); if (!c) { const e = new Error('no-redis'); e.code = 'no-redis'; throw e; }
  const r = await fetch(c.url, { method: 'POST', headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || `redis ${r.status}`);
  return j.result;
}
module.exports = { redis, creds };
