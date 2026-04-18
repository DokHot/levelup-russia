// js/social/search.js
// ============================================================
// ПОИСК ИГРОКОВ — ПО ИМЕНИ ИЛИ ID (версия 7.4)
// ============================================================

import { showToast } from '../ui.js';
import { loadTestUsers, findUserById, findUsersByName } from '../testData.js';
import { sendFriendRequest } from './friends.js';

let currentSearchResults = [];

/**
 * Выполняет поиск игроков
 * @param {string} query - поисковый запрос
 * @returns {Array} результаты поиска
 */
export function searchPlayers(query) {
    if (!query || query.trim().length === 0) {
        return [];
    }
    
    const trimmedQuery = query.trim();
    
    // Сначала ищем по ID (точное совпадение)
    const byId = findUserById(trimmedQuery);
    
    // Затем по имени (частичное совпадение)
    const byName = findUsersByName(trimmedQuery);
    
    // Объединяем и убираем дубликаты
    const results = [];
    const addedIds = new Set();
    
    if (byId && !addedIds.has(byId.account.userId)) {
        results.push(byId);
        addedIds.add(byId.account.userId);
    }
    
    for (const user of byName) {
        if (!addedIds.has(user.account.userId)) {
            results.push(user);
            addedIds.add(user.account.userId);
        }
    }
    
    // Исключаем текущего пользователя
    const filtered = results.filter(r => r.account.userId !== currentUser?.account?.userId);
    
    currentSearchResults = filtered;
    return filtered;
}

let currentUser = null;

/**
 * Устанавливает текущего пользователя для поиска
 */
export function setCurrentUser(user) {
    currentUser = user;
}

// ============================================================
// ОТРИСОВКА ВКЛАДКИ ПОИСКА
// ============================================================

export function renderSearch() {
    const container = document.getElementById('searchView');
    if (!container) return;
    
    let html = `
        <div class="max-w-2xl mx-auto">
            <h2 class="text-xl font-bold mb-4">🔍 Поиск игроков</h2>
            
            <!-- Поисковая строка -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg mb-6">
                <div class="flex gap-2">
                    <input type="text" id="searchInput" placeholder="Введите имя или ID пользователя" class="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700">
                    <button id="searchBtn" class="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition">🔍 Найти</button>
                </div>
            </div>
            
            <!-- Результаты -->
            <div id="searchResults" class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
                <h3 class="font-bold mb-2">Результаты поиска</h3>
                <div id="resultsList" class="space-y-2">
                    <p class="text-gray-500 text-center py-4">Введите запрос для поиска</p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const resultsList = document.getElementById('resultsList');
    
    const performSearch = () => {
        const query = searchInput.value.trim();
        if (!query) {
            resultsList.innerHTML = '<p class="text-gray-500 text-center py-4">Введите запрос для поиска</p>';
            return;
        }
        
        const results = searchPlayers(query);
        
        if (results.length === 0) {
            resultsList.innerHTML = '<p class="text-gray-500 text-center py-4">Ничего не найдено</p>';
            return;
        }
        
        let resultsHtml = '';
        for (const player of results) {
            const isFriend = currentUser?.friends?.list?.includes(player.account.userId);
            resultsHtml += `
                <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div class="flex items-center gap-3 cursor-pointer view-profile" data-id="${player.account.userId}">
                        <div class="text-3xl">${player.currentAvatar || '😀'}</div>
                        <div>
                            <div class="font-bold">${player.account.username}</div>
                            <div class="text-xs text-gray-500">ID: ${player.account.userId.substring(0, 16)}...</div>
                            <div class="text-xs text-gray-500">Уровень ${player.level}</div>
                        </div>
                    </div>
                    ${!isFriend ? 
                        `<button class="add-friend-btn bg-green-600 text-white px-3 py-1 rounded-full text-sm hover:bg-green-700 transition" data-id="${player.account.userId}">➕ Добавить</button>` :
                        '<span class="text-green-500 text-sm">✓ В друзьях</span>'
                    }
                </div>
            `;
        }
        resultsList.innerHTML = resultsHtml;
        
        // Обработчики
        document.querySelectorAll('.add-friend-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const userId = btn.dataset.id;
                sendFriendRequest(userId);
                performSearch();
            });
        });
        
        document.querySelectorAll('.view-profile').forEach(el => {
            el.addEventListener('click', () => {
                const userId = el.dataset.id;
                import('./profile.js').then(m => m.showPublicProfile(userId));
            });
        });
    };
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}