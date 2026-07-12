// js/urgent.js
// ============================================================
// СРОЧНЫЕ ДЕЛА — ГЕНЕРАЦИЯ, ВЫПОЛНЕНИЕ, УВЕДОМЛЕНИЯ
// ============================================================

import { user, addCoins, addPoints, saveUserData } from './user.js';
import { URGENT_TASKS } from './config.js';
import { showToast, showConfetti, renderUrgentBanner } from './ui.js';
import { getBoosterMultiplier } from './boosters.js';
import { checkAchievements } from './achievements.js';
import { checkAvatarRewards } from './avatars.js';
import { renderHistory } from './history.js';
import { addHours, getRemainingTime } from './utils.js';
import { sendUrgentNotification, sendLocalNotification } from './notifications.js';

// ============================================================
// ПЕРЕМЕННЫЕ
// ============================================================

let urgentTimerInterval = null;
let urgentCheckInterval = null;
const URGENT_CHECK_INTERVAL = 60000;

// ============================================================
// ГЕНЕРАЦИЯ
// ============================================================

export function generateUrgentTask() {
    if (user.urgentTask && user.urgentTask.status === "active") {
        if (new Date() > new Date(user.urgentTask.expiresAt)) {
            delete user.urgentTask;
            saveUserData();
            renderUrgentBanner(null);
            showToast('⏰ Время на срочное дело истекло!', 'warning');
            sendLocalNotification('⏰ Срочное дело истекло!', 'Время вышло. Следующее появится позже.', { tag: 'urgent_expired', type: 'warning' });
            return;
        }
        return;
    }
    
    if (user.lastUrgentGenerated) {
        const lastGen = new Date(user.lastUrgentGenerated);
        const now = new Date();
        const hoursSince = (now - lastGen) / (1000 * 60 * 60);
        if (hoursSince < 2) {
            console.log(`⏳ Следующее срочное дело через ${Math.round(2 - hoursSince)} часов`);
            return;
        }
    }
    
    const urgent = URGENT_TASKS[Math.floor(Math.random() * URGENT_TASKS.length)];
    
    user.urgentTask = {
        text: urgent.text,
        desc: urgent.desc,
        timeLimit: urgent.timeLimit,
        reward: urgent.reward,
        fastBonus: urgent.fastBonus,
        xp: urgent.xp,
        generatedAt: new Date().toISOString(),
        expiresAt: addHours(new Date(), urgent.timeLimit).toISOString(),
        status: "active",
        notified: false
    };
    user.lastUrgentGenerated = new Date().toISOString();
    
    saveUserData();
    renderUrgentBanner(user.urgentTask);
    startUrgentTimer();
    
    sendUrgentNotification(urgent.text, urgent.desc, urgent.timeLimit, urgent.reward, urgent.fastBonus);
    showToast(`⚠️ СРОЧНО! ${urgent.text} (${urgent.timeLimit} часа)`, 'warning');
    
    user.urgentTask.notified = true;
    saveUserData();
}

// ============================================================
// ТАЙМЕР
// ============================================================

export function startUrgentTimer() {
    if (urgentTimerInterval) clearInterval(urgentTimerInterval);
    
    urgentTimerInterval = setInterval(() => {
        if (!user.urgentTask || user.urgentTask.status !== "active") {
            clearInterval(urgentTimerInterval);
            urgentTimerInterval = null;
            return;
        }
        
        const remaining = getRemainingTime(user.urgentTask.expiresAt);
        const timerEl = document.getElementById('urgentTimer');
        
        if (timerEl && !remaining.expired) {
            timerEl.textContent = `Осталось: ${remaining.hours}ч ${remaining.minutes}м`;
            
            if (remaining.hours === 0 && remaining.minutes === 30 && !user.urgentTask._reminded30) {
                user.urgentTask._reminded30 = true;
                saveUserData();
                sendLocalNotification('⏰ Срочное дело истекает через 30 минут!', `"${user.urgentTask.text}" — ${user.urgentTask.desc}\nУспейте выполнить!`, {
                    tag: 'urgent_reminder', type: 'warning', vibrate: [300, 100, 300], requireInteraction: true
                });
                showToast('⚠️ Срочное дело истекает через 30 минут!', 'warning');
            }
            
            if (remaining.hours === 0 && remaining.minutes === 5 && !user.urgentTask._reminded5) {
                user.urgentTask._reminded5 = true;
                saveUserData();
                sendLocalNotification('⏰ Срочное дело истекает через 5 минут!', `"${user.urgentTask.text}" — СРОЧНО!`, {
                    tag: 'urgent_reminder_5', type: 'error', vibrate: [500, 200, 500], requireInteraction: true
                });
                showToast('⚠️ Срочное дело истекает через 5 минут!', 'error');
            }
        } else if (remaining.expired) {
            clearInterval(urgentTimerInterval);
            urgentTimerInterval = null;
            sendLocalNotification('⏰ Время вышло!', `Срочное дело "${user.urgentTask.text}" не выполнено вовремя.`, {
                tag: 'urgent_expired', type: 'error', vibrate: [300, 100, 300]
            });
            showToast('⏰ Время на срочное дело истекло!', 'error');
            delete user.urgentTask;
            renderUrgentBanner(null);
            saveUserData();
        }
    }, 10000);
}

