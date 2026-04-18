// js/boosters.js
// ============================================================
// БУСТЕРЫ — ВРЕМЕННЫЕ УСИЛЕНИЯ
// ============================================================

import { user, spendCoins, saveUserData } from './user.js';
import { AVAILABLE_BOOSTERS } from './config.js';
import { showToast, showConfetti } from './ui.js';

// ============================================================
// ПЕРЕМЕННЫЕ
// ============================================================

let boosterTimerInterval = null;
let selectedBooster = null;

// ============================================================
// ПОЛУЧЕНИЕ МНОЖИТЕЛЕЙ
// ============================================================

/**
 * Получает множитель для бустеров (опыт или монеты)
 * @param {string} type - тип множителя ('xp' или 'coin')
 * @returns {number} множитель (1.0, 1.5, 2.0 и т.д.)
 */
export function getBoosterMultiplier(type) {
    let multiplier = 1.0;
    const now = Date.now();
    
    for (const booster of user.activeBoosters) {
        if (booster.expiresAt > now) {
            if (booster.effect.type === 'xp_multiplier' && type === 'xp') {
                multiplier = Math.max(multiplier, booster.effect.value);
            }
            if (booster.effect.type === 'coin_multiplier' && type === 'coin') {
                multiplier = Math.max(multiplier, booster.effect.value);
            }
        }
    }
    return multiplier;
}

/**
 * Получает коэффициент снижения штрафа за просрочку
 * @returns {number} коэффициент (1.0 — без защиты, 0.5 — защита 50%)
 */
export function getPenaltyReduction() {
    let reduction = 1.0;
    const now = Date.now();
    
    for (const booster of user.activeBoosters) {
        if (booster.expiresAt > now && booster.effect.type === 'penalty_reduction') {
            reduction = Math.min(reduction, booster.effect.value);
        }
    }
    return reduction;
}

// ============================================================
// ТАЙМЕРЫ БУСТЕРОВ
// ============================================================

/**
 * Запускает таймер для проверки истечения бустеров
 */
export function startBoosterTimers() {
    if (boosterTimerInterval) clearInterval(boosterTimerInterval);
    
    boosterTimerInterval = setInterval(() => {
        const now = Date.now();
        let changed = false;
        
        for (let i = user.activeBoosters.length - 1; i >= 0; i--) {
            if (user.activeBoosters[i].expiresAt <= now) {
                user.activeBoosters.splice(i, 1);
                changed = true;
            }
        }
        
        if (changed) {
            saveUserData();
            renderBoosters();
            showToast('⏰ Один из бустеров закончился!', 'info');
        }
    }, 1000);
}

// ============================================================
// ПОКУПКА БУСТЕРА
// ============================================================

/**
 * Покупает и активирует бустер
 * @param {Object} booster - объект бустера
 */
export function purchaseBooster(booster) {
    if (!spendCoins(booster.price)) {
        showToast(`Не хватает монет! Нужно ${booster.price}`, 'error');
        return;
    }
    
    user.activeBoosters.push({
        id: booster.id,
        name: booster.name,
        effect: booster.effect,
        expiresAt: Date.now() + booster.duration
    });
    
    saveUserData();
    renderBoosters();
    showToast(`✅ ${booster.name} активирован!`, 'success');
    showConfetti();
}

// ============================================================
// ОТРИСОВКА БУСТЕРОВ
// ============================================================

/**
 * Рендер секции бустеров (активные и доступные)
 */
export function renderBoosters() {
    const activeContainer = document.getElementById('activeBoosters');
    const boostersGrid = document.getElementById('boostersGrid');
    
    if (!activeContainer || !boostersGrid) return;
    
    const now = Date.now();
    const active = user.activeBoosters.filter(b => b.expiresAt > now);
    
    // Активные бустеры
    if (active.length === 0) {
        activeContainer.innerHTML = '<p class="text-gray-500 text-center">Нет активных бустеров</p>';
    } else {
        let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-3">';
        for (const b of active) {
            const remaining = Math.max(0, b.expiresAt - now);
            const minutes = Math.floor(remaining / 60000);
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            const timeStr = hours > 0 ? `${hours}ч ${mins}м` : `${mins} минут`;
            
            html += `
                <div class="booster-active p-3 rounded-xl flex justify-between items-center">
                    <div>
                        <span class="font-bold">${b.name}</span>
                        <br>
                        <span class="text-xs opacity-80">${timeStr}</span>
                    </div>
                    <span class="text-xs bg-white/20 px-2 py-1 rounded-full">активен</span>
                </div>
            `;
        }
        html += '</div>';
        activeContainer.innerHTML = html;
    }
    
    // Доступные бустеры
    let html = '';
    for (const b of AVAILABLE_BOOSTERS) {
        html += `
            <div class="glass-card rounded-xl p-4 text-center">
                <div class="text-4xl mb-2">${b.icon}</div>
                <h3 class="font-bold">${b.name}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">${b.desc}</p>
                <div class="coin inline-block mb-3">💰 ${b.price} монет</div>
                <button class="buy-booster-btn w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm transition" data-id="${b.id}">АКТИВИРОВАТЬ</button>
            </div>
        `;
    }
    boostersGrid.innerHTML = html;
    
    // Обработчики кнопок покупки
    document.querySelectorAll('.buy-booster-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            selectedBooster = AVAILABLE_BOOSTERS.find(b => b.id === id);
            if (selectedBooster) {
                document.getElementById('boosterModalIcon').innerText = selectedBooster.icon;
                document.getElementById('boosterModalTitle').innerText = selectedBooster.name;
                document.getElementById('boosterModalDesc').innerText = selectedBooster.desc;
                document.getElementById('boosterModalPrice').innerHTML = `Стоимость: ${selectedBooster.price} монет`;
                document.getElementById('buyBoosterModal').classList.remove('hidden');
            }
        });
    });
}

/**
 * Подтверждает покупку бустера (вызывается из модалки)
 */
export function confirmBoosterPurchase() {
    if (selectedBooster) {
        purchaseBooster(selectedBooster);
        document.getElementById('buyBoosterModal').classList.add('hidden');
        selectedBooster = null;
    }
}