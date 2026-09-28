const JSBARCODE_SRC = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';

let loading;

export function loadJsBarcode() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.JsBarcode) return Promise.resolve(window.JsBarcode);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${JSBARCODE_SRC}"]`);
    if (existing) {
      const wait = () => {
        if (window.JsBarcode) resolve(window.JsBarcode);
        else setTimeout(wait, 40);
      };
      wait();
      return;
    }
    const script = document.createElement('script');
    script.src = JSBARCODE_SRC;
    script.async = true;
    script.onload = () => {
      if (window.JsBarcode) resolve(window.JsBarcode);
      else reject(new Error('JsBarcode missing'));
    };
    script.onerror = () => {
      loading = null;
      reject(new Error('Could not load barcode engine'));
    };
    document.head.appendChild(script);
  });
  return loading;
}