export function startUrgentCheck() {
    if (urgentCheckInterval) clearInterval(urgentCheckInterval);
    urgentCheckInterval = setInterval(() => {
        if (!user.urgentTask || user.urgentTask.status !== "active") {
            generateUrgentTask();
        }
    }, URGENT_CHECK_INTERVAL);
}

// ============================================================
// ВЫПОЛНЕНИЕ
// ============================================================

export function completeUrgentTask() {
    if (!user.urgentTask) {
        showToast('❌ Нет активного срочного дела', 'error');
        return;
    }
    
    const urgent = user.urgentTask;
    const now = new Date();
    
    if (now > new Date(urgent.expiresAt)) {
        showToast('⏰ Время вышло!', 'error');
        delete user.urgentTask;
        renderUrgentBanner(null);
        saveUserData();
        sendLocalNotification('⏰ Время вышло!', 'Срочное дело не выполнено вовремя.', { tag: 'urgent_expired', type: 'error' });
        return;
    }
    
    const timeElapsed = (now - new Date(urgent.generatedAt)) / (1000 * 60 * 60);
    const isFast = timeElapsed < (urgent.timeLimit / 2);
    
    let reward = urgent.reward;
    if (isFast) {
        reward += urgent.fastBonus;
        showToast(`⚡ Быстро! +${urgent.fastBonus} бонус`, 'success');
    }
    
    const xpMultiplier = getBoosterMultiplier('xp');
    const coinMultiplier = getBoosterMultiplier('coin');
    const finalReward = Math.floor(reward * coinMultiplier);
    const finalXp = Math.floor(urgent.xp * xpMultiplier);
    
    addCoins(finalReward);
    addPoints(finalXp);
    user.stats.tasksCompleted++;
    user.stats.urgentCompleted++;
    
    user.completedTasks.unshift({
        id: Date.now(),
        text: urgent.text,
        category: "Срочное",
        reward: finalReward,
        xp: finalXp,
        isFast: isFast,
        completedAt: new Date().toISOString(),
        type: "urgent"
    });
    
    delete user.urgentTask;
    saveUserData();
    
    showConfetti(80);
    renderUrgentBanner(null);
    
    sendLocalNotification('✅ Срочное дело выполнено!', `"${urgent.text}"\n💰 +${finalReward} монет\n⭐ +${finalXp} опыта${isFast ? '\n⚡ Бонус за скорость!' : ''}`, {
        tag: 'urgent_complete', type: 'success', vibrate: [200, 100, 200, 100, 200]
    });
    
    showToast(`✅ Срочное дело выполнено! +${finalReward} монет`, 'success');
    checkAchievements();
    checkAvatarRewards();
    renderHistory();
    
    setTimeout(() => generateUrgentTask(), 120000);
}

// ============================================================
// ПРОПУСК
// ============================================================

export function skipUrgentTask() {
    if (!user.urgentTask) {
        showToast('❌ Нет активного срочного дела', 'error');
        return;
    }
    
    const taskText = user.urgentTask.text;
    delete user.urgentTask;
    user.stats.urgentSkipped++;
    saveUserData();
    renderUrgentBanner(null);
    showToast('⏭️ Срочное дело пропущено', 'info');
    
    sendLocalNotification('⏭️ Срочное дело пропущено', `Вы пропустили "${taskText}". Следующее появится позже.`, { tag: 'urgent_skipped', type: 'info' });
    
    setTimeout(() => generateUrgentTask(), 120000);
}

// ============================================================
// ОСТАНОВКА
// ============================================================

export function stopUrgentTimers() {
    if (urgentTimerInterval) {
        clearInterval(urgentTimerInterval);
        urgentTimerInterval = null;
    }
    if (urgentCheckInterval) {
        clearInterval(urgentCheckInterval);
        urgentCheckInterval = null;
    }
}

// ============================================================
// ПРОВЕРКА СТАТУСА
// ============================================================

export function checkUrgentStatus() {
    if (!user.urgentTask) {
        renderUrgentBanner(null);
        return;
    }
    
    if (user.urgentTask.status !== "active") {
        renderUrgentBanner(null);
        return;
    }
    
    const remaining = getRemainingTime(user.urgentTask.expiresAt);
    if (remaining.expired) {
        delete user.urgentTask;
        saveUserData();
        renderUrgentBanner(null);
        sendLocalNotification('⏰ Срочное дело истекло!', 'Время на выполнение срочного дела вышло.', { tag: 'urgent_expired', type: 'warning' });
        return;
    }
    
    renderUrgentBanner(user.urgentTask);
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

export function initUrgentSystem() {
    console.log('⚡ Инициализация системы срочных дел...');
    checkUrgentStatus();
    
    if (!user.urgentTask) {
        if (user.lastUrgentGenerated) {
            const lastGen = new Date(user.lastUrgentGenerated);
            const now = new Date();
            const hoursSince = (now - lastGen) / (1000 * 60 * 60);
            if (hoursSince >= 2) {
                generateUrgentTask();
            } else {
                console.log(`⏳ Следующее срочное дело через ${Math.round(2 - hoursSince)} часов`);
                setTimeout(() => generateUrgentTask(), (2 - hoursSince) * 60 * 60 * 1000);
            }
        } else {
            generateUrgentTask();
        }
    } else {
        startUrgentTimer();
    }
    
    startUrgentCheck();
    console.log('✅ Система срочных дел инициализирована');
}