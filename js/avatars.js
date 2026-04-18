// js/avatars.js
// ============================================================
// АВАТАРКИ — УПРАВЛЕНИЕ АВАТАРКАМИ, РАМКАМИ И ЛУТБОКСОМ
// ============================================================

import { user, spendCoins, saveUserData, addCoins } from './user.js';
import { NORMAL_AVATARS, PREMIUM_AVATARS, RARE_AVATARS, AVAILABLE_FRAMES, AVAILABLE_BACKGROUNDS } from './config.js';
import { showToast, showConfetti, updateAvatarDisplay } from './ui.js';

// ============================================================
// ПРОВЕРКА НАГРАДНЫХ АВАТАРОК
// ============================================================

/**
 * Проверяет условия для получения редких аватарок (за достижения)
 */
export function checkAvatarRewards() {
    let changed = false;
    
    // Аватарка "Легенда" (1000 дел)
    if (user.stats.tasksCompleted >= 1000 && !user.unlockedRareAvatars.includes("legend")) {
        user.unlockedRareAvatars.push("legend");
        user.purchasedAvatars.push("👑");
        showToast('🏆 Вы получили аватарку "Легенда" за 1000 выполненных дел!', 'success');
        showConfetti();
        changed = true;
    }
    
    // Аватарки за стрик
    const streakChecks = [
        { days: 7, id: "streak_7", name: "Недельный стрик", icon: "📅" },
        { days: 14, id: "streak_14", name: "Двухнедельный стрик", icon: "🔥" },
        { days: 30, id: "streak_30", name: "Месячный стрик", icon: "⭐" },
        { days: 60, id: "streak_60", name: "Двухмесячный стрик", icon: "🌟" },
        { days: 100, id: "streak_100", name: "Стодневный стрик", icon: "👑" }
    ];
    
    for (const check of streakChecks) {
        if (user.dailyStreak >= check.days && !user.unlockedRareAvatars.includes(check.id)) {
            const rareAvatar = RARE_AVATARS.find(a => a.id === check.id);
            if (rareAvatar) {
                user.unlockedRareAvatars.push(check.id);
                user.purchasedAvatars.push(rareAvatar.icon);
                showToast(`📅 Вы получили аватарку "${check.name}" за ${check.days} дней подряд!`, 'success');
                showConfetti();
                changed = true;
            }
        }
    }
    
    // Аватарка за кулинарию
    if (user.categoryProgress["Кулинария"] >= 30 && !user.unlockedRareAvatars.includes("chef_master")) {
        const rareAvatar = RARE_AVATARS.find(a => a.id === "chef_master");
        if (rareAvatar) {
            user.unlockedRareAvatars.push("chef_master");
            user.purchasedAvatars.push(rareAvatar.icon);
            showToast('👨‍🍳 Вы получили аватарку "Шеф-повар" за 30 кулинарных дел!', 'success');
            showConfetti();
            changed = true;
        }
    }
    
    // Аватарка за фото
    if (user.stats.photosAdded >= 50 && !user.unlockedRareAvatars.includes("photographer")) {
        const rareAvatar = RARE_AVATARS.find(a => a.id === "photographer");
        if (rareAvatar) {
            user.unlockedRareAvatars.push("photographer");
            user.purchasedAvatars.push(rareAvatar.icon);
            showToast('📸 Вы получили аватарку "Фотограф" за 50 фото!', 'success');
            showConfetti();
            changed = true;
        }
    }
    
    // Аватарка за 100 дел
    if (user.stats.tasksCompleted >= 100 && !user.unlockedRareAvatars.includes("adventurer")) {
        const rareAvatar = RARE_AVATARS.find(a => a.id === "adventurer");
        if (rareAvatar) {
            user.unlockedRareAvatars.push("adventurer");
            user.purchasedAvatars.push(rareAvatar.icon);
            showToast('🎯 Вы получили аватарку "Авантюрист" за 100 выполненных дел!', 'success');
            showConfetti();
            changed = true;
        }
    }
    
    if (changed) {
        saveUserData();
        renderAvatars();
        updateAvatarDisplay();
    }
}

// ============================================================
// ЛУТБОКС
// ============================================================

/**
 * Покупает лутбокс со случайной аватаркой
 */
