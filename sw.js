self.addEventListener('install', (e) => {
    console.log('App instalada correctamente');
});

self.addEventListener('fetch', (e) => {
    // Permite que la app pase los requisitos de instalación del navegador
    e.respondWith(fetch(e.request).catch(() => console.log('Modo offline')));
});