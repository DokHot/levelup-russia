// js/activeTasks.js
// ============================================================
// АКТИВНЫЕ ЗАДАНИЯ — УПРАВЛЕНИЕ АКТИВНЫМИ ДЕЛАМИ (версия 7.5)
// ============================================================

import { user, spendCoins, addCoins, addPoints, updateCategoryProgress, saveUserData, addPhotoMetadata } from './user.js';
import { getCategoryColor } from './config.js';
import { showToast, showConfetti, showModal, hideModal } from './ui.js';
import { escapeHtml, formatDateTime, getRemainingTime } from './utils.js';
import { renderShop } from './shop.js';
import { renderHistory } from './history.js';
import { checkAchievements } from './achievements.js';
import { checkSecretAchievements } from './achievements.js';
import { checkAvatarRewards } from './avatars.js';
import { getBoosterMultiplier, getPenaltyReduction } from './boosters.js';
import { getPetBonus } from './pets.js';

// ============================================================
// ПЕРЕМЕННЫЕ
// ============================================================

let currentPhotoTaskId = null;
let pendingSurrenderTaskId = null;
let selectedSkipType = null;
let selectedSkipTaskId = null;

// ============================================================
// ВЫПОЛНЕНИЕ АКТИВНОГО ЗАДАНИЯ
// ============================================================

/**
 * Выполняет активное задание
 * @param {number} taskId - ID задания
 */
export function completeActiveTask(taskId) {
    const idx = user.activeTasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    
    const task = user.activeTasks[idx];
    const isLate = new Date() > new Date(task.deadline);
    let reward = task.expectedReward;
    
    if (isLate) {
        const penaltyReduction = getPenaltyReduction();
        reward = Math.floor(task.expectedReward * (1 - task.penalty * penaltyReduction));
    }
    
    const xpMultiplier = getBoosterMultiplier('xp');
    const coinMultiplier = getBoosterMultiplier('coin');
    const petBonus = getPetBonus();
    
    const finalReward = Math.floor(reward * coinMultiplier * (1 + petBonus / 100));
    const finalXp = Math.floor(task.baseXP * xpMultiplier * (1 + petBonus / 100));
    
    addCoins(finalReward);
    addPoints(finalXp);
    user.stats.tasksCompleted++;
    
    // Учёт ночных дел (для достижения "Ночной охотник")
    const hour = new Date().getHours();
    if (hour >= 20 || hour < 6) {
        if (!user.stats.nightTasksCount) user.stats.nightTasksCount = 0;
        user.stats.nightTasksCount++;
        checkSecretAchievements('night', true);
    }
    
    updateCategoryProgress(task.category);
    checkSecretAchievements('complete', user.stats.tasksCompleted);
    checkSecretAchievements('category', task.category);
    checkSecretAchievements('difficulty', task.difficulty);
    
    // Сохраняем фото в метаданные перед удалением
    const photoIds = [];
    if (task.photos && task.photos.length) {
        for (const photo of task.photos) {
            if (photo.id && typeof photo === 'object') {
                photoIds.push(photo.id);
            }
        }
    }
    
    user.completedTasks.unshift({
        id: Date.now(),
        originalTaskId: task.originalTaskId,
        text: task.text,
        category: task.category,
        difficulty: task.difficulty,
        expectedReward: task.expectedReward,
        actualReward: finalReward,
        xp: finalXp,
        isLate: isLate,
        penalty: isLate ? task.penalty : 0,
        chosenDays: task.chosenDays,
        completedAt: new Date().toISOString(),
        type: "normal",
        photos: task.photos || [],
        photoIds: photoIds,
        location: task.location || null,
        note: task.note || ""
    });
    
    user.activeTasks.splice(idx, 1);
    saveUserData();
    
    showToast(`✅ "${task.text}" выполнено! +${finalReward} монет`, 'success');
    showConfetti();
    
    renderActiveTasks();
    renderHistory();
    renderShop();
    checkAchievements();
    checkAvatarRewards();
}

// ============================================================
// СДАЧА ЗАДАНИЯ
// ============================================================

