// js/randomQuest.js
// ============================================================
// СЛУЧАЙНОЕ ДЕЛО (РУЛЕТКА)
// ============================================================

import { user, addCoins, addPoints, saveUserData } from './user.js';
import { RANDOM_QUESTS } from './config.js';
import { showToast, showConfetti, showQuestCompleteModal } from './ui.js';
import { getBoosterMultiplier } from './boosters.js';
import { checkAchievements } from './achievements.js';
import { checkAvatarRewards } from './avatars.js';
import { renderHistory } from './history.js';

/**
 * Инициализирует случайное дело (проверяет, есть ли активное на сегодня)
 */
export function initRandomQuest() {
    const today = new Date().toISOString().split('T')[0];
    
    if (!user.randomQuest || user.randomQuestDate !== today) {
        user.randomQuest = null;
        user.randomQuestCompleted = false;
        user.randomQuestDate = today;
        saveUserData();
        renderRandomQuest();
    } else {
        renderRandomQuest();
    }
}

/**
 * Вращает рулетку и выбирает случайное дело
 */
export function spinRoulette() {
    if (user.randomQuest && !user.randomQuestCompleted && 
        user.randomQuestDate === new Date().toISOString().split('T')[0]) {
        showToast('У вас уже есть активное случайное дело на сегодня!', 'error');
        return;
    }
    
    const container = document.getElementById('randomQuestContainer');
    const spinBtn = document.getElementById('spinRouletteBtn');
    
    spinBtn.disabled = true;
    spinBtn.textContent = '🌀 ВРАЩЕНИЕ... 🌀';
    
    let spins = 0;
    const maxSpins = 15;
    const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * RANDOM_QUESTS.length);
        const tempQuest = RANDOM_QUESTS[randomIndex];
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="text-6xl mb-4 animate-spin">🎡</div>
                <div class="quest-card p-6 mb-4">
                    <div class="text-2xl mb-2">${tempQuest.text}</div>
                    <div class="flex justify-center gap-4">
                        <span class="bg-yellow-500 px-3 py-1 rounded-full">💰 ${tempQuest.reward}</span>
                        <span class="bg-blue-500 px-3 py-1 rounded-full">⭐ +${tempQuest.xp}</span>
                    </div>
                </div>
                <p class="text-gray-500">Крутим рулетку...</p>
            </div>
        `;
        spins++;
        if (spins >= maxSpins) {
            clearInterval(interval);
            const finalIndex = Math.floor(Math.random() * RANDOM_QUESTS.length);
            const finalQuest = RANDOM_QUESTS[finalIndex];
            user.randomQuest = finalQuest;
            user.randomQuestCompleted = false;
            user.randomQuestDate = new Date().toISOString().split('T')[0];
            saveUserData();
            renderRandomQuest();
            showToast('🎡 Вам выпало случайное дело!', 'success');
            spinBtn.disabled = false;
            spinBtn.textContent = '🌀 КРУТИТЬ РУЛЕТКУ 🌀';
        }
    }, 100);
}

/**
 * Отображает текущее случайное дело
 */
function renderRandomQuest() {
    const container = document.getElementById('randomQuestContainer');
    if (!container) return;
    
    if (!user.randomQuest || user.randomQuestCompleted) {
        container.innerHTML = `
            <div class="text-center py-8">
                <div class="text-6xl mb-4">🎲</div>
                <p class="text-gray-600 dark:text-gray-300 mb-4">Крутите рулетку каждый день и получайте случайное дело!</p>
                <button id="spinRouletteBtn" class="roulette-spin-btn text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition">🌀 КРУТИТЬ РУЛЕТКУ 🌀</button>
            </div>
        `;
        const newSpinBtn = document.getElementById('spinRouletteBtn');
        if (newSpinBtn) newSpinBtn.onclick = spinRoulette;
        return;
    }
    
    const quest = user.randomQuest;
    container.innerHTML = `
        <div class="text-center py-4">
            <div class="quest-card p-6 mb-4">
                <div class="text-3xl mb-3">🎯 СЛУЧАЙНОЕ ДЕЛО</div>
                <div class="text-xl font-bold mb-3">${quest.text}</div>
                <div class="flex justify-center gap-4 mb-4">
                    <span class="bg-yellow-500 px-3 py-1 rounded-full">💰 ${quest.reward}</span>
                    <span class="bg-blue-500 px-3 py-1 rounded-full">⭐ +${quest.xp}</span>
                </div>
                <div class="flex justify-center gap-3">
                    <button id="acceptQuestBtn" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full">✅ ПРИНЯТЬ</button>
                    <button id="replaceQuestBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full">🔄 ЗАМЕНИТЬ (30₿)</button>
                    <button id="skipQuestBtn" class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full">⏭️ ПРОПУСТИТЬ (50₿)</button>
                </div>
            </div>
            <p class="text-sm text-gray-500">Случайное дело обновляется раз в день</p>
        </div>
    `;
    
    document.getElementById('acceptQuestBtn').onclick = acceptRandomQuest;
    document.getElementById('replaceQuestBtn').onclick = () => {
        document.getElementById('currentQuestText').innerText = user.randomQuest.text;
        document.getElementById('replaceQuestModal').classList.remove('hidden');
    };
    document.getElementById('skipQuestBtn').onclick = () => skipUrgentForCoins();
}

/**
 * Принимает и выполняет случайное дело
 */
function acceptRandomQuest() {
    if (!user.randomQuest || user.randomQuestCompleted) return;
    
    const quest = user.randomQuest;
    const xpMultiplier = getBoosterMultiplier('xp');
    const coinMultiplier = getBoosterMultiplier('coin');
    const finalReward = Math.floor(quest.reward * coinMultiplier);
    const finalXp = Math.floor(quest.xp * xpMultiplier);
    
    addCoins(finalReward);
    addPoints(finalXp);
    user.stats.tasksCompleted++;
    user.randomQuestCompleted = true;
    
    user.completedTasks.unshift({
        id: Date.now(),
        text: quest.text,
        category: "Случайное дело",
        reward: finalReward,
        xp: finalXp,
        completedAt: new Date().toISOString(),
        type: "random_quest"
    });
    
    saveUserData();
    renderRandomQuest();
    renderHistory();
    showQuestCompleteModal(finalReward, finalXp);
    showConfetti();
    showToast(`✅ Случайное дело выполнено! +${finalReward} монет`, 'success');
    checkAchievements();
    checkAvatarRewards();
}

/**
 * Заменяет случайное дело за монеты
 */
export function replaceRandomQuest() {
    if (user.coins < 30) {
        showToast('Не хватает монет для замены! Нужно 30 монет', 'error');
        document.getElementById('replaceQuestModal').classList.add('hidden');
        return;
    }
    
    user.coins -= 30;
    const randomIndex = Math.floor(Math.random() * RANDOM_QUESTS.length);
    user.randomQuest = RANDOM_QUESTS[randomIndex];
    user.randomQuestCompleted = false;
    saveUserData();
    renderRandomQuest();
    document.getElementById('replaceQuestModal').classList.add('hidden');
    showToast('🔄 Дело заменено! -30 монет', 'success');
}

/**
 * Пропускает срочное дело за монеты
 */
export function skipUrgentForCoins() {
    if (!user.urgentTask) {
        showToast('Нет активного срочного дела!', 'error');
        return;
    }
    if (user.coins < 50) {
        showToast('Не хватает монет! Нужно 50 монет', 'error');
        return;
    }
    
    user.coins -= 50;
    delete user.urgentTask;
    saveUserData();
    document.dispatchEvent(new CustomEvent('urgentTaskUpdated'));
    showToast('⏭️ Срочное дело пропущено за 50 монет', 'success');
}