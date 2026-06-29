/* ตารางเวรของฉัน — service worker (offline support) */
const CACHE = "shiftbloom-v20";

// ไฟล์ของแอป (app shell) — เก็บตอนติดตั้ง
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// cache-first: ถ้ามีในแคชใช้เลย ไม่มีค่อยโหลดเน็ตแล้วเก็บไว้ (เช่น ฟอนต์ Google)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === "opaque")) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    } catch (e) {
      if (req.mode === "navigate") {
        const fallback = await caches.match("./index.html");
        if (fallback) return fallback;
      }
      throw e;
    }
  })());
});
