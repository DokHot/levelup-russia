// js/myTasks.js
// ============================================================
// МОИ ДЕЛА — ГЛАВНЫЙ ЭКРАН (объединяет магазин, активные, историю)
// Версия 0.8 — С фильтрацией по уровню и прогрессом открытия
// ============================================================

import { TASKS_DB, getTaskById } from './tasks.js';
import { user, addCoins, addPoints, spendCoins, saveUserData, updateCategoryProgress } from './user.js';
import { getCategoryColor, DEADLINE_MULTIPLIERS, CATEGORY_GROUPS } from './config.js';
import { showToast, showConfetti, showModal, hideModal } from './ui.js';
import { escapeHtml, formatDateTime, getRemainingTime, addDays } from './utils.js';
import { getBoosterMultiplier, getPenaltyReduction } from './boosters.js';
import { getPetBonus } from './pets.js';
import { checkAchievements, checkSecretAchievements } from './achievements.js';
import { checkAvatarRewards } from './avatars.js';
import { getActivePackages, getPackageInfo } from './packageManager.js';

// ============================================================
// ИКОНКИ ДЛЯ КАТЕГОРИЙ
// ============================================================

function getCategoryIcon(category) {
    const icons = {
        "Путешествия по России": "🏔️",
        "Транспорт и дороги": "🚗",
        "Географические точки": "📍",
        "Астрономия и космос": "🌙",
        "Рыбалка и охота": "🎣",
        "Гербарий и ботаника": "🌿",
        "Садоводство и огород": "🌱",
        "Животноводство": "🐄",
        "Уличная еда": "🌭",
        "Кулинария": "🍳",
        "Дом и быт": "🏠",
        "Гостеприимство": "🍷",
        "Отношения и любовь": "💕",
        "Волонтёрство": "🤝",
        "Благотворительность": "🎁",
        "Письма": "✉️",
        "Навыки и саморазвитие": "📚",
        "Обучение и курсы": "🎓",
        "Творчество": "🎨",
        "Искусство": "🖼️",
        "Фотография": "📸",
        "Коллекционирование": "🪙",
        "Городские исследования": "🏙️",
        "Психология": "🧠",
        "Религия и духовное": "🙏",
        "Челленджи": "🏆",
        "Один раз в жизни": "✨",
        "Странные дела": "🤪",
        "Финансы": "💰",
        "Работа и карьера": "💼",
        "Цифровая гигиена": "🔐",
        "Экология": "♻️",
        "Медиа и информация": "📱",
        "Экстрим": "🧗",
        "Здоровье и тело": "💪",
        "Эмоции и впечатления": "🎢",
        "Сон и восстановление": "😴",
        "Биохакинг": "🧬",
        "Красота и уход": "💄",
        "Самооборона": "🥋"
    };
    return icons[category] || "📌";
}

// ============================================================
// СОСТОЯНИЕ
// ============================================================

let currentTab = 'all'; // all | active | completed
let currentCategoryFilter = 'all';
let currentDifficultyFilter = 'all';
let searchQuery = '';
let selectedTaskForPurchase = null;
let selectedDeadline = 7;
let pendingSurrenderTaskId = null;
let currentEditTaskId = null;

// ============================================================
// ПРОГРЕСС ОТКРЫТИЯ ДЕЛ
// ============================================================

export function getUnlockProgress() {
    const totalTasks = TASKS_DB.length;
    const userLevel = user.level || 1;
    
    const availableTasks = TASKS_DB.filter(t => 
        (t.unlockLevel || 1) <= userLevel
    ).length;
    
    const nextLevel = userLevel + 1;
    const tasksForNextLevel = TASKS_DB.filter(t => 
        (t.unlockLevel || 1) === nextLevel
    ).length;
    
    const percent = Math.min(100, Math.round((availableTasks / totalTasks) * 100));
    const lockedTasks = totalTasks - availableTasks;
    
    return {
        available: availableTasks,
        total: totalTasks,
        locked: lockedTasks,
        percent: percent,
        nextLevel: nextLevel,
        tasksForNextLevel: tasksForNextLevel,
        nextUnlockMessage: tasksForNextLevel > 0 
            ? 'На уровне ' + nextLevel + ' откроется ' + tasksForNextLevel + ' новых дел' 
            : 'Все дела уже открыты! 🎉'
    };
}

// ============================================================
// ОТРИСОВКА ГЛАВНОГО ЭКРАНА
// ============================================================

