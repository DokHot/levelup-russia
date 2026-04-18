// js/user.js
// ============================================================
// ПОЛЬЗОВАТЕЛЬ — УПРАВЛЕНИЕ ДАННЫМИ ИГРОКА (версия 7.5)
// ============================================================

import { LEVELS, CATEGORY_ACHIEVEMENTS } from './config.js';
import { loadUser, saveUser } from './storage.js';
import { showToast } from './ui.js';

// ============================================================
// НАЧАЛЬНОЕ СОСТОЯНИЕ ПОЛЬЗОВАТЕЛЯ
// ============================================================

const defaultUser = {
    coins: 200,
    totalPoints: 0,
    level: 1,
    dailyStreak: 0,
    lastLoginDate: null,
    
    achievements: [],
    categoryProgress: {},
    categoryAchievements: {},
    secretAchievements: [],
    
    randomQuest: null,
    randomQuestCompleted: false,
    randomQuestDate: null,
    
    calendarClaims: [],
    calendarSuperPrizeClaimed: false,
    
    currentAvatar: "🏆",
    currentFrame: null,
    currentBackground: "default",
    purchasedAvatars: ["🏆"],
    purchasedFrames: [],
    purchasedBackgrounds: ["default"],
    unlockedRareAvatars: [],
    
    activeBoosters: [],
    
    purchasedTasks: [],
    
    stats: {
        tasksCompleted: 0,
        tasksSurrendered: 0,
        tasksRepurchased: 0,
        urgentCompleted: 0,
        urgentSkipped: 0,
        totalEarned: 0,
        photosAdded: 0,
        locationsAdded: 0,
        nightTasksCount: 0,
        verifiedTasks: 0,
        confirmedTasks: 0
    },
    
    activeTasks: [],
    completedTasks: [],
    failedTasks: [],
    
    urgentTask: null,
    lastUrgentGenerated: null,
    lastUrgentSkipped: null,
    
    // ========== ПИТОМЕЦ (версия 7.2) ==========
    pet: {
        currentPet: null,
        customName: null,
        level: 1,
        experience: 0,
        stats: {
            hunger: 80,
            mood: 70,
            health: 90,
            cleanliness: 75
        },
        isPresent: true,
        ranAwayAt: null,
        inventory: {
            food: { cheap_food: 0, good_food: 0, premium_food: 0 },
            toys: { ball: 0, bone: 0, laser: 0 },
            hygiene: { brush: 0, shampoo: 0, spa: 0 },
            medicine: { vitamins: 0, first_aid: 0, elixir: 0 }
        },
        currentRoom: "basic_room",
        purchasedRooms: ["basic_room"],
        totalCareActions: 0,
        petStartDate: null,
        lastFedAt: null,
        lastPlayedAt: null,
        lastCleanedAt: null,
        lastHealedAt: null,
        freeResurrectUsed: false,
        purchasedPets: []
    },
    
    // ========== АККАУНТ ==========
    account: {
        userId: null,
        username: null,
        isGuest: true,
        createdAt: null,
        lastLoginAt: null,
        loginStreak: 0
    },
    
    // ========== ДРУЗЬЯ (версия 7.4) ==========
    friends: {
        list: [],
        incoming: [],
        outgoing: [],
        giftsSentToday: 0,
        lastGiftDate: null
    },
    
    // ========== СИСТЕМА ДОВЕРИЯ (версия 7.4) ==========
    trust: {
        points: 0,
        level: 'newbie',
        verifiedTasks: 0,
        confirmedTasks: 0,
        reports: 0,
        lastReportDate: null
    },
    
    // ========== ФОТО (НОВАЯ СТРУКТУРА v7.5) ==========
    photos: {
        cloudEnabled: false,
        provider: null,
        syncEnabled: true,
        autoSync: true,
        cacheOnDevice: true,
        lastSyncAt: null,
        items: []           // массив метаданных фото
    }
};

export let user = { ...defaultUser };

// ============================================================
// ЗАГРУЗКА И СОХРАНЕНИЕ
// ============================================================

