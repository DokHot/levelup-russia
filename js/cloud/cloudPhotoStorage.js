// js/cloud/cloudPhotoStorage.js
// ============================================================
// ОСНОВНОЙ МОДУЛЬ ОБЛАЧНОГО ХРАНЕНИЯ ФОТО
// Версия 1.0
// ============================================================

import { user, saveUserData, addCoins } from '../user.js';
import { compressPhoto, createThumbnail, getImageDimensions, base64ToBlob } from './photoCompression.js';
import { initPhotoCache, savePhotoToCache, getPhotoFromCache, addToSyncQueue, getPendingOperations, removeFromSyncQueue, clearOldCache } from './photoCache.js';
import { generateUniqueId, isOnline, formatFileSize } from '../utils.js';
import { showToast } from '../ui.js';

// ============================================================
// КОНФИГУРАЦИЯ
// ============================================================

const CLOUD_PROVIDERS = {
    GOOGLE_DRIVE: 'google',
    YANDEX_DISK: 'yandex',
    DROPBOX: 'dropbox',
    S3: 's3',
    NONE: null
};

let cloudConfig = {
    provider: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    baseFolder: '1000-opportunities',
    syncEnabled: true,
    autoSync: true,
    cacheOnDevice: true,
    lastSyncAt: null,
    s3Config: null
};

let isInitialized = false;
let syncInterval = null;

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

/**
 * Инициализация системы облачного хранения
 */
export async function initCloudPhotoStorage() {
    if (isInitialized) return;
    
    // Загружаем сохранённую конфигурацию
    const saved = localStorage.getItem('cloud_photo_config');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            cloudConfig = { ...cloudConfig, ...parsed };
        } catch (e) {
            console.warn('Failed to parse cloud config:', e);
        }
    }
    
    // Инициализируем кэш
    await initPhotoCache();
    
    // Проверяем валидность токена
    if (cloudConfig.accessToken && cloudConfig.expiresAt) {
        if (cloudConfig.expiresAt <= Date.now()) {
            await refreshAccessToken();
        }
    }
    
    // Запускаем фоновую синхронизацию
    if (cloudConfig.autoSync && cloudConfig.syncEnabled) {
        startBackgroundSync();
    }
    
    isInitialized = true;
    console.log('☁️ Cloud photo storage initialized');
}

/**
 * Сохранение конфигурации в localStorage
 */
function saveCloudConfig() {
    const toSave = { ...cloudConfig };
    // Не сохраняем чувствительные данные в открытом виде
    if (toSave.s3Config?.secretKey) {
        toSave.s3Config = { ...toSave.s3Config, secretKey: '***' };
    }
    localStorage.setItem('cloud_photo_config', JSON.stringify(toSave));
    // Восстанавливаем для работы
    if (cloudConfig.s3Config?.secretKey === '***') {
        // Это уже сохранённая копия, не трогаем оригинал
    }
}

// ============================================================
// ПОДКЛЮЧЕНИЕ ПРОВАЙДЕРОВ
// ============================================================

/**
 * Подключение к Google Drive
 */