export function buyLootbox() {
    if (!spendCoins(200)) {
        showToast('Не хватает монет! Нужно 200 монет', 'error');
        return;
    }
    
    // Собираем все доступные аватарки
    const allAvatars = [];
    
    for (const a of NORMAL_AVATARS) {
        if (!user.purchasedAvatars.includes(a.icon)) {
            allAvatars.push({ icon: a.icon, name: a.name, type: "normal" });
        }
    }
    
    for (const a of PREMIUM_AVATARS) {
        if (!user.purchasedAvatars.includes(a.icon)) {
            allAvatars.push({ icon: a.icon, name: a.name, type: "premium", animClass: a.animClass });
        }
    }
    
    for (const a of RARE_AVATARS) {
        if (!user.unlockedRareAvatars.includes(a.id) && !user.purchasedAvatars.includes(a.icon)) {
            allAvatars.push({ icon: a.icon, name: a.name, type: "rare" });
        }
    }
    
    if (allAvatars.length === 0) {
        addCoins(200);
        showToast('У вас уже есть все аватарки!', 'info');
        return;
    }
    
    // Рандомный выбор с весами (обычные 70%, премиум 15%, редкие 15%)
    let randomAvatar;
    const rand = Math.random();
    const normalAvatars = allAvatars.filter(a => a.type === "normal");
    const premiumAvatars = allAvatars.filter(a => a.type === "premium");
    const rareAvatars = allAvatars.filter(a => a.type === "rare");
    
    if (rand < 0.7 && normalAvatars.length > 0) {
        randomAvatar = normalAvatars[Math.floor(Math.random() * normalAvatars.length)];
    } else if (rand < 0.85 && premiumAvatars.length > 0) {
        randomAvatar = premiumAvatars[Math.floor(Math.random() * premiumAvatars.length)];
    } else if (rareAvatars.length > 0) {
        randomAvatar = rareAvatars[Math.floor(Math.random() * rareAvatars.length)];
    } else {
        randomAvatar = allAvatars[Math.floor(Math.random() * allAvatars.length)];
    }
    
    user.purchasedAvatars.push(randomAvatar.icon);
    saveUserData();
    renderAvatars();
    updateAvatarDisplay();
    showToast(`🎁 Вам выпала аватарка "${randomAvatar.name}"!`, 'success');
    showConfetti();
}

// ============================================================
// ОТРИСОВКА АВАТАРОК
// ============================================================

/**
 * Рендер всех разделов аватарок (обычные, рамки, премиум, редкие)
 */
