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
    'service-worker.js',
    'img/iconos/144x144.webp',
    'img/iconos/192x192.webp',
    'img/iconos/512x512.webp'
]
const DIN_CACHE_NOMBRE = "din-cache-v1";

// self.addEventListener("install", (evento) => {
//     self.skipWaiting();
//     console.log("ServiceWorker se está instalando...");

//     evento.waitUntil(
//         caches.open(PRE_CACHE_NOMBRE)
//         .then(cache => {
//             console.log("Caché abierta es: ", cache);
//             return cache.addAll(PRE_CACHE_RECURSOS);
//         })
//     );
// });

// self.addEventListener("activate", (evento) => {
//     evento.waitUntil(self.clients.claim());
// });

// self.addEventListener("fetch", (evento) => {
//     evento.respondWith(
//     caches.match(evento.request)
//     .then((respuestaCache) => {
//         if (respuestaCache != undefined) {
//             console.log("El recurso YA estaba en el caché");
//             return respuestaCache;
//         }

//         console.log("El recurso NO estaba en el caché");
//         return fetch(evento.request)
//         .then(respuesta => {
//             if (!respuesta.ok) return respuesta;

//             return caches.open(DIN_CACHE_NOMBRE)
//             .then(cache => {
//                 cache.put(evento.request, respuesta.clone());

//                 return respuesta;
//             })
//         });
//     }))
// });

self.addEventListener("install", evento => {
    evento.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", evento => {
    evento.waitUntil(self.clients.claim());
});

self.addEventListener("push", evento => {
    if (!evento.data) return;

    const datos = evento.data.json();

    const opciones = {
        body: datos.cuerpo || "El tiempo de este paso terminó.",

        icon: new URL(
            "img/timer.webp",
            self.registration.scope
        ).href,

        tag: "temporizador",

        data: {
            tipo: "temporizador",
            recetaId: datos.recetaId,
            tareaId: datos.tareaId
        },

        actions: [
            {
                action: "completar",
                title: "Completar"
            }
        ]
    };

    evento.waitUntil(
        self.registration.showNotification(
            datos.titulo || "¡Tiempo terminado!",
            opciones
        )
    );
});

self.addEventListener("notificationclick", evento => {
    const datos = evento.notification.data;
    evento.notification.close();

    if (!datos || datos.tipo !== "temporizador") return;

    const mensaje = {
        tipo: "accion-temporizador",
        recetaId: datos.recetaId,
        tareaId: datos.tareaId,
        completar: evento.action === "completar"
    };

    const destino = new URL("index.html", self.registration.scope);
    const inicio = new URL("./", self.registration.scope);

    evento.waitUntil(
        self.clients.matchAll({
            type: "window",
            includeUncontrolled: true
        })
            .then(ventanas => {
                const ventana = ventanas.find(ventana => {
                    const direccion = new URL(ventana.url);

                    return direccion.origin === destino.origin &&
                        (
                            direccion.pathname === destino.pathname ||
                            direccion.pathname === inicio.pathname
                        );
                });

                if (ventana) {
                    ventana.postMessage(mensaje);
                    return ventana.focus();
                }

                destino.searchParams.set("receta", mensaje.recetaId);
                destino.searchParams.set("tarea", mensaje.tareaId);

                destino.searchParams.set(
                    "completar",
                    mensaje.completar ? "1" : "0"
                );

                return self.clients.openWindow(destino.href);
            })
            .catch(error => console.log(error))
    );
});
