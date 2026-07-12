// js/notifications.js
// ============================================================
// УВЕДОМЛЕНИЯ — ПРОСТАЯ ВЕРСИЯ (БЕЗ ДУБЛЕЙ)
// ============================================================

import { user } from './user.js';
import { showToast } from './ui.js';

// ============================================================
// ПЕРЕМЕННЫЕ
// ============================================================

let isSubscribed = false;
let subscription = null;
let notificationPermission = 'default';
const VAPID_PUBLIC_KEY = 'ВАШ_PUBLIC_KEY';

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ
// ============================================================

function urlBase64ToUint8Array(base64String) {
    try {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    } catch (e) {
        return new Uint8Array(0);
    }
}

function fallbackNotify(title, body) {
    console.log(`🔔 ${title}: ${body}`);
    showToast(`🔔 ${title}`, 'info');
    return true;
}

// ============================================================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================================================

export function isPushSupported() {
    try {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    } catch (e) {
        return false;
    }
}

export function getNotificationPermission() {
    try { return Notification.permission || 'default'; } catch (e) { return 'default'; }
}

export async function requestNotificationPermission() {
    try {
        if (!isPushSupported()) {
            showToast('ℹ️ Уведомления работают в режиме тостов', 'info');
            return true;
        }
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
        if (permission === 'granted') {
            showToast('✅ Уведомления разрешены!', 'success');
            await subscribeToPush();
        } else {
            showToast('ℹ️ Уведомления будут показываться как тосты', 'info');
        }
        return true;
    } catch (e) {
        showToast('ℹ️ Уведомления работают в режиме тостов', 'info');
        return true;
    }
}

export async function subscribeToPush() {
    try {
        if (!isPushSupported()) return true;
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
            subscription = existing;
            isSubscribed = true;
            return true;
        }
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        isSubscribed = true;
        return true;
    } catch (e) {
        return true;
    }
}

export async function unsubscribeFromPush() {
    try {
        if (!isPushSupported() || !isSubscribed) return true;
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
            await sub.unsubscribe();
            isSubscribed = false;
            subscription = null;
        }
        return true;
    } catch (e) {
        return true;
    }
}

export function sendLocalNotification(title, body, options = {}) {
    console.log(`📨 [УВЕДОМЛЕНИЕ] ${title}`, body);
    
    try {
        if ('Notification' in window && Notification.permission === 'granted') {
            const sw = navigator.serviceWorker?.ready;
            if (sw) {
                sw.then(reg => {
                    reg.showNotification(title, {
                        body: body,
                        icon: options.icon || '/icons/icon-192.png',
                        vibrate: options.vibrate || [200, 100, 200],
                        data: { url: options.url || '/', taskId: options.taskId || null },
                        tag: options.tag || 'general',
                        requireInteraction: options.requireInteraction || false
                    });
                }).catch(() => fallbackNotify(title, body));
                return true;
            }
        }
    } catch (e) {}
    
    fallbackNotify(title, body);
    return true;
}

export function sendUrgentNotification(taskText, taskDesc, timeLimit, reward, fastBonus) {
    return sendLocalNotification(
        '⚠️ СРОЧНОЕ ДЕЛО!',
        `${taskText}\n${taskDesc}\n💰 ${reward}₿\n⏰ ${timeLimit}ч`,
        { tag: 'urgent', vibrate: [300, 100, 300], requireInteraction: true }
    );
}

export function sendTaskCompleteNotification(taskText, reward) {
    return sendLocalNotification('🎉 Дело выполнено!', `"${taskText}"\n💰 +${reward} монет`, { tag: 'complete' });
}

export function sendAchievementNotification(name, reward) {
    return sendLocalNotification('🏆 Достижение!', `${name}\n💰 +${reward} монет`, { tag: 'achievement' });
}

export function sendLevelUpNotification(level, title, reward) {
    return sendLocalNotification('🎉 Повышение уровня!', `Уровень ${level} — ${title}\n💰 +${reward} монет`, { tag: 'levelup' });
}

export function sendDailyReminder() {
    const completed = user.stats?.tasksCompleted || 0;
    return sendLocalNotification('🌅 Доброе утро!', `✅ Выполнено: ${completed} дел`, { tag: 'daily' });
}

export function showTestNotification() {
    return sendLocalNotification('🔔 Уведомления работают!', 'Это тестовое уведомление. Всё настроено правильно!', { tag: 'test', requireInteraction: true });
}

export function scheduleDailyReminder() {
    try {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        const delay = tomorrow - now;
        if (delay > 0) {
            setTimeout(() => {
                sendDailyReminder();
                scheduleDailyReminder();
            }, delay);
        }
    } catch (e) {}
}

export async function initNotifications() {
    console.log('🔔 Инициализация уведомлений...');
    try {
        if (!isPushSupported()) {
            console.log('ℹ️ Push не поддерживается, использую тосты');
            scheduleDailyReminder();
            return;
        }
        await navigator.serviceWorker.ready;
        console.log('✅ Service Worker готов');
        notificationPermission = Notification.permission;
        if (notificationPermission === 'granted') {
            await subscribeToPush();
        }
        scheduleDailyReminder();
        console.log('✅ Уведомления инициализированы');
    } catch (e) {
        console.warn('⚠️ Ошибка, использую тосты:', e.message);
        scheduleDailyReminder();
    }
}