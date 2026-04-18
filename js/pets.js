// js/pets.js
// ============================================================
// ПИТОМЦЫ — ОСНОВНАЯ ЛОГИКА ТАМАГОЧИ (версия 7.2)
// ============================================================

import { user, addCoins, addPoints, spendCoins, saveUserData } from './user.js';
import { BASIC_PETS, PREMIUM_PETS, PET_ITEMS, PET_ESCAPE_THRESHOLDS, PET_DECAY_RATES, PET_RETURN_COST, PET_FREE_AFTER_DAYS, PET_LEVELS, PET_ROOMS } from './config.js';
import { showToast, showConfetti } from './ui.js';
import { renderPetRoom } from './petRoom.js';

// ============================================================
// ТАЙМЕРЫ
// ============================================================

let petDecayInterval = null;
let petUIRefreshInterval = null;

export function startPetTimers() {
    if (petDecayInterval) clearInterval(petDecayInterval);
    if (petUIRefreshInterval) clearInterval(petUIRefreshInterval);
    
    // Каждые 30 минут — снижение шкал
    petDecayInterval = setInterval(() => {
        if (user.pet && user.pet.isPresent && user.pet.currentPet) {
            decayPetStats();
        }
    }, 30 * 60 * 1000);
    
    // Каждую секунду — обновление UI (таймеры)
    petUIRefreshInterval = setInterval(() => {
        if (document.getElementById('petView') && !document.getElementById('petView').classList.contains('hidden')) {
            renderPetRoom();
        }
    }, 1000);
}

function decayPetStats() {
    const pet = user.pet;
    const now = Date.now();
    
    // Время с последних действий (в часах)
    const hoursSinceFeed = (now - (pet.lastFedAt || now)) / (1000 * 60 * 60);
    const hoursSincePlay = (now - (pet.lastPlayedAt || now)) / (1000 * 60 * 60);
    const hoursSinceClean = (now - (pet.lastCleanedAt || now)) / (1000 * 60 * 60);
    
    // Голод
    if (hoursSinceFeed > 2) {
        pet.stats.hunger = Math.max(0, pet.stats.hunger - PET_DECAY_RATES.hunger * Math.min(6, hoursSinceFeed - 2));
    }
    
    // Настроение
    if (hoursSincePlay > 4) {
        pet.stats.mood = Math.max(0, pet.stats.mood - PET_DECAY_RATES.mood * Math.min(6, hoursSincePlay - 4));
    }
    
    // Чистота
    if (hoursSinceClean > 6) {
        pet.stats.cleanliness = Math.max(0, pet.stats.cleanliness - PET_DECAY_RATES.cleanliness * Math.min(6, hoursSinceClean - 6));
    }
    
    // Здоровье (зависит от других шкал)
    let healthPenalty = 0;
    if (pet.stats.hunger < 30) healthPenalty += 0.5;
    if (pet.stats.mood < 30) healthPenalty += 0.3;
    if (pet.stats.cleanliness < 40) healthPenalty += 0.2;
    pet.stats.health = Math.max(0, pet.stats.health - healthPenalty);
    
    // Проверка на побег
    checkPetEscape();
    
    saveUserData();
}

// ============================================================
// ПОБЕГ И ВОЗВРАЩЕНИЕ
// ============================================================

function checkPetEscape() {
    if (!user.pet.isPresent) return;
    
    const pet = user.pet;
    let escaped = false;
    let reason = "";
    
    if (pet.stats.hunger <= PET_ESCAPE_THRESHOLDS.hunger) {
        escaped = true;
        reason = "голода";
    } else if (pet.stats.health <= PET_ESCAPE_THRESHOLDS.health) {
        escaped = true;
        reason = "болезни";
    } else if (pet.stats.cleanliness <= PET_ESCAPE_THRESHOLDS.cleanliness) {
        escaped = true;
        reason = "грязи";
    }
    
    if (escaped) {
        user.pet.isPresent = false;
        user.pet.ranAwayAt = Date.now();
        saveUserData();
        
        showToast(`🏃‍♂️ ${user.pet.customName || 'Питомец'} убежал(а) от ${reason}! Верните за ${PET_RETURN_COST} монет`, 'error');
        renderPetRoom();
        
        document.dispatchEvent(new CustomEvent('petEscaped'));
    }
}

