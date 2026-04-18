// js/achievements.js
// ============================================================
// ДОСТИЖЕНИЯ — УПРАВЛЕНИЕ ВСЕМИ ТИПАМИ ДОСТИЖЕНИЙ (версия 7.1.2)
// ============================================================

import { user, addCoins, getCurrentLevel, getCategoryAchievementProgress, saveUserData } from './user.js';
import { CATEGORY_ACHIEVEMENTS } from './config.js';
import { showToast, showConfetti } from './ui.js';

let currentAchievementTab = 'normal'; // normal, category, secret

// ============================================================
// ОБЫЧНЫЕ ДОСТИЖЕНИЯ
// ============================================================

export function checkAchievements() {
    const completedCount = user.stats.tasksCompleted;
    const urgentCount = user.stats.urgentCompleted;
    const surrenderCount = user.stats.tasksSurrendered;
    const repurchaseCount = user.stats.tasksRepurchased;
    const photoCount = user.stats.photosAdded;
    const markerCount = user.stats.locationsAdded;
    const totalCoins = user.coins;
    const currentLevel = getCurrentLevel().level;
    const petsOwned = user.pet?.purchasedPets?.length || 0;
    const roomsOwned = user.pet?.purchasedRooms?.length || 0;
    const currentPet = user.pet?.currentPet;
    const freeResurrectUsed = user.pet?.freeResurrectUsed || false;
    const nightTasksCount = user.stats?.nightTasksCount || 0;
    
    const achievementsList = [
        { id: "first_task", name: "🎯 Первое дело", check: () => completedCount >= 1, reward: 50 },
        { id: "ten_tasks", name: "🔟 Десятка", check: () => completedCount >= 10, reward: 100 },
        { id: "fifty_tasks", name: "🎯 Пятидесятка", check: () => completedCount >= 50, reward: 250 },
        { id: "hundred_tasks", name: "💯 Сотня", check: () => completedCount >= 100, reward: 500 },
        { id: "two_hundred_tasks", name: "🎯 Двести", check: () => completedCount >= 200, reward: 750 },
        { id: "five_hundred_tasks", name: "🏆 Пятьсот", check: () => completedCount >= 500, reward: 1500 },
        { id: "thousand_tasks", name: "👑 Тысяча!", check: () => completedCount >= 1000, reward: 3000 },
        { id: "streak_7", name: "📅 Неделя", check: () => user.dailyStreak >= 7, reward: 100 },
        { id: "streak_30", name: "🔥 Месяц", check: () => user.dailyStreak >= 30, reward: 300 },
        { id: "urgent_hero", name: "⚡ Спасатель", check: () => urgentCount >= 5, reward: 150 },
        { id: "survivor", name: "🏳️ Выживший", check: () => surrenderCount >= 3, reward: 50 },
        { id: "repurchaser", name: "🔄 Повторитель", check: () => repurchaseCount >= 3, reward: 100 },
        { id: "level_5", name: "⭐ Профи", check: () => currentLevel >= 5, reward: 150 },
        { id: "level_10", name: "🌟 Легенда", check: () => currentLevel >= 10, reward: 300 },
        { id: "level_15", name: "🔥 Герой", check: () => currentLevel >= 15, reward: 500 },
        { id: "level_20", name: "👑 Бессмертный", check: () => currentLevel >= 20, reward: 1000 },
        { id: "first_photo", name: "📸 Первый кадр", check: () => photoCount >= 1, reward: 25 },
        { id: "ten_photos", name: "📷 Фотограф", check: () => photoCount >= 10, reward: 100 },
        { id: "fifty_photos", name: "🎥 Папарацци", check: () => photoCount >= 50, reward: 250 },
        { id: "first_marker", name: "📍 След на карте", check: () => markerCount >= 1, reward: 25 },
        { id: "ten_markers", name: "🗺️ Исследователь", check: () => markerCount >= 10, reward: 100 },
        { id: "fifty_markers", name: "🌍 Картограф", check: () => markerCount >= 50, reward: 250 },
        { id: "rich_1000", name: "💰 Богач", check: () => totalCoins >= 1000, reward: 100 },
        { id: "rich_5000", name: "💎 Магнат", check: () => totalCoins >= 5000, reward: 250 },
        { id: "rich_10000", name: "👑 Олигарх", check: () => totalCoins >= 10000, reward: 500 },
        { id: "premium_pet", name: "💎 Элитный клуб", check: () => petsOwned >= 1 && (user.pet?.purchasedPets?.includes('fennec') || user.pet?.purchasedPets?.includes('phoenix')), reward: 300 },
        { id: "luxury_room", name: "🏰 Роскошь", check: () => roomsOwned >= 1 && user.pet?.purchasedRooms?.includes('luxury_room'), reward: 200 },
        { id: "space_room", name: "🚀 Космонавт", check: () => roomsOwned >= 1 && user.pet?.purchasedRooms?.includes('space_room'), reward: 250 },
        { id: "room_collector", name: "🏠 Архитектор", check: () => roomsOwned >= 5, reward: 500 },
        { id: "fennec_night", name: "🌙 Ночной охотник", check: () => currentPet === 'fennec' && nightTasksCount >= 30, reward: 400 },
        { id: "phoenix_rebirth", name: "🔥 Возрождение", check: () => currentPet === 'phoenix' && freeResurrectUsed === true, reward: 350 }
    ];
    
    for (const ach of achievementsList) {
        if (!user.achievements.some(a => a.id === ach.id)) {
            if (ach.check()) {
                user.achievements.push({ id: ach.id, unlockedAt: new Date().toISOString() });
                addCoins(ach.reward);
                showToast(`🏆 ${ach.name}! +${ach.reward} монет`, 'success');
                showConfetti();
            }
        }
    }
    saveUserData();
}

