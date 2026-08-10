// ============================================================
// ТОЧКА ВХОДА — ГЛАВНЫЙ МОДУЛЬ ПРИЛОЖЕНИЯ (версия 3.0)
// ЖИЗНЬ В ДЕЛАХ — Твой трекер целей и свершений
// ============================================================

import { initTasks, TASKS_DB } from './tasks.js';
import { 
    loadUserData, saveUserData, initCategoryProgress, updateDailyStreak, 
    user, getCurrentLevel, getNextLevel, updateUserCard, resetUserProgress,
    initFreePet, updateLastLogin, getUsername, hasOldPhotos, migrateOldPhotos
} from './user.js';
import { loadSettings, saveSettings } from './storage.js';
import { renderMyTasks } from './myTasks.js';
import { renderPackages } from './packageManager.js';
import { renderStatistics } from './statistics.js';
import { renderAvatars, changeBackground } from './avatars.js';
import { renderBoosters, startBoosterTimers, confirmBoosterPurchase } from './boosters.js';
import { renderActiveTasks, confirmSurrender, confirmSkip, openActiveTaskDetail } from './activeTasks.js';
import { renderHistory, saveEditHistoryTask, openCompletedTaskDetail } from './history.js';
import { renderAchievements, generateSecretAchievements } from './achievements.js';
import { initCalendar } from './calendar.js';
import { initRandomQuest, replaceRandomQuest, skipUrgentForCoins } from './randomQuest.js';
import { renderPhotos } from './photos.js';
import { 
    showToast, showConfetti, updateAvatarDisplay, updateStatsProgress, 
    renderUrgentBanner, showModal, hideModal, showDailyBonusModal, 
    showQuestCompleteModal, setupModalCloseOnBackground, elements 
} from './ui.js';
import { generateUrgentTask, completeUrgentTask, skipUrgentTask } from './urgent.js';
import { escapeHtml } from './utils.js';
import { getCategoryColor } from './config.js';
import { renderPetRoom } from './petRoom.js';
import { startPetTimers, getPetBonus, checkFreePetAfterEscape } from './pets.js';
import { checkAndShowAuth } from './auth.js';
import { THEMES, saveThemeSettings, resetToDefault, renderSettingsModal } from './settings.js';
import { renderFriends } from './social/friends.js';
import { renderLeaderboard } from './social/leaderboard.js';
import { renderSearch } from './social/search.js';
import { setCurrentUser } from './social/search.js';
import { initTestData } from './testData.js';
import { renderAbout } from './about.js';
import { initCloudPhotoStorage } from './cloud/cloudPhotoStorage.js';
import { lazyLoad, preloadModule, prefetchResources } from './performance/lazyLoader.js';
import { forceSync, getSyncStatus } from './backgroundSync.js';
import { initAuth, setupAuthModals } from './authSystem.js';
import { renderUnifiedShop } from './shopUnified.js';
import { 
    initNotifications, 
    sendUrgentNotification, 
    sendTaskCompleteNotification,
    sendAchievementNotification,
    sendLevelUpNotification,
    sendLocalNotification,
    showTestNotification,
    isPushSupported,
    getNotificationPermission,
    requestNotificationPermission
} from './notifications.js';

// ============================================================
// ПЕРЕМЕННЫЕ
// ============================================================

let currentTab = null;
let currentTheme = 'light';
let isInitialized = false;

// Кэш для отслеживания уже отрисованных вкладок
const tabRendered = {
    myTasks: false,
    shop: false,
    packages: false,
    statistics: false,
    pet: false,
    settings: false
};

// Карта ленивых модулей для скрытых вкладок
const LAZY_MODULES = {
    map: () => import('./map.js'),
    photos: () => import('./photos.js'),
    friends: () => import('./social/friends.js'),
    leaderboard: () => import('./social/leaderboard.js'),
    search: () => import('./social/search.js'),
    about: () => import('./about.js'),
    achievements: () => import('./achievements.js'),
    random: () => import('./randomQuest.js'),
    calendar: () => import('./calendar.js')
};

// Предзагрузка следующих вкладок
const PREFETCH_ORDER = ['shop', 'packages', 'statistics', 'pet'];

// ============================================================
// НАВИГАЦИЯ
// ============================================================