export function returnPet() {
    if (user.pet.isPresent) {
        showToast('Питомец и так с вами!', 'info');
        return;
    }
    
    if (!spendCoins(PET_RETURN_COST)) {
        showToast(`Не хватает монет! Нужно ${PET_RETURN_COST}`, 'error');
        return;
    }
    
    user.pet.isPresent = true;
    user.pet.ranAwayAt = null;
    user.pet.stats = {
        hunger: 50,
        mood: 50,
        health: 50,
        cleanliness: 50
    };
    user.pet.lastFedAt = Date.now();
    user.pet.lastPlayedAt = Date.now();
    user.pet.lastCleanedAt = Date.now();
    user.pet.lastHealedAt = Date.now();
    
    saveUserData();
    showToast(`🎉 ${user.pet.customName || 'Питомец'} вернулся(ась)!`, 'success');
    showConfetti();
    renderPetRoom();
}

export function checkFreePetAfterEscape() {
    if (!user.pet.isPresent && user.pet.ranAwayAt) {
        const daysGone = (Date.now() - user.pet.ranAwayAt) / (1000 * 60 * 60 * 24);
        if (daysGone >= PET_FREE_AFTER_DAYS && !user.pet.currentPet) {
            user.pet.currentPet = "hamster";
            user.pet.customName = "Пушистик";
            user.pet.isPresent = true;
            user.pet.ranAwayAt = null;
            user.pet.stats = { hunger: 80, mood: 70, health: 90, cleanliness: 75 };
            user.pet.lastFedAt = Date.now();
            user.pet.lastPlayedAt = Date.now();
            user.pet.lastCleanedAt = Date.now();
            user.pet.lastHealedAt = Date.now();
            user.pet.petStartDate = new Date().toISOString();
            saveUserData();
            
            showToast('🐹 Вам подарили нового хомяка! Заботьтесь о нём лучше!', 'success');
            renderPetRoom();
        }
    }
}

// ============================================================
// БЕСПЛАТНОЕ ВОСКРЕШЕНИЕ ФЕНИКСА
// ============================================================

export function tryFreeResurrect() {
    const allPets = [...BASIC_PETS, ...PREMIUM_PETS];
    const pet = allPets.find(p => p.id === user.pet.currentPet);
    
    // Феникс имеет одно бесплатное воскрешение
    if (pet && pet.id === 'phoenix' && !user.pet.isPresent && !user.pet.freeResurrectUsed) {
        user.pet.isPresent = true;
        user.pet.ranAwayAt = null;
        user.pet.freeResurrectUsed = true;
        user.pet.stats = {
            hunger: 60,
            mood: 60,
            health: 60,
            cleanliness: 60
        };
        saveUserData();
        showToast(`🔥 Феникс возродился из пепла! Бесплатное воскрешение использовано`, 'success');
        showConfetti();
        renderPetRoom();
        return true;
    }
    return false;
}

// ============================================================
// ДЕЙСТВИЯ ПО УХОДУ
// ============================================================

function applyRoomBonus(value, statType) {
    const room = PET_ROOMS.find(r => r.id === user.pet.currentRoom);
    if (room && room.bonus.type === statType) {
        return Math.floor(value * (1 + room.bonus.value / 100));
    }
    // Бонус "all" для комнаты Люкс
    if (room && room.bonus.type === 'all') {
        return Math.floor(value * (1 + room.bonus.value / 100));
    }
    return value;
}

export function feedPet(itemId) {
    if (!user.pet.isPresent) {
        showToast(`${user.pet.customName || 'Питомец'} убежал(а)! Верните его`, 'error');
        return;
    }
    
    const item = PET_ITEMS.food.find(i => i.id === itemId);
    if (!item) return;
    
    if ((user.pet.inventory.food[itemId] || 0) < 1) {
        showToast(`Нет ${item.name} в инвентаре!`, 'error');
        return;
    }
    
    user.pet.inventory.food[itemId]--;
    
    let restoreValue = item.restore.hunger;
    restoreValue = applyRoomBonus(restoreValue, 'hunger');
    user.pet.stats.hunger = Math.min(100, user.pet.stats.hunger + restoreValue);
    
    if (item.restore.mood) user.pet.stats.mood = Math.min(100, user.pet.stats.mood + item.restore.mood);
    if (item.restore.health) user.pet.stats.health = Math.min(100, user.pet.stats.health + item.restore.health);
    
    user.pet.lastFedAt = Date.now();
    user.pet.totalCareActions++;
    
    // Награда
    addCoins(5);
    addPoints(3);
    addPetExperience(5);
    
    saveUserData();
    showToast(`🍽️ Вы покормили ${user.pet.customName} ${item.name}! +5 монет`, 'success');
    renderPetRoom();
    checkPetAchievements();
}

