// js/urgent.js
import { user, addCoins, addPoints, saveUserData } from './user.js';
import { URGENT_TASKS } from './config.js';
import { showToast, showConfetti } from './ui.js';
import { getBoosterMultiplier } from './boosters.js';
import { checkAchievements } from './achievements.js';
import { checkAvatarRewards } from './avatars.js';
import { renderHistory } from './history.js';
import { addHours, getRemainingTime } from './utils.js';

let urgentTimerInterval = null;

export function generateUrgentTask() {
    if (user.urgentTask && user.urgentTask.status === "active") return;
    if (user.lastUrgentGenerated && (Date.now() - new Date(user.lastUrgentGenerated)) < 86400000) return;
    
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
        status: "active"
    };
    user.lastUrgentGenerated = new Date().toISOString();
    renderUrgentBanner();
    startUrgentTimer();
    showToast(`⚠️ СРОЧНО! ${urgent.text} (${urgent.timeLimit} часа)`, 'warning');
}

function startUrgentTimer() {
    if (urgentTimerInterval) clearInterval(urgentTimerInterval);
    urgentTimerInterval = setInterval(() => {
        if (!user.urgentTask || user.urgentTask.status !== "active") {
            clearInterval(urgentTimerInterval);
            return;
        }
        const remaining = getRemainingTime(user.urgentTask.expiresAt);
        const timerEl = document.getElementById('urgentTimer');
        if (timerEl && !remaining.expired) {
            timerEl.textContent = `Осталось: ${remaining.hours}ч ${remaining.minutes}м`;
        } else if (remaining.expired) {
            clearInterval(urgentTimerInterval);
            showToast('⏰ Время на срочное дело истекло!', 'error');
            delete user.urgentTask;
            renderUrgentBanner();
            saveUserData();
        }
    }, 60000);
}

export function completeUrgentTask() {
    if (!user.urgentTask) return;
    const urgent = user.urgentTask;
    const now = new Date();
    if (now > new Date(urgent.expiresAt)) {
        showToast('⏰ Время вышло!', 'error');
        delete user.urgentTask;
        renderUrgentBanner();
        saveUserData();
        return;
    }
    
    const isFast = (now - new Date(urgent.generatedAt)) < (urgent.timeLimit * 3600000 / 2);
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
    showConfetti();
    showToast(`✅ Срочное дело выполнено! +${finalReward} монет`, 'success');
    renderUrgentBanner();
    checkAchievements();
    checkAvatarRewards();
    renderHistory();
}

export function skipUrgentTask() {
    if (!user.urgentTask) return;
    delete user.urgentTask;
    user.stats.urgentSkipped++;
    saveUserData();
    renderUrgentBanner();
    showToast('Срочное дело пропущено', 'info');
}

function renderUrgentBanner() {
    const banner = document.getElementById('urgentTaskBanner');
    if (!user.urgentTask) {
        banner.classList.add('hidden');
        return;
    }
    banner.classList.remove('hidden');
    document.getElementById('urgentText').innerText = user.urgentTask.text;
    document.getElementById('urgentDesc').innerText = user.urgentTask.desc;
    document.getElementById('urgentReward').innerText = user.urgentTask.reward;
    document.getElementById('urgentFastBonus').innerText = user.urgentTask.fastBonus;
    const remaining = getRemainingTime(user.urgentTask.expiresAt);
    document.getElementById('urgentTimer').innerHTML = `Осталось: ${remaining.hours}ч ${remaining.minutes}м`;
}