// js/packageManager.js
// ============================================================
// УПРАВЛЕНИЕ СБОРНИКАМИ (ПАКЕТАМИ) ДЕЛ — ВЕРСИЯ 3.0
// ============================================================

import { user, saveUserData } from './user.js';
import { TASKS_DB, saveTasksToStorage } from './tasks.js';
import { showToast } from './ui.js';

// ============================================================
// СОСТОЯНИЕ
// ============================================================

const PACKAGES_KEY = 'life_in_deeds_packages';

// ============================================================
// ДОСТУПНЫЕ ПАКЕТЫ (10 тематических)
// ============================================================

const AVAILABLE_PACKAGES = {
    // БАЗОВЫЙ — ВСЕГДА АКТИВЕН
    core: {
        id: 'core',
        name: 'Базовый сборник',
        icon: '🏠',
        type: 'core',
        description: '100 простых дел для старта',
        totalTasks: 100,
        version: '3.0',
        releaseDate: '2026-08-01',
        alwaysActive: true,
        unlockLevel: 1,
        price: 0,
        source: 'Дела_база.js'
    },
    
    // ============================================================
    // УРОВЕНЬ 3 — ПРОСТЫЕ ПАКЕТЫ
    // ============================================================
    
    travel: {
        id: 'travel',
        name: '🌍 Путешествия',
        icon: '🗺️',
        type: 'thematic',
        description: '100 дел для исследователей',
        totalTasks: 100,
        version: '1.0',
        releaseDate: '2026-08-01',
        alwaysActive: false,
        unlockLevel: 3,
        price: 200,
        source: 'packages/travel.js'
    },
    
    health: {
        id: 'health',
        name: '💪 Спорт и здоровье',
        icon: '🏋️',
        type: 'thematic',
        description: '100 ЗОЖ-дел для тела и духа',
        totalTasks: 100,
        version: '1.0',
        releaseDate: '2026-08-01',
        alwaysActive: false,
        unlockLevel: 3,
        price: 200,
        source: 'packages/health.js'
    },
    
    cooking: {
        id: 'cooking',
        name: '🍳 Кулинария',
        icon: '👨‍🍳',
        type: 'thematic',
        description: '100 кулинарных приключений',
        totalTasks: 100,
        version: '1.0',
        releaseDate: '2026-08-01',
        alwaysActive: false,
        unlockLevel: 3,
        price: 200,
        source: 'packages/cooking.js'
    },
    
    nature: {
        id: 'nature',
        name: '🌿 Природа',
        icon: '🌲',
        type: 'thematic',
        description: '100 дел на свежем воздухе',
        totalTasks: 100,
        version: '1.0',
        releaseDate: '2026-08-01',
        alwaysActive: false,
        unlockLevel: 3,
        price: 200,
        source: 'packages/nature.js'
    },
    
    // ============================================================
    // УРОВЕНЬ 4 — СРЕДНИЕ ПАКЕТЫ
    // ============================================================
    
    creative: {
        id: 'creative',
        name: '🎨 Творчество',
        icon: '🎭',
        type: 'thematic',
        description: '100 дел для вдохновения',
        totalTasks: 100,
        version: '1.0',
        releaseDate: '2026-08-01',
        alwaysActive: false,
        unlockLevel: 4,
        price: 300,
        source: 'packages/creative.js'
    },
    
    selfdev: {
        id: 'selfdev',
        name: '🧠 Саморазвитие',
        icon: '📚',
        type: 'thematic',
        description: '100 дел для роста и развития',
        totalTasks: 100,
        version: '1.0',
        releaseDate: '2026-08-01',
        alwaysActive: false,
        unlockLevel: 4,
        price: 300,
        source: 'packages/selfdev.js'
    },
    
    relationships: {
        id: 'relationships',
        name: '💕 Отношения',
        icon: '🤝',
        type: 'thematic',
        description: '100 дел для близких и друзей',
        totalTasks: 100,
        version: '1.0',
        releaseDate: '2026-08-01',
        alwaysActive: false,
        unlockLevel: 4,
        price: 300,
        source: 'packages/relationships.js'
    },
    
    // ============================================================
    // УРОВЕНЬ 5 — СЛОЖНЫЕ ПАКЕТЫ
    // ============================================================
    
    fishing: {
        id: 'fishing',
        name: '🎣 Рыбалка и охота',
        icon: '🐟',
        type: 'thematic',
        description: '100 дел для любителей природы',
        totalTasks: 100,
        version: '1.0',
        releaseDate: '2026-08-01',
        alwaysActive: false,
        unlockLevel: 5,
        price: 400,
        source: 'packages/fishing.js'
    },
    
    extreme: {
        id: 'extreme',
        name: '⚡ Экстрим',
        icon: '🧗',
        type: 'thematic',
        description: '100 дел для искателей адреналина',
        totalTasks: 100,
        version: '1.0',
        releaseDate: '2026-08-01',
        alwaysActive: false,
        unlockLevel: 5,
        price: 400,
        source: 'packages/extreme.js'
    },
    
    challenges: {
        id: 'challenges',
        name: '🎯 Челленджи',
        icon: '🏆',
        type: 'thematic',
        description: '100 испытаний на прочность',
        totalTasks: 100,
        version: '1.0',
        releaseDate: '2026-08-01',
        alwaysActive: false,
        unlockLevel: 6,
        price: 500,
        source: 'packages/challenges.js'
    }
};

