// js/statistics.js
// ============================================================
// СТАТИСТИКА — ПРОГРЕСС, ДОСТИЖЕНИЯ, КАЛЕНДАРЬ, ОТКРЫТИЕ ДЕЛ
// Версия 3.1 — Исправлена работа с TASKS_DB
// ============================================================

import { user, getCurrentLevel, getNextLevel } from './user.js';
import { TASKS_DB } from './tasks.js';
import { getActivePackages, getPackageInfo } from './packageManager.js';
import { CATEGORY_ACHIEVEMENTS } from './config.js';
import { escapeHtml } from './utils.js';

// ============================================================
// СОСТОЯНИЕ
// ============================================================

let currentStatTab = 'overview';

// ============================================================
// ИМЕНА ПАКЕТОВ (ЛОКАЛЬНАЯ КОПИЯ)
// ============================================================

const PACKAGE_NAMES = {
    'core': 'Базовый',
    'travel': '🌍 Путешествия',
    'health': '💪 Спорт и здоровье',
    'cooking': '🍳 Кулинария',
    'nature': '🌿 Природа',
    'creative': '🎨 Творчество',
    'selfdev': '🧠 Саморазвитие',
    'relationships': '💕 Отношения',
    'fishing': '🎣 Рыбалка и охота',
    'extreme': '⚡ Экстрим',
    'challenges': '🎯 Челленджи'
};

function getPackageName(packageId) {
    return PACKAGE_NAMES[packageId] || packageId;
}

// ============================================================
// ПОЛУЧЕНИЕ ДАННЫХ О ПРОГРЕССЕ ОТКРЫТИЯ
// ============================================================

function getUnlockStats() {
    const userLevel = user.level || 1;
    const tasks = Array.isArray(TASKS_DB) ? TASKS_DB : [];
    const totalTasks = tasks.length;
    
    const activePackages = getActivePackages();
    if (!activePackages.includes('core')) {
        activePackages.push('core');
    }
    
    const activeTasks = tasks.filter(t => {
        const pkgId = t.packageId || 'core';
        return activePackages.includes(pkgId);
    });
    
    const levelStats = {};
    for (let lvl = 1; lvl <= 20; lvl++) {
        const count = activeTasks.filter(t => (t.unlockLevel || 1) === lvl).length;
        const unlocked = lvl <= userLevel;
        const completed = activeTasks.filter(t => {
            return (t.unlockLevel || 1) === lvl && 
                user.purchasedTasks?.includes(t.id) &&
                user.completedTasks?.some(ct => ct.originalTaskId === t.id);
        }).length;
        levelStats[lvl] = { count, unlocked, completed };
    }
    
    const nextLevel = userLevel + 1;
    const nextLevelTasks = activeTasks.filter(t => (t.unlockLevel || 1) === nextLevel);
    const nextLevelCount = nextLevelTasks.length;
    const nextLevelPreview = nextLevelTasks.slice(0, 5).map(t => t.text || '');
    
    const availableTasks = activeTasks.filter(t => (t.unlockLevel || 1) <= userLevel).length;
    const totalActiveTasks = activeTasks.length;
    const percent = totalActiveTasks > 0 ? Math.min(100, Math.round((availableTasks / totalActiveTasks) * 100)) : 0;
    
    return {
        userLevel: userLevel,
        totalTasks: totalActiveTasks,
        availableTasks: availableTasks,
        lockedTasks: totalActiveTasks - availableTasks,
        percent: percent,
        nextLevel: nextLevel,
        nextLevelCount: nextLevelCount,
        nextLevelPreview: nextLevelPreview,
        levelStats: levelStats,
        activePackages: activePackages
    };
}

// ============================================================
// ОТРИСОВКА ГЛАВНОЙ СТАТИСТИКИ
// ============================================================

