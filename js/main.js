// js/main.js
// ============================================================
// ТОЧКА ВХОДА — ГЛАВНЫЙ МОДУЛЬ ПРИЛОЖЕНИЯ (версия 7.6)
// ============================================================

import { initTasks, TASKS_DB } from './tasks.js';
import { 
    loadUserData, saveUserData, initCategoryProgress, updateDailyStreak, 
    user, getCurrentLevel, getNextLevel, updateUserCard, resetUserProgress,
    initFreePet, updateLastLogin, getUsername, hasOldPhotos, migrateOldPhotos
} from './user.js';
import { loadSettings, saveSettings } from './storage.js';
import { renderShop, initDifficultyFilters, renderCategoryFilters } from './shop.js';
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
import { THEMES, saveThemeSettings, resetToDefault } from './settings.js';
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

// ============================================================
// ПЕРЕМЕННЫЕ
// ============================================================

let currentTab = null;
let currentTheme = 'light';
let isInitialized = false;

// Кэш для отслеживания уже отрисованных вкладок (ленивая загрузка)
const tabRendered = {
    shop: false,
    active: false,
    history: false,
    achievements: false,
    random: false,
    calendar: false,
    map: false,
    photos: false,
    pet: false,
    friends: false,
    leaderboard: false,
    search: false,
    about: false
};

// Карта ленивых модулей
const LAZY_MODULES = {
    map: () => import('./map.js'),
    photos: () => import('./photos.js'),
    friends: () => import('./social/friends.js'),
    leaderboard: () => import('./social/leaderboard.js'),
    search: () => import('./social/search.js'),
    about: () => import('./about.js')
};

// Предзагрузка вероятных следующих вкладок
const PREFETCH_ORDER = ['active', 'history', 'pet'];

// ============================================================
// НАВИГАЦИЯ (с выпадающим меню и ленивой загрузкой)
// ============================================================

