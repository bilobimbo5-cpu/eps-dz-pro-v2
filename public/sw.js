// Service Worker لـ EPS DZ PRO
// استراتيجية: Network-first للتنقل بين الصفحات (مع نسخة مخزّنة كبديل)،
// Cache-first للأصول الثابتة (JS/CSS/الصور/الأيقونات).

const CACHE_VERSION = "eps-dz-pro-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [OFFLINE_URL, "/manifest.json", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // نتجاهل طلبات غير GET (مثل POST/PATCH إلى Supabase) — تُدار محليًا عبر IndexedDB
  if (request.method !== "GET") return;

  // طلبات التنقل بين الصفحات: Network-first مع بديل من الكاش أو صفحة offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // أصول ثابتة (Next.js static, صور، أيقونات): Cache-first
  if (
    request.url.includes("/_next/static/") ||
    request.url.includes("/icons/") ||
    request.destination === "image" ||
    request.destination === "font"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // كل شيء آخر (بما فيه طلبات Supabase GET): Network-first بدون تخزين دائم
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
