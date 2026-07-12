// js/packageManager.js
// ============================================================
// УПРАВЛЕНИЕ СБОРНИКАМИ (ПАКЕТАМИ) ДЕЛ
// ============================================================

import { user, saveUserData } from './user.js';
import { TASKS_DB, saveTasksToStorage } from './tasks.js';
import { showToast } from './ui.js';

// ============================================================
// СОСТОЯНИЕ
// ============================================================

const PACKAGES_KEY = 'life_in_deeds_packages';

// Базовый список доступных сборников
const AVAILABLE_PACKAGES = {
    // Сезонные
    summer_2026: {
        id: 'summer_2026',
        name: 'Лето 2026',
        icon: '☀️',
        type: 'seasonal',
        description: '100 дел для идеального лета',
        totalTasks: 100,
        version: '1.0',
        releaseDate: '2026-06-01',
        alwaysActive: false
    },
    autumn_2026: {
        id: 'autumn_2026',
        name: 'Осень 2026',
        icon: '🍂',
        type: 'seasonal',
        description: '80 уютных дел для осени',
        totalTasks: 80,
        version: '1.0',
        releaseDate: '2026-09-01',
        alwaysActive: false
    },
    winter_2026: {
        id: 'winter_2026',
        name: 'Зима 2026',
        icon: '❄️',
        type: 'seasonal',
        description: '90 зимних приключений',
        totalTasks: 90,
        version: '1.0',
        releaseDate: '2026-12-01',
        alwaysActive: false
    },
    spring_2027: {
        id: 'spring_2027',
        name: 'Весна 2027',
        icon: '🌱',
        type: 'seasonal',
        description: '70 весенних дел для обновления',
        totalTasks: 70,
        version: '1.0',
        releaseDate: '2027-03-01',
        alwaysActive: false
    },
    // Тематические
    travels: {
        id: 'travels',
        name: 'Путешествия',
        icon: '🗺️',
        type: 'thematic',
        description: '50 дел для исследователей и путешественников',
        totalTasks: 50,
        version: '1.0',
        releaseDate: '2026-07-01',
        alwaysActive: false
    },
    health: {
        id: 'health',
        name: 'Здоровье',
        icon: '💪',
        type: 'thematic',
        description: '60 ЗОЖ-дел для тела и духа',
        totalTasks: 60,
        version: '1.0',
        releaseDate: '2026-07-01',
        alwaysActive: false
    },
    career: {
        id: 'career',
        name: 'Карьера',
        icon: '💼',
        type: 'thematic',
        description: '40 дел для профессионального роста',
        totalTasks: 40,
        version: '1.0',
        releaseDate: '2026-07-01',
        alwaysActive: false
    }
};

// Ядро — всегда активно
const CORE_PACKAGE = {
    id: 'core',
    name: 'Базовый сборник',
    icon: '🏠',
    type: 'core',
    description: '1000+ дел на все случаи жизни',
    totalTasks: 1000,
    version: '1.0',
    releaseDate: '2026-07-01',
    alwaysActive: true
};

// ============================================================
// ЗАГРУЗКА И СОХРАНЕНИЕ
// ============================================================

export function loadPackagesState() {
    const saved = localStorage.getItem(PACKAGES_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.warn('Failed to parse packages state', e);
        }
    }
    // По умолчанию: core активен, summer активен, остальные выключены
    return {
        active: ['core', 'summer_2026'],
        installed: ['core', 'summer_2026'],
        custom: []
    };
}

