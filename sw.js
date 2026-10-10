// Service worker do Ekko: cache-first com fallback pra rede, pra funcionar
// offline depois de instalado. IMPORTANTE: sempre que algum arquivo em
// ASSETS mudar, suba o número do CACHE_NAME — senão os navegadores que já
// instalaram o app continuam servindo a versão antiga em cache.
const CACHE_NAME = "ekko-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
];

// Instala: baixa tudo de ASSETS pro cache dessa versão e assume controle
// imediatamente (skipWaiting), sem esperar todas as abas antigas fecharem.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Ativa: apaga caches de versões antigas (qualquer CACHE_NAME diferente do atual).
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve do cache quando existe; senão busca na rede e guarda uma
// cópia pro futuro; se a rede falhar (offline) e não tiver cache, retorna
// undefined (o cached acima, que já era vazio nesse caso).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
