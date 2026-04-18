// js/photos.js
// ============================================================
// ФОТО — ГАЛЕРЕЯ И УПРАВЛЕНИЕ ФОТОГРАФИЯМИ (версия 7.5)
// ============================================================

import { user } from './user.js';
import { loadPhotoFromCloud } from './cloud/cloudPhotoStorage.js';
import { openActiveTaskDetail } from './activeTasks.js';
import { openCompletedTaskDetail } from './history.js';
import { showToast, showModal } from './ui.js';
import { debounce, escapeHtml } from './utils.js';

// ============================================================
// ПЕРЕМЕННЫЕ
// ============================================================

let isLoading = false;
let currentPage = 0;
const PHOTOS_PER_PAGE = 20;
let allPhotos = [];
let currentFilter = 'all'; // all, active, completed
let currentSort = 'date_desc'; // date_desc, date_asc, task_asc

// Кэш загруженных URL фото (для избежания повторных загрузок)
const photoUrlCache = new Map();

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Сбор всех метаданных фото из заданий
 */
function collectPhotoMetadata() {
    const photos = [];
    
    // Активные дела
    for (const task of user.activeTasks) {
        if (task.photos && task.photos.length) {
            for (const photo of task.photos) {
                if (photo.id) {
                    photos.push({
                        id: photo.id,
                        taskId: task.id,
                        taskText: task.text,
                        type: 'active',
                        addedAt: photo.addedAt || task.purchasedAt,
                        cloud: photo.cloud !== false
                    });
                }
            }
        }
    }
    
    // Выполненные дела
    for (const task of user.completedTasks) {
        if (task.photos && task.photos.length) {
            for (const photo of task.photos) {
                if (photo.id) {
                    photos.push({
                        id: photo.id,
                        taskId: task.id,
                        taskText: task.text,
                        type: 'completed',
                        addedAt: photo.addedAt || task.completedAt,
                        cloud: photo.cloud !== false
                    });
                }
            }
        }
    }
    
    return photos;
}

/**
 * Сортировка фото
 */
function sortPhotos(photos) {
    const sorted = [...photos];
    
    switch (currentSort) {
        case 'date_desc':
            sorted.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
            break;
        case 'date_asc':
            sorted.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
            break;
        case 'task_asc':
            sorted.sort((a, b) => a.taskText.localeCompare(b.taskText));
            break;
    }
    
    return sorted;
}

/**
 * Фильтрация фото
 */
function filterPhotos(photos) {
    if (currentFilter === 'all') return photos;
    return photos.filter(p => p.type === currentFilter);
}

/**
 * Очистка кэша URL (освобождение памяти)
 */
function cleanupUrlCache() {
    // Очищаем старые URL (старше 5 минут)
    const now = Date.now();
    for (const [key, value] of photoUrlCache.entries()) {
        if (now - value.timestamp > 5 * 60 * 1000) {
            if (value.url && value.url.startsWith('blob:')) {
                URL.revokeObjectURL(value.url);
            }
            photoUrlCache.delete(key);
        }
    }
}

/**
 * Получение URL фото с кэшированием
 */
async function getPhotoUrlWithCache(photoId, preferThumb = true) {
    const cacheKey = `${photoId}_${preferThumb}`;
    
    if (photoUrlCache.has(cacheKey)) {
        const cached = photoUrlCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
            return cached.url;
        }
    }
    
    const url = await loadPhotoFromCloud(photoId, preferThumb);
    if (url) {
        photoUrlCache.set(cacheKey, {
            url: url,
            timestamp: Date.now()
        });
    }
    
    // Периодическая очистка кэша
    cleanupUrlCache();
    
    return url;
}

// ============================================================
// ОСНОВНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Загрузка фото с пагинацией
 */
async function loadPhotos(startIndex, count) {
    const endIndex = Math.min(startIndex + count, allPhotos.length);
    const batch = allPhotos.slice(startIndex, endIndex);
    const results = [];
    
    for (const photo of batch) {
        try {
            const photoUrl = await getPhotoUrlWithCache(photo.id, true);
            if (photoUrl) {
                results.push({
                    ...photo,
                    url: photoUrl
                });
            }
        } catch (error) {
            console.warn(`Failed to load photo ${photo.id}:`, error);
        }
    }
    
    return results;
}

/**
 * Рендер пагинированной галереи
 */
