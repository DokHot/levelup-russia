// js/shop.js
// ============================================================
// МАГАЗИН — ПОЛНАЯ ВЕРСИЯ С ИКОНКАМИ КАТЕГОРИЙ
// ============================================================

import { TASKS_DB, getTaskById } from './tasks.js';
import { user, spendCoins, saveUserData } from './user.js';
import { getCategoryColor, DEADLINE_MULTIPLIERS, CATEGORY_GROUPS } from './config.js';
import { showToast, showConfetti } from './ui.js';
import { escapeHtml, addDays } from './utils.js';
import { renderActiveTasks } from './activeTasks.js';

// ============================================================
// ИКОНКИ ДЛЯ КАТЕГОРИЙ
// ============================================================

function getCategoryIcon(category) {
    const icons = {
        // ПРИРОДА И ПУТЕШЕСТВИЯ
        "Путешествия по России": "🏔️",
        "Транспорт и дороги": "🚗",
        "Географические точки": "📍",
        "Астрономия и космос": "🌙",
        "Рыбалка и охота": "🎣",
        "Гербарий и ботаника": "🌿",
        "Садоводство и огород": "🌱",
        "Животноводство": "🐄",
        
        // АКТИВНЫЙ ОБРАЗ ЖИЗНИ
        "Экстрим": "🧗",
        "Здоровье и тело": "💪",
        "Эмоции и впечатления": "🎢",
        "Сон и восстановление": "😴",
        "Биохакинг": "🧬",
        "Красота и уход": "💄",
        "Самооборона": "🥋",
        
        // ПРИРОДА, ДОМ, ЕДА
        "Уличная еда": "🌭",
        "Кулинария": "🍳",
        "Дом и быт": "🏠",
        "Гостеприимство": "🍷",
        
        // ЛЮДИ И ПОМОЩЬ
        "Отношения и любовь": "💕",
        "Волонтёрство": "🤝",
        "Благотворительность": "🎁",
        "Письма": "✉️",
        
        // УМ, ТВОРЧЕСТВО, НАВЫКИ
        "Навыки и саморазвитие": "📚",
        "Обучение и курсы": "🎓",
        "Творчество": "🎨",
        "Искусство": "🖼️",
        "Фотография": "📸",
        "Коллекционирование": "🪙",
        "Городские исследования": "🏙️",
        
        // ВНУТРЕННИЙ МИР
        "Психология": "🧠",
        "Религия и духовное": "🙏",
        "Челленджи": "🏆",
        "Один раз в жизни": "✨",
        "Странные дела": "🤪",
        
        // ДЕНЬГИ, РАБОТА, ТЕХНОЛОГИИ
        "Финансы": "💰",
        "Работа и карьера": "💼",
        "Цифровая гигиена": "🔐",
        "Экология": "♻️",
        "Медиа и информация": "📱"
    };
    return icons[category] || "📌";
}

// ============================================================
// ПЕРЕМЕННЫЕ
// ============================================================

let currentCategoryFilter = 'all';
let currentDifficultyFilter = 'all';
let openGroups = {};
let selectedTaskForPurchase = null;
let selectedDeadline = 7;

// ============================================================
// ПОКУПКА ЗАДАНИЯ
// ============================================================

