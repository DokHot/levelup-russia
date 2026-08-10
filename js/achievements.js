// js/achievements.js
// ============================================================
// ДОСТИЖЕНИЯ — УПРАВЛЕНИЕ ВСЕМИ ТИПАМИ ДОСТИЖЕНИЙ (версия 3.0)
// С ПРИВЯЗКОЙ К ПАКЕТАМ
// ============================================================

import { user, addCoins, getCurrentLevel, getCategoryAchievementProgress, saveUserData } from './user.js';
import { CATEGORY_ACHIEVEMENTS, getPackageName } from './config.js';
import { getActivePackages } from './packageManager.js';
import { showToast, showConfetti } from './ui.js';

let currentAchievementTab = 'normal'; // normal, category, secret

// ============================================================
// ПОЛУЧЕНИЕ АКТИВНЫХ ДОСТИЖЕНИЙ (ТОЛЬКО ИЗ АКТИВНЫХ ПАКЕТОВ)
// ============================================================

export function getActiveAchievements() {
    const activePackages = getActivePackages();
    // core всегда активен
    if (!activePackages.includes('core')) {
        activePackages.push('core');
    }
    
    return CATEGORY_ACHIEVEMENTS.filter(ach => {
        return activePackages.includes(ach.packageId || 'core');
    });
}

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
    
    // Получаем активные пакеты для проверки пакетных достижений
    const activePackages = getActivePackages();
    if (!activePackages.includes('core')) {
        activePackages.push('core');
    }
    
    // Считаем дела по пакетам
    const packageTaskCounts = {};
    for (const task of user.completedTasks) {
        const pkgId = task.packageId || 'core';
        if (!packageTaskCounts[pkgId]) packageTaskCounts[pkgId] = 0;
        packageTaskCounts[pkgId]++;
    }
    
    const achievementsList = [
        // ============================================================
        // БАЗОВЫЕ ДОСТИЖЕНИЯ (всегда доступны)
        // ============================================================
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
        { id: "premium_pet", name: "💎 Элитный клуб", check: () => petsOwned >= 1 && (user.pet?.purchasedPets?.includes('fennec') || user.pet?.purchasedPets?.includes('phoenix') || user.pet?.purchasedPets?.includes('dragon') || user.pet?.purchasedPets?.includes('unicorn')), reward: 300 },
        { id: "luxury_room", name: "🏰 Роскошь", check: () => roomsOwned >= 1 && user.pet?.purchasedRooms?.includes('luxury_room'), reward: 200 },
        { id: "space_room", name: "🚀 Космонавт", check: () => roomsOwned >= 1 && user.pet?.purchasedRooms?.includes('space_room'), reward: 250 },
        { id: "room_collector", name: "🏠 Архитектор", check: () => roomsOwned >= 5, reward: 500 },
        { id: "fennec_night", name: "🌙 Ночной охотник", check: () => currentPet === 'fennec' && nightTasksCount >= 30, reward: 400 },
        { id: "phoenix_rebirth", name: "🔥 Возрождение", check: () => currentPet === 'phoenix' && freeResurrectUsed === true, reward: 350 },
        
        // ============================================================
        // ПАКЕТНЫЕ ДОСТИЖЕНИЯ (доступны только при активном пакете)
        // ============================================================
        { id: "travel_25", name: "🗺️ Начинающий путешественник", check: () => activePackages.includes('travel') && (packageTaskCounts['travel'] || 0) >= 25, reward: 100 },
        { id: "travel_50", name: "🌍 Опытный путешественник", check: () => activePackages.includes('travel') && (packageTaskCounts['travel'] || 0) >= 50, reward: 200 },
        { id: "travel_100", name: "🏔️ Мастер путешествий", check: () => activePackages.includes('travel') && (packageTaskCounts['travel'] || 0) >= 100, reward: 400 },
        
        { id: "health_25", name: "💪 Начинающий спортсмен", check: () => activePackages.includes('health') && (packageTaskCounts['health'] || 0) >= 25, reward: 100 },
        { id: "health_50", name: "🏋️ Опытный спортсмен", check: () => activePackages.includes('health') && (packageTaskCounts['health'] || 0) >= 50, reward: 200 },
        { id: "health_100", name: "🏆 Мастер спорта", check: () => activePackages.includes('health') && (packageTaskCounts['health'] || 0) >= 100, reward: 400 },
        
        { id: "cooking_25", name: "🍳 Начинающий повар", check: () => activePackages.includes('cooking') && (packageTaskCounts['cooking'] || 0) >= 25, reward: 100 },
        { id: "cooking_50", name: "👨‍🍳 Опытный повар", check: () => activePackages.includes('cooking') && (packageTaskCounts['cooking'] || 0) >= 50, reward: 200 },
        { id: "cooking_100", name: "⭐ Шеф-повар", check: () => activePackages.includes('cooking') && (packageTaskCounts['cooking'] || 0) >= 100, reward: 400 },
        
        { id: "nature_25", name: "🌿 Друг природы", check: () => activePackages.includes('nature') && (packageTaskCounts['nature'] || 0) >= 25, reward: 100 },
        { id: "nature_50", name: "🌲 Хранитель природы", check: () => activePackages.includes('nature') && (packageTaskCounts['nature'] || 0) >= 50, reward: 200 },
        { id: "nature_100", name: "🌍 Защитник природы", check: () => activePackages.includes('nature') && (packageTaskCounts['nature'] || 0) >= 100, reward: 400 },
        
        { id: "creative_25", name: "🎨 Начинающий творец", check: () => activePackages.includes('creative') && (packageTaskCounts['creative'] || 0) >= 25, reward: 100 },
        { id: "creative_50", name: "🖼️ Опытный творец", check: () => activePackages.includes('creative') && (packageTaskCounts['creative'] || 0) >= 50, reward: 200 },
        { id: "creative_100", name: "🎭 Мастер творчества", check: () => activePackages.includes('creative') && (packageTaskCounts['creative'] || 0) >= 100, reward: 400 },
        
        { id: "selfdev_25", name: "📚 Начинающий ученик", check: () => activePackages.includes('selfdev') && (packageTaskCounts['selfdev'] || 0) >= 25, reward: 100 },
        { id: "selfdev_50", name: "🧠 Опытный ученик", check: () => activePackages.includes('selfdev') && (packageTaskCounts['selfdev'] || 0) >= 50, reward: 200 },
        { id: "selfdev_100", name: "🎓 Мастер саморазвития", check: () => activePackages.includes('selfdev') && (packageTaskCounts['selfdev'] || 0) >= 100, reward: 400 },
        
        { id: "relationships_25", name: "💕 Друг", check: () => activePackages.includes('relationships') && (packageTaskCounts['relationships'] || 0) >= 25, reward: 100 },
        { id: "relationships_50", name: "🤝 Хороший друг", check: () => activePackages.includes('relationships') && (packageTaskCounts['relationships'] || 0) >= 50, reward: 200 },
        { id: "relationships_100", name: "💖 Мастер отношений", check: () => activePackages.includes('relationships') && (packageTaskCounts['relationships'] || 0) >= 100, reward: 400 },
        
        { id: "fishing_25", name: "🎣 Начинающий рыбак", check: () => activePackages.includes('fishing') && (packageTaskCounts['fishing'] || 0) >= 25, reward: 100 },
        { id: "fishing_50", name: "🐟 Опытный рыбак", check: () => activePackages.includes('fishing') && (packageTaskCounts['fishing'] || 0) >= 50, reward: 200 },
        { id: "fishing_100", name: "🎣 Мастер рыбалки", check: () => activePackages.includes('fishing') && (packageTaskCounts['fishing'] || 0) >= 100, reward: 400 },
        
        { id: "extreme_25", name: "⚡ Начинающий экстримал", check: () => activePackages.includes('extreme') && (packageTaskCounts['extreme'] || 0) >= 25, reward: 100 },
        { id: "extreme_50", name: "🧗 Опытный экстримал", check: () => activePackages.includes('extreme') && (packageTaskCounts['extreme'] || 0) >= 50, reward: 200 },
        { id: "extreme_100", name: "🏔️ Легенда экстрима", check: () => activePackages.includes('extreme') && (packageTaskCounts['extreme'] || 0) >= 100, reward: 400 },
        
        { id: "challenges_25", name: "🎯 Начинающий чемпион", check: () => activePackages.includes('challenges') && (packageTaskCounts['challenges'] || 0) >= 25, reward: 100 },
        { id: "challenges_50", name: "🏆 Опытный чемпион", check: () => activePackages.includes('challenges') && (packageTaskCounts['challenges'] || 0) >= 50, reward: 200 },
        { id: "challenges_100", name: "👑 Мастер челленджей", check: () => activePackages.includes('challenges') && (packageTaskCounts['challenges'] || 0) >= 100, reward: 400 }
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
        <div class="achievements-container max-w-4xl mx-auto">
            <h2 class="text-2xl font-bold mb-4">🏆 Достижения</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Открывайте новые пакеты, чтобы получать больше достижений!
            </p>
            
            <div class="flex flex-wrap gap-2 border-b pb-2 mb-4">
                <button class="ach-tab-btn px-4 py-2 rounded-lg ${currentAchievementTab === 'normal' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}" data-tab="normal">
                    🏆 Простые
                </button>
                <button class="ach-tab-btn px-4 py-2 rounded-lg ${currentAchievementTab === 'category' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}" data-tab="category">
                    📊 Категорийные
                </button>
                <button class="ach-tab-btn px-4 py-2 rounded-lg ${currentAchievementTab === 'secret' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}" data-tab="secret">
                    ❓ Скрытые
                </button>
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

// ============================================================
// ОБЫЧНЫЕ ДОСТИЖЕНИЯ
// ============================================================

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
        { id: "room_collector", name: "Архитектор", desc: "Купить все 5 комнат", icon: "🏠" },
        // Пакетные достижения
        { id: "travel_25", name: "Начинающий путешественник", desc: "Выполнить 25 дел из пакета Путешествия", icon: "🗺️" },
        { id: "travel_50", name: "Опытный путешественник", desc: "Выполнить 50 дел из пакета Путешествия", icon: "🌍" },
        { id: "travel_100", name: "Мастер путешествий", desc: "Выполнить 100 дел из пакета Путешествия", icon: "🏔️" },
        { id: "health_25", name: "Начинающий спортсмен", desc: "Выполнить 25 дел из пакета Спорт и здоровье", icon: "💪" },
        { id: "health_50", name: "Опытный спортсмен", desc: "Выполнить 50 дел из пакета Спорт и здоровье", icon: "🏋️" },
        { id: "health_100", name: "Мастер спорта", desc: "Выполнить 100 дел из пакета Спорт и здоровье", icon: "🏆" },
        { id: "cooking_25", name: "Начинающий повар", desc: "Выполнить 25 дел из пакета Кулинария", icon: "🍳" },
        { id: "cooking_50", name: "Опытный повар", desc: "Выполнить 50 дел из пакета Кулинария", icon: "👨‍🍳" },
        { id: "cooking_100", name: "Шеф-повар", desc: "Выполнить 100 дел из пакета Кулинария", icon: "⭐" },
        { id: "nature_25", name: "Друг природы", desc: "Выполнить 25 дел из пакета Природа", icon: "🌿" },
        { id: "nature_50", name: "Хранитель природы", desc: "Выполнить 50 дел из пакета Природа", icon: "🌲" },
        { id: "nature_100", name: "Защитник природы", desc: "Выполнить 100 дел из пакета Природа", icon: "🌍" },
        { id: "creative_25", name: "Начинающий творец", desc: "Выполнить 25 дел из пакета Творчество", icon: "🎨" },
        { id: "creative_50", name: "Опытный творец", desc: "Выполнить 50 дел из пакета Творчество", icon: "🖼️" },
        { id: "creative_100", name: "Мастер творчества", desc: "Выполнить 100 дел из пакета Творчество", icon: "🎭" },
        { id: "selfdev_25", name: "Начинающий ученик", desc: "Выполнить 25 дел из пакета Саморазвитие", icon: "📚" },
        { id: "selfdev_50", name: "Опытный ученик", desc: "Выполнить 50 дел из пакета Саморазвитие", icon: "🧠" },
        { id: "selfdev_100", name: "Мастер саморазвития", desc: "Выполнить 100 дел из пакета Саморазвитие", icon: "🎓" },
        { id: "relationships_25", name: "Друг", desc: "Выполнить 25 дел из пакета Отношения", icon: "💕" },
        { id: "relationships_50", name: "Хороший друг", desc: "Выполнить 50 дел из пакета Отношения", icon: "🤝" },
        { id: "relationships_100", name: "Мастер отношений", desc: "Выполнить 100 дел из пакета Отношения", icon: "💖" },
        { id: "fishing_25", name: "Начинающий рыбак", desc: "Выполнить 25 дел из пакета Рыбалка", icon: "🎣" },
        { id: "fishing_50", name: "Опытный рыбак", desc: "Выполнить 50 дел из пакета Рыбалка", icon: "🐟" },
        { id: "fishing_100", name: "Мастер рыбалки", desc: "Выполнить 100 дел из пакета Рыбалка", icon: "🎣" },
        { id: "extreme_25", name: "Начинающий экстримал", desc: "Выполнить 25 дел из пакета Экстрим", icon: "⚡" },
        { id: "extreme_50", name: "Опытный экстримал", desc: "Выполнить 50 дел из пакета Экстрим", icon: "🧗" },
        { id: "extreme_100", name: "Легенда экстрима", desc: "Выполнить 100 дел из пакета Экстрим", icon: "🏔️" },
        { id: "challenges_25", name: "Начинающий чемпион", desc: "Выполнить 25 дел из пакета Челленджи", icon: "🎯" },
        { id: "challenges_50", name: "Опытный чемпион", desc: "Выполнить 50 дел из пакета Челленджи", icon: "🏆" },
        { id: "challenges_100", name: "Мастер челленджей", desc: "Выполнить 100 дел из пакета Челленджи", icon: "👑" }
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

// ============================================================
// КАТЕГОРИЙНЫЕ ДОСТИЖЕНИЯ (ТОЛЬКО ИЗ АКТИВНЫХ ПАКЕТОВ)
// ============================================================

function renderCategoryAchievements(grid) {
    const activeAchievements = getActiveAchievements();
    
    if (activeAchievements.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <div class="text-4xl mb-2">📦</div>
                <p>Активируйте сборники, чтобы увидеть достижения по категориям</p>
                <button onclick="window.switchTab('packages')" class="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm transition">
                    📦 Перейти к сборникам
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    let currentPackage = '';
    
    for (const ach of activeAchievements) {
        const progress = getCategoryAchievementProgress(ach.id);
        const levelNames = ["🥉", "🥈", "🥇", "💎"];
        const levelText = ["Бронза", "Серебро", "Золото", "Платина"];
        const currentLevelName = progress.level > 0 ? levelText[progress.level - 1] : "Не начато";
        const pkgName = getPackageName(ach.packageId || 'core');
        
        // Группировка по пакетам
        if (currentPackage !== ach.packageId) {
            if (currentPackage !== '') {
                html += `</div>`;
            }
            currentPackage = ach.packageId;
            html += `
                <div class="col-span-full mt-2 mb-1">
                    <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider">📦 ${pkgName}</div>
                </div>
            `;
        }
        
        html += `
            <div class="rounded-xl p-3 text-center shadow-sm transition-all hover:scale-105">
                <div class="text-3xl mb-1">${ach.name.split(' ')[0]}</div>
                <div class="font-bold text-sm">${ach.name}</div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 my-2">
                    <div class="bg-green-600 h-2 rounded-full" style="width: ${progress.percent}%"></div>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${progress.current} / ${progress.next} (${currentLevelName})</div>
                <div class="text-xs text-gray-400 dark:text-gray-500 mt-1">${levelNames[progress.level]} ${progress.level > 0 ? ach.rewards[progress.level - 1] : 0} / ${ach.rewards[3]} ₿</div>
            </div>
        `;
    }
    
    if (currentPackage !== '') {
        html += `</div>`;
    }
    
    grid.innerHTML = html;
}

// ============================================================
// СКРЫТЫЕ ДОСТИЖЕНИЯ
// ============================================================

function renderSecretAchievements(grid) {
    if (!user.secretAchievements || user.secretAchievements.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <div class="text-4xl mb-2">❓</div>
                <p>Нет скрытых достижений</p>
                <p class="text-sm text-gray-400 mt-1">Продолжайте играть, чтобы открывать секреты!</p>
            </div>
        `;
        return;
    }
    
    // Показываем ТОЛЬКО полученные скрытые достижения
    const unlockedSecrets = user.secretAchievements.filter(ach => ach.completed === true);
    
    if (unlockedSecrets.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                <div class="text-4xl mb-2">🔮</div>
                <p>Вы ещё не открыли ни одного скрытого достижения</p>
                <p class="text-sm text-gray-400 mt-1">Продолжайте играть и экспериментировать!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    for (const ach of unlockedSecrets) {
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
// СКРЫТЫЕ ДОСТИЖЕНИЯ — ГЕНЕРАЦИЯ И ПРОВЕРКА
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
    { condition: "repurchase_1", hint: "Повторить дело", reward: 40, icon: "🔄" },
    { condition: "activate_package_1", hint: "Активировать первый дополнительный пакет", reward: 50, icon: "📦" },
    { condition: "activate_all_packages", hint: "Активировать все пакеты", reward: 200, icon: "🌟" },
    { condition: "pet_level_3", hint: "Прокачать питомца до 3 уровня", reward: 60, icon: "🐾" },
    { condition: "pet_level_5", hint: "Прокачать питомца до 5 уровня", reward: 150, icon: "👑" }
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
    
    // Получаем активные пакеты для проверки
    const activePackages = getActivePackages();
    const allPackages = ['core', 'travel', 'health', 'cooking', 'nature', 'creative', 'selfdev', 'relationships', 'fishing', 'extreme', 'challenges'];
    
    for (const ach of user.secretAchievements) {
        if (ach.completed) continue;
        
        let completed = false;
        
        // Базовые условия
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
        
        // Пакетные условия
        else if (ach.condition === 'activate_package_1' && conditionType === 'package_activated') {
            const activeCount = activePackages.filter(p => p !== 'core').length;
            if (activeCount >= 1) completed = true;
        }
        else if (ach.condition === 'activate_all_packages' && conditionType === 'package_activated') {
            const allPkg = ['travel', 'health', 'cooking', 'nature', 'creative', 'selfdev', 'relationships', 'fishing', 'extreme', 'challenges'];
            const activeCount = allPkg.filter(p => activePackages.includes(p)).length;
            if (activeCount === allPkg.length) completed = true;
        }
        else if (ach.condition === 'pet_level_3' && conditionType === 'pet_level' && value >= 3) completed = true;
        else if (ach.condition === 'pet_level_5' && conditionType === 'pet_level' && value >= 5) completed = true;
        
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