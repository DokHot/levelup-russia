// js/photos_fixed.js
import { user } from './user.js';

export async function renderPhotos() {
    const container = document.getElementById('photosGrid');
    if (!container) {
        console.error('photosGrid не найден');
        return;
    }
    
    console.log('renderPhotos вызван');
    
    // Собираем фото
    const allPhotos = [];
    
    // Активные дела
    for (const task of user.activeTasks) {
        if (task.photos && task.photos.length) {
            console.log(`Найдено ${task.photos.length} фото в деле: ${task.text}`);
            for (const photo of task.photos) {
                allPhotos.push({
                    src: typeof photo === 'string' ? photo : null,
                    taskText: task.text,
                    type: 'active'
                });
            }
        }
    }
    
    // Выполненные дела
    for (const task of user.completedTasks) {
        if (task.photos && task.photos.length) {
            console.log(`Найдено ${task.photos.length} фото в выполненном деле: ${task.text}`);
            for (const photo of task.photos) {
                allPhotos.push({
                    src: typeof photo === 'string' ? photo : null,
                    taskText: task.text,
                    type: 'completed'
                });
            }
        }
    }
    
    console.log('Всего фото для отображения:', allPhotos.length);
    
    if (allPhotos.length === 0) {
        container.innerHTML = '<div class="text-center py-12 text-gray-500">📷 Нет фотографий. Добавьте фото к делам!</div>';
        return;
    }
    
    // Рендерим галерею
    let html = '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">';
    
    for (const photo of allPhotos) {
        if (photo.src) {
            html += `
                <div class="rounded-xl overflow-hidden shadow-md bg-white">
                    <img src="${photo.src}" class="w-full h-48 object-cover" loading="lazy">
                    <div class="p-2 text-sm truncate bg-white dark:bg-gray-800">${photo.taskText}</div>
                </div>
            `;
        } else {
            html += `
                <div class="rounded-xl overflow-hidden shadow-md bg-gray-100 p-4 text-center">
                    <div class="text-4xl mb-2">📸</div>
                    <div class="text-sm truncate">${photo.taskText}</div>
                    <div class="text-xs text-gray-500">Фото в облаке</div>
                </div>
            `;
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
    console.log('Галерея отрисована');
}