async function renderPaginatedGallery() {
    const container = document.getElementById('photosGrid');
    if (!container) return;
    
    const startIndex = currentPage * PHOTOS_PER_PAGE;
    const hasMore = startIndex + PHOTOS_PER_PAGE < allPhotos.length;
    
    // Показываем скелетон
    if (currentPage === 0) {
        container.innerHTML = `
            <div class="photos-controls mb-4 flex justify-between items-center flex-wrap gap-2">
                <div class="flex gap-2">
                    <button class="filter-btn px-3 py-1 rounded-full text-sm ${currentFilter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200'}" data-filter="all">Все</button>
                    <button class="filter-btn px-3 py-1 rounded-full text-sm ${currentFilter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-200'}" data-filter="active">📸 Активные</button>
                    <button class="filter-btn px-3 py-1 rounded-full text-sm ${currentFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200'}" data-filter="completed">✅ Выполненные</button>
                </div>
                <div class="flex gap-2">
                    <select id="sortSelect" class="px-3 py-1 rounded-full text-sm border">
                        <option value="date_desc" ${currentSort === 'date_desc' ? 'selected' : ''}>📅 Сначала новые</option>
                        <option value="date_asc" ${currentSort === 'date_asc' ? 'selected' : ''}>📅 Сначала старые</option>
                        <option value="task_asc" ${currentSort === 'task_asc' ? 'selected' : ''}>📋 По названию</option>
                    </select>
                </div>
            </div>
            <div class="photos-grid-container grid grid-cols-2 md:grid-cols-4 gap-4" id="photosGridContainer"></div>
            <div id="photosPagination" class="flex justify-center gap-2 mt-4"></div>
        `;
    }
    
    const gridContainer = document.getElementById('photosGridContainer');
    if (!gridContainer) return;
    
    // Добавляем скелетон для загружаемых фото
    const skeletonHtml = Array(Math.min(PHOTOS_PER_PAGE, allPhotos.length - startIndex))
        .fill('<div class="photo-card-skeleton bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" style="height: 200px;"></div>')
        .join('');
    gridContainer.innerHTML += skeletonHtml;
    
    // Загружаем фото
    const loadedPhotos = await loadPhotos(startIndex, PHOTOS_PER_PAGE);
    
    // Обновляем сетку
    let gridHtml = '';
    for (const photo of loadedPhotos) {
        gridHtml += `
            <div class="photo-card cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all transform hover:scale-102" data-task-id="${photo.taskId}" data-type="${photo.type}">
                <img src="${photo.url}" alt="Фото дела" loading="lazy" class="w-full h-48 object-cover">
                <div class="p-2 bg-white dark:bg-gray-800">
                    <div class="text-sm font-medium truncate">${escapeHtml(photo.taskText)}</div>
                    <div class="text-xs text-gray-500 mt-1">${photo.type === 'active' ? '⏳ Активное' : '✅ Выполнено'}</div>
                </div>
            </div>
        `;
    }
    
    gridContainer.innerHTML = gridHtml;
    
    // Обновляем пагинацию
    const paginationContainer = document.getElementById('photosPagination');
    if (paginationContainer) {
        const totalPages = Math.ceil(allPhotos.length / PHOTOS_PER_PAGE);
        let paginationHtml = '';
        
        if (currentPage > 0) {
            paginationHtml += `<button id="prevPageBtn" class="px-4 py-2 bg-gray-200 rounded-full text-sm">← Назад</button>`;
        }
        
        paginationHtml += `<span class="px-4 py-2 text-sm">${currentPage + 1} / ${totalPages}</span>`;
        
        if (hasMore) {
            paginationHtml += `<button id="nextPageBtn" class="px-4 py-2 bg-gray-200 rounded-full text-sm">Вперед →</button>`;
        }
        
        paginationContainer.innerHTML = paginationHtml;
        
        document.getElementById('prevPageBtn')?.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                renderPaginatedGallery();
            }
        });
        
        document.getElementById('nextPageBtn')?.addEventListener('click', () => {
            if (hasMore) {
                currentPage++;
                renderPaginatedGallery();
            }
        });
    }
    
    // Обработчики для фото
    document.querySelectorAll('.photo-card').forEach(card => {
        card.addEventListener('click', () => {
            const taskId = parseInt(card.dataset.taskId);
            const type = card.dataset.type;
            
            if (type === 'active') {
                const task = user.activeTasks.find(t => t.id === taskId);
                if (task) openActiveTaskDetail(taskId);
            } else {
                const task = user.completedTasks.find(t => t.id === taskId);
                if (task) openCompletedTaskDetail(taskId);
            }
        });
    });
}

/**
 * Обновление галереи (при изменении данных)
 */
export async function renderPhotos() {
    if (isLoading) return;
    isLoading = true;
    
    const container = document.getElementById('photosGrid');
    if (!container) {
        isLoading = false;
        return;
    }
    
    // Собираем и обрабатываем фото
    allPhotos = collectPhotoMetadata();
    allPhotos = filterPhotos(allPhotos);
    allPhotos = sortPhotos(allPhotos);
    
    if (allPhotos.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <div class="text-6xl mb-4">📷</div>
                <p>Нет фотографий</p>
                <p class="text-sm mt-2">Добавьте фото к делам, чтобы они появились здесь</p>
            </div>
        `;
        isLoading = false;
        return;
    }
    
    // Сбрасываем пагинацию
    currentPage = 0;
    
    // Рендерим
    await renderPaginatedGallery();
    
    // Обработчики фильтров
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            currentFilter = btn.dataset.filter;
            currentPage = 0;
            await renderPhotos();
        });
    });
    
    // Обработчик сортировки
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', async (e) => {
            currentSort = e.target.value;
            currentPage = 0;
            await renderPhotos();
        });
    }
    
    isLoading = false;
}

/**
 * Очистка ресурсов
 */
export function destroyPhotos() {
    // Очищаем кэш URL
    for (const [key, value] of photoUrlCache.entries()) {
        if (value.url && value.url.startsWith('blob:')) {
            URL.revokeObjectURL(value.url);
        }
    }
    photoUrlCache.clear();
}