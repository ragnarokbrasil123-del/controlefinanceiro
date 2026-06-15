// Instalador do Motor Offline (Service Worker)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// O navegador Brave/Chrome EXIGE que exista um interceptador de Fetch para liberar a instalação
self.addEventListener('fetch', (event) => {
  // Por enquanto, apenas deixa a internet funcionar normalmente
  return;
});
