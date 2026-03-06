// ===============================================
// Service Worker for PWA Offline Support
// ===============================================

const CACHE_NAME = 'travel-map-v1';
const CACHE_VERSION = '1.0.0';

// 需要缓存的静态资源
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// 需要缓存的地图瓦片 URL 模式
const MAP_TILE_PATTERNS = [
    'https://tile.openstreetmap.org/',
    'https://tiles.openstreetmap.org/',
    'https://a.tile.openstreetmap.org/',
    'https://b.tile.openstreetmap.org/',
    'https://c.tile.openstreetmap.org/'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', event => {
    console.log('[Service Worker] 安装中...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] 缓存静态资源');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('[Service Worker] 安装完成');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[Service Worker] 安装失败:', error);
            })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
    console.log('[Service Worker] 激活中...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // 删除旧版本缓存
                        if (cacheName !== CACHE_NAME) {
                            console.log('[Service Worker] 删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] 激活完成');
                return self.clients.claim();
            })
    );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // 处理地图瓦片请求
    if (isMapTileRequest(url)) {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        // 从缓存返回，同时在后台更新
                        fetchAndCacheMapTile(request);
                        return response;
                    }

                    // 不在缓存中，从网络获取并缓存
                    return fetchAndCacheMapTile(request);
                })
                .catch(() => {
                    // 网络失败，尝试返回缓存中的任何地图瓦片作为降级
                    return getFallbackMapTile(url);
                })
        );
        return;
    }

    // 处理 API 请求（包括地理编码和天气）
    if (isAPIRequest(url)) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // 只缓存成功的响应
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(request, responseClone));
                    }
                    return response;
                })
                .catch(() => {
                    // 网络失败，尝试返回缓存的数据
                    return caches.match(request);
                })
        );
        return;
    }

    // 处理其他静态资源
    event.respondWith(
        caches.match(request)
            .then(response => {
                if (response) {
                    return response;
                }

                return fetch(request)
                    .then(response => {
                        // 检查是否是有效响应
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 克隆响应
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // 如果是 HTML 页面请求失败，返回离线页面
                        if (request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// 判断是否是地图瓦片请求
function isMapTileRequest(url) {
    return MAP_TILE_PATTERNS.some(pattern => url.href.startsWith(pattern));
}

// 判断是否是 API 请求
function isAPIRequest(url) {
    return url.hostname.includes('openstreetmap.org') ||
           url.hostname.includes('openweathermap.org') ||
           url.hostname.includes('nominatim.openstreetmap.org');
}

// 获取并缓存地图瓦片
function fetchAndCacheMapTile(request) {
    return fetch(request)
        .then(response => {
            // 检查是否是有效响应
            if (!response || response.status !== 200) {
                return response;
            }

            // 克隆响应
            const responseClone = response.clone();

            // 缓存地图瓦片
            caches.open(CACHE_NAME)
                .then(cache => {
                    // 限制地图瓦片缓存数量，避免占用过多空间
                    cache.keys().then(keys => {
                        if (keys.length > 1000) {
                            // 删除最旧的 100 个瓦片
                            const oldestKeys = keys.slice(0, 100);
                            oldestKeys.forEach(key => cache.delete(key));
                        }
                    });
                    return cache.put(request, responseClone);
                });

            return response;
        })
        .catch(error => {
            console.error('[Service Worker] 获取地图瓦片失败:', error);
            throw error;
        });
}

// 获取降级地图瓦片（网络失败时）
function getFallbackMapTile(url) {
    // 尝试返回任何缓存的地图瓦片
    return caches.open(CACHE_NAME)
        .then(cache => {
            return cache.keys()
                .then(keys => {
                    const mapTileKeys = keys.filter(key =>
                        key.url.includes('tile.openstreetmap.org') ||
                        key.url.includes('tiles.openstreetmap.org')
                    );

                    if (mapTileKeys.length > 0) {
                        // 返回一个随机的缓存的地图瓦片
                        const randomTile = mapTileKeys[Math.floor(Math.random() * mapTileKeys.length)];
                        return cache.match(randomTile);
                    }

                    // 没有缓存的地图瓦片，返回空白图片
                    return createBlankTile();
                });
        });
}

// 创建空白地图瓦片
function createBlankTile() {
    const canvas = new OffscreenCanvas(256, 256);
    const context = canvas.getContext('2d');

    // 填充浅灰色背景
    context.fillStyle = '#E0E0E0';
    context.fillRect(0, 0, 256, 256);

    // 添加文字
    context.fillStyle = '#999999';
    context.font = '14px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('离线模式', 128, 128);

    // 转换为 Blob
    return canvas.convertToBlob()
        .then(blob => {
            return new Response(blob, {
                headers: {
                    'Content-Type': 'image/png',
                    'Content-Length': blob.size
                }
            });
        });
}

// 消息监听 - 处理来自主线程的消息
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        clearCache();
    }
});

// 清理缓存
function clearCache() {
    console.log('[Service Worker] 清理缓存');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        console.log('[Service Worker] 删除缓存:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            })
            .then(() => {
                console.log('[Service Worker] 缓存已清理');
            })
    );
}

// 后台同步事件
self.addEventListener('sync', event => {
    console.log('[Service Worker] 后台同步:', event.tag);

    if (event.tag === 'sync-trip') {
        // 可以在这里实现同步旅行计划的逻辑
        event.waitUntil(
            // 同步逻辑
            Promise.resolve()
        );
    }
});

// 推送通知事件
self.addEventListener('push', event => {
    console.log('[Service Worker] 收到推送消息');

    let data = {
        title: '旅行地图',
        body: '您有新的消息',
        icon: 'icon-192.png'
    };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || 'icon-192.png',
        badge: 'icon-192.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
    console.log('[Service Worker] 通知被点击');

    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});