window.switchTab = async function(tabName) {
    console.log('🔄 Переключение на вкладку:', tabName);
    
    const tabButtons = {
        myTasks: document.getElementById('tabMyTasks'),
        shop: document.getElementById('tabShop'),
        packages: document.getElementById('tabPackages'),
        statistics: document.getElementById('tabStatistics'),
        pet: document.getElementById('tabPet'),
        settings: document.getElementById('tabSettings')
    };
    
    const views = {
        myTasks: document.getElementById('myTasksView'),
        shop: document.getElementById('shopView'),
        packages: document.getElementById('packagesView'),
        statistics: document.getElementById('statisticsView'),
        pet: document.getElementById('petView'),
        settings: document.getElementById('settingsView')
    };
    
    const hiddenViews = {
        shopGrid: document.getElementById('shopGrid'),
        active: document.getElementById('activeView'),
        history: document.getElementById('historyView'),
        achievements: document.getElementById('achievementsView'),
        random: document.getElementById('randomView'),
        calendar: document.getElementById('calendarView'),
        map: document.getElementById('mapView'),
        photos: document.getElementById('photosView'),
        friends: document.getElementById('friendsView'),
        leaderboard: document.getElementById('leaderboardView'),
        search: document.getElementById('searchView'),
        about: document.getElementById('aboutView')
    };
    
    Object.values(tabButtons).forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    
    Object.values(views).forEach(view => {
        if (view) view.classList.add('hidden');
    });
    
    Object.values(hiddenViews).forEach(view => {
        if (view) view.classList.add('hidden');
    });
    
    if (views[tabName]) {
        views[tabName].classList.remove('hidden');
    }
    
    if (tabButtons[tabName]) {
        tabButtons[tabName].classList.add('active');
    }
    
    currentTab = tabName;
    prefetchNextTab(tabName);
    
    if (!tabRendered[tabName]) {
        await renderTabContent(tabName);
        tabRendered[tabName] = true;
    } else {
        refreshTabContent(tabName);
    }
};

// ============================================================
// РЕНДЕР ВКЛАДОК
// ============================================================