export function renderMyTasks() {
    var container = document.getElementById('myTasksView');
    if (!container) {
        console.warn('myTasksView not found');
        return;
    }

    var activePackages = getActivePackages();
    var activePackageNames = activePackages.map(function(id) {
        var pkg = getPackageInfo(id);
        return pkg ? pkg.name : id;
    });

    var unlockProgress = getUnlockProgress();
    var totalTasks = getAvailableTasksCount();
    var activeCount = user.activeTasks.length;
    var completedCount = user.stats.tasksCompleted;
    var overdueCount = user.activeTasks.filter(function(t) { return new Date() > new Date(t.deadline); }).length;

    var html = '';
    
    html += '<div class="my-tasks-container max-w-4xl mx-auto">';
        
    // ВЕРХНЯЯ ПАНЕЛЬ СТАТИСТИКИ
    html += '<div class="stats-panel bg-white dark:bg-gray-800 rounded-2xl p-5 mb-5 shadow-sm border border-gray-200 dark:border-gray-700">';
    html += '<div class="flex flex-wrap justify-between items-start gap-3">';
    html += '<div class="flex items-center gap-6 flex-wrap">';
    html += '<div class="text-center"><div class="text-2xl font-bold text-green-600">' + completedCount + '</div><div class="text-xs text-gray-500">✅ выполнено</div></div>';
    html += '<div class="text-center"><div class="text-2xl font-bold text-blue-600">' + activeCount + '</div><div class="text-xs text-gray-500">⏳ в процессе</div></div>';
    html += '<div class="text-center"><div class="text-2xl font-bold ' + (overdueCount > 0 ? 'text-red-600' : 'text-gray-400') + '">' + overdueCount + '</div><div class="text-xs text-gray-500">⚠️ просрочено</div></div>';
    html += '<div class="text-center"><div class="text-2xl font-bold text-purple-600">' + totalTasks + '</div><div class="text-xs text-gray-500">📋 доступно</div></div>';
    html += '</div>';
    
    html += '<div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-2 min-w-[160px]">';
    html += '<div class="flex justify-between text-xs text-gray-500 dark:text-gray-400"><span>🔓 Открыто дел</span><span>' + unlockProgress.available + ' / ' + unlockProgress.total + '</span></div>';
    html += '<div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1 overflow-hidden"><div class="h-full rounded-full transition-all duration-500" style="width: ' + unlockProgress.percent + '%; background: linear-gradient(90deg, #10b981, #3b82f6);"></div></div>';
    html += '<div class="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">' + unlockProgress.nextUnlockMessage + '</div>';
    html += '</div>';
    html += '</div>';
    
    html += '<div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center">';
    html += '<div class="text-sm text-gray-500 dark:text-gray-400">📦 ' + (activePackageNames.join(', ') || 'Базовый') + '</div>';
    html += '<div class="text-xs text-gray-400 dark:text-gray-500">🏆 Уровень ' + user.level + ' · ' + unlockProgress.percent + '% дел открыто</div>';
    html += '</div>';
    html += '</div>';

    // ПЛАШКА О НОВЫХ ДЕЛАХ
    html += renderNewTasksNotification();

    // ТАБЫ
    html += '<div class="flex gap-2 mb-5 bg-white dark:bg-gray-800 rounded-2xl p-1.5 shadow-sm border border-gray-200 dark:border-gray-700">';
    html += '<button class="my-tasks-tab flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ' + (currentTab === 'all' ? 'bg-green-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700') + '" data-tab="all">🎯 Все дела <span class="text-xs opacity-70 ml-1">(' + totalTasks + ')</span></button>';
    html += '<button class="my-tasks-tab flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ' + (currentTab === 'active' ? 'bg-green-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700') + '" data-tab="active">⏳ В процессе <span class="text-xs opacity-70 ml-1">(' + activeCount + ')</span></button>';
    html += '<button class="my-tasks-tab flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ' + (currentTab === 'completed' ? 'bg-green-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700') + '" data-tab="completed">✅ Выполнено <span class="text-xs opacity-70 ml-1">(' + completedCount + ')</span></button>';
    html += '</div>';

    // ФИЛЬТРЫ
    if (currentTab === 'all') {
        html += '<div class="filters-panel bg-white dark:bg-gray-800 rounded-2xl p-4 mb-5 shadow-sm border border-gray-200 dark:border-gray-700">';
        html += '<div class="flex flex-wrap gap-3 items-center">';
        html += '<div class="flex-1 min-w-[180px]"><input type="text" id="taskSearchInput" placeholder="🔍 Поиск дел..." class="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition" value="' + searchQuery + '"></div>';
        
        html += '<select id="categoryFilter" class="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition">';
        html += '<option value="all">📂 Все категории</option>';
        var categories = getUniqueCategories();
        for (var i = 0; i < categories.length; i++) {
            var cat = categories[i];
            html += '<option value="' + cat + '" ' + (currentCategoryFilter === cat ? 'selected' : '') + '>' + cat + '</option>';
        }
        html += '</select>';
        
        html += '<select id="difficultyFilter" class="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition">';
        html += '<option value="all">⭐ Все сложности</option>';
        html += '<option value="1" ' + (currentDifficultyFilter === '1' ? 'selected' : '') + '>★ Простые</option>';
        html += '<option value="2" ' + (currentDifficultyFilter === '2' ? 'selected' : '') + '>★★ Средние</option>';
        html += '<option value="3" ' + (currentDifficultyFilter === '3' ? 'selected' : '') + '>★★★ Сложные</option>';
        html += '<option value="4" ' + (currentDifficultyFilter === '4' ? 'selected' : '') + '>★★★★ Экспертные</option>';
        html += '<option value="5" ' + (currentDifficultyFilter === '5' ? 'selected' : '') + '>★★★★★ Эпические</option>';
        html += '</select>';
        
        html += '<select id="sortFilter" class="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition">';
        html += '<option value="default">📊 По умолчанию</option>';
        html += '<option value="unlock_asc">🔓 Сначала новые</option>';
        html += '<option value="difficulty_asc">⭐ Сначала простые</option>';
        html += '<option value="difficulty_desc">⭐ Сначала сложные</option>';
        html += '</select>';
        
        html += '<button id="clearFiltersBtn" class="px-4 py-2.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-xl text-sm text-gray-700 dark:text-gray-200 transition">✕ Сбросить</button>';
        html += '</div></div>';
    }

    // СПИСОК ДЕЛ
    html += '<div id="tasksList" class="space-y-3">';
    html += renderTasksList();
    html += '</div>';
    
    html += '</div>';

    container.innerHTML = html;

    // ============================================================
    // ОБРАБОТЧИКИ СОБЫТИЙ
    // ============================================================

    document.querySelectorAll('.my-tasks-tab').forEach(function(btn) {
        btn.addEventListener('click', function() {
            currentTab = this.dataset.tab;
            renderMyTasks();
        });
    });

    var searchInput = document.getElementById('taskSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchQuery = e.target.value;
            renderTasksListOnly();
        });
    }

    var categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function(e) {
            currentCategoryFilter = e.target.value;
            renderTasksListOnly();
        });
    }

    var difficultyFilter = document.getElementById('difficultyFilter');
    if (difficultyFilter) {
        difficultyFilter.addEventListener('change', function(e) {
            currentDifficultyFilter = e.target.value;
            renderTasksListOnly();
        });
    }

    var sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            renderTasksListOnly();
        });
    }

    var clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            searchQuery = '';
            currentCategoryFilter = 'all';
            currentDifficultyFilter = 'all';
            renderMyTasks();
        });
    }

    // Обработчики кнопок
    document.querySelectorAll('.purchase-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.dataset.id);
            var task = getTaskById(id);
            if (task) purchaseTask(task);
        });
    });

    document.querySelectorAll('.complete-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.dataset.id);
            completeActiveTask(id);
        });
    });

    document.querySelectorAll('.surrender-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.dataset.id);
            surrenderTask(id);
        });
    });

    document.querySelectorAll('.cancel-task-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.dataset.id);
            cancelActiveTaskForCoins(id);
        });
    });

    document.querySelectorAll('.repurchase-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(this.dataset.id);
            var task = user.completedTasks.find(function(t) { return t.id === id; });
            if (task) repurchaseTask(task);
        });
    });

    document.querySelectorAll('.task-item').forEach(function(item) {
        item.addEventListener('click', function() {
            var id = parseInt(this.dataset.id);
            var tab = this.dataset.tab;
            if (tab === 'all') {
                var task = getTaskById(id);
                if (task) openTaskDetail(task);
            } else if (tab === 'active') {
                openActiveTaskDetail(id);
            } else if (tab === 'completed') {
                openCompletedTaskDetail(id);
            }
        });
    });
}