export function renderAvatars() {
    const avatarsGrid = document.getElementById('avatarsGrid');
    const framesGrid = document.getElementById('framesGrid');
    const premiumGrid = document.getElementById('premiumGrid');
    const rareGrid = document.getElementById('rareGrid');
    
    if (!avatarsGrid || !framesGrid || !premiumGrid || !rareGrid) return;
    
    // Обычные аватарки
    let avatarsHtml = '';
    for (const a of NORMAL_AVATARS) {
        const isOwned = user.purchasedAvatars.includes(a.icon);
        const isEquipped = user.currentAvatar === a.icon;
        
        avatarsHtml += `
            <div class="glass-card rounded-xl p-4 text-center avatar-item">
                <div class="avatar-preview text-5xl">${a.icon}</div>
                <div class="font-bold mt-2">${a.name}</div>
                ${isOwned ? 
                    (isEquipped ? '<div class="text-green-600 text-sm mt-1">✓ Экипировано</div>' :
                    `<button class="equip-avatar-btn mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-sm transition" data-avatar="${a.icon}">ЭКИПИРОВАТЬ</button>`) :
                    `<div class="coin inline-block mt-2">💰 ${a.price}</div>
                     <button class="buy-avatar-btn mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-full text-sm transition w-full" data-avatar-icon="${a.icon}" data-avatar-price="${a.price}">КУПИТЬ</button>`
                }
            </div>
        `;
    }
    avatarsGrid.innerHTML = avatarsHtml;
    
    // Рамки
    let framesHtml = '';
    for (const f of AVAILABLE_FRAMES) {
        const isOwned = user.purchasedFrames.includes(f.id);
        const isEquipped = user.currentFrame === f.id;
        
        framesHtml += `
            <div class="glass-card rounded-xl p-4 text-center avatar-item">
                <div class="frame-preview ${f.class} text-5xl">🏆</div>
                <div class="font-bold mt-2">${f.name}</div>
                ${isOwned ? 
                    (isEquipped ? '<div class="text-green-600 text-sm mt-1">✓ Экипировано</div>' :
                    `<button class="equip-frame-btn mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-sm transition" data-frame-id="${f.id}">ЭКИПИРОВАТЬ</button>`) :
                    `<div class="coin inline-block mt-2">💰 ${f.price}</div>
                     <button class="buy-frame-btn mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-full text-sm transition w-full" data-frame-id="${f.id}" data-frame-price="${f.price}">КУПИТЬ</button>`
                }
            </div>
        `;
    }
    framesGrid.innerHTML = framesHtml;
    
    // Премиум анимированные аватарки
    let premiumHtml = '';
    for (const a of PREMIUM_AVATARS) {
        const isOwned = user.purchasedAvatars.includes(a.icon);
        const isEquipped = user.currentAvatar === a.icon;
        
        premiumHtml += `
            <div class="glass-card rounded-xl p-4 text-center avatar-item">
                <div class="avatar-preview text-5xl ${a.animClass}">${a.icon}</div>
                <div class="font-bold mt-2">${a.name}</div>
                <div class="text-xs text-purple-500 mb-1">✨ Анимированная</div>
                ${isOwned ? 
                    (isEquipped ? '<div class="text-green-600 text-sm mt-1">✓ Экипировано</div>' :
                    `<button class="equip-avatar-btn mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-sm transition" data-avatar="${a.icon}">ЭКИПИРОВАТЬ</button>`) :
                    `<div class="coin inline-block mt-2">💰 ${a.price}</div>
                     <button class="buy-avatar-btn mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded-full text-sm transition w-full" data-avatar-icon="${a.icon}" data-avatar-price="${a.price}">КУПИТЬ</button>`
                }
            </div>
        `;
    }
    premiumGrid.innerHTML = premiumHtml;
    
    // Редкие аватарки (за достижения)
    let rareHtml = '';
    for (const a of RARE_AVATARS) {
        const isOwned = user.unlockedRareAvatars.includes(a.id);
        const isEquipped = user.currentAvatar === a.icon;
        
        rareHtml += `
            <div class="glass-card rounded-xl p-4 text-center avatar-item">
                <div class="avatar-preview text-5xl">${a.icon}</div>
                <div class="font-bold mt-2">${a.name}</div>
                <div class="text-xs text-orange-500 mb-1">🏆 ${a.desc}</div>
                ${isOwned ? 
                    (isEquipped ? '<div class="text-green-600 text-sm mt-1">✓ Экипировано</div>' :
                    `<button class="equip-avatar-btn mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full text-sm transition" data-avatar="${a.icon}">ЭКИПИРОВАТЬ</button>`) :
                    '<div class="text-gray-400 text-sm mt-2">🔒 Выполните условие</div>'
                }
            </div>
        `;
    }
    rareGrid.innerHTML = rareHtml;
    
    // Обработчики
    document.querySelectorAll('.buy-avatar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const icon = btn.dataset.avatarIcon;
            const price = parseInt(btn.dataset.avatarPrice);
            if (spendCoins(price)) {
                user.purchasedAvatars.push(icon);
                saveUserData();
                renderAvatars();
                updateAvatarDisplay();
                showToast('✅ Аватарка куплена!', 'success');
                showConfetti();
            } else {
                showToast(`Не хватает монет! Нужно ${price}`, 'error');
            }
        });
    });
    
    document.querySelectorAll('.equip-avatar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            user.currentAvatar = btn.dataset.avatar;
            saveUserData();
            renderAvatars();
            updateAvatarDisplay();
            showToast('✅ Аватарка экипирована!', 'success');
        });
    });
    
    document.querySelectorAll('.buy-frame-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const frameId = btn.dataset.frameId;
            const price = parseInt(btn.dataset.framePrice);
            if (spendCoins(price)) {
                user.purchasedFrames.push(frameId);
                saveUserData();
                renderAvatars();
                updateAvatarDisplay();
                showToast('✅ Рамка куплена!', 'success');
                showConfetti();
            } else {
                showToast(`Не хватает монет! Нужно ${price}`, 'error');
            }
        });
    });
    
    document.querySelectorAll('.equip-frame-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            user.currentFrame = btn.dataset.frameId;
            saveUserData();
            renderAvatars();
            updateAvatarDisplay();
            showToast('✅ Рамка экипирована!', 'success');
        });
    });
    
    // Лутбокс
    const lootboxBtn = document.getElementById('buyLootboxBtn');
    if (lootboxBtn) lootboxBtn.onclick = buyLootbox;
}

// ============================================================
// ФОНЫ
// ============================================================

/**
 * Изменяет фон приложения
 * @param {string} bgId - ID фона (default, forest, cosmic)
 */
export function changeBackground(bgId) {
    const bg = AVAILABLE_BACKGROUNDS.find(b => b.id === bgId);
    if (!bg) return;
    
    if (!user.purchasedBackgrounds.includes(bgId) && bg.price > 0) {
        if (!spendCoins(bg.price)) {
            showToast(`Не хватает монет! Нужно ${bg.price}`, 'error');
            return;
        }
        user.purchasedBackgrounds.push(bgId);
        showToast(`✅ Фон "${bg.name}" куплен!`, 'success');
        showConfetti();
    }
    
    user.currentBackground = bgId;
    document.body.classList.remove('bg-forest', 'bg-cosmic');
    if (bg.class) document.body.classList.add(bg.class);
    saveUserData();
    showToast(`🎨 Фон изменён на "${bg.name}"`, 'success');
}