async function renderTabContent(tabName) {
    console.log(`📦 Загрузка вкладки: ${tabName}`);
    
    switch (tabName) {
        case 'myTasks':
            renderMyTasks();
            break;
            
        case 'shop':
            const shopView = document.getElementById('shopView');
            if (shopView) {
                shopView.innerHTML = '';
                renderUnifiedShop();
                shopView.classList.remove('hidden');
            }
            break;
            
        case 'packages':
            renderPackages();
            break;
            
        case 'statistics':
            renderStatistics();
            break;
            
        case 'pet':
            renderPetRoom();
            break;
            
        case 'settings':
            renderSettingsTab();
            break;
            
        case 'shopGrid':
            const shopGridView = document.getElementById('shopGrid');
            if (shopGridView) {
                const { renderShop } = await import('./shop.js');
                shopGridView.innerHTML = '<div class="grid grid-cols-1 md:grid-cols-3 gap-6"></div>';
                renderShop();
                shopGridView.classList.remove('hidden');
            }
            break;
            
        case 'active':
            const activeView = document.getElementById('activeView');
            if (activeView) {
                activeView.innerHTML = '<div id="activeTasksGrid"></div>';
                renderActiveTasks();
                activeView.classList.remove('hidden');
            }
            break;
            
        case 'history':
            const historyView = document.getElementById('historyView');
            if (historyView) {
                historyView.innerHTML = '<div id="historyGrid"></div>';
                renderHistory();
                historyView.classList.remove('hidden');
            }
            break;
            
        case 'achievements':
            const achView = document.getElementById('achievementsView');
            if (achView) {
                renderAchievements();
                achView.classList.remove('hidden');
            }
            break;
            
        case 'random':
            const randView = document.getElementById('randomView');
            if (randView) {
                initRandomQuest();
                randView.classList.remove('hidden');
            }
            break;
            
        case 'calendar':
            const calView = document.getElementById('calendarView');
            if (calView) {
                calView.innerHTML = `
                    <div class="max-w-md mx-auto">
                        <div class="text-center mb-4">
                            <div class="text-2xl font-bold" id="currentMonthYear"></div>
                        </div>
                        <div class="calendar-grid" id="calendarGrid"></div>
                        <div class="text-center mt-4 text-sm text-gray-500" id="superPrizeStatus"></div>
                    </div>
                `;
                setTimeout(() => initCalendar(), 50);
                calView.classList.remove('hidden');
            }
            break;
            
        case 'map':
            const mapView = document.getElementById('mapView');
            if (mapView) {
                const { renderMap } = await LAZY_MODULES.map();
                mapView.innerHTML = '<div id="globalMap" style="height: 500px;"></div>';
                setTimeout(() => renderMap(), 50);
                mapView.classList.remove('hidden');
            }
            break;
            
        case 'photos':
            const photosView = document.getElementById('photosView');
            if (photosView) {
                photosView.innerHTML = '<div id="photosGrid"></div>';
                await renderPhotos();
                photosView.classList.remove('hidden');
            }
            break;
            
        case 'friends':
            const friendsView = document.getElementById('friendsView');
            if (friendsView) {
                friendsView.innerHTML = `
                    <div class="max-w-2xl mx-auto">
                        <div class="mb-4">
                            <input type="text" id="friendSearchInput" placeholder="Поиск по ID..." class="w-full p-2 border rounded-lg">
                            <button id="searchFriendBtn" class="mt-2 bg-blue-600 text-white px-4 py-2 rounded-full">Найти друга</button>
                        </div>
                        <div class="space-y-4">
                            <div><h3 class="font-bold mb-2">👥 Друзья</h3><div id="friendsList" class="space-y-2"></div></div>
                            <div><h3 class="font-bold mb-2">📨 Входящие заявки</h3><div id="incomingRequestsList" class="space-y-2"></div></div>
                            <div><h3 class="font-bold mb-2">📤 Исходящие заявки</h3><div id="outgoingRequestsList" class="space-y-2"></div></div>
                        </div>
                    </div>
                `;
                renderFriends();
                friendsView.classList.remove('hidden');
            }
            break;
            
        case 'leaderboard':
            const lbView = document.getElementById('leaderboardView');
            if (lbView) {
                lbView.innerHTML = `
                    <div class="max-w-2xl mx-auto">
                        <div class="flex gap-2 mb-4 border-b pb-2">
                            <button class="leaderboard-tab px-4 py-2 rounded-lg bg-gray-200" data-category="level">🏆 Уровень</button>
                            <button class="leaderboard-tab px-4 py-2 rounded-lg bg-gray-200" data-category="coins">💰 Монеты</button>
                            <button class="leaderboard-tab px-4 py-2 rounded-lg bg-gray-200" data-category="tasks">📋 Дела</button>
                            <button class="leaderboard-tab px-4 py-2 rounded-lg bg-gray-200" data-category="trust">⭐ Доверие</button>
                            <button class="leaderboard-tab px-4 py-2 rounded-lg bg-gray-200" data-category="pet">🐾 Питомец</button>
                        </div>
                        <div id="leaderboardList" class="space-y-2"></div>
                    </div>
                `;
                renderLeaderboard();
                lbView.classList.remove('hidden');
            }
            break;
            
        case 'search':
            const searchView = document.getElementById('searchView');
            if (searchView) {
                renderSearch();
                searchView.classList.remove('hidden');
            }
            break;
            
        case 'about':
            const aboutView = document.getElementById('aboutView');
            if (aboutView) {
                renderAbout();
                aboutView.classList.remove('hidden');
            }
            break;
    }
}

// ============================================================
// ОБНОВЛЕНИЕ ВКЛАДОК
// ============================================================

function refreshTabContent(tabName) {
    switch (tabName) {
        case 'myTasks':
            renderMyTasks();
            break;
        case 'shop':
            renderUnifiedShop();
            break;
        case 'packages':
            renderPackages();
            break;
        case 'statistics':
            renderStatistics();
            break;
        case 'pet':
            renderPetRoom();
            break;
        case 'settings':
            renderSettingsTab();
            break;
    }
}

// ============================================================
// ОТДЕЛЬНАЯ ФУНКЦИЯ ДЛЯ НАСТРОЕК
// ============================================================

