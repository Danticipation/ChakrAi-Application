// Disabled service worker to prevent fetch errors
// This placeholder prevents registration errors

console.log('Service worker disabled to prevent fetch issues');

// Skip waiting and claim clients immediately
self.addEventListener('install', (event) => {
  console.log('SW: Service worker installing (disabled)');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW: Service worker activating (disabled)');
  event.waitUntil(self.clients.claim());
});

// No fetch event handling to prevent errors