export function playWithPet(itemId) {
    if (!user.pet.isPresent) {
        showToast(`${user.pet.customName || 'Питомец'} убежал(а)! Верните его`, 'error');
        return;
    }
    
    const item = PET_ITEMS.toys.find(i => i.id === itemId);
    if (!item) return;
    
    if ((user.pet.inventory.toys[itemId] || 0) < 1) {
        showToast(`Нет ${item.name} в инвентаре!`, 'error');
        return;
    }
    
    user.pet.inventory.toys[itemId]--;
    
    let restoreValue = item.restore.mood;
    restoreValue = applyRoomBonus(restoreValue, 'mood');
    user.pet.stats.mood = Math.min(100, user.pet.stats.mood + restoreValue);
    
    if (item.restore.hunger) user.pet.stats.hunger = Math.max(0, user.pet.stats.hunger + item.restore.hunger);
    
    user.pet.lastPlayedAt = Date.now();
    user.pet.totalCareActions++;
    
    addCoins(8);
    addPoints(5);
    addPetExperience(8);
    
    saveUserData();
    showToast(`🎾 Вы поиграли с ${user.pet.customName} ${item.name}! +8 монет`, 'success');
    renderPetRoom();
    checkPetAchievements();
}

export function cleanPet(itemId) {
    if (!user.pet.isPresent) return;
    
    const item = PET_ITEMS.hygiene.find(i => i.id === itemId);
    if (!item) return;
    
    if ((user.pet.inventory.hygiene[itemId] || 0) < 1) {
        showToast(`Нет ${item.name} в инвентаре!`, 'error');
        return;
    }
    
    user.pet.inventory.hygiene[itemId]--;
    
    let restoreValue = item.restore.cleanliness;
    restoreValue = applyRoomBonus(restoreValue, 'cleanliness');
    user.pet.stats.cleanliness = Math.min(100, user.pet.stats.cleanliness + restoreValue);
    
    if (item.restore.mood) user.pet.stats.mood = Math.min(100, user.pet.stats.mood + item.restore.mood);
    
    user.pet.lastCleanedAt = Date.now();
    user.pet.totalCareActions++;
    
    addCoins(6);
    addPoints(4);
    addPetExperience(6);
    
    saveUserData();
    showToast(`🧼 Вы помыли ${user.pet.customName} ${item.name}! +6 монет`, 'success');
    renderPetRoom();
    checkPetAchievements();
}

export function healPet(itemId) {
    if (!user.pet.isPresent) return;
    
    const item = PET_ITEMS.medicine.find(i => i.id === itemId);
    if (!item) return;
    
    if ((user.pet.inventory.medicine[itemId] || 0) < 1) {
        showToast(`Нет ${item.name} в инвентаре!`, 'error');
        return;
    }
    
    user.pet.inventory.medicine[itemId]--;
    
    let restoreValue = item.restore.health;
    restoreValue = applyRoomBonus(restoreValue, 'health');
    user.pet.stats.health = Math.min(100, user.pet.stats.health + restoreValue);
    
    if (item.restore.mood) user.pet.stats.mood = Math.min(100, user.pet.stats.mood + item.restore.mood);
    if (item.restore.hunger) user.pet.stats.hunger = Math.min(100, user.pet.stats.hunger + item.restore.hunger);
    
    user.pet.lastHealedAt = Date.now();
    user.pet.totalCareActions++;
    
    addCoins(10);
    addPoints(7);
    addPetExperience(10);
    
    saveUserData();
    showToast(`💊 Вы вылечили ${user.pet.customName} ${item.name}! +10 монет`, 'success');
    renderPetRoom();
    checkPetAchievements();
}

// ============================================================
// УРОВНИ И ОПЫТ ПИТОМЦА
// ============================================================