/**
 * Начинает процесс сдачи задания
 * @param {number} taskId - ID задания
 */
export function surrenderTask(taskId) {
    const task = user.activeTasks.find(t => t.id === taskId);
    if (!task) return;
    pendingSurrenderTaskId = taskId;
    document.getElementById('surrenderTaskText').innerHTML = `"${escapeHtml(task.text)}"<br>💰 Возврат: ${Math.floor(task.price * 0.2)} монет`;
    showModal('surrenderModal');
}

/**
 * Подтверждает сдачу задания
 */
export function confirmSurrender() {
    const idx = user.activeTasks.findIndex(t => t.id === pendingSurrenderTaskId);
    if (idx !== -1) {
        const task = user.activeTasks[idx];
        const refund = Math.floor(task.price * 0.2);
        addCoins(refund);
        user.stats.tasksSurrendered++;
        
        // Сохраняем фото в метаданные
        const photoIds = [];
        if (task.photos && task.photos.length) {
            for (const photo of task.photos) {
                if (photo.id && typeof photo === 'object') {
                    photoIds.push(photo.id);
                }
            }
        }
        
        user.completedTasks.unshift({
            id: Date.now(),
            originalTaskId: task.originalTaskId,
            text: task.text,
            category: task.category,
            difficulty: task.difficulty,
            expectedReward: task.expectedReward,
            actualReward: refund,
            xp: 0,
            isLate: false,
            surrendered: true,
            type: "surrendered",
            completedAt: new Date().toISOString(),
            photos: task.photos || [],
            photoIds: photoIds,
            location: task.location || null,
            note: task.note || ""
        });
        
        user.activeTasks.splice(idx, 1);
        saveUserData();
        showToast(`🏳️ Сдались. Возвращено ${refund} монет`, 'warning');
        renderActiveTasks();
        renderHistory();
        checkAchievements();
        checkSecretAchievements('surrender', user.stats.tasksSurrendered);
    }
    hideModal('surrenderModal');
    pendingSurrenderTaskId = null;
}

// ============================================================
// ОТМЕНА И МГНОВЕННОЕ ВЫПОЛНЕНИЕ
// ============================================================

/**
 * Отмена активного задания за монеты
 * @param {number} taskId - ID задания
 */
export function cancelActiveTaskForCoins(taskId) {
    const task = user.activeTasks.find(t => t.id === taskId);
    if (!task) return;
    const cost = Math.floor(task.price * 0.8);
    if (user.coins < cost) {
        showToast(`Не хватает монет! Нужно ${cost}`, 'error');
        return;
    }
    selectedSkipType = 'active';
    selectedSkipTaskId = taskId;
    document.getElementById('skipModalTitle').innerText = 'Отменить активное дело?';
    document.getElementById('skipModalDesc').innerHTML = `Вы уверены, что хотите отменить дело "${escapeHtml(task.text)}"?`;
    document.getElementById('skipModalPrice').innerHTML = `Стоимость: ${cost} монет (80% от цены)`;
    showModal('skipTaskModal');
}

/**
 * Мгновенное выполнение задания за монеты
 * @param {number} taskId - ID задания
 */
export function instantCompleteTask(taskId) {
    const task = user.activeTasks.find(t => t.id === taskId);
    if (!task) return;
    const cost = Math.floor(task.expectedReward * 1.5);
    if (user.coins < cost) {
        showToast(`Не хватает монет! Нужно ${cost}`, 'error');
        return;
    }
    selectedSkipType = 'instant';
    selectedSkipTaskId = taskId;
    document.getElementById('skipModalTitle').innerText = 'Мгновенно выполнить дело?';
    document.getElementById('skipModalDesc').innerHTML = `Вы уверены, что хотите мгновенно выполнить дело "${escapeHtml(task.text)}"?`;
    document.getElementById('skipModalPrice').innerHTML = `Стоимость: ${cost} монет (150% от награды)`;
    showModal('skipTaskModal');
}

/**
 * Подтверждает пропуск/отмену/мгновенное выполнение
 */
