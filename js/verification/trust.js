// js/verification/trust.js
// ============================================================
// СИСТЕМА ДОВЕРИЯ — РЕПУТАЦИЯ ИГРОКА (версия 7.4)
// ============================================================

import { user, addCoins, saveUserData } from '../user.js';
import { showToast } from '../ui.js';

// Уровни доверия
export const TRUST_LEVELS = {
    newbie: { name: '🟢 Новичок', minPoints: 0, bonus: 0, icon: '🟢' },
    verified: { name: '🔵 Проверенный', minPoints: 10, bonus: 5, icon: '🔵' },
    reliable: { name: '🟡 Надёжный', minPoints: 50, bonus: 10, icon: '🟡' },
    expert: { name: '🟠 Эксперт', minPoints: 100, bonus: 15, icon: '🟠' },
    master: { name: '🔴 Мастер', minPoints: 500, bonus: 25, icon: '🔴' }
};

/**
 * Добавляет очки доверия
 * @param {number} points - количество очков
 * @param {string} reason - причина (verified_task, confirmed_task)
 */
export function addTrustPoints(points, reason) {
    if (!user.trust) {
        user.trust = { points: 0, level: 'newbie', verifiedTasks: 0, confirmedTasks: 0, reports: 0 };
    }
    
    user.trust.points += points;
    
    if (reason === 'verified_task') {
        user.trust.verifiedTasks = (user.trust.verifiedTasks || 0) + 1;
        user.stats.verifiedTasks = (user.stats.verifiedTasks || 0) + 1;
    } else if (reason === 'confirmed_task') {
        user.trust.confirmedTasks = (user.trust.confirmedTasks || 0) + 1;
        user.stats.confirmedTasks = (user.stats.confirmedTasks || 0) + 1;
    }
    
    checkTrustLevelUp();
    saveUserData();
}

/**
 * Проверяет и повышает уровень доверия
 */
function checkTrustLevelUp() {
    const currentLevel = user.trust.level || 'newbie';
    const currentPoints = user.trust.points || 0;
    
    let newLevel = currentLevel;
    
    for (const [levelKey, levelData] of Object.entries(TRUST_LEVELS)) {
        if (currentPoints >= levelData.minPoints) {
            newLevel = levelKey;
        }
    }
    
    if (newLevel !== currentLevel) {
        user.trust.level = newLevel;
        const reward = TRUST_LEVELS[newLevel].bonus * 10;
        addCoins(reward);
        showToast(`🏆 Ваш уровень доверия повышен до ${TRUST_LEVELS[newLevel].name}! +${reward} монет`, 'success');
    }
}

/**
 * Получает текущий уровень доверия
 * @returns {Object} уровень доверия
 */
export function getTrustLevel() {
    const levelKey = user.trust?.level || 'newbie';
    return TRUST_LEVELS[levelKey];
}

/**
 * Получает бонус от системы доверия
 * @returns {number} бонус в процентах
 */
export function getTrustBonus() {
    const levelKey = user.trust?.level || 'newbie';
    return TRUST_LEVELS[levelKey].bonus;
}

/**
 * Проверяет, может ли игрок подтверждать дела
 * @returns {boolean}
 */
export function canConfirmTasks() {
    const levelKey = user.trust?.level || 'newbie';
    // Для подтверждения нужно быть хотя бы "Проверенным"
    return levelKey !== 'newbie';
}

/**
 * Добавляет жалобу на пользователя (штраф)
 * @param {string} targetUserId - ID пользователя
 * @param {string} reason - причина жалобы
 */
export function reportUser(targetUserId, reason) {
    // В реальном приложении здесь был бы запрос к серверу
    // Для тестов просто штрафуем текущего пользователя
    if (!user.trust) {
        user.trust = { points: 0, level: 'newbie', verifiedTasks: 0, confirmedTasks: 0, reports: 0 };
    }
    
    user.trust.reports = (user.trust.reports || 0) + 1;
    user.trust.lastReportDate = Date.now();
    
    // Штраф: -10 очков доверия за жалобу
    user.trust.points = Math.max(0, (user.trust.points || 0) - 10);
    
    checkTrustLevelUp();
    saveUserData();
    showToast('⚠️ Жалоба отправлена. За ложные жалобы предусмотрен штраф', 'warning');
}