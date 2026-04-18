// js/settings.js
// ============================================================
// НАСТРОЙКИ — УПРАВЛЕНИЕ ТЕМАМИ И ЦВЕТАМИ (версия 7.1.2)
// ============================================================

import { user, saveUserData } from './user.js';

// ============================================================
// ГОТОВЫЕ ТЕМЫ
// ============================================================

export const THEMES = {
    light: {
        name: "Светлая",
        icon: "☀️",
        colors: {
            bgBody: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
            bgCard: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
            primary: "#10b981",
            primaryHover: "#059669"
        }
    },
    dark: {
        name: "Тёмная",
        icon: "🌙",
        colors: {
            bgBody: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
            bgCard: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
            primary: "#10b981",
            primaryHover: "#059669"
        }
    },
    lavender: {
        name: "Лавандовая",
        icon: "🪻",
        colors: {
            bgBody: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
            bgCard: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
            primary: "#8b5cf6",
            primaryHover: "#7c3aed"
        }
    },
    mint: {
        name: "Мятная",
        icon: "🍃",
        colors: {
            bgBody: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
            bgCard: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
            primary: "#059669",
            primaryHover: "#047857"
        }
    },
    sunset: {
        name: "Закатная",
        icon: "🌅",
        colors: {
            bgBody: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
            bgCard: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            primary: "#f59e0b",
            primaryHover: "#d97706"
        }
    },
    ocean: {
        name: "Океанская",
        icon: "🌊",
        colors: {
            bgBody: "linear-gradient(135deg, #cffafe 0%, #bae6fd 100%)",
            bgCard: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
            primary: "#0ea5e9",
            primaryHover: "#0284c7"
        }
    },
    forest: {
        name: "Лесная",
        icon: "🌲",
        colors: {
            bgBody: "linear-gradient(135deg, #1a5f2a 0%, #0d3b1a 100%)",
            bgCard: "linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)",
            primary: "#74c69d",
            primaryHover: "#52b788"
        }
    },
    cosmic: {
        name: "Космическая",
        icon: "🌌",
        colors: {
            bgBody: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
            bgCard: "linear-gradient(135deg, #1e1b4b 0%, #2e2a6e 100%)",
            primary: "#a78bfa",
            primaryHover: "#8b5cf6"
        }
    }
};

// ============================================================
// СОХРАНЕНИЕ И ЗАГРУЗКА НАСТРОЕК
// ============================================================

export function loadThemeSettings() {
    if (!user.settings) {
        user.settings = {
            themeId: 'light',
            customColors: null
        };
        saveUserData();
    }
    
    applyTheme(user.settings.themeId);
}

export function saveThemeSettings(themeId) {
    if (!user.settings) {
        user.settings = { themeId: 'light', customColors: null };
    }
    user.settings.themeId = themeId;
    saveUserData();
    applyTheme(themeId);
}

export function applyTheme(themeId) {
    const theme = THEMES[themeId];
    if (!theme) return;
    
    const root = document.documentElement;
    
    root.style.setProperty('--bg-body', theme.colors.bgBody);
    root.style.setProperty('--bg-card', theme.colors.bgCard);
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-hover', theme.colors.primaryHover);
    
    // Сохраняем выбранную тему в localStorage для быстрого доступа
    localStorage.setItem('selectedTheme', themeId);
}

export function applyCustomColors(bgBody, bgCard, primary, primaryHover) {
    const root = document.documentElement;
    
    if (bgBody) root.style.setProperty('--bg-body', bgBody);
    if (bgCard) root.style.setProperty('--bg-card', bgCard);
    if (primary) root.style.setProperty('--color-primary', primary);
    if (primaryHover) root.style.setProperty('--color-primary-hover', primaryHover);
}

export function resetToDefault() {
    saveThemeSettings('light');
    applyTheme('light');
}

// ============================================================
// ОТРИСОВКА ВКЛАДКИ НАСТРОЕК
// ============================================================