function renderSettingsTab() {
    const settingsView = document.getElementById('settingsView');
    if (!settingsView) {
        console.warn('settingsView not found');
        return;
    }
    
    settingsView.classList.remove('hidden');
    
    const currentTheme = document.body.classList.contains('dark') ? 'dark' : 'light';
    const currentBg = user.currentBackground || 'default';
    const isCloudEnabled = user.photos?.cloudEnabled || false;
    const username = getUsername();
    const level = getCurrentLevel();
    const notificationStatus = getNotificationPermission();
    const isPushSupportedBrowser = isPushSupported();
    
    settingsView.innerHTML = `
        <div class="max-w-3xl mx-auto">
            <!-- Заголовок -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-5">
                <div class="flex items-center gap-3">
                    <span class="text-3xl">⚙️</span>
                    <div>
                        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">Настройки</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Управление приложением и синхронизация</p>
                        <div class="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                            <span>👤 ${username}</span>
                            <span>•</span>
                            <span>🏆 Уровень ${level.level}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Тема -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">🎨 Оформление</h3>
                <div class="flex flex-wrap gap-3">
                    <button id="themeLightBtn" class="px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${currentTheme === 'light' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}">
                        ☀️ Светлая
                    </button>
                    <button id="themeDarkBtn" class="px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${currentTheme === 'dark' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}">
                        🌙 Тёмная
                    </button>
                </div>
            </div>
            
            <!-- Фоны -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">🖼️ Фоны</h3>
                <div class="flex flex-wrap gap-3">
                    <button id="bgDefaultBtn" class="px-4 py-2 rounded-xl text-sm transition-all ${currentBg === 'default' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}">
                        🏠 Стандартный
                    </button>
                    <button id="bgForestBtn" class="px-4 py-2 rounded-xl text-sm transition-all ${currentBg === 'forest' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}">
                        🌲 Лесной
                    </button>
                    <button id="bgCosmicBtn" class="px-4 py-2 rounded-xl text-sm transition-all ${currentBg === 'cosmic' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}">
                        🌌 Космос
                    </button>
                </div>
            </div>
            
            <!-- Уведомления -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">🔔 Уведомления</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-300">Статус</span>
                        <span class="text-sm ${notificationStatus === 'granted' ? 'text-green-600' : notificationStatus === 'denied' ? 'text-red-600' : 'text-yellow-600'}">
                            ${notificationStatus === 'granted' ? '✅ Разрешены' : notificationStatus === 'denied' ? '❌ Запрещены' : '⬜ Не настроены'}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-300">Поддержка браузера</span>
                        <span class="text-sm ${isPushSupportedBrowser ? 'text-green-600' : 'text-red-600'}">
                            ${isPushSupportedBrowser ? '✅ Поддерживается' : '❌ Не поддерживается'}
                        </span>
                    </div>
                    ${isPushSupportedBrowser ? `
                        <button id="enableNotificationsBtn" class="w-full px-4 py-2.5 ${notificationStatus === 'granted' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white rounded-xl text-sm transition">
                            ${notificationStatus === 'granted' ? '✅ Уведомления включены' : '🔔 Включить уведомления'}
                        </button>
                    ` : `
                        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ Ваш браузер не поддерживает push-уведомления. Используйте Chrome, Firefox или Edge.
                        </div>
                    `}
                    ${notificationStatus === 'granted' ? `
                        <button id="testNotificationBtn" class="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition">
                            📨 Отправить тестовое уведомление
                        </button>
                    ` : ''}
                    <div class="text-xs text-gray-400 mt-2">
                        💡 Уведомления приходят о срочных делах, достижениях, повышении уровня и напоминаниях.
                    </div>
                </div>
            </div>
            
            <!-- Синхронизация -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">☁️ Синхронизация</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-600 dark:text-gray-300">Статус</span>
                        <span class="text-sm ${isCloudEnabled ? 'text-green-600' : 'text-gray-400'}">
                            ${isCloudEnabled ? '✅ Подключено' : '⬜ Не подключено'}
                        </span>
                    </div>
                    <button id="syncNowBtn" class="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition">
                        🔄 Синхронизировать сейчас
                    </button>
                    <button id="connectCloudBtn" class="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm transition">
                        ☁️ Подключить облако
                    </button>
                </div>
            </div>
            
            <!-- Данные -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">💾 Данные</h3>
                <div class="flex flex-wrap gap-3">
                    <button id="exportBtnSettings" class="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm transition">
                        📦 Экспорт
                    </button>
                    <button id="importBtnSettings" class="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition">
                        📥 Импорт
                    </button>
                    <button id="resetBtnSettings" class="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm transition mt-2">
                        ⚠️ Сбросить прогресс
                    </button>
                </div>
            </div>
            
            <!-- О проекте -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-2">📋 О проекте</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Жизнь в делах · Версия 3.0</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Твой трекер целей и свершений</p>
                <button id="aboutBtnSettings" class="mt-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 transition">
                    📜 Подробнее
                </button>
            </div>
        </div>
    `;
    
    // Обработчики
    document.getElementById('themeLightBtn')?.addEventListener('click', () => {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
        saveSettings({ theme: 'light' });
        renderSettingsTab();
        showToast('☀️ Светлая тема', 'success');
    });
    
    document.getElementById('themeDarkBtn')?.addEventListener('click', () => {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
        saveSettings({ theme: 'dark' });
        renderSettingsTab();
        showToast('🌙 Тёмная тема', 'success');
    });
    
    document.getElementById('bgDefaultBtn')?.addEventListener('click', () => {
        changeBackground('default');
        renderSettingsTab();
    });
    
    document.getElementById('bgForestBtn')?.addEventListener('click', () => {
        changeBackground('forest');
        renderSettingsTab();
    });
    
    document.getElementById('bgCosmicBtn')?.addEventListener('click', () => {
        changeBackground('cosmic');
        renderSettingsTab();
    });
    
    document.getElementById('enableNotificationsBtn')?.addEventListener('click', async () => {
        if (notificationStatus === 'granted') {
            showToast('✅ Уведомления уже разрешены', 'info');
            return;
        }
        
        if (!isPushSupportedBrowser) {
            showToast('❌ Ваш браузер не поддерживает push-уведомления', 'error');
            return;
        }
        
        const result = await requestNotificationPermission();
        if (result) {
            renderSettingsTab();
            showToast('✅ Уведомления включены!', 'success');
            setTimeout(async () => {
                await showTestNotification();
            }, 1000);
        }
    });
    
    document.getElementById('testNotificationBtn')?.addEventListener('click', async () => {
        if (notificationStatus !== 'granted') {
            showToast('❌ Сначала разрешите уведомления', 'error');
            return;
        }
        
        await showTestNotification();
        showToast('📨 Тестовое уведомление отправлено!', 'success');
    });
    
    document.getElementById('syncNowBtn')?.addEventListener('click', async () => {
        showToast('🔄 Синхронизация...', 'info');
        try {
            const { saveUserToCloud } = await import('./supabase-client.js');
            await saveUserToCloud(user);
            showToast('✅ Синхронизация завершена!', 'success');
        } catch (e) {
            showToast('❌ Ошибка синхронизации', 'error');
        }
    });
    
    document.getElementById('connectCloudBtn')?.addEventListener('click', () => {
        showToast('☁️ Функция в разработке', 'info');
    });
    
    document.getElementById('exportBtnSettings')?.addEventListener('click', exportData);
    document.getElementById('importBtnSettings')?.addEventListener('click', importProgress);
    document.getElementById('resetBtnSettings')?.addEventListener('click', resetProgress);
    
    document.getElementById('aboutBtnSettings')?.addEventListener('click', () => {
        window.switchTab('about');
    });
}

