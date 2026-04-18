// js/settings.js
// ============================================================
// НАСТРОЙКИ — УПРАВЛЕНИЕ ТЕМАМИ, ЦВЕТАМИ И ОБЛАЧНЫМ ХРАНИЛИЩЕМ
// Версия 7.5
// ============================================================

import { user, saveUserData } from './user.js';
import { showToast } from './ui.js';

// ============================================================
// ГОТОВЫЕ ТЕМЫ (8 штук)
// ============================================================

export const THEMES = {
    light: {
        name: "Светлая", icon: "☀️",
        colors: { bgBody: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)", bgCard: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)", primary: "#10b981", primaryHover: "#059669" }
    },
    dark: {
        name: "Тёмная", icon: "🌙",
        colors: { bgBody: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", bgCard: "linear-gradient(135deg, #1f2937 0%, #111827 100%)", primary: "#10b981", primaryHover: "#059669" }
    },
    lavender: {
        name: "Лавандовая", icon: "🪻",
        colors: { bgBody: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", bgCard: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)", primary: "#8b5cf6", primaryHover: "#7c3aed" }
    },
    mint: {
        name: "Мятная", icon: "🍃",
        colors: { bgBody: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)", bgCard: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", primary: "#059669", primaryHover: "#047857" }
    },
    sunset: {
        name: "Закатная", icon: "🌅",
        colors: { bgBody: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", bgCard: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", primary: "#f59e0b", primaryHover: "#d97706" }
    },
    ocean: {
        name: "Океанская", icon: "🌊",
        colors: { bgBody: "linear-gradient(135deg, #cffafe 0%, #bae6fd 100%)", bgCard: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)", primary: "#0ea5e9", primaryHover: "#0284c7" }
    },
    forest: {
        name: "Лесная", icon: "🌲",
        colors: { bgBody: "linear-gradient(135deg, #1a5f2a 0%, #0d3b1a 100%)", bgCard: "linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)", primary: "#74c69d", primaryHover: "#52b788" }
    },
    cosmic: {
        name: "Космическая", icon: "🌌",
        colors: { bgBody: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)", bgCard: "linear-gradient(135deg, #1e1b4b 0%, #2e2a6e 100%)", primary: "#a78bfa", primaryHover: "#8b5cf6" }
    }
};

// ============================================================
// СОХРАНЕНИЕ НАСТРОЕК ТЕМ
// ============================================================

export function saveThemeSettings(themeId) {
    if (!user.settings) user.settings = {};
    user.settings.themeId = themeId;
    saveUserData();
    applyTheme(themeId);
    showToast(`🎨 Тема "${THEMES[themeId].name}" применена!`, 'success');
}

export function applyTheme(themeId) {
    const theme = THEMES[themeId];
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--bg-body', theme.colors.bgBody);
    root.style.setProperty('--bg-card', theme.colors.bgCard);
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-hover', theme.colors.primaryHover);
    localStorage.setItem('selectedTheme', themeId);
}

export function resetToDefault() {
    saveThemeSettings('light');
    applyTheme('light');
}

// ============================================================
// ОБЛАЧНОЕ ХРАНИЛИЩЕ (ЯНДЕКС.ДИСК)
// ============================================================

let cloudConfig = {
    connected: false,
    accessToken: null,
    expiresAt: null,
    lastSyncAt: null
};

// Загрузка конфигурации облака
function loadCloudConfig() {
    const saved = localStorage.getItem('yandex_cloud_config');
    if (saved) {
        try {
            cloudConfig = JSON.parse(saved);
        } catch(e) { console.warn(e); }
    }
}

// Сохранение конфигурации облака
function saveCloudConfig() {
    localStorage.setItem('yandex_cloud_config', JSON.stringify(cloudConfig));
}

// Подключение к Яндекс.Диску
export async function connectYandexDisk() {
    return new Promise((resolve, reject) => {
        const state = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('oauth_state', state);
        
        // OAuth URL для Яндекс.Диска
        const clientId = 'YOUR_YANDEX_CLIENT_ID'; // Замените на реальный Client ID
        const redirectUri = encodeURIComponent(window.location.origin + '/oauth/callback.html');
        
        const authUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
        
        const authWindow = window.open(authUrl, 'yandexAuth', 'width=500,height=600');
        
        const messageHandler = async (event) => {
            if (event.origin !== window.location.origin) return;
            if (event.data.type === 'yandex_auth_success') {
                window.removeEventListener('message', messageHandler);
                authWindow.close();
                
                cloudConfig.connected = true;
                cloudConfig.accessToken = event.data.token;
                cloudConfig.expiresAt = Date.now() + 3600 * 1000;
                cloudConfig.lastSyncAt = Date.now();
                saveCloudConfig();
                
                showToast('✅ Яндекс.Диск подключён!', 'success');
                renderSettings(); // Обновляем отображение
                resolve(true);
            }
        };
        
        window.addEventListener('message', messageHandler);
        
        setTimeout(() => {
            window.removeEventListener('message', messageHandler);
            reject(new Error('Authorization timeout'));
        }, 5 * 60 * 1000);
    });
}

// Отключение от Яндекс.Диска
export async function disconnectCloud() {
    cloudConfig = { connected: false, accessToken: null, expiresAt: null, lastSyncAt: null };
    saveCloudConfig();
    showToast('🔌 Облачное хранилище отключено', 'info');
    renderSettings();
}

// Принудительная синхронизация
export async function syncToCloud() {
    if (!cloudConfig.connected || !cloudConfig.accessToken) {
        showToast('❌ Облачное хранилище не подключено', 'error');
        return false;
    }
    
    showToast('🔄 Синхронизация фото...', 'info');
    
    try {
        // Синхронизация фото из активных дел
        const photosToSync = [];
        
        for (const task of user.activeTasks) {
            if (task.photos && task.photos.length) {
                for (let i = 0; i < task.photos.length; i++) {
                    const photo = task.photos[i];
                    if (typeof photo === 'string' && photo.startsWith('data:image')) {
                        photosToSync.push({ taskId: task.id, photoData: photo, index: i, type: 'active' });
                    }
                }
            }
        }
        
        for (const task of user.completedTasks) {
            if (task.photos && task.photos.length) {
                for (let i = 0; i < task.photos.length; i++) {
                    const photo = task.photos[i];
                    if (typeof photo === 'string' && photo.startsWith('data:image')) {
                        photosToSync.push({ taskId: task.id, photoData: photo, index: i, type: 'completed' });
                    }
                }
            }
        }
        
        if (photosToSync.length === 0) {
            showToast('📸 Нет фото для синхронизации', 'info');
            return true;
        }
        
        // Отправка фото в Яндекс.Диск
        let synced = 0;
        for (const photo of photosToSync) {
            try {
                // Конвертируем base64 в blob
                const blob = base64ToBlob(photo.photoData);
                
                // Загружаем на Яндекс.Диск
                const uploadUrl = await getUploadUrl(photo.taskId, photo.index);
                await fetch(uploadUrl, { method: 'PUT', body: blob });
                
                // Обновляем ссылку в задании
                const task = photo.type === 'active' 
                    ? user.activeTasks.find(t => t.id === photo.taskId)
                    : user.completedTasks.find(t => t.id === photo.taskId);
                
                if (task && task.photos[photo.index]) {
                    task.photos[photo.index] = { 
                        id: `${photo.taskId}_${photo.index}`,
                        cloud: true,
                        url: `https://cloud-api.yandex.net/v1/disk/resources/download?path=/${photo.taskId}_${photo.index}.jpg`
                    };
                }
                
                synced++;
            } catch (err) {
                console.warn('Sync failed for photo:', err);
            }
        }
        
        cloudConfig.lastSyncAt = Date.now();
        saveCloudConfig();
        saveUserData();
        
        showToast(`✅ Синхронизировано ${synced} фото`, 'success');
        renderSettings();
        
        // Обновляем галерею если открыта
        if (typeof renderPhotos === 'function') renderPhotos();
        
        return true;
    } catch (error) {
        console.error('Sync error:', error);
        showToast('❌ Ошибка синхронизации', 'error');
        return false;
    }
}

// Получение URL для загрузки на Яндекс.Диск
async function getUploadUrl(filename, index) {
    const path = `/1000-opportunities/${user.account?.userId || 'anonymous'}/${filename}_${index}.jpg`;
    
    const response = await fetch(
        `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(path)}&overwrite=true`,
        { headers: { 'Authorization': `OAuth ${cloudConfig.accessToken}` } }
    );
    
    if (!response.ok) throw new Error('Failed to get upload URL');
    const data = await response.json();
    return data.href;
}

// Конвертация base64 в Blob
function base64ToBlob(base64) {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; i++) uInt8Array[i] = raw.charCodeAt(i);
    return new Blob([uInt8Array], { type: contentType });
}

