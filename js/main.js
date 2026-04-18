// js/main.js
// ============================================================
// ТОЧКА ВХОДА — ГЛАВНЫЙ МОДУЛЬ ПРИЛОЖЕНИЯ (версия 7.5)
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

/**
 * Переключение вкладок с ленивой загрузкой
 * @param {string} tabName - имя вкладки
 */
window.switchTab = async function(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Получаем кнопки вкладок
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
    
    // Получаем контейнеры
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
    
    // Снимаем активный класс со всех кнопок
    Object.values(tabButtons).forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    
    // Скрываем все контейнеры
    Object.values(views).forEach(view => {
        if (view) view.classList.add('hidden');
    });
    
    // Показываем выбранный контейнер
    if (views[tabName]) {
        views[tabName].classList.remove('hidden');
    }
    
    // Активируем кнопку
    if (tabButtons[tabName]) {
        tabButtons[tabName].classList.add('active');
    }
    
    currentTab = tabName;
    
    // Предзагружаем следующую вероятную вкладку
    prefetchNextTab(tabName);
    
    // Ленивая загрузка и рендеринг содержимого
    if (!tabRendered[tabName]) {
        await renderTabContent(tabName);
        tabRendered[tabName] = true;
    } else {
        // Обновляем данные если нужно
        refreshTabContent(tabName);
    }
};

/**
 * Рендер содержимого вкладки (ленивая загрузка)
 * @param {string} tabName - имя вкладки
 */
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
                            <div>
                                <h3 class="font-bold mb-2">👥 Друзья</h3>
                                <div id="friendsList" class="space-y-2"></div>
                            </div>
                            <div>
                                <h3 class="font-bold mb-2">📨 Входящие заявки</h3>
                                <div id="incomingRequestsList" class="space-y-2"></div>
                            </div>
                            <div>
                                <h3 class="font-bold mb-2">📤 Исходящие заявки</h3>
                                <div id="outgoingRequestsList" class="space-y-2"></div>
                            </div>
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
    }
}

/**
 * Обновление данных вкладки (без перерендера структуры)
 * @param {string} tabName - имя вкладки
 */
function refreshTabContent(tabName) {
    switch (tabName) {
        case 'active':
            renderActiveTasks();
            break;
        case 'history':
            renderHistory();
            break;
        case 'shop':
            renderShop();
            break;
        case 'photos':
            renderPhotos();
            break;
        case 'pet':
            renderPetRoom();
            break;
        case 'friends':
            renderFriends();
            break;
        case 'leaderboard':
            renderLeaderboard();
            break;
    }
}

/**
 * Предзагрузка следующей вероятной вкладки
 * @param {string} currentTab - текущая вкладка
 */
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
            
            Object.values(sections).forEach(s => {
                if (s) s.classList.add('hidden');
            });
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
        version: '7.5'
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
    
    document.getElementById('detailCategoryIcon').innerHTML = '📌';
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
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="text-xs text-gray-500 uppercase mb-2">📝 Описание</div>
                <p class="text-gray-700">${escapeHtml(task.text)}</p>
            </div>
            <div class="flex justify-end gap-3 pt-4">
                <button id="detailCloseBtn" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition">Закрыть</button>
                <button id="detailPurchaseBtn" class="px-4 py-2 text-white rounded-full shadow-md transition" style="background: ${categoryColor};">💰 Купить</button>
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
// ФУНКЦИИ ДЛЯ МОДАЛЬНЫХ ОКОН ПРОФИЛЯ И НАСТРОЕК
// ============================================================