export function loadUserData() {
    const savedUser = loadUser();
    if (savedUser) {
        user = { ...defaultUser, ...savedUser };
        
        // ========== МИГРАЦИЯ СТАРЫХ ПОЛЕЙ ==========
        
        if (!user.categoryProgress) user.categoryProgress = {};
        if (!user.categoryAchievements) user.categoryAchievements = {};
        if (!user.secretAchievements) user.secretAchievements = [];
        if (!user.calendarClaims) user.calendarClaims = [];
        if (!user.purchasedAvatars) user.purchasedAvatars = ["🏆"];
        if (!user.purchasedFrames) user.purchasedFrames = [];
        if (!user.purchasedBackgrounds) user.purchasedBackgrounds = ["default"];
        if (!user.unlockedRareAvatars) user.unlockedRareAvatars = [];
        if (!user.activeBoosters) user.activeBoosters = [];
        if (!user.activeTasks) user.activeTasks = [];
        if (!user.completedTasks) user.completedTasks = [];
        
        if (!user.stats) {
            user.stats = { ...defaultUser.stats };
        }
        if (user.stats.nightTasksCount === undefined) user.stats.nightTasksCount = 0;
        if (user.stats.verifiedTasks === undefined) user.stats.verifiedTasks = 0;
        if (user.stats.confirmedTasks === undefined) user.stats.confirmedTasks = 0;
        
        // Миграция питомца
        if (!user.pet) {
            user.pet = { ...defaultUser.pet };
        }
        if (!user.pet.inventory) {
            user.pet.inventory = { ...defaultUser.pet.inventory };
        }
        if (!user.pet.purchasedRooms) {
            user.pet.purchasedRooms = ["basic_room"];
        }
        if (user.pet.freeResurrectUsed === undefined) {
            user.pet.freeResurrectUsed = false;
        }
        if (!user.pet.purchasedPets) {
            user.pet.purchasedPets = [];
        }
        
        // Миграция аккаунта
        if (!user.account) {
            user.account = { ...defaultUser.account };
        }
        if (!user.account.userId) {
            user.account.userId = generateUserId();
            user.account.createdAt = Date.now();
        }
        if (user.account.loginStreak === undefined) {
            user.account.loginStreak = 0;
        }
        
        // Миграция друзей
        if (!user.friends) {
            user.friends = { ...defaultUser.friends };
        }
        if (user.friends.giftsSentToday === undefined) {
            user.friends.giftsSentToday = 0;
        }
        
        // Миграция доверия
        if (!user.trust) {
            user.trust = { ...defaultUser.trust };
        }
        if (user.trust.points === undefined) {
            user.trust.points = 0;
        }
        if (user.trust.verifiedTasks === undefined) {
            user.trust.verifiedTasks = 0;
        }
        if (user.trust.confirmedTasks === undefined) {
            user.trust.confirmedTasks = 0;
        }
        
        // ========== МИГРАЦИЯ ФОТО (v7.5) ==========
        // Если были старые фото в формате массива строк — конвертируем
        if (user.photos && Array.isArray(user.photos) && user.photos.length > 0) {
            // Старый формат: массив base64 строк
            console.log(`📸 Найдены старые фото (${user.photos.length}) в user.photos, будет миграция`);
            // Сохраняем старые фото во временное поле для миграции
            user._legacyPhotos = user.photos;
            user.photos = { ...defaultUser.photos };
        } else if (!user.photos) {
            user.photos = { ...defaultUser.photos };
        } else if (user.photos && typeof user.photos === 'object' && !user.photos.items) {
            // Частичная миграция
            user.photos.items = user.photos.items || [];
            if (user.photos.cloudEnabled === undefined) user.photos.cloudEnabled = false;
            if (user.photos.syncEnabled === undefined) user.photos.syncEnabled = true;
            if (user.photos.autoSync === undefined) user.photos.autoSync = true;
            if (user.photos.cacheOnDevice === undefined) user.photos.cacheOnDevice = true;
        }
    }
    saveUserData();
}

export function saveUserData() {
    saveUser(user);
}

// ============================================================
// ГЕНЕРАЦИЯ ID И РАБОТА С АККАУНТОМ
// ============================================================

export function generateUserId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `user_${timestamp}_${random}`;
}