window.switchTab = async function(tabName) {
    console.log('Switching to tab:', tabName);
    
    const tabButtons = {
        shop: document.getElementById('tabShop'),
        active: document.getElementById('tabActive'),
        history: document.getElementById('tabHistory'),
        achievements: document.getElementById('tabAchievements'),
        random: document.getElementById('tabRandom'),
        calendar: document.getElementById('tabCalendar'),
        map: document.getElementById('tabMap'),
        photos: document.getElementById('tabPhotos'),
        pet: document.getElementById('tabPet'),
        friends: document.getElementById('tabFriends'),
        leaderboard: document.getElementById('tabLeaderboard'),
        search: document.getElementById('tabSearch'),
        about: document.getElementById('tabAbout')
    };
    
    const views = {
        shop: document.getElementById('shopView'),
        active: document.getElementById('activeView'),
        history: document.getElementById('historyView'),
        achievements: document.getElementById('achievementsView'),
        random: document.getElementById('randomView'),
        calendar: document.getElementById('calendarView'),
        map: document.getElementById('mapView'),
        photos: document.getElementById('photosView'),
        pet: document.getElementById('petView'),
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

async function renderTabContent(tabName) {
    console.log(`Loading tab: ${tabName}`);
    
    switch (tabName) {
        case 'shop':
            const shopView = document.getElementById('shopView');
            if (shopView && !shopView.querySelector('#shopGrid')) {
                shopView.innerHTML = `
                    <div class="shop-filters mb-4">
                        <div class="flex gap-2 mb-4 flex-wrap">
                            <button class="diff-filter bg-gray-200 px-4 py-2 rounded-full text-sm" data-diff="all">Все</button>
                            <button class="diff-filter bg-gray-200 px-4 py-2 rounded-full text-sm" data-diff="1">★</button>
                            <button class="diff-filter bg-gray-200 px-4 py-2 rounded-full text-sm" data-diff="2">★★</button>
                            <button class="diff-filter bg-gray-200 px-4 py-2 rounded-full text-sm" data-diff="3">★★★</button>
                            <button class="diff-filter bg-gray-200 px-4 py-2 rounded-full text-sm" data-diff="4">★★★★</button>
                            <button class="diff-filter bg-gray-200 px-4 py-2 rounded-full text-sm" data-diff="5">★★★★★</button>
                        </div>
                        <div id="categoryGroupsList" class="mb-4"></div>
                    </div>
                    <div id="shopGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
                `;
                renderCategoryFilters();
                initDifficultyFilters();
            }
            renderShop();
            renderAvatars();
            renderBoosters();
            break;
            
        case 'active':
            const activeView = document.getElementById('activeView');
            if (activeView && !activeView.querySelector('#activeTasksGrid')) {
                activeView.innerHTML = `<div id="activeTasksGrid" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>`;
            }
            renderActiveTasks();
            break;
            
        case 'history':
            const historyView = document.getElementById('historyView');
            if (historyView && !historyView.querySelector('#historyGrid')) {
                historyView.innerHTML = `<div id="historyGrid" class="space-y-3"></div>`;
            }
            renderHistory();
            break;
            
        case 'achievements':
            renderAchievements();
            break;
            
        case 'random':
            const randomView = document.getElementById('randomView');
            if (randomView && !randomView.querySelector('#randomQuestContainer')) {
                randomView.innerHTML = `<div id="randomQuestContainer" class="max-w-md mx-auto"></div>`;
            }
            initRandomQuest();
            break;
            
        case 'calendar':
            const calendarView = document.getElementById('calendarView');
            if (calendarView && !calendarView.querySelector('#calendarGrid')) {
                calendarView.innerHTML = `
                    <div class="max-w-md mx-auto">
                        <div class="text-center mb-4">
                            <div class="text-2xl font-bold" id="currentMonthYear"></div>
                        </div>
                        <div class="calendar-grid" id="calendarGrid"></div>
                        <div class="text-center mt-4 text-sm text-gray-500" id="superPrizeStatus"></div>
                    </div>
                `;
            }
            setTimeout(() => initCalendar(), 10);
            break;
            
        case 'map':
            const mapView = document.getElementById('mapView');
            if (mapView && !mapView.querySelector('#globalMap')) {
                mapView.innerHTML = `<div id="globalMap" style="height: 500px; width: 100%; border-radius: 16px;"></div>`;
            }
            const { renderMap } = await LAZY_MODULES.map();
            setTimeout(() => renderMap(), 10);
            break;
            
        case 'photos':
            const photosView = document.getElementById('photosView');
            if (photosView && !photosView.querySelector('#photosGrid')) {
                photosView.innerHTML = `<div id="photosGrid" class="photos-grid"></div>`;
            }
            await renderPhotos();
            break;
            
        case 'pet':
            renderPetRoom();
            break;
            
        case 'friends':
            const friendsView = document.getElementById('friendsView');
            if (friendsView && !friendsView.querySelector('#friendsList')) {
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
            }
            renderFriends();
            break;
            
        case 'leaderboard':
            const leaderboardView = document.getElementById('leaderboardView');
            if (leaderboardView && !leaderboardView.querySelector('#leaderboardTabs')) {
                leaderboardView.innerHTML = `
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
            }
            renderLeaderboard();
            break;
            
        case 'search':
            renderSearch();
            break;
            
        case 'about':
            renderAbout();
            break;
            
        case 'settings':
            const settingsView = document.getElementById('settingsView');
            if (settingsView) {
                const { renderSettings } = await import('./settings.js');
                renderSettings();
            }
            break;
    }
}

function refreshTabContent(tabName) {
    switch (tabName) {
        case 'active': renderActiveTasks(); break;
        case 'history': renderHistory(); break;
        case 'shop': renderShop(); break;
        case 'photos': renderPhotos(); break;
        case 'pet': renderPetRoom(); break;
        case 'friends': renderFriends(); break;
        case 'leaderboard': renderLeaderboard(); break;
    }
}

function prefetchNextTab(currentTab) {
    const nextIndex = PREFETCH_ORDER.indexOf(currentTab) + 1;
    if (nextIndex < PREFETCH_ORDER.length) {
        const nextTab = PREFETCH_ORDER[nextIndex];
        if (!tabRendered[nextTab] && LAZY_MODULES[nextTab]) {
            setTimeout(() => {
                console.log(`Prefetching: ${nextTab}`);
                preloadModule(nextTab, LAZY_MODULES[nextTab], 2);
            }, 1000);
        }
    }
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ ВКЛАДОК
// ============================================================

function initShopTabs() {
    const tabs = document.querySelectorAll('.shop-tab');
    const sections = {
        tasks: document.getElementById('shopTasksSection'),
        avatars: document.getElementById('shopAvatarsSection'),
        boosters: document.getElementById('shopBoostersSection'),
        dlc: document.getElementById('shopDLCSection')
    };
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const section = tab.dataset.section;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            Object.values(sections).forEach(s => { if (s) s.classList.add('hidden'); });
            if (sections[section]) sections[section].classList.remove('hidden');
            if (section === 'avatars') renderAvatars();
            else if (section === 'boosters') renderBoosters();
            else if (section === 'tasks') renderShop();
        });
    });
}

function setupTabNavigation() {
    const tabButtons = {
        shop: document.getElementById('tabShop'),
        active: document.getElementById('tabActive'),
        history: document.getElementById('tabHistory'),
        achievements: document.getElementById('tabAchievements'),
        random: document.getElementById('tabRandom'),
        calendar: document.getElementById('tabCalendar'),
        map: document.getElementById('tabMap'),
        photos: document.getElementById('tabPhotos'),
        pet: document.getElementById('tabPet'),
        friends: document.getElementById('tabFriends'),
        leaderboard: document.getElementById('tabLeaderboard'),
        search: document.getElementById('tabSearch'),
        about: document.getElementById('tabAbout')
    };
    
    for (const [key, btn] of Object.entries(tabButtons)) {
        if (btn) {
            btn.onclick = () => {
                closeDropdown();
                window.switchTab(key);
            };
        }
    }
}

function setupDropdownMenu() {
    const moreTabsBtn = document.getElementById('moreTabsBtn');
    const moreTabsDropdown = document.getElementById('moreTabsDropdown');
    
    if (!moreTabsBtn || !moreTabsDropdown) return;
    
    moreTabsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moreTabsDropdown.classList.toggle('hidden');
    });
    
    document.addEventListener('click', (e) => {
        if (!moreTabsBtn.contains(e.target) && !moreTabsDropdown.contains(e.target)) {
            moreTabsDropdown.classList.add('hidden');
        }
    });
    
    const dropdownBtns = {
        history: document.getElementById('tabHistory'),
        achievements: document.getElementById('tabAchievements'),
        random: document.getElementById('tabRandom'),
        calendar: document.getElementById('tabCalendar'),
        map: document.getElementById('tabMap'),
        photos: document.getElementById('tabPhotos'),
        search: document.getElementById('tabSearch'),
        about: document.getElementById('tabAbout')
    };
    
    for (const [key, btn] of Object.entries(dropdownBtns)) {
        if (btn) {
            btn.onclick = () => {
                moreTabsDropdown.classList.add('hidden');
                window.switchTab(key);
            };
        }
    }
}

function closeDropdown() {
    const dropdown = document.getElementById('moreTabsDropdown');
    if (dropdown) dropdown.classList.add('hidden');
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
        exportDate: new Date().toISOString(),
        version: '7.6'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `russia1000_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('📦 Данные экспортированы', 'success');
}

// ============================================================
// ОТКРЫТИЕ ДЕТАЛЕЙ ЗАДАНИЯ
// ============================================================

function openTaskDetail(id) {
    const task = TASKS_DB.find(t => t.id === id);
    if (!task) return;
    
    const categoryColor = getCategoryColor(task.category);
    const header = document.getElementById('detailHeader');
    if (header) header.style.background = `linear-gradient(135deg, ${categoryColor}, ${categoryColor}cc)`;
    
    document.getElementById('detailCategoryBadge').innerHTML = task.category;
    document.getElementById('detailTitle').innerHTML = escapeHtml(task.text);
    
    document.getElementById('detailContent').innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="text-xs text-gray-500 uppercase mb-2">⭐ Сложность</div>
                <div class="text-2xl font-bold difficulty-${task.difficulty}">${"★".repeat(task.difficulty)}</div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="text-xs text-gray-500 uppercase mb-2">💰 Цена и награда</div>
                <div class="flex justify-between flex-wrap gap-2">
                    <span>💰 Цена: ${task.price} монет</span>
                    <span>🎁 Награда: ${task.baseReward} монет</span>
                    <span>⭐ Опыт: +${task.baseXP} XP</span>
                </div>
            </div>
            <div class="flex justify-end gap-3 pt-4">
                <button id="detailCloseBtn" class="px-4 py-2 bg-gray-100 rounded-full">Закрыть</button>
                <button id="detailPurchaseBtn" class="px-4 py-2 text-white rounded-full" style="background: ${categoryColor};">💰 Купить</button>
            </div>
        </div>
    `;
    
    showModal('detailModal');
    
    document.getElementById('detailCloseBtn').onclick = () => hideModal('detailModal');
    document.getElementById('detailPurchaseBtn').onclick = () => {
        hideModal('detailModal');
        import('./shop.js').then(m => m.purchaseTask(task));
    };
}

// ============================================================
// ФУНКЦИИ ДЛЯ МОДАЛЬНЫХ ОКОН ПРОФИЛЯ И НАСТРОЕК (СТАРЫЕ)
// ============================================================

function renderProfileModal() {
    const container = document.getElementById('profileModalContent');
    if (!container) return;
    
    const username = getUsername();
    const level = getCurrentLevel();
    const totalTasks = TASKS_DB.length;
    const completedTasks = user.stats.tasksCompleted;
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const achievementsCount = user.achievements.length + Object.keys(user.categoryAchievements).length + (user.secretAchievements || []).filter(a => a.completed).length;
    
    container.innerHTML = `
        <div class="space-y-4">
            <div class="text-center">
                <div class="text-6xl mb-2">${user.currentAvatar || '🏆'}</div>
                <h2 class="text-2xl font-bold">${escapeHtml(username)}</h2>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div class="text-center p-3 bg-gray-50 rounded-xl"><div class="text-2xl font-bold text-green-600">${completedTasks}</div><div class="text-xs">Выполнено дел</div><div class="text-xs text-gray-400">${completionPercent}%</div></div>
                <div class="text-center p-3 bg-gray-50 rounded-xl"><div class="text-2xl font-bold text-blue-600">${user.level}</div><div class="text-xs">Уровень</div><div class="text-xs text-gray-400">${level.title}</div></div>
                <div class="text-center p-3 bg-gray-50 rounded-xl"><div class="text-2xl font-bold text-yellow-600">${achievementsCount}</div><div class="text-xs">Достижений</div></div>
                <div class="text-center p-3 bg-gray-50 rounded-xl"><div class="text-2xl font-bold text-purple-600">${user.coins}</div><div class="text-xs">Монет</div></div>
            </div>
            <div class="flex gap-3">
                <button id="exportFromModal" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-full">📤 Экспорт</button>
                <button id="importFromModal" class="flex-1 bg-green-600 text-white px-4 py-2 rounded-full">📥 Импорт</button>
            </div>
        </div>
    `;
    
    document.getElementById('exportFromModal')?.addEventListener('click', exportData);
    document.getElementById('importFromModal')?.addEventListener('click', importProgress);
}

function renderSettingsModal() {
    const container = document.getElementById('settingsModalContent');
    if (!container) return;
    
    container.innerHTML = `
        <div class="space-y-4">
            <div>
                <h3 class="text-lg font-bold mb-2">🎨 Тема</h3>
                <div class="flex gap-2">
                    <button id="themeLightBtn" class="px-4 py-2 rounded-full ${currentTheme === 'light' ? 'bg-green-600 text-white' : 'bg-gray-200'}">☀️ Светлая</button>
                    <button id="themeDarkBtn" class="px-4 py-2 rounded-full ${currentTheme === 'dark' ? 'bg-green-600 text-white' : 'bg-gray-200'}">🌙 Тёмная</button>
                </div>
            </div>
            <div>
                <h3 class="text-lg font-bold mb-2">🎨 Фоны</h3>
                <div class="flex gap-2">
                    <button id="bgDefaultBtnModal" class="px-4 py-2 rounded-full bg-gray-200">🏠 Стандартный</button>
                    <button id="bgForestBtnModal" class="px-4 py-2 rounded-full bg-gray-200">🌲 Лесной</button>
                    <button id="bgCosmicBtnModal" class="px-4 py-2 rounded-full bg-gray-200">🌌 Космос</button>
                </div>
            </div>
            <button id="resetSettingsBtn" class="w-full bg-gray-500 text-white px-4 py-2 rounded-full">🔄 Сбросить настройки</button>
        </div>
    `;
    
    document.getElementById('themeLightBtn')?.addEventListener('click', () => { currentTheme = 'light'; applyTheme(); saveSettings({ theme: currentTheme }); renderSettingsModal(); });
    document.getElementById('themeDarkBtn')?.addEventListener('click', () => { currentTheme = 'dark'; applyTheme(); saveSettings({ theme: currentTheme }); renderSettingsModal(); });
    document.getElementById('bgDefaultBtnModal')?.addEventListener('click', () => changeBackground('default'));
    document.getElementById('bgForestBtnModal')?.addEventListener('click', () => changeBackground('forest'));
    document.getElementById('bgCosmicBtnModal')?.addEventListener('click', () => changeBackground('cosmic'));
    document.getElementById('resetSettingsBtn')?.addEventListener('click', () => { resetToDefault(); renderSettingsModal(); });
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
            openTaskDetail(random.id);
        };
    }
    
    // ============================================================
    // КНОПКА ПРОФИЛЯ
    // ============================================================
    const headerProfileBtn = document.getElementById('headerProfileBtn');
    if (headerProfileBtn) {
        headerProfileBtn.onclick = async () => {
            const { openProfileModal } = await import('./profile.js');
            openProfileModal();
        };
    }
    
    // ============================================================
    // КНОПКА НАСТРОЕК
    // ============================================================
    const headerSettingsBtn = document.getElementById('headerSettingsBtn');
    if (headerSettingsBtn) {
        headerSettingsBtn.onclick = async () => {
            const { openSettingsModal } = await import('./settings.js');
            if (typeof openSettingsModal === 'function') {
                openSettingsModal();
            } else {
                const { renderSettingsModal } = await import('./settings.js');
                if (renderSettingsModal) renderSettingsModal();
                const settingsModal = document.getElementById('settingsModal');
                if (settingsModal) settingsModal.classList.remove('hidden');
            }
        };
    }
    
    const closeProfileModal = document.getElementById('closeProfileModal');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    const profileModal = document.getElementById('profileModal');
    const settingsModal = document.getElementById('settingsModal');
    
    if (closeProfileModal) closeProfileModal.onclick = () => profileModal.classList.add('hidden');
    if (closeSettingsModal) closeSettingsModal.onclick = () => settingsModal.classList.add('hidden');
    
    if (profileModal) profileModal.addEventListener('click', (e) => { if (e.target === profileModal) profileModal.classList.add('hidden'); });
    if (settingsModal) settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.classList.add('hidden'); });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (profileModal && !profileModal.classList.contains('hidden')) profileModal.classList.add('hidden');
            if (settingsModal && !settingsModal.classList.contains('hidden')) settingsModal.classList.add('hidden');
        }
    });
    
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
    
    if (confirmDeadlineBtn) confirmDeadlineBtn.onclick = () => import('./shop.js').then(m => m.confirmPurchase());
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
}

function setupCustomEventHandlers() {
    document.addEventListener('showToast', (e) => showToast(e.detail.message, e.detail.type));
    document.addEventListener('showConfetti', () => showConfetti());
    document.addEventListener('avatarUpdate', (e) => updateAvatarDisplay(e.detail.avatar, e.detail.frame));
    document.addEventListener('levelUp', (e) => { showToast(`🎉 ПОВЫШЕНИЕ УРОВНЯ! ${e.detail.title} +${e.detail.reward} монет!`, 'success'); showConfetti(); updateUserCard(); });
    document.addEventListener('categoryAchievement', (e) => { showToast(`🏆 ${e.detail.name} — ${e.detail.level}! +${e.detail.reward} монет`, 'success'); showConfetti(); updateUserCard(); });
    document.addEventListener('dailyBonus', (e) => showDailyBonusModal(e.detail.bonus, e.detail.streak));
    document.addEventListener('coinsUpdated', () => updateUserCard());
    document.addEventListener('pointsUpdated', () => updateUserCard());
    document.addEventListener('userReset', () => { updateUserCard(); updateStats(); showToast('Прогресс сброшен', 'info'); });
    document.addEventListener('urgentTaskUpdated', () => renderUrgentBanner(user.urgentTask));
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

async function init() {
    if (isInitialized) return;
    
    console.log('🚀 Версия 7.6 — Облачная регистрация и синхронизация');
    
    const versionSpan = document.querySelector('.inline-flex.items-center.gap-3 span');
    if (versionSpan) versionSpan.textContent = '1000 возможностей России · Версия 7.6';
    
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
    
    renderCategoryFilters();
    initDifficultyFilters();
    initShopTabs();
    setupTabNavigation();
    setupDropdownMenu();
    setupEventListeners();
    setupCustomEventHandlers();
    startBoosterTimers();
    generateUrgentTask();
    updateUserCard();
    updateStats();
    
    setInterval(() => { checkFreePetAfterEscape(); }, 60000);
    updateLastLogin();
    
    // ============================================================
    // ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ АВТОРИЗАЦИИ
    // ============================================================
    await initAuth();
    setupAuthModals();
        
    prefetchResources(['js/activeTasks.js', 'js/history.js', 'js/achievements.js']);
    window.switchTab('shop');
    
    const today = new Date().toISOString().split('T')[0];
    if (user.lastLoginDate !== today) {
        const bonus = user.dailyStreak >= 7 ? 50 : user.dailyStreak >= 6 ? 40 : 
                      user.dailyStreak >= 5 ? 30 : user.dailyStreak >= 4 ? 25 :
                      user.dailyStreak >= 3 ? 20 : user.dailyStreak >= 2 ? 15 : 10;
        showDailyBonusModal(bonus, user.dailyStreak);
    }
    
    isInitialized = true;
    console.log('✅ Инициализация версии 7.6 завершена');
}

// Запуск
init();