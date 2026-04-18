// js/utils.js
// ============================================================
// УТИЛИТЫ — ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

// ============================================================
// ФОРМАТИРОВАНИЕ ДАТ
// ============================================================

export function formatDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString('ru-RU');
}

export function formatDateTime(d) {
    if (!d) return "—";
    return new Date(d).toLocaleString('ru-RU');
}

// ============================================================
// РАБОТА С ДАТАМИ
// ============================================================

export function addDays(date, days) {
    const r = new Date(date);
    r.setDate(r.getDate() + days);
    return r;
}

export function addHours(date, hours) {
    const r = new Date(date);
    r.setHours(r.getHours() + hours);
    return r;
}

export function getRemainingTime(deadline) {
    const diff = new Date(deadline) - new Date();
    if (diff <= 0) return { hours: 0, minutes: 0, expired: true };
    return {
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        expired: false
    };
}

// ============================================================
// ESCAPE HTML
// ============================================================

export function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ============================================================
// НОВЫЕ ФУНКЦИИ ДЛЯ v7.5
// ============================================================

export function memoize(fn, keyFn = JSON.stringify) {
    const cache = new Map();
    return (...args) => {
        const key = keyFn(args);
        if (cache.has(key)) return cache.get(key);
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
}

export function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn(...args);
            timer = null;
        }, delay);
    };
}

export function throttle(fn, limit) {
    let inThrottle = false;
    let lastArgs = null;
    
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
                if (lastArgs) {
                    fn(...lastArgs);
                    lastArgs = null;
                }
            }, limit);
        } else {
            lastArgs = args;
        }
    };
}

export function formatFileSize(bytes) {
    if (bytes === undefined || bytes === null) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

export function isOnline() {
    return navigator.onLine !== false;
}

export function generateUniqueId() {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function safeSetItem(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Ошибка сохранения в localStorage:', e);
        return false;
    }
}

export function safeGetItem(key, defaultValue = null) {
    try {
        const saved = localStorage.getItem(key);
        if (saved) {
            return JSON.parse(saved);
        }
        return defaultValue;
    } catch (e) {
        console.error('Ошибка загрузки из localStorage:', e);
        return defaultValue;
    }
}

export function isNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

export function isEmptyObject(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isDesktop() {
    return !isMobile();
}