export function updateLastLogin() {
    if (!user.account) {
        user.account = { ...defaultUser.account };
    }
    
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = user.account.lastLoginAt ? new Date(user.account.lastLoginAt).toISOString().split('T')[0] : null;
    
    if (lastLogin === today) {
        return;
    } else if (lastLogin && new Date(lastLogin).getTime() === new Date(today).getTime() - 86400000) {
        user.account.loginStreak = (user.account.loginStreak || 0) + 1;
    } else {
        user.account.loginStreak = 1;
    }
    
    user.account.lastLoginAt = Date.now();
    saveUserData();
}

export function setUsername(username) {
    if (!user.account) {
        user.account = { ...defaultUser.account };
    }
    user.account.username = username;
    user.account.isGuest = false;
    user.account.createdAt = user.account.createdAt || Date.now();
    saveUserData();
    
    document.dispatchEvent(new CustomEvent('userUpdated'));
}

export function getUsername() {
    return user.account?.username || 'Гость';
}

export function getUserId() {
    return user.account?.userId || null;
}

export function isGuest() {
    return user.account?.isGuest !== false;
}

// ============================================================
// РАБОТА С РЕСУРСАМИ
// ============================================================

export function addCoins(amount) {
    user.coins += amount;
    user.stats.totalEarned += amount;
    saveUserData();
    document.dispatchEvent(new CustomEvent('coinsUpdated', { detail: user.coins }));
}

export function spendCoins(amount) {
    if (user.coins >= amount) {
        user.coins -= amount;
        saveUserData();
        document.dispatchEvent(new CustomEvent('coinsUpdated', { detail: user.coins }));
        return true;
    }
    return false;
}

export function addPoints(amount) {
    user.totalPoints += amount;
    checkLevelUp();
    saveUserData();
    document.dispatchEvent(new CustomEvent('pointsUpdated', { detail: user.totalPoints }));
}

// ============================================================
// УРОВНИ
// ============================================================

export function getCurrentLevel() {
    let lvl = LEVELS[0];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (user.totalPoints >= LEVELS[i].pointsNeeded) {
            lvl = LEVELS[i];
            break;
        }
    }
    return lvl;
}

export function getNextLevel() {
    const cur = getCurrentLevel();
    const idx = LEVELS.findIndex(l => l.level === cur.level);
    return idx + 1 < LEVELS.length ? LEVELS[idx + 1] : null;
}

export function checkLevelUp() {
    const newLevel = getCurrentLevel().level;
    if (newLevel > user.level) {
        const reward = LEVELS[newLevel - 1].reward;
        user.coins += reward;
        user.level = newLevel;
        saveUserData();
        
        document.dispatchEvent(new CustomEvent('levelUp', { 
            detail: { level: newLevel, title: LEVELS[newLevel - 1].title, reward: reward }
        }));
    }
}

// ============================================================
// ЕЖЕДНЕВНЫЙ СТРИК
// ============================================================

export function updateDailyStreak() {
    const today = new Date().toISOString().split('T')[0];
    if (user.lastLoginDate === today) return;
    
    if (user.lastLoginDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (user.lastLoginDate === yesterdayStr) {
            user.dailyStreak = Math.min(user.dailyStreak + 1, 30);
        } else {
            user.dailyStreak = 1;
        }
    } else {
        user.dailyStreak = 1;
    }
    
    user.lastLoginDate = today;
    
    let bonus = 10;
    if (user.dailyStreak >= 7) bonus = 50;
    else if (user.dailyStreak >= 6) bonus = 40;
    else if (user.dailyStreak >= 5) bonus = 30;
    else if (user.dailyStreak >= 4) bonus = 25;
    else if (user.dailyStreak >= 3) bonus = 20;
    else if (user.dailyStreak >= 2) bonus = 15;
    
    addCoins(bonus);
    saveUserData();
    document.dispatchEvent(new CustomEvent('dailyBonus', { detail: { bonus, streak: user.dailyStreak } }));
}

// ============================================================
// ПРОГРЕСС КАТЕГОРИЙ
// ============================================================

