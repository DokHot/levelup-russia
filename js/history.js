// js/history.js
// ============================================================
// ИСТОРИЯ — УПРАВЛЕНИЕ ВЫПОЛНЕННЫМИ ДЕЛАМИ
// ============================================================

import { user, addCoins, saveUserData } from './user.js';
import { TASKS_DB, getTaskById } from './tasks.js';
import { getCategoryColor, DEADLINE_MULTIPLIERS } from './config.js';
import { showToast, showConfetti } from './ui.js';
import { escapeHtml, formatDateTime, addDays } from './utils.js';
import { renderActiveTasks } from './activeTasks.js';
import { renderShop } from './shop.js';
import { checkAchievements } from './achievements.js';
import { checkSecretAchievements } from './achievements.js';

// ============================================================
// ПОВТОРНОЕ ПРОХОЖДЕНИЕ ДЕЛА
// ============================================================

/**
 * Повторно покупает выполненное дело
 * @param {Object} completedTask - выполненное дело из истории
 */
export function repurchaseTask(completedTask) {
    const orig = getTaskById(completedTask.originalTaskId);
    if (!orig) return;
    
    const repCount = completedTask.repurchaseCount || 0;
    if (repCount >= 3) {
        showToast('⚠️ Максимум 3 повтора!', 'error');
        return;
    }
    
    const price = Math.floor(orig.price * 0.5);
    if (user.coins < price) {
        showToast(`Не хватает монет! Нужно ${price}`, 'error');
        return;
    }
    
    user.coins -= price;
    user.stats.tasksRepurchased++;
    
    const cfg = DEADLINE_MULTIPLIERS[7];
    user.activeTasks.push({
        id: Date.now(),
        originalTaskId: orig.id,
        text: orig.text,
        category: orig.category,
        difficulty: orig.difficulty,
        price: price,
        baseReward: orig.baseReward,
        baseXP: orig.baseXP,
        chosenDays: 7,
        multiplier: cfg.multiplier,
        penalty: cfg.penalty,
        expectedReward: Math.floor(orig.baseReward * cfg.multiplier),
        purchasedAt: new Date().toISOString(),
        deadline: addDays(new Date(), 7).toISOString(),
        status: "active",
        photos: [],
        location: null,
        note: ""
    });
    
    const histTask = user.completedTasks.find(t => t.id === completedTask.id);
    if (histTask) histTask.repurchaseCount = repCount + 1;
    
    saveUserData();
    showToast(`🔄 "${orig.text}" повторно куплено за ${price} монет`, 'success');
    renderActiveTasks();
    renderHistory();
    renderShop();
    checkSecretAchievements('repurchase', user.stats.tasksRepurchased);
}

// ============================================================
// РЕДАКТИРОВАНИЕ ВЫПОЛНЕННОГО ДЕЛА
// ============================================================

let currentEditTaskId = null;

/**
 * Открывает модалку редактирования выполненного дела
 * @param {number} taskId - ID выполненного дела
 */
export function openEditHistoryTask(taskId) {
    const task = user.completedTasks.find(t => t.id === taskId);
    if (!task) return;
    
    currentEditTaskId = taskId;
    const noteInput = document.getElementById('editNoteInput');
    if (noteInput) noteInput.value = task.note || '';
    document.getElementById('editHistoryModal').classList.remove('hidden');
}

/**
 * Сохраняет изменения выполненного дела
 */
export function saveEditHistoryTask() {
    const task = user.completedTasks.find(t => t.id === currentEditTaskId);
    if (!task) return;
    
    const noteInput = document.getElementById('editNoteInput');
    task.note = noteInput ? noteInput.value : '';
    task.updatedAt = new Date().toISOString();
    
    saveUserData();
    renderHistory();
    showToast('📝 Заметки сохранены!', 'success');
    document.getElementById('editHistoryModal').classList.add('hidden');
    currentEditTaskId = null;
}

/**
 * Добавляет фото к выполненному делу
 * @param {number} taskId - ID выполненного дела
 */
export function addPhotoToHistoryTask(taskId) {
    const task = user.completedTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (!task.photos) task.photos = [];
            task.photos.push(ev.target.result);
            user.stats.photosAdded++;
            saveUserData();
            renderHistory();
            showToast('📸 Фото добавлено!', 'success');
        };
        reader.readAsDataURL(file);
    };
    fileInput.click();
}

// ============================================================
// ОТРИСОВКА ИСТОРИИ
// ============================================================

/**
 * Рендер истории выполненных дел
 */
