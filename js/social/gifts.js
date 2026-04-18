// js/social/gifts.js
// ============================================================
// ПОДАРКИ ДРУЗЬЯМ — ОТПРАВКА МОНЕТ И ПРЕДМЕТОВ (версия 7.4)
// ============================================================

import { user, spendCoins, addCoins, saveUserData } from '../user.js';
import { showToast } from '../ui.js';
import { findUserById, updateTestUser } from '../testData.js';

// Лимиты
const MAX_GIFTS_PER_DAY = 5;
const GIFT_COMMISSION = 0.1; // 10% комиссия

// Доступные подарки
export const AVAILABLE_GIFTS = {
    coins: [
        { amount: 10, price: 10 },
        { amount: 50, price: 50 },
        { amount: 100, price: 100 },
        { amount: 500, price: 500 }
    ],
    food: [
        { id: 'cheap_food', name: 'Обычный корм', icon: '🍚', price: 10 },
        { id: 'good_food', name: 'Вкусный корм', icon: '🍗', price: 25 },
        { id: 'premium_food', name: 'Деликатес', icon: '🍣', price: 50 }
    ],
    toys: [
        { id: 'ball', name: 'Мячик', icon: '⚽', price: 15 },
        { id: 'bone', name: 'Кость', icon: '🦴', price: 20 },
        { id: 'laser', name: 'Лазер', icon: '🔦', price: 40 }
    ],
    medicine: [
        { id: 'vitamins', name: 'Витамины', icon: '💊', price: 20 },
        { id: 'first_aid', name: 'Аптечка', icon: '🩹', price: 45 },
        { id: 'elixir', name: 'Эликсир', icon: '🧪', price: 100 }
    ]
};

/**
 * Проверяет, можно ли отправлять подарки сегодня
 * @returns {boolean}
 */
export function canSendGifts() {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = user.friends.lastGiftDate ? new Date(user.friends.lastGiftDate).toISOString().split('T')[0] : null;
    
    if (lastDate !== today) {
        user.friends.giftsSentToday = 0;
        user.friends.lastGiftDate = Date.now();
        saveUserData();
    }
    
    return user.friends.giftsSentToday < MAX_GIFTS_PER_DAY;
}

/**
 * Отправляет подарок другу
 * @param {string} friendId - ID друга
 * @param {string} type - тип подарка (coins, food, toys, medicine)
 * @param {Object} gift - объект подарка
 * @returns {boolean}
 */
export function sendGift(friendId, type, gift) {
    // Проверка лимита
    if (!canSendGifts()) {
        showToast(`❌ Вы можете отправить не более ${MAX_GIFTS_PER_DAY} подарков в день`, 'error');
        return false;
    }
    
    // Проверка, что пользователь в друзьях
    if (!user.friends.list.includes(friendId)) {
        showToast('❌ Этот пользователь не в списке друзей', 'error');
        return false;
    }
    
    // Проверка монет
    if (!spendCoins(gift.price)) {
        showToast(`❌ Не хватает монет! Нужно ${gift.price}`, 'error');
        return false;
    }
    
    // Отправляем подарок
    if (type === 'coins') {
        const recipientAmount = Math.floor(gift.amount * (1 - GIFT_COMMISSION));
        addGiftToUser(friendId, { type: 'coins', amount: recipientAmount });
        showToast(`🎁 Вы отправили ${gift.amount} монет (${GIFT_COMMISSION * 100}% комиссия)`, 'success');
    } else {
        addGiftToUser(friendId, { type: 'item', category: type, itemId: gift.id, itemName: gift.name });
        showToast(`🎁 Вы отправили ${gift.name}`, 'success');
    }
    
    user.friends.giftsSentToday++;
    saveUserData();
    
    return true;
}

/**
 * Добавляет подарок пользователю
 * @param {string} userId - ID получателя
 * @param {Object} gift - подарок
 */
function addGiftToUser(userId, gift) {
    const targetUser = findUserById(userId);
    if (!targetUser) return;
    
    if (gift.type === 'coins') {
        targetUser.coins += gift.amount;
        showToastToUser(userId, `🎁 Вы получили ${gift.amount} монет от ${user.account.username}!`);
    } else if (gift.type === 'item') {
        if (!targetUser.pet.inventory[gift.category][gift.itemId]) {
            targetUser.pet.inventory[gift.category][gift.itemId] = 0;
        }
        targetUser.pet.inventory[gift.category][gift.itemId]++;
        showToastToUser(userId, `🎁 Вы получили ${gift.itemName} от ${user.account.username}!`);
    }
    
    updateTestUser(targetUser);
}