export async function connectGoogleDrive() {
    return new Promise((resolve, reject) => {
        // Генерируем state для защиты от CSRF
        const state = generateUniqueId();
        localStorage.setItem('oauth_state', state);
        
        // URL для OAuth (нужно заменить client_id на свой)
        const clientId = 'YOUR_GOOGLE_CLIENT_ID';
        const redirectUri = encodeURIComponent(window.location.origin + '/oauth/callback.html');
        const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file');
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${redirectUri}&` +
            `response_type=code&` +
            `scope=${scope}&` +
            `state=${state}&` +
            `access_type=offline&` +
            `prompt=consent`;
        
        // Открываем окно авторизации
        const authWindow = window.open(authUrl, 'googleAuth', 'width=500,height=600');
        
        // Слушаем callback
        const messageHandler = async (event) => {
            if (event.origin !== window.location.origin) return;
            if (event.data.type === 'google_oauth_callback') {
                window.removeEventListener('message', messageHandler);
                authWindow.close();
                
                const { code, state: returnedState } = event.data;
                if (returnedState !== localStorage.getItem('oauth_state')) {
                    reject(new Error('Invalid state'));
                    return;
                }
                
                try {
                    // Обмениваем code на токены (нужен бэкенд или прокси)
                    const tokens = await exchangeGoogleCode(code);
                    cloudConfig.provider = CLOUD_PROVIDERS.GOOGLE_DRIVE;
                    cloudConfig.accessToken = tokens.access_token;
                    cloudConfig.refreshToken = tokens.refresh_token;
                    cloudConfig.expiresAt = Date.now() + tokens.expires_in * 1000;
                    saveCloudConfig();
                    
                    await ensureCloudFolder();
                    showToast('✅ Google Drive подключён!', 'success');
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Таймаут
        setTimeout(() => {
            window.removeEventListener('message', messageHandler);
            reject(new Error('Authorization timeout'));
        }, 5 * 60 * 1000);
    });
}

/**
 * Подключение к Яндекс.Диску
 */
export async function connectYandexDisk() {
    return new Promise((resolve, reject) => {
        const state = generateUniqueId();
        localStorage.setItem('oauth_state', state);
        
        const clientId = 'YOUR_YANDEX_CLIENT_ID';
        const redirectUri = encodeURIComponent(window.location.origin + '/oauth/callback.html');
        
        const authUrl = `https://oauth.yandex.ru/authorize?` +
            `response_type=code&` +
            `client_id=${clientId}&` +
            `redirect_uri=${redirectUri}&` +
            `state=${state}`;
        
        const authWindow = window.open(authUrl, 'yandexAuth', 'width=500,height=600');
        
        const messageHandler = async (event) => {
            if (event.origin !== window.location.origin) return;
            if (event.data.type === 'yandex_oauth_callback') {
                window.removeEventListener('message', messageHandler);
                authWindow.close();
                
                const { code, state: returnedState } = event.data;
                if (returnedState !== localStorage.getItem('oauth_state')) {
                    reject(new Error('Invalid state'));
                    return;
                }
                
                try {
                    const tokens = await exchangeYandexCode(code);
                    cloudConfig.provider = CLOUD_PROVIDERS.YANDEX_DISK;
                    cloudConfig.accessToken = tokens.access_token;
                    cloudConfig.refreshToken = tokens.refresh_token;
                    cloudConfig.expiresAt = Date.now() + tokens.expires_in * 1000;
                    saveCloudConfig();
                    
                    await ensureCloudFolder();
                    showToast('✅ Яндекс.Диск подключён!', 'success');
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            }
        };
        
        window.addEventListener('message', messageHandler);
    });
}

/**
 * Подключение к S3-совместимому хранилищу
 * @param {string} endpoint - URL эндпоинта
 * @param {string} accessKey - Access Key ID
 * @param {string} secretKey - Secret Access Key
 * @param {string} bucket - имя бакета
 */
export async function connectS3(endpoint, accessKey, secretKey, bucket) {
    // Проверяем подключение
    try {
        const testResult = await testS3Connection(endpoint, accessKey, secretKey, bucket);
        if (!testResult) {
            throw new Error('Connection test failed');
        }
        
        cloudConfig.provider = CLOUD_PROVIDERS.S3;
        cloudConfig.s3Config = { endpoint, accessKey, secretKey, bucket };
        cloudConfig.accessToken = null; // S3 не использует токены
        saveCloudConfig();
        
        await ensureCloudFolder();
        showToast('✅ S3 хранилище подключено!', 'success');
        return true;
    } catch (err) {
        showToast(`❌ Ошибка подключения: ${err.message}`, 'error');
        return false;
    }
}

/**
 * Отключение облачного хранилища
 */
export async function disconnectCloud() {
    cloudConfig.provider = null;
    cloudConfig.accessToken = null;
    cloudConfig.refreshToken = null;
    cloudConfig.s3Config = null;
    cloudConfig.syncEnabled = false;
    saveCloudConfig();
    
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
    
    showToast('🔌 Облачное хранилище отключено', 'info');
}

// ============================================================
// ОСНОВНЫЕ ОПЕРАЦИИ С ФОТО
// ============================================================

/**
 * Загрузка фото в облако
 * @param {File|Blob} file - файл фото
 * @param {number} taskId - ID дела
 * @returns {Promise<Object>} метаданные фото
 */
export async function uploadPhotoToCloud(file, taskId) {
    // Сжимаем фото
    const compressed = await compressPhoto(file, 500);
    const thumbnail = await createThumbnail(compressed, 200);
    const dimensions = await getImageDimensions(compressed);
    
    const photoId = generateUniqueId();
    const cloudPath = `${cloudConfig.baseFolder}/${user.account?.userId || 'anonymous'}/photos/${photoId}.jpg`;
    const thumbCloudPath = `${cloudConfig.baseFolder}/${user.account?.userId || 'anonymous'}/photos/thumb_${photoId}.jpg`;
    
    let cloudUrl = null;
    let thumbUrl = null;
    let synced = false;
    
    // Пытаемся загрузить в облако
    if (cloudConfig.provider && isOnline()) {
        try {
            [cloudUrl, thumbUrl] = await Promise.all([
                uploadToProvider(compressed, cloudPath),
                uploadToProvider(thumbnail, thumbCloudPath)
            ]);
            synced = true;
        } catch (error) {
            console.warn('Failed to upload to cloud, queuing for sync:', error);
            // Добавляем в очередь на синхронизацию
            await addToSyncQueue({
                type: 'upload',
                photoId,
                taskId,
                cloudPath,
                thumbCloudPath,
                blob: await blobToArrayBuffer(compressed),
                thumbBlob: await blobToArrayBuffer(thumbnail)
            });
        }
    } else if (cloudConfig.provider) {
        // Офлайн режим — в очередь
        await addToSyncQueue({
            type: 'upload',
            photoId,
            taskId,
            cloudPath,
            thumbCloudPath,
            blob: await blobToArrayBuffer(compressed),
            thumbBlob: await blobToArrayBuffer(thumbnail)
        });
        showToast('📤 Фото добавлено в очередь синхронизации', 'info');
    }
    
    // Сохраняем в локальный кэш
    if (cloudConfig.cacheOnDevice) {
        await savePhotoToCache(photoId, compressed, thumbnail);
    }
    
    // Создаём метаданные
    const metadata = {
        id: photoId,
        taskId: taskId,
        cloudPath: cloudPath,
        thumbPath: thumbCloudPath,
        cloudUrl: cloudUrl,
        thumbUrl: thumbUrl,
        addedAt: new Date().toISOString(),
        size: compressed.size,
        width: dimensions.width,
        height: dimensions.height,
        synced: synced
    };
    
    // Сохраняем в user
    if (!user.photos) {
        user.photos = { cloudEnabled: true, provider: cloudConfig.provider, items: [] };
    }
    user.photos.items.push(metadata);
    saveUserData();
    
    // Бонус за фото
    addCoins(5);
    
    showToast(`📸 Фото сохранено! ${synced ? 'Синхронизировано с облаком' : 'Будет синхронизировано позже'}`, 'success');
    
    return metadata;
}

/**
 * Загрузка фото из облака
 * @param {string} photoId - ID фото
 * @param {boolean} preferThumb - предпочитать миниатюру
 * @returns {Promise<string|null>} URL объекта
 */
export async function loadPhotoFromCloud(photoId, preferThumb = true) {
    // Сначала пробуем из кэша
    if (cloudConfig.cacheOnDevice) {
        const cached = await getPhotoFromCache(photoId, preferThumb);
        if (cached) return cached;
    }
    
    // Ищем метаданные
    const metadata = user.photos?.items?.find(p => p.id === photoId);
    if (!metadata) return null;
    
    // Если нет облака — возвращаем null
    if (!cloudConfig.provider) return null;
    
    // Загружаем из облака
    try {
        const url = preferThumb ? (metadata.thumbUrl || metadata.cloudUrl) : metadata.cloudUrl;
        if (!url) return null;
        
        const response = await fetch(url, {
            headers: await getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const blob = await response.blob();
        
        // Сохраняем в кэш
        if (cloudConfig.cacheOnDevice) {
            await savePhotoToCache(photoId, blob, null);
        }
        
        return URL.createObjectURL(blob);
    } catch (error) {
        console.warn('Failed to load photo from cloud:', error);
        return null;
    }
}

/**
 * Удаление фото
 * @param {string} photoId - ID фото
 */
export async function deletePhotoFromCloud(photoId) {
    const metadata = user.photos?.items?.find(p => p.id === photoId);
    if (!metadata) return;
    
    // Удаляем из облака
    if (cloudConfig.provider && metadata.synced && isOnline()) {
        try {
            await deleteFromProvider(metadata.cloudPath);
            if (metadata.thumbPath) {
                await deleteFromProvider(metadata.thumbPath);
            }
        } catch (error) {
            console.warn('Failed to delete from cloud:', error);
        }
    }
    
    // Удаляем из кэша
    if (cloudConfig.cacheOnDevice) {
        // TODO: удалить из IndexedDB
    }
    
    // Удаляем из метаданных
    user.photos.items = user.photos.items.filter(p => p.id !== photoId);
    saveUserData();
    
    showToast('🗑️ Фото удалено', 'info');
}

// ============================================================
// СИНХРОНИЗАЦИЯ
// ============================================================

/**
 * Синхронизация с облака на устройство
 */
export async function syncFromCloud() {
    if (!cloudConfig.provider || !cloudConfig.syncEnabled) {
        showToast('☁️ Облачное хранилище не подключено', 'info');
        return;
    }
    
    showToast('🔄 Синхронизация фото из облака...', 'info');
    
    try {
        // Получаем список файлов из облака
        const cloudFiles = await listProviderFiles(`${cloudConfig.baseFolder}/${user.account?.userId}/photos/`);
        
        const localPhotoIds = new Set((user.photos?.items || []).map(p => p.id));
        let downloaded = 0;
        
        for (const file of cloudFiles) {
            const photoId = file.name.replace('.jpg', '');
            if (!localPhotoIds.has(photoId)) {
                // Новое фото — скачиваем
                const blob = await downloadFromProvider(file.path);
                const thumbnail = await createThumbnail(blob, 200);
                const dimensions = await getImageDimensions(blob);
                
                await savePhotoToCache(photoId, blob, thumbnail);
                
                // Добавляем метаданные
                user.photos.items.push({
                    id: photoId,
                    taskId: null, // нужно будет определить
                    cloudPath: file.path,
                    thumbPath: file.thumbPath,
                    cloudUrl: file.url,
                    addedAt: file.modifiedTime,
                    size: blob.size,
                    width: dimensions.width,
                    height: dimensions.height,
                    synced: true
                });
                
                downloaded++;
            }
        }
        
        saveUserData();
        showToast(`✅ Синхронизировано ${downloaded} фото`, 'success');
        
        // Обновляем галерею
        if (typeof renderPhotos === 'function') {
            renderPhotos();
        }
    } catch (error) {
        console.error('Sync from cloud failed:', error);
        showToast('❌ Ошибка синхронизации', 'error');
    }
}

/**
 * Синхронизация с устройства в облако
 */
export async function syncToCloud() {
    if (!cloudConfig.provider || !cloudConfig.syncEnabled) {
        return;
    }
    
    const pendingOps = await getPendingOperations();
    if (pendingOps.length === 0) return;
    
    showToast(`📤 Синхронизация ${pendingOps.length} фото в облако...`, 'info');
    
    let synced = 0;
    
    for (const op of pendingOps) {
        if (op.type === 'upload') {
            try {
                const blob = arrayBufferToBlob(op.blob);
                const thumbBlob = op.thumbBlob ? arrayBufferToBlob(op.thumbBlob) : null;
                
                const [cloudUrl, thumbUrl] = await Promise.all([
                    uploadToProvider(blob, op.cloudPath),
                    thumbBlob ? uploadToProvider(thumbBlob, op.thumbCloudPath) : Promise.resolve(null)
                ]);
                
                // Обновляем метаданные
                const metadata = user.photos?.items?.find(p => p.id === op.photoId);
                if (metadata) {
                    metadata.cloudUrl = cloudUrl;
                    metadata.thumbUrl = thumbUrl;
                    metadata.synced = true;
                }
                
                await removeFromSyncQueue(op.id);
                synced++;
            } catch (error) {
                console.warn(`Failed to sync photo ${op.photoId}:`, error);
            }
        }
    }
    
    if (synced > 0) {
        saveUserData();
        showToast(`✅ Синхронизировано ${synced} фото`, 'success');
    }
}

/**
 * Запуск фоновой синхронизации
 */
function startBackgroundSync() {
    if (syncInterval) clearInterval(syncInterval);
    
    syncInterval = setInterval(async () => {
        if (isOnline() && cloudConfig.provider && cloudConfig.autoSync) {
            await syncToCloud();
            await syncFromCloud();
            cloudConfig.lastSyncAt = Date.now();
            saveCloudConfig();
        }
    }, 5 * 60 * 1000); // каждые 5 минут
    
    // Слушаем событие "онлайн"
    window.addEventListener('online', async () => {
        showToast('🌐 Соединение восстановлено. Синхронизация фото...', 'info');
        await syncToCloud();
        await syncFromCloud();
    });
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Загрузка файла к провайдеру
 */
async function uploadToProvider(blob, path) {
    switch (cloudConfig.provider) {
        case CLOUD_PROVIDERS.GOOGLE_DRIVE:
            return uploadToGoogleDrive(blob, path);
        case CLOUD_PROVIDERS.YANDEX_DISK:
            return uploadToYandexDisk(blob, path);
        case CLOUD_PROVIDERS.S3:
            return uploadToS3(blob, path);
        default:
            throw new Error('Unknown provider');
    }
}

/**
 * Загрузка в Google Drive
 */
async function uploadToGoogleDrive(blob, path) {
    const metadata = {
        name: path.split('/').pop(),
        parents: [await getGoogleDriveFolderId(path)]
    };
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);
    
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${cloudConfig.accessToken}`
        },
        body: form
    });
    
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return `https://drive.google.com/uc?export=view&id=${data.id}`;
}

/**
 * Загрузка в Яндекс.Диск
 */
async function uploadToYandexDisk(blob, path) {
    const uploadUrlResponse = await fetch(
        `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(path)}&overwrite=true`,
        {
            headers: { 'Authorization': `OAuth ${cloudConfig.accessToken}` }
        }
    );
    
    if (!uploadUrlResponse.ok) throw new Error('Failed to get upload URL');
    const { href } = await uploadUrlResponse.json();
    
    await fetch(href, { method: 'PUT', body: blob });
    return `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(path)}`;
}

/**
 * Загрузка в S3
 */
async function uploadToS3(blob, path) {
    const { endpoint, accessKey, secretKey, bucket } = cloudConfig.s3Config;
    const key = path;
    
    // Создаём подпись запроса (упрощённая версия)
    const date = new Date().toUTCString();
    const stringToSign = `PUT\n\n${blob.type}\n${date}\n/${bucket}/${key}`;
    const signature = btoa(stringToSign); // В реальности нужен HMAC-SHA256
    
    const response = await fetch(`${endpoint}/${bucket}/${key}`, {
        method: 'PUT',
        headers: {
            'Date': date,
            'Authorization': `AWS ${accessKey}:${signature}`,
            'Content-Type': blob.type
        },
        body: blob
    });
    
    if (!response.ok) throw new Error('S3 upload failed');
    return `${endpoint}/${bucket}/${key}`;
}

/**
 * Получение заголовков авторизации
 */
async function getAuthHeaders() {
    if (!cloudConfig.provider) return {};
    
    // Проверяем и обновляем токен при необходимости
    if (cloudConfig.expiresAt && cloudConfig.expiresAt <= Date.now() + 5 * 60 * 1000) {
        await refreshAccessToken();
    }
    
    switch (cloudConfig.provider) {
        case CLOUD_PROVIDERS.GOOGLE_DRIVE:
            return { 'Authorization': `Bearer ${cloudConfig.accessToken}` };
        case CLOUD_PROVIDERS.YANDEX_DISK:
            return { 'Authorization': `OAuth ${cloudConfig.accessToken}` };
        default:
            return {};
    }
}

/**
 * Обновление access токена
 */
async function refreshAccessToken() {
    if (!cloudConfig.refreshToken) return;
    
    try {
        // Здесь должен быть запрос к вашему бэкенду или прокси
        // Для демо — просто возвращаем
        console.log('Refreshing access token...');
    } catch (error) {
        console.error('Token refresh failed:', error);
    }
}

/**
 * Создание базовой папки в облаке
 */
async function ensureCloudFolder() {
    // Проверяем существование папки, создаём если нет
    // Реализация зависит от провайдера
}

/**
 * Преобразование Blob в ArrayBuffer
 */
function blobToArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
    });
}