function addPetExperience(amount) {
    if (!user.pet.currentPet) return;
    
    user.pet.experience += amount;
    checkPetLevelUp();
    saveUserData();
}

function checkPetLevelUp() {
    const currentLevel = user.pet.level;
    const nextLevel = PET_LEVELS.find(l => l.level === currentLevel + 1);
    
    if (nextLevel && user.pet.experience >= nextLevel.xpNeeded && currentLevel < 5) {
        user.pet.level = currentLevel + 1;
        
        // Награда за уровень
        addCoins(nextLevel.reward);
        
        showToast(`🎉 ${user.pet.customName} достиг ${user.pet.level} уровня! +${nextLevel.reward} монет`, 'success');
        showConfetti();
        
        // Особая способность на 5 уровне
        if (user.pet.level === 5) {
            const allPets = [...BASIC_PETS, ...PREMIUM_PETS];
            const pet = allPets.find(p => p.id === user.pet.currentPet);
            if (pet) {
                showToast(`✨ ${pet.name} получил способность: ${pet.specialAbility}! ${pet.abilityDesc}`, 'success');
            }
        }
        
        document.dispatchEvent(new CustomEvent('petLevelUp', { detail: { level: user.pet.level } }));
        renderPetRoom();
    }
}

// ============================================================
// ПОЛУЧЕНИЕ БОНУСА ОТ ПИТОМЦА (С УЧЁТОМ ПРЕМИУМ-СПОСОБНОСТЕЙ)
// ============================================================

export function getPetBonus() {
    if (!user.pet.isPresent || !user.pet.currentPet) return -10;
    
    const stats = user.pet.stats;
    const allGood = stats.hunger > 70 && stats.mood > 70 && stats.health > 70 && stats.cleanliness > 70;
    const allNormal = stats.hunger > 40 && stats.mood > 40 && stats.health > 40 && stats.cleanliness > 40;
    
    const levelBonus = PET_LEVELS.find(l => l.level === user.pet.level)?.bonus || 0;
    
    let baseBonus = 0;
    if (allGood) baseBonus = 15 + levelBonus;
    else if (allNormal) baseBonus = 5 + levelBonus;
    
    // Находим питомца (может быть базовым или премиум)
    const allPets = [...BASIC_PETS, ...PREMIUM_PETS];
    const pet = allPets.find(p => p.id === user.pet.currentPet);
    
    // Способность Фенека: +15% монет ночью (20:00 - 06:00)
    if (pet && pet.id === 'fennec') {
        const hour = new Date().getHours();
        if (hour >= 20 || hour < 6) {
            baseBonus += 15;
        }
    }
    
    // Способность Феникса: дополнительный бонус к опыту
    if (pet && pet.id === 'phoenix' && allGood) {
        baseBonus += 5;
    }
    
    return baseBonus;
}

// ============================================================
// ПОКУПКА ПИТОМЦА
// ============================================================

export function purchasePet(petId) {
    const allPets = [...BASIC_PETS, ...PREMIUM_PETS];
    const pet = allPets.find(p => p.id === petId);
    if (!pet) return;
    
    if (user.pet.currentPet && user.pet.isPresent) {
        showToast('У вас уже есть питомец! Отпустите старого, чтобы завести нового', 'error');
        return;
    }
    
    if (!spendCoins(pet.price)) {
        showToast(`Не хватает монет! Нужно ${pet.price}`, 'error');
        return;
    }
    
    // Сохраняем в список купленных питомцев
    if (!user.pet.purchasedPets) user.pet.purchasedPets = [];
    if (!user.pet.purchasedPets.includes(petId)) {
        user.pet.purchasedPets.push(petId);
    }
    
    user.pet.currentPet = petId;
    user.pet.customName = pet.name;
    user.pet.stats = { ...pet.baseStats };
    user.pet.isPresent = true;
    user.pet.ranAwayAt = null;
    user.pet.level = 1;
    user.pet.experience = 0;
    user.pet.lastFedAt = Date.now();
    user.pet.lastPlayedAt = Date.now();
    user.pet.lastCleanedAt = Date.now();
    user.pet.lastHealedAt = Date.now();
    user.pet.petStartDate = new Date().toISOString();
    
    // Сбрасываем флаг бесплатного воскрешения для Феникса
    if (petId === 'phoenix') {
        user.pet.freeResurrectUsed = false;
    }
    
    saveUserData();
    showToast(`🐾 Поздравляем! У вас теперь ${pet.name}!`, 'success');
    showConfetti();
    renderPetRoom();
    
    // Достижение "Первый друг"
    document.dispatchEvent(new CustomEvent('checkAchievements'));
}

