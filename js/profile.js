// js/profile.js
// ============================================================
// ПРОФИЛЬ — ВКЛАДКА С ДАННЫМИ ПОЛЬЗОВАТЕЛЯ (версия 7.1.2)
// ============================================================

import { user, getUsername, saveUserData, generateUserId } from './user.js';
import { getCurrentLevel } from './user.js';
import { showToast } from './ui.js';
import { showChangeUsernameModal } from './auth.js';
import { TASKS_DB } from './tasks.js';

/**
 * Рендер вкладки профиля
 */
export function renderProfile() {
    const container = document.getElementById('profileView');
    if (!container) return;
    
    const account = user.account || {};
    const username = getUsername();
    const userId = account.userId || generateUserId();
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
    
    let html = `
        <div class="max-w-2xl mx-auto">
            <!-- Карточка профиля -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
                <div class="flex items-center gap-4 mb-4">
                    <div class="text-6xl">${getAvatarByUsername(username)}</div>
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold">${escapeHtml(username)}</h2>
                        <p class="text-sm text-gray-500">ID: ${userId.substring(0, 16)}...</p>
                        ${isGuest ? '<span class="inline-block mt-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">👤 Гость</span>' : ''}
                    </div>
                    <button id="editProfileBtn" class="text-gray-400 hover:text-gray-600 transition text-xl">✏️</button>
                </div>
                
                <div class="grid grid-cols-2 gap-3 text-center text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div>
                        <div class="text-gray-500">В игре с</div>
                        <div class="font-bold">${createdAt}</div>
                    </div>
                    <div>
                        <div class="text-gray-500">Стрик входов</div>
                        <div class="font-bold">🔥 ${loginStreak} ${declension(loginStreak, 'день', 'дня', 'дней')}</div>
                    </div>
                </div>
            </div>
            
            <!-- Статистика -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
                <h3 class="text-lg font-bold mb-4">📊 Статистика</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div class="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div class="text-2xl font-bold text-green-600">${completedTasks}</div>
                        <div class="text-xs text-gray-500">Выполнено дел</div>
                        <div class="text-xs text-gray-400">${completionPercent}% от всех</div>
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
            </div>
            
            <!-- Питомец -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-6">
                <h3 class="text-lg font-bold mb-4">🐾 Питомец</h3>
                <div class="flex justify-between items-center">
                    <div>
                        <div class="font-bold">${petName}</div>
                        <div class="text-sm text-gray-500">Уровень ${petLevel}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-500">Куплено питомцев: ${allPets.length}</div>
                        <div class="text-sm text-gray-500">Премиум: ${premiumPets}</div>
                        <div class="text-sm text-gray-500">Комнат: ${roomsOwned}/5</div>
                    </div>
                </div>
            </div>
            
            <!-- Экспорт/Импорт -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 class="text-lg font-bold mb-4">💾 Данные</h3>
                <div class="flex flex-wrap gap-3">
                    <button id="exportDataBtn" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition">📤 Экспорт прогресса</button>
                    <button id="importDataBtn" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full transition">📥 Импорт прогресса</button>
                </div>
                <p class="text-xs text-gray-400 mt-3 text-center">
                    💡 Экспорт создаст файл с вашим прогрессом. Импорт восстановит данные из файла.
                </p>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Обработчики
    document.getElementById('editProfileBtn')?.addEventListener('click', async () => {
        await showChangeUsernameModal();
        renderProfile();
    });
    
    document.getElementById('exportDataBtn')?.addEventListener('click', exportProgress);
    document.getElementById('importDataBtn')?.addEventListener('click', importProgress);
}

function getAvatarByUsername(username) {
    // Простая генерация аватара по имени
    const firstChar = username.charAt(0).toUpperCase();
    const emojis = ['😀', '😎', '🦊', '🐱', '🐶', '🦁', '🐼', '🐧', '🦄', '🌟', '⭐', '🔥'];
    const index = username.length % emojis.length;
    return emojis[index];
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function declension(n, one, two, five) {
    const num = Math.abs(n) % 100;
    const n1 = num % 10;
    if (num > 10 && num < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 === 1) return one;
    return five;
}

function exportProgress() {
    const data = {
        version: '7.1.2',
        exportDate: new Date().toISOString(),
        user: user
    };
    
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `russia1000_backup_${user.account?.userId || 'guest'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📦 Прогресс экспортирован!', 'success');
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
                    // Сохраняем текущий userId и имя, чтобы не потерять
                    const currentUserId = user.account?.userId;
                    const currentUsername = user.account?.username;
                    
                    // Обновляем пользователя
                    Object.assign(user, data.user);
                    
                    // Восстанавливаем account данные
                    if (!user.account) user.account = {};
                    user.account.userId = currentUserId;
                    user.account.username = currentUsername;
                    
                    saveUserData();
                    showToast('✅ Прогресс восстановлен! Перезагрузите страницу', 'success');
                    
                    // Обновляем интерфейс
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