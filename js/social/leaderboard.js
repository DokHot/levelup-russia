// js/social/leaderboard.js
// ============================================================
// ТАБЛИЦА ЛИДЕРОВ — РЕЙТИНГ ИГРОКОВ (версия 7.4)
// ============================================================

import { user } from '../user.js';
import { loadTestUsers } from '../testData.js';
import { showToast } from '../ui.js';

let currentCategory = 'level';
let currentSortDirection = 'desc';

// Категории рейтинга
const CATEGORIES = {
    level: { name: '🏆 Уровень', key: 'level', icon: '🏆' },
    coins: { name: '💰 Богатство', key: 'coins', icon: '💰' },
    tasks: { name: '✅ Дела', key: 'stats.tasksCompleted', icon: '✅' },
    pet: { name: '🐾 Питомец', key: 'pet.level', icon: '🐾' },
    streak: { name: '🔥 Стрик', key: 'account.loginStreak', icon: '🔥' },
    trust: { name: '⭐ Доверие', key: 'trust.points', icon: '⭐' }
};

/**
 * Получает значение по пути (например, 'stats.tasksCompleted')
 */
function getValueByPath(obj, path) {
    return path.split('.').reduce((o, p) => o?.[p], obj);
}

/**
 * Получает топ игроков для таблицы лидеров
 * @param {string} category - категория
 * @param {number} limit - количество
 * @returns {Array} топ игроков
 */
export function getLeaderboardData(category = 'level', limit = 100) {
    const testUsers = loadTestUsers();
    const categoryConfig = CATEGORIES[category];
    
    if (!categoryConfig) return [];
    
    const sorted = [...testUsers].sort((a, b) => {
        let aVal = getValueByPath(a, categoryConfig.key);
        let bVal = getValueByPath(b, categoryConfig.key);
        
        if (typeof aVal === 'undefined') aVal = 0;
        if (typeof bVal === 'undefined') bVal = 0;
        
        return bVal - aVal;
    });
    
    return sorted.slice(0, limit);
}

/**
 * Получает место текущего игрока в рейтинге
 * @param {string} category - категория
 * @returns {number} место (1-индексация)
 */
export function getCurrentPlayerRank(category = 'level') {
    const testUsers = loadTestUsers();
    const categoryConfig = CATEGORIES[category];
    
    if (!categoryConfig) return 0;
    
    const sorted = [...testUsers].sort((a, b) => {
        let aVal = getValueByPath(a, categoryConfig.key);
        let bVal = getValueByPath(b, categoryConfig.key);
        if (typeof aVal === 'undefined') aVal = 0;
        if (typeof bVal === 'undefined') bVal = 0;
        return bVal - aVal;
    });
    
    const index = sorted.findIndex(u => u.account.userId === user.account.userId);
    return index !== -1 ? index + 1 : sorted.length + 1;
}

// ============================================================
// ОТРИСОВКА ТАБЛИЦЫ ЛИДЕРОВ
// ============================================================

export function renderLeaderboard() {
    const container = document.getElementById('leaderboardView');
    if (!container) return;
    
    const data = getLeaderboardData(currentCategory);
    const currentRank = getCurrentPlayerRank(currentCategory);
    
    let html = `
        <div class="max-w-2xl mx-auto">
            <h2 class="text-xl font-bold mb-4">🏆 Таблица лидеров</h2>
            
            <!-- Категории -->
            <div class="flex flex-wrap gap-2 mb-6">
    `;
    
    for (const [key, cat] of Object.entries(CATEGORIES)) {
        html += `
            <button class="leaderboard-category-btn px-4 py-2 rounded-full text-sm transition ${currentCategory === key ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}" data-category="${key}">
                ${cat.icon} ${cat.name}
            </button>
        `;
    }
    
    html += `
            </div>
            
            <!-- Таблица -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div class="divide-y divide-gray-200 dark:divide-gray-700">
                    ${data.map((player, index) => {
                        const value = getValueByPath(player, CATEGORIES[currentCategory].key);
                        const isCurrentUser = player.account.userId === user.account.userId;
                        const rank = index + 1;
                        const medal = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
                        
                        return `
                            <div class="flex items-center justify-between p-4 ${isCurrentUser ? 'bg-green-50 dark:bg-green-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer view-profile" data-id="${player.account.userId}">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 text-center font-bold ${rank <= 3 ? 'text-yellow-500' : 'text-gray-500'}">${medal}</div>
                                    <div class="text-3xl">${player.currentAvatar || '😀'}</div>
                                    <div>
                                        <div class="font-bold">${player.account.username}</div>
                                        <div class="text-xs text-gray-500">Уровень ${player.level}</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="font-bold text-lg">${value}</div>
                                    <div class="text-xs text-gray-500">${CATEGORIES[currentCategory].name}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- Текущее место -->
            <div class="mt-4 text-center text-sm text-gray-500">
                🏆 Ваше место: ${currentRank} из ${data.length}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Обработчики категорий
    document.querySelectorAll('.leaderboard-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentCategory = btn.dataset.category;
            renderLeaderboard();
        });
    });
    
    // Просмотр профиля
    document.querySelectorAll('.view-profile').forEach(el => {
        el.addEventListener('click', () => {
            const userId = el.dataset.id;
            import('./profile.js').then(m => m.showPublicProfile(userId));
        });
    });
}