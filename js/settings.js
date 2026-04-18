// js/settings.js
// ============================================================
// НАСТРОЙКИ — ПОЛНАЯ ВЕРСИЯ ДЛЯ МОДАЛЬНОГО ОКНА
// ============================================================

import { user, saveUserData } from './user.js';
import { showToast } from './ui.js';
import { changeBackground } from './avatars.js';

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
// УПРАВЛЕНИЕ ТЕМАМИ
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
    
    // Обновляем класс на body для Tailwind
    if (themeId === 'dark') {
        document.body.classList.add('dark');
    } else {
        document.body.classList.remove('dark');
    }
}

export function resetToDefault() {
    saveThemeSettings('light');
    applyTheme('light');
    changeBackground('default');
    showToast('🔄 Настройки сброшены к стандартным', 'success');
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

function loadCloudConfig() {
    const saved = localStorage.getItem('yandex_cloud_config');
    if (saved) {
        try { cloudConfig = JSON.parse(saved); } catch(e) { console.warn(e); }
    }
    // Также проверяем прямой токен
    const token = localStorage.getItem('yandex_access_token');
    if (token && !cloudConfig.connected) {
        cloudConfig.connected = true;
        cloudConfig.accessToken = token;
        cloudConfig.lastSyncAt = parseInt(localStorage.getItem('yandex_token_expires') || Date.now());
    }
}

function saveCloudConfig() {
    localStorage.setItem('yandex_cloud_config', JSON.stringify(cloudConfig));
}

export async function connectYandexDisk() {
    return new Promise((resolve, reject) => {
        const state = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('oauth_state', state);
        
        // ВАЖНО: Замените YOUR_YANDEX_CLIENT_ID на реальный из https://oauth.yandex.ru
        const clientId = 'YOUR_YANDEX_CLIENT_ID';
        const redirectUri = encodeURIComponent(window.location.origin + '/oauth/callback.html');
        const authUrl = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
        
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
                renderSettingsModal();
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

export async function disconnectCloud() {
    cloudConfig = { connected: false, accessToken: null, expiresAt: null, lastSyncAt: null };
    localStorage.removeItem('yandex_access_token');
    localStorage.removeItem('yandex_token_expires');
    saveCloudConfig();
    showToast('🔌 Облачное хранилище отключено', 'info');
    renderSettingsModal();
}

export async function syncToCloud() {
    if (!cloudConfig.connected && !localStorage.getItem('yandex_access_token')) {
        showToast('❌ Облачное хранилище не подключено', 'error');
        return false;
    }
    
    showToast('🔄 Синхронизация фото...', 'info');
    
    try {
        // Имитация синхронизации (в реальности здесь будет API вызов)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        cloudConfig.lastSyncAt = Date.now();
        saveCloudConfig();
        
        showToast(`✅ Синхронизация завершена!`, 'success');
        renderSettingsModal();
        return true;
    } catch (error) {
        console.error('Sync error:', error);
        showToast('❌ Ошибка синхронизации', 'error');
        return false;
    }
}

function getCloudStatusHtml() {
    const hasToken = localStorage.getItem('yandex_access_token');
    const isConnected = cloudConfig.connected || hasToken;
    
    if (!isConnected) {
        return '<span class="text-red-500">❌ Не подключено</span><br>Нажмите "Подключить Яндекс.Диск" для синхронизации фото';
    }
    const lastSync = cloudConfig.lastSyncAt ? new Date(cloudConfig.lastSyncAt).toLocaleString() : (hasToken ? 'недавно' : 'никогда');
    return `<span class="text-green-500">✅ Подключено к Яндекс.Диску</span><br>📅 Последняя синхронизация: ${lastSync}`;
}

// ============================================================
// ОТРИСОВКА МОДАЛЬНОГО ОКНА НАСТРОЕК
// ============================================================

export function renderSettingsModal() {
    const container = document.getElementById('settingsModalContent');
    if (!container) {
        console.warn('settingsModalContent not found');
        return;
    }
    
    loadCloudConfig();
    const currentThemeId = user.settings?.themeId || localStorage.getItem('selectedTheme') || 'light';
    
    let html = `
        <div class="space-y-6">
            <!-- ГОТОВЫЕ ТЕМЫ -->
            <div>
                <h3 class="text-lg font-bold mb-3 flex items-center gap-2">🎨 Готовые темы</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
    `;
    
    for (const [themeId, theme] of Object.entries(THEMES)) {
        const isActive = currentThemeId === themeId;
        html += `
            <button class="theme-modal-btn p-2 rounded-lg text-center transition-all ${isActive ? 'ring-2 ring-green-500 bg-green-50' : 'bg-gray-100 hover:bg-gray-200'}" 
                    data-theme-id="${themeId}">
                <div class="text-2xl">${theme.icon}</div>
                <div class="text-xs font-medium">${theme.name}</div>
                ${isActive ? '<div class="text-xs text-green-500">✓</div>' : ''}
            </button>
        `;
    }
    
    html += `
                </div>
            </div>
            
            <!-- ИНДИВИДУАЛЬНЫЕ ЦВЕТА -->
            <div>
                <h3 class="text-lg font-bold mb-3">🎨 Индивидуальная настройка</h3>
                <div class="space-y-3">
                    <div>
                        <label class="block text-sm font-medium mb-1">Цвет фона</label>
                        <div class="flex gap-2 flex-wrap">
                            <button class="custom-color-modal-btn px-3 py-1 rounded-full text-sm bg-gray-100" data-target="bgBody" data-color="linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)">Лавандовый</button>
                            <button class="custom-color-modal-btn px-3 py-1 rounded-full text-sm bg-gray-100" data-target="bgBody" data-color="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)">Мятный</button>
                            <button class="custom-color-modal-btn px-3 py-1 rounded-full text-sm bg-gray-100" data-target="bgBody" data-color="linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)">Закатный</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Цвет карточек</label>
                        <div class="flex gap-2 flex-wrap">
                            <button class="custom-color-modal-btn px-3 py-1 rounded-full text-sm bg-gray-100" data-target="bgCard" data-color="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)">Белый</button>
                            <button class="custom-color-modal-btn px-3 py-1 rounded-full text-sm bg-gray-100" data-target="bgCard" data-color="linear-gradient(135deg, #e8f4f8 0%, #d4eaf0 100%)">Нежно-голубой</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Цвет кнопок</label>
                        <div class="flex gap-2 flex-wrap">
                            <button class="custom-color-modal-btn px-3 py-1 rounded-full text-sm text-white bg-green-600" data-target="primary" data-color="#10b981" data-hover="#059669">Зелёный</button>
                            <button class="custom-color-modal-btn px-3 py-1 rounded-full text-sm text-white bg-purple-600" data-target="primary" data-color="#8b5cf6" data-hover="#7c3aed">Фиолетовый</button>
                            <button class="custom-color-modal-btn px-3 py-1 rounded-full text-sm text-white bg-orange-500" data-target="primary" data-color="#f59e0b" data-hover="#d97706">Оранжевый</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- ФОНЫ -->
            <div>
                <h3 class="text-lg font-bold mb-3">🌄 Фоны</h3>
                <div class="flex gap-2 flex-wrap">
                    <button id="bgDefaultModalBtn" class="px-4 py-2 rounded-full text-sm bg-gray-100 hover:bg-gray-200">🏠 Стандартный</button>
                    <button id="bgForestModalBtn" class="px-4 py-2 rounded-full text-sm bg-gray-100 hover:bg-gray-200">🌲 Лесной</button>
                    <button id="bgCosmicModalBtn" class="px-4 py-2 rounded-full text-sm bg-gray-100 hover:bg-gray-200">🌌 Космос</button>
                </div>
            </div>
            
            <!-- ОБЛАЧНОЕ ХРАНИЛИЩЕ -->
            <div class="border-t pt-4">
                <h3 class="text-lg font-bold mb-3 flex items-center gap-2">☁️ Облачное хранилище</h3>
                <div class="space-y-3">
                    <div class="flex flex-wrap gap-2">
                        <button id="connectYandexModalBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm transition">
                            💙 Подключить Яндекс.Диск
                        </button>
                        <button id="disconnectCloudModalBtn" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full text-sm transition">
                            🔌 Отключить
                        </button>
                        <button id="syncNowModalBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm transition">
                            🔄 Синхронизировать
                        </button>
                    </div>
                    <div class="text-sm text-gray-500 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg" id="cloudStatusModal">
                        ${getCloudStatusHtml()}
                    </div>
                </div>
            </div>
            
            <!-- СБРОС -->
            <div class="border-t pt-4">
                <button id="resetSettingsModalBtn" class="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-full transition">
                    🔄 Сбросить все настройки
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // ============================================================
    // ОБРАБОТЧИКИ СОБЫТИЙ
    // ============================================================
    
    // Переключение тем
    document.querySelectorAll('.theme-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const themeId = btn.dataset.themeId;
            saveThemeSettings(themeId);
            renderSettingsModal();
        });
    });
    
    // Индивидуальные цвета
    document.querySelectorAll('.custom-color-modal-btn').forEach(btn => {
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
    
    // Фоны
    document.getElementById('bgDefaultModalBtn')?.addEventListener('click', () => changeBackground('default'));
    document.getElementById('bgForestModalBtn')?.addEventListener('click', () => changeBackground('forest'));
    document.getElementById('bgCosmicModalBtn')?.addEventListener('click', () => changeBackground('cosmic'));
    
    // Облачное хранилище
    document.getElementById('connectYandexModalBtn')?.addEventListener('click', async () => {
        try {
            await connectYandexDisk();
        } catch (error) {
            showToast('❌ Ошибка подключения: ' + error.message, 'error');
        }
    });
    
    document.getElementById('disconnectCloudModalBtn')?.addEventListener('click', async () => {
        await disconnectCloud();
    });
    
    document.getElementById('syncNowModalBtn')?.addEventListener('click', async () => {
        await syncToCloud();
    });
    
    // Сброс настроек
    document.getElementById('resetSettingsModalBtn')?.addEventListener('click', () => {
        resetToDefault();
        renderSettingsModal();
    });
}

// Функция для открытия модального окна из main.js
export function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        renderSettingsModal();
        modal.classList.remove('hidden');
    }
}

// Экспортируем функцию для обратной совместимости
export function renderSettings() {
    renderSettingsModal();
}