// ============================================================
// ИМЕНА ПАКЕТОВ ДЛЯ ОТОБРАЖЕНИЯ
// ============================================================

const PACKAGE_NAMES = {
    'core': 'Базовый',
    'travel': '🌍 Путешествия',
    'health': '💪 Спорт и здоровье',
    'cooking': '🍳 Кулинария',
    'nature': '🌿 Природа',
    'creative': '🎨 Творчество',
    'selfdev': '🧠 Саморазвитие',
    'relationships': '💕 Отношения',
    'fishing': '🎣 Рыбалка и охота',
    'extreme': '⚡ Экстрим',
    'challenges': '🎯 Челленджи'
};

export function getPackageName(packageId) {
    return PACKAGE_NAMES[packageId] || packageId;
}

// ============================================================
// ЗАГРУЗКА И СОХРАНЕНИЕ СОСТОЯНИЯ
// ============================================================

export function loadPackagesState() {
    const saved = localStorage.getItem(PACKAGES_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Убеждаемся, что core всегда есть
            if (!parsed.active.includes('core')) {
                parsed.active.unshift('core');
            }
            if (!parsed.installed.includes('core')) {
                parsed.installed.unshift('core');
            }
            return parsed;
        } catch (e) {
            console.warn('Failed to parse packages state', e);
        }
    }
    
    // По умолчанию: только базовый пакет активен
    return {
        active: ['core'],
        installed: ['core'],
        custom: []
    };
}

export function savePackagesState(state) {
    localStorage.setItem(PACKAGES_KEY, JSON.stringify(state));
    if (user) {
        if (!user.packages) user.packages = {};
        user.packages.active = state.active;
        user.packages.installed = state.installed;
        saveUserData();
    }
}

// ============================================================
// ПОЛУЧЕНИЕ ДАННЫХ
// ============================================================

export function getAllPackages() {
    return { ...AVAILABLE_PACKAGES };
}

export function getPackageInfo(id) {
    const all = getAllPackages();
    return all[id] || null;
}

export function getActivePackages() {
    const state = loadPackagesState();
    return state.active || ['core'];
}

export function getInstalledPackages() {
    const state = loadPackagesState();
    return state.installed || ['core'];
}

export function isPackageActive(id) {
    const active = getActivePackages();
    return active.includes(id);
}

export function isPackageInstalled(id) {
    const installed = getInstalledPackages();
    return installed.includes(id);
}

export function isPackageAvailable(id) {
    const pkg = getPackageInfo(id);
    if (!pkg) return false;
    if (pkg.alwaysActive) return true;
    const userLevel = user?.level || 1;
    return userLevel >= (pkg.unlockLevel || 1);
}

// ============================================================
// УПРАВЛЕНИЕ ПАКЕТАМИ
// ============================================================

export function activatePackage(id) {
    const state = loadPackagesState();
    const pkg = getPackageInfo(id);
    
    if (!pkg) {
        showToast('Сборник не найден', 'error');
        return false;
    }
    
    if (pkg.alwaysActive) {
        showToast('Базовый сборник всегда активен', 'info');
        return false;
    }
    
    if (!isPackageAvailable(id)) {
        showToast(`Доступно с ${pkg.unlockLevel} уровня`, 'error');
        return false;
    }
    
    if (state.active.includes(id)) {
        showToast(`Сборник "${pkg.name}" уже активен`, 'info');
        return false;
    }
    
    // Проверяем монеты
    if (pkg.price > 0 && user.coins < pkg.price) {
        showToast(`Не хватает монет! Нужно ${pkg.price}`, 'error');
        return false;
    }
    
    // Списываем монеты
    if (pkg.price > 0) {
        user.coins -= pkg.price;
        saveUserData();
    }
    
    // Если сборник не установлен — устанавливаем
    if (!state.installed.includes(id)) {
        state.installed.push(id);
    }
    
    state.active.push(id);
    savePackagesState(state);
    
    // Перезагружаем дела
    reloadTasks();
    
    showToast(`✅ Сборник "${pkg.name}" активирован!`, 'success');
    return true;
}