// ============================================================
// ПЛАШКА О НОВЫХ ДЕЛАХ
// ============================================================

function renderNewTasksNotification() {
    var userLevel = user.level || 1;
    var totalTasks = TASKS_DB.length;
    var availableTasks = TASKS_DB.filter(function(t) {
        return (t.unlockLevel || 1) <= userLevel;
    }).length;
    var percent = Math.min(100, Math.round((availableTasks / totalTasks) * 100));
    
    var newTasksCount = TASKS_DB.filter(function(t) {
        return (t.unlockLevel || 1) === userLevel && !user.purchasedTasks.includes(t.id);
    }).length;
    
    if (newTasksCount === 0 || percent >= 100) return '';
    
    return '<div class="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-5 text-center">' +
        '<div class="flex items-center justify-center gap-3 flex-wrap">' +
        '<span class="text-2xl">🎉</span>' +
        '<div><span class="font-bold text-green-700 dark:text-green-300">Уровень ' + userLevel + '!</span><span class="text-gray-600 dark:text-gray-300"> Открылось <strong>' + newTasksCount + '</strong> новых дел</span></div>' +
        '<button onclick="window.switchTab(\'myTasks\')" class="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm transition">Смотреть</button>' +
        '</div></div>';
}

// ============================================================
// РЕНДЕР СПИСКА ДЕЛ
// ============================================================

function renderTasksList() {
    var tasks = [];

    if (currentTab === 'all') {
        tasks = getAvailableTasks();
    } else if (currentTab === 'active') {
        tasks = user.activeTasks.map(function(t) { return Object.assign({}, t, { _tab: 'active' }); });
    } else if (currentTab === 'completed') {
        tasks = user.completedTasks.map(function(t) { return Object.assign({}, t, { _tab: 'completed' }); });
    }

    if (tasks.length === 0) {
        return getEmptyStateHtml();
    }

    var html = '';
    for (var i = 0; i < tasks.length; i++) {
        html += renderTaskItem(tasks[i]);
    }
    return html;
}

function renderTasksListOnly() {
    var container = document.getElementById('tasksList');
    if (container) {
        container.innerHTML = renderTasksList();
    }
}

// ============================================================
// ПУСТОЕ СОСТОЯНИЕ
// ============================================================

function getEmptyStateHtml() {
    var messages = {
        all: '<div class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"><div class="text-6xl mb-4">🎯</div><p class="text-gray-500 dark:text-gray-400">Нет доступных дел</p><p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Попробуйте активировать другие сборники</p><button onclick="window.switchTab(\'packages\')" class="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm transition">📦 Перейти к сборникам</button></div>',
        active: '<div class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"><div class="text-6xl mb-4">⏳</div><p class="text-gray-500 dark:text-gray-400">У вас нет активных дел</p><p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Купите дело в разделе «Все дела»</p><button onclick="currentTab=\'all\'; renderMyTasks()" class="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm transition">🎯 Перейти к делам</button></div>',
        completed: '<div class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"><div class="text-6xl mb-4">✅</div><p class="text-gray-500 dark:text-gray-400">Вы ещё не выполнили ни одного дела</p><p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Вперёд, к новым свершениям!</p></div>'
    };
    return messages[currentTab] || messages.all;
}

// ============================================================
// ОТРИСОВКА КАРТОЧКИ ДЕЛА
// ============================================================

function renderTaskItem(task) {
    if (currentTab === 'all') {
        return renderShopTaskItem(task);
    } else if (currentTab === 'active') {
        return renderActiveTaskItem(task);
    } else {
        return renderCompletedTaskItem(task);
    }
}

// ============================================================
// КАРТОЧКА ДЕЛА В МАГАЗИНЕ
// ============================================================

