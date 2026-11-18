/* Kılıfçım Takip — çevrimdışı çalışma.
   Uygulama dosyaları telefonda saklanır; internet yokken de açılır.
   Yeni sürüm yayınlanınca arka planda indirilir, bir sonraki açılışta gelir.
   Yeni sürümde aşağıdaki SURUM değerini değiştir. */
const SURUM = 'kilifcim-1.2.1';
const DOSYALAR = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SURUM).then(c => c.addAll(DOSYALAR)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== SURUM).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const anahtar = req.mode === 'navigate' ? 'index.html' : req;
  e.respondWith(
    caches.open(SURUM).then(async c => {
      const eski = await c.match(anahtar, { ignoreSearch: true });
      const yeni = fetch(req).then(r => {
        if (r && r.ok && r.type === 'basic') c.put(anahtar, r.clone());
        return r;
      }).catch(() => null);
      if (eski) { e.waitUntil(yeni); return eski; }
      return (await yeni) || new Response('Çevrimdışı', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    })
  );
});
