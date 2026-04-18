// js/social/friends.js
// ============================================================
// ДРУЗЬЯ — УПРАВЛЕНИЕ СПИСКОМ ДРУЗЕЙ (версия 7.4)
// ============================================================

import { user, saveUserData } from '../user.js';
import { showToast } from '../ui.js';
import { loadTestUsers, findUserById, updateTestUser } from '../testData.js';

// ============================================================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Отправляет заявку в друзья
 * @param {string} targetUserId - ID пользователя
 * @returns {boolean}
 */
export function sendFriendRequest(targetUserId) {
    // Нельзя отправить самому себе
    if (targetUserId === user.account.userId) {
        showToast('❌ Нельзя добавить самого себя', 'error');
        return false;
    }
    
    // Проверяем, не в друзьях ли уже
    if (user.friends.list.includes(targetUserId)) {
        showToast('❌ Этот пользователь уже в друзьях', 'error');
        return false;
    }
    
    // Проверяем, нет ли уже исходящей заявки
    if (user.friends.outgoing.includes(targetUserId)) {
        showToast('❌ Заявка уже отправлена', 'error');
        return false;
    }
    
    user.friends.outgoing.push(targetUserId);
    saveUserData();
    showToast(`📨 Заявка отправлена!`, 'success');
    
    // Симулируем получение заявки другим пользователем (для тестов)
    simulateIncomingRequest(targetUserId);
    
    return true;
}

/**
 * Принимает заявку в друзья
 * @param {string} sourceUserId - ID отправителя
 * @returns {boolean}
 */
export function acceptFriendRequest(sourceUserId) {
    if (!user.friends.incoming.includes(sourceUserId)) {
        showToast('❌ Заявка не найдена', 'error');
        return false;
    }
    
    user.friends.incoming = user.friends.incoming.filter(id => id !== sourceUserId);
    user.friends.list.push(sourceUserId);
    saveUserData();
    showToast(`✅ Пользователь добавлен в друзья!`, 'success');
    
    return true;
}

/**
 * Отклоняет заявку в друзья
 * @param {string} sourceUserId - ID отправителя
 * @returns {boolean}
 */
export function declineFriendRequest(sourceUserId) {
    if (!user.friends.incoming.includes(sourceUserId)) {
        showToast('❌ Заявка не найдена', 'error');
        return false;
    }
    
    user.friends.incoming = user.friends.incoming.filter(id => id !== sourceUserId);
    saveUserData();
    showToast(`❌ Заявка отклонена`, 'info');
    
    return true;
}

/**
 * Удаляет друга
 * @param {string} friendId - ID друга
 * @returns {boolean}
 */
export function removeFriend(friendId) {
    if (!user.friends.list.includes(friendId)) {
        showToast('❌ Пользователь не в списке друзей', 'error');
        return false;
    }
    
    user.friends.list = user.friends.list.filter(id => id !== friendId);
    saveUserData();
    showToast(`🚫 Пользователь удалён из друзей`, 'info');
    
    return true;
}

/**
 * Получает список друзей с их данными
 * @returns {Array} список друзей
 */
export function getFriendsList() {
    const testUsers = loadTestUsers();
    const friends = [];
    
    for (const friendId of user.friends.list) {
        const friend = findUserById(friendId);
        if (friend) {
            friends.push({
                ...friend,
                status: getOnlineStatus(friend.account.lastLoginAt)
            });
        }
    }
    
    return friends;
}

/**
 * Получает статус онлайн
 * @param {number} lastLoginAt - timestamp последнего входа
 * @returns {Object}
 */
function getOnlineStatus(lastLoginAt) {
    const now = Date.now();
    const diff = now - lastLoginAt;
    
    if (diff < 5 * 60 * 1000) {
        return { icon: '🟢', text: 'онлайн', color: 'green' };
    } else if (diff < 24 * 60 * 60 * 1000) {
        return { icon: '🟡', text: 'был сегодня', color: 'yellow' };
    } else {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return { icon: '🔴', text: `${days} дн. назад`, color: 'red' };
    }
}

/**
 * Симулирует входящую заявку (для тестов)
 */
function simulateIncomingRequest(targetUserId) {
    const targetUser = findUserById(targetUserId);
    if (targetUser && !targetUser.friends.incoming.includes(user.account.userId)) {
        targetUser.friends.incoming.push(user.account.userId);
        updateTestUser(targetUser);
    }
}

/**
 * Сбрасывает счётчик подарков в новый день
 */
export function resetGiftCounter() {
    const today = new Date().toISOString().split('T')[0];
    const lastGiftDate = user.friends.lastGiftDate ? new Date(user.friends.lastGiftDate).toISOString().split('T')[0] : null;
    
    if (lastGiftDate !== today) {
        user.friends.giftsSentToday = 0;
        user.friends.lastGiftDate = Date.now();
        saveUserData();
    }
}