function renderProfileModal() {
    const container = document.getElementById('profileModalContent');
    if (!container) return;
    
    const account = user.account || {};
    const username = getUsername();
    const userId = account.userId || '—';
    const createdAt = account.createdAt ? new Date(account.createdAt).toLocaleDateString('ru-RU') : 'только что';
    const loginStreak = account.loginStreak || 0;
    const isGuest = account.isGuest;
    
    const level = getCurrentLevel();
    const totalTasks = TASKS_DB.length;
    const completedTasks = user.stats.tasksCompleted;
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const achievementsCount = user.achievements.length + 
                              Object.keys(user.categoryAchievements).length + 
                              (user.secretAchievements || []).filter(a => a.completed).length;
    
    const pet = user.pet;
    const petName = pet?.currentPet ? (pet.customName || 'Питомец') : 'Нет питомца';
    const petLevel = pet?.level || 0;
    
    const allPets = [...(user.pet?.purchasedPets || [])];
    const premiumPets = allPets.filter(id => id === 'fennec' || id === 'phoenix').length;
    const roomsOwned = user.pet?.purchasedRooms?.length || 0;
    
    const trustLevels = {
        newbie: { name: '🟢 Новичок', min: 0 },
        verified: { name: '🔵 Проверенный', min: 10 },
        reliable: { name: '🟡 Надёжный', min: 50 },
        expert: { name: '🟠 Эксперт', min: 100 },
        master: { name: '🔴 Мастер', min: 500 }
    };
    const trustLevel = trustLevels[user.trust?.level] || trustLevels.newbie;
    
    const cloudStatus = user.photos?.cloudEnabled ? `☁️ ${user.photos.provider}` : '❌ Не подключено';
    
    container.innerHTML = `
        <div class="space-y-6">
            <div class="text-center">
                <div class="text-6xl mb-2">${getAvatarByUsername(username)}</div>
                <h2 class="text-2xl font-bold">${escapeHtml(username)}</h2>
                <p class="text-sm text-gray-500">ID: ${userId.substring(0, 16)}...</p>
                ${isGuest ? '<span class="inline-block mt-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">👤 Гость</span>' : ''}
                <button id="editNameFromModal" class="mt-2 text-sm text-blue-500 hover:text-blue-700">✏️ Сменить имя</button>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
                <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div class="text-2xl font-bold text-green-600">${completedTasks}</div>
                    <div class="text-xs text-gray-500">Выполнено дел</div>
                    <div class="text-xs text-gray-400">${completionPercent}%</div>
                </div>
                <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div class="text-2xl font-bold text-blue-600">${user.level}</div>
                    <div class="text-xs text-gray-500">Уровень</div>
                    <div class="text-xs text-gray-400">${level.title}</div>
                </div>
                <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div class="text-2xl font-bold text-yellow-600">${achievementsCount}</div>
                    <div class="text-xs text-gray-500">Достижений</div>
                </div>
                <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div class="text-2xl font-bold text-purple-600">${user.coins}</div>
                    <div class="text-xs text-gray-500">Монет</div>
                </div>
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-bold mb-1">🐾 Питомец</h3>
                        <p class="text-sm">${petName}, уровень ${petLevel}</p>
                    </div>
                    <div class="text-right text-sm">
                        <div>Куплено: ${allPets.length} (${premiumPets} премиум)</div>
                        <div>Комнат: ${roomsOwned}/5</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-bold mb-1">⭐ Доверие</h3>
                        <p class="text-sm">${trustLevel.name}</p>
                    </div>
                    <div class="text-right text-sm">
                        <div>${user.trust?.points || 0} очков</div>
                        <div>${user.trust?.verifiedTasks || 0} подтверждений</div>
                    </div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div class="bg-green-600 h-2 rounded-full" style="width: ${Math.min(100, (user.trust?.points || 0) / 10)}%"></div>
                </div>
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-bold mb-1">☁️ Облачное хранилище</h3>
                        <p class="text-sm">${cloudStatus}</p>
                    </div>
                    <button id="syncNowProfileBtn" class="text-sm bg-blue-600 text-white px-3 py-1 rounded-full">🔄 Синхронизировать</button>
                </div>
            </div>
            
            <div class="flex gap-3">
                <button id="exportFromModal" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition">📤 Экспорт</button>
                <button id="importFromModal" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full transition">📥 Импорт</button>
            </div>
            
            ${hasOldPhotos() ? `
            <div class="flex gap-3">
                <button id="migratePhotosBtn" class="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-full transition">📸 Перенести старые фото</button>
            </div>
            ` : ''}
            
            <div class="text-xs text-gray-400 text-center">
                В игре с ${createdAt} · Стрик входов: 🔥 ${loginStreak} дней
            </div>
        </div>
    `;
    
    document.getElementById('editNameFromModal')?.addEventListener('click', async () => {
        const { showChangeUsernameModal } = await import('./auth.js');
        await showChangeUsernameModal();
        renderProfileModal();
    });
    
    document.getElementById('exportFromModal')?.addEventListener('click', exportData);
    document.getElementById('importFromModal')?.addEventListener('click', importProgress);
    document.getElementById('syncNowProfileBtn')?.addEventListener('click', async () => {
        showToast('🔄 Синхронизация...', 'info');
        await forceSync();
        showToast('✅ Синхронизация завершена', 'success');
    });
    
    document.getElementById('migratePhotosBtn')?.addEventListener('click', async () => {
        showToast('📸 Перенос старых фото...', 'info');
        const count = await migrateOldPhotos();
        showToast(`✅ Перенесено ${count} фото`, 'success');
        renderProfileModal();
        if (typeof renderPhotos === 'function') renderPhotos();
    });
}