export function purchaseTask(task) {
    if (!task) {
        showToast('❌ Ошибка: задание не найдено', 'error');
        return;
    }
    
    if (task.difficulty > 1 && user.coins < task.price) {
        showToast(`Не хватает монет! Нужно ${task.price}`, 'error');
        return;
    }
    
    selectedTaskForPurchase = task;
    
    const modalTitle = document.getElementById('modalTaskTitle');
    if (modalTitle) modalTitle.innerText = task.text;
    
    const optionsDiv = document.getElementById('deadlineOptions');
    if (!optionsDiv) {
        showToast('❌ Ошибка: не найден контейнер выбора срока', 'error');
        return;
    }
    
    optionsDiv.innerHTML = '';
    for (const [days, cfg] of Object.entries(DEADLINE_MULTIPLIERS)) {
        const finalReward = Math.floor(task.baseReward * cfg.multiplier);
        optionsDiv.innerHTML += `
            <label class="flex items-center justify-between p-3 border rounded-xl cursor-pointer deadline-option mb-2">
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
    
    const deadlineModal = document.getElementById('deadlineModal');
    if (deadlineModal) deadlineModal.classList.remove('hidden');
    
    document.querySelectorAll('input[name="deadline"]').forEach(r => {
        r.addEventListener('change', (e) => selectedDeadline = parseInt(e.target.value));
    });
}

export function confirmPurchase() {
    if (!selectedTaskForPurchase) {
        showToast('❌ Ошибка: нет выбранного задания', 'error');
        return;
    }
    
    const task = selectedTaskForPurchase;
    const cfg = DEADLINE_MULTIPLIERS[selectedDeadline];
    if (!cfg) {
        showToast('❌ Ошибка: неверный срок выполнения', 'error');
        return;
    }
    
    const expectedReward = Math.floor(task.baseReward * cfg.multiplier);
    
    if (task.difficulty > 1) {
        if (!spendCoins(task.price)) {
            showToast(`Не хватает монет! Нужно ${task.price}`, 'error');
            return;
        }
    }
    
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
    
    const deadlineModal = document.getElementById('deadlineModal');
    if (deadlineModal) deadlineModal.classList.add('hidden');
    
    selectedTaskForPurchase = null;
    showToast(`✅ "${task.text}" куплено! Срок: ${selectedDeadline} дней`, 'success');
    
    renderShop();
    renderActiveTasks();
}

// ============================================================
// ФИЛЬТРЫ КАТЕГОРИЙ
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
            <div class="category-group mb-2 border rounded-lg overflow-hidden">
                <div class="category-group-header p-3 cursor-pointer bg-gray-50 dark:bg-gray-800 flex justify-between items-center" data-group-index="${gIdx}">
                    <span class="font-bold">${group.icon} ${group.name}</span>
                    <i class="fas fa-chevron-right chevron ${isGroupOpen ? 'rotate-90' : ''} transition-transform"></i>
                </div>
                <div class="category-group-content ${isGroupOpen ? 'block' : 'hidden'} p-2 bg-white dark:bg-gray-900">
        `;
        
        for (const catName of group.categories) {
            const count = group.counts?.[catName] || 0;
            const isActive = currentCategoryFilter === catName;
            const categoryIcon = getCategoryIcon(catName);
            html += `
                <div class="category-item p-2 rounded-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 flex justify-between items-center ${isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 font-bold' : ''}" data-category="${escapeHtml(catName)}">
                    <span>${categoryIcon} ${escapeHtml(catName)}</span>
                    <span class="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">${count}</span>
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
            if (!isNaN(groupIdx)) {
                openGroups[groupIdx] = !openGroups[groupIdx];
                renderCategoryFilters();
            }
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
// ОТРИСОВКА МАГАЗИНА — С ИКОНКАМИ КАТЕГОРИЙ
// ============================================================

export function renderShop() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;
    
    let filtered = TASKS_DB.filter(t => !user.purchasedTasks.includes(t.id));
    if (currentCategoryFilter !== 'all') filtered = filtered.filter(t => t.category === currentCategoryFilter);
    if (currentDifficultyFilter !== 'all') filtered = filtered.filter(t => t.difficulty === parseInt(currentDifficultyFilter));
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="text-center py-12 text-gray-500">✨ Все дела куплены или нет дел в этой категории!</div>';
        return;
    }
    
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
    
    for (const task of filtered) {
        const categoryColor = getCategoryColor(task.category);
        const escapedText = escapeHtml(task.text);
        const escapedCategory = escapeHtml(task.category);
        const categoryIcon = getCategoryIcon(task.category);
        
        html += `
            <div class="task-card-container w-full" style="width: 100%; min-height: 340px; perspective: 1000px;">
                <div class="task-card-flipper" style="position: relative; width: 100%; height: 340px; transition: transform 0.5s; transform-style: preserve-3d; cursor: pointer;">
                    
                    <!-- ЛИЦЕВАЯ СТОРОНА -->
                    <div class="task-card-front" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 1rem; background: white; border-left: 6px solid ${categoryColor}; padding: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: rotateY(0deg); display: flex; flex-direction: column;">
                        
                        <div class="flex justify-between items-start mb-2">
                            <span class="category-tag text-xs px-2 py-1 rounded-full font-medium" style="background: ${categoryColor}15; color: ${categoryColor};">${categoryIcon} ${escapedCategory}</span>
                            <span class="difficulty-${task.difficulty} text-sm">${"★".repeat(task.difficulty)}</span>
                        </div>
                        
                        <h3 class="font-bold text-base mb-2 line-clamp-2 flex-1" style="color: #1f2937; text-align: center;">${escapedText}</h3>
                        
                        <div class="mt-auto">
                            <div class="flex justify-center gap-3 mb-3">
                                <span class="text-sm font-bold text-green-600">💰 ${task.baseReward}</span>
                                <span class="text-xs text-gray-500">⭐ +${task.baseXP}</span>
                            </div>
                            <button class="purchase-btn w-full py-2 rounded-lg text-white font-medium text-sm transition hover:opacity-90" style="background: ${categoryColor};" data-id="${task.id}">
                                ${task.isFree ? '🎁 ВЗЯТЬ' : `💰 КУПИТЬ ${task.price}`}
                            </button>
                        </div>
                    </div>
                    
                    <!-- ОБОРОТНАЯ СТОРОНА -->
                    <div class="task-card-back" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 1rem; background: white; padding: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: rotateY(180deg); overflow-y: auto; display: flex; flex-direction: column;">
                        
                        <div class="flex justify-between items-start mb-2">
                            <span class="category-tag text-xs px-2 py-1 rounded-full font-medium" style="background: ${categoryColor}15; color: ${categoryColor};">${categoryIcon} ${escapedCategory}</span>
                            <span class="difficulty-${task.difficulty} text-sm">${"★".repeat(task.difficulty)}</span>
                        </div>
                        
                        <h3 class="font-bold text-base mb-3" style="color: #1f2937; text-align: center;">${escapedText}</h3>
                        
                        <div class="space-y-2 text-sm flex-1">
                            <div class="flex justify-between py-1">
                                <span class="text-gray-500">⭐ Сложность:</span>
                                <span class="text-gray-700">${task.difficulty} / 5</span>
                            </div>
                            <div class="flex justify-between py-1">
                                <span class="text-gray-500">💰 Цена:</span>
                                <span class="text-gray-700">${task.price} ₿</span>
                            </div>
                            <div class="flex justify-between py-1">
                                <span class="text-gray-500">🎁 Награда:</span>
                                <span class="text-green-600 font-medium">${task.baseReward} ₿</span>
                            </div>
                            <div class="flex justify-between py-1">
                                <span class="text-gray-500">⭐ Опыт:</span>
                                <span class="text-gray-700">+${task.baseXP} XP</span>
                            </div>
                        </div>
                        
                        <div class="mt-3 pt-2 border-t border-gray-100">
                            <button class="purchase-btn w-full py-2 rounded-lg text-white font-medium text-sm transition hover:opacity-90" style="background: ${categoryColor};" data-id="${task.id}">
                                ${task.isFree ? '🎁 ВЗЯТЬ' : `💰 КУПИТЬ ${task.price}`}
                            </button>
                        </div>
                    </div>
                    
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    grid.innerHTML = html;
    
    // Обработчики переворота
    document.querySelectorAll('.task-card-flipper').forEach(flipper => {
        flipper.addEventListener('click', function(e) {
            if (e.target.classList?.contains('purchase-btn')) return;
            if (this.style.transform === 'rotateY(180deg)') {
                this.style.transform = 'rotateY(0deg)';
            } else {
                this.style.transform = 'rotateY(180deg)';
            }
        });
    });
    
    // Обработчики покупок
    document.querySelectorAll('.purchase-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            if (isNaN(id)) return;
            const task = getTaskById(id);
            if (task) purchaseTask(task);
        });
    });
}

// ============================================================
// ФИЛЬТРЫ СЛОЖНОСТИ
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