/**
 * Преобразование ArrayBuffer в Blob
 */
function arrayBufferToBlob(buffer, type = 'image/jpeg') {
    return new Blob([buffer], { type });
}

/**
 * Тестирование подключения к S3
 */
async function testS3Connection(endpoint, accessKey, secretKey, bucket) {
    try {
        const response = await fetch(`${endpoint}/${bucket}?max-keys=1`, {
            headers: {
                'Authorization': `AWS ${accessKey}:${btoa('test')}`
            }
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Обмен кода Google на токены
 */
async function exchangeGoogleCode(code) {
    // В реальном приложении нужен бэкенд
    // Здесь заглушка
    return {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 3600
    };
}

/**
 * Обмен кода Яндекса на токены
 */
async function exchangeYandexCode(code) {
    // Заглушка
    return {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 3600
    };
}

/**
 * Получение списка файлов от провайдера
 */
async function listProviderFiles(folderPath) {
    // Заглушка
    return [];
}

/**
 * Скачивание от провайдера
 */
async function downloadFromProvider(filePath) {
    // Заглушка
    throw new Error('Not implemented');
}

/**
 * Удаление от провайдера
 */
async function deleteFromProvider(filePath) {
    // Заглушка
}

/**
 * Получение ID папки в Google Drive
 */
async function getGoogleDriveFolderId(path) {
    // Заглушка
    return 'root';
}

/**
 * Показ уведомления
 */