export function savePackagesState(state) {
    localStorage.setItem(PACKAGES_KEY, JSON.stringify(state));
    // Обновляем user.packages для синхронизации
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
    const all = { ...AVAILABLE_PACKAGES };
    all.core = CORE_PACKAGE;
    return all;
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

// ============================================================
// УПРАВЛЕНИЕ СБОРНИКАМИ
// ============================================================

export function activatePackage(id) {
    const state = loadPackagesState();
    const pkg = getPackageInfo(id);
    
    if (!pkg) {
        showToast('Сборник не найден', 'error');
        return false;
    }
    
    if (state.active.includes(id)) {
        showToast(`Сборник "${pkg.name}" уже активен`, 'info');
        return false;
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

export function installCustomPackage(name, icon, description, tasks) {
    const id = `custom_${Date.now()}`;
    const pkg = {
        id: id,
        name: name,
        icon: icon || '📄',
        type: 'custom',
        description: description || 'Мой личный сборник',
        totalTasks: tasks.length,
        version: '1.0',
        releaseDate: new Date().toISOString().split('T')[0],
        alwaysActive: false,
        tasks: tasks
    };
    
    const state = loadPackagesState();
    if (!state.custom) state.custom = [];
    state.custom.push(pkg);
    state.installed.push(id);
    state.active.push(id);
    savePackagesState(state);
    
    // Сохраняем задачи сборника в localStorage
    localStorage.setItem(`package_${id}`, JSON.stringify(pkg));
    
    // Перезагружаем дела
    reloadTasks();
    
    showToast(`📦 Сборник "${name}" создан и активирован!`, 'success');
    return id;
}

export function deleteCustomPackage(id) {
    const state = loadPackagesState();
    const pkg = state.custom?.find(p => p.id === id);
    
    if (!pkg) {
        showToast('Сборник не найден', 'error');
        return false;
    }
    
    // Удаляем из всех списков
    state.custom = state.custom.filter(p => p.id !== id);
    state.installed = state.installed.filter(i => i !== id);
    state.active = state.active.filter(a => a !== id);
    savePackagesState(state);
    
    // Удаляем задачи из localStorage
    localStorage.removeItem(`package_${id}`);
    
    // Перезагружаем дела
    reloadTasks();
    
    showToast(`🗑️ Сборник "${pkg.name}" удалён`, 'info');
    return true;
}

// ============================================================
// ЗАГРУЗКА ДЕЛ ИЗ СБОРНИКОВ
// ============================================================

export function loadTasksFromPackages() {
    const active = getActivePackages();
    const allTasks = [];
    
    for (const id of active) {
        // Ядро
        if (id === 'core') {
            // Загружаем из TASKS_DATA (глобальная переменная из Дела.js)
            if (typeof TASKS_DATA !== 'undefined' && TASKS_DATA.length > 0) {
                allTasks.push(...TASKS_DATA.map(t => ({
                    ...t,
                    packageId: 'core',
                    packageName: 'Базовый'
                })));
            }
            continue;
        }
        
        // Встроенные сборники
        const pkgInfo = AVAILABLE_PACKAGES[id];
        if (pkgInfo) {
            const tasks = loadPackageTasks(id);
            if (tasks) {
                allTasks.push(...tasks.map(t => ({
                    ...t,
                    packageId: id,
                    packageName: pkgInfo.name
                })));
            }
            continue;
        }
        
        // Пользовательские сборники
        const state = loadPackagesState();
        const customPkg = state.custom?.find(p => p.id === id);
        if (customPkg && customPkg.tasks) {
            allTasks.push(...customPkg.tasks.map(t => ({
                ...t,
                packageId: id,
                packageName: customPkg.name
            })));
        }
    }
    
    return allTasks;
}

function loadPackageTasks(id) {
    // Пробуем загрузить из localStorage
    const saved = localStorage.getItem(`package_${id}`);
    if (saved) {
        try {
            const pkg = JSON.parse(saved);
            if (pkg.tasks) return pkg.tasks;
        } catch (e) {
            console.warn('Failed to load package tasks', e);
        }
    }
    
    // Если не найдено — возвращаем пустой массив
    return [];
}

// ============================================================
// ПЕРЕЗАГРУЗКА ДЕЛ
// ============================================================

function reloadTasks() {
    // Импортируем динамически, чтобы избежать циклических зависимостей
    import('./tasks.js').then(module => {
        if (module.reloadTasks) {
            module.reloadTasks();
        } else {
            // Простой перезагруз: обновляем TASKS_DB
            const tasks = loadTasksFromPackages();
            if (module.TASKS_DB !== undefined) {
                module.TASKS_DB = tasks;
                module.saveTasksToStorage();
                // Обновляем интерфейс
                if (typeof window.renderMyTasks === 'function') {
                    window.renderMyTasks();
                }
                showToast('🔄 Список дел обновлён', 'info');
            }
        }
    }).catch(() => {
        // Fallback: просто перезагружаем страницу
        window.location.reload();
    });
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
    
    // Группируем сборники
    const corePackages = [];
    const seasonalPackages = [];
    const thematicPackages = [];
    const customPackages = state.custom || [];
    
    for (const [id, pkg] of Object.entries(allPackages)) {
        if (pkg.type === 'core') {
            corePackages.push({ id, ...pkg });
        } else if (pkg.type === 'seasonal') {
            seasonalPackages.push({ id, ...pkg });
        } else if (pkg.type === 'thematic') {
            thematicPackages.push({ id, ...pkg });
        }
    }
    
    let html = `
        <div class="packages-container max-w-3xl mx-auto">
            <h2 class="text-xl font-bold mb-4">📦 Сборники дел</h2>
            <p class="text-sm text-gray-500 mb-6">Включайте сборники, чтобы добавлять дела в магазин</p>
    `;
    
    // ===== БАЗОВЫЙ СБОРНИК =====
    html += `
        <div class="mb-6">
            <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Основной</h3>
            ${renderPackageCard(corePackages[0], active)}
        </div>
    `;
    
    // ===== СЕЗОННЫЕ =====
    if (seasonalPackages.length > 0) {
        html += `
            <div class="mb-6">
                <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">🌿 Сезонные</h3>
                <div class="space-y-3">
                    ${seasonalPackages.map(pkg => renderPackageCard(pkg, active)).join('')}
                </div>
            </div>
        `;
    }
    
    // ===== ТЕМАТИЧЕСКИЕ =====
    if (thematicPackages.length > 0) {
        html += `
            <div class="mb-6">
                <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">🎯 Тематические</h3>
                <div class="space-y-3">
                    ${thematicPackages.map(pkg => renderPackageCard(pkg, active)).join('')}
                </div>
            </div>
        `;
    }
    
    // ===== МОИ СБОРНИКИ =====
    html += `
        <div class="mb-6">
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">✏️ Мои сборники</h3>
                <div class="flex gap-2">
                    <button id="createCustomPackageBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-full text-sm transition">
                        ➕ Создать
                    </button>
                    <button id="importPackageBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm transition">
                        📥 Импорт
                    </button>
                </div>
            </div>
            <div class="space-y-3">
                ${customPackages.length === 0 ? 
                    '<div class="text-center text-gray-400 py-8 text-sm">Нет своих сборников. Создайте первый!</div>' :
                    customPackages.map(pkg => renderPackageCard(pkg, active, true)).join('')
                }
            </div>
        </div>
    `;
    
    html += `
            <div class="text-center text-xs text-gray-400 mt-4">
                💡 Дела из активных сборников появляются в разделе «Мои дела»
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // ============================================================
    // ОБРАБОТЧИКИ СОБЫТИЙ
    // ============================================================
    
    document.querySelectorAll('.toggle-package-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            togglePackage(id);
            renderPackages();
        });
    });
    
    document.querySelectorAll('.delete-package-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (confirm('Удалить этот сборник?')) {
                deleteCustomPackage(id);
                renderPackages();
            }
        });
    });
    
    const createBtn = document.getElementById('createCustomPackageBtn');
    if (createBtn) {
        createBtn.addEventListener('click', showCreatePackageModal);
    }
    
    const importBtn = document.getElementById('importPackageBtn');
    if (importBtn) {
        importBtn.addEventListener('click', showImportPackageModal);
    }
}

// ============================================================
// ОТРИСОВКА КАРТОЧКИ СБОРНИКА
// ============================================================

function renderPackageCard(pkg, active, isCustom = false) {
    if (!pkg) return '';
    
    const isActive = active.includes(pkg.id);
    const isCore = pkg.type === 'core';
    const icon = pkg.icon || '📦';
    
    let statusHtml = '';
    if (isCore) {
        statusHtml = '<span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">✅ Всегда активен</span>';
    } else if (isActive) {
        statusHtml = '<span class="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">✅ Активен</span>';
    } else {
        statusHtml = '<span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">⬜ Не активен</span>';
    }
    
    const buttonHtml = isCore ? '' :
        (isActive ? 
            `<button class="toggle-package-btn px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm transition" data-id="${pkg.id}">Деактивировать</button>` :
            `<button class="toggle-package-btn px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm transition" data-id="${pkg.id}">Активировать</button>`
        );
    
    const deleteHtml = isCustom && !isCore ?
        `<button class="delete-package-btn px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-full text-sm transition" data-id="${pkg.id}">🗑️</button>` :
        '';
    
    return `
        <div class="package-card bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-l-4 ${isActive ? 'border-green-500' : 'border-gray-300'}">
            <div class="flex flex-wrap justify-between items-start gap-3">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="text-3xl">${icon}</div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-bold">${pkg.name}</span>
                            ${statusHtml}
                        </div>
                        <div class="text-sm text-gray-500">${pkg.description}</div>
                        <div class="text-xs text-gray-400">📋 ${pkg.totalTasks} дел · ${pkg.releaseDate || '—'}</div>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    ${buttonHtml}
                    ${deleteHtml}
                </div>
            </div>
        </div>
    `;
}

// ============================================================
// МОДАЛКА СОЗДАНИЯ СБОРНИКА
// ============================================================

function showCreatePackageModal() {
    let modal = document.getElementById('createPackageModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'createPackageModal';
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 hidden';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-4 p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">📦 Создать сборник</h2>
                    <button id="closeCreatePackageBtn" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Название</label>
                        <input type="text" id="newPackageName" placeholder="Мой сборник" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Иконка</label>
                        <input type="text" id="newPackageIcon" placeholder="📄" class="w-full px-4 py-2 border rounded-lg" maxlength="2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Описание</label>
                        <input type="text" id="newPackageDesc" placeholder="Краткое описание" class="w-full px-4 py-2 border rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Дела (по одному на строку)</label>
                        <textarea id="newPackageTasks" rows="6" class="w-full px-4 py-2 border rounded-lg font-mono text-sm" placeholder="Искупаться в море | Лето | 1&#10;Съесть арбуз на пляже | Лето | 1&#10;Встретить рассвет | Лето | 2"></textarea>
                        <p class="text-xs text-gray-400 mt-1">Формат: Название | Категория | Сложность (1-5)</p>
                    </div>
                </div>
                <div class="flex gap-3 mt-4">
                    <button id="cancelCreatePackageBtn" class="flex-1 px-4 py-2 bg-gray-200 rounded-full">Отмена</button>
                    <button id="confirmCreatePackageBtn" class="flex-1 px-4 py-2 bg-green-600 text-white rounded-full">Создать</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('closeCreatePackageBtn')?.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        document.getElementById('cancelCreatePackageBtn')?.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }
    
    modal.classList.remove('hidden');
    
    const confirmBtn = document.getElementById('confirmCreatePackageBtn');
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            const name = document.getElementById('newPackageName')?.value.trim();
            const icon = document.getElementById('newPackageIcon')?.value.trim() || '📄';
            const description = document.getElementById('newPackageDesc')?.value.trim() || 'Мой личный сборник';
            const tasksText = document.getElementById('newPackageTasks')?.value || '';
            
            if (!name) {
                showToast('Введите название сборника', 'error');
                return;
            }
            
            const tasks = parseTasksFromText(tasksText);
            if (tasks.length === 0) {
                showToast('Добавьте хотя бы одно дело', 'error');
                return;
            }
            
            installCustomPackage(name, icon, description, tasks);
            modal.classList.add('hidden');
            renderPackages();
        };
    }
}

// ============================================================
// ПАРСИНГ ДЕЛ ИЗ ТЕКСТА
// ============================================================

function parseTasksFromText(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const tasks = [];
    
    for (const line of lines) {
        const parts = line.split('|').map(s => s.trim());
        if (parts.length >= 3) {
            const [taskText, category, difficultyStr] = parts;
            const difficulty = parseInt(difficultyStr);
            if (taskText && category && difficulty >= 1 && difficulty <= 5) {
                tasks.push({
                    text: taskText,
                    category: category,
                    difficulty: difficulty,
                    isFree: difficulty === 1 && Math.random() > 0.7,
                    price: getPriceByDifficulty(difficulty),
                    baseReward: getRewardByDifficulty(difficulty),
                    baseXP: getXPByDifficulty(difficulty),
                    custom: true
                });
            }
        }
    }
    
    return tasks;
}

function getPriceByDifficulty(diff) {
    const prices = { 1: 20, 2: 60, 3: 200, 4: 500, 5: 1200 };
    return prices[diff] || 20;
}

function getRewardByDifficulty(diff) {
    const rewards = { 1: 35, 2: 90, 3: 280, 4: 700, 5: 1600 };
    return rewards[diff] || 35;
}

function getXPByDifficulty(diff) {
    const xp = { 1: 10, 2: 20, 3: 40, 4: 80, 5: 150 };
    return xp[diff] || 10;
}

// ============================================================
// МОДАЛКА ИМПОРТА СБОРНИКА
// ============================================================

function showImportPackageModal() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.name && data.tasks && Array.isArray(data.tasks)) {
                    installCustomPackage(data.name, data.icon || '📦', data.description || 'Импортированный сборник', data.tasks);
                    renderPackages();
                } else {
                    showToast('❌ Неверный формат файла', 'error');
                }
            } catch (err) {
                showToast('❌ Ошибка чтения файла', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}