export function deactivatePackage(id) {
    const state = loadPackagesState();
    const pkg = getPackageInfo(id);
    
    if (!pkg) {
        showToast('Сборник не найден', 'error');
        return false;
    }
    
    if (pkg.alwaysActive) {
        showToast('Базовый сборник нельзя отключить', 'error');
        return false;
    }
    
    if (!state.active.includes(id)) {
        showToast(`Сборник "${pkg.name}" уже неактивен`, 'info');
        return false;
    }
    
    state.active = state.active.filter(a => a !== id);
    savePackagesState(state);
    
    // Перезагружаем дела
    reloadTasks();
    
    showToast(`❌ Сборник "${pkg.name}" деактивирован`, 'info');
    return true;
}

export function togglePackage(id) {
    if (isPackageActive(id)) {
        return deactivatePackage(id);
    } else {
        return activatePackage(id);
    }
}

// ============================================================
// ЗАГРУЗКА ДЕЛ ИЗ ПАКЕТОВ
// ============================================================

export async function loadTasksFromPackages() {
    const active = getActivePackages();
    const allTasks = [];
    
    for (const id of active) {
        // Базовый пакет (core)
        if (id === 'core') {
            try {
                // Пробуем загрузить из глобальной переменной TASKS_DATA
                if (typeof TASKS_DATA !== 'undefined' && TASKS_DATA && TASKS_DATA.length > 0) {
                    console.log(`📦 Загружено ${TASKS_DATA.length} дел из базового пакета`);
                    allTasks.push(...TASKS_DATA.map(t => ({
                        ...t,
                        packageId: 'core',
                        packageName: 'Базовый'
                    })));
                } else {
                    // Пробуем через динамический импорт
                    try {
                        const module = await import('../Дела_база.js');
                        const coreTasks = module.TASKS_DATA || [];
                        if (coreTasks.length > 0) {
                            console.log(`📦 Загружено ${coreTasks.length} дел из Дела_база.js`);
                            allTasks.push(...coreTasks.map(t => ({
                                ...t,
                                packageId: 'core',
                                packageName: 'Базовый'
                            })));
                        }
                    } catch (e) {
                        console.warn('Не удалось загрузить Дела_база.js:', e);
                    }
                }
            } catch (e) {
                console.warn('Failed to load core tasks:', e);
            }
            continue;
        }
        
        // Тематические пакеты
        const pkgInfo = getPackageInfo(id);
        if (pkgInfo && pkgInfo.source) {
            try {
                const module = await import(`../${pkgInfo.source}`);
                const tasks = module.tasks || module.default || [];
                if (tasks.length > 0) {
                    console.log(`📦 Загружено ${tasks.length} дел из пакета "${pkgInfo.name}"`);
                    allTasks.push(...tasks.map(t => ({
                        ...t,
                        packageId: id,
                        packageName: pkgInfo.name
                    })));
                }
            } catch (e) {
                console.warn(`Failed to load package ${id}:`, e);
            }
        }
    }
    
    console.log(`📚 Всего загружено дел: ${allTasks.length}`);
    return allTasks;
}

// ============================================================
// ПЕРЕЗАГРУЗКА ДЕЛ
// ============================================================

let reloadTimeout = null;

export function reloadTasks() {
    if (reloadTimeout) clearTimeout(reloadTimeout);
    
    reloadTimeout = setTimeout(async () => {
        try {
            const tasks = await loadTasksFromPackages();
            if (tasks.length > 0) {
                // Обновляем глобальный TASKS_DB
                const module = await import('./tasks.js');
                if (module.TASKS_DB !== undefined) {
                    module.TASKS_DB = tasks;
                    module.saveTasksToStorage();
                    
                    // Отправляем событие об обновлении
                    document.dispatchEvent(new CustomEvent('packagesUpdated'));
                    
                    // Обновляем интерфейс
                    if (typeof window.renderMyTasks === 'function') {
                        window.renderMyTasks();
                    }
                    if (typeof window.renderUnifiedShop === 'function') {
                        window.renderUnifiedShop();
                    }
                    if (typeof window.renderStatistics === 'function') {
                        window.renderStatistics();
                    }
                    
                    showToast('🔄 Список дел обновлён', 'info');
                }
            }
        } catch (e) {
            console.error('Failed to reload tasks:', e);
        }
        reloadTimeout = null;
    }, 300);
}

// ============================================================
// ОТРИСОВКА ВКЛАДКИ «СБОРНИКИ»
// ============================================================