export function initCategoryProgress() {
    for (const ach of CATEGORY_ACHIEVEMENTS) {
        if (user.categoryProgress[ach.category] === undefined) {
            user.categoryProgress[ach.category] = 0;
        }
        if (user.categoryAchievements[ach.id] === undefined) {
            user.categoryAchievements[ach.id] = 0;
        }
    }
}

export function updateCategoryProgress(category) {
    if (!user.categoryProgress[category]) user.categoryProgress[category] = 0;
    user.categoryProgress[category]++;
    checkCategoryAchievements();
    saveUserData();
}

export function checkCategoryAchievements() {
    for (const ach of CATEGORY_ACHIEVEMENTS) {
        const currentLevel = user.categoryAchievements[ach.id] || 0;
        const completedCount = user.categoryProgress[ach.category] || 0;
        
        for (let levelIdx = currentLevel; levelIdx < ach.levels.length; levelIdx++) {
            if (completedCount >= ach.levels[levelIdx]) {
                user.coins += ach.rewards[levelIdx];
                user.categoryAchievements[ach.id] = levelIdx + 1;
                const levelNames = ["🥉 Бронза", "🥈 Серебро", "🥇 Золото", "💎 Платина"];
                
                document.dispatchEvent(new CustomEvent('categoryAchievement', {
                    detail: { name: ach.name, level: levelNames[levelIdx], reward: ach.rewards[levelIdx] }
                }));
                saveUserData();
            }
        }
    }
}

export function getCategoryAchievementProgress(achId) {
    const ach = CATEGORY_ACHIEVEMENTS.find(a => a.id === achId);
    if (!ach) return { percent: 0, current: 0, next: 0, level: 0 };
    
    const currentLevel = user.categoryAchievements[ach.id] || 0;
    const completedCount = user.categoryProgress[ach.category] || 0;
    
    if (currentLevel >= ach.levels.length) {
        return {
            percent: 100,
            current: ach.levels[ach.levels.length - 1],
            next: ach.levels[ach.levels.length - 1],
            level: 4
        };
    }
    
    const nextNeed = ach.levels[currentLevel];
    const prevNeed = currentLevel > 0 ? ach.levels[currentLevel - 1] : 0;
    const doneInLevel = completedCount - prevNeed;
    const needForNext = nextNeed - prevNeed;
    const percent = (doneInLevel / needForNext) * 100;
    
    return {
        percent: Math.min(100, percent),
        current: completedCount,
        next: nextNeed,
        level: currentLevel
    };
}

// ============================================================
// ОБНОВЛЕНИЕ КАРТОЧКИ ПОЛЬЗОВАТЕЛЯ
// ============================================================

export function updateUserCard() {
    const lvl = getCurrentLevel();
    const next = getNextLevel();
    const curPts = lvl.pointsNeeded;
    const nextPts = next ? next.pointsNeeded : lvl.pointsNeeded + 500;
    const progress = ((user.totalPoints - curPts) / (nextPts - curPts)) * 100;
    
    const elements = {
        userLevel: document.getElementById('userLevel'),
        userTitle: document.getElementById('userTitle'),
        userPoints: document.getElementById('userPoints'),
        levelProgressText: document.getElementById('levelProgressText'),
        levelProgressFill: document.getElementById('levelProgressFill'),
        userCoins: document.getElementById('userCoins'),
        completedTasksCount: document.getElementById('completedTasksCount'),
        activeTasksCount: document.getElementById('activeTasksCount'),
        dailyStreak: document.getElementById('dailyStreak'),
        achievementCount: document.getElementById('achievementCount'),
        photosCount: document.getElementById('photosCount'),
        markersCount: document.getElementById('markersCount')
    };
    
    if (elements.userLevel) elements.userLevel.innerText = `Уровень ${lvl.level}`;
    if (elements.userTitle) elements.userTitle.innerText = lvl.title;
    if (elements.userPoints) elements.userPoints.innerText = user.totalPoints;
    if (elements.levelProgressText) elements.levelProgressText.innerHTML = `${user.totalPoints - curPts} / ${nextPts - curPts}`;
    if (elements.levelProgressFill) elements.levelProgressFill.style.width = `${Math.min(100, progress)}%`;
    if (elements.userCoins) elements.userCoins.innerText = user.coins;
    if (elements.completedTasksCount) elements.completedTasksCount.innerText = user.stats.tasksCompleted;
    if (elements.activeTasksCount) elements.activeTasksCount.innerText = user.activeTasks.length;
    if (elements.dailyStreak) elements.dailyStreak.innerText = user.dailyStreak;
    if (elements.achievementCount) {
        const count = user.achievements.length + 
                      Object.keys(user.categoryAchievements).length + 
                      (user.secretAchievements || []).filter(a => a.completed).length;
        elements.achievementCount.innerText = count;
    }
    if (elements.photosCount) elements.photosCount.innerText = user.stats.photosAdded;
    if (elements.markersCount) elements.markersCount.innerText = user.stats.locationsAdded;
    
    document.dispatchEvent(new CustomEvent('avatarUpdate', { 
        detail: { avatar: user.currentAvatar, frame: user.currentFrame }
    }));
}

