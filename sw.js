// sw.js
// ============================================================
// SERVICE WORKER ДЛЯ PUSH-УВЕДОМЛЕНИЙ
// ============================================================

const CACHE_NAME = 'russia1000-v1';

// ============================================================
// УСТАНОВКА
// ============================================================

self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    self.skipWaiting();
});

// ============================================================
// АКТИВАЦИЯ
// ============================================================

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(clients.claim());
});

// ============================================================
// PUSH-УВЕДОМЛЕНИЯ
// ============================================================

self.addEventListener('push', (event) => {
    console.log('[SW] Push event received:', event);
    
    let data = {};
    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (e) {
        data = {
            title: event.data ? event.data.text() : 'Новое уведомление',
            body: '',
            icon: '/icons/icon-192.png'
        };
    }
    
    if (!data.title && !data.body) {
        data = {
            title: '🎯 Жизнь в делах',
            body: 'У вас новое событие!',
            icon: '/icons/icon-192.png'
        };
    }
    
    const options = {
        body: data.body || 'Проверьте новые дела!',
        icon: data.icon || '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/',
            taskId: data.taskId || null,
            type: data.type || 'info'
        },
        actions: data.actions || [
            { action: 'open', title: '📋 Открыть' },
            { action: 'dismiss', title: '✕ Закрыть' }
        ],
        tag: data.tag || 'general',
        renotify: true,
        requireInteraction: true
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ============================================================
// КЛИК ПО УВЕДОМЛЕНИЮ
// ============================================================

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click:', event);
    
    const notification = event.notification;
    const action = event.action;
    
    notification.close();
    
    if (action === 'dismiss') {
        return;
    }
    
    const url = notification.data?.url || '/';
    const taskId = notification.data?.taskId || null;
    
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                if (clientList.length > 0) {
                    const client = clientList[0];
                    client.focus();
                    client.postMessage({
                        type: 'NOTIFICATION_CLICK',
                        url: url,
                        taskId: taskId
                    });
                    return;
                }
                return self.clients.openWindow(url);
            })
    );
});

// ============================================================
// ЗАКРЫТИЕ УВЕДОМЛЕНИЯ
// ============================================================

self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event);
});

console.log('[SW] Service Worker loaded successfully');