export function renderPackages() {
    const container = document.getElementById('packagesView');
    if (!container) {
        console.warn('packagesView not found');
        return;
    }
    
    const state = loadPackagesState();
    const allPackages = getAllPackages();
    const active = state.active || ['core'];
    const userLevel = user?.level || 1;
    
    // Группируем пакеты
    const corePackages = [];
    const availablePackages = [];
    const lockedPackages = [];
    
    for (const [id, pkg] of Object.entries(allPackages)) {
        if (pkg.alwaysActive) {
            corePackages.push({ id, ...pkg });
        } else if (isPackageAvailable(id)) {
            availablePackages.push({ id, ...pkg });
        } else {
            lockedPackages.push({ id, ...pkg });
        }
    }
    
    let html = `
        <div class="packages-container max-w-3xl mx-auto">
            <h2 class="text-2xl font-bold mb-2">📦 Сборники дел</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Включайте сборники, чтобы добавлять новые дела. 
                <span class="text-green-600">Уровень ${userLevel}</span>
            </p>
    `;
    
    // ===== БАЗОВЫЙ СБОРНИК =====
    html += `
        <div class="mb-6">
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Основной</h3>
            ${corePackages.map(pkg => renderPackageCard(pkg, active, userLevel)).join('')}
        </div>
    `;
    
    // ===== ДОСТУПНЫЕ СБОРНИКИ =====
    if (availablePackages.length > 0) {
        html += `
            <div class="mb-6">
                <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">🎯 Доступные</h3>
                <div class="space-y-3">
                    ${availablePackages.map(pkg => renderPackageCard(pkg, active, userLevel)).join('')}
                </div>
            </div>
        `;
    }
    
    // ===== ЗАБЛОКИРОВАННЫЕ СБОРНИКИ =====
    if (lockedPackages.length > 0) {
        html += `
            <div class="mb-6">
                <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">🔒 Закрытые</h3>
                <div class="space-y-3">
                    ${lockedPackages.map(pkg => renderPackageCard(pkg, active, userLevel)).join('')}
                </div>
            </div>
        `;
    }
    
    html += `
            <div class="text-center text-xs text-gray-400 mt-4">
                💡 Дела из активных сборников появляются в разделе «Мои дела»
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Обработчики кнопок
    document.querySelectorAll('.toggle-package-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            togglePackage(id);
            renderPackages();
        });
    });
}

// ============================================================
// ОТРИСОВКА КАРТОЧКИ ПАКЕТА
// ============================================================

function renderPackageCard(pkg, active, userLevel) {
    if (!pkg) return '';
    
    const isActive = active.includes(pkg.id);
    const isAvailable = isPackageAvailable(pkg.id);
    const isCore = pkg.alwaysActive === true;
    const icon = pkg.icon || '📦';
    const isLocked = !isAvailable && !isCore;
    
    let statusHtml = '';
    let buttonHtml = '';
    
    if (isCore) {
        statusHtml = '<span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">✅ Всегда активен</span>';
    } else if (isActive) {
        statusHtml = '<span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">✅ Активен</span>';
        buttonHtml = `
            <button class="toggle-package-btn px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm transition" data-id="${pkg.id}">
                Деактивировать
            </button>
        `;
    } else if (isLocked) {
        statusHtml = `<span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">🔒 Уровень ${pkg.unlockLevel}</span>`;
        buttonHtml = `
            <button class="px-4 py-1.5 bg-gray-300 text-gray-500 rounded-full text-sm cursor-not-allowed" disabled>
                🔒 Закрыт
            </button>
        `;
    } else {
        statusHtml = '<span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">⬜ Не активен</span>';
        buttonHtml = `
            <button class="toggle-package-btn px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm transition" data-id="${pkg.id}">
                🎯 Активировать ${pkg.price > 0 ? `(${pkg.price}₿)` : ''}
            </button>
        `;
    }
    
    return `
        <div class="package-card bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 ${isActive ? 'border-green-500' : isLocked ? 'border-gray-300' : 'border-gray-300'}">
            <div class="flex flex-wrap justify-between items-start gap-3">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="text-3xl">${icon}</div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-bold">${pkg.name}</span>
                            ${statusHtml}
                        </div>
                        <div class="text-sm text-gray-500">${pkg.description}</div>
                        <div class="text-xs text-gray-400">📋 ${pkg.totalTasks} дел</div>
                        ${isLocked ? `<div class="text-xs text-orange-500">🔓 Откроется на ${pkg.unlockLevel} уровне</div>` : ''}
                        ${!isCore && isAvailable && !isActive ? `<div class="text-xs text-blue-500">💰 ${pkg.price} монет за активацию</div>` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    ${buttonHtml}
                </div>
            </div>
        </div>
    `;
}