export function renderSettings() {
    const container = document.getElementById('settingsView');
    if (!container) return;
    
    const currentThemeId = user.settings?.themeId || 'light';
    
    let html = `
        <div class="max-w-2xl mx-auto">
            <h2 class="text-xl font-bold mb-4">🎨 Настройки оформления</h2>
            
            <!-- Готовые темы -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
                <h3 class="text-lg font-bold mb-4">🎨 Готовые темы</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    `;
    
    for (const [themeId, theme] of Object.entries(THEMES)) {
        const isActive = currentThemeId === themeId;
        html += `
            <button class="theme-btn p-3 rounded-xl text-center transition-all ${isActive ? 'ring-2 ring-green-500 shadow-lg' : 'hover:scale-105'}" 
                    data-theme-id="${themeId}"
                    style="background: ${theme.colors.bgCard}; border: 1px solid ${theme.colors.primary}40;">
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
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
                <h3 class="text-lg font-bold mb-4">🎨 Индивидуальная настройка</h3>
                <p class="text-sm text-gray-500 mb-4">Выберите свои цвета для фона и карточек</p>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Цвет фона</label>
                        <div class="flex gap-2 flex-wrap">
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgBody" data-color="linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)" style="background: linear-gradient(135deg, #e0e7ff, #c7d2fe);">Лавандовый</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgBody" data-color="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)" style="background: linear-gradient(135deg, #d1fae5, #a7f3d0);">Мятный</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgBody" data-color="linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" style="background: linear-gradient(135deg, #fef3c7, #fde68a);">Закатный</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgBody" data-color="linear-gradient(135deg, #cffafe 0%, #bae6fd 100%)" style="background: linear-gradient(135deg, #cffafe, #bae6fd);">Океанский</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgBody" data-color="linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)" style="background: linear-gradient(135deg, #fce7f3, #fbcfe8);">Розовый</button>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">Цвет карточек</label>
                        <div class="flex gap-2 flex-wrap">
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgCard" data-color="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)" style="background: linear-gradient(135deg, #ffffff, #f9fafb); border:1px solid #ddd;">Белый</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgCard" data-color="linear-gradient(135deg, #e8f4f8 0%, #d4eaf0 100%)" style="background: linear-gradient(135deg, #e8f4f8, #d4eaf0);">Нежно-голубой</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgCard" data-color="linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)" style="background: linear-gradient(135deg, #ede9fe, #ddd6fe);">Лавандовый</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm" data-target="bgCard" data-color="linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" style="background: linear-gradient(135deg, #ecfdf5, #d1fae5);">Мятный</button>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-1">Цвет кнопок</label>
                        <div class="flex gap-2 flex-wrap">
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm text-white" data-target="primary" data-color="#10b981" data-hover="#059669" style="background: #10b981;">Зелёный</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm text-white" data-target="primary" data-color="#8b5cf6" data-hover="#7c3aed" style="background: #8b5cf6;">Фиолетовый</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm text-white" data-target="primary" data-color="#0ea5e9" data-hover="#0284c7" style="background: #0ea5e9;">Голубой</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm text-white" data-target="primary" data-color="#f59e0b" data-hover="#d97706" style="background: #f59e0b;">Оранжевый</button>
                            <button class="custom-color-btn px-4 py-2 rounded-full text-sm text-white" data-target="primary" data-color="#ef4444" data-hover="#dc2626" style="background: #ef4444;">Красный</button>
                        </div>
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
    
    // Обработчики кнопок тем
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const themeId = btn.dataset.themeId;
            saveThemeSettings(themeId);
            renderSettings(); // Обновляем отображение
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
            
            // Сохраняем как кастомную тему
            if (!user.settings) user.settings = {};
            user.settings.customColors = {
                bgBody: getComputedStyle(root).getPropertyValue('--bg-body'),
                bgCard: getComputedStyle(root).getPropertyValue('--bg-card'),
                primary: getComputedStyle(root).getPropertyValue('--color-primary')
            };
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
}

function showToast(msg, type) {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm z-50 ${type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}
// Добавить в renderSettings после существующих секций:

// Секция облачного хранилища
const cloudHtml = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
        <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
            ☁️ Облачное хранилище фото
        </h3>
        <div class="space-y-4">
            <div class="flex flex-wrap gap-2">
                <button id="connectGoogleBtn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm transition">
                    🔴 Google Drive
                </button>
                <button id="connectYandexBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm transition">
                    💙 Яндекс.Диск
                </button>
                <button id="connectS3Btn" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm transition">
                    🗄️ S3
                </button>
            </div>
            
            <div class="flex items-center gap-4 flex-wrap">
                <label class="flex items-center gap-2">
                    <input type="checkbox" id="autoSyncCheckbox" ${user.photos?.autoSync !== false ? 'checked' : ''}>
                    <span class="text-sm">Автосинхронизация</span>
                </label>
                <label class="flex items-center gap-2">
                    <input type="checkbox" id="cacheOnDeviceCheckbox" ${user.photos?.cacheOnDevice !== false ? 'checked' : ''}>
                    <span class="text-sm">Кэшировать на устройстве</span>
                </label>
            </div>
            
            <div class="flex gap-2">
                <button id="syncNowBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm transition">
                    🔄 Синхронизировать сейчас
                </button>
                <button id="migrateOldPhotosBtn" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-full text-sm transition">
                    📸 Перенести старые фото
                </button>
                <button id="disconnectCloudBtn" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full text-sm transition">
                    🔌 Отключить облако
                </button>
            </div>
            
            <div class="text-xs text-gray-500 space-y-1" id="cloudStatus">
                ${getCloudStatusHtml()}
            </div>
        </div>
    </div>
`;

// Вставить cloudHtml в container перед закрывающей div

// Добавить обработчики событий после container.innerHTML
function getCloudStatusHtml() {
    const hasCloud = user.photos?.cloudEnabled && user.photos?.provider;
    if (!hasCloud) {
        return '❌ Облачное хранилище не подключено';
    }
    return `✅ Подключено: ${user.photos.provider}<br>
            📅 Последняя синхронизация: ${user.photos.lastSyncAt ? new Date(user.photos.lastSyncAt).toLocaleString() : 'никогда'}<br>
            📸 Фото в облаке: ${user.photos?.items?.length || 0}`;
}

// Добавить обработчики после добавления HTML
setTimeout(() => {
    const connectGoogleBtn = document.getElementById('connectGoogleBtn');
    const connectYandexBtn = document.getElementById('connectYandexBtn');
    const connectS3Btn = document.getElementById('connectS3Btn');
    const syncNowBtn = document.getElementById('syncNowBtn');
    const migrateOldPhotosBtn = document.getElementById('migrateOldPhotosBtn');
    const disconnectCloudBtn = document.getElementById('disconnectCloudBtn');
    const autoSyncCheckbox = document.getElementById('autoSyncCheckbox');
    const cacheOnDeviceCheckbox = document.getElementById('cacheOnDeviceCheckbox');
    
    if (connectGoogleBtn) {
        connectGoogleBtn.onclick = async () => {
            const { connectGoogleDrive } = await import('./cloud/cloudPhotoStorage.js');
            await connectGoogleDrive();
            renderSettings();
        };
    }
    
    if (connectYandexBtn) {
        connectYandexBtn.onclick = async () => {
            const { connectYandexDisk } = await import('./cloud/cloudPhotoStorage.js');
            await connectYandexDisk();
            renderSettings();
        };
    }
    
    if (connectS3Btn) {
        connectS3Btn.onclick = () => {
            const endpoint = prompt('Введите S3 endpoint (например, https://s3.ru-1.storage.selcloud.ru)');
            const accessKey = prompt('Введите Access Key ID');
            const secretKey = prompt('Введите Secret Access Key');
            const bucket = prompt('Введите имя бакета');
            if (endpoint && accessKey && secretKey && bucket) {
                import('./cloud/cloudPhotoStorage.js').then(({ connectS3 }) => {
                    connectS3(endpoint, accessKey, secretKey, bucket).then(() => renderSettings());
                });
            }
        };
    }
    
    if (syncNowBtn) {
        syncNowBtn.onclick = async () => {
            const { syncToCloud, syncFromCloud } = await import('./cloud/cloudPhotoStorage.js');
            showToast('🔄 Синхронизация началась...', 'info');
            await syncToCloud();
            await syncFromCloud();
            showToast('✅ Синхронизация завершена!', 'success');
            renderSettings();
            if (typeof renderPhotos === 'function') renderPhotos();
        };
    }
    
    if (migrateOldPhotosBtn) {
        migrateOldPhotosBtn.onclick = async () => {
            const { migrateOldPhotos } = await import('./user.js');
            showToast('📸 Перенос старых фото...', 'info');
            const count = await migrateOldPhotos();
            showToast(`✅ Перенесено ${count} фото`, 'success');
            renderSettings();
            if (typeof renderPhotos === 'function') renderPhotos();
        };
    }
    
    if (disconnectCloudBtn) {
        disconnectCloudBtn.onclick = async () => {
            const { disconnectCloud } = await import('./cloud/cloudPhotoStorage.js');
            await disconnectCloud();
            renderSettings();
        };
    }
    
    if (autoSyncCheckbox) {
        autoSyncCheckbox.onchange = (e) => {
            if (user.photos) user.photos.autoSync = e.target.checked;
            saveUserData();
        };
    }
    
    if (cacheOnDeviceCheckbox) {
        cacheOnDeviceCheckbox.onchange = (e) => {
            if (user.photos) user.photos.cacheOnDevice = e.target.checked;
            saveUserData();
        };
    }
}, 100);