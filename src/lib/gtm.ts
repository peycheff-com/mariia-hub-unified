export type DataLayerEvent = Record<string, any>;

declare global {
  interface Window {
    dataLayer: DataLayerEvent[];
  }
}

export function initGTM(containerId: string) {
  if (typeof window === 'undefined') return;
  if (!containerId) return;
  try {
    const consent = localStorage.getItem('cookieConsent');
    if (consent !== 'granted') return;
  } catch {
    // no-op
  }

  // Avoid duplicate initialization
  if ((window as any).__gtmInitialized) return;
  (window as any).__gtmInitialized = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
  document.head.appendChild(script);
}

export function pushToDataLayer(event: DataLayerEvent) {
  if (typeof window === 'undefined') return;
  try {
    const consent = localStorage.getItem('cookieConsent');
    if (consent !== 'granted') return;
  } catch {
    // If consent cannot be verified, do not push.
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}


