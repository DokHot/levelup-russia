// js/map.js
// ============================================================
// КАРТА — ЯНДЕКС.КАРТЫ И МЕТКИ
// ============================================================

import { user, saveUserData } from './user.js';
import { getCategoryColor } from './config.js';
import { formatDate } from './utils.js';
import { showToast, showModal } from './ui.js';

let map = null;
let placemarks = [];

/**
 * Инициализирует карту (только один раз)
 */
export function initMap() {
    if (typeof ymaps === 'undefined') {
        setTimeout(initMap, 500);
        return;
    }
    
    ymaps.ready(() => {
        if (map) return;
        
        map = new ymaps.Map('globalMap', {
            center: [55.751574, 37.573856],
            zoom: 5,
            controls: ['zoomControl', 'fullscreenControl']
        });
        
        loadMarkersToMap();
        
        // Ручная установка метки по клику на карту
        map.events.add('click', (e) => {
            const coords = e.get('coords');
            const taskName = prompt('Введите название дела для этой метки:', 'Моё дело');
            if (taskName && taskName.trim()) {
                const category = prompt('Введите категорию дела:', 'Путешествия');
                addMarkerToMap(coords[0], coords[1], taskName, category || 'Другое');
                
                // Сохраняем метку в localStorage
                const newTask = {
                    id: Date.now(),
                    text: taskName,
                    category: category || 'Другое',
                    location: { lat: coords[0], lng: coords[1], name: taskName },
                    completedAt: new Date().toISOString(),
                    type: 'manual_marker',
                    reward: 0,
                    xp: 0
                };
                
                if (!user.completedTasks) user.completedTasks = [];
                user.completedTasks.unshift(newTask);
                user.stats.locationsAdded++;
                saveUserData();
                
                showToast(`📍 Метка "${taskName}" добавлена на карту!`, 'success');
            }
        });
    });
}

/**
 * Загружает все сохранённые метки из выполненных и активных дел
 */
function loadMarkersToMap() {
    if (!map) return;
    
    placemarks.forEach(p => map.geoObjects.remove(p));
    placemarks = [];
    
    // Метки из выполненных дел
    if (user.completedTasks) {
        for (const task of user.completedTasks) {
            if (task.location && task.location.lat && task.location.lng) {
                addMarkerToMap(task.location.lat, task.location.lng, task.text, task.category);
            }
        }
    }
    
    // Метки из активных дел
    if (user.activeTasks) {
        for (const task of user.activeTasks) {
            if (task.location && task.location.lat && task.location.lng) {
                addMarkerToMap(task.location.lat, task.location.lng, task.text, task.category);
            }
        }
    }
}

/**
 * Добавляет маркер на карту
 * @param {number} lat - широта
 * @param {number} lng - долгота
 * @param {string} title - название дела
 * @param {string} category - категория
 */
export function addMarkerToMap(lat, lng, title, category) {
    if (!map) return;
    
    const categoryColor = getCategoryColor(category);
    const placemark = new ymaps.Placemark([lat, lng], {
        balloonContentHeader: title,
        balloonContentBody: `Категория: ${category}`,
        balloonContentFooter: `Добавлено: ${formatDate(new Date())}`
    }, {
        preset: 'islands#icon',
        iconColor: categoryColor
    });
    
    placemark.events.add('click', () => {
        document.getElementById('markerTaskTitle').innerText = title;
        document.getElementById('markerTaskCategory').innerHTML = `Категория: ${category}`;
        document.getElementById('markerTaskDate').innerHTML = `Добавлено: ${formatDate(new Date())}`;
        showModal('mapMarkerModal');
    });
    
    placemarks.push(placemark);
    map.geoObjects.add(placemark);
}

/**
 * Рендер карты (вызывается при открытии вкладки)
 */
export function renderMap() {
    initMap();
}