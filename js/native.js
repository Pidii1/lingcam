// Lingcam on each platform: website, Android app (Capacitor) and Windows app (Electron)
import { Settings } from './store.js';

export const DEFAULT_SITE = 'https://lingcam.vercel.app/';
const Cap = () => window.Capacitor;
export const isAndroidApp = () => !!(Cap() && Cap().isNativePlatform && Cap().isNativePlatform());
export const isWindowsApp = () => !!window.lingcamNative;
export const isApp = () => isAndroidApp() || isWindowsApp();
const P = (n) => Cap() && Cap().Plugins && Cap().Plugins[n];

// The Lingcam website, used for share links and updates
export function site() {
  if (!isApp() && /^https?:/.test(location.protocol) && !/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return location.origin + location.pathname.replace(/[^/]*$/, '');
  let s = (Settings.get().site || '').trim() || DEFAULT_SITE;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  return s.replace(/[#?].*$/, '').replace(/index\.html$/, '').replace(/\/?$/, '/');
}
export const api = (path) => site() + path;

const b64 = (blob) => new Promise((ok, bad) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = bad; r.readAsDataURL(blob); });

async function cacheFile(blob, name) {
  const Fs = P('Filesystem');
  const data = (await b64(blob)).split(',')[1];
  const r = await Fs.writeFile({ path: name, data, directory: 'CACHE' });
  return r.uri;
}

// Share to other apps. Returns 'shared' | 'copied' | 'downloaded' | 'cancelled'
export async function shareFile(blob, name, text) {
  if (isAndroidApp() && P('Share')) {
    try { const uri = await cacheFile(blob, name); await P('Share').share({ title: 'My lingcam strip', text, files: [uri], dialogTitle: 'Share your strip' }); return 'shared'; }
    catch (e) { if (/cancel/i.test(String(e && (e.message || e)))) return 'cancelled'; throw e; }
  }
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'My lingcam strip', text }); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  if (blob.type === 'image/png' && navigator.clipboard && window.ClipboardItem) {
    try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); return 'copied'; } catch (e) {}
  }
  download(blob, name); return 'downloaded';
}

// Save to the phone's gallery, or download on a computer
export async function saveFile(blob, name) {
  if (isAndroidApp() && P('Gallery')) {
    await P('Gallery').save({ data: await b64(blob), name, mime: blob.type || 'image/png' });
    return 'gallery';
  }
  download(blob, name); return 'downloaded';
}
export function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
export async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} ta.remove(); return ok;
  }
}
export function openUrl(url) {
  if (isWindowsApp() && window.lingcamNative.openExternal) return window.lingcamNative.openExternal(url);
  if (isAndroidApp()) { location.href = url; return; }
  window.open(url, '_blank', 'noopener');
}
export function onBack(fn) {
  const App = P('App'); if (!App) return;
  App.addListener('backButton', () => { if (!fn()) App.exitApp(); });
}
export function platformName() { return isAndroidApp() ? 'android' : isWindowsApp() ? 'windows' : 'web'; }
// status bar icons: dark on the light screens, light on the camera
let barsDark = null;
export function setBars(darkScreen) {
  const SB = P('SystemBars'); if (!SB || barsDark === darkScreen) return; barsDark = darkScreen;
  try { SB.setStyle({ style: darkScreen ? 'DARK' : 'LIGHT' }); } catch (e) {}
}
