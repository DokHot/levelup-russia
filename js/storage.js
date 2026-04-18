// js/storage.js
// ============================================================
// ХРАНИЛИЩЕ — РАЗДЕЛЬНОЕ УПРАВЛЕНИЕ LOCALSTORAGE
// ============================================================

import { safeSetItem, safeGetItem } from './utils.js';

// ============================================================
// КЛЮЧИ ДЛЯ LOCALSTORAGE (оптимизация №1)
// ============================================================

const STORAGE_KEYS = {
    TASKS: 'russia1000_tasks',      // список дел (рекомендуется сохранять отдельно)
    USER: 'russia1000_user',        // прогресс пользователя
    SETTINGS: 'russia1000_settings' // настройки (тема, фон и т.д.)
};

// ============================================================
// РАБОТА С ЗАДАЧАМИ
// ============================================================

/**
 * Сохраняет список дел в localStorage
 * @param {Array} tasks - массив задач
 * @returns {boolean} успех операции
 */
export function saveTasks(tasks) {
    return safeSetItem(STORAGE_KEYS.TASKS, tasks);
}

/**
 * Загружает список дел из localStorage
 * @returns {Array} массив задач или пустой массив
 */
export function loadTasks() {
    return safeGetItem(STORAGE_KEYS.TASKS, []);
}

// ============================================================
// РАБОТА С ПОЛЬЗОВАТЕЛЕМ
// ============================================================

/**
 * Сохраняет данные пользователя в localStorage
 * @param {Object} user - объект пользователя
 * @returns {boolean} успех операции
 */
export function saveUser(user) {
    return safeSetItem(STORAGE_KEYS.USER, user);
}

/**
 * Загружает данные пользователя из localStorage
 * @returns {Object|null} объект пользователя или null
 */
export function loadUser() {
    return safeGetItem(STORAGE_KEYS.USER, null);
}

// ============================================================
// РАБОТА С НАСТРОЙКАМИ
// ============================================================

/**
 * Сохраняет настройки приложения в localStorage
 * @param {Object} settings - объект настроек
 * @returns {boolean} успех операции
 */
export function saveSettings(settings) {
    return safeSetItem(STORAGE_KEYS.SETTINGS, settings);
}

/**
 * Загружает настройки приложения из localStorage
 * @returns {Object} объект настроек или настройки по умолчанию
 */
export function loadSettings() {
    const defaultSettings = {
        theme: 'light',
        background: 'default',
        soundEnabled: false,
        notificationsEnabled: false
    };
    const saved = safeGetItem(STORAGE_KEYS.SETTINGS, null);
    return saved ? { ...defaultSettings, ...saved } : defaultSettings;
}

// ============================================================
// ОБЩИЕ ФУНКЦИИ СОХРАНЕНИЯ
// ============================================================

/**
 * Сохраняет всё состояние приложения
 * @param {Array} tasks - список задач
 * @param {Object} user - пользователь
 * @param {Object} settings - настройки
 * @returns {Object} результат сохранения
 */
export function saveAll(tasks, user, settings) {
    const results = {
        tasks: saveTasks(tasks),
        user: saveUser(user),
        settings: saveSettings(settings)
    };
    return results;
}

/**
 * Загружает всё состояние приложения
 * @returns {Object} { tasks, user, settings }
 */
export function loadAll() {
    return {
        tasks: loadTasks(),
        user: loadUser(),
        settings: loadSettings()
    };
}

/**
 * Очищает все данные приложения (сброс прогресса)
 * @returns {boolean} успех операции
 */
export function clearAllData() {
    try {
        localStorage.removeItem(STORAGE_KEYS.TASKS);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        return true;
    } catch (e) {
        console.error('Ошибка очистки данных:', e);
        return false;
    }
}

/**
 * Экспорт всех данных в JSON (для резервной копии)
 * @returns {string} JSON-строка со всеми данными
 */
export function exportAllData() {
    const allData = {
        tasks: loadTasks(),
        user: loadUser(),
        settings: loadSettings(),
        exportDate: new Date().toISOString(),
        version: '7.0'
    };
    return JSON.stringify(allData, null, 2);
}

/**
 * Импорт данных из JSON (восстановление резервной копии)
 * @param {string} jsonStr - JSON-строка с данными
 * @returns {boolean} успех операции
 */
export function importAllData(jsonStr) {
    try {
        const data = JSON.parse(jsonStr);
        if (data.tasks) saveTasks(data.tasks);
        if (data.user) saveUser(data.user);
        if (data.settings) saveSettings(data.settings);
        return true;
    } catch (e) {
        console.error('Ошибка импорта данных:', e);
        return false;
    }
}