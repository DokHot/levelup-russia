// js/shopUnified.js
// ============================================================
// ЕДИНЫЙ МАГАЗИН — ПИТОМЦЫ, АВАТАРКИ, РАМКИ, ФОНЫ, БУСТЕРЫ, ЛУТБОКС
// Версия 1.0
// ============================================================

import { user, spendCoins, addCoins, saveUserData } from './user.js';
import { 
    BASIC_PETS, PREMIUM_PETS, PET_ROOMS,
    NORMAL_AVATARS, PREMIUM_AVATARS, RARE_AVATARS,
    AVAILABLE_FRAMES, AVAILABLE_BACKGROUNDS, AVAILABLE_BOOSTERS
} from './config.js';
import { purchasePet, releasePet, returnPet, purchasePetItem } from './pets.js';
import { buyLootbox, renderAvatars, changeBackground } from './avatars.js';
import { purchaseBooster, renderBoosters } from './boosters.js';
import { showToast, showConfetti, showModal, hideModal } from './ui.js';

// ============================================================
// СОСТОЯНИЕ
// ============================================================

let currentShopTab = 'pets'; // pets, avatars, frames, backgrounds, boosters, lootbox

// ============================================================
// ОСНОВНАЯ ФУНКЦИЯ РЕНДЕРИНГА
// ============================================================

