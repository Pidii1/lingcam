// Lingcam storage: strips in IndexedDB (they stay on this device), settings in localStorage
const DB = 'lingcam', ST = 'strips';
let dbp;
function db() {
  if (!dbp) dbp = new Promise((ok, bad) => {
    const r = indexedDB.open(DB, 2);
    r.onupgradeneeded = (e) => {
      const d = r.result;
      if (!d.objectStoreNames.contains(ST)) { const s = d.createObjectStore(ST, { keyPath: 'id' }); s.createIndex('created', 'created'); }
      if (!d.objectStoreNames.contains('stickers')) d.createObjectStore('stickers', { keyPath: 'id' });
    };
    r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error);
  });
  return dbp;
}
async function tx(mode, fn, store = ST) {
  const d = await db();
  return new Promise((ok, bad) => { const t = d.transaction(store, mode); const s = t.objectStore(store); const res = fn(s); t.oncomplete = () => ok(res && 'result' in res ? res.result : res); t.onerror = () => bad(t.error); t.onabort = () => bad(t.error); });
}
export const Strips = {
  put: (p) => tx('readwrite', (s) => s.put(p)),
  get: (id) => tx('readonly', (s) => s.get(id)),
  del: (id) => tx('readwrite', (s) => s.delete(id)),
  async list() { const all = await tx('readonly', (s) => s.getAll()); return (all || []).sort((a, b) => b.created - a.created); },
  async count() { return tx('readonly', (s) => s.count()); },
};

// stickers the person imported from their own pictures
export const MyStickers = {
  put: (st) => tx('readwrite', (s) => s.put(st), 'stickers'),
  del: (id) => tx('readwrite', (s) => s.delete(id), 'stickers'),
  async list() { const all = await tx('readonly', (s) => s.getAll(), 'stickers'); return (all || []).sort((a, b) => b.created - a.created); },
};

const DEF = { countdown: 3, auto: true, flash: true, mirror: true, sound: true, site: '' };
export const Settings = {
  get() { try { return { ...DEF, ...JSON.parse(localStorage.getItem('lc_set') || '{}') }; } catch (e) { return { ...DEF }; } },
  set(patch) { const v = { ...this.get(), ...patch }; try { localStorage.setItem('lc_set', JSON.stringify(v)); } catch (e) {} return v; },
};