export function renderHistory() {
    const container = document.getElementById('historyGrid');
    if (!container) return;
    
    if (user.completedTasks.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-gray-500">📜 Пока нет выполненных дел</div>';
        return;
    }
    
    let html = '';
    for (const task of user.completedTasks) {
        const orig = getTaskById(task.originalTaskId);
        const repPrice = orig ? Math.floor(orig.price * 0.5) : 50;
        
        // Определяем класс для цвета
        let statusClass = 'completed-on-time';
        if (task.type === 'surrendered' || task.surrendered === true) {
            statusClass = 'surrendered';
        } else if (task.isLate === true) {
            statusClass = 'completed-late';
        }
        
        html += `
            <div class="history-card ${statusClass} rounded-xl p-4 shadow-sm transition-all hover:shadow-md">
                <div class="flex justify-between flex-wrap gap-2">
                    <div class="flex-1">
                        <div class="flex gap-2 mb-1 flex-wrap">
                            <span class="category-tag bg-gray-200 dark:bg-gray-600">${escapeHtml(task.category)}</span>
                            ${task.type === 'urgent' ? '<span class="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">⚠️ Срочное</span>' : ''}
                            ${task.type === 'random_quest' ? '<span class="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs">🎲 Случайное</span>' : ''}
                            ${task.isLate ? '<span class="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs">⏰ Просрочка</span>' : ''}
                            ${task.type === 'surrendered' ? '<span class="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">🏳️ Сдался</span>' : ''}
                        </div>
                        <div class="font-bold">${escapeHtml(task.text)}</div>
                        <div class="text-sm text-gray-500">${formatDateTime(task.completedAt)}</div>
                        <div class="text-sm">Награда: <span class="font-bold text-green-600">${task.actualReward || task.reward} ₿</span></div>
                        ${task.note ? `<div class="text-xs text-gray-400 mt-1 italic">📝 ${escapeHtml(task.note.substring(0, 100))}${task.note.length > 100 ? '...' : ''}</div>` : ''}
                        ${task.photos && task.photos.length ? `<div class="text-xs text-blue-500 mt-1"><i class="fas fa-camera"></i> ${task.photos.length} фото</div>` : ''}
                    </div>
                    <div class="flex flex-col gap-2">
                        ${task.type !== 'urgent' && task.type !== 'random_quest' && task.type !== 'surrendered' && (task.repurchaseCount || 0) < 3 ? 
                            `<button class="repurchase-btn bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm hover:bg-blue-200 transition" data-task-id="${task.id}">🔄 Пройти снова (${repPrice}₿)</button>` : ''}
                        <button class="edit-history-btn bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition" data-task-id="${task.id}">✏️ Редактировать</button>
                        <button class="add-photo-history-btn bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm hover:bg-blue-200 transition" data-task-id="${task.id}">📸 Добавить фото</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    container.addEventListener('click', (e) => {
        const repurchaseBtn = e.target.closest('.repurchase-btn');
        const editBtn = e.target.closest('.edit-history-btn');
        const photoBtn = e.target.closest('.add-photo-history-btn');
        
        if (repurchaseBtn) {
            const taskId = parseInt(repurchaseBtn.dataset.taskId);
            const task = user.completedTasks.find(t => t.id === taskId);
            if (task) repurchaseTask(task);
        } else if (editBtn) {
            const taskId = parseInt(editBtn.dataset.taskId);
            openEditHistoryTask(taskId);
        } else if (photoBtn) {
            const taskId = parseInt(photoBtn.dataset.taskId);
            addPhotoToHistoryTask(taskId);
        }
    });
}

// ============================================================
// ОТКРЫТИЕ ДЕТАЛЕЙ ВЫПОЛНЕННОГО ЗАДАНИЯ
// ============================================================

/**
 * Открывает детали выполненного задания в модальном окне
 * @param {number} taskId - ID выполненного задания
 */
export function openCompletedTaskDetail(taskId) {
    const task = user.completedTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const categoryColor = getCategoryColor(task.category);
    const header = document.getElementById('detailHeader');
    header.style.background = `linear-gradient(135deg, ${categoryColor}, ${categoryColor}cc)`;
    
    document.getElementById('detailCategoryIcon').innerHTML = '📌';
    document.getElementById('detailCategoryBadge').innerHTML = task.category;
    document.getElementById('detailTitle').innerHTML = escapeHtml(task.text);
    
    let photosHtml = '';
    if (task.photos && task.photos.length) {
        photosHtml = `
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="text-xs text-gray-500 uppercase mb-2">📸 Фото</div>
                <div class="grid grid-cols-3 gap-2">
                    ${task.photos.map(photo => `<img src="${photo}" class="rounded-lg cursor-pointer" onclick="window.open(this.src)">`).join('')}
                </div>
            </div>
        `;
    }
    
    document.getElementById('detailContent').innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="text-xs text-gray-500 uppercase mb-2">⭐ Сложность</div>
                <div class="text-2xl font-bold difficulty-${task.difficulty}">${"★".repeat(task.difficulty)}</div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="text-xs text-gray-500 uppercase mb-2">💰 Награда</div>
                <div class="text-xl font-bold text-green-600">${task.actualReward || task.reward} ₿</div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="text-xs text-gray-500 uppercase mb-2">📅 Дата выполнения</div>
                <div>${formatDateTime(task.completedAt)}</div>
            </div>
            ${task.note ? `
                <div class="bg-white rounded-xl p-4 shadow-sm">
                    <div class="text-xs text-gray-500 uppercase mb-2">📝 Заметки</div>
                    <div class="text-gray-700">${escapeHtml(task.note)}</div>
                </div>
            ` : ''}
            ${photosHtml}
            <div class="flex justify-end gap-3 pt-4">
                <button id="detailCloseBtn" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition">Закрыть</button>
            </div>
        </div>
    `;
    
    document.getElementById('detailModal').classList.remove('hidden');
    document.getElementById('detailCloseBtn').addEventListener('click', () => {
        document.getElementById('detailModal').classList.add('hidden');
    }, { once: true });
}