export function renderUnifiedShop() {
    // Пробуем найти контейнер напрямую
    let container = document.getElementById('unifiedShopView');
    
    // Если не найден, ищем внутри shopView
    if (!container) {
        const shopView = document.getElementById('shopView');
        if (shopView) {
            let innerContainer = document.getElementById('unifiedShopView');
            if (!innerContainer) {
                innerContainer = document.createElement('div');
                innerContainer.id = 'unifiedShopView';
                shopView.appendChild(innerContainer);
            }
            container = innerContainer;
        }
    }
    
    if (!container) {
        console.warn('unifiedShopView not found');
        return;
    }

    // Получаем актуальные данные
    const allPets = [...BASIC_PETS, ...PREMIUM_PETS];
    const currentPet = allPets.find(p => p.id === user.pet?.currentPet);
    const hasPet = user.pet?.currentPet && user.pet?.isPresent;

    let html = `
        <div class="shop-unified-container max-w-4xl mx-auto">
            <h2 class="text-2xl font-bold mb-2">🛒 Магазин</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Покупайте питомцев, аватарки, рамки, фоны, бустеры и многое другое!</p>
            
            <!-- Баланс -->
            <div class="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl p-4 mb-6 border border-amber-200 dark:border-amber-800">
                <div class="flex justify-between items-center">
                    <span class="font-bold">💰 Ваш баланс</span>
                    <span class="text-2xl font-bold text-amber-600">${user.coins} ₿</span>
                </div>
                ${hasPet ? `<div class="text-sm text-gray-500 mt-1">🐾 Питомец: ${currentPet?.name || user.pet.customName} (уровень ${user.pet.level})</div>` : ''}
            </div>
            
            <!-- Вкладки магазина -->
            <div class="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-200 dark:border-gray-700">
                <button class="shop-tab-btn px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentShopTab === 'pets' ? 'bg-green-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}" data-tab="pets">
                    🐾 Питомцы
                </button>
                <button class="shop-tab-btn px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentShopTab === 'avatars' ? 'bg-green-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}" data-tab="avatars">
                    🎭 Аватарки
                </button>
                <button class="shop-tab-btn px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentShopTab === 'frames' ? 'bg-green-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}" data-tab="frames">
                    🖼️ Рамки
                </button>
                <button class="shop-tab-btn px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentShopTab === 'backgrounds' ? 'bg-green-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}" data-tab="backgrounds">
                    🌄 Фоны
                </button>
                <button class="shop-tab-btn px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentShopTab === 'boosters' ? 'bg-green-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}" data-tab="boosters">
                    ⚡ Бустеры
                </button>
                <button class="shop-tab-btn px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${currentShopTab === 'lootbox' ? 'bg-green-600 text-white shadow-md' : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}" data-tab="lootbox">
                    🎁 Лутбокс
                </button>
            </div>
            
            <!-- Контент вкладки -->
            <div id="shopTabContent">
                ${renderShopTabContent()}
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Обработчики вкладок
    document.querySelectorAll('.shop-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentShopTab = btn.dataset.tab;
            renderUnifiedShop();
        });
    });

    // Обработчики для кнопок внутри контента
    setupShopEventListeners();
}

// ============================================================
// РЕНДЕР КОНТЕНТА ВКЛАДОК
// ============================================================

function renderShopTabContent() {
    switch (currentShopTab) {
        case 'pets':
            return renderPetsTab();
        case 'avatars':
            return renderAvatarsTab();
        case 'frames':
            return renderFramesTab();
        case 'backgrounds':
            return renderBackgroundsTab();
        case 'boosters':
            return renderBoostersTab();
        case 'lootbox':
            return renderLootboxTab();
        default:
            return renderPetsTab();
    }
}

// ============================================================
// ВКЛАДКА: ПИТОМЦЫ
// ============================================================

function renderPetsTab() {
    const allPets = [...BASIC_PETS, ...PREMIUM_PETS];
    const hasPet = user.pet?.currentPet && user.pet?.isPresent;
    const currentPetId = user.pet?.currentPet;

    let html = `
        <div class="space-y-6">
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-lg mb-3">🐾 Выберите питомца</h3>
                ${hasPet ? `
                    <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-4">
                        <div class="flex justify-between items-center">
                            <div>
                                <span class="text-3xl">${allPets.find(p => p.id === currentPetId)?.icon || '🐾'}</span>
                                <span class="font-bold ml-2">${user.pet.customName}</span>
                                <span class="text-sm text-gray-500 ml-2">(уровень ${user.pet.level})</span>
                            </div>
                            <button id="releasePetBtn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm transition">
                                🍃 Отпустить
                            </button>
                        </div>
                    </div>
                ` : ''}
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
    `;

    for (const pet of allPets) {
        const isOwned = user.pet?.purchasedPets?.includes(pet.id) || false;
        const isCurrent = currentPetId === pet.id;
        const isPremium = pet.type === 'premium';
        const isFree = pet.price === 0;

        html += `
            <div class="rounded-xl p-4 text-center border-2 transition-all ${isCurrent ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : isOwned ? 'border-gray-300 bg-gray-50 dark:bg-gray-700' : 'border-gray-200 hover:border-green-300'}">
                <div class="text-4xl mb-2 ${isPremium ? 'animate-pulse' : ''}">${pet.icon}</div>
                <div class="font-bold">${pet.name}</div>
                ${isPremium ? '<div class="text-xs text-purple-600 dark:text-purple-400">✨ Премиум</div>' : ''}
                <div class="text-xs text-gray-500">${pet.personality}</div>
                <div class="text-xs text-gray-400 mt-1">${pet.specialAbility}</div>
                ${isOwned ? 
                    (isCurrent ? '<div class="text-green-600 text-sm mt-2">✅ Активен</div>' : 
                    `<button class="equip-pet-btn mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-sm transition" data-pet-id="${pet.id}">🎯 Выбрать</button>`) :
                    `<button class="buy-pet-btn mt-2 ${isFree ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'} text-white px-3 py-1 rounded-full text-sm transition w-full" data-pet-id="${pet.id}" data-price="${pet.price}">
                        ${isFree ? '🎁 Бесплатно' : `💰 ${pet.price} ₿`}
                    </button>`
                }
            </div>
        `;
    }

    html += `
                </div>
            </div>
            
            <!-- Инвентарь питомца -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-lg mb-3">🎒 Инвентарь питомца</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    ${renderPetInventory()}
                </div>
            </div>
        </div>
    `;

    return html;
}

function renderPetInventory() {
    const inventory = user.pet?.inventory || { food: {}, toys: {}, hygiene: {}, medicine: {} };
    const categories = [
        { id: 'food', icon: '🍖', name: 'Корм', items: [
            { id: 'cheap_food', name: 'Обычный', price: 10 },
            { id: 'good_food', name: 'Вкусный', price: 25 },
            { id: 'premium_food', name: 'Деликатес', price: 50 }
        ]},
        { id: 'toys', icon: '🎾', name: 'Игрушки', items: [
            { id: 'ball', name: 'Мячик', price: 15 },
            { id: 'bone', name: 'Кость', price: 20 },
            { id: 'laser', name: 'Лазер', price: 40 }
        ]},
        { id: 'hygiene', icon: '🧼', name: 'Гигиена', items: [
            { id: 'brush', name: 'Щётка', price: 12 },
            { id: 'shampoo', name: 'Шампунь', price: 30 },
            { id: 'spa', name: 'СПА', price: 60 }
        ]},
        { id: 'medicine', icon: '💊', name: 'Лекарства', items: [
            { id: 'vitamins', name: 'Витамины', price: 20 },
            { id: 'first_aid', name: 'Аптечка', price: 45 },
            { id: 'elixir', name: 'Эликсир', price: 100 }
        ]}
    ];

    let html = '';
    for (const cat of categories) {
        html += `
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <div class="text-center font-bold text-sm mb-2">${cat.icon} ${cat.name}</div>
        `;
        for (const item of cat.items) {
            const count = inventory[cat.id]?.[item.id] || 0;
            html += `
                <div class="flex justify-between items-center text-sm py-1 border-b border-gray-200 dark:border-gray-600 last:border-0">
                    <span>${item.name}</span>
                    <div class="flex items-center gap-1">
                        <span class="text-xs text-gray-500">×${count}</span>
                        <button class="buy-item-btn text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded transition" data-category="${cat.id}" data-item-id="${item.id}" data-price="${item.price}">
                            +${item.price}₿
                        </button>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
    }

    return html;
}

