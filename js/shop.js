// js/shop.js — ПОЛНАЯ ВЕРСИЯ
import { TASKS_DB, getTaskById } from './tasks.js';
import { user, spendCoins, saveUserData } from './user.js';
import { getCategoryColor, DEADLINE_MULTIPLIERS, CATEGORY_GROUPS } from './config.js';
import { showToast, showConfetti } from './ui.js';
import { escapeHtml, addDays } from './utils.js';
import { renderActiveTasks } from './activeTasks.js';

let currentCategoryFilter = 'all';
let currentDifficultyFilter = 'all';
let openGroups = {};
let selectedTaskForPurchase = null;
let selectedDeadline = 7;

export function purchaseTask(task) {
    if (task.difficulty > 1 && user.coins < task.price) {
        showToast(`Не хватает монет! Нужно ${task.price}`, 'error');
        return;
    }
    selectedTaskForPurchase = task;
    document.getElementById('modalTaskTitle').innerText = task.text;
    
    const optionsDiv = document.getElementById('deadlineOptions');
    optionsDiv.innerHTML = '';
    for (const [days, cfg] of Object.entries(DEADLINE_MULTIPLIERS)) {
        const finalReward = Math.floor(task.baseReward * cfg.multiplier);
        optionsDiv.innerHTML += `
            <label class="flex items-center justify-between p-3 border rounded-xl cursor-pointer deadline-option">
                <div><span class="font-bold">${cfg.icon} ${cfg.name}</span><div class="text-sm">×${cfg.multiplier}</div></div>
                <div class="text-right"><div class="font-bold text-green-600">${finalReward} ₿</div><div class="text-xs text-red-500">штраф: ${cfg.penalty * 100}%</div></div>
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
                <div class="category-group-header p-3 cursor-pointer bg-gray-50 flex justify-between items-center" data-group-index="${gIdx}">
                    <span class="font-bold">${group.icon} ${group.name}</span>
                    <i class="fas fa-chevron-right chevron ${isGroupOpen ? 'rotate-90' : ''} transition-transform"></i>
                </div>
                <div class="category-group-content ${isGroupOpen ? 'block' : 'hidden'} p-2 bg-white">
        `;
        for (const catName of group.categories) {
            const count = group.counts?.[catName] || 0;
            const isActive = currentCategoryFilter === catName;
            html += `
                <div class="category-item p-2 rounded-lg cursor-pointer hover:bg-green-50 flex justify-between items-center ${isActive ? 'bg-green-100 text-green-700 font-bold' : ''}" data-category="${escapeHtml(catName)}">
                    <span>${catName}</span>
                    <span class="text-xs bg-gray-200 px-2 py-0.5 rounded-full">${count}</span>
                </div>
            `;
        }
        html += `</div></div>`;
    }
    container.innerHTML = html;
    
    document.querySelectorAll('.category-group-header').forEach(header => {
        header.addEventListener('click', () => {
            const groupIdx = parseInt(header.dataset.groupIndex);
            openGroups[groupIdx] = !openGroups[groupIdx];
            renderCategoryFilters();
        });
    });
    
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;
            currentCategoryFilter = currentCategoryFilter === category ? 'all' : category;
            renderCategoryFilters();
            renderShop();
        });
    });
}

export function renderShop() {
    const grid = document.getElementById('shopGrid');
    if (!grid) return;
    
    let filtered = TASKS_DB.filter(t => !user.purchasedTasks.includes(t.id));
    if (currentCategoryFilter !== 'all') filtered = filtered.filter(t => t.category === currentCategoryFilter);
    if (currentDifficultyFilter !== 'all') filtered = filtered.filter(t => t.difficulty === parseInt(currentDifficultyFilter));
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="text-center py-12 text-gray-500">✨ Все дела куплены!</div>';
        return;
    }
    
    // Сетка 3 колонки с переворотом карточек
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
    for (const task of filtered) {
        const categoryColor = getCategoryColor(task.category);
        html += `
            <div class="task-card-container group perspective-1000" data-task-id="${task.id}">
                <div class="task-card-flipper relative w-full h-80 transition-all duration-500 preserve-3d cursor-pointer">
                    <div class="task-card-front absolute w-full h-full backface-hidden rounded-xl p-4 shadow-lg" style="background: white; border-left: 6px solid ${categoryColor};">
                        <div class="flex justify-between items-start">
                            <span class="text-xs px-2 py-1 rounded-full" style="background: ${categoryColor}20; color: ${categoryColor};">${task.category}</span>
                            <span class="difficulty-${task.difficulty}">${"★".repeat(task.difficulty)}</span>
                        </div>
                        <h3 class="font-bold text-lg mt-2 line-clamp-2">${escapeHtml(task.text)}</h3>
                        <p class="text-sm text-gray-500 mt-2 line-clamp-3">${escapeHtml(task.text.substring(0, 120))}...</p>
                        <div class="absolute bottom-4 left-4 right-4">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm">💰 ${task.baseReward} ₿</span>
                                <span class="text-xs">⭐ +${task.baseXP} XP</span>
                            </div>
                            <button class="purchase-btn w-full py-2 rounded-full text-white font-bold transition-transform hover:scale-105" style="background: ${categoryColor};" data-id="${task.id}">${task.isFree ? 'ВЗЯТЬ БЕСПЛАТНО' : `КУПИТЬ ${task.price} ₿`}</button>
                        </div>
                    </div>
                    <div class="task-card-back absolute w-full h-full backface-hidden rounded-xl p-4 shadow-lg overflow-auto" style="background: white; transform: rotateY(180deg);">
                        <h3 class="font-bold text-lg mb-3">${escapeHtml(task.text)}</h3>
                        <div class="space-y-2 text-sm">
                            <div class="p-2 bg-gray-50 rounded-lg"><span class="font-bold">⭐ Сложность:</span> ${"★".repeat(task.difficulty)}</div>
                            <div class="p-2 bg-gray-50 rounded-lg"><span class="font-bold">💰 Цена:</span> ${task.price} ₿</div>
                            <div class="p-2 bg-gray-50 rounded-lg"><span class="font-bold">🎁 Награда:</span> ${task.baseReward} ₿</div>
                            <div class="p-2 bg-gray-50 rounded-lg"><span class="font-bold">⭐ Опыт:</span> +${task.baseXP} XP</div>
                        </div>
                        <button class="purchase-btn w-full mt-4 py-2 rounded-full text-white font-bold" style="background: ${categoryColor};" data-id="${task.id}">${task.isFree ? 'ВЗЯТЬ' : 'КУПИТЬ'}</button>
                    </div>
                </div>
            </div>
        `;
    }
    html += '</div>';
    grid.innerHTML = html;
    
    // Обработчики переворота
    document.querySelectorAll('.task-card-flipper').forEach(flipper => {
        flipper.addEventListener('click', (e) => {
            if (e.target.classList?.contains('purchase-btn')) return;
            flipper.classList.toggle('flipped');
        });
    });
    
    document.querySelectorAll('.purchase-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const task = getTaskById(id);
            if (task) purchaseTask(task);
        });
    });
}

export function initDifficultyFilters() {
    document.querySelectorAll('.diff-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.diff-filter').forEach(b => b.classList.remove('active', 'bg-green-600', 'text-white'));
            btn.classList.add('active', 'bg-green-600', 'text-white');
            currentDifficultyFilter = btn.dataset.diff;
            renderShop();
        });
    });
}