// js/shop.js
// ============================================================
// МАГАЗИН — ОТРИСОВКА И УПРАВЛЕНИЕ МАГАЗИНОМ ДЕЛ (версия 7.5)
// ============================================================

import { TASKS_DB, getTaskById } from './tasks.js';
import { user, spendCoins, saveUserData } from './user.js';
import { getCategoryColor, DEADLINE_MULTIPLIERS, CATEGORY_GROUPS } from './config.js';
import { showToast, showConfetti } from './ui.js';
import { escapeHtml, addDays } from './utils.js';
import { renderActiveTasks } from './activeTasks.js';
import { renderHistory } from './history.js';
import { checkAchievements } from './achievements.js';
import { checkSecretAchievements } from './achievements.js';

// ============================================================
// ПЕРЕМЕННЫЕ
// ============================================================

let currentCategoryFilter = 'all';
let currentDifficultyFilter = 'all';
let openGroups = {};
let selectedTaskForPurchase = null;
let selectedDeadline = 7;
let isRendering = false;

// ============================================================
// ПОКУПКА ЗАДАНИЯ
// ============================================================

export function purchaseTask(task) {
    if (task.difficulty > 1 && user.coins < task.price) {
        showToast(`Не хватает монет! Нужно ${task.price}`, 'error');
        return;
    }
    selectedTaskForPurchase = task;
    document.getElementById('modalTaskTitle').innerText = task.text;
    document.getElementById('modalTaskDesc').innerHTML = `Сложность: ${"★".repeat(task.difficulty)}<br>Цена: ${task.price} монет<br>Базовая награда: ${task.baseReward} монет`;
    
    const optionsDiv = document.getElementById('deadlineOptions');
    optionsDiv.innerHTML = '';
    for (const [days, cfg] of Object.entries(DEADLINE_MULTIPLIERS)) {
        const finalReward = Math.floor(task.baseReward * cfg.multiplier);
        optionsDiv.innerHTML += `
            <label class="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition deadline-option">
                <div>
                    <span class="font-bold">${cfg.icon} ${cfg.name}</span>
                    <div class="text-sm text-gray-500">×${cfg.multiplier}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-green-600">${finalReward} ₿</div>
                    <div class="text-xs text-red-500">штраф: ${cfg.penalty * 100}%</div>
                </div>
                <input type="radio" name="deadline" value="${days}" ${days == 7 ? 'checked' : ''} class="ml-3">
            </label>
        `;
    }
    document.getElementById('deadlineModal').classList.remove('hidden');
    
    document.querySelectorAll('input[name="deadline"]').forEach(r => {
        r.addEventListener('change', (e) => selectedDeadline = parseInt(e.target.value));
    });
}

export function confirmPurchase() {
    if (!selectedTaskForPurchase) return;
    const task = selectedTaskForPurchase;
    const cfg = DEADLINE_MULTIPLIERS[selectedDeadline];
    const expectedReward = Math.floor(task.baseReward * cfg.multiplier);
    
    if (task.difficulty > 1) spendCoins(task.price);
    
    user.activeTasks.push({
        id: Date.now(),
        originalTaskId: task.id,
        text: task.text,
        category: task.category,
        difficulty: task.difficulty,
        price: task.price,
        baseReward: task.baseReward,
        baseXP: task.baseXP,
        chosenDays: selectedDeadline,
        multiplier: cfg.multiplier,
        penalty: cfg.penalty,
        expectedReward: expectedReward,
        purchasedAt: new Date().toISOString(),
        deadline: addDays(new Date(), selectedDeadline).toISOString(),
        status: "active",
        photos: [],
        location: null,
        note: ""
    });
    
    if (!user.purchasedTasks.includes(task.id)) user.purchasedTasks.push(task.id);
    saveUserData();
    
    document.getElementById('deadlineModal').classList.add('hidden');
    selectedTaskForPurchase = null;
    showToast(`✅ "${task.text}" куплено! Срок: ${selectedDeadline} дней`, 'success');
    
    renderShop();
    renderActiveTasks();
}

// ============================================================
// ФИЛЬТРАЦИЯ
// ============================================================

function updateCategoryCounts() {
    for (const group of CATEGORY_GROUPS) {
        for (const cat of group.categories) {
            const count = TASKS_DB.filter(t => !user.purchasedTasks.includes(t.id) && t.category === cat).length;
            if (!group.counts) group.counts = {};
            group.counts[cat] = count;
        }
    }
}

export function renderCategoryFilters() {
    const container = document.getElementById('categoryGroupsList');
    if (!container) return;
    
    updateCategoryCounts();
    
    let html = '';
    for (let gIdx = 0; gIdx < CATEGORY_GROUPS.length; gIdx++) {
        const group = CATEGORY_GROUPS[gIdx];
        const isGroupOpen = openGroups[gIdx] === true;
        
        html += `
            <div class="category-group">
                <div class="category-group-header" data-group-index="${gIdx}">
                    <span>${group.icon} ${group.name}</span>
                    <i class="fas fa-chevron-right chevron ${isGroupOpen ? 'rotate-90' : ''}"></i>
                </div>
                <div class="category-group-content ${isGroupOpen ? 'open' : ''}">
        `;
        
        for (const catName of group.categories) {
            const count = group.counts ? (group.counts[catName] || 0) : 0;
            const isActive = currentCategoryFilter === catName;
            html += `
                <div class="category-item ${isActive ? 'active' : ''}" data-category="${escapeHtml(catName)}">
                    <span>${catName}</span>
                    <span class="category-count">${count}</span>
                </div>
            `;
        }
        
        html += `</div></div>`;
    }
    
    container.innerHTML = html;
    
    document.querySelectorAll('.category-group-header').forEach(header => {
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const groupIdx = parseInt(header.dataset.groupIndex);
            openGroups[groupIdx] = !openGroups[groupIdx];
            renderCategoryFilters();
        });
    });
    
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const category = item.dataset.category;
            currentCategoryFilter = currentCategoryFilter === category ? 'all' : category;
            renderCategoryFilters();
            renderShop();
        });
    });
    
    const resetBtn = document.getElementById('resetCategoryFilterBtn');
    if (resetBtn) {
        resetBtn.onclick = () => {
            currentCategoryFilter = 'all';
            renderCategoryFilters();
            renderShop();
        };
    }
}

