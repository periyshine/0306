/**
 * Service Worker for Fitness Tracker PWA
 * Provides offline functionality and caching strategies
 */

// Cache version - update this to invalidate all caches
const CACHE_VERSION = 'v1.0.0';

// Cache names
const CACHE_NAMES = {
    static: `fitness-tracker-static-${CACHE_VERSION}`,
    external: `fitness-tracker-external-${CACHE_VERSION}`,
    images: `fitness-tracker-images-${CACHE_VERSION}`,
    data: `fitness-tracker-data-${CACHE_VERSION}`
};

// Assets to cache on install
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles/main.css',
    './scripts/storage.js',
    './scripts/app.js',
    './scripts/charts.js',
    './scripts/goals.js',
    './scripts/share.js',
    './scripts/pedometer.js',
    './manifest.json'
];

// External libraries to cache
const EXTERNAL_ASSETS = [
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// Image paths to cache (will be populated if icons exist)
const IMAGE_ASSETS = [
    './icons/favicon-16x16.png',
    './icons/favicon-32x32.png',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './icons/apple-touch-icon.png'
];

// API routes that use network-first strategy
const NETWORK_FIRST_ROUTES = [];

// API routes that use cache-first strategy
const CACHE_FIRST_ROUTES = STATIC_ASSETS;

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(CACHE_NAMES.static).then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })))
                    .catch(error => {
                        console.error('[Service Worker] Failed to cache static assets:', error);
                        // Continue even if some assets fail
                        return Promise.resolve();
                    });
            }),

            // Cache external libraries
            caches.open(CACHE_NAMES.external).then((cache) => {
                console.log('[Service Worker] Caching external libraries');
                return cache.addAll(EXTERNAL_ASSETS)
                    .catch(error => {
                        console.error('[Service Worker] Failed to cache external libraries:', error);
                        return Promise.resolve();
                    });
            })
        ])
        .then(() => {
            console.log('[Service Worker] Installation complete');
            // Force the waiting service worker to become active
            return self.skipWaiting();
        })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete caches that don't match current version
                    if (!Object.values(CACHE_NAMES).includes(cacheName)) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('[Service Worker] Activation complete');
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

/**
 * Fetch event - handle network requests with appropriate strategies
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests that aren't in our whitelist
    if (url.origin !== location.origin && !EXTERNAL_ASSETS.some(asset => asset.includes(url.origin))) {
        return;
    }

    // Determine strategy based on request type
    if (isStaticAsset(request.url)) {
        // Cache-first for static assets
        event.respondWith(cacheFirst(request));
    } else if (isExternalLibrary(request.url)) {
        // Cache-first for external libraries
        event.respondWith(cacheFirst(request));
    } else if (isImageAsset(request.url)) {
        // Cache-first for images
        event.respondWith(cacheFirst(request));
    } else if (NETWORK_FIRST_ROUTES.some(route => request.url.includes(route))) {
        // Network-first for specific routes
        event.respondWith(networkFirst(request));
    } else {
        // Network-first for everything else (navigation, API calls, etc.)
        event.respondWith(networkFirst(request));
    }
});

/**
 * Cache-first strategy
 * Attempts to get from cache first, falls back to network
 * @param {Request} request - The request object
 * @returns {Promise<Response>} The response
 */
async function cacheFirst(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('[Service Worker] Cache hit:', request.url);
            return cachedResponse;
        }

        // If not in cache, fetch from network
        const networkResponse = await fetch(request);

        // Cache the response for future use
        if (networkResponse.ok) {
            const cache = await getCacheForRequest(request);
            if (cache) {
                cache.put(request, networkResponse.clone());
            }
        }

        console.log('[Service Worker] Network fetch:', request.url);
        return networkResponse;
    } catch (error) {
        console.error('[Service Worker] Cache-first failed:', error);
        // Return a fallback response if available
        return getFallbackResponse(request);
    }
}

/**
 * Network-first strategy
 * Attempts to get from network first, falls back to cache
 * @param {Request} request - The request object
 * @returns {Promise<Response>} The response
 */
async function networkFirst(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);

        // Cache the response for future use
        if (networkResponse.ok) {
            const cache = await getCacheForRequest(request);
            if (cache) {
                cache.put(request, networkResponse.clone());
            }
        }

        console.log('[Service Worker] Network fetch:', request.url);
        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] Network failed, trying cache:', request.url);

        // If network fails, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Return fallback if both network and cache fail
        return getFallbackResponse(request);
    }
}

