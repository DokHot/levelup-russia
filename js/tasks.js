// js/tasks.js
// ============================================================
// ЗАДАЧИ — ЗАГРУЗКА И УПРАВЛЕНИЕ СПИСКОМ ДЕЛ (версия 3.0)
// ============================================================

import { DIFFICULTY_CONFIG } from './config.js';
import { loadTasks, saveTasks } from './storage.js';
import { showToast } from './ui.js';
import { loadTasksFromPackages } from './packageManager.js';

// ============================================================
// ПЕРЕМЕННЫЕ
// ============================================================

export let TASKS_DB = [];

// ============================================================
// КОНВЕРТАЦИЯ ДАННЫХ
// ============================================================

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
            unlockLevel: item.unlockLevel || 1,
            packageId: item.packageId || 'core',
            packageName: item.packageName || 'Базовый',
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
// ЗАГРУЗКА ДЕЛ
// ============================================================

export async function loadAllTasks() {
    try {
        // Загружаем дела из активных пакетов
        const tasks = await loadTasksFromPackages();
        if (tasks && tasks.length > 0) {
            TASKS_DB = convertRawTasksToTasks(tasks);
            saveTasksToStorage();
            console.log(`📚 Загружено ${TASKS_DB.length} дел из пакетов`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to load tasks:', error);
        return false;
    }
}

// ============================================================
// СОХРАНЕНИЕ И ЗАГРУЗКА ИЗ LOCALSTORAGE
// ============================================================

export function saveTasksToStorage() {
    saveTasks(TASKS_DB);
}

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

export function getTaskById(id) {
    return TASKS_DB.find(t => t.id === id);
}

export function getAvailableTasks(purchasedTasks) {
    return TASKS_DB.filter(t => !purchasedTasks.includes(t.id));
}

export function getTasksByCategory(category) {
    return TASKS_DB.filter(t => t.category === category);
}

export function getTasksByDifficulty(difficulty) {
    return TASKS_DB.filter(t => t.difficulty === difficulty);
}

export function getTasksByPackage(packageId) {
    return TASKS_DB.filter(t => t.packageId === packageId);
}

export function getCategoryStats() {
    const stats = {};
    for (const task of TASKS_DB) {
        if (!stats[task.category]) stats[task.category] = 0;
        stats[task.category]++;
    }
    return stats;
}

export function getPackageStats() {
    const stats = {};
    for (const task of TASKS_DB) {
        const pkgId = task.packageId || 'core';
        if (!stats[pkgId]) stats[pkgId] = { total: 0, completed: 0, purchased: 0 };
        stats[pkgId].total++;
        if (task.completed) stats[pkgId].completed++;
        if (task.purchased) stats[pkgId].purchased++;
    }
    return stats;
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

export async function initTasks() {
    // Сначала пробуем загрузить из localStorage
    if (loadTasksFromStorage()) {
        console.log('📚 Дела загружены из localStorage');
        return true;
    }
    
    // Если нет — загружаем из пакетов
    const success = await loadAllTasks();
    if (success) {
        console.log('📚 Дела загружены из пакетов и сохранены в localStorage');
        return true;
    }
    
    console.error('❌ Не удалось загрузить дела!');
    return false;
}

// Функция для перезагрузки дел (вызывается из packageManager)
export function reloadTasks() {
    return loadAllTasks();
}