// Получение статуса облака для отображения
function getCloudStatusHtml() {
    if (!cloudConfig.connected) {
        return '<span class="text-red-500">❌ Не подключено</span><br>Нажмите "Подключить Яндекс.Диск" для синхронизации фото';
    }
    const lastSync = cloudConfig.lastSyncAt ? new Date(cloudConfig.lastSyncAt).toLocaleString() : 'никогда';
    return `<span class="text-green-500">✅ Подключено к Яндекс.Диску</span><br>📅 Последняя синхронизация: ${lastSync}`;
}

// ============================================================
// ОТРИСОВКА ВКЛАДКИ НАСТРОЕК
// ============================================================

export function renderSettings() {
    const container = document.getElementById('settingsView');
    if (!container) return;
    
    loadCloudConfig();
    const currentThemeId = user.settings?.themeId || 'light';
    
    let html = `
        <div class="max-w-2xl mx-auto space-y-6">
            <h2 class="text-xl font-bold">🎨 Настройки оформления</h2>
            
            <!-- Готовые темы -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 class="text-lg font-bold mb-4">🎨 Готовые темы</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    `;
    
    for (const [themeId, theme] of Object.entries(THEMES)) {
        const isActive = currentThemeId === themeId;
        html += `
            <button class="theme-btn p-3 rounded-xl text-center transition-all ${isActive ? 'ring-2 ring-green-500 shadow-lg' : 'hover:scale-105'}" 
                    data-theme-id="${themeId}" style="background: ${theme.colors.bgCard}; border: 1px solid ${theme.colors.primary}40;">
                <div class="text-2xl mb-1">${theme.icon}</div>
                <div class="text-sm font-medium" style="color: ${theme.colors.primary};">${theme.name}</div>
                ${isActive ? '<div class="text-xs text-green-500 mt-1">✓ Активна</div>' : ''}
            </button>
        `;
    }
    
    html += `
                </div>
            </div>
            
            <!-- Индивидуальные цвета -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 class="text-lg font-bold mb-4">🎨 Индивидуальная настройка</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Цвет фона</label>
                        <div class="flex gap-2 flex-wrap">
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgBody" data-color="linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)" style="background: linear-gradient(135deg, #e0e7ff, #c7d2fe);">Лавандовый</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgBody" data-color="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)" style="background: linear-gradient(135deg, #d1fae5, #a7f3d0);">Мятный</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgBody" data-color="linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" style="background: linear-gradient(135deg, #fef3c7, #fde68a);">Закатный</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgBody" data-color="linear-gradient(135deg, #cffafe 0%, #bae6fd 100%)" style="background: linear-gradient(135deg, #cffafe, #bae6fd);">Океанский</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Цвет карточек</label>
                        <div class="flex gap-2 flex-wrap">
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgCard" data-color="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)" style="background: linear-gradient(135deg, #ffffff, #f9fafb); border:1px solid #ddd;">Белый</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgCard" data-color="linear-gradient(135deg, #e8f4f8 0%, #d4eaf0 100%)" style="background: linear-gradient(135deg, #e8f4f8, #d4eaf0);">Нежно-голубой</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Цвет кнопок</label>
                        <div class="flex gap-2 flex-wrap">
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm text-white" data-target="primary" data-color="#10b981" data-hover="#059669" style="background: #10b981;">Зелёный</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm text-white" data-target="primary" data-color="#8b5cf6" data-hover="#7c3aed" style="background: #8b5cf6;">Фиолетовый</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm text-white" data-target="primary" data-color="#f59e0b" data-hover="#d97706" style="background: #f59e0b;">Оранжевый</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Облачное хранилище (Яндекс.Диск) -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
                    ☁️ Облачное хранилище (Яндекс.Диск)
                </h3>
                <div class="space-y-4">
                    <div class="flex flex-wrap gap-2">
                        <button id="connectYandexBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm transition">
                            💙 Подключить Яндекс.Диск
                        </button>
                        <button id="disconnectCloudBtn" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full text-sm transition">
                            🔌 Отключить
                        </button>
                    </div>
                    
                    <div class="flex gap-2">
                        <button id="syncNowBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm transition">
                            🔄 Принудительная синхронизация
                        </button>
                    </div>
                    
                    <div class="text-sm text-gray-500 space-y-1 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg" id="cloudStatus">
                        ${getCloudStatusHtml()}
                    </div>
                </div>
            </div>
            
            <!-- Сброс -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 class="text-lg font-bold mb-4">🔄 Сброс</h3>
                <button id="resetSettingsBtn" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-full transition">
                    Вернуть стандартную тему
                </button>
                <p class="text-xs text-gray-400 mt-3">Сбросит все настройки оформления к стандартной светлой теме</p>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // ============================================================
    // ОБРАБОТЧИКИ СОБЫТИЙ
    // ============================================================
    
    // Обработчики кнопок тем
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const themeId = btn.dataset.themeId;
            saveThemeSettings(themeId);
            renderSettings();
        });
    });
    
    // Обработчики индивидуальных цветов
    document.querySelectorAll('.custom-color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            const color = btn.dataset.color;
            const hover = btn.dataset.hover;
            
            const root = document.documentElement;
            root.style.setProperty(`--${target}`, color);
            if (target === 'primary' && hover) {
                root.style.setProperty('--color-primary-hover', hover);
            }
            
            if (!user.settings) user.settings = {};
            user.settings.themeId = 'custom';
            saveUserData();
            showToast('🎨 Цвета изменены!', 'success');
        });
    });
    
    // Сброс настроек
    const resetBtn = document.getElementById('resetSettingsBtn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            resetToDefault();
            renderSettings();
            showToast('🔄 Настройки сброшены к стандартным', 'success');
        };
    }
    
    // ============================================================
    // ОБРАБОТЧИКИ ОБЛАЧНОГО ХРАНИЛИЩА
    // ============================================================
    
    const connectYandexBtn = document.getElementById('connectYandexBtn');
    const disconnectCloudBtn = document.getElementById('disconnectCloudBtn');
    const syncNowBtn = document.getElementById('syncNowBtn');
    
    if (connectYandexBtn) {
        connectYandexBtn.onclick = async () => {
            try {
                await connectYandexDisk();
            } catch (error) {
                showToast('❌ Ошибка подключения: ' + error.message, 'error');
            }
        };
    }
    
    if (disconnectCloudBtn) {
        disconnectCloudBtn.onclick = async () => {
            await disconnectCloud();
        };
    }
    
    if (syncNowBtn) {
        syncNowBtn.onclick = async () => {
            await syncToCloud();
        };
    }
}