// ============================================================
// ОТРИСОВКА ВКЛАДКИ ДРУЗЕЙ
// ============================================================

export function renderFriends() {
    const container = document.getElementById('friendsView');
    if (!container) return;
    
    resetGiftCounter();
    
    const friends = getFriendsList();
    const incomingRequests = user.friends.incoming || [];
    
    let html = `
        <div class="max-w-2xl mx-auto">
            <h2 class="text-xl font-bold mb-4">👥 Друзья</h2>
            
            <!-- Добавление друга -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg mb-6">
                <h3 class="font-bold mb-2">➕ Добавить друга</h3>
                <div class="flex gap-2">
                    <input type="text" id="friendSearchInput" placeholder="ID пользователя" class="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700">
                    <button id="addFriendBtn" class="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition">Добавить</button>
                </div>
                <p class="text-xs text-gray-500 mt-2">💡 ID можно найти в профиле пользователя</p>
            </div>
            
            <!-- Входящие заявки -->
            ${incomingRequests.length > 0 ? `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg mb-6">
                <h3 class="font-bold mb-2">📨 Входящие заявки (${incomingRequests.length})</h3>
                <div id="incomingRequestsList" class="space-y-2"></div>
            </div>
            ` : ''}
            
            <!-- Список друзей -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
                <h3 class="font-bold mb-2">👥 Мои друзья (${friends.length})</h3>
                <div id="friendsList" class="space-y-2">
                    ${friends.length === 0 ? '<p class="text-gray-500 text-center py-4">У вас пока нет друзей</p>' : ''}
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Заполняем список друзей
    const friendsContainer = document.getElementById('friendsList');
    if (friendsContainer && friends.length > 0) {
        let friendsHtml = '';
        for (const friend of friends) {
            friendsHtml += `
                <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div class="flex items-center gap-3 cursor-pointer view-profile-btn" data-id="${friend.account.userId}">
                        <div class="text-3xl">${friend.currentAvatar || '😀'}</div>
                        <div>
                            <div class="font-bold">${friend.account.username}</div>
                            <div class="text-xs text-gray-500">Уровень ${friend.level}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs ${friend.status.color === 'green' ? 'text-green-500' : friend.status.color === 'yellow' ? 'text-yellow-500' : 'text-gray-500'}">
                            ${friend.status.icon} ${friend.status.text}
                        </span>
                        <button class="remove-friend-btn text-red-500 hover:text-red-700 text-xl" data-id="${friend.account.userId}">🗑️</button>
                    </div>
                </div>
            `;
        }
        friendsContainer.innerHTML = friendsHtml;
    }
    
    // Заполняем входящие заявки
    if (incomingRequests.length > 0) {
        const requestsContainer = document.getElementById('incomingRequestsList');
        if (requestsContainer) {
            let requestsHtml = '';
            for (const requesterId of incomingRequests) {
                const requester = findUserById(requesterId);
                if (requester) {
                    requestsHtml += `
                        <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                            <div class="flex items-center gap-3">
                                <div class="text-3xl">${requester.currentAvatar || '😀'}</div>
                                <div>
                                    <div class="font-bold">${requester.account.username}</div>
                                    <div class="text-xs text-gray-500">Уровень ${requester.level}</div>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button class="accept-request-btn bg-green-600 text-white px-3 py-1 rounded-full text-sm hover:bg-green-700 transition" data-id="${requesterId}">✅ Принять</button>
                                <button class="decline-request-btn bg-red-600 text-white px-3 py-1 rounded-full text-sm hover:bg-red-700 transition" data-id="${requesterId}">❌ Отклонить</button>
                            </div>
                        </div>
                    `;
                }
            }
            requestsContainer.innerHTML = requestsHtml;
        }
    }
    
    // Обработчики
    document.getElementById('addFriendBtn')?.addEventListener('click', () => {
        const input = document.getElementById('friendSearchInput');
        const userId = input.value.trim();
        if (userId) {
            sendFriendRequest(userId);
            input.value = '';
            renderFriends();
        } else {
            showToast('Введите ID пользователя', 'error');
        }
    });
    
    document.querySelectorAll('.accept-request-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.id;
            acceptFriendRequest(userId);
            renderFriends();
        });
    });
    
    document.querySelectorAll('.decline-request-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.id;
            declineFriendRequest(userId);
            renderFriends();
        });
    });
    
    document.querySelectorAll('.remove-friend-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.id;
            if (confirm('Удалить пользователя из друзей?')) {
                removeFriend(userId);
                renderFriends();
            }
        });
    });
    
    document.querySelectorAll('.view-profile-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.id;
            import('./profile.js').then(m => m.showPublicProfile(userId));
        });
    });
}