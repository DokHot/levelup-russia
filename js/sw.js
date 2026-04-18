// sw.js
// ============================================================
// SERVICE WORKER ДЛЯ ОФЛАЙН-РЕЖИМА И ФОНОВОЙ СИНХРОНИЗАЦИИ
// Версия 1.0
// ============================================================

const CACHE_NAME = 'russia1000-v7.5';
const STATIC_CACHE_NAME = 'russia1000-static-v7.5';
const PHOTO_CACHE_NAME = 'russia1000-photos-v1';

// Файлы для кэширования
const STATIC_FILES = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/js/user.js',
  '/js/config.js',
  '/js/ui.js',
  '/js/utils.js',
  '/js/activeTasks.js',
  '/js/shop.js',
  '/js/history.js',
  '/js/achievements.js',
  '/js/calendar.js',
  '/js/randomQuest.js',
  '/js/urgent.js',
  '/js/pets.js',
  '/js/petRoom.js',
  '/js/avatars.js',
  '/js/boosters.js',
  '/js/map.js',
  '/js/photos.js',
  '/js/auth.js',
  '/js/settings.js',
  '/js/about.js',
  '/js/cloud/photoCompression.js',
  '/js/cloud/photoCache.js',
  '/js/cloud/cloudPhotoStorage.js',
  '/js/performance/virtualScroller.js',
  '/js/performance/lazyLoader.js',
  '/js/backgroundSync.js',
  '/js/social/friends.js',
  '/js/social/leaderboard.js',
  '/js/social/search.js',
  '/Дела.js'
];

// ============================================================
// УСТАНОВКА
// ============================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static files');
      return cache.addAll(STATIC_FILES);
    })
  );
  
  self.skipWaiting();
});

// ============================================================
// АКТИВАЦИЯ
// ============================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== PHOTO_CACHE_NAME &&
              !cacheName.startsWith('russia1000')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// ============================================================
// ПЕРЕХВАТ ЗАПРОСОВ
// ============================================================

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // API запросы не кэшируем
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Фото (отдельный кэш)
  if (url.pathname.includes('/photos/') || url.search.includes('photo')) {
    event.respondWith(handlePhotoRequest(event.request));
    return;
  }
  
  // Статические файлы (cache-first)
  if (STATIC_FILES.some(file => url.pathname.endsWith(file) || file === url.pathname)) {
    event.respondWith(handleStaticRequest(event.request));
    return;
  }
  
  // Остальные запросы (network-first)
  event.respondWith(handleNetworkFirstRequest(event.request));
});

/**
 * Обработка статических файлов (cache-first)
 */
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch:', request.url, error);
    return new Response('Офлайн-режим: файл не найден', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Обработка фото (photo-first, потом network)
 */
async function handlePhotoRequest(request) {
  // Пробуем кэш
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(PHOTO_CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error('[SW] Failed to fetch photo:', request.url, error);
    // Возвращаем заглушку
    return new Response('', { status: 404 });
  }
}

/**
 * Обработка остальных запросов (network-first)
 */
async function handleNetworkFirstRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Кэшируем успешные ответы
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Возвращаем офлайн-страницу для HTML запросов
    if (request.headers.get('accept').includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    return new Response('Офлайн-режим', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// ============================================================
// ФОНОВАЯ СИНХРОНИЗАЦИЯ
// ============================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'photo-sync') {
    event.waitUntil(syncPhotos());
  }
});

/**
 * Синхронизация фото в фоне
 */
async function syncPhotos() {
  console.log('[SW] Starting background photo sync');
  
  // Получаем клиентов (вкладки)
  const clients = await self.clients.matchAll();
  
  for (const client of clients) {
    client.postMessage({
      type: 'BACKGROUND_SYNC_START',
      timestamp: Date.now()
    });
  }
  
  // Здесь будет логика синхронизации
  // (вызываем API синхронизации через клиент)
  
  for (const client of clients) {
    client.postMessage({
      type: 'BACKGROUND_SYNC_COMPLETE',
      timestamp: Date.now()
    });
  }
}

// ============================================================
// ОБРАБОТКА ПУШ-УВЕДОМЛЕНИЙ
// ============================================================

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Новое достижение или событие!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '1000 возможностей России', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url || '/')
  );
});