function renderShopTaskItem(task) {
    var categoryColor = getCategoryColor(task.category);
    var escapedText = escapeHtml(task.text);
    var escapedCategory = escapeHtml(task.category);
    var unlockLevel = task.unlockLevel || 1;
    var isNew = unlockLevel === user.level && !user.purchasedTasks.includes(task.id);
    var categoryIcon = getCategoryIcon(task.category);
    var isEpic = task.difficulty === 5;
    
    var difficultyLabels = ['', '★ Простое', '★★ Среднее', '★★★ Сложное', '★★★★ Экспертное', '★★★★★ Эпическое'];
    var difficultyLabel = difficultyLabels[task.difficulty] || '';
    
    return '<div class="task-card-container w-full" data-difficulty="' + task.difficulty + '" data-id="' + task.id + '" style="perspective: 1000px; height: 100%; min-height: 350px;">' +
        '<div class="task-card-flipper" style="position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1); transform-style: preserve-3d; cursor: pointer;">' +
        
        '<!-- ЛИЦЕВАЯ СТОРОНА -->' +
        '<div class="task-card-front" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 1rem; border-left: 6px solid ' + categoryColor + '; padding: 1.25rem; box-shadow: 0 4px 15px rgba(0,0,0,0.08); transform: rotateY(0deg); display: flex; flex-direction: column; transition: box-shadow 0.3s ease;">' +
        
        '<div class="flex justify-between items-start mb-2">' +
        '<span class="category-tag text-xs px-2.5 py-1 rounded-full font-medium" style="background: ' + categoryColor + '15; color: ' + categoryColor + ';">' + categoryIcon + ' ' + escapedCategory + '</span>' +
        '<div class="flex items-center gap-1"><span class="difficulty-' + task.difficulty + ' text-sm font-semibold">' + "★".repeat(task.difficulty) + '</span><span class="text-xs text-gray-400">' + task.difficulty + '/5</span>' + (isEpic ? '<span class="epic-badge">🔥 Эпик</span>' : '') + '</div>' +
        '</div>' +
        
        '<h3 class="font-bold text-base leading-snug text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 flex-1" style="color: #1a1a1a !important;">' + escapedText + '</h3>' +
        
        '<div class="mt-auto">' +
        '<div class="flex justify-between items-center mb-3">' +
        '<div class="flex items-center gap-2"><span class="coin inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 px-3 py-1 rounded-full text-sm font-bold">💰 ' + task.price + '</span>' + (task.isFree ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🎁 Бесплатно</span>' : '') + (isNew ? '<span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full animate-pulse">🆕 Новое!</span>' : '') + '</div>' +
        '<div class="text-right"><div class="text-xs text-gray-500">⭐ +' + task.baseXP + ' XP</div></div>' +
        '</div>' +
        
        '<button class="purchase-btn w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:scale-105 hover:shadow-lg active:scale-95" style="background: ' + categoryColor + ';" data-id="' + task.id + '">' + (task.isFree ? '🎁 ВЗЯТЬ' : 'КУПИТЬ — ' + task.price + ' ₿') + '</button>' +
        '<div class="text-center mt-2 text-xs text-gray-400">👆 Нажмите для деталей</div>' +
        '</div></div>' +
        
        '<!-- ОБОРОТНАЯ СТОРОНА -->' +
        '<div class="task-card-back" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 4px 15px rgba(0,0,0,0.08); transform: rotateY(180deg); overflow-y: auto; display: flex; flex-direction: column; border-top: 6px solid ' + categoryColor + ';">' +
        
        '<div class="flex justify-between items-start mb-2">' +
        '<span class="category-tag text-xs px-2.5 py-1 rounded-full font-medium" style="background: ' + categoryColor + '15; color: ' + categoryColor + ';">' + categoryIcon + ' ' + escapedCategory + '</span>' +
        '<span class="difficulty-' + task.difficulty + ' text-sm font-semibold">' + "★".repeat(task.difficulty) + '</span>' +
        '</div>' +
        
        '<h3 class="font-bold text-base leading-snug text-gray-900 dark:text-gray-100 mb-3" style="color: #1a1a1a !important;">' + escapedText + '</h3>' +
        
        '<div class="space-y-2 text-sm flex-1">' +
        '<div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700"><span class="text-gray-500">⭐ Сложность</span><span class="text-gray-800 dark:text-gray-200 font-medium">' + difficultyLabel + '</span></div>' +
        '<div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700"><span class="text-gray-500">💰 Цена</span><span class="text-gray-800 dark:text-gray-200 font-medium">' + task.price + ' ₿</span></div>' +
        '<div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700"><span class="text-gray-500">🎁 Награда</span><span class="text-green-600 font-medium">' + task.baseReward + ' ₿</span></div>' +
        '<div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700"><span class="text-gray-500">⭐ Опыт</span><span class="text-gray-800 dark:text-gray-200 font-medium">+' + task.baseXP + ' XP</span></div>' +
        '<div class="flex justify-between py-1"><span class="text-gray-500">🔓 Уровень открытия</span><span class="text-gray-800 dark:text-gray-200 font-medium">' + unlockLevel + '</span></div>' +
        (isEpic ? '<div class="mt-2 text-center"><span class="text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-amber-900 px-3 py-1 rounded-full font-bold animate-pulse">⚡ ЭПИЧЕСКОЕ ДЕЛО ⚡</span></div>' : '') +
        (isNew ? '<div class="mt-2 text-center"><span class="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full animate-pulse">🆕 Новое!</span></div>' : '') +
        '</div>' +
        
        '<div class="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">' +
        '<button class="purchase-btn w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:scale-105 hover:shadow-lg active:scale-95" style="background: ' + categoryColor + ';" data-id="' + task.id + '">' + (task.isFree ? '🎁 ВЗЯТЬ' : 'КУПИТЬ — ' + task.price + ' ₿') + '</button>' +
        '</div></div></div></div>';
}

// ============================================================
// КАРТОЧКА АКТИВНОГО ДЕЛА
// ============================================================

function renderActiveTaskItem(task) {
    var categoryColor = getCategoryColor(task.category);
    var remaining = getRemainingTime(task.deadline);
    var isLate = remaining.expired;
    var escapedText = escapeHtml(task.text);
    var escapedCategory = escapeHtml(task.category);
    var timeColor = isLate ? 'text-red-600' : (remaining.hours < 24 ? 'text-orange-500' : 'text-gray-500');

    return '<div class="task-item bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 hover:shadow-md transition-all cursor-pointer" data-id="' + task.id + '" data-tab="active" style="border-left-color: ' + (isLate ? '#ef4444' : categoryColor) + ';">' +
        '<div class="flex flex-wrap justify-between items-start gap-3">' +
        '<div class="flex-1 min-w-0">' +
        '<div class="flex items-center gap-2 flex-wrap mb-1">' +
        '<span class="category-tag text-xs px-2.5 py-1 rounded-full font-medium" style="background: ' + categoryColor + '15; color: ' + categoryColor + ';">' + escapedCategory + '</span>' +
        '<span class="difficulty-' + task.difficulty + ' text-sm font-semibold">' + "★".repeat(task.difficulty) + '</span>' +
        (isLate ? '<span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">⚠️ ПРОСРОЧЕНО</span>' : '') +
        '</div>' +
        '<div class="font-semibold text-gray-800 dark:text-gray-200">' + escapedText + '</div>' +
        '<div class="flex items-center gap-3 mt-1 text-sm ' + timeColor + '"><span>⏰ ' + formatDateTime(task.deadline) + '</span>' + (!isLate ? '<span>· Осталось: ' + remaining.hours + 'ч ' + remaining.minutes + 'м</span>' : '') + '</div>' +
        '</div>' +
        '<div class="flex items-center gap-2 flex-shrink-0 flex-wrap">' +
        '<div class="text-right mr-2"><div class="font-bold text-green-600 dark:text-green-400">' + task.expectedReward + ' ₿</div><div class="text-xs text-gray-500 dark:text-gray-400">⭐ +' + task.baseXP + '</div></div>' +
        '<button class="complete-btn px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm transition hover:scale-105" data-id="' + task.id + '" title="Выполнить">✅</button>' +
        '<button class="surrender-btn px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-sm transition" data-id="' + task.id + '" title="Сдаться">🏳️</button>' +
        '<button class="cancel-task-btn px-3.5 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-xl text-sm transition" data-id="' + task.id + '" title="Отменить за монеты">⏭️</button>' +
        '</div></div></div>';
}

// ============================================================
// КАРТОЧКА ВЫПОЛНЕННОГО ДЕЛА
// ============================================================

function renderCompletedTaskItem(task) {
    var categoryColor = getCategoryColor(task.category);
    var escapedText = escapeHtml(task.text);
    var escapedCategory = escapeHtml(task.category);
    var isSurrendered = task.type === 'surrendered' || task.surrendered === true;
    var isLate = task.isLate === true;

    var statusBadge = '';
    var borderColor = '#10b981';
    if (isSurrendered) {
        statusBadge = '<span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🏳️ Сдано</span>';
        borderColor = '#ef4444';
    } else if (isLate) {
        statusBadge = '<span class="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">⏰ Просрочка</span>';
        borderColor = '#f59e0b';
    } else {
        statusBadge = '<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Вовремя</span>';
    }

    var canRepurchase = task.type !== 'urgent' && task.type !== 'random_quest' && task.type !== 'surrendered' && (task.repurchaseCount || 0) < 3;

    return '<div class="task-item bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 hover:shadow-md transition-all cursor-pointer" data-id="' + task.id + '" data-tab="completed" style="border-left-color: ' + borderColor + ';">' +
        '<div class="flex flex-wrap justify-between items-start gap-3">' +
        '<div class="flex-1 min-w-0">' +
        '<div class="flex items-center gap-2 flex-wrap mb-1">' +
        '<span class="category-tag text-xs px-2.5 py-1 rounded-full font-medium" style="background: ' + categoryColor + '15; color: ' + categoryColor + ';">' + escapedCategory + '</span>' +
        '<span class="difficulty-' + task.difficulty + ' text-sm font-semibold">' + "★".repeat(task.difficulty) + '</span>' +
        statusBadge +
        '</div>' +
        '<div class="font-semibold text-gray-800 dark:text-gray-200">' + escapedText + '</div>' +
        '<div class="text-sm text-gray-500 dark:text-gray-400 mt-1">📅 ' + formatDateTime(task.completedAt) + '</div>' +
        (task.note ? '<div class="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">📝 ' + escapeHtml(task.note.substring(0, 80)) + (task.note.length > 80 ? '...' : '') + '</div>' : '') +
        '</div>' +
        '<div class="flex items-center gap-2 flex-shrink-0 flex-wrap">' +
        '<div class="text-right mr-2"><div class="font-bold text-green-600 dark:text-green-400">' + (task.actualReward || task.reward || 0) + ' ₿</div>' + (task.xp ? '<div class="text-xs text-gray-500 dark:text-gray-400">⭐ +' + task.xp + '</div>' : '') + '</div>' +
        (canRepurchase ? '<button class="repurchase-btn px-3.5 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl text-sm transition" data-id="' + task.id + '" title="Пройти снова">🔄</button>' : '') +
        '</div></div></div>';
}

// ============================================================
// ПОЛУЧЕНИЕ ДАННЫХ
// ============================================================

function getUniqueCategories() {
    var cats = new Set();
    for (var i = 0; i < TASKS_DB.length; i++) {
        cats.add(TASKS_DB[i].category);
    }
    return Array.from(cats).sort();
}

function getAvailableTasks() {
    var userLevel = user.level || 1;
    
    var tasks = TASKS_DB.filter(function(t) {
        return !user.purchasedTasks.includes(t.id) && 
               isTaskFromActivePackages(t) &&
               (t.unlockLevel || 1) <= userLevel;
    });
    
    if (searchQuery) {
        var q = searchQuery.toLowerCase().trim();
        tasks = tasks.filter(function(t) {
            return t.text.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
        });
    }
    
    if (currentCategoryFilter !== 'all') {
        tasks = tasks.filter(function(t) {
            return t.category === currentCategoryFilter;
        });
    }
    
    if (currentDifficultyFilter !== 'all') {
        tasks = tasks.filter(function(t) {
            return t.difficulty === parseInt(currentDifficultyFilter);
        });
    }
    
    var sortValue = document.getElementById('sortFilter') ? document.getElementById('sortFilter').value : 'default';
    switch (sortValue) {
        case 'unlock_asc':
            tasks.sort(function(a, b) { return (a.unlockLevel || 1) - (b.unlockLevel || 1); });
            break;
        case 'difficulty_asc':
            tasks.sort(function(a, b) { return a.difficulty - b.difficulty; });
            break;
        case 'difficulty_desc':
            tasks.sort(function(a, b) { return b.difficulty - a.difficulty; });
            break;
        default:
            tasks.sort(function(a, b) {
                var aLevel = a.unlockLevel || 1;
                var bLevel = b.unlockLevel || 1;
                if (aLevel !== bLevel) return aLevel - bLevel;
                return a.difficulty - b.difficulty;
            });
    }
    
    return tasks;
}

function getAvailableTasksCount() {
    var userLevel = user.level || 1;
    return TASKS_DB.filter(function(t) {
        return !user.purchasedTasks.includes(t.id) && 
               isTaskFromActivePackages(t) &&
               (t.unlockLevel || 1) <= userLevel;
    }).length;
}

function isTaskFromActivePackages(task) {
    if (!task.packageId || task.packageId === 'core') return true;
    var active = getActivePackages();
    return active.indexOf(task.packageId) !== -1;
}

// ============================================================
// ПОКУПКА ДЕЛА
// ============================================================

export function purchaseTask(task) {
    if (task.difficulty > 1 && user.coins < task.price) {
        showToast('❌ Не хватает монет! Нужно ' + task.price, 'error');
        return;
    }

    selectedTaskForPurchase = task;

    var modalTitle = document.getElementById('modalTaskTitle');
    if (modalTitle) modalTitle.innerText = task.text;

    var optionsDiv = document.getElementById('deadlineOptions');
    if (optionsDiv) {
        optionsDiv.innerHTML = '';
        var deadlineKeys = Object.keys(DEADLINE_MULTIPLIERS);
        for (var i = 0; i < deadlineKeys.length; i++) {
            var days = deadlineKeys[i];
            var cfg = DEADLINE_MULTIPLIERS[days];
            var finalReward = Math.floor(task.baseReward * cfg.multiplier);
            optionsDiv.innerHTML += '<label class="flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition deadline-option mb-2 ' + (days == 7 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600') + '">' +
                '<div><span class="font-bold text-gray-800 dark:text-gray-200">' + cfg.icon + ' ' + cfg.name + '</span><div class="text-sm text-gray-500 dark:text-gray-400">×' + cfg.multiplier + '</div></div>' +
                '<div class="text-right"><div class="font-bold text-green-600 dark:text-green-400">' + finalReward + ' ₿</div><div class="text-xs text-red-500">штраф: ' + (cfg.penalty * 100) + '%</div></div>' +
                '<input type="radio" name="deadline" value="' + days + '" ' + (days == 7 ? 'checked' : '') + ' class="ml-3 w-4 h-4 accent-green-600">' +
                '</label>';
        }
    }

    showModal('deadlineModal');

    document.querySelectorAll('input[name="deadline"]').forEach(function(r) {
        r.addEventListener('change', function(e) {
            selectedDeadline = parseInt(e.target.value);
            document.querySelectorAll('.deadline-option').forEach(function(opt) {
                opt.classList.remove('border-green-500', 'bg-green-50', 'dark:bg-green-900/20');
            });
            e.target.closest('.deadline-option').classList.add('border-green-500', 'bg-green-50', 'dark:bg-green-900/20');
        });
    });

    document.getElementById('confirmDeadlineBtn').onclick = confirmPurchase;
    document.getElementById('cancelDeadlineBtn').onclick = function() { hideModal('deadlineModal'); };
}

export function confirmPurchase() {
    if (!selectedTaskForPurchase) {
        showToast('❌ Ошибка: нет выбранного задания', 'error');
        return;
    }

    var task = selectedTaskForPurchase;
    var cfg = DEADLINE_MULTIPLIERS[selectedDeadline];
    if (!cfg) {
        showToast('❌ Ошибка: неверный срок', 'error');
        return;
    }

    var expectedReward = Math.floor(task.baseReward * cfg.multiplier);

    if (task.difficulty > 1) {
        if (!spendCoins(task.price)) {
            showToast('❌ Не хватает монет! Нужно ' + task.price, 'error');
            return;
        }
    }

    user.activeTasks.push({
        id: Date.now(),
        originalTaskId: task.id,
        text: task.text,
        category: task.category,
        difficulty: task.difficulty,
        price: task.price,
        baseReward: task.baseReward,
        baseXP: task.baseXP,
        chosenDays: selectedDeadline,
        multiplier: cfg.multiplier,
        penalty: cfg.penalty,
        expectedReward: expectedReward,
        purchasedAt: new Date().toISOString(),
        deadline: addDays(new Date(), selectedDeadline).toISOString(),
        status: "active",
        photos: [],
        location: null,
        note: ""
    });

    if (!user.purchasedTasks.includes(task.id)) user.purchasedTasks.push(task.id);
    saveUserData();

    hideModal('deadlineModal');
    selectedTaskForPurchase = null;
    showToast('✅ "' + task.text + '" куплено! Срок: ' + selectedDeadline + ' дней', 'success');

    renderMyTasks();
}

// ============================================================
// ВЫПОЛНЕНИЕ АКТИВНОГО ДЕЛА
// ============================================================

export function completeActiveTask(taskId) {
    var idx = user.activeTasks.findIndex(function(t) { return t.id === taskId; });
    if (idx === -1) {
        showToast('❌ Дело не найдено', 'error');
        return;
    }

    var task = user.activeTasks[idx];
    var isLate = new Date() > new Date(task.deadline);
    var reward = task.expectedReward;

    if (isLate) {
        var penaltyReduction = getPenaltyReduction();
        reward = Math.floor(task.expectedReward * (1 - task.penalty * penaltyReduction));
        if (reward < 0) reward = 0;
    }

    var xpMultiplier = getBoosterMultiplier('xp');
    var coinMultiplier = getBoosterMultiplier('coin');
    var petBonus = getPetBonus();

    var finalReward = Math.floor(reward * coinMultiplier * (1 + petBonus / 100));
    var finalXp = Math.floor(task.baseXP * xpMultiplier * (1 + petBonus / 100));

    addCoins(finalReward);
    addPoints(finalXp);
    user.stats.tasksCompleted++;

    var hour = new Date().getHours();
    if (hour >= 20 || hour < 6) {
        if (!user.stats.nightTasksCount) user.stats.nightTasksCount = 0;
        user.stats.nightTasksCount++;
        checkSecretAchievements('night', true);
    }

    updateCategoryProgress(task.category);
    checkSecretAchievements('complete', user.stats.tasksCompleted);
    checkSecretAchievements('category', task.category);
    checkSecretAchievements('difficulty', task.difficulty);

    var photoIds = [];
    if (task.photos && task.photos.length) {
        for (var i = 0; i < task.photos.length; i++) {
            var photo = task.photos[i];
            if (photo.id && typeof photo === 'object') {
                photoIds.push(photo.id);
            }
        }
    }

    user.completedTasks.unshift({
        id: Date.now(),
        originalTaskId: task.originalTaskId,
        text: task.text,
        category: task.category,
        difficulty: task.difficulty,
        expectedReward: task.expectedReward,
        actualReward: finalReward,
        xp: finalXp,
        isLate: isLate,
        penalty: isLate ? task.penalty : 0,
        chosenDays: task.chosenDays,
        completedAt: new Date().toISOString(),
        type: "normal",
        photos: task.photos || [],
        photoIds: photoIds,
        location: task.location || null,
        note: task.note || ""
    });

    user.activeTasks.splice(idx, 1);
    saveUserData();

    showToast('✅ "' + task.text + '" выполнено! +' + finalReward + ' монет', 'success');
    showConfetti();

    renderMyTasks();
    checkAchievements();
    checkAvatarRewards();
}

// ============================================================
// СДАЧА ДЕЛА
// ============================================================

export function surrenderTask(taskId) {
    var task = user.activeTasks.find(function(t) { return t.id === taskId; });
    if (!task) {
        showToast('❌ Дело не найдено', 'error');
        return;
    }
    pendingSurrenderTaskId = taskId;
    document.getElementById('surrenderTaskText').innerHTML = 
        '<div class="text-center"><div class="text-2xl font-bold text-gray-800 dark:text-gray-200">"' + escapeHtml(task.text) + '"</div>' +
        '<div class="mt-3 text-gray-600 dark:text-gray-300">💰 Возврат: <span class="font-bold text-green-600">' + Math.floor(task.price * 0.2) + '</span> монет</div>' +
        '<div class="text-sm text-gray-500 mt-1">Вы потеряете ' + Math.floor(task.price * 0.8) + ' монет</div></div>';
    showModal('surrenderModal');
}

export function confirmSurrender() {
    var idx = user.activeTasks.findIndex(function(t) { return t.id === pendingSurrenderTaskId; });
    if (idx !== -1) {
        var task = user.activeTasks[idx];
        var refund = Math.floor(task.price * 0.2);
        addCoins(refund);
        user.stats.tasksSurrendered++;

        user.completedTasks.unshift({
            id: Date.now(),
            originalTaskId: task.originalTaskId,
            text: task.text,
            category: task.category,
            difficulty: task.difficulty,
            expectedReward: task.expectedReward,
            actualReward: refund,
            xp: 0,
            isLate: false,
            surrendered: true,
            type: "surrendered",
            completedAt: new Date().toISOString(),
            photos: task.photos || [],
            location: task.location || null,
            note: task.note || ""
        });

        user.activeTasks.splice(idx, 1);
        saveUserData();
        showToast('🏳️ Сдались. Возвращено ' + refund + ' монет', 'warning');
        renderMyTasks();
        checkAchievements();
        checkSecretAchievements('surrender', user.stats.tasksSurrendered);
    }
    hideModal('surrenderModal');
    pendingSurrenderTaskId = null;
}

// ============================================================
// ОТМЕНА ДЕЛА ЗА МОНЕТЫ
// ============================================================

export function cancelActiveTaskForCoins(taskId) {
    var task = user.activeTasks.find(function(t) { return t.id === taskId; });
    if (!task) {
        showToast('❌ Дело не найдено', 'error');
        return;
    }
    var cost = Math.floor(task.price * 0.8);
    if (user.coins < cost) {
        showToast('❌ Не хватает монет! Нужно ' + cost, 'error');
        return;
    }
    if (spendCoins(cost)) {
        user.activeTasks = user.activeTasks.filter(function(t) { return t.id !== taskId; });
        saveUserData();
        renderMyTasks();
        showToast('⏭️ Дело "' + task.text + '" отменено за ' + cost + ' монет', 'success');
    }
}

// ============================================================
// ПОВТОР ДЕЛА
// ============================================================

export function repurchaseTask(completedTask) {
    var orig = getTaskById(completedTask.originalTaskId);
    if (!orig) {
        showToast('❌ Исходное дело не найдено', 'error');
        return;
    }

    var repCount = completedTask.repurchaseCount || 0;
    if (repCount >= 3) {
        showToast('⚠️ Максимум 3 повтора!', 'error');
        return;
    }

    var price = Math.floor(orig.price * 0.5);
    if (user.coins < price) {
        showToast('❌ Не хватает монет! Нужно ' + price, 'error');
        return;
    }

    user.coins -= price;
    user.stats.tasksRepurchased++;

    var cfg = DEADLINE_MULTIPLIERS[7];
    user.activeTasks.push({
        id: Date.now(),
        originalTaskId: orig.id,
        text: orig.text,
        category: orig.category,
        difficulty: orig.difficulty,
        price: price,
        baseReward: orig.baseReward,
        baseXP: orig.baseXP,
        chosenDays: 7,
        multiplier: cfg.multiplier,
        penalty: cfg.penalty,
        expectedReward: Math.floor(orig.baseReward * cfg.multiplier),
        purchasedAt: new Date().toISOString(),
        deadline: addDays(new Date(), 7).toISOString(),
        status: "active",
        photos: [],
        location: null,
        note: ""
    });

    var histTask = user.completedTasks.find(function(t) { return t.id === completedTask.id; });
    if (histTask) histTask.repurchaseCount = repCount + 1;

    saveUserData();
    showToast('🔄 "' + orig.text + '" повторно куплено за ' + price + ' монет', 'success');
    renderMyTasks();
    checkSecretAchievements('repurchase', user.stats.tasksRepurchased);
}

// ============================================================
// ОТКРЫТИЕ ДЕТАЛЕЙ
// ============================================================

function openTaskDetail(task) {
    var categoryColor = getCategoryColor(task.category);
    var header = document.getElementById('detailHeader');
    if (header) header.style.background = 'linear-gradient(135deg, ' + categoryColor + ', ' + categoryColor + 'cc)';

    document.getElementById('detailCategoryBadge').innerHTML = task.category;
    document.getElementById('detailTitle').innerHTML = escapeHtml(task.text);

    document.getElementById('detailContent').innerHTML = 
        '<div class="space-y-4">' +
        '<div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4"><div class="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">⭐ Сложность</div><div class="text-2xl font-bold difficulty-' + task.difficulty + '">' + "★".repeat(task.difficulty) + '</div></div>' +
        '<div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4"><div class="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">💰 Цена и награда</div><div class="flex justify-between flex-wrap gap-2 text-gray-800 dark:text-gray-200"><span>💰 Цена: <strong>' + task.price + '</strong> монет</span><span>🎁 Награда: <strong class="text-green-600">' + task.baseReward + '</strong> монет</span><span>⭐ Опыт: <strong>+' + task.baseXP + '</strong> XP</span></div></div>' +
        '<div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4"><div class="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">🔓 Уровень открытия</div><div class="text-gray-800 dark:text-gray-200">Уровень ' + (task.unlockLevel || 1) + '</div></div>' +
        (task.category ? '<div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4"><div class="text-xs text-gray-500 dark:text-gray-400 uppercase mb-2">📂 Категория</div><div class="text-gray-800 dark:text-gray-200">' + escapeHtml(task.category) + '</div></div>' : '') +
        '<div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">' +
        '<button id="detailCloseBtn" class="px-5 py-2.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-xl text-gray-800 dark:text-gray-200 transition">Закрыть</button>' +
        '<button id="detailPurchaseBtn" class="px-5 py-2.5 text-white rounded-xl transition hover:scale-105" style="background: ' + categoryColor + ';">💰 Купить</button>' +
        '</div></div>';

    showModal('detailModal');

    document.getElementById('detailCloseBtn').onclick = function() { hideModal('detailModal'); };
    document.getElementById('detailPurchaseBtn').onclick = function() {
        hideModal('detailModal');
        purchaseTask(task);
    };
}

function openActiveTaskDetail(taskId) {
    var task = user.activeTasks.find(function(t) { return t.id === taskId; });
    if (!task) {
        showToast('❌ Дело не найдено', 'error');
        return;
    }
    showToast('📝 Дело: ' + task.text + ' (в разработке)', 'info');
}

function openCompletedTaskDetail(taskId) {
    var task = user.completedTasks.find(function(t) { return t.id === taskId; });
    if (!task) {
        showToast('❌ Дело не найдено', 'error');
        return;
    }
    showToast('📝 Дело: ' + task.text + ' (в разработке)', 'info');
}

// ============================================================
// ЭКСПОРТЫ
// ============================================================

export { getAvailableTasks, getAvailableTasksCount };