export function confirmSkip() {
    if (selectedSkipType === 'active' && selectedSkipTaskId) {
        const idx = user.activeTasks.findIndex(t => t.id === selectedSkipTaskId);
        if (idx !== -1) {
            const task = user.activeTasks[idx];
            const cost = Math.floor(task.price * 0.8);
            if (spendCoins(cost)) {
                user.activeTasks.splice(idx, 1);
                saveUserData();
                renderActiveTasks();
                showToast(`⏭️ Дело "${task.text}" отменено за ${cost} монет`, 'success');
            }
        }
    } else if (selectedSkipType === 'instant' && selectedSkipTaskId) {
        const idx = user.activeTasks.findIndex(t => t.id === selectedSkipTaskId);
        if (idx !== -1) {
            const task = user.activeTasks[idx];
            const cost = Math.floor(task.expectedReward * 1.5);
            if (spendCoins(cost)) {
                completeActiveTask(selectedSkipTaskId);
                showToast(`⚡ Дело "${task.text}" мгновенно выполнено за ${cost} монет`, 'success');
            }
        }
    }
    hideModal('skipTaskModal');
    selectedSkipType = null;
    selectedSkipTaskId = null;
}

// ============================================================
// ФОТО (С ПОДДЕРЖКОЙ ОБЛАЧНОГО ХРАНИЛИЩА)
// ============================================================

/**
 * Открывает модалку добавления фото
 * @param {number} taskId - ID задания
 */
export function openPhotoUpload(taskId) {
    currentPhotoTaskId = taskId;
    const task = user.activeTasks.find(t => t.id === taskId);
    if (task) {
        document.getElementById('photoTaskName').innerText = task.text;
        showModal('photoUploadModal');
    }
}

/**
 * Загружает фото для задания (с поддержкой облачного хранилища)
 */
export async function uploadPhotoForTask() {
    const fileInput = document.getElementById('photoFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('Выберите фото!', 'error');
        return;
    }
    
    // Проверка размера файла (макс 10 МБ)
    if (file.size > 10 * 1024 * 1024) {
        showToast('Файл слишком большой! Максимум 10 МБ', 'error');
        return;
    }
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
        showToast('Пожалуйста, выберите изображение', 'error');
        return;
    }
    
    const task = user.activeTasks.find(t => t.id === currentPhotoTaskId);
    if (!task) {
        showToast('Дело не найдено', 'error');
        hideModal('photoUploadModal');
        fileInput.value = '';
        currentPhotoTaskId = null;
        return;
    }
    
    showToast('📤 Сохранение фото...', 'info');
    
    try {
        let metadata;
        
        // Проверяем, подключено ли облачное хранилище
        const isCloudEnabled = user.photos?.cloudEnabled && user.photos?.provider;
        
        if (isCloudEnabled) {
            // Загружаем в облако
            const { uploadPhotoToCloud } = await import('./cloud/cloudPhotoStorage.js');
            metadata = await uploadPhotoToCloud(file, task.id);
        } else {
            // Fallback: сохраняем как base64 (временное решение)
            metadata = await savePhotoAsBase64(file, task.id);
        }
        
        if (!task.photos) task.photos = [];
        task.photos.push({ id: metadata.id, cloud: isCloudEnabled });
        
        user.stats.photosAdded++;
        saveUserData();
        
        renderActiveTasks();
        showToast('📸 Фото добавлено к делу!', 'success');
        
        // Обновляем достижения
        checkAchievements();
        checkAvatarRewards();
        
    } catch (error) {
        console.error('Upload failed:', error);
        showToast('❌ Ошибка при сохранении фото', 'error');
    } finally {
        hideModal('photoUploadModal');
        fileInput.value = '';
        currentPhotoTaskId = null;
    }
}

/**
 * Временное сохранение фото как base64 (fallback)
 * @param {File} file - файл фото
 * @param {number} taskId - ID дела
 * @returns {Promise<Object>} метаданные
 */
