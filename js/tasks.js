// js/tasks.js
// ============================================================
// ЗАДАЧИ — ЗАГРУЗКА И УПРАВЛЕНИЕ СПИСКОМ ДЕЛ
// ============================================================

import { DIFFICULTY_CONFIG } from './config.js';
import { loadTasks, saveTasks } from './storage.js';
import { showToast } from './ui.js';

// ============================================================
// ПЕРЕМЕННЫЕ
// ============================================================

export let TASKS_DB = [];

// ============================================================
// КОНВЕРТАЦИЯ ДАННЫХ
// ============================================================

/**
 * Конвертирует сырые данные из Дела.js в формат задач
 * @param {Array} rawTasks - сырые данные из TASKS_DATA
 * @returns {Array} массив задач
 */
export function convertRawTasksToTasks(rawTasks) {
    const tasks = [];
    for (const item of rawTasks) {
        const cfg = DIFFICULTY_CONFIG[item.difficulty];
        if (!cfg) continue;
        
        let isFree = false;
        let price = cfg.price || cfg.paidPrice;
        if (item.difficulty === 1) {
            isFree = (item.id % 3 === 0);
            price = isFree ? 0 : cfg.paidPrice;
        }
        
        tasks.push({
            id: item.id,
            text: item.text,
            category: item.category,
            difficulty: item.difficulty,
            isFree: isFree,
            price: price,
            baseReward: cfg.baseReward,
            baseXP: cfg.baseXP,
            priority: null,
            pinned: false,
            completed: false,
            completedDate: null,
            note: "",
            tags: [],
            estimatedTime: null,
            pointsEarned: null,
            photos: [],
            location: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deleted: false
        });
    }
    return tasks;
}

// ============================================================
// ЗАГРУЗКА ДЕЛ ИЗ ФАЙЛА
// ============================================================

/**
 * Загружает дела из файла Дела.js
 * @returns {Promise<Array>} массив задач
 */
export async function loadTasksFromFile() {
    return new Promise((resolve) => {
        // Проверяем, не загружены ли уже
        if (typeof TASKS_DATA !== 'undefined' && TASKS_DATA && TASKS_DATA.length > 0) {
            console.log(`✅ TASKS_DATA уже загружена: ${TASKS_DATA.length} дел`);
            resolve(convertRawTasksToTasks(TASKS_DATA));
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'Дела.js';
        
        script.onload = () => {
            setTimeout(() => {
                if (typeof TASKS_DATA !== 'undefined' && TASKS_DATA && TASKS_DATA.length > 0) {
                    console.log(`✅ Загружено ${TASKS_DATA.length} дел из файла Дела.js`);
                    resolve(convertRawTasksToTasks(TASKS_DATA));
                } else {
                    console.warn('⚠️ TASKS_DATA не найдена');
                    showToast('❌ Не удалось загрузить дела!', 'error');
                    resolve([]);
                }
            }, 50);
        };
        
        script.onerror = () => {
            console.error('❌ Ошибка: файл Дела.js не найден!');
            showToast('❌ Файл Дела.js не найден! Поместите его в ту же папку', 'error');
            resolve([]);
        };
        
        document.head.appendChild(script);
    });
}

// ============================================================
// СОХРАНЕНИЕ И ЗАГРУЗКА ДЕЛ
// ============================================================

/**
 * Сохраняет дела в localStorage
 */
export function saveTasksToStorage() {
    saveTasks(TASKS_DB);
}

/**
 * Загружает дела из localStorage
 */
export function loadTasksFromStorage() {
    const saved = loadTasks();
    if (saved && saved.length > 0) {
        TASKS_DB = saved;
        console.log(`📚 Загружено ${TASKS_DB.length} дел из localStorage`);
        return true;
    }
    return false;
}

// ============================================================
// ПОЛУЧЕНИЕ ДАННЫХ О ЗАДАЧАХ
// ============================================================

/**
 * Получает задачу по ID
 * @param {number} id - ID задачи
 * @returns {Object|undefined} задача или undefined
 */
export function getTaskById(id) {
    return TASKS_DB.find(t => t.id === id);
}

/**
 * Получает все доступные для покупки задачи
 * @param {Array} purchasedTasks - массив купленных ID
 * @returns {Array} доступные задачи
 */
export function getAvailableTasks(purchasedTasks) {
    return TASKS_DB.filter(t => !purchasedTasks.includes(t.id));
}

/**
 * Получает задачи по категории
 * @param {string} category - название категории
 * @returns {Array} задачи в категории
 */
export function getTasksByCategory(category) {
    return TASKS_DB.filter(t => t.category === category);
}

/**
 * Получает задачи по сложности
 * @param {number} difficulty - уровень сложности (1-5)
 * @returns {Array} задачи с указанной сложностью
 */
export function getTasksByDifficulty(difficulty) {
    return TASKS_DB.filter(t => t.difficulty === difficulty);
}

/**
 * Получает статистику по категориям
 * @returns {Object} объект с количеством дел по категориям
 */
export function getCategoryStats() {
    const stats = {};
    for (const task of TASKS_DB) {
        if (!stats[task.category]) stats[task.category] = 0;
        stats[task.category]++;
    }
    return stats;
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

/**
 * Инициализирует загрузку задач (сначала из localStorage, потом из файла при необходимости)
 * @returns {Promise<boolean>} успех инициализации
 */
export async function initTasks() {
    // Сначала пробуем загрузить из localStorage
    if (loadTasksFromStorage()) {
        console.log('📚 Дела загружены из localStorage');
        return true;
    }
    
    // Если нет — загружаем из файла
    const tasks = await loadTasksFromFile();
    if (tasks && tasks.length > 0) {
        TASKS_DB = tasks;
        saveTasksToStorage();
        console.log('📚 Дела загружены из файла и сохранены в localStorage');
        return true;
    }
    
    console.error('❌ Не удалось загрузить дела!');
    return false;
}