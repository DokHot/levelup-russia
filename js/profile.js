// js/profile.js
// ============================================================
// ПРОФИЛЬ — ПОЛНАЯ ВЕРСИЯ С НОМЕРОМ ИГРОКА И ВЫХОДОМ
// ============================================================

import { user, saveUserData, getUsername, getCurrentLevel } from './user.js';
import { showToast } from './ui.js';
import { TASKS_DB } from './tasks.js';
import { getProfile, getTotalPlayersCount, isAuthenticated } from './supabase-client.js';

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

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

// ============================================================
// ОСНОВНАЯ ФУНКЦИЯ РЕНДЕРИНГА ПРОФИЛЯ
// ============================================================

export async function renderProfileModal() {
    const container = document.getElementById('profileModalContent');
    if (!container) {
        console.warn('profileModalContent not found');
        return;
    }
    
    // Получаем номер игрока и общее количество
    let playerNumber = '—';
    let totalPlayers = 0;
    let cloudProfile = null;
    let isCloudAuth = false;
    
    try {
        isCloudAuth = await isAuthenticated();
        if (isCloudAuth) {
            cloudProfile = await getProfile();
            if (cloudProfile) {
                playerNumber = cloudProfile.player_number || '—';
            }
            totalPlayers = await getTotalPlayersCount() || 0;
        }
    } catch (e) {
        console.warn('Не удалось получить номер игрока:', e);
    }
    
    const account = user.account || {};
    const username = getUsername();
    const userId = account.userId || 'guest_' + Math.random().toString(36).substring(2, 10);
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
    const petHunger = Math.round(pet?.stats?.hunger || 0);
    const petMood = Math.round(pet?.stats?.mood || 0);
    
    const allPets = [...(user.pet?.purchasedPets || [])];
    const premiumPets = allPets.filter(id => id === 'fennec' || id === 'phoenix').length;
    const roomsOwned = user.pet?.purchasedRooms?.length || 0;
    
    // Проверка облачной синхронизации
    const isCloudStorage = localStorage.getItem('yandex_access_token') || user.photos?.cloudEnabled;
    
    // Прогресс до следующего уровня
    const nextLevel = user.totalPoints + 500;
    const progressPercent = Math.min(100, (user.totalPoints / nextLevel) * 100);
    
    // Формируем HTML
    let html = `
        <div class="space-y-6">
            <!-- ШАПКА ПРОФИЛЯ -->
            <div class="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div class="relative">
                    <div class="text-7xl w-24 h-24 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg">
                        ${user.currentAvatar || '🏆'}
                    </div>
                    <div class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <h2 class="text-2xl font-bold">${escapeHtml(username)}</h2>
                        <button id="editNameBtn" class="text-gray-400 hover:text-gray-600 text-sm transition">✏️</button>
                        ${isGuest ? '<span class="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">👤 Гость</span>' : ''}
                        ${isCloudStorage ? '<span class="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 px-2 py-0.5 rounded-full">☁️ Синхронизация</span>' : ''}
                    </div>
                    <p class="text-sm text-gray-500">ID: ${userId.substring(0, 16)}...</p>
                    <p class="text-xs text-gray-400">В игре с ${createdAt}</p>
                </div>
            </div>
            
            <!-- НОМЕР ИГРОКА -->
            ${isCloudAuth ? `
            <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-3 text-center">
                <div class="text-2xl font-bold text-purple-600">#${playerNumber}</div>
                <div class="text-xs text-gray-500">из ${totalPlayers} зарегистрированных игроков</div>
            </div>
            ` : ''}
            
            <!-- СТАТИСТИКА -->
            <div>
                <h3 class="text-lg font-bold mb-3">📊 Статистика</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                        <div class="text-2xl font-bold text-green-600">${user.level}</div>
                        <div class="text-xs text-gray-500">Уровень</div>
                        <div class="text-xs text-gray-400">${level.title}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                        <div class="text-2xl font-bold text-blue-600">${user.coins}</div>
                        <div class="text-xs text-gray-500">Монет</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                        <div class="text-2xl font-bold text-purple-600">${completedTasks}</div>
                        <div class="text-xs text-gray-500">Выполнено дел</div>
                        <div class="text-xs text-gray-400">${completionPercent}%</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                        <div class="text-2xl font-bold text-orange-600">${loginStreak}</div>
                        <div class="text-xs text-gray-500">Дней подряд</div>
                        <div class="text-xs text-gray-400">${declension(loginStreak, 'день', 'дня', 'дней')}</div>
                    </div>
                </div>
            </div>
            
            <!-- ПРОГРЕСС ДО СЛЕДУЮЩЕГО УРОВНЯ -->
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span>⭐ Опыт</span>
                    <span>${user.totalPoints} / ${nextLevel} XP</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300" style="width: ${progressPercent}%"></div>
                </div>
            </div>
            
            <!-- ДОСТИЖЕНИЯ -->
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-bold">🏆 Достижения</h3>
                    <p class="text-sm text-gray-500">Получено: ${achievementsCount}</p>
                </div>
                <button id="goToAchievementsBtn" class="text-green-600 text-sm hover:underline">Все достижения →</button>
            </div>
            
            <!-- ПИТОМЕЦ -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-bold">🐾 Питомец</h3>
                        <p class="text-sm">${petName} • Уровень ${petLevel}</p>
                        <div class="flex gap-2 mt-1">
                            <span class="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-800 rounded-full">🍖 ${petHunger}%</span>
                            <span class="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-800 rounded-full">😊 ${petMood}%</span>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">Куплено питомцев: ${allPets.length} (${premiumPets} премиум) • Комнат: ${roomsOwned}/5</div>
                    </div>
                    <button id="goToPetBtn" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full text-sm transition">🐾 Заботиться</button>
                </div>
            </div>
            
            <!-- ДЕЙСТВИЯ -->
            <div class="grid grid-cols-2 gap-3">
                <button id="exportProfileBtn" class="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full text-sm transition">📤 Экспорт</button>
                <button id="importProfileBtn" class="bg-green-600 hover:bg-green-700 text-white py-2 rounded-full text-sm transition">📥 Импорт</button>
                <button id="resetProfileBtn" class="bg-red-600 hover:bg-red-700 text-white py-2 rounded-full text-sm transition col-span-2">⚠️ Сбросить прогресс</button>
            </div>
            
            <!-- ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ -->
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-bold text-sm">☁️ Облачное хранилище</h3>
                        <p class="text-xs text-gray-500" id="cloudStatusProfile">${isCloudStorage ? '✅ Подключено' : '❌ Не подключено'}</p>
                    </div>
                    <button id="syncProfileBtn" class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-xs transition">🔄 Синхронизировать</button>
                </div>
            </div>
            
            <!-- ВЫХОД ИЗ АККАУНТА (только для авторизованных) -->
            ${isCloudAuth ? `
            <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button id="logoutProfileBtn" class="w-full bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-full text-sm transition flex items-center justify-center gap-2">
                    🚪 Выйти из аккаунта
                </button>
                <p class="text-xs text-gray-400 text-center mt-2">Ваш прогресс сохранён в облаке</p>
            </div>
            ` : ''}
        </div>
    `;
    
    container.innerHTML = html;
    
    // ============================================================
    // ОБРАБОТЧИКИ СОБЫТИЙ
    // ============================================================
    
    // Редактирование имени
    document.getElementById('editNameBtn')?.addEventListener('click', async () => {
        const { showChangeUsernameModal } = await import('./auth.js');
        await showChangeUsernameModal();
        renderProfileModal();
    });
    
    // Переход к достижениям
    document.getElementById('goToAchievementsBtn')?.addEventListener('click', () => {
        const modal = document.getElementById('profileModal');
        if (modal) modal.classList.add('hidden');
        if (typeof window.switchTab === 'function') {
            window.switchTab('achievements');
        }
    });
    
    // Переход к питомцу
    document.getElementById('goToPetBtn')?.addEventListener('click', () => {
        const modal = document.getElementById('profileModal');
        if (modal) modal.classList.add('hidden');
        if (typeof window.switchTab === 'function') {
            window.switchTab('pet');
        }
    });
    
    // Экспорт прогресса
    document.getElementById('exportProfileBtn')?.addEventListener('click', exportProgress);
    
    // Импорт прогресса
    document.getElementById('importProfileBtn')?.addEventListener('click', importProgress);
    
    // Сброс прогресса
    document.getElementById('resetProfileBtn')?.addEventListener('click', () => {
        if (confirm('⚠️ Сбросить весь прогресс? Это нельзя отменить!')) {
            localStorage.removeItem('russia1000_user');
            showToast('Прогресс сброшен. Страница будет перезагружена', 'warning');
            setTimeout(() => location.reload(), 1500);
        }
    });
    
    // Синхронизация
    document.getElementById('syncProfileBtn')?.addEventListener('click', async () => {
        const statusEl = document.getElementById('cloudStatusProfile');
        if (statusEl) statusEl.innerHTML = '🔄 Синхронизация...';
        showToast('🔄 Синхронизация...', 'info');
        
        try {
            const { saveUserToCloud } = await import('./supabase-client.js');
            await saveUserToCloud(user);
            if (statusEl) statusEl.innerHTML = '✅ Синхронизация завершена';
            showToast('✅ Синхронизация завершена!', 'success');
        } catch (error) {
            if (statusEl) statusEl.innerHTML = '❌ Ошибка синхронизации';
            showToast('❌ Ошибка синхронизации', 'error');
        }
    });
    
    // ВЫХОД ИЗ АККАУНТА
    document.getElementById('logoutProfileBtn')?.addEventListener('click', async () => {
        if (confirm('Вы уверены, что хотите выйти из аккаунта?')) {
            try {
                const { handleLogout } = await import('./authSystem.js');
                await handleLogout();
            } catch (error) {
                console.error('Logout error:', error);
                showToast('❌ Ошибка выхода из аккаунта', 'error');
            }
        }
    });
}

// ============================================================
// ЭКСПОРТ/ИМПОРТ
// ============================================================

function exportProgress() {
    const data = {
        version: '7.6',
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
                    const currentUserId = user.account?.userId;
                    const currentUsername = user.account?.username;
                    
                    Object.assign(user, data.user);
                    
                    if (!user.account) user.account = {};
                    user.account.userId = currentUserId;
                    user.account.username = currentUsername;
                    
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
// ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ПРОФИЛЯ
// ============================================================

export function openProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        renderProfileModal();
        modal.classList.remove('hidden');
        console.log('✅ Профиль открыт');
    } else {
        console.error('❌ profileModal не найден');
    }
}