function savePhotoAsBase64(file, taskId) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const photoData = e.target.result;
            const photoId = `base64_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
            
            // Сохраняем метаданные
            addPhotoMetadata({
                id: photoId,
                taskId: taskId,
                data: photoData,
                addedAt: new Date().toISOString(),
                isBase64: true
            });
            
            resolve({ id: photoId, cloud: false });
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================================
// ДОБАВЛЕНИЕ ЛОКАЦИИ
// ============================================================

let currentLocationTaskId = null;

/**
 * Открывает модалку добавления локации
 * @param {number} taskId - ID задания
 */
export function openLocationPicker(taskId) {
    currentLocationTaskId = taskId;
    showModal('addLocationModal');
    
    // Инициализация карты для выбора локации
    initLocationPicker();
}

/**
 * Инициализация карты для выбора локации
 */
function initLocationPicker() {
    if (typeof ymaps === 'undefined') {
        setTimeout(initLocationPicker, 500);
        return;
    }
    
    ymaps.ready(() => {
        const mapContainer = document.getElementById('locationPickerMap');
        if (!mapContainer) return;
        
        const map = new ymaps.Map('locationPickerMap', {
            center: [55.751574, 37.573856],
            zoom: 10,
            controls: ['zoomControl', 'fullscreenControl']
        });
        
        let placemark = null;
        
        map.events.add('click', (e) => {
            const coords = e.get('coords');
            
            if (placemark) {
                map.geoObjects.remove(placemark);
            }
            
            placemark = new ymaps.Placemark(coords, {
                balloonContent: 'Выбранное место'
            });
            
            map.geoObjects.add(placemark);
            
            document.getElementById('confirmLocationBtn').onclick = () => {
                saveLocationToTask(coords[0], coords[1]);
                hideModal('addLocationModal');
            };
        });
    });
}

/**
 * Сохраняет локацию к заданию
 * @param {number} lat - широта
 * @param {number} lng - долгота
 */
function saveLocationToTask(lat, lng) {
    const task = user.activeTasks.find(t => t.id === currentLocationTaskId);
    if (!task) return;
    
    task.location = { lat, lng, name: task.text };
    user.stats.locationsAdded++;
    saveUserData();
    
    renderActiveTasks();
    showToast('📍 Локация добавлена к делу!', 'success');
    checkAchievements();
    checkAvatarRewards();
}

// ============================================================
// ОТРИСОВКА АКТИВНЫХ ЗАДАНИЙ
// ============================================================

/**
 * Рендер списка активных заданий
 */
export function renderActiveTasks() {
    const grid = document.getElementById('activeTasksGrid');
    if (!grid) return;
    
    if (user.activeTasks.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500">⏳ Нет активных дел. Купите что-нибудь в магазине!</div>';
        return;
    }
    
    let html = '';
    for (const task of user.activeTasks) {
        const remaining = getRemainingTime(task.deadline);
        const categoryColor = getCategoryColor(task.category);
        const cancelCost = Math.floor(task.price * 0.8);
        const instantCost = Math.floor(task.expectedReward * 1.5);
        const hasPhotos = task.photos && task.photos.length > 0;
        const hasLocation = task.location && task.location.lat;
        
        html += `
            <div class="glass-card rounded-xl p-4 task-card hover:shadow-xl transition-all" data-id="${task.id}" style="border-left: 4px solid ${categoryColor};">
                <div class="flex justify-between items-start mb-2">
                    <span class="category-tag" style="color: ${categoryColor};">${escapeHtml(task.category)}</span>
                    <span class="difficulty-${task.difficulty}">${"★".repeat(task.difficulty)}</span>
                </div>
                <h3 class="font-bold text-lg mb-1">${escapeHtml(task.text)}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">${escapeHtml(task.text.substring(0, 80))}${task.text.length > 80 ? '...' : ''}</p>
                <div class="text-sm text-gray-500 mb-2">💰 Награда: ${task.expectedReward} ₿</div>
                <div class="flex flex-wrap gap-1 mb-2">
                    ${hasPhotos ? '<span class="text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">📸 Фото</span>' : ''}
                    ${hasLocation ? '<span class="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">📍 Локация</span>' : ''}
                </div>
                <div class="text-xs mb-3 ${remaining.expired ? 'text-red-600 font-bold' : (remaining.hours < 24 ? 'text-orange-600' : 'text-gray-500')}">
                    ⏰ Дедлайн: ${formatDateTime(task.deadline)}<br>
                    ${!remaining.expired ? `Осталось: ${remaining.hours}ч ${remaining.minutes}м` : '⚠️ ПРОСРОЧЕНО!'}
                </div>
                <div class="flex flex-wrap gap-2">
                    <button class="complete-btn bg-green-600 text-white px-4 py-2 rounded-full text-sm flex-1 hover:bg-green-700 transition" data-id="${task.id}">✅ Выполнить</button>
                    <button class="surrender-btn bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm hover:bg-red-200 transition" data-id="${task.id}">🏳️ Сдаться</button>
                    <button class="cancel-task-btn bg-yellow-100 text-yellow-700 px-3 py-2 rounded-full text-sm hover:bg-yellow-200 transition" data-id="${task.id}" data-cost="${cancelCost}">⏭️ Отменить (${cancelCost}₿)</button>
                    <button class="instant-complete-btn bg-purple-100 text-purple-700 px-3 py-2 rounded-full text-sm hover:bg-purple-200 transition" data-id="${task.id}" data-cost="${instantCost}">⚡ Мгновенно (${instantCost}₿)</button>
                    <button class="add-photo-btn bg-blue-100 text-blue-700 px-3 py-2 rounded-full text-sm hover:bg-blue-200 transition" data-id="${task.id}">📸 Добавить фото</button>
                    <button class="add-location-btn bg-green-100 text-green-700 px-3 py-2 rounded-full text-sm hover:bg-green-200 transition" data-id="${task.id}">📍 Добавить локацию</button>
                </div>
            </div>
        `;
    }
    
    grid.innerHTML = html;
    
    // Делегирование событий
    grid.addEventListener('click', (e) => {
        const completeBtn = e.target.closest('.complete-btn');
        const surrenderBtn = e.target.closest('.surrender-btn');
        const cancelBtn = e.target.closest('.cancel-task-btn');
        const instantBtn = e.target.closest('.instant-complete-btn');
        const photoBtn = e.target.closest('.add-photo-btn');
        const locationBtn = e.target.closest('.add-location-btn');
        
        if (completeBtn) completeActiveTask(parseInt(completeBtn.dataset.id));
        else if (surrenderBtn) surrenderTask(parseInt(surrenderBtn.dataset.id));
        else if (cancelBtn) cancelActiveTaskForCoins(parseInt(cancelBtn.dataset.id));
        else if (instantBtn) instantCompleteTask(parseInt(instantBtn.dataset.id));
        else if (photoBtn) openPhotoUpload(parseInt(photoBtn.dataset.id));
        else if (locationBtn) openLocationPicker(parseInt(locationBtn.dataset.id));
    });
}

// ============================================================
// ОТКРЫТИЕ ДЕТАЛЕЙ АКТИВНОГО ЗАДАНИЯ
// ============================================================

/**
 * Открывает детали активного задания в модальном окне
 * @param {number} taskId - ID задания
 */
export async function openActiveTaskDetail(taskId) {
    const task = user.activeTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const categoryColor = getCategoryColor(task.category);
    const header = document.getElementById('detailHeader');
    if (header) header.style.background = `linear-gradient(135deg, ${categoryColor}, ${categoryColor}cc)`;
    
    document.getElementById('detailCategoryIcon').innerHTML = '⏳';
    document.getElementById('detailCategoryBadge').innerHTML = task.category;
    document.getElementById('detailTitle').innerHTML = escapeHtml(task.text);
    
    const remaining = getRemainingTime(task.deadline);
    
    // Загружаем фото из облака, если нужно
    let photosHtml = '';
    if (task.photos && task.photos.length) {
        const photoUrls = [];
        for (const photo of task.photos) {
            if (photo.cloud && photo.id) {
                // Загружаем из облака
                try {
                    const { loadPhotoFromCloud } = await import('./cloud/cloudPhotoStorage.js');
                    const url = await loadPhotoFromCloud(photo.id, true);
                    if (url) photoUrls.push(url);
                } catch (e) {
                    console.warn('Failed to load photo:', e);
                }
            } else if (photo.data) {
                // Старое base64 фото
                photoUrls.push(photo.data);
            }
        }
        
        if (photoUrls.length) {
            photosHtml = `
                <div class="bg-white rounded-xl p-4 shadow-sm">
                    <div class="text-xs text-gray-500 uppercase mb-2">📸 Фото</div>
                    <div class="grid grid-cols-3 gap-2">
                        ${photoUrls.map(url => `<img src="${url}" class="rounded-lg cursor-pointer" onclick="window.open(this.src)">`).join('')}
                    </div>
                </div>
            `;
        }
    }
    
    let locationHtml = '';
    if (task.location && task.location.lat) {
        locationHtml = `
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="text-xs text-gray-500 uppercase mb-2">📍 Локация</div>
                <div class="text-sm text-gray-700">${task.location.lat.toFixed(4)}, ${task.location.lng.toFixed(4)}</div>
                <button id="showOnMapBtn" class="mt-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">Показать на карте</button>
            </div>
        `;
    }
    
    document.getElementById('detailContent').innerHTML = `
        <div class="space-y-4">
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="text-xs text-gray-500 uppercase mb-2">⏰ Дедлайн</div>
                <div class="${remaining.expired ? 'text-red-600 font-bold' : 'text-gray-700'}">
                    ${formatDateTime(task.deadline)}<br>
                    ${!remaining.expired ? `Осталось: ${remaining.hours}ч ${remaining.minutes}м` : '⚠️ ПРОСРОЧЕНО!'}
                </div>
            </div>
            <div class="bg-white rounded-xl p-4 shadow-sm">
                <div class="text-xs text-gray-500 uppercase mb-2">💰 Награда</div>
                <div class="text-xl font-bold text-green-600">${task.expectedReward} ₿</div>
                <div class="text-sm text-gray-500">⭐ Опыт: +${task.baseXP} XP</div>
            </div>
            ${photosHtml}
            ${locationHtml}
            <div class="flex gap-3 pt-4">
                <button id="activeCompleteBtn" class="flex-1 px-4 py-2 bg-green-600 text-white rounded-full">✅ Выполнить</button>
                <button id="activeSurrenderBtn" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-full">🏳️ Сдаться</button>
                <button id="detailCloseBtn" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition">Закрыть</button>
            </div>
        </div>
    `;
    
    showModal('detailModal');
    
    document.getElementById('activeCompleteBtn').onclick = () => {
        hideModal('detailModal');
        completeActiveTask(task.id);
    };
    document.getElementById('activeSurrenderBtn').onclick = () => {
        hideModal('detailModal');
        surrenderTask(task.id);
    };
    document.getElementById('detailCloseBtn').onclick = () => hideModal('detailModal');
    
    const showOnMapBtn = document.getElementById('showOnMapBtn');
    if (showOnMapBtn && task.location) {
        showOnMapBtn.onclick = () => {
            hideModal('detailModal');
            window.switchTab('map');
            setTimeout(() => {
                // Центрируем карту на локации
                const event = new CustomEvent('centerMap', { 
                    detail: { lat: task.location.lat, lng: task.location.lng }
                });
                document.dispatchEvent(event);
            }, 100);
        };
    }
}

// ============================================================
// ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ФОТО
// ============================================================

/**
 * Получение URL фото по ID
 * @param {string} photoId - ID фото
 * @param {boolean} preferThumb - предпочитать миниатюру
 * @returns {Promise<string|null>}
 */
export async function getPhotoUrl(photoId, preferThumb = true) {
    // Проверяем, есть ли фото в метаданных пользователя
    const metadata = user.photos?.items?.find(p => p.id === photoId);
    if (!metadata) return null;
    
    if (metadata.isBase64 && metadata.data) {
        return metadata.data;
    }
    
    if (metadata.cloud && user.photos?.cloudEnabled) {
        try {
            const { loadPhotoFromCloud } = await import('./cloud/cloudPhotoStorage.js');
            return await loadPhotoFromCloud(photoId, preferThumb);
        } catch (e) {
            console.warn('Failed to load photo from cloud:', e);
            return null;
        }
    }
    
    return null;
}