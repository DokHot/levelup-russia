// js/backgroundSync.js
// ============================================================
// ФОНОВАЯ СИНХРОНИЗАЦИЯ ДЛЯ PWA
// Версия 1.0
// ============================================================

import { isOnline } from './utils.js';
import { showToast } from './ui.js';

/**
 * Конфигурация фоновой синхронизации
 */
const SYNC_CONFIG = {
    interval: 5 * 60 * 1000,      // 5 минут
    retryInterval: 30 * 1000,      // 30 секунд при ошибке
    maxRetries: 5,                 // максимум попыток
    syncTag: 'photo-sync'
};

let syncIntervalId = null;
let isSyncing = false;
let pendingSyncCallbacks = [];

/**
 * Инициализация фоновой синхронизации
 * @param {Object} handlers - обработчики синхронизации
 * @param {Function} handlers.onSync - основная функция синхронизации
 * @param {Function} handlers.onSuccess - коллбэк успеха
 * @param {Function} handlers.onError - коллбэк ошибки
 */
export function initBackgroundSync(handlers) {
    // Проверяем поддержку Service Worker
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        registerSyncWithServiceWorker(handlers);
    } else {
        // Fallback: polling
        startPollingSync(handlers);
    }
    
    // Слушаем событие "онлайн"
    window.addEventListener('online', () => {
        showToast('🌐 Соединение восстановлено, запускаем синхронизацию...', 'info');
        if (handlers.onSync) {
            handlers.onSync().catch(console.warn);
        }
    });
    
    // Слушаем событие "офлайн"
    window.addEventListener('offline', () => {
        showToast('📡 Нет соединения, данные будут синхронизированы позже', 'warning');
    });
}

/**
 * Регистрация Service Worker для фоновой синхронизации
 */
async function registerSyncWithServiceWorker(handlers) {
    try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Проверяем, есть ли ожидающие синхронизации
        const syncManager = registration.sync;
        if (syncManager) {
            await syncManager.register(SYNC_CONFIG.syncTag);
            console.log('Background sync registered');
        }
    } catch (error) {
        console.warn('Service Worker registration failed, using polling:', error);
        startPollingSync(handlers);
    }
}

/**
 * Polling-механизм для синхронизации (fallback)
 */
function startPollingSync(handlers) {
    if (syncIntervalId) clearInterval(syncIntervalId);
    
    syncIntervalId = setInterval(async () => {
        if (isOnline() && !isSyncing && handlers.onSync) {
            isSyncing = true;
            try {
                const result = await handlers.onSync();
                if (handlers.onSuccess) handlers.onSuccess(result);
                
                // Обрабатываем ожидающие коллбэки
                for (const callback of pendingSyncCallbacks) {
                    callback(result);
                }
                pendingSyncCallbacks = [];
            } catch (error) {
                console.error('Background sync failed:', error);
                if (handlers.onError) handlers.onError(error);
            } finally {
                isSyncing = false;
            }
        }
    }, SYNC_CONFIG.interval);
    
    console.log('Polling sync started');
}

/**
 * Остановка фоновой синхронизации
 */
export function stopBackgroundSync() {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
    }
}

/**
 * Принудительный запуск синхронизации
 * @returns {Promise<any>}
 */
export function forceSync() {
    return new Promise((resolve, reject) => {
        if (isSyncing) {
            pendingSyncCallbacks.push(resolve);
            return;
        }
        
        if (!isOnline()) {
            reject(new Error('No internet connection'));
            return;
        }
        
        isSyncing = true;
        
        // Динамический импорт, чтобы избежать циклических зависимостей
        import('./cloud/cloudPhotoStorage.js').then(({ syncToCloud, syncFromCloud }) => {
            Promise.all([syncToCloud(), syncFromCloud()])
                .then((results) => {
                    resolve(results);
                })
                .catch(reject)
                .finally(() => {
                    isSyncing = false;
                });
        }).catch(reject);
    });
}

/**
 * Получение статуса синхронизации
 * @returns {Object}
 */
export function getSyncStatus() {
    return {
        isSyncing,
        isOnline: isOnline(),
        interval: SYNC_CONFIG.interval,
        hasServiceWorker: 'serviceWorker' in navigator
    };
}

/**
 * Создание очереди операций для офлайн-режима
 */
export class SyncQueue {
    constructor(storageKey = 'sync_queue') {
        this.storageKey = storageKey;
        this.queue = this.load();
    }
    
    /**
     * Загрузка очереди из localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }
    
    /**
     * Сохранение очереди
     */
    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    }
    
    /**
     * Добавление операции в очередь
     * @param {Object} operation - операция { type, data, timestamp, retries }
     * @returns {number} ID операции
     */
    add(operation) {
        const id = Date.now();
        this.queue.push({
            id,
            ...operation,
            timestamp: Date.now(),
            retries: 0
        });
        this.save();
        return id;
    }
    
    /**
     * Удаление операции из очереди
     * @param {number} id - ID операции
     */
    remove(id) {
        this.queue = this.queue.filter(op => op.id !== id);
        this.save();
    }
    
    /**
     * Получение всех операций
     */
    getAll() {
        return [...this.queue];
    }
    
    /**
     * Получение операций по типу
     * @param {string} type - тип операции
     */
    getByType(type) {
        return this.queue.filter(op => op.type === type);
    }
    
    /**
     * Увеличение счётчика попыток
     * @param {number} id - ID операции
     */
    incrementRetry(id) {
        const op = this.queue.find(o => o.id === id);
        if (op) {
            op.retries++;
            this.save();
        }
    }
    
    /**
     * Очистка старых операций
     * @param {number} olderThanMs - старше чем (мс)
     */
    clearOld(olderThanMs = 7 * 24 * 60 * 60 * 1000) {
        const threshold = Date.now() - olderThanMs;
        this.queue = this.queue.filter(op => op.timestamp > threshold);
        this.save();
    }
    
    /**
     * Очистка всей очереди
     */
    clear() {
        this.queue = [];
        this.save();
    }
    
    /**
     * Размер очереди
     */
    get size() {
        return this.queue.length;
    }
}