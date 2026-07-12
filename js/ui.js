// js/ui.js
// ============================================================
// UI — УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ И ОТОБРАЖЕНИЕМ
// Версия 1.0 — с поддержкой уведомлений
// ============================================================

import { PREMIUM_AVATARS, AVAILABLE_FRAMES } from './config.js';
import { 
    sendLocalNotification, 
    sendAchievementNotification, 
    sendLevelUpNotification, 
    sendTaskCompleteNotification 
} from './notifications.js';

// ============================================================
// КЕШИРОВАНИЕ DOM-ЭЛЕМЕНТОВ
// ============================================================

export const elements = {
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    userLevel: document.getElementById('userLevel'),
    userTitle: document.getElementById('userTitle'),
    userPoints: document.getElementById('userPoints'),
    userCoins: document.getElementById('userCoins'),
    levelProgressText: document.getElementById('levelProgressText'),
    levelProgressFill: document.getElementById('levelProgressFill'),
    dailyStreak: document.getElementById('dailyStreak'),
    achievementCount: document.getElementById('achievementCount'),
    completedTasksCount: document.getElementById('completedTasksCount'),
    activeTasksCount: document.getElementById('activeTasksCount'),
    photosCount: document.getElementById('photosCount'),
    markersCount: document.getElementById('markersCount'),
    completedCount: document.getElementById('completedCount'),
    totalCount: document.getElementById('totalCount'),
    progressBar: document.getElementById('progressBar'),
    urgentText: document.getElementById('urgentText'),
    urgentDesc: document.getElementById('urgentDesc'),
    urgentReward: document.getElementById('urgentReward'),
    urgentFastBonus: document.getElementById('urgentFastBonus'),
    urgentTimer: document.getElementById('urgentTimer'),
    dailyBonusAmount: document.getElementById('dailyBonusAmount'),
    dailyStreakBonus: document.getElementById('dailyStreakBonus'),
    questRewardAmount: document.getElementById('questRewardAmount'),
    questXpAmount: document.getElementById('questXpAmount'),
    currentQuestText: document.getElementById('currentQuestText'),
    photoTaskName: document.getElementById('photoTaskName'),
    locationTaskName: document.getElementById('locationTaskName'),
    markerTaskTitle: document.getElementById('markerTaskTitle'),
    markerTaskCategory: document.getElementById('markerTaskCategory'),
    markerTaskDate: document.getElementById('markerTaskDate')
};

// ============================================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ
// ============================================================

function getRemainingTime(deadline) {
    const diff = new Date(deadline) - new Date();
    if (diff <= 0) return { hours: 0, minutes: 0, expired: true };
    return {
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        expired: false
    };
}

// ============================================================
// УВЕДОМЛЕНИЯ (TOAST)
// ============================================================

