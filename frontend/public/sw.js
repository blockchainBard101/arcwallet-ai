// Empty Service Worker to suppress Web3 and Privy optional service worker 404 console logs.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});