export function renderStatistics() {
    const container = document.getElementById('statisticsView');
    if (!container) {
        console.warn('statisticsView not found');
        return;
    }

    const tasks = Array.isArray(TASKS_DB) ? TASKS_DB : [];
    
    const level = getCurrentLevel();
    const nextLevel = getNextLevel();
    const activePackages = getActivePackages();
    if (!activePackages.includes('core')) {
        activePackages.push('core');
    }
    
    const activeTasks = tasks.filter(t => {
        const pkgId = t.packageId || 'core';
        return activePackages.includes(pkgId);
    });
    
    const totalTasks = activeTasks.length;
    const completedTasks = user.stats?.tasksCompleted || 0;
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const achievementsCount = getTotalAchievementsCount();
    const coins = user.coins || 0;
    const streak = user.dailyStreak || 0;
    const unlockStats = getUnlockStats();

    const curPts = level?.pointsNeeded || 0;
    const nextPts = nextLevel ? nextLevel.pointsNeeded : curPts + 500;
    const progressPercent = Math.min(100, ((user.totalPoints - curPts) / (nextPts - curPts)) * 100 || 0);

    const packageNames = activePackages.map(id => {
        const pkg = getPackageInfo(id);
        return pkg ? pkg.name : id;
    });

    let html = `
        <div class="statistics-container max-w-4xl mx-auto">
            
            <!-- ВЕРХНЯЯ КАРТОЧКА ПРОГРЕССА -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-5">
                <div class="flex flex-wrap justify-between items-start gap-4">
                    <div>
                        <div class="flex items-center gap-3">
                            <div class="text-5xl">${user.currentAvatar || '🏆'}</div>
                            <div>
                                <div class="text-2xl font-bold text-gray-800 dark:text-gray-200">${level?.title || 'Новичок'}</div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">Уровень ${level?.level || 1}</div>
                            </div>
                        </div>
                        <div class="mt-3">
                            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                                <span>⭐ Опыт</span>
                                <span>${user.totalPoints || 0} / ${nextPts} XP</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-500" style="width: ${progressPercent}%; background: linear-gradient(90deg, #10b981, #3b82f6);"></div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 flex-shrink-0">
                        <div class="text-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2">
                            <div class="text-xl font-bold text-green-600 dark:text-green-400">${completedTasks}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">выполнено</div>
                        </div>
                        <div class="text-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2">
                            <div class="text-xl font-bold text-yellow-600 dark:text-yellow-400">${coins}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">монет</div>
                        </div>
                        <div class="text-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2">
                            <div class="text-xl font-bold text-orange-600 dark:text-orange-400">${streak}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">дней подряд</div>
                        </div>
                        <div class="text-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2">
                            <div class="text-xl font-bold text-purple-600 dark:text-purple-400">${achievementsCount}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">достижений</div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <span>📋 Общий прогресс</span>
                        <span>${completedTasks} / ${totalTasks} (${completionPercent}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500" style="width: ${completionPercent}%; background: linear-gradient(90deg, #10b981, #059669);"></div>
                    </div>
                </div>
                
                <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                    <span class="text-xs text-gray-500 dark:text-gray-400">📦 Активные пакеты:</span>
                    ${packageNames.length > 0 ? packageNames.map(name => 
                        `<span class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">${name}</span>`
                    ).join('') : '<span class="text-xs text-gray-400">Нет активных пакетов</span>'}
                </div>
            </div>

            <!-- ТАБЫ -->
            <div class="flex flex-wrap gap-2 mb-5 bg-white dark:bg-gray-800 rounded-2xl p-1.5 shadow-sm border border-gray-200 dark:border-gray-700">
                <button class="stat-tab flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentStatTab === 'overview' ? 'bg-green-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}" data-tab="overview">
                    📊 Общая
                </button>
                <button class="stat-tab flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentStatTab === 'unlock' ? 'bg-green-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}" data-tab="unlock">
                    🔓 Открытие <span class="text-xs opacity-70 ml-1">(${unlockStats.percent}%)</span>
                </button>
                <button class="stat-tab flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentStatTab === 'achievements' ? 'bg-green-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}" data-tab="achievements">
                    🏅 Достижения <span class="text-xs opacity-70 ml-1">(${achievementsCount})</span>
                </button>
                <button class="stat-tab flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentStatTab === 'calendar' ? 'bg-green-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}" data-tab="calendar">
                    📅 Календарь
                </button>
            </div>

            <div id="statContent">
                ${renderStatContent(unlockStats)}
            </div>
        </div>
    `;

    container.innerHTML = html;

    document.querySelectorAll('.stat-tab').forEach(function(btn) {
        btn.addEventListener('click', function() {
            currentStatTab = this.dataset.tab;
            renderStatistics();
        });
    });
}

// ============================================================
// РЕНДЕР КОНТЕНТА ВКЛАДОК
// ============================================================

function renderStatContent(unlockStats) {
    if (currentStatTab === 'overview') {
        return renderOverview(unlockStats);
    } else if (currentStatTab === 'unlock') {
        return renderUnlockTab(unlockStats);
    } else if (currentStatTab === 'achievements') {
        return renderAchievements();
    } else if (currentStatTab === 'calendar') {
        return renderCalendar();
    }
    return renderOverview(unlockStats);
}

// ============================================================
// ВКЛАДКА «ОБЩАЯ СТАТИСТИКА»
// ============================================================

function renderOverview(unlockStats) {
    const activePackages = getActivePackages();
    if (!activePackages.includes('core')) {
        activePackages.push('core');
    }
    
    const tasks = Array.isArray(TASKS_DB) ? TASKS_DB : [];
    
    const allCategoryStats = getCategoryStats();
    
    const activeCategories = new Set();
    for (const task of tasks) {
        const pkgId = task.packageId || 'core';
        if (activePackages.includes(pkgId)) {
            activeCategories.add(task.category);
        }
    }
    
    const categoryStats = allCategoryStats.filter(stat => activeCategories.has(stat.category));
    
    let packageNames = activePackages.map(function(id) {
        let pkg = getPackageInfo(id);
        return pkg ? pkg.name : id;
    });

    let packageHtml = '';
    if (activePackages.length > 0) {
        packageHtml = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">📦 Активные сборники</h3>
                <div class="flex flex-wrap gap-2">
                    ${packageNames.map(function(name) {
                        return '<span class="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">' + name + '</span>';
                    }).join('')}
                </div>
            </div>
        `;
    }

    const packageStats = getPackageStats();

    let html = `
        <div class="space-y-4">
            ${packageHtml}
            
            <!-- СТАТИСТИКА ПО ПАКЕТАМ -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">📊 Прогресс по сборникам</h3>
                ${Object.keys(packageStats).length > 0 ? `
                    <div class="space-y-3">
                        ${Object.entries(packageStats).map(([pkgId, stats]) => {
                            const pkgName = getPackageName(pkgId);
                            const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                            const color = pkgId === 'core' ? '#10b981' : '#3b82f6';
                            return `
                                <div>
                                    <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                                        <span>📦 ${pkgName}</span>
                                        <span>${stats.completed} / ${stats.total} (${percent}%)</span>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div class="h-full rounded-full transition-all duration-500" style="width: ${percent}%; background: ${color};"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                        <div class="text-4xl mb-2">📭</div>
                        <p>Нет данных по сборникам</p>
                    </div>
                `}
            </div>
            
            <!-- ПРОГРЕСС ПО КАТЕГОРИЯМ -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">📊 Прогресс по категориям</h3>
                ${categoryStats.length > 0 ? `
                    <div class="space-y-3 max-h-96 overflow-y-auto pr-2">
                        ${categoryStats.map(function(stat) {
                            return `
                                <div>
                                    <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                                        <span>${escapeHtml(stat.category)}</span>
                                        <span>${stat.completed} / ${stat.total} (${stat.percent}%)</span>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div class="h-full rounded-full transition-all duration-500" style="width: ${stat.percent}%; background: ${stat.color};"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                        <div class="text-4xl mb-2">📭</div>
                        <p>Активируйте сборники, чтобы увидеть прогресс по категориям</p>
                        <button onclick="window.switchTab('packages')" class="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm transition">
                            📦 Перейти к сборникам
                        </button>
                    </div>
                `}
            </div>

            <!-- БЫСТРАЯ СТАТИСТИКА -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400">${user.stats?.tasksCompleted || 0}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">✅ Выполнено</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${user.activeTasks?.length || 0}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">⏳ В процессе</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">${user.stats?.tasksSurrendered || 0}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">🏳️ Сдано</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">${user.stats?.urgentCompleted || 0}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">⚡ Срочных</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div class="text-2xl font-bold text-pink-600 dark:text-pink-400">${user.stats?.photosAdded || 0}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">📸 Фото</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${user.stats?.locationsAdded || 0}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">📍 Меток</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div class="text-2xl font-bold text-teal-600 dark:text-teal-400">${user.stats?.tasksRepurchased || 0}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">🔄 Повторов</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                    <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">${user.dailyStreak || 0}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">🔥 Дней подряд</div>
                </div>
            </div>
        </div>
    `;

    return html;
}

// ============================================================
// ВКЛАДКА «ОТКРЫТИЕ ДЕЛ»
// ============================================================

function renderUnlockTab(unlockStats) {
    let userLevel = unlockStats.userLevel;
    let totalTasks = unlockStats.totalTasks;
    let availableTasks = unlockStats.availableTasks;
    let lockedTasks = unlockStats.lockedTasks;
    let percent = unlockStats.percent;
    let nextLevel = unlockStats.nextLevel;
    let nextLevelCount = unlockStats.nextLevelCount;
    let nextLevelPreview = unlockStats.nextLevelPreview;
    let levelStats = unlockStats.levelStats;
    let activePackages = unlockStats.activePackages || [];

    let levelsHtml = '';
    for (let lvl = 1; lvl <= 20; lvl++) {
        let stats = levelStats[lvl] || { count: 0, unlocked: false, completed: 0 };
        let isUnlocked = lvl <= userLevel;
        let isCurrent = lvl === userLevel;
        let isNext = lvl === userLevel + 1;
        let count = stats.count || 0;
        let completed = stats.completed || 0;
        let progress = count > 0 ? Math.round((completed / count) * 100) : 0;
        
        let statusIcon = '⬜';
        let statusColor = 'bg-gray-200 dark:bg-gray-700';
        let textColor = 'text-gray-500 dark:text-gray-400';
        
        if (isUnlocked) {
            statusIcon = '✅';
            statusColor = 'bg-green-100 dark:bg-green-900/30';
            textColor = 'text-green-700 dark:text-green-300';
        } else if (isNext) {
            statusIcon = '🔓';
            statusColor = 'bg-blue-100 dark:bg-blue-900/30';
            textColor = 'text-blue-700 dark:text-blue-300';
        }
        
        let starsCount = Math.min(5, Math.round(progress / 20));
        let stars = '';
        for (let s = 0; s < 5; s++) {
            stars += s < starsCount ? '★' : '☆';
        }
        
        let currentBadge = isCurrent ? '<span class="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">ТЕКУЩИЙ</span>' : '';
        let nextBadge = isNext && !isUnlocked ? '<span class="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full animate-pulse">СЛЕДУЮЩИЙ</span>' : '';
        
        levelsHtml += `
            <div class="flex items-center gap-3 p-2 rounded-xl ${statusColor} border ${isCurrent ? 'border-green-500 dark:border-green-400' : 'border-transparent'} transition-all">
                <div class="w-8 text-center font-bold ${isCurrent ? 'text-green-600 dark:text-green-400' : textColor}">${lvl}</div>
                <div class="flex-1">
                    <div class="flex justify-between text-sm">
                        <span class="${textColor}">${statusIcon} ${count} дел</span>
                        <span class="${textColor}">${completed} выполнено</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500" style="width: ${progress}%; background: ${isUnlocked ? '#10b981' : '#3b82f6'};"></div>
                    </div>
                    <div class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">${stars}</div>
                </div>
                ${currentBadge}
                ${nextBadge}
            </div>
        `;
    }

    let nextLevelHtml = '';
    if (nextLevelCount > 0) {
        let previewHtml = nextLevelPreview.map(function(text) {
            let shortText = text.substring(0, 30) + (text.length > 30 ? '...' : '');
            return '<span class="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 border border-blue-200 dark:border-blue-800">📌 ' + escapeHtml(shortText) + '</span>';
        }).join('');
        
        if (nextLevelCount > 5) {
            previewHtml += '<span class="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-sm text-gray-500 dark:text-gray-400">+' + (nextLevelCount - 5) + ' ещё</span>';
        }
        
        nextLevelHtml = `
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                <div class="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <span class="text-sm text-blue-600 dark:text-blue-400 font-medium">🔓 Следующий уровень</span>
                        <h4 class="text-lg font-bold text-blue-800 dark:text-blue-300">Уровень ${nextLevel}</h4>
                        <p class="text-sm text-blue-600 dark:text-blue-400">Откроется ${nextLevelCount} новых дел</p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs text-blue-500 dark:text-blue-400">Повысьте уровень, чтобы открыть</span>
                    </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">${previewHtml}</div>
            </div>
        `;
    } else {
        nextLevelHtml = `
            <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 text-center">
                <div class="text-4xl mb-2">🎉</div>
                <h4 class="text-lg font-bold text-green-800 dark:text-green-300">Все дела уже открыты!</h4>
                <p class="text-sm text-green-600 dark:text-green-400">Вы достигли максимального уровня открытия</p>
            </div>
        `;
    }

    let html = `
        <div class="space-y-4">
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="font-bold text-gray-800 dark:text-gray-200">🔓 Прогресс открытия дел</h3>
                    <span class="text-sm font-bold text-green-600 dark:text-green-400">${percent}%</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500" style="width: ${percent}%; background: linear-gradient(90deg, #10b981, #3b82f6);"></div>
                </div>
                <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                    <span>Открыто: ${availableTasks}</span>
                    <span>Закрыто: ${lockedTasks}</span>
                    <span>Всего: ${totalTasks}</span>
                </div>
                <div class="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    📦 Активные пакеты: ${activePackages.map(id => getPackageName(id)).join(', ')}
                </div>
            </div>
            
            ${nextLevelHtml}
            
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">📊 Уровни открытия</h3>
                <div class="space-y-1.5 max-h-[400px] overflow-y-auto pr-2">${levelsHtml}</div>
            </div>
        </div>
    `;

    return html;
}

// ============================================================
// ВКЛАДКА «ДОСТИЖЕНИЯ»
// ============================================================

function renderAchievements() {
    let completedAchievements = user.achievements || [];
    let categoryAchievements = user.categoryAchievements || {};
    let secretAchievements = (user.secretAchievements || []).filter(function(a) { return a.completed; });

    let total = completedAchievements.length + Object.keys(categoryAchievements).length + secretAchievements.length;

    let html = `
        <div class="space-y-4">
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div class="text-4xl font-bold text-green-600 dark:text-green-400">${total}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">🏆 Всего достижений</div>
            </div>
    `;

    if (completedAchievements.length > 0) {
        html += `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">🏆 Простые достижения (${completedAchievements.length})</h3>
                <div class="flex flex-wrap gap-2">
                    ${completedAchievements.map(function(a) {
                        return '<span class="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">🎯 ' + a.id.replace(/_/g, ' ') + '</span>';
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (Object.keys(categoryAchievements).length > 0) {
        let categoryHtml = Object.entries(categoryAchievements).map(function(entry) {
            let id = entry[0];
            let level = entry[1];
            let ach = CATEGORY_ACHIEVEMENTS.find(function(a) { return a.id === id; });
            let levelNames = ['🥉 Бронза', '🥈 Серебро', '🥇 Золото', '💎 Платина'];
            if (ach) {
                return '<span class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">' + ach.name + ' — ' + levelNames[level - 1] + '</span>';
            }
            return '';
        }).join('');
        
        if (categoryHtml) {
            html += `
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">📊 Категорийные достижения (${Object.keys(categoryAchievements).length})</h3>
                    <div class="flex flex-wrap gap-2">${categoryHtml}</div>
                </div>
            `;
        }
    }

    if (secretAchievements.length > 0) {
        html += `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-gray-800 dark:text-gray-200 mb-3">🤫 Скрытые достижения (${secretAchievements.length})</h3>
                <div class="flex flex-wrap gap-2">
                    ${secretAchievements.map(function(a) {
                        return '<span class="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">' + (a.icon || '🔮') + ' ' + (a.hint || 'Секрет') + '</span>';
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (total === 0) {
        html += `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-10 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
                <div class="text-6xl mb-4">🏆</div>
                <p class="text-gray-500 dark:text-gray-400">У вас пока нет достижений</p>
                <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Выполняйте дела, чтобы открывать новые!</p>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

// ============================================================
// ВКЛАДКА «КАЛЕНДАРЬ»
// ============================================================

function renderCalendar() {
    // Инициализация календаря через динамический импорт
    setTimeout(async function() {
        let calendarGrid = document.getElementById('calendarGrid');
        if (calendarGrid) {
            try {
                const module = await import('./calendar.js');
                if (typeof module.initCalendar === 'function') {
                    module.initCalendar();
                }
            } catch (e) {
                console.warn('Calendar module not loaded:', e);
                if (calendarGrid) {
                    calendarGrid.innerHTML = `
                        <div class="col-span-7 text-center py-8 text-gray-500">
                            📅 Календарь загружается...
                            <div class="mt-2 text-sm">Попробуйте обновить страницу</div>
                        </div>
                    `;
                }
            }
        }
    }, 50);

    return `
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="text-center mb-4">
                <div class="text-2xl font-bold" id="currentMonthYear"></div>
            </div>
            <div class="calendar-grid grid grid-cols-7 gap-2" id="calendarGrid">
                <div class="col-span-7 text-center py-8 text-gray-500">
                    📅 Загрузка календаря...
                </div>
            </div>
            <div class="text-center mt-4 text-sm text-gray-500" id="superPrizeStatus"></div>
        </div>
    `;
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

function getCategoryStats() {
    const activePackages = getActivePackages();
    if (!activePackages.includes('core')) {
        activePackages.push('core');
    }
    
    const tasks = Array.isArray(TASKS_DB) ? TASKS_DB : [];
    
    const stats = {};
    const purchased = new Set(user.purchasedTasks || []);

    for (const task of tasks) {
        const pkgId = task.packageId || 'core';
        if (!activePackages.includes(pkgId)) {
            continue;
        }
        
        if (!stats[task.category]) {
            stats[task.category] = { total: 0, completed: 0 };
        }
        stats[task.category].total++;
        
        if (purchased.has(task.id)) {
            const completed = user.completedTasks?.some(t => t.originalTaskId === task.id) || false;
            if (completed) {
                stats[task.category].completed++;
            }
        }
    }

    for (const task of user.completedTasks || []) {
        const hasActiveCategory = Object.keys(stats).includes(task.category);
        if (hasActiveCategory) {
            if (!stats[task.category]) {
                stats[task.category] = { total: 0, completed: 0 };
            }
            stats[task.category].completed = Math.max(stats[task.category].completed || 0, 
                (user.completedTasks || []).filter(t => t.category === task.category).length);
        }
    }

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

    return Object.entries(stats).map(([category, data], index) => ({
        category: category,
        total: data.total || 0,
        completed: data.completed || 0,
        percent: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        color: colors[index % colors.length]
    })).sort((a, b) => b.percent - a.percent);
}

function getPackageStats() {
    const activePackages = getActivePackages();
    if (!activePackages.includes('core')) {
        activePackages.push('core');
    }
    
    const tasks = Array.isArray(TASKS_DB) ? TASKS_DB : [];
    
    const stats = {};
    const purchased = new Set(user.purchasedTasks || []);
    
    for (const task of tasks) {
        const pkgId = task.packageId || 'core';
        if (!activePackages.includes(pkgId)) {
            continue;
        }
        
        if (!stats[pkgId]) {
            stats[pkgId] = { total: 0, completed: 0, purchased: 0 };
        }
        stats[pkgId].total++;
        
        if (purchased.has(task.id)) {
            stats[pkgId].purchased++;
            const completed = user.completedTasks?.some(t => t.originalTaskId === task.id) || false;
            if (completed) {
                stats[pkgId].completed++;
            }
        }
    }
    
    return stats;
}

function getTotalAchievementsCount() {
    let simple = user.achievements ? user.achievements.length : 0;
    let category = Object.keys(user.categoryAchievements || {}).length;
    let secret = (user.secretAchievements || []).filter(function(a) { return a.completed; }).length;
    return simple + category + secret;
}

// ============================================================
// ЭКСПОРТ
// ============================================================

export function refreshStatistics() {
    renderStatistics();
}

// Автоматическое обновление
document.addEventListener('coinsUpdated', refreshStatistics);
document.addEventListener('pointsUpdated', refreshStatistics);
document.addEventListener('levelUp', refreshStatistics);
document.addEventListener('categoryAchievement', refreshStatistics);
document.addEventListener('userReset', refreshStatistics);
document.addEventListener('packagesUpdated', refreshStatistics);