export function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' :
                    type === 'error' ? 'bg-red-500' :
                    type === 'warning' ? 'bg-orange-500' : 'bg-blue-500';
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    toast.className = `toast-notification ${bgColor}`;
    toast.innerHTML = `<i class="fas ${iconMap[type] || 'fa-info-circle'} mr-2"></i>${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================================
// КОНФЕТТИ
// ============================================================

export function showConfetti(count = 50) {
    const colors = ['#fbbf24', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316'];
    for (let i = 0; i < count; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        c.style.left = Math.random() * 100 + '%';
        c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        c.style.width = (Math.random() * 8 + 4) + 'px';
        c.style.height = c.style.width;
        c.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
        c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 3000);
    }
}

// ============================================================
// ОБНОВЛЕНИЕ АВАТАРА
// ============================================================

export function updateAvatarDisplay(currentAvatar, currentFrame) {
    if (!elements.userAvatar) return;
    
    let avatarHtml = currentAvatar || '🏆';
    const premiumAvatar = PREMIUM_AVATARS?.find(a => a.icon === currentAvatar);
    if (premiumAvatar && premiumAvatar.animClass) {
        avatarHtml = `<div class="${premiumAvatar.animClass}" style="font-size: 48px; line-height: 1;">${currentAvatar}</div>`;
    }
    if (currentFrame) {
        const frame = AVAILABLE_FRAMES?.find(f => f.id === currentFrame);
        if (frame) {
            avatarHtml = `<div class="${frame.class}" style="width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">${avatarHtml}</div>`;
        }
    }
    elements.userAvatar.innerHTML = avatarHtml;
}

// ============================================================
// ОБНОВЛЕНИЕ СТАТИСТИКИ ПРОГРЕССА
// ============================================================

export function updateStatsProgress(completed, total) {
    if (elements.completedCount) elements.completedCount.innerText = completed;
    if (elements.totalCount) elements.totalCount.innerText = total;
    if (elements.progressBar) {
        const percent = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
        elements.progressBar.style.width = percent + '%';
    }
}

// ============================================================
// СРОЧНОЕ ЗАДАНИЕ (БАННЕР)
// ============================================================

export function renderUrgentBanner(urgentTask) {
    const banner = document.getElementById('urgentTaskBanner');
    if (!urgentTask) {
        if (banner) banner.classList.add('hidden');
        return;
    }
    if (banner) banner.classList.remove('hidden');
    if (elements.urgentText) elements.urgentText.innerText = urgentTask.text || '—';
    if (elements.urgentDesc) elements.urgentDesc.innerText = urgentTask.desc || '—';
    if (elements.urgentReward) elements.urgentReward.innerText = urgentTask.reward || 0;
    if (elements.urgentFastBonus) elements.urgentFastBonus.innerText = urgentTask.fastBonus || 0;
    
    if (urgentTask.expiresAt) {
        const remaining = getRemainingTime(urgentTask.expiresAt);
        if (elements.urgentTimer) {
            if (remaining.expired) {
                elements.urgentTimer.innerHTML = '⏰ ВРЕМЯ ВЫШЛО!';
                elements.urgentTimer.className = 'text-xs mt-1 font-mono text-red-300';
            } else {
                elements.urgentTimer.innerHTML = `Осталось: ${remaining.hours}ч ${remaining.minutes}м`;
                elements.urgentTimer.className = 'text-xs mt-1 font-mono text-white/80';
            }
        }
    }
}

// ============================================================
// МОДАЛЬНЫЕ ОКНА
// ============================================================

export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

export function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

export function showDailyBonusModal(bonus, streak) {
    if (elements.dailyBonusAmount) elements.dailyBonusAmount.innerText = bonus;
    if (elements.dailyStreakBonus) elements.dailyStreakBonus.innerText = streak || 0;
    showModal('dailyBonusModal');
    
    if (bonus >= 30) {
        sendLocalNotification(
            '🎁 Ежедневный бонус!',
            `Вы получили ${bonus} монет за ${streak || 0} дней подряд!`,
            { tag: 'daily_bonus', type: 'success' }
        );
    }
}

export function showQuestCompleteModal(reward, xp) {
    if (elements.questRewardAmount) elements.questRewardAmount.innerText = reward;
    if (elements.questXpAmount) elements.questXpAmount.innerText = xp;
    showModal('questCompleteModal');
    
    sendLocalNotification(
        '🎉 Случайное дело выполнено!',
        `Вы получили ${reward} монет и ${xp} опыта!`,
        { tag: 'quest_complete', type: 'success' }
    );
}

// ============================================================
// НАСТРОЙКА МОДАЛЬНЫХ ОКОН
// ============================================================

export function setupModalCloseOnBackground() {
    const modals = [
        'detailModal', 
        'deadlineModal', 
        'surrenderModal', 
        'dailyBonusModal', 
        'questCompleteModal', 
        'replaceQuestModal', 
        'buyBoosterModal', 
        'skipTaskModal', 
        'photoUploadModal', 
        'addLocationModal', 
        'mapMarkerModal',
        'editHistoryModal',
        'profileModal',
        'settingsModal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    hideModal(modalId);
                }
            });
        }
    });
}

// ============================================================
// 🆕 УВЕДОМЛЕНИЯ ПРИ СОБЫТИЯХ (ОТДЕЛЬНЫЕ ФУНКЦИИ)
// ============================================================

export function notifyTaskComplete(taskText, reward) {
    sendTaskCompleteNotification(taskText, reward);
}

export function notifyAchievement(name, reward) {
    sendAchievementNotification(name, reward);
}

export function notifyLevelUp(level, title, reward) {
    sendLevelUpNotification(level, title, reward);
}

// ============================================================
// 🆕 НАСТРОЙКА ОБРАБОТЧИКОВ КАСТОМНЫХ СОБЫТИЙ
// ============================================================

export function setupNotificationEvents() {
    // Уровень
    document.addEventListener('levelUp', (e) => {
        const { level, title, reward } = e.detail;
        showToast(`🎉 ПОВЫШЕНИЕ УРОВНЯ! ${title} +${reward} монет!`, 'success');
        showConfetti(60);
        notifyLevelUp(level, title, reward);
    });
    
    // Достижения
    document.addEventListener('categoryAchievement', (e) => {
        const { name, level, reward } = e.detail;
        showToast(`🏆 ${name} — ${level}! +${reward} монет`, 'success');
        showConfetti(40);
        notifyAchievement(name, reward);
    });
    
    // Ежедневный бонус
    document.addEventListener('dailyBonus', (e) => {
        const { bonus, streak } = e.detail;
        showDailyBonusModal(bonus, streak);
    });
    
    // Срочное дело
    document.addEventListener('urgentTaskUpdated', () => {
        const urgentTask = window.user?.urgentTask;
        if (urgentTask) {
            renderUrgentBanner(urgentTask);
        }
    });
    
    // Обновление монет
    document.addEventListener('coinsUpdated', () => {
        const coinsEl = document.getElementById('userCoins');
        if (coinsEl && window.user) {
            coinsEl.innerText = window.user.coins || 0;
        }
    });
    
    // Обновление опыта
    document.addEventListener('pointsUpdated', () => {
        const pointsEl = document.getElementById('userPoints');
        if (pointsEl && window.user) {
            pointsEl.innerText = window.user.totalPoints || 0;
        }
    });
    
    // Выполнение дела (из activeTasks)
    document.addEventListener('taskCompleted', (e) => {
        const { text, reward } = e.detail;
        showToast(`✅ "${text}" выполнено! +${reward} монет`, 'success');
        showConfetti(30);
        notifyTaskComplete(text, reward);
    });
}

// ============================================================
// ✅ ЕДИНЫЙ ЭКСПОРТ — ВСЕ ФУНКЦИИ В ОДНОМ МЕСТЕ
// ============================================================

export {
    getRemainingTime,
    // Все функции уже экспортированы выше через export function
    // Этот блок оставлен для ясности, но не создаёт дублей
};