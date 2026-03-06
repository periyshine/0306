// Service Worker for Fitness Tracker PWA
// Enables offline functionality and caching

const CACHE_NAME = 'fitness-tracker-v1';
const STATIC_CACHE_NAME = 'fitness-static-v1';

// Assets to cache on install
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './db.js',
    './share.js',
    './manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing Service Worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Precaching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Static assets cached');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating Service Worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME && cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    // Handle different request types
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests (CDNs, APIs)
    if (url.origin !== location.origin) {
        // For external resources like CDN scripts/images, use cache-first
        event.respondWith(
            caches.match(request).then((response) => {
                return response || fetch(request).then((response) => {
                    // Cache external resources
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, response.clone());
                        return response;
                    });
                });
            }).catch(() => {
                // Return a placeholder for images if offline
                if (request.destination === 'image') {
                    return new Response(
                        '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="%23ccc"/></svg>',
                        { headers: { 'Content-Type': 'image/svg+xml' } }
                    );
                }
                throw new Error('No cached response available');
            })
        );
        return;
    }

    // For same-origin requests, use network-first with cache fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clone response for caching
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(request).then((response) => {
                    if (response) {
                        console.log('[Service Worker] Serving from cache:', request.url);
                        return response;
                    }

                    // Return offline fallback for navigation
                    if (request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

// Push notification support (optional)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'New notification',
            icon: './icon-192.png',
            badge: './badge-72.png',
            vibrate: [200, 100, 200],
            data: {
                url: data.url || './'
            },
            actions: [
                {
                    action: 'open',
                    title: 'Open App'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title || '健身追踪', options)
        );
    }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url || './')
    );
});

// Background sync for offline changes
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-workouts') {
        event.waitUntil(syncWorkouts());
    }
});

// Sync workouts when back online
async function syncWorkouts() {
    // Get all stored workouts from IndexedDB that need syncing
    // This would be implemented if you had a backend API
    console.log('[Service Worker] Syncing workouts...');
    // Implementation would go here if you have a server
}

// Cache management helper
async function cleanupCache() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name =>
        name !== STATIC_CACHE_NAME && name !== CACHE_NAME
    );

    await Promise.all(
        oldCaches.map(name => caches.delete(name))
    );
}

// Message handler for manual cache management
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        console.log('[Service Worker] Clearing cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            })
        );
    }
});

// Periodic background sync (Chrome only)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'daily-check') {
        event.waitUntil(checkDailyGoals());
    }
});

// Check and update daily goals
async function checkDailyGoals() {
    // Implementation would check for daily goals and reset/reset progress
    console.log('[Service Worker] Checking daily goals...');
}
