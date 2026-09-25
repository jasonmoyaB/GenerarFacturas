// Recuperación para clientes controlados por la PWA antigua, cuyo HTML aún solicita main.tsx.
async function recoverFromStalePwa() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  }
  const url = new URL('/', window.location.href);
  url.searchParams.set('pwa-reset', Date.now().toString());
  window.location.replace(url);
}

recoverFromStalePwa();