/**
 * Stale-while-revalidate strategy
 * Serves from cache immediately, then updates cache in background
 * @param {Request} request - The request object
 * @returns {Promise<Response>} The response
 */
async function staleWhileRevalidate(request) {
    const cache = await getCacheForRequest(request);
    const cachedResponse = await caches.match(request);

    // Fetch in background to update cache
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (cache && networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    });

    // Return cached response immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }

    // Otherwise wait for network
    return fetchPromise;
}

/**
 * Determine which cache to use for a request
 * @param {Request} request - The request object
 * @returns {Promise<Cache>} The cache to use
 */
async function getCacheForRequest(request) {
    if (isImageAsset(request.url)) {
        return caches.open(CACHE_NAMES.images);
    } else if (isExternalLibrary(request.url)) {
        return caches.open(CACHE_NAMES.external);
    } else {
        return caches.open(CACHE_NAMES.static);
    }
}

/**
 * Check if request is for a static asset
 * @param {string} url - The request URL
 * @returns {boolean} True if static asset
 */
function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.endsWith(asset)) ||
           url.includes('/styles/') ||
           url.includes('/scripts/');
}

/**
 * Check if request is for an external library
 * @param {string} url - The request URL
 * @returns {boolean} True if external library
 */
function isExternalLibrary(url) {
    return EXTERNAL_ASSETS.some(asset => url.includes(asset));
}

/**
 * Check if request is for an image
 * @param {string} url - The request URL
 * @returns {boolean} True if image
 */
function isImageAsset(url) {
    return IMAGE_ASSETS.some(asset => url.endsWith(asset)) ||
           url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i);
}

/**
 * Get fallback response for failed requests
 * @param {Request} request - The request object
 * @returns {Promise<Response>} Fallback response
 */
function getFallbackResponse(request) {
    // Return different fallbacks based on request type
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname.endsWith('.html')) {
        // Return offline page for navigation requests
        return caches.match('./index.html').then(cached => {
            return cached || new Response('Offline - No cached version available', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                    'Content-Type': 'text/plain'
                })
            });
        });
    }

    // For other requests, return error response
    return new Response('Offline - Resource not available', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
            'Content-Type': 'text/plain'
        })
    });
}

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
    const { data } = event;
    const { type, payload } = data;

    switch (type) {
        case 'SKIP_WAITING':
            // Force the service worker to become active
            self.skipWaiting();
            break;

        case 'CACHE_URLS':
            // Cache specific URLs
            cacheUrls(payload.urls);
            break;

        case 'CLEAR_CACHE':
            // Clear all caches
            clearAllCaches();
            break;

        case 'GET_CACHE_SIZE':
            // Get total cache size
            getCacheSize().then(size => {
                event.ports[0].postMessage({ type: 'CACHE_SIZE', payload: { size } });
            });
            break;

        default:
            console.log('[Service Worker] Unknown message type:', type);
    }
});

/**
 * Cache specific URLs
 * @param {Array<string>} urls - URLs to cache
 */
async function cacheUrls(urls) {
    try {
        const cache = await caches.open(CACHE_NAMES.static);
        await cache.addAll(urls);
        console.log('[Service Worker] Cached URLs:', urls);
    } catch (error) {
        console.error('[Service Worker] Failed to cache URLs:', error);
    }
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('[Service Worker] All caches cleared');
    } catch (error) {
        console.error('[Service Worker] Failed to clear caches:', error);
    }
}

/**
 * Get total cache size
 * @returns {Promise<number>} Total cache size in bytes
 */
async function getCacheSize() {
    let totalSize = 0;

    try {
        const cacheNames = await caches.keys();

        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();

            for (const request of keys) {
                const response = await cache.match(request);
                if (response) {
                    const blob = await response.blob();
                    totalSize += blob.size;
                }
            }
        }
    } catch (error) {
        console.error('[Service Worker] Failed to calculate cache size:', error);
    }

    return totalSize;
}

/**
 * Background sync event (for future use)
 */
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);

    if (event.tag === 'sync-workouts') {
        event.waitUntil(syncWorkouts());
    }
});

/**
 * Sync workouts to server (placeholder for future backend integration)
 */
async function syncWorkouts() {
    // This is a placeholder for future backend sync functionality
    console.log('[Service Worker] Syncing workouts...');
    // Implementation would go here when backend is available
}

/**
 * Push notification event (for future use)
 */
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received');

    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: './icons/icon-192x192.png',
        badge: './icons/favicon-32x32.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('健身追踪', options)
    );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('./')
    );
});

console.log('[Service Worker] Script loaded');