// ============================================================
// ВКЛАДКА: АВАТАРКИ
// ============================================================

function renderAvatarsTab() {
    const allAvatars = [...NORMAL_AVATARS, ...PREMIUM_AVATARS];
    const purchasedAvatars = user.purchasedAvatars || [];
    const currentAvatar = user.currentAvatar;

    let html = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="font-bold text-lg mb-3">🎭 Аватарки</h3>
            <div class="grid grid-cols-3 md:grid-cols-5 gap-3">
    `;

    for (const avatar of allAvatars) {
        const isOwned = purchasedAvatars.includes(avatar.icon);
        const isEquipped = currentAvatar === avatar.icon;
        const isPremium = avatar.type === 'premium';
        const price = avatar.price || 0;

        html += `
            <div class="rounded-xl p-3 text-center border-2 transition-all ${isEquipped ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : isOwned ? 'border-gray-300 bg-gray-50 dark:bg-gray-700' : 'border-gray-200 hover:border-green-300'}">
                <div class="text-4xl ${isPremium ? avatar.animClass || '' : ''}">${avatar.icon}</div>
                <div class="text-xs font-medium mt-1">${avatar.name}</div>
                ${isPremium ? '<div class="text-[10px] text-purple-600 dark:text-purple-400">✨ Анимированная</div>' : ''}
                ${isOwned ? 
                    (isEquipped ? '<div class="text-green-600 text-xs mt-1">✅ Экипирована</div>' : 
                    `<button class="equip-avatar-btn mt-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded-full text-xs transition" data-avatar="${avatar.icon}">🎯 Выбрать</button>`) :
                    `<button class="buy-avatar-btn mt-1 bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded-full text-xs transition w-full" data-avatar="${avatar.icon}" data-price="${price}">
                        ${price === 0 ? '🎁 Бесплатно' : `${price}₿`}
                    </button>`
                }
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

// ============================================================
// ВКЛАДКА: РАМКИ
// ============================================================

function renderFramesTab() {
    const purchasedFrames = user.purchasedFrames || [];
    const currentFrame = user.currentFrame;

    let html = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="font-bold text-lg mb-3">🖼️ Рамки для аватарок</h3>
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
    `;

    for (const frame of AVAILABLE_FRAMES) {
        const isOwned = purchasedFrames.includes(frame.id);
        const isEquipped = currentFrame === frame.id;

        html += `
            <div class="rounded-xl p-3 text-center border-2 transition-all ${isEquipped ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : isOwned ? 'border-gray-300 bg-gray-50 dark:bg-gray-700' : 'border-gray-200 hover:border-green-300'}">
                <div class="flex justify-center">
                    <div class="${frame.class} w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto">🏆</div>
                </div>
                <div class="text-xs font-medium mt-1">${frame.name}</div>
                ${isOwned ? 
                    (isEquipped ? '<div class="text-green-600 text-xs mt-1">✅ Экипирована</div>' : 
                    `<button class="equip-frame-btn mt-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded-full text-xs transition" data-frame-id="${frame.id}">🎯 Выбрать</button>`) :
                    `<button class="buy-frame-btn mt-1 bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded-full text-xs transition w-full" data-frame-id="${frame.id}" data-price="${frame.price}">
                        ${frame.price}₿
                    </button>`
                }
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

// ============================================================
// ВКЛАДКА: ФОНЫ
// ============================================================

function renderBackgroundsTab() {
    const purchasedBackgrounds = user.purchasedBackgrounds || ['default'];
    const currentBackground = user.currentBackground || 'default';

    let html = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 class="font-bold text-lg mb-3">🌄 Фоны</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
    `;

    for (const bg of AVAILABLE_BACKGROUNDS) {
        const isOwned = purchasedBackgrounds.includes(bg.id);
        const isEquipped = currentBackground === bg.id;

        html += `
            <div class="rounded-xl p-4 text-center border-2 transition-all ${isEquipped ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : isOwned ? 'border-gray-300 bg-gray-50 dark:bg-gray-700' : 'border-gray-200 hover:border-green-300'}">
                <div class="text-4xl">${bg.id === 'default' ? '🏠' : bg.id === 'forest' ? '🌲' : '🌌'}</div>
                <div class="font-medium mt-1">${bg.name}</div>
                ${isOwned ? 
                    (isEquipped ? '<div class="text-green-600 text-sm mt-1">✅ Активен</div>' : 
                    `<button class="equip-bg-btn mt-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-sm transition" data-bg-id="${bg.id}">🎯 Выбрать</button>`) :
                    `<button class="buy-bg-btn mt-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full text-sm transition w-full" data-bg-id="${bg.id}" data-price="${bg.price}">
                        ${bg.price === 0 ? '🎁 Бесплатно' : `${bg.price}₿`}
                    </button>`
                }
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

// ============================================================
// ВКЛАДКА: БУСТЕРЫ
// ============================================================

function renderBoostersTab() {
    const activeBoosters = user.activeBoosters || [];
    const now = Date.now();

    let html = `
        <div class="space-y-4">
            <!-- Активные бустеры -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-lg mb-3">⚡ Активные бустеры</h3>
                ${activeBoosters.filter(b => b.expiresAt > now).length === 0 ? 
                    '<p class="text-gray-500 text-center py-4">Нет активных бустеров</p>' :
                    `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${activeBoosters.filter(b => b.expiresAt > now).map(b => {
                            const remaining = Math.max(0, b.expiresAt - now);
                            const minutes = Math.floor(remaining / 60000);
                            const hours = Math.floor(minutes / 60);
                            const mins = minutes % 60;
                            const timeStr = hours > 0 ? `${hours}ч ${mins}м` : `${mins} минут`;
                            return `
                                <div class="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl flex justify-between items-center">
                                    <div>
                                        <div class="font-bold">${b.name}</div>
                                        <div class="text-xs opacity-80">${timeStr}</div>
                                    </div>
                                    <span class="text-xs bg-white/20 px-2 py-1 rounded-full">активен</span>
                                </div>
                            `;
                        }).join('')}
                    </div>`
                }
            </div>

            <!-- Доступные бустеры -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-lg mb-3">🛒 Доступные бустеры</h3>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
    `;

    for (const booster of AVAILABLE_BOOSTERS) {
        html += `
            <div class="rounded-xl p-4 text-center border-2 border-gray-200 hover:border-green-300 transition">
                <div class="text-3xl">${booster.icon}</div>
                <div class="font-bold text-sm mt-1">${booster.name}</div>
                <div class="text-xs text-gray-500">${booster.desc}</div>
                <div class="text-sm font-bold text-amber-600 mt-1">${booster.price}₿</div>
                <div class="text-[10px] text-gray-400">${Math.round(booster.duration / 3600000)} час</div>
                <button class="buy-booster-shop-btn mt-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-sm transition w-full" data-booster-id="${booster.id}">
                    Купить
                </button>
            </div>
        `;
    }

    html += `
                </div>
            </div>
        </div>
    `;

    return html;
}

// ============================================================
// ВКЛАДКА: ЛУТБОКС
// ============================================================

function renderLootboxTab() {
    // Считаем доступные аватарки
    const allAvatars = [...NORMAL_AVATARS, ...PREMIUM_AVATARS];
    const purchasedAvatars = user.purchasedAvatars || [];
    const availableAvatars = allAvatars.filter(a => !purchasedAvatars.includes(a.icon));
    const hasAllAvatars = availableAvatars.length === 0;

    // Считаем доступные рамки
    const purchasedFrames = user.purchasedFrames || [];
    const availableFrames = AVAILABLE_FRAMES.filter(f => !purchasedFrames.includes(f.id));
    const hasAllFrames = availableFrames.length === 0;

    // Редкие аватарки
    const unlockedRare = user.unlockedRareAvatars || [];
    const availableRare = RARE_AVATARS.filter(a => !unlockedRare.includes(a.id));

    return `
        <div class="space-y-4">
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white text-center">
                <div class="text-5xl mb-3">🎁</div>
                <h3 class="text-2xl font-bold">Лутбокс</h3>
                <p class="text-white/80">Получи случайную аватарку или рамку!</p>
                <button id="buyLootboxShopBtn" class="mt-4 bg-white text-purple-600 hover:bg-gray-100 px-6 py-3 rounded-full font-bold text-lg transition shadow-lg" ${hasAllAvatars && hasAllFrames ? 'disabled style="opacity:0.5"' : ''}>
                    🎲 Открыть за 200 ₿
                </button>
                ${hasAllAvatars && hasAllFrames ? '<p class="text-white/70 text-sm mt-2">🎉 У вас есть всё! Ждите новые обновления</p>' : ''}
            </div>

            <!-- Редкие аватарки (за достижения) -->
            ${availableRare.length > 0 ? `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-lg mb-3">🏆 Редкие аватарки (за достижения)</h3>
                <div class="grid grid-cols-3 md:grid-cols-5 gap-3">
                    ${availableRare.map(a => {
                        const isUnlocked = unlockedRare.includes(a.id);
                        return `
                            <div class="rounded-xl p-3 text-center border-2 ${isUnlocked ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-300 opacity-60'}">
                                <div class="text-3xl">${a.icon}</div>
                                <div class="text-xs font-medium mt-1">${a.name}</div>
                                <div class="text-[10px] text-gray-500">${a.desc}</div>
                                ${isUnlocked ? '<div class="text-green-600 text-xs mt-1">✅ Получена</div>' : '<div class="text-gray-400 text-xs mt-1">🔒 Выполните условие</div>'}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Доступные для лутбокса -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 class="font-bold text-lg mb-3">📦 Что можно получить</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-sm">
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                        <div class="text-2xl">🎭</div>
                        <div>Обычных аватарок</div>
                        <div class="font-bold text-green-600">${availableAvatars.length}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                        <div class="text-2xl">✨</div>
                        <div>Премиум-аватарок</div>
                        <div class="font-bold text-purple-600">${availableAvatars.filter(a => a.type === 'premium').length}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                        <div class="text-2xl">🖼️</div>
                        <div>Рамок</div>
                        <div class="font-bold text-blue-600">${availableFrames.length}</div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                        <div class="text-2xl">🏆</div>
                        <div>Редких аватарок</div>
                        <div class="font-bold text-amber-600">${availableRare.filter(a => !unlockedRare.includes(a.id)).length}</div>
                    </div>
                </div>
                <div class="text-xs text-gray-400 text-center mt-3">
                    💡 Шанс выпадения: 70% обычные, 15% премиум, 15% редкие
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================================

function setupShopEventListeners() {
    // === ПИТОМЦЫ ===
    document.querySelectorAll('.buy-pet-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const petId = btn.dataset.petId;
            const price = parseInt(btn.dataset.price);
            if (price === 0) {
                purchasePet(petId);
            } else if (spendCoins(price)) {
                purchasePet(petId);
            } else {
                showToast(`Не хватает монет! Нужно ${price}₿`, 'error');
            }
            renderUnifiedShop();
        });
    });

    document.querySelectorAll('.equip-pet-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const petId = btn.dataset.petId;
            user.pet.currentPet = petId;
            saveUserData();
            showToast('✅ Питомец выбран!', 'success');
            renderUnifiedShop();
        });
    });

    document.getElementById('releasePetBtn')?.addEventListener('click', () => {
        if (confirm('Отпустить питомца? Это нельзя отменить!')) {
            releasePet();
            renderUnifiedShop();
        }
    });

    document.querySelectorAll('.buy-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            const itemId = btn.dataset.itemId;
            const price = parseInt(btn.dataset.price);
            if (spendCoins(price)) {
                if (!user.pet.inventory[category][itemId]) {
                    user.pet.inventory[category][itemId] = 0;
                }
                user.pet.inventory[category][itemId]++;
                saveUserData();
                showToast(`🛒 Куплено: ${itemId}`, 'success');
                renderUnifiedShop();
            } else {
                showToast(`Не хватает монет! Нужно ${price}₿`, 'error');
            }
        });
    });

    // === АВАТАРКИ ===
    document.querySelectorAll('.buy-avatar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const avatar = btn.dataset.avatar;
            const price = parseInt(btn.dataset.price);
            if (price === 0) {
                if (!user.purchasedAvatars.includes(avatar)) {
                    user.purchasedAvatars.push(avatar);
                    saveUserData();
                    showToast('🎁 Аватарка получена!', 'success');
                    renderUnifiedShop();
                }
            } else if (spendCoins(price)) {
                if (!user.purchasedAvatars.includes(avatar)) {
                    user.purchasedAvatars.push(avatar);
                    saveUserData();
                    showToast(`✅ Аватарка куплена за ${price}₿!`, 'success');
                    showConfetti();
                    renderUnifiedShop();
                }
            } else {
                showToast(`Не хватает монет! Нужно ${price}₿`, 'error');
            }
        });
    });

    document.querySelectorAll('.equip-avatar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            user.currentAvatar = btn.dataset.avatar;
            saveUserData();
            showToast('✅ Аватарка экипирована!', 'success');
            renderUnifiedShop();
        });
    });

    // === РАМКИ ===
    document.querySelectorAll('.buy-frame-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const frameId = btn.dataset.frameId;
            const price = parseInt(btn.dataset.price);
            if (spendCoins(price)) {
                if (!user.purchasedFrames.includes(frameId)) {
                    user.purchasedFrames.push(frameId);
                    saveUserData();
                    showToast(`✅ Рамка куплена за ${price}₿!`, 'success');
                    showConfetti();
                    renderUnifiedShop();
                }
            } else {
                showToast(`Не хватает монет! Нужно ${price}₿`, 'error');
            }
        });
    });

    document.querySelectorAll('.equip-frame-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            user.currentFrame = btn.dataset.frameId;
            saveUserData();
            showToast('✅ Рамка экипирована!', 'success');
            renderUnifiedShop();
        });
    });

    // === ФОНЫ ===
    document.querySelectorAll('.buy-bg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const bgId = btn.dataset.bgId;
            const price = parseInt(btn.dataset.price);
            if (price === 0) {
                changeBackground(bgId);
                renderUnifiedShop();
            } else if (spendCoins(price)) {
                if (!user.purchasedBackgrounds.includes(bgId)) {
                    user.purchasedBackgrounds.push(bgId);
                    saveUserData();
                    changeBackground(bgId);
                    renderUnifiedShop();
                }
            } else {
                showToast(`Не хватает монет! Нужно ${price}₿`, 'error');
            }
        });
    });

    document.querySelectorAll('.equip-bg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            changeBackground(btn.dataset.bgId);
            renderUnifiedShop();
        });
    });

    // === БУСТЕРЫ ===
    document.querySelectorAll('.buy-booster-shop-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const boosterId = btn.dataset.boosterId;
            const booster = AVAILABLE_BOOSTERS.find(b => b.id === boosterId);
            if (booster) {
                if (spendCoins(booster.price)) {
                    purchaseBooster(booster);
                    renderUnifiedShop();
                } else {
                    showToast(`Не хватает монет! Нужно ${booster.price}₿`, 'error');
                }
            }
        });
    });

    // === ЛУТБОКС ===
    document.getElementById('buyLootboxShopBtn')?.addEventListener('click', () => {
        buyLootbox();
        renderUnifiedShop();
    });
}

// ============================================================
// ЭКСПОРТ
// ============================================================

export { renderUnifiedShop as renderShop };