export function releasePet() {
    if (!user.pet.currentPet) {
        showToast('У вас нет питомца', 'error');
        return;
    }
    
    if (confirm(`Отпустить ${user.pet.customName}? Это нельзя отменить!`)) {
        const oldPetId = user.pet.currentPet;
        user.pet.currentPet = null;
        user.pet.customName = null;
        user.pet.isPresent = false;
        user.pet.ranAwayAt = null;
        
        saveUserData();
        showToast(`🍃 ${user.pet.customName || 'Питомец'} отпущен(а) на волю`, 'info');
        renderPetRoom();
    }
}

// ============================================================
// ПОКУПКА ПРЕДМЕТОВ
// ============================================================

export function purchasePetItem(category, itemId) {
    const items = PET_ITEMS[category];
    const item = items?.find(i => i.id === itemId);
    if (!item) return;
    
    if (!spendCoins(item.price)) {
        showToast(`Не хватает монет! Нужно ${item.price}`, 'error');
        return;
    }
    
    if (!user.pet.inventory[category][itemId]) {
        user.pet.inventory[category][itemId] = 0;
    }
    user.pet.inventory[category][itemId]++;
    
    saveUserData();
    showToast(`🛒 Куплено: ${item.name}!`, 'success');
    renderPetRoom();
}

// ============================================================
// ДОСТИЖЕНИЯ ПИТОМЦА
// ============================================================

function checkPetAchievements() {
    const actions = user.pet.totalCareActions;
    const roomsCount = user.pet.purchasedRooms.length;
    const petLevel = user.pet.level;
    const petsOwned = user.pet.purchasedPets?.length || 0;
    
    // Первый друг
    if (user.pet.currentPet && !user.achievements.some(a => a.id === "first_pet")) {
        user.achievements.push({ id: "first_pet", unlockedAt: new Date().toISOString() });
        addCoins(50);
        showToast('🏆 Достижение: Первый друг! +50 монет', 'success');
    }
    
    // Заботливый (50 действий)
    if (actions >= 50 && !user.achievements.some(a => a.id === "caring_50")) {
        user.achievements.push({ id: "caring_50", unlockedAt: new Date().toISOString() });
        addCoins(100);
        showToast('🏆 Достижение: Заботливый! +100 монет', 'success');
    }
    
    // Домосед (2 комнаты)
    if (roomsCount >= 2 && !user.achievements.some(a => a.id === "homebody")) {
        user.achievements.push({ id: "homebody", unlockedAt: new Date().toISOString() });
        addCoins(100);
        showToast('🏆 Достижение: Домосед! +100 монет', 'success');
    }
    
    // Воспитатель (5 уровень)
    if (petLevel >= 5 && !user.achievements.some(a => a.id === "trainer")) {
        user.achievements.push({ id: "trainer", unlockedAt: new Date().toISOString() });
        addCoins(150);
        showToast('🏆 Достижение: Воспитатель! +150 монет', 'success');
    }
    
    // Коллекционер (3 питомца)
    if (petsOwned >= 3 && !user.achievements.some(a => a.id === "collector")) {
        user.achievements.push({ id: "collector", unlockedAt: new Date().toISOString() });
        addCoins(200);
        showToast('🏆 Достижение: Коллекционер! +200 монет', 'success');
    }
    
    // Мастер на все руки (все типы предметов)
    const hasAllTypes = user.pet.inventory.food.cheap_food > 0 || user.pet.inventory.food.good_food > 0 ||
                        user.pet.inventory.toys.ball > 0 || user.pet.inventory.hygiene.brush > 0 ||
                        user.pet.inventory.medicine.vitamins > 0;
    if (hasAllTypes && !user.achievements.some(a => a.id === "jack_of_all")) {
        user.achievements.push({ id: "jack_of_all", unlockedAt: new Date().toISOString() });
        addCoins(150);
        showToast('🏆 Достижение: Мастер на все руки! +150 монет', 'success');
    }
    
    saveUserData();
}