// js/cloud/photoCache.js
// ============================================================
// ЛОКАЛЬНЫЙ КЭШ ФОТО (IndexedDB)
// Версия 1.0
// ============================================================

const DB_NAME = 'PhotoCache';
const DB_VERSION = 1;
const STORE_PHOTOS = 'photos';
const STORE_PENDING = 'pending';
const MAX_CACHE_SIZE_MB = 50;
const MAX_CACHE_AGE_DAYS = 30;

let db = null;
let isInitialized = false;

/**
 * Инициализация IndexedDB
 * @returns {Promise<void>}
 */
export async function initPhotoCache() {
    if (isInitialized && db) return;
    
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('Failed to open IndexedDB:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            isInitialized = true;
            
            // Обработка закрытия БД
            db.onclose = () => {
                isInitialized = false;
                db = null;
            };
            
            resolve();
        };
        
        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            
            // Хранилище фото
            if (!database.objectStoreNames.contains(STORE_PHOTOS)) {
                const store = database.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
                store.createIndex('taskId', 'taskId', { unique: false });
                store.createIndex('synced', 'synced', { unique: false });
                store.createIndex('cachedAt', 'cachedAt', { unique: false });
                store.createIndex('size', 'size', { unique: false });
            }
            
            // Очередь на синхронизацию
            if (!database.objectStoreNames.contains(STORE_PENDING)) {
                database.createObjectStore(STORE_PENDING, { autoIncrement: true });
            }
        };
    });
}

/**
 * Сохранение фото в кэш
 * @param {string} photoId - ID фото
 * @param {Blob} originalBlob - оригинальное фото
 * @param {Blob} thumbnailBlob - миниатюра (опционально)
 * @returns {Promise<void>}
 */
export async function savePhotoToCache(photoId, originalBlob, thumbnailBlob = null) {
    if (!db) await initPhotoCache();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_PHOTOS], 'readwrite');
        const store = transaction.objectStore(STORE_PHOTOS);
        
        const photoData = {
            id: photoId,
            original: originalBlob,
            thumbnail: thumbnailBlob,
            cachedAt: Date.now(),
            size: originalBlob.size,
            lastAccessed: Date.now()
        };
        
        const request = store.put(photoData);
        
        request.onsuccess = () => {
            // Асинхронно проверяем размер кэша
            checkCacheSize().catch(console.warn);
            resolve();
        };
        
        request.onerror = () => reject(request.error);
    });
}

/**
 * Получение фото из кэша
 * @param {string} photoId - ID фото
 * @param {boolean} preferThumb - предпочитать миниатюру
 * @returns {Promise<string|null>} URL объекта или null
 */
export async function getPhotoFromCache(photoId, preferThumb = true) {
    if (!db) await initPhotoCache();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_PHOTOS], 'readonly');
        const store = transaction.objectStore(STORE_PHOTOS);
        const request = store.get(photoId);
        
        request.onsuccess = () => {
            const data = request.result;
            if (data) {
                // Обновляем время последнего доступа
                updateLastAccessed(photoId).catch(console.warn);
                
                const blob = preferThumb && data.thumbnail ? data.thumbnail : data.original;
                if (blob) {
                    resolve(URL.createObjectURL(blob));
                    return;
                }
            }
            resolve(null);
        };
        
        request.onerror = () => reject(request.error);
    });
}

/**
 * Обновление времени последнего доступа
 * @param {string} photoId - ID фото
 */
async function updateLastAccessed(photoId) {
    const transaction = db.transaction([STORE_PHOTOS], 'readwrite');
    const store = transaction.objectStore(STORE_PHOTOS);
    const request = store.get(photoId);
    
    request.onsuccess = () => {
        const data = request.result;
        if (data) {
            data.lastAccessed = Date.now();
            store.put(data);
        }
    };
}

/**
 * Проверка и очистка кэша при превышении лимита
 */
async function checkCacheSize() {
    const totalSize = await getTotalCacheSize();
    
    if (totalSize > MAX_CACHE_SIZE_MB * 1024 * 1024) {
        await clearOldCache(MAX_CACHE_AGE_DAYS);
    }
}

/**
 * Получение общего размера кэша
 * @returns {Promise<number>}
 */
async function getTotalCacheSize() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_PHOTOS], 'readonly');
        const store = transaction.objectStore(STORE_PHOTOS);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const total = request.result.reduce((sum, item) => sum + (item.size || 0), 0);
            resolve(total);
        };
        
        request.onerror = () => reject(request.error);
    });
}

/**
 * Очистка старых фото из кэша (LRU)
 * @param {number} daysOld - возраст в днях
 * @returns {Promise<number>} количество удалённых фото
 */
export async function clearOldCache(daysOld = MAX_CACHE_AGE_DAYS) {
    if (!db) await initPhotoCache();
    
    const threshold = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_PHOTOS], 'readwrite');
        const store = transaction.objectStore(STORE_PHOTOS);
        const index = store.index('cachedAt');
        const range = IDBKeyRange.upperBound(threshold);
        const request = index.openCursor(range);
        
        let deletedCount = 0;
        
        request.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                store.delete(cursor.primaryKey);
                deletedCount++;
                cursor.continue();
            } else {
                resolve(deletedCount);
            }
        };
        
        request.onerror = () => reject(request.error);
    });
}

/**
 * Очистка всего кэша
 * @returns {Promise<void>}
 */
export async function clearAllCache() {
    if (!db) await initPhotoCache();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_PHOTOS], 'readwrite');
        const store = transaction.objectStore(STORE_POTOS);
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Добавление операции в очередь синхронизации
 * @param {Object} operation - операция для синхронизации
 * @returns {Promise<number>} ID операции
 */
export async function addToSyncQueue(operation) {
    if (!db) await initPhotoCache();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_PENDING], 'readwrite');
        const store = transaction.objectStore(STORE_PENDING);
        const request = store.add({
            ...operation,
            addedAt: Date.now(),
            retries: 0
        });
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Получение всех операций из очереди
 * @returns {Promise<Array>}
 */
export async function getPendingOperations() {
    if (!db) await initPhotoCache();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_PENDING], 'readonly');
        const store = transaction.objectStore(STORE_PENDING);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Удаление операции из очереди
 * @param {number} opId - ID операции
 * @returns {Promise<void>}
 */
export async function removeFromSyncQueue(opId) {
    if (!db) await initPhotoCache();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_PENDING], 'readwrite');
        const store = transaction.objectStore(STORE_PENDING);
        const request = store.delete(opId);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}