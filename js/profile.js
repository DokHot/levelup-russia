// js/profile.js — ПОЛНАЯ ВЕРСИЯ
import { user, getUsername, saveUserData, generateUserId, getCurrentLevel } from './user.js';
import { showToast } from './ui.js';
import { TASKS_DB } from './tasks.js';

export function renderProfile() {
    const container = document.getElementById('profileView');
    if (!container) return;
    
    const username = getUsername();
    const level = getCurrentLevel();
    const totalTasks = TASKS_DB.length;
    const completedTasks = user.stats.tasksCompleted;
    const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const achievementsCount = user.achievements.length + Object.keys(user.categoryAchievements).length;
    
    const pet = user.pet;
    const petName = pet?.currentPet ? (pet.customName || 'Питомец') : 'Нет питомца';
    const petLevel = pet?.level || 0;
    const allPets = user.pet?.purchasedPets?.length || 0;
    const roomsOwned = user.pet?.purchasedRooms?.length || 0;
    
    container.innerHTML = `
        <div class="max-w-2xl mx-auto space-y-6">
            <!-- Шапка профиля -->
            <div class="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-6 text-white">
                <div class="flex items-center gap-4">
                    <div class="text-7xl">${user.currentAvatar || '🏆'}</div>
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold">${escapeHtml(username)}</h2>
                        <p class="opacity-90">${level.title} • Уровень ${level.level}</p>
                        <div class="mt-2 flex gap-2">
                            <span class="bg-white/20 px-2 py-0.5 rounded-full text-sm">💰 ${user.coins} монет</span>
                            <span class="bg-white/20 px-2 py-0.5 rounded-full text-sm">⭐ ${user.totalPoints} XP</span>
                        </div>
                    </div>
                    <button id="editProfileBtn" class="bg-white/20 p-2 rounded-full hover:bg-white/30 transition">✏️</button>
                </div>
            </div>
            
            <!-- Статистика -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
                    <div class="text-3xl font-bold text-green-600">${completedTasks}</div>
                    <div class="text-sm text-gray-500">Выполнено дел</div>
                    <div class="text-xs text-gray-400">${completionPercent}%</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
                    <div class="text-3xl font-bold text-blue-600">${achievementsCount}</div>
                    <div class="text-sm text-gray-500">Достижений</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
                    <div class="text-3xl font-bold text-purple-600">${user.dailyStreak}</div>
                    <div class="text-sm text-gray-500">Дней подряд</div>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
                    <div class="text-3xl font-bold text-orange-600">${user.stats.photosAdded}</div>
                    <div class="text-sm text-gray-500">Фото</div>
                </div>
            </div>
            
            <!-- Питомец -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                <h3 class="font-bold text-lg mb-3">🐾 Питомец</h3>
                <div class="flex justify-between items-center">
                    <div><span class="font-bold">${petName}</span> • Уровень ${petLevel}</div>
                    <div class="text-right text-sm text-gray-500">Питомцев: ${allPets} | Комнат: ${roomsOwned}/5</div>
                </div>
            </div>
            
            <!-- Действия -->
            <div class="grid grid-cols-2 gap-3">
                <button id="exportDataBtn" class="bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">📤 Экспорт</button>
                <button id="importDataBtn" class="bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition">📥 Импорт</button>
                <button id="resetProgressBtn" class="bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition col-span-2">⚠️ Сбросить прогресс</button>
            </div>
        </div>
    `;
    
    document.getElementById('editProfileBtn')?.addEventListener('click', async () => {
        const { showChangeUsernameModal } = await import('./auth.js');
        await showChangeUsernameModal();
        renderProfile();
    });
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
    document.getElementById('importDataBtn')?.addEventListener('click', importProgress);
    document.getElementById('resetProgressBtn')?.addEventListener('click', () => {
        if (confirm('⚠️ Сбросить весь прогресс? Это нельзя отменить!')) {
            localStorage.removeItem('russia1000_user');
            location.reload();
        }
    });
}

function exportData() {
    const data = { user: user, exportDate: new Date().toISOString(), version: '7.5' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `russia1000_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('📦 Прогресс экспортирован!', 'success');
}

function importProgress() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.user) {
                    Object.assign(user, data.user);
                    saveUserData();
                    showToast('✅ Прогресс восстановлен! Перезагрузите страницу', 'success');
                    setTimeout(() => location.reload(), 1500);
                }
            } catch (err) { showToast('❌ Ошибка при импорте', 'error'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, (m) => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}