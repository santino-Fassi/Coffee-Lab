const PRE_CACHE_NOMBRE = "pre-cache-v2";
const PRE_CACHE_RECURSOS = [
    './',
    'index.html',
    'estilos/styles.css',
    'scripts/app.js',
    'manifest.json',
    'img/logo.webp',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css',
    'https://fonts.googleapis.com/css2?family=Annie+Use+Your+Telescope&family=Patrick+Hand+SC&family=Swanky+and+Moo+Moo&display=swap',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js',
    'service-worker.js'
]
const DIN_CACHE_NOMBRE = "din-cache-v1";

self.addEventListener("install", (evento) => {
    self.skipWaiting();
    console.log("ServiceWorker se está instalando...");

    evento.waitUntil(
        caches.open(PRE_CACHE_NOMBRE)
        .then(cache => {
            console.log("Caché abierta es: ", cache);
            return cache.addAll(PRE_CACHE_RECURSOS);
        })
    );
});

self.addEventListener("fetch", (evento) => {
    evento.respondWith(
    caches.match(evento.request)
    .then((respuestaCache) => {
        if (respuestaCache != undefined) {
            console.log("El recurso YA estaba en el caché");
            return respuestaCache;
        }

        console.log("El recurso NO estaba en el caché");
        return fetch(evento.request)
        .then(respuesta => {
            if (!respuesta.ok) return respuesta;

            return caches.open(DIN_CACHE_NOMBRE)
            .then(cache => {
                cache.put(evento.request, respuesta.clone());

                return respuesta;
            })
        });
    }))
});