// ============================================================
// ПРЕДЗАГРУЗКА
// ============================================================

function prefetchNextTab(currentTab) {
    const nextIndex = PREFETCH_ORDER.indexOf(currentTab) + 1;
    if (nextIndex < PREFETCH_ORDER.length) {
        const nextTab = PREFETCH_ORDER[nextIndex];
        if (!tabRendered[nextTab]) {
            setTimeout(() => {
                console.log(`🔮 Предзагрузка: ${nextTab}`);
            }, 1000);
        }
    }
}

// ============================================================
// НАСТРОЙКА НАВИГАЦИИ
// ============================================================

function setupTabNavigation() {
    const tabButtons = {
        myTasks: document.getElementById('tabMyTasks'),
        shop: document.getElementById('tabShop'),
        packages: document.getElementById('tabPackages'),
        statistics: document.getElementById('tabStatistics'),
        pet: document.getElementById('tabPet'),
        settings: document.getElementById('tabSettings')
    };
    
    for (const [key, btn] of Object.entries(tabButtons)) {
        if (btn) {
            btn.onclick = () => {
                window.switchTab(key);
            };
        }
    }
}

// ============================================================
// ТЕМА И ФОНЫ
// ============================================================

function applyTheme() {
    document.body.classList.toggle('dark', currentTheme === 'dark');
    document.body.classList.toggle('light', currentTheme !== 'dark');
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    
    const bg = user.currentBackground;
    document.body.classList.remove('bg-forest', 'bg-cosmic');
    if (bg === 'forest') document.body.classList.add('bg-forest');
    if (bg === 'cosmic') document.body.classList.add('bg-cosmic');
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveSettings({ theme: currentTheme });
}

// ============================================================
// ОБНОВЛЕНИЕ СТАТИСТИКИ
// ============================================================

function updateStats() {
    const total = TASKS_DB.length;
    const completed = user.stats.tasksCompleted;
    updateStatsProgress(completed, total);
}

// ============================================================
// СБРОС ПРОГРЕССА
// ============================================================