/**
 * Симулирует уведомление пользователю (для тестов)
 */
function showToastToUser(userId, message) {
    // В реальном приложении здесь был бы запрос к серверу
    // Для тестов просто выводим в консоль
    console.log(`[Уведомление для ${userId}]: ${message}`);
    
    // Если это текущий пользователь — показываем тост
    if (userId === user.account.userId) {
        showToast(message, 'success');
    }
}

/**
 * Открывает модалку отправки подарка
 * @param {string} friendId - ID друга
 * @param {string} friendName - имя друга
 */
export function openGiftModal(friendId, friendName) {
    let modal = document.getElementById('giftModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'giftModal';
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 hidden';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">🎁 Отправить подарок</h2>
                    <button id="closeGiftModalBtn" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                <div id="giftModalContent"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('closeGiftModalBtn')?.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }
    
    const content = document.getElementById('giftModalContent');
    if (!content) return;
    
    let html = `
        <p class="mb-4">Кому: <strong>${friendName}</strong></p>
        <p class="text-sm text-gray-500 mb-4">Осталось подарков сегодня: ${MAX_GIFTS_PER_DAY - user.friends.giftsSentToday}/${MAX_GIFTS_PER_DAY}</p>
        
        <div class="space-y-4">
            <div>
                <h3 class="font-bold mb-2">💰 Монеты</h3>
                <div class="flex flex-wrap gap-2">
    `;
    
    for (const gift of AVAILABLE_GIFTS.coins) {
        const commission = Math.floor(gift.amount * 0.1);
        html += `
            <button class="send-gift-btn bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-xl text-center hover:bg-yellow-200 transition" data-type="coins" data-gift='${JSON.stringify(gift)}'>
                <div class="text-xl">💰</div>
                <div class="text-sm font-bold">${gift.amount}₿</div>
                <div class="text-xs text-gray-500">-${commission}₿</div>
            </button>
        `;
    }
    
    html += `
                </div>
            </div>
            
            <div>
                <h3 class="font-bold mb-2">🍖 Корм</h3>
                <div class="flex flex-wrap gap-2">
    `;
    
    for (const gift of AVAILABLE_GIFTS.food) {
        const count = user.pet.inventory.food[gift.id] || 0;
        html += `
            <button class="send-gift-btn bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl text-center hover:bg-orange-200 transition" data-type="food" data-gift='${JSON.stringify(gift)}' ${count === 0 ? 'disabled style="opacity:0.5"' : ''}>
                <div class="text-xl">${gift.icon}</div>
                <div class="text-sm font-bold">${gift.name}</div>
                <div class="text-xs text-gray-500">×${count}</div>
            </button>
        `;
    }
    
    html += `
                </div>
            </div>
            
            <div>
                <h3 class="font-bold mb-2">🎾 Игрушки</h3>
                <div class="flex flex-wrap gap-2">
    `;
    
    for (const gift of AVAILABLE_GIFTS.toys) {
        const count = user.pet.inventory.toys[gift.id] || 0;
        html += `
            <button class="send-gift-btn bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-xl text-center hover:bg-yellow-200 transition" data-type="toys" data-gift='${JSON.stringify(gift)}' ${count === 0 ? 'disabled style="opacity:0.5"' : ''}>
                <div class="text-xl">${gift.icon}</div>
                <div class="text-sm font-bold">${gift.name}</div>
                <div class="text-xs text-gray-500">×${count}</div>
            </button>
        `;
    }
    
    html += `
                </div>
            </div>
            
            <div>
                <h3 class="font-bold mb-2">💊 Лекарства</h3>
                <div class="flex flex-wrap gap-2">
    `;
    
    for (const gift of AVAILABLE_GIFTS.medicine) {
        const count = user.pet.inventory.medicine[gift.id] || 0;
        html += `
            <button class="send-gift-btn bg-green-100 dark:bg-green-900/30 p-2 rounded-xl text-center hover:bg-green-200 transition" data-type="medicine" data-gift='${JSON.stringify(gift)}' ${count === 0 ? 'disabled style="opacity:0.5"' : ''}>
                <div class="text-xl">${gift.icon}</div>
                <div class="text-sm font-bold">${gift.name}</div>
                <div class="text-xs text-gray-500">×${count}</div>
            </button>
        `;
    }
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
    modal.classList.remove('hidden');
    
    // Обработчики отправки подарков
    document.querySelectorAll('.send-gift-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const gift = JSON.parse(btn.dataset.gift);
            sendGift(friendId, type, gift);
            modal.classList.add('hidden');
        });
    });
}