function renderSettingsModal() {
    const container = document.getElementById('settingsModalContent');
    if (!container) return;
    
    const currentThemeId = user.settings?.themeId || 'light';
    const cloudProvider = user.photos?.provider || 'не подключено';
    const cloudEnabled = user.photos?.cloudEnabled || false;
    const autoSync = user.photos?.autoSync !== false;
    const cacheOnDevice = user.photos?.cacheOnDevice !== false;
    
    let html = `
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-bold mb-4">🎨 Готовые темы</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    `;
    
    for (const [themeId, theme] of Object.entries(THEMES)) {
        const isActive = currentThemeId === themeId;
        html += `
            <button class="theme-modal-btn p-3 rounded-xl text-center transition-all ${isActive ? 'ring-2 ring-green-500 shadow-lg' : 'hover:scale-105'}" 
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
            
            <div>
                <h3 class="text-lg font-bold mb-4">🎨 Индивидуальная настройка</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Цвет фона</label>
                        <div class="flex gap-2 flex-wrap">
                            <button class="custom-color-modal-btn px-4 py-2 rounded-full text-sm" data-target="bgBody" data-color="linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)" style="background: linear-gradient(135deg, #e0e7ff, #c7d2fe);">Лавандовый</button>
                            <button class="custom-color-modal-btn px-4 py-2 rounded-full text-sm" data-target="bgBody" data-color="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)" style="background: linear-gradient(135deg, #d1fae5, #a7f3d0);">Мятный</button>
                            <button class="custom-color-modal-btn px-4 py-2 rounded-full text-sm" data-target="bgBody" data-color="linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" style="background: linear-gradient(135deg, #fef3c7, #fde68a);">Закатный</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Цвет карточек</label>
                        <div class="flex gap-2 flex-wrap">
                            <button class="custom-color-modal-btn px-4 py-2 rounded-full text-sm" data-target="bgCard" data-color="linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)" style="background: linear-gradient(135deg, #ffffff, #f9fafb); border:1px solid #ddd;">Белый</button>
                            <button class="custom-color-modal-btn px-4 py-2 rounded-full text-sm" data-target="bgCard" data-color="linear-gradient(135deg, #e8f4f8 0%, #d4eaf0 100%)" style="background: linear-gradient(135deg, #e8f4f8, #d4eaf0);">Нежно-голубой</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Цвет кнопок</label>
                        <div class="flex gap-2 flex-wrap">
                            <button class="custom-color-modal-btn px-4 py-2 rounded-full text-sm text-white" data-target="primary" data-color="#10b981" data-hover="#059669" style="background: #10b981;">Зелёный</button>
                            <button class="custom-color-modal-btn px-4 py-2 rounded-full text-sm text-white" data-target="primary" data-color="#8b5cf6" data-hover="#7c3aed" style="background: #8b5cf6;">Фиолетовый</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div>
                <h3 class="text-lg font-bold mb-4">☁️ Облачное хранилище</h3>
                <div class="space-y-3">
                    <div class="flex flex-wrap gap-2">
                        <button id="connectGoogleBtnModal" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm">🔴 Google Drive</button>
                        <button id="connectYandexBtnModal" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm">💙 Яндекс.Диск</button>
                        <button id="connectS3BtnModal" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm">🗄️ S3</button>
                    </div>
                    <div class="flex items-center gap-4">
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="autoSyncCheckboxModal" ${autoSync ? 'checked' : ''}>
                            <span class="text-sm">Автосинхронизация</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="cacheOnDeviceCheckboxModal" ${cacheOnDevice ? 'checked' : ''}>
                            <span class="text-sm">Кэшировать на устройстве</span>
                        </label>
                    </div>
                    <div class="flex gap-2">
                        <button id="syncNowBtnModal" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm">🔄 Синхронизировать</button>
                        <button id="disconnectCloudBtnModal" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full text-sm">🔌 Отключить</button>
                    </div>
                    <div class="text-xs text-gray-500">
                        Статус: ${cloudEnabled ? `✅ ${cloudProvider}` : '❌ Не подключено'}
                    </div>
                </div>
            </div>
            
            <div>
                <button id="resetSettingsModalBtn" class="w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-full transition">
                    🔄 Вернуть стандартную тему
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Обработчики тем
    document.querySelectorAll('.theme-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const themeId = btn.dataset.themeId;
            saveThemeSettings(themeId);
            renderSettingsModal();
            showToast(`🎨 Тема "${THEMES[themeId].name}" применена!`, 'success');
        });
    });
    
    // Обработчики цветов
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
    
    // Обработчики облака
    document.getElementById('connectGoogleBtnModal')?.addEventListener('click', async () => {
        const { connectGoogleDrive } = await import('./cloud/cloudPhotoStorage.js');
        await connectGoogleDrive();
        renderSettingsModal();
    });
    
    document.getElementById('connectYandexBtnModal')?.addEventListener('click', async () => {
        const { connectYandexDisk } = await import('./cloud/cloudPhotoStorage.js');
        await connectYandexDisk();
        renderSettingsModal();
    });
    
    document.getElementById('connectS3BtnModal')?.addEventListener('click', () => {
        const endpoint = prompt('Введите S3 endpoint');
        const accessKey = prompt('Введите Access Key ID');
        const secretKey = prompt('Введите Secret Access Key');
        const bucket = prompt('Введите имя бакета');
        if (endpoint && accessKey && secretKey && bucket) {
            import('./cloud/cloudPhotoStorage.js').then(({ connectS3 }) => {
                connectS3(endpoint, accessKey, secretKey, bucket).then(() => renderSettingsModal());
            });
        }
    });
    
    document.getElementById('syncNowBtnModal')?.addEventListener('click', async () => {
        showToast('🔄 Синхронизация...', 'info');
        await forceSync();
        showToast('✅ Синхронизация завершена', 'success');
        renderSettingsModal();
        if (typeof renderPhotos === 'function') renderPhotos();
    });
    
    document.getElementById('disconnectCloudBtnModal')?.addEventListener('click', async () => {
        const { disconnectCloud } = await import('./cloud/cloudPhotoStorage.js');
        await disconnectCloud();
        renderSettingsModal();
    });
    
    document.getElementById('autoSyncCheckboxModal')?.addEventListener('change', (e) => {
        if (user.photos) user.photos.autoSync = e.target.checked;
        saveUserData();
    });
    
    document.getElementById('cacheOnDeviceCheckboxModal')?.addEventListener('change', (e) => {
        if (user.photos) user.photos.cacheOnDevice = e.target.checked;
        saveUserData();
    });
    
    const resetBtn = document.getElementById('resetSettingsModalBtn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            resetToDefault();
            renderSettingsModal();
        };
    }
}

function getAvatarByUsername(username) {
    const emojis = ['😀', '😎', '🦊', '🐱', '🐶', '🦁', '🐼', '🐧', '🦄', '🌟', '⭐', '🔥'];
    const index = username?.length % emojis.length || 0;
    return emojis[index];
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
                    
                    // Обновляем структуру фото если нужно
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
    const bgForestBtn = document.getElementById('bgForestBtn');
    const bgCosmicBtn = document.getElementById('bgCosmicBtn');
    const bgDefaultBtn = document.getElementById('bgDefaultBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const randomBtn = document.getElementById('randomBtn');
    
    if (themeToggle) themeToggle.onclick = toggleTheme;
    if (bgForestBtn) bgForestBtn.onclick = () => changeBackground('forest');
    if (bgCosmicBtn) bgCosmicBtn.onclick = () => changeBackground('cosmic');
    if (bgDefaultBtn) bgDefaultBtn.onclick = () => changeBackground('default');
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
    
    // Кнопки в шапке для модальных окон
    const headerProfileBtn = document.getElementById('headerProfileBtn');
    const headerSettingsBtn = document.getElementById('headerSettingsBtn');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const closeSettingsModal = document.getElementById('closeSettingsModal');
    const profileModal = document.getElementById('profileModal');
    const settingsModal = document.getElementById('settingsModal');
    
    if (headerProfileBtn) {
        headerProfileBtn.onclick = () => {
            renderProfileModal();
            profileModal.classList.remove('hidden');
        };
    }
    
    if (headerSettingsBtn) {
        headerSettingsBtn.onclick = () => {
            renderSettingsModal();
            settingsModal.classList.remove('hidden');
        };
    }
    
    if (closeProfileModal) {
        closeProfileModal.onclick = () => {
            profileModal.classList.add('hidden');
        };
    }
    
    if (closeSettingsModal) {
        closeSettingsModal.onclick = () => {
            settingsModal.classList.add('hidden');
        };
    }
    
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) profileModal.classList.add('hidden');
        });
    }
    
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.add('hidden');
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (profileModal && !profileModal.classList.contains('hidden')) {
                profileModal.classList.add('hidden');
            }
            if (settingsModal && !settingsModal.classList.contains('hidden')) {
                settingsModal.classList.add('hidden');
            }
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

// ============================================================
// ОБРАБОТЧИКИ СОБЫТИЙ ДЛЯ User.js
// ============================================================

function setupCustomEventHandlers() {
    document.addEventListener('showToast', (e) => {
        showToast(e.detail.message, e.detail.type);
    });
    
    document.addEventListener('showConfetti', () => {
        showConfetti();
    });
    
    document.addEventListener('avatarUpdate', (e) => {
        updateAvatarDisplay(e.detail.avatar, e.detail.frame);
    });
    
    document.addEventListener('levelUp', (e) => {
        showToast(`🎉 ПОВЫШЕНИЕ УРОВНЯ! ${e.detail.title} +${e.detail.reward} монет!`, 'success');
        showConfetti();
        updateUserCard();
    });
    
    document.addEventListener('categoryAchievement', (e) => {
        showToast(`🏆 ${e.detail.name} — ${e.detail.level}! +${e.detail.reward} монет`, 'success');
        showConfetti();
        updateUserCard();
    });
    
    document.addEventListener('dailyBonus', (e) => {
        showDailyBonusModal(e.detail.bonus, e.detail.streak);
        updateUserCard();
    });
    
    document.addEventListener('coinsUpdated', () => {
        updateUserCard();
    });
    
    document.addEventListener('pointsUpdated', () => {
        updateUserCard();
    });
    
    document.addEventListener('userReset', () => {
        updateUserCard();
        updateStats();
        showToast('Прогресс сброшен', 'info');
    });
    
    document.addEventListener('urgentTaskUpdated', () => {
        renderUrgentBanner(user.urgentTask);
    });
    
    document.addEventListener('centerMap', (e) => {
        const { lat, lng } = e.detail;
        if (typeof window.centerMapOnLocation === 'function') {
            window.centerMapOnLocation(lat, lng);
        }
    });
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

async function init() {
    if (isInitialized) return;
    
    console.log('🚀 Версия 7.5 — Оптимизация + Облачное хранилище фото');
    
    // Обновляем версию в DOM
    const versionSpan = document.querySelector('.inline-flex.items-center.gap-3 span');
    if (versionSpan) {
        versionSpan.textContent = '1000 возможностей · Версия 7.5';
    }
    
    // Загрузка задач
    const tasksLoaded = await initTasks();
    if (!tasksLoaded) {
        showToast('❌ Не удалось загрузить дела!', 'error');
        return;
    }
    
    // Загрузка пользователя
    loadUserData();
    const settings = loadSettings();
    currentTheme = settings.theme || 'light';
    
    // Инициализация
    initCategoryProgress();
    generateSecretAchievements();
    updateDailyStreak();
    
    initFreePet();
    startPetTimers();
    
    // Инициализация облачного хранилища
    await initCloudPhotoStorage();
    
    applyTheme();
    if (user.currentBackground && user.currentBackground !== 'default') {
        changeBackground(user.currentBackground);
    }
    
    // Инициализация тестовых данных (только для разработки)
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
    
    setInterval(() => {
        checkFreePetAfterEscape();
    }, 60000);
    
    updateLastLogin();
    await checkAndShowAuth();
    
    // Предзагрузка ресурсов
    prefetchResources([
        'js/activeTasks.js',
        'js/history.js',
        'js/achievements.js'
    ]);
    
    // Открываем магазин по умолчанию
    window.switchTab('shop');
    
    const today = new Date().toISOString().split('T')[0];
    if (user.lastLoginDate !== today) {
        const bonus = user.dailyStreak >= 7 ? 50 : user.dailyStreak >= 6 ? 40 : 
                      user.dailyStreak >= 5 ? 30 : user.dailyStreak >= 4 ? 25 :
                      user.dailyStreak >= 3 ? 20 : user.dailyStreak >= 2 ? 15 : 10;
        showDailyBonusModal(bonus, user.dailyStreak);
    }
    
    isInitialized = true;
    console.log('✅ Инициализация версии 7.5 завершена');
}

// Запуск
init();