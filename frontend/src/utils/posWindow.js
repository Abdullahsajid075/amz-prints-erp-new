/** Dedicated POS till — always a separate browser window, not an ERP tab. */
export function openPosCounterWindow() {
  if (typeof window === 'undefined') return null;
  const url = `${window.location.origin}/pos/counter`;
  const width = Math.max(1280, (window.screen?.availWidth || 1480) - 16);
  const height = Math.max(800, (window.screen?.availHeight || 920) - 24);
  const features = [
    'popup=yes',
    'noopener=yes',
    'noreferrer=yes',
    `width=${width}`,
    `height=${height}`,
    'left=0',
    'top=0',
  ].join(',');
  const w = window.open(url, 'amz-pos-till', features);
  if (!w) return null;
  try { w.focus(); } catch { /* ignore */ }
  return w;
}

/** Open the till window; if the browser blocks popups, load the till in this tab. */
export function openPosCounterOrFallback() {
  const w = openPosCounterWindow();
  if (w) return w;
  if (typeof window !== 'undefined') {
    window.location.assign(`${window.location.origin}/pos/counter`);
  }
  return null;
}
