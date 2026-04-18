// js/petRoom.js
// ============================================================
// КОМНАТА ПИТОМЦА — ИНТЕРФЕЙС И ОТРИСОВКА (версия 7.2)
// ============================================================

import { user, addCoins, spendCoins, saveUserData } from './user.js';
import { BASIC_PETS, PREMIUM_PETS, PET_ITEMS, PET_ROOMS, PET_LEVELS, PET_RETURN_COST } from './config.js';
import { 
    feedPet, playWithPet, cleanPet, healPet, 
    purchasePet, releasePet, returnPet,
    getPetBonus, checkFreePetAfterEscape, purchasePetItem, tryFreeResurrect
} from './pets.js';
import { showToast } from './ui.js';
import { loadPetAnimation } from './lottie.js';

let currentTab = 'care';

export function renderPetRoom() {
    const container = document.getElementById('petView');
    if (!container) return;
    
    checkFreePetAfterEscape();
    
    // Проверяем бесплатное воскрешение Феникса
    tryFreeResurrect();
    
    const hasPet = user.pet.currentPet && user.pet.isPresent;
    const allPets = [...BASIC_PETS, ...PREMIUM_PETS];
    const pet = allPets.find(p => p.id === user.pet.currentPet);
    
    if (!user.pet.currentPet) {
        renderPetShop(container);
        return;
    }
    
    if (!user.pet.isPresent) {
        renderEscapedPet(container, pet);
        return;
    }
    
    const room = PET_ROOMS.find(r => r.id === user.pet.currentRoom) || PET_ROOMS[0];
    const currentLevel = PET_LEVELS.find(l => l.level === user.pet.level) || PET_LEVELS[0];
    const nextLevel = PET_LEVELS.find(l => l.level === user.pet.level + 1);
    const xpProgress = nextLevel ? ((user.pet.experience - currentLevel.xpNeeded) / (nextLevel.xpNeeded - currentLevel.xpNeeded)) * 100 : 100;
    
    const getStatColor = (value) => {
        if (value < 30) return 'text-red-600';
        if (value < 60) return 'text-yellow-600';
        return 'text-green-600';
    };
    
    const getStatWidth = (value) => `${Math.max(0, Math.min(100, value))}%`;
    
    const stats = user.pet.stats;
    const inventory = user.pet.inventory;
    const isPremium = pet?.type === 'premium';
    
    let html = `
        <div class="pet-card rounded-2xl p-6 shadow-xl">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <div id="petAnimationContainer" class="mb-2" style="min-height: 120px;"></div>
                    <h2 class="text-xl font-bold">${user.pet.customName}</h2>
                    <p class="text-sm text-gray-500">${pet?.name} · Уровень ${user.pet.level}${isPremium ? ' ✨ Премиум' : ''}</p>
                </div>
                <div class="text-right">
                    <div class="text-sm text-gray-500">Бонус к делам</div>
                    <div class="text-xl font-bold ${getPetBonus() > 0 ? 'text-green-600' : 'text-red-600'}">
                        ${getPetBonus() > 0 ? `+${getPetBonus()}%` : `${getPetBonus()}%`}
                    </div>
                </div>
            </div>
            
            <div class="mb-4">
                <div class="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Опыт: ${user.pet.experience} / ${nextLevel ? nextLevel.xpNeeded : currentLevel.xpNeeded}</span>
                    <span>${nextLevel ? `До ${user.pet.level + 1} уровня` : 'Максимум'}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-purple-600 h-2 rounded-full" style="width: ${xpProgress}%"></div>
                </div>
            </div>
            
            <div class="space-y-3 mb-6">
                <div>
                    <div class="flex justify-between text-sm"><span>🍖 Голод</span><span class="${getStatColor(stats.hunger)}">${Math.round(stats.hunger)}%</span></div>
                    <div class="w-full bg-gray-200 rounded-full h-3"><div class="bg-orange-500 h-3 rounded-full" style="width: ${getStatWidth(stats.hunger)}"></div></div>
                </div>
                <div>
                    <div class="flex justify-between text-sm"><span>😊 Настроение</span><span class="${getStatColor(stats.mood)}">${Math.round(stats.mood)}%</span></div>
                    <div class="w-full bg-gray-200 rounded-full h-3"><div class="bg-yellow-500 h-3 rounded-full" style="width: ${getStatWidth(stats.mood)}"></div></div>
                </div>
                <div>
                    <div class="flex justify-between text-sm"><span>❤️ Здоровье</span><span class="${getStatColor(stats.health)}">${Math.round(stats.health)}%</span></div>
                    <div class="w-full bg-gray-200 rounded-full h-3"><div class="bg-red-500 h-3 rounded-full" style="width: ${getStatWidth(stats.health)}"></div></div>
                </div>
                <div>
                    <div class="flex justify-between text-sm"><span>🧼 Чистота</span><span class="${getStatColor(stats.cleanliness)}">${Math.round(stats.cleanliness)}%</span></div>
                    <div class="w-full bg-gray-200 rounded-full h-3"><div class="bg-blue-500 h-3 rounded-full" style="width: ${getStatWidth(stats.cleanliness)}"></div></div>
                </div>
            </div>
            
            <div class="flex flex-wrap gap-2 border-b pb-2 mb-4">
                <button class="pet-tab-btn px-4 py-2 rounded-lg ${currentTab === 'care' ? 'bg-green-600 text-white' : 'bg-gray-200'}" data-tab="care">❤️ Уход</button>
                <button class="pet-tab-btn px-4 py-2 rounded-lg ${currentTab === 'room' ? 'bg-green-600 text-white' : 'bg-gray-200'}" data-tab="room">🏠 Комната</button>
                <button class="release-pet-btn ml-auto px-4 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200">🍃 Отпустить</button>
            </div>
            
            <div id="petTabContent">
                ${currentTab === 'care' ? renderCareTabWithQuickBuy(inventory) : renderRoomTab(room)}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Загружаем анимацию для премиум-питомца
    if (pet && isPremium) {
        loadPetAnimation(pet, 'petAnimationContainer');
    } else if (pet) {
        document.getElementById('petAnimationContainer').innerHTML = `<div class="text-6xl text-center">${pet.icon}</div>`;
    }
    
    document.querySelectorAll('.pet-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTab = btn.dataset.tab;
            renderPetRoom();
        });
    });
    
    document.querySelectorAll('.feed-btn').forEach(btn => {
        btn.addEventListener('click', () => feedPet(btn.dataset.itemId));
    });
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', () => playWithPet(btn.dataset.itemId));
    });
    document.querySelectorAll('.clean-btn').forEach(btn => {
        btn.addEventListener('click', () => cleanPet(btn.dataset.itemId));
    });
    document.querySelectorAll('.heal-btn').forEach(btn => {
        btn.addEventListener('click', () => healPet(btn.dataset.itemId));
    });
    
    document.querySelectorAll('.quick-buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const category = btn.dataset.category;
            const itemId = btn.dataset.itemId;
            purchasePetItem(category, itemId);
        });
    });
    
    document.querySelectorAll('.buy-pet-btn').forEach(btn => {
        btn.addEventListener('click', () => purchasePet(btn.dataset.petId));
    });
    
    document.querySelectorAll('.buy-room-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomId = btn.dataset.roomId;
            purchaseRoom(roomId);
        });
    });
    document.querySelectorAll('.change-room-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const roomId = btn.dataset.roomId;
            changeRoom(roomId);
        });
    });
    
    const releaseBtn = document.querySelector('.release-pet-btn');
    if (releaseBtn) releaseBtn.onclick = () => releasePet();
    
    const returnBtn = document.getElementById('returnPetBtn');
    if (returnBtn) returnBtn.onclick = () => returnPet();
}

function renderCareTabWithQuickBuy(inventory) {
    let html = '<div class="space-y-4">';
    
    html += '<div><h4 class="font-bold mb-2">🍖 Корм</h4><div class="grid grid-cols-3 gap-2">';
    for (const item of PET_ITEMS.food) {
        const count = inventory.food[item.id] || 0;
        html += `
            <div class="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl text-center relative">
                <div class="text-2xl">${item.icon}</div>
                <div class="text-xs font-bold">${item.name}</div>
                <div class="flex items-center justify-center gap-2 mt-1">
                    <span class="text-xs text-gray-500">×${count}</span>
                    <button class="quick-buy-btn text-xs" data-category="food" data-item-id="${item.id}">➕ ${item.price}₿</button>
                </div>
                <button class="feed-btn mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded-full text-xs transition" data-item-id="${item.id}">🍽️ Покормить</button>
            </div>
        `;
    }
    html += '</div></div>';
    
    html += '<div><h4 class="font-bold mb-2">🎾 Игрушки</h4><div class="grid grid-cols-3 gap-2">';
    for (const item of PET_ITEMS.toys) {
        const count = inventory.toys[item.id] || 0;
        html += `
            <div class="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-xl text-center relative">
                <div class="text-2xl">${item.icon}</div>
                <div class="text-xs font-bold">${item.name}</div>
                <div class="flex items-center justify-center gap-2 mt-1">
                    <span class="text-xs text-gray-500">×${count}</span>
                    <button class="quick-buy-btn text-xs" data-category="toys" data-item-id="${item.id}">➕ ${item.price}₿</button>
                </div>
                <button class="play-btn mt-2 w-full bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-full text-xs transition" data-item-id="${item.id}">🎾 Играть</button>
            </div>
        `;
    }
    html += '</div></div>';
    
    html += '<div><h4 class="font-bold mb-2">🧼 Гигиена</h4><div class="grid grid-cols-3 gap-2">';
    for (const item of PET_ITEMS.hygiene) {
        const count = inventory.hygiene[item.id] || 0;
        html += `
            <div class="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-center relative">
                <div class="text-2xl">${item.icon}</div>
                <div class="text-xs font-bold">${item.name}</div>
                <div class="flex items-center justify-center gap-2 mt-1">
                    <span class="text-xs text-gray-500">×${count}</span>
                    <button class="quick-buy-btn text-xs" data-category="hygiene" data-item-id="${item.id}">➕ ${item.price}₿</button>
                </div>
                <button class="clean-btn mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-full text-xs transition" data-item-id="${item.id}">🧼 Мыть</button>
            </div>
        `;
    }
    html += '</div></div>';
    
    html += '<div><h4 class="font-bold mb-2">💊 Лекарства</h4><div class="grid grid-cols-3 gap-2">';
    for (const item of PET_ITEMS.medicine) {
        const count = inventory.medicine[item.id] || 0;
        html += `
            <div class="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl text-center relative">
                <div class="text-2xl">${item.icon}</div>
                <div class="text-xs font-bold">${item.name}</div>
                <div class="flex items-center justify-center gap-2 mt-1">
                    <span class="text-xs text-gray-500">×${count}</span>
                    <button class="quick-buy-btn text-xs" data-category="medicine" data-item-id="${item.id}">➕ ${item.price}₿</button>
                </div>
                <button class="heal-btn mt-2 w-full bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-full text-xs transition" data-item-id="${item.id}">💊 Лечить</button>
            </div>
        `;
    }
    html += '</div></div>';
    
    html += '</div>';
    return html;
}

function renderRoomTab(currentRoom) {
    let html = `
        <div class="text-center mb-4">
            <div class="text-4xl mb-2">${currentRoom.icon}</div>
            <h3 class="font-bold text-base">${currentRoom.name}</h3>
            <p class="text-xs text-gray-500">${currentRoom.desc}</p>
        </div>
        <div class="grid grid-cols-2 gap-2">
    `;
    
    for (const room of PET_ROOMS) {
        const isOwned = user.pet.purchasedRooms.includes(room.id);
        const isCurrent = user.pet.currentRoom === room.id;
        
        html += `
            <div class="room-card">
                <div class="room-icon">${room.icon}</div>
                <div class="room-name">${room.name}</div>
                <div class="room-desc">${room.desc}</div>
                ${isOwned ? 
                    (isCurrent ? '<div class="room-status text-green-600">✓ Текущая</div>' :
                    `<button class="change-room-btn" data-room-id="${room.id}">Выбрать</button>`) :
                    `<button class="buy-room-btn" data-room-id="${room.id}">${room.price}₿</button>`
                }
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

function renderPetShop(container) {
    let html = `
        <div class="pet-card rounded-2xl p-6 shadow-xl">
            <h2 class="text-xl font-bold mb-4 text-center">🐾 Выберите питомца</h2>
            
            <h3 class="text-lg font-bold mb-2 mt-4">⭐ Базовые питомцы</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
    `;
    
    for (const pet of BASIC_PETS) {
        html += `
            <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                <div class="text-5xl mb-2">${pet.icon}</div>
                <div class="font-bold">${pet.name}</div>
                <div class="text-xs text-gray-500">${pet.personality}</div>
                <div class="text-sm mt-2">${pet.price === 0 ? 'Бесплатно' : `${pet.price} монет`}</div>
                <button class="buy-pet-btn mt-3 bg-green-600 text-white px-4 py-2 rounded-full text-sm w-full" data-pet-id="${pet.id}">
                    ${pet.price === 0 ? 'ВЗЯТЬ' : 'КУПИТЬ'}
                </button>
            </div>
        `;
    }
    
    html += `
            </div>
            
            <h3 class="text-lg font-bold mb-2 mt-4">💎 Премиум-питомцы</h3>
            <div class="grid grid-cols-2 md:grid-cols-2 gap-4">
    `;
    
    for (const pet of PREMIUM_PETS) {
        html += `
            <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 text-center border-2 border-purple-300 dark:border-purple-600">
                <div class="text-5xl mb-2">${pet.icon}</div>
                <div class="font-bold">${pet.name}</div>
                <div class="text-xs text-purple-600 dark:text-purple-400">✨ ${pet.specialAbility}</div>
                <div class="text-xs text-gray-500 mt-1">${pet.abilityDesc}</div>
                <div class="text-sm mt-2 font-bold text-purple-600">${pet.price} монет</div>
                <button class="buy-pet-btn mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm w-full" data-pet-id="${pet.id}">
                    КУПИТЬ
                </button>
            </div>
        `;
    }
    
    html += `
            </div>
            <div class="text-center text-sm text-gray-500 mt-6">
                💡 У вас может быть только один питомец. Выберите с умом!
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    document.querySelectorAll('.buy-pet-btn').forEach(btn => {
        btn.addEventListener('click', () => purchasePet(btn.dataset.petId));
    });
}

function renderEscapedPet(container, pet) {
    const daysGone = user.pet.ranAwayAt ? Math.floor((Date.now() - user.pet.ranAwayAt) / (1000 * 60 * 60 * 24)) : 0;
    
    container.innerHTML = `
        <div class="pet-card rounded-2xl p-6 shadow-xl text-center">
            <div class="text-6xl mb-4 opacity-50 grayscale">${pet?.icon || '🐾'}</div>
            <h2 class="text-2xl font-bold mb-2">${user.pet.customName || 'Питомец'} убежал(а)!</h2>
            <p class="text-gray-500 mb-4">Прошло ${daysGone} дней</p>
            <div class="space-y-3">
                <button id="returnPetBtn" class="bg-purple-600 text-white px-6 py-3 rounded-full text-lg font-bold w-full">🔍 Вернуть за ${PET_RETURN_COST} монет</button>
                <p class="text-sm text-gray-400">или подождите ${PET_FREE_AFTER_DAYS - daysGone} дня — дадут нового хомяка бесплатно</p>
            </div>
        </div>
    `;
}

function purchaseRoom(roomId) {
    const room = PET_ROOMS.find(r => r.id === roomId);
    if (!room || room.price === 0) return;
    
    if (user.pet.purchasedRooms.includes(roomId)) {
        showToast('Эта комната уже куплена!', 'info');
        return;
    }
    
    if (!spendCoins(room.price)) {
        showToast(`Не хватает монет! Нужно ${room.price}`, 'error');
        return;
    }
    
    user.pet.purchasedRooms.push(roomId);
    saveUserData();
    showToast(`🏠 Комната "${room.name}" куплена!`, 'success');
    renderPetRoom();
}

function changeRoom(roomId) {
    if (!user.pet.purchasedRooms.includes(roomId)) {
        showToast('Сначала купите эту комнату!', 'error');
        return;
    }
    
    user.pet.currentRoom = roomId;
    saveUserData();
    showToast(`🏠 Комната изменена!`, 'success');
    renderPetRoom();
}