// js/social/profile.js
// ============================================================
// ПУБЛИЧНЫЙ ПРОФИЛЬ — ПРОСМОТР ПРОФИЛЯ ДРУГОГО ИГРОКА (версия 7.4)
// ============================================================

import { user } from '../user.js';
import { findUserById } from '../testData.js';
import { showToast, showModal, hideModal } from '../ui.js';
import { sendFriendRequest } from './friends.js';
import { openGiftModal } from './gifts.js';

/**
 * Показывает публичный профиль пользователя
 * @param {string} userId - ID пользователя
 */
export function showPublicProfile(userId) {
    const targetUser = findUserById(userId);
    if (!targetUser) {
        showToast('Пользователь не найден', 'error');
        return;
    }
    
    const isFriend = user.friends.list.includes(userId);
    const isCurrentUser = userId === user.account.userId;
    
    // Уровни доверия
    const trustLevels = {
        newbie: { name: '🟢 Новичок', min: 0 },
        verified: { name: '🔵 Проверенный', min: 10 },
        reliable: { name: '🟡 Надёжный', min: 50 },
        expert: { name: '🟠 Эксперт', min: 100 },
        master: { name: '🔴 Мастер', min: 500 }
    };
    
    const trustLevel = trustLevels[targetUser.trust?.level] || trustLevels.newbie;
    
    let modal = document.getElementById('publicProfileModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'publicProfileModal';
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 hidden';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-4 p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">👤 Профиль</h2>
                    <button id="closePublicProfileBtn" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                <div id="publicProfileContent"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('closePublicProfileBtn')?.addEventListener('click', () => {
            hideModal('publicProfileModal');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal('publicProfileModal');
        });
    }
    
    const content = document.getElementById('publicProfileContent');
    if (!content) return;
    
    const createdAt = targetUser.account.createdAt ? new Date(targetUser.account.createdAt).toLocaleDateString('ru-RU') : '—';
    
    content.innerHTML = `
        <div class="text-center mb-4">
            <div class="text-6xl mb-2">${targetUser.currentAvatar || '😀'}</div>
            <h3 class="text-xl font-bold">${targetUser.account.username}</h3>
            <p class="text-sm text-gray-500">ID: ${targetUser.account.userId.substring(0, 16)}...</p>
        </div>
        
        <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div class="text-xl font-bold text-green-600">${targetUser.level}</div>
                <div class="text-xs text-gray-500">Уровень</div>
            </div>
            <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div class="text-xl font-bold text-blue-600">${targetUser.coins}</div>
                <div class="text-xs text-gray-500">Монет</div>
            </div>
            <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div class="text-xl font-bold text-purple-600">${targetUser.stats?.tasksCompleted || 0}</div>
                <div class="text-xs text-gray-500">Дел выполнено</div>
            </div>
            <div class="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div class="text-xl font-bold text-yellow-600">${targetUser.pet?.level || 0}</div>
                <div class="text-xs text-gray-500">Уровень питомца</div>
            </div>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 mb-4">
            <div class="flex justify-between items-center">
                <span>⭐ Доверие</span>
                <span class="font-bold">${trustLevel.name}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div class="bg-green-600 h-2 rounded-full" style="width: ${Math.min(100, (targetUser.trust?.points || 0) / 10)}%"></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500 mt-1">
                <span>${targetUser.trust?.points || 0} очков</span>
                <span>${targetUser.trust?.verifiedTasks || 0} подтверждений</span>
            </div>
        </div>
        
        <div class="flex gap-3">
            ${!isCurrentUser ? `
                ${!isFriend ? 
                    `<button id="profileAddFriendBtn" class="flex-1 bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition">➕ В друзья</button>` :
                    `<button id="profileSendGiftBtn" class="flex-1 bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition">🎁 Подарок</button>
                     <button id="profileRemoveFriendBtn" class="flex-1 bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition">🚫 Удалить</button>`
                }
            ` : ''}
            <button id="closeProfileBtn" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 transition">Закрыть</button>
        </div>
    `;
    
    showModal('publicProfileModal');
    
    if (!isCurrentUser && !isFriend) {
        document.getElementById('profileAddFriendBtn')?.addEventListener('click', () => {
            sendFriendRequest(userId);
            hideModal('publicProfileModal');
        });
    } else if (!isCurrentUser && isFriend) {
        document.getElementById('profileSendGiftBtn')?.addEventListener('click', () => {
            hideModal('publicProfileModal');
            openGiftModal(userId, targetUser.account.username);
        });
        document.getElementById('profileRemoveFriendBtn')?.addEventListener('click', () => {
            import('./friends.js').then(m => {
                m.removeFriend(userId);
                hideModal('publicProfileModal');
                showToast('Пользователь удалён из друзей', 'info');
            });
        });
    }
    
    document.getElementById('closeProfileBtn')?.addEventListener('click', () => {
        hideModal('publicProfileModal');
    });
}