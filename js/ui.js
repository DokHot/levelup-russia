// js/ui.js
// ============================================================
// UI — УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ И ОТОБРАЖЕНИЕМ
// ============================================================

import { PREMIUM_AVATARS, AVAILABLE_FRAMES } from './config.js';

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
// УВЕДОМЛЕНИЯ
// ============================================================

export function showToast(msg, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' :
                    type === 'error' ? 'bg-red-500' :
                    type === 'warning' ? 'bg-orange-500' : 'bg-blue-500';
    toast.className = `toast-notification ${bgColor}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

export function showConfetti() {
    for (let i = 0; i < 50; i++) {
        const c = document.createElement('div');
        c.className = 'confetti-piece';
        c.style.left = Math.random() * 100 + '%';
        c.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
        c.style.width = (Math.random() * 8 + 4) + 'px';
        c.style.height = c.style.width;
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 2000);
    }
}

// ============================================================
// ОБНОВЛЕНИЕ АВАТАРА (принимает параметры)
// ============================================================

export function updateAvatarDisplay(currentAvatar, currentFrame) {
    if (!elements.userAvatar) return;
    
    let avatarHtml = currentAvatar;
    const premiumAvatar = PREMIUM_AVATARS?.find(a => a.icon === currentAvatar);
    if (premiumAvatar && premiumAvatar.animClass) {
        avatarHtml = `<div class="${premiumAvatar.animClass}" style="font-size: 48px;">${currentAvatar}</div>`;
    }
    if (currentFrame) {
        const frame = AVAILABLE_FRAMES?.find(f => f.id === currentFrame);
        if (frame) {
            avatarHtml = `<div class="${frame.class}" style="width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">${avatarHtml}</div>`;
        }
    }
    elements.userAvatar.innerHTML = avatarHtml;
}

export function updateStatsProgress(completed, total) {
    if (elements.completedCount) elements.completedCount.innerText = completed;
    if (elements.totalCount) elements.totalCount.innerText = total;
    if (elements.progressBar) elements.progressBar.style.width = total > 0 ? `${(completed / total) * 100}%` : '0%';
}

export function renderUrgentBanner(urgentTask) {
    const banner = document.getElementById('urgentTaskBanner');
    if (!urgentTask) {
        if (banner) banner.classList.add('hidden');
        return;
    }
    if (banner) banner.classList.remove('hidden');
    if (elements.urgentText) elements.urgentText.innerText = urgentTask.text;
    if (elements.urgentDesc) elements.urgentDesc.innerText = urgentTask.desc;
    if (elements.urgentReward) elements.urgentReward.innerText = urgentTask.reward;
    if (elements.urgentFastBonus) elements.urgentFastBonus.innerText = urgentTask.fastBonus;
}

// ============================================================
// МОДАЛЬНЫЕ ОКНА
// ============================================================

export function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('hidden');
}

export function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
}

export function showDailyBonusModal(bonus, streak) {
    if (elements.dailyBonusAmount) elements.dailyBonusAmount.innerText = bonus;
    if (elements.dailyStreakBonus) elements.dailyStreakBonus.innerText = streak;
    showModal('dailyBonusModal');
}

export function showQuestCompleteModal(reward, xp) {
    if (elements.questRewardAmount) elements.questRewardAmount.innerText = reward;
    if (elements.questXpAmount) elements.questXpAmount.innerText = xp;
    showModal('questCompleteModal');
}

export function setupModalCloseOnBackground() {
    const modals = ['detailModal', 'deadlineModal', 'surrenderModal', 'dailyBonusModal', 
                    'questCompleteModal', 'replaceQuestModal', 'buyBoosterModal', 
                    'skipTaskModal', 'photoUploadModal', 'addLocationModal', 'mapMarkerModal',
                    'editHistoryModal'];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) hideModal(modalId);
            });
        }
    });
}