// ============================================================
// ОТРИСОВКА ДОСТИЖЕНИЙ (С ВКЛАДКАМИ)
// ============================================================

export function renderAchievements() {
    const container = document.getElementById('achievementsView');
    if (!container) return;
    
    // Создаём структуру с вкладками
    const html = `
        <div class="achievements-container">
            <div class="flex gap-2 border-b pb-2 mb-4">
                <button class="ach-tab-btn px-4 py-2 rounded-lg ${currentAchievementTab === 'normal' ? 'bg-green-600 text-white' : 'bg-gray-200'}" data-tab="normal">🏆 Простые</button>
                <button class="ach-tab-btn px-4 py-2 rounded-lg ${currentAchievementTab === 'category' ? 'bg-green-600 text-white' : 'bg-gray-200'}" data-tab="category">📊 Категорийные</button>
                <button class="ach-tab-btn px-4 py-2 rounded-lg ${currentAchievementTab === 'secret' ? 'bg-green-600 text-white' : 'bg-gray-200'}" data-tab="secret">❓ Скрытые</button>
            </div>
            <div id="achievementsGrid" class="grid grid-cols-2 md:grid-cols-4 gap-3"></div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Обработчики вкладок
    document.querySelectorAll('.ach-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentAchievementTab = btn.dataset.tab;
            renderAchievements();
        });
    });
    
    // Рендер выбранной вкладки
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    
    if (currentAchievementTab === 'normal') {
        renderNormalAchievements(grid);
    } else if (currentAchievementTab === 'category') {
        renderCategoryAchievements(grid);
    } else if (currentAchievementTab === 'secret') {
        renderSecretAchievements(grid);
    }
}

function renderNormalAchievements(grid) {
    const unlockedIds = user.achievements.map(a => a.id);
    
    const normalAchievements = [
        { id: "first_task", name: "Первое дело", desc: "Выполнить 1 дело", icon: "🎯" },
        { id: "ten_tasks", name: "Десятка", desc: "Выполнить 10 дел", icon: "🔟" },
        { id: "fifty_tasks", name: "Пятидесятка", desc: "Выполнить 50 дел", icon: "🎯" },
        { id: "hundred_tasks", name: "Сотня", desc: "Выполнить 100 дел", icon: "💯" },
        { id: "two_hundred_tasks", name: "Двести", desc: "Выполнить 200 дел", icon: "🎯" },
        { id: "five_hundred_tasks", name: "Пятьсот", desc: "Выполнить 500 дел", icon: "🏆" },
        { id: "thousand_tasks", name: "Тысяча!", desc: "Выполнить 1000 дел", icon: "👑" },
        { id: "streak_7", name: "Неделя", desc: "7 дней подряд", icon: "📅" },
        { id: "streak_30", name: "Месяц", desc: "30 дней подряд", icon: "🔥" },
        { id: "urgent_hero", name: "Спасатель", desc: "Выполнить 5 срочных дел", icon: "⚡" },
        { id: "survivor", name: "Выживший", desc: "Сдаться в 3 делах", icon: "🏳️" },
        { id: "repurchaser", name: "Повторитель", desc: "Повторить дело 3 раза", icon: "🔄" },
        { id: "level_5", name: "Профи", desc: "Достичь 5 уровня", icon: "⭐" },
        { id: "level_10", name: "Легенда", desc: "Достичь 10 уровня", icon: "🌟" },
        { id: "level_15", name: "Герой", desc: "Достичь 15 уровня", icon: "🔥" },
        { id: "level_20", name: "Бессмертный", desc: "Достичь 20 уровня", icon: "👑" },
        { id: "first_photo", name: "Первый кадр", desc: "Добавить 1 фото", icon: "📸" },
        { id: "ten_photos", name: "Фотограф", desc: "Добавить 10 фото", icon: "📷" },
        { id: "fifty_photos", name: "Папарацци", desc: "Добавить 50 фото", icon: "🎥" },
        { id: "first_marker", name: "След на карте", desc: "Добавить 1 метку", icon: "📍" },
        { id: "ten_markers", name: "Исследователь", desc: "Добавить 10 меток", icon: "🗺️" },
        { id: "fifty_markers", name: "Картограф", desc: "Добавить 50 меток", icon: "🌍" },
        { id: "rich_1000", name: "Богач", desc: "Накопить 1000 монет", icon: "💰" },
        { id: "rich_5000", name: "Магнат", desc: "Накопить 5000 монет", icon: "💎" },
        { id: "rich_10000", name: "Олигарх", desc: "Накопить 10000 монет", icon: "👑" },
        { id: "premium_pet", name: "Элитный клуб", desc: "Купить премиум-питомца", icon: "💎" },
        { id: "fennec_night", name: "Ночной охотник", desc: "30 ночных дел с Фенеком", icon: "🦊" },
        { id: "phoenix_rebirth", name: "Возрождение", desc: "Воскресить Феникса", icon: "🔥" },
        { id: "luxury_room", name: "Роскошь", desc: "Купить комнату Люкс", icon: "🏰" },
        { id: "space_room", name: "Космонавт", desc: "Купить комнату Космос", icon: "🚀" },
        { id: "room_collector", name: "Архитектор", desc: "Купить все 5 комнат", icon: "🏠" }
    ];
    
    let html = '';
    for (const ach of normalAchievements) {
        const isUnlocked = unlockedIds.includes(ach.id);
        html += `
            <div class="rounded-xl p-3 text-center shadow-sm transition-all hover:scale-105 ${isUnlocked ? 'border-2 border-yellow-500' : 'opacity-75'}">
                <div class="text-3xl mb-1">${ach.icon}</div>
                <div class="font-bold text-sm">${ach.name}</div>
                <div class="text-xs text-gray-500">${ach.desc}</div>
                ${isUnlocked ? '<div class="text-xs text-green-600 mt-1">✓ Получено</div>' : '<div class="text-xs text-gray-400 mt-1">?</div>'}
            </div>
        `;
    }
    grid.innerHTML = html;
}

function renderCategoryAchievements(grid) {
    let html = '';
    for (const ach of CATEGORY_ACHIEVEMENTS) {
        const progress = getCategoryAchievementProgress(ach.id);
        const levelNames = ["🥉", "🥈", "🥇", "💎"];
        const levelText = ["Бронза", "Серебро", "Золото", "Платина"];
        const currentLevelName = progress.level > 0 ? levelText[progress.level - 1] : "Не начато";
        
        html += `
            <div class="rounded-xl p-3 text-center shadow-sm transition-all hover:scale-105">
                <div class="text-3xl mb-1">${ach.name.split(' ')[0]}</div>
                <div class="font-bold text-sm">${ach.name}</div>
                <div class="w-full bg-gray-200 rounded-full h-2 my-2">
                    <div class="bg-green-600 h-2 rounded-full" style="width: ${progress.percent}%"></div>
                </div>
                <div class="text-xs text-gray-500">${progress.current} / ${progress.next} (${currentLevelName})</div>
                <div class="text-xs text-gray-400 mt-1">${levelNames[progress.level]} ${progress.level > 0 ? ach.rewards[progress.level - 1] : 0} / ${ach.rewards[3]} ₿</div>
            </div>
        `;
    }
    grid.innerHTML = html;
}

function renderSecretAchievements(grid) {
    if (!user.secretAchievements || user.secretAchievements.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">❓ Нет скрытых достижений</div>';
        return;
    }
    
    // Показываем ТОЛЬКО полученные скрытые достижения
    const unlockedSecrets = user.secretAchievements.filter(ach => ach.completed === true);
    
    if (unlockedSecrets.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">❓ Вы ещё не открыли ни одного скрытого достижения. Продолжайте играть!</div>';
        return;
    }
    
    let html = '';
    for (let i = 0; i < unlockedSecrets.length; i++) {
        const ach = unlockedSecrets[i];
        html += `
            <div class="rounded-xl p-3 text-center shadow-sm transition-all hover:scale-105 border-2 border-purple-500">
                <div class="text-3xl mb-1">${ach.icon || '🏆'}</div>
                <div class="font-bold text-sm">Секретное достижение</div>
                <div class="text-xs text-gray-500">${ach.hint}</div>
                <div class="text-xs text-green-600 mt-1">✓ +${ach.reward} ₿</div>
                <div class="text-xs text-gray-400 mt-1">${new Date(ach.completedAt).toLocaleDateString('ru-RU')}</div>
            </div>
        `;
    }
    grid.innerHTML = html;
}

// ============================================================
// СКРЫТЫЕ ДОСТИЖЕНИЯ
// ============================================================

const SECRET_TEMPLATES = [
    { condition: "complete_any_1", hint: "Выполнить любое дело", reward: 10, icon: "🎯" },
    { condition: "complete_any_3", hint: "Выполнить 3 любых дела", reward: 30, icon: "🎯" },
    { condition: "complete_any_5", hint: "Выполнить 5 любых дел", reward: 50, icon: "🎯" },
    { condition: "complete_any_10", hint: "Выполнить 10 любых дел", reward: 100, icon: "🎯" },
    { condition: "spend_100", hint: "Потратить 100 монет", reward: 20, icon: "💰" },
    { condition: "spend_500", hint: "Потратить 500 монет", reward: 50, icon: "💰" },
    { condition: "spend_1000", hint: "Потратить 1000 монет", reward: 100, icon: "💰" },
    { condition: "earn_100", hint: "Заработать 100 монет", reward: 20, icon: "💰" },
    { condition: "earn_500", hint: "Заработать 500 монет", reward: 50, icon: "💰" },
    { condition: "earn_1000", hint: "Заработать 1000 монет", reward: 100, icon: "💰" },
    { condition: "night_1", hint: "Выполнить дело ночью", reward: 30, icon: "🌙" },
    { condition: "morning_1", hint: "Выполнить дело утром", reward: 30, icon: "🌅" },
    { condition: "streak_3", hint: "3 дня подряд", reward: 60, icon: "🔥" },
    { condition: "category_cooking_1", hint: "Дело из Кулинарии", reward: 30, icon: "🍳" },
    { condition: "difficulty_3_1", hint: "Дело сложности 3", reward: 40, icon: "⭐⭐⭐" },
    { condition: "photo_1", hint: "Добавить 1 фото", reward: 30, icon: "📸" },
    { condition: "marker_1", hint: "Добавить 1 метку", reward: 30, icon: "📍" },
    { condition: "urgent_1", hint: "Выполнить срочное дело", reward: 50, icon: "⚠️" },
    { condition: "surrender_1", hint: "Сдаться в 1 деле", reward: 20, icon: "🏳️" },
    { condition: "repurchase_1", hint: "Повторить дело", reward: 40, icon: "🔄" }
];

export function generateSecretAchievements() {
    if (user.secretAchievements && user.secretAchievements.length > 0) return;
    
    const shuffled = [...SECRET_TEMPLATES];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    user.secretAchievements = shuffled.slice(0, 50).map((t, index) => ({
        id: 'secret_' + index + '_' + Date.now(),
        condition: t.condition,
        hint: t.hint,
        reward: t.reward,
        icon: t.icon,
        completed: false,
        completedAt: null
    }));
    saveUserData();
}

export function checkSecretAchievements(conditionType, value) {
    if (!user.secretAchievements) return;
    
    for (const ach of user.secretAchievements) {
        if (ach.completed) continue;
        
        let completed = false;
        if (conditionType === 'complete' && ach.condition === 'complete_any_1' && value >= 1) completed = true;
        else if (conditionType === 'complete' && ach.condition === 'complete_any_3' && value >= 3) completed = true;
        else if (conditionType === 'complete' && ach.condition === 'complete_any_5' && value >= 5) completed = true;
        else if (conditionType === 'complete' && ach.condition === 'complete_any_10' && value >= 10) completed = true;
        else if (conditionType === 'spend' && ach.condition === 'spend_100' && value >= 100) completed = true;
        else if (conditionType === 'spend' && ach.condition === 'spend_500' && value >= 500) completed = true;
        else if (conditionType === 'spend' && ach.condition === 'spend_1000' && value >= 1000) completed = true;
        else if (conditionType === 'earn' && ach.condition === 'earn_100' && value >= 100) completed = true;
        else if (conditionType === 'earn' && ach.condition === 'earn_500' && value >= 500) completed = true;
        else if (conditionType === 'earn' && ach.condition === 'earn_1000' && value >= 1000) completed = true;
        else if (conditionType === 'category' && ach.condition === 'category_cooking_1' && value === 'Кулинария') completed = true;
        else if (conditionType === 'difficulty' && ach.condition === 'difficulty_3_1' && value === 3) completed = true;
        else if (conditionType === 'urgent' && ach.condition === 'urgent_1' && value >= 1) completed = true;
        else if (conditionType === 'surrender' && ach.condition === 'surrender_1' && value >= 1) completed = true;
        else if (conditionType === 'repurchase' && ach.condition === 'repurchase_1' && value >= 1) completed = true;
        else if (conditionType === 'night' && ach.condition === 'night_1' && value === true) completed = true;
        else if (conditionType === 'morning' && ach.condition === 'morning_1' && value === true) completed = true;
        
        if (completed) {
            ach.completed = true;
            ach.completedAt = new Date().toISOString();
            addCoins(ach.reward);
            showToast(`🤫 Секретное достижение раскрыто! +${ach.reward} монет`, 'success');
            showConfetti();
            saveUserData();
            
            // Обновляем отображение, если открыта вкладка скрытых
            if (document.getElementById('achievementsView') && !document.getElementById('achievementsView').classList.contains('hidden')) {
                renderAchievements();
            }
        }
    }
}