// ============================================================
// СБРОС ПРОГРЕССА
// ============================================================

export function resetUserProgress() {
    if (confirm('⚠️ Сбросить весь прогресс? Это нельзя отменить!')) {
        // Сохраняем только account данные
        const accountBackup = { ...user.account };
        
        user = { ...defaultUser };
        user.account = accountBackup;
        
        // Очищаем связанные ключи
        localStorage.removeItem('russia1000_test_users');
        localStorage.removeItem('russia1000_main_user_backup');
        localStorage.removeItem('cloud_photo_config');
        
        // Очищаем IndexedDB
        if (window.indexedDB) {
            indexedDB.deleteDatabase('PhotoCache');
        }
        
        initCategoryProgress();
        saveUserData();
        
        document.dispatchEvent(new CustomEvent('userReset'));
        document.dispatchEvent(new CustomEvent('showToast', { 
            detail: { message: 'Прогресс сброшен', type: 'info' }
        }));
        
        // Перезагружаем для полной очистки
        setTimeout(() => location.reload(), 500);
    }
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ БЕСПЛАТНОГО ПИТОМЦА
// ============================================================

export function initFreePet() {
    if (!user.pet) {
        user.pet = { ...defaultUser.pet };
        saveUserData();
    }
    
    if (!user.pet.currentPet && !user.pet.petStartDate) {
        user.pet.currentPet = "hamster";
        user.pet.customName = "Пушистик";
        user.pet.petStartDate = new Date().toISOString();
        user.pet.lastFedAt = Date.now();
        user.pet.lastPlayedAt = Date.now();
        user.pet.lastCleanedAt = Date.now();
        user.pet.lastHealedAt = Date.now();
        
        user.pet.inventory = {
            food: { cheap_food: 3, good_food: 0, premium_food: 0 },
            toys: { ball: 1, bone: 0, laser: 0 },
            hygiene: { brush: 2, shampoo: 0, spa: 0 },
            medicine: { vitamins: 0, first_aid: 0, elixir: 0 }
        };
        
        saveUserData();
        
        document.dispatchEvent(new CustomEvent('showToast', { 
            detail: { message: '🐹 Вам подарили хомяка! Покормите и поиграйте с ним!', type: 'success' }
        }));
    }
}

// ============================================================
// МИГРАЦИЯ СТАРЫХ ФОТО (v7.5)
// ============================================================

/**
 * Миграция старых фото из base64 в новую систему
 * @returns {Promise<number>} количество мигрированных фото
 */
export async function migrateOldPhotos() {
    // Проверяем наличие старых фото в заданиях
    const oldPhotos = [];
    
    // Собираем фото из активных дел
    for (const task of user.activeTasks) {
        if (task.photos && task.photos.length) {
            for (let i = 0; i < task.photos.length; i++) {
                const photo = task.photos[i];
                if (typeof photo === 'string' && photo.startsWith('data:image')) {
                    oldPhotos.push({ taskId: task.id, photoData: photo, index: i, isActive: true });
                }
            }
        }
    }
    
    // Собираем фото из выполненных дел
    for (const task of user.completedTasks) {
        if (task.photos && task.photos.length) {
            for (let i = 0; i < task.photos.length; i++) {
                const photo = task.photos[i];
                if (typeof photo === 'string' && photo.startsWith('data:image')) {
                    oldPhotos.push({ taskId: task.id, photoData: photo, index: i, isActive: false });
                }
            }
        }
    }
    
    // Также проверяем legacy поле
    if (user._legacyPhotos && user._legacyPhotos.length) {
        for (let i = 0; i < user._legacyPhotos.length; i++) {
            const photo = user._legacyPhotos[i];
            if (typeof photo === 'string' && photo.startsWith('data:image')) {
                oldPhotos.push({ taskId: null, photoData: photo, index: i, isActive: false, isLegacy: true });
            }
        }
        delete user._legacyPhotos;
    }
    
    if (oldPhotos.length === 0) return 0;
    
    console.log(`📸 Найдено ${oldPhotos.length} старых фото для миграции`);
    showToast(`📸 Перенос ${oldPhotos.length} старых фото...`, 'info');
    
    // Динамический импорт модуля облачного хранения
    const { base64ToBlob } = await import('./cloud/photoCompression.js');
    const { uploadPhotoToCloud } = await import('./cloud/cloudPhotoStorage.js');
    
    let migrated = 0;
    let failed = 0;
    
    for (const old of oldPhotos) {
        try {
            const blob = base64ToBlob(old.photoData);
            const metadata = await uploadPhotoToCloud(blob, old.taskId || 0);
            
            if (old.taskId !== null) {
                // Обновляем ссылку в задании
                const task = old.isActive 
                    ? user.activeTasks.find(t => t.id === old.taskId)
                    : user.completedTasks.find(t => t.id === old.taskId);
                
                if (task && task.photos && task.photos[old.index]) {
                    task.photos[old.index] = { id: metadata.id, cloud: true };
                }
            }
            
            migrated++;
            
            // Обновляем прогресс каждые 10 фото
            if (migrated % 10 === 0) {
                showToast(`📸 Перенесено ${migrated} из ${oldPhotos.length}...`, 'info');
            }
            
        } catch (error) {
            console.warn(`Failed to migrate photo:`, error);
            failed++;
        }
    }
    
    if (migrated > 0) {
        saveUserData();
        showToast(`✅ Перенесено ${migrated} фото (${failed} ошибок)`, migrated > 0 ? 'success' : 'warning');
    }
    
    return migrated;
}

/**
 * Проверка, есть ли старые фото для миграции
 * @returns {boolean}
 */
export function hasOldPhotos() {
    // Проверяем активные дела
    for (const task of user.activeTasks) {
        if (task.photos && task.photos.length) {
            for (const photo of task.photos) {
                if (typeof photo === 'string' && photo.startsWith('data:image')) return true;
            }
        }
    }
    
    // Проверяем выполненные дела
    for (const task of user.completedTasks) {
        if (task.photos && task.photos.length) {
            for (const photo of task.photos) {
                if (typeof photo === 'string' && photo.startsWith('data:image')) return true;
            }
        }
    }
    
    return false;
}

// ============================================================
// РАБОТА С ФОТО (НОВЫЕ ФУНКЦИИ)
// ============================================================

/**
 * Добавление метаданных фото в user
 * @param {Object} metadata - метаданные фото
 */
export function addPhotoMetadata(metadata) {
    if (!user.photos) {
        user.photos = { ...defaultUser.photos };
    }
    if (!user.photos.items) {
        user.photos.items = [];
    }
    user.photos.items.push(metadata);
    user.stats.photosAdded++;
    saveUserData();
}

/**
 * Удаление метаданных фото
 * @param {string} photoId - ID фото
 */
export function removePhotoMetadata(photoId) {
    if (user.photos && user.photos.items) {
        user.photos.items = user.photos.items.filter(p => p.id !== photoId);
        saveUserData();
    }
}

/**
 * Получение всех метаданных фото
 * @returns {Array}
 */
export function getAllPhotoMetadata() {
    return user.photos?.items || [];
}

/**
 * Обновление статуса синхронизации фото
 * @param {boolean} synced - синхронизировано или нет
 */
export function updatePhotoSyncStatus(synced) {
    if (user.photos) {
        user.photos.lastSyncAt = synced ? Date.now() : user.photos.lastSyncAt;
        saveUserData();
    }
}