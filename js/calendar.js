// js/calendar.js
// ============================================================
// КАЛЕНДАРЬ ДОСТИЖЕНИЙ
// ============================================================

import { user, addCoins, saveUserData } from './user.js';
import { showToast, showConfetti } from './ui.js';
import { checkAvatarRewards } from './avatars.js';

/**
 * Инициализирует и отображает календарь достижений
 */
export function initCalendar() {
    // Проверяем существование элементов перед использованием
    const currentMonthYearElem = document.getElementById('currentMonthYear');
    const calendarGridElem = document.getElementById('calendarGrid');
    const superPrizeStatusElem = document.getElementById('superPrizeStatus');
    
    if (!currentMonthYearElem || !calendarGridElem) {
        console.warn('Calendar elements not found, skipping init');
        return;
    }
    
    if (!user.calendarClaims) user.calendarClaims = [];
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const todayDate = today.getDate();
    
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    currentMonthYearElem.innerHTML = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    let html = '';
    for (let i = 0; i < adjustedFirstDay; i++) {
        html += '<div class="calendar-day future"></div>';
    }
    
    let allClaimed = true;
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isClaimed = user.calendarClaims.includes(dateStr);
        const isToday = day === todayDate;
        const isFuture = dateStr > today.toISOString().split('T')[0];
        const isPastUnclaimed = !isClaimed && !isFuture && day < todayDate;
        const reward = Math.min(10 + Math.floor(day / 3) * 5, 50);
        
        if (!isClaimed && !isFuture) allClaimed = false;
        
        let additionalClass = '';
        if (isPastUnclaimed) additionalClass = ' past-unclaimed';
        
        html += `
            <div class="calendar-day ${isClaimed ? 'claimed' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}${additionalClass}" 
                 data-day="${day}" data-reward="${reward}" data-is-past-unclaimed="${isPastUnclaimed}">
                <span class="text-sm font-bold">${day}</span>
                ${isClaimed ? '<span class="text-xs">✅</span>' : 
                  isPastUnclaimed ? '<span class="text-xs">❌</span>' : 
                  !isFuture ? `<span class="text-xs">+${reward}</span>` : ''}
            </div>
        `;
    }
    
    calendarGridElem.innerHTML = html;
    
    // Супер-приз в конце месяца
    if (superPrizeStatusElem) {
        if (allClaimed && daysInMonth === todayDate) {
            if (!user.calendarSuperPrizeClaimed) {
                addCoins(500);
                user.calendarSuperPrizeClaimed = true;
                saveUserData();
                showToast('🎉 Супер-приз! Вы заполнили весь календарь! +500 монет!', 'success');
                showConfetti();
                checkAvatarRewards();
            }
            superPrizeStatusElem.innerHTML = '✅ Супер-приз получен! +500 монет';
        } else {
            superPrizeStatusElem.innerHTML = '🎁 Заполните весь месяц и получите 500 монет!';
        }
    }
    
    // Обработчики кликов — только для сегодняшнего дня
    document.querySelectorAll('.calendar-day:not(.future):not(.claimed)').forEach(day => {
        day.addEventListener('click', () => {
            const dayNum = parseInt(day.dataset.day);
            const isPastUnclaimed = day.dataset.isPastUnclaimed === 'true';
            
            if (isPastUnclaimed) {
                showToast('❌ Награду можно получить только за сегодняшний день!', 'error');
                return;
            }
            
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            if (user.calendarClaims.includes(dateStr)) {
                showToast('Вы уже забрали награду за этот день!', 'error');
                return;
            }
            
            const reward = parseInt(day.dataset.reward);
            addCoins(reward);
            user.calendarClaims.push(dateStr);
            saveUserData();
            showToast(`📅 Награда за ${dayNum} число: +${reward} монет!`, 'success');
            showConfetti();
            initCalendar();
        });
    });
}