function resetProgress() {
    if (confirm('⚠️ Сбросить весь прогресс? Это нельзя отменить!')) {
        resetUserProgress();
        updateStats();
        updateUserCard();
        showToast('Прогресс сброшен', 'info');
        setTimeout(() => location.reload(), 500);
    }
}

// ============================================================
// ЭКСПОРТ/ИМПОРТ
// ============================================================

function exportData() {
    const data = {
        tasks: TASKS_DB,
        user: user,
        settings: { theme: currentTheme },
        packages: localStorage.getItem('life_in_deeds_packages'),
        exportDate: new Date().toISOString(),
        version: '3.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `life_in_deeds_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('📦 Данные экспортированы', 'success');
}

function importProgress() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.user) {
                    const currentUserId = user.account?.userId;
                    const currentUsername = user.account?.username;
                    Object.assign(user, data.user);
                    if (!user.account) user.account = {};
                    user.account.userId = currentUserId;
                    user.account.username = currentUsername;
                    if (!user.photos || !user.photos.items) {
                        user.photos = { cloudEnabled: false, provider: null, syncEnabled: true, autoSync: true, cacheOnDevice: true, lastSyncAt: null, items: [] };
                    }
                    if (data.packages) {
                        localStorage.setItem('life_in_deeds_packages', data.packages);
                    }
                    saveUserData();
                    showToast('✅ Прогресс восстановлен! Перезагрузите страницу', 'success');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showToast('❌ Неверный формат файла', 'error');
                }
            } catch (err) {
                showToast('❌ Ошибка при импорте', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ============================================================
// НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ
// ============================================================

function setupEventListeners() {
    const themeToggle = document.getElementById('themeToggle');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const randomBtn = document.getElementById('randomBtn');
    
    if (themeToggle) themeToggle.onclick = toggleTheme;
    if (resetBtn) resetBtn.onclick = resetProgress;
    if (exportBtn) exportBtn.onclick = exportData;
    if (randomBtn) {
        randomBtn.onclick = () => {
            const available = TASKS_DB.filter(t => !user.purchasedTasks.includes(t.id));
            if (available.length === 0) {
                showToast('Нет доступных дел!', 'error');
                return;
            }
            const random = available[Math.floor(Math.random() * available.length)];
            const categoryColor = getCategoryColor(random.category);
            const header = document.getElementById('detailHeader');
            if (header) header.style.background = `linear-gradient(135deg, ${categoryColor}, ${categoryColor}cc)`;
            document.getElementById('detailCategoryBadge').innerHTML = random.category;
            document.getElementById('detailTitle').innerHTML = escapeHtml(random.text);
            document.getElementById('detailContent').innerHTML = `
                <div class="space-y-4">
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <div class="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">⭐ Сложность</div>
                        <div class="text-2xl font-bold difficulty-${random.difficulty}">${"★".repeat(random.difficulty)}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <div class="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">💰 Цена и награда</div>
                        <div class="flex justify-between flex-wrap gap-2 text-gray-800 dark:text-gray-200">
                            <span>💰 Цена: <strong>${random.price}</strong> монет</span>
                            <span>🎁 Награда: <strong class="text-green-600">${random.baseReward}</strong> монет</span>
                            <span>⭐ Опыт: <strong>+${random.baseXP}</strong> XP</span>
                        </div>
                    </div>
                    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button id="detailCloseBtn" class="px-5 py-2.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-xl text-gray-800 dark:text-gray-200 transition">Закрыть</button>
                        <button id="detailPurchaseBtn" class="px-5 py-2.5 text-white rounded-xl transition hover:scale-105" style="background: ${categoryColor};">💰 Купить</button>
                    </div>
                </div>
            `;
            showModal('detailModal');
            document.getElementById('detailCloseBtn').onclick = () => hideModal('detailModal');
            document.getElementById('detailPurchaseBtn').onclick = () => {
                hideModal('detailModal');
                import('./myTasks.js').then(m => m.purchaseTask(random));
            };
        };
    }
    
    const headerProfileBtn = document.getElementById('headerProfileBtn');
    if (headerProfileBtn) {
        headerProfileBtn.onclick = async () => {
            const { openProfileModal } = await import('./profile.js');
            openProfileModal();
        };
    }
    
    const headerSettingsBtn = document.getElementById('headerSettingsBtn');
    if (headerSettingsBtn) {
        headerSettingsBtn.onclick = () => {
            window.switchTab('settings');
        };
    }
    
    setupModalCloseOnBackground();
    
    const confirmDeadlineBtn = document.getElementById('confirmDeadlineBtn');
    const cancelDeadlineBtn = document.getElementById('cancelDeadlineBtn');
    const confirmSurrenderBtn = document.getElementById('confirmSurrenderBtn');
    const cancelSurrenderBtn = document.getElementById('cancelSurrenderBtn');
    const completeUrgentBtn = document.getElementById('completeUrgentBtn');
    const skipUrgentBtn = document.getElementById('skipUrgentBtn');
    const closeDailyBonusBtn = document.getElementById('closeDailyBonusBtn');
    const closeQuestModalBtn = document.getElementById('closeQuestModalBtn');
    const cancelReplaceBtn = document.getElementById('cancelReplaceBtn');
    const confirmReplaceBtn = document.getElementById('confirmReplaceBtn');
    const cancelBoosterBtn = document.getElementById('cancelBoosterBtn');
    const confirmBoosterBtn = document.getElementById('confirmBoosterBtn');
    const cancelSkipBtn = document.getElementById('cancelSkipBtn');
    const confirmSkipBtn = document.getElementById('confirmSkipBtn');
    const cancelPhotoBtn = document.getElementById('cancelPhotoBtn');
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const closeMarkerBtn = document.getElementById('closeMarkerBtn');
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    
    if (confirmDeadlineBtn) confirmDeadlineBtn.onclick = () => import('./myTasks.js').then(m => m.confirmPurchase());
    if (cancelDeadlineBtn) cancelDeadlineBtn.onclick = () => hideModal('deadlineModal');
    if (confirmSurrenderBtn) confirmSurrenderBtn.onclick = confirmSurrender;
    if (cancelSurrenderBtn) cancelSurrenderBtn.onclick = () => hideModal('surrenderModal');
    if (completeUrgentBtn) completeUrgentBtn.onclick = completeUrgentTask;
    if (skipUrgentBtn) skipUrgentBtn.onclick = skipUrgentTask;
    if (closeDailyBonusBtn) closeDailyBonusBtn.onclick = () => hideModal('dailyBonusModal');
    if (closeQuestModalBtn) closeQuestModalBtn.onclick = () => hideModal('questCompleteModal');
    if (cancelReplaceBtn) cancelReplaceBtn.onclick = () => hideModal('replaceQuestModal');
    if (confirmReplaceBtn) confirmReplaceBtn.onclick = replaceRandomQuest;
    if (cancelBoosterBtn) cancelBoosterBtn.onclick = () => hideModal('buyBoosterModal');
    if (confirmBoosterBtn) confirmBoosterBtn.onclick = confirmBoosterPurchase;
    if (cancelSkipBtn) cancelSkipBtn.onclick = () => hideModal('skipTaskModal');
    if (confirmSkipBtn) confirmSkipBtn.onclick = confirmSkip;
    if (cancelPhotoBtn) cancelPhotoBtn.onclick = () => hideModal('photoUploadModal');
    if (uploadPhotoBtn) uploadPhotoBtn.onclick = () => import('./activeTasks.js').then(m => m.uploadPhotoForTask());
    if (cancelEditBtn) cancelEditBtn.onclick = () => hideModal('editHistoryModal');
    if (saveEditBtn) saveEditBtn.onclick = saveEditHistoryTask;
    if (closeMarkerBtn) closeMarkerBtn.onclick = () => hideModal('mapMarkerModal');
    if (closeDetailBtn) closeDetailBtn.onclick = () => hideModal('detailModal');
}

// ============================================================
// КАСТОМНЫЕ СОБЫТИЯ
// ============================================================

function setupCustomEventHandlers() {
    document.addEventListener('showToast', (e) => showToast(e.detail.message, e.detail.type));
    document.addEventListener('showConfetti', () => showConfetti());
    document.addEventListener('avatarUpdate', (e) => updateAvatarDisplay(e.detail.avatar, e.detail.frame));
    
    document.addEventListener('levelUp', (e) => { 
        const msg = `🎉 ПОВЫШЕНИЕ УРОВНЯ! ${e.detail.title} +${e.detail.reward} монет!`;
        showToast(msg, 'success');
        showConfetti();
        updateUserCard();
        sendLevelUpNotification(e.detail.level, e.detail.title, e.detail.reward);
    });
    
    document.addEventListener('categoryAchievement', (e) => { 
        const msg = `🏆 ${e.detail.name} — ${e.detail.level}! +${e.detail.reward} монет`;
        showToast(msg, 'success');
        showConfetti();
        updateUserCard();
        sendAchievementNotification(e.detail.name, e.detail.reward);
    });
    
    document.addEventListener('dailyBonus', (e) => {
        showDailyBonusModal(e.detail.bonus, e.detail.streak);
        if (e.detail.bonus > 20) {
            sendLocalNotification(
                '🎁 Ежедневный бонус!',
                `Вы получили ${e.detail.bonus} монет за ${e.detail.streak} дней подряд!`,
                { tag: 'daily_bonus', type: 'success' }
            );
        }
    });
    
    document.addEventListener('coinsUpdated', () => updateUserCard());
    document.addEventListener('pointsUpdated', () => updateUserCard());
    document.addEventListener('userReset', () => { 
        updateUserCard(); 
        updateStats(); 
        showToast('Прогресс сброшен', 'info');
    });
    document.addEventListener('urgentTaskUpdated', () => {
        renderUrgentBanner(user.urgentTask);
        if (user.urgentTask) {
            sendUrgentNotification(
                user.urgentTask.text,
                user.urgentTask.desc,
                user.urgentTask.timeLimit
            );
        }
    });
    document.addEventListener('packagesUpdated', () => {
        if (currentTab === 'packages') renderPackages();
        if (currentTab === 'myTasks') renderMyTasks();
    });
    document.addEventListener('statisticsUpdated', () => {
        if (currentTab === 'statistics') renderStatistics();
    });
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

async function init() {
    if (isInitialized) return;
    
    console.log('🚀 Жизнь в делах — Версия 3.0');
    console.log('📋 Твой трекер целей и свершений');
    console.log('📦 Система пакетов: база 100 дел + 10 пакетов по 100 дел');
    
    const versionSpan = document.querySelector('.inline-flex.items-center.gap-3 span');
    if (versionSpan) versionSpan.textContent = 'Жизнь в делах · Версия 3.0';
    
    const tasksLoaded = await initTasks();
    if (!tasksLoaded) {
        showToast('❌ Не удалось загрузить дела!', 'error');
        return;
    }
    
    loadUserData();
    const settings = loadSettings();
    currentTheme = settings.theme || 'light';
    
    initCategoryProgress();
    generateSecretAchievements();
    updateDailyStreak();
    initFreePet();
    startPetTimers();
    
    try {
        await initCloudPhotoStorage();
    } catch (e) {
        console.warn('Cloud storage init failed:', e);
    }
    
    applyTheme();
    if (user.currentBackground && user.currentBackground !== 'default') {
        changeBackground(user.currentBackground);
    }
    
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        initTestData();
    }
    setCurrentUser(user);
    
    setupTabNavigation();
    setupEventListeners();
    setupCustomEventHandlers();
    
    startBoosterTimers();
    generateUrgentTask();
    updateUserCard();
    updateStats();
    
    setInterval(() => { checkFreePetAfterEscape(); }, 60000);
    updateLastLogin();
    
    await initAuth();
    setupAuthModals();
    
    try {
        await initNotifications();
        console.log('✅ Уведомления инициализированы');
    } catch (e) {
        console.warn('Notification init failed:', e);
    }
    
    prefetchResources([
        'js/myTasks.js', 
        'js/packageManager.js', 
        'js/statistics.js', 
        'js/petRoom.js', 
        'js/shopUnified.js',
        'js/notifications.js'
    ]);
    
    window.switchTab('myTasks');
    
    const today = new Date().toISOString().split('T')[0];
    if (user.lastLoginDate !== today) {
        const bonus = user.dailyStreak >= 7 ? 50 : user.dailyStreak >= 6 ? 40 : 
                      user.dailyStreak >= 5 ? 30 : user.dailyStreak >= 4 ? 25 :
                      user.dailyStreak >= 3 ? 20 : user.dailyStreak >= 2 ? 15 : 10;
        showDailyBonusModal(bonus, user.dailyStreak);
        
        setTimeout(() => {
            if (bonus >= 30) {
                sendLocalNotification(
                    '🎁 Ежедневный бонус!',
                    `Вы получили ${bonus} монет за ${user.dailyStreak} дней подряд!`,
                    { tag: 'daily_bonus', type: 'success' }
                );
            }
        }, 2000);
    }
    
    isInitialized = true;
    console.log('✅ Инициализация версии 3.0 завершена');
}

// ============================================================
// ЗАПУСК
// ============================================================

window.renderMyTasks = renderMyTasks;
window.renderPackages = renderPackages;
window.renderStatistics = renderStatistics;
window.renderUnifiedShop = renderUnifiedShop;

init();