// ============================================================
// ОТРИСОВКА МАГАЗИНА (с сеткой 3 колонки)
// ============================================================

export function renderShop() {
    if (isRendering) return;
    isRendering = true;
    
    const grid = document.getElementById('shopGrid');
    if (!grid) {
        isRendering = false;
        return;
    }
    
    // Получаем отфильтрованные задачи
    let filtered = TASKS_DB.filter(t => !user.purchasedTasks.includes(t.id));
    
    if (currentCategoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === currentCategoryFilter);
    }
    
    if (currentDifficultyFilter !== 'all') {
        filtered = filtered.filter(t => t.difficulty === parseInt(currentDifficultyFilter));
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">✨ Все дела куплены или нет дел в этой категории!</div>';
        isRendering = false;
        return;
    }
    
    // Рендерим с сеткой 3 колонки
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
    
    for (const task of filtered) {
        const categoryColor = getCategoryColor(task.category);
        const escapedText = escapeHtml(task.text);
        const escapedCategory = escapeHtml(task.category);
        
        html += `
            <div class="task-card-container w-full" data-task-id="${task.id}">
                <div class="task-card-flipper w-full" data-task-id="${task.id}">
                    <div class="task-card-front p-4 w-full cursor-pointer flex flex-col" style="border-left: 6px solid ${categoryColor}; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
                        <div class="flex justify-between items-start mb-2">
                            <span class="category-tag px-2 py-1 rounded-full text-xs font-semibold" style="color: ${categoryColor};">${escapedCategory}</span>
                            <span class="difficulty-${task.difficulty} font-bold text-sm">${"★".repeat(task.difficulty)}</span>
                        </div>
                        <h3 class="font-bold text-lg mb-2 leading-tight">${escapedText}</h3>
                        <p class="text-sm text-gray-500 mb-3 line-clamp-2 flex-grow">${escapedText.substring(0, 100)}${escapedText.length > 100 ? '...' : ''}</p>
                        <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                            <div>
                                <div class="text-sm font-semibold text-gray-700">💰 Награда: ${task.baseReward} ₿</div>
                                <div class="text-xs text-gray-500">⭐ Опыт: +${task.baseXP} XP</div>
                            </div>
                            <button class="purchase-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm shadow-md transition-all" data-id="${task.id}">${task.isFree ? 'ВЗЯТЬ' : `КУПИТЬ ${task.price}₿`}</button>
                        </div>
                    </div>
                    <div class="task-card-back p-5 w-full absolute top-0 left-0 overflow-auto flex flex-col cursor-pointer" style="transform: rotateY(180deg); backface-visibility: hidden;">
                        <h3 class="font-bold text-base mb-3 pr-6">${escapedText}</h3>
                        <div class="space-y-3 text-sm">
                            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                <div class="text-xs text-gray-500 uppercase mb-1">⭐ Сложность</div>
                                <div class="font-bold difficulty-${task.difficulty}">${"★".repeat(task.difficulty)}</div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                <div class="text-xs text-gray-500 uppercase mb-1">💰 Цена и награда</div>
                                <div class="flex justify-between flex-wrap gap-2">
                                    <span>💰 Цена: ${task.price} монет</span>
                                    <span>🎁 Награда: ${task.baseReward} монет</span>
                                    <span>⭐ Опыт: +${task.baseXP} XP</span>
                                </div>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                <div class="text-xs text-gray-500 uppercase mb-1">📝 Описание</div>
                                <p class="text-gray-600 dark:text-gray-300">${escapedText}</p>
                            </div>
                        </div>
                        <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <button class="purchase-btn w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm shadow-md transition-all" data-id="${task.id}">${task.isFree ? 'ВЗЯТЬ БЕСПЛАТНО' : `КУПИТЬ ЗА ${task.price} ₿`}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    grid.innerHTML = html;
    
    // Обработчики переворота карточек
    document.querySelectorAll('.task-card-flipper').forEach(flipper => {
        const frontSide = flipper.querySelector('.task-card-front');
        const backSide = flipper.querySelector('.task-card-back');
        
        if (frontSide) {
            frontSide.addEventListener('click', (e) => {
                if (e.target.classList?.contains('purchase-btn')) return;
                e.stopPropagation();
                flipper.classList.add('flipped');
            });
        }
        
        if (backSide) {
            backSide.addEventListener('click', (e) => {
                if (e.target.classList?.contains('purchase-btn')) return;
                e.stopPropagation();
                flipper.classList.remove('flipped');
            });
        }
    });
    
    // Обработчики покупок
    document.querySelectorAll('.purchase-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const task = getTaskById(id);
            if (task) purchaseTask(task);
        });
    });
    
    isRendering = false;
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ ФИЛЬТРОВ
// ============================================================

export function initDifficultyFilters() {
    document.querySelectorAll('.diff-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.diff-filter').forEach(b => {
                b.classList.remove('active', 'bg-green-600', 'text-white');
                b.classList.add('bg-gray-200');
            });
            btn.classList.add('active', 'bg-green-600', 'text-white');
            currentDifficultyFilter = btn.dataset.diff;
            renderShop();
        });
    });
}