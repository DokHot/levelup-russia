// js/auth.js
// ============================================================
// АВТОРИЗАЦИЯ — МОДАЛЬНОЕ ОКНО ВВОДА ИМЕНИ (версия 7.1.2)
// ============================================================

import { user, setUsername, getUsername, generateUserId, saveUserData } from './user.js';
import { showToast } from './ui.js';

let authResolve = null;

/**
 * Проверяет, нужно ли показать окно ввода имени
 * @returns {Promise<boolean>} — завершена ли настройка профиля
 */
export function checkAndShowAuth() {
    return new Promise((resolve) => {
        authResolve = resolve;
        
        // Если имя уже есть — пропускаем
        if (user.account?.username && !user.account.isGuest) {
            resolve(true);
            return;
        }
        
        // Если гость, но имя уже сгенерировано — тоже пропускаем
        if (user.account?.username && user.account.isGuest) {
            resolve(true);
            return;
        }
        
        showAuthModal();
    });
}

function showAuthModal() {
    // Создаём модальное окно, если его нет
    let modal = document.getElementById('authModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl">
                <div class="text-center mb-4">
                    <div class="text-6xl mb-2">👋</div>
                    <h2 class="text-2xl font-bold">Добро пожаловать!</h2>
                    <p class="text-gray-500 dark:text-gray-400 mt-1">Как к вам обращаться?</p>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">Ваш игровой никнейм</label>
                    <input type="text" id="authUsername" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" placeholder="Например: Синеглазый_Путник" maxlength="20">
                    <p class="text-xs text-gray-400 mt-1">От 3 до 20 символов, буквы, цифры, _</p>
                </div>
                
                <div class="flex gap-3">
                    <button id="authSkipBtn" class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 transition">Пропустить</button>
                    <button id="authConfirmBtn" class="flex-1 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition">Начать!</button>
                </div>
                
                <div class="text-center text-xs text-gray-400 mt-4">
                    💡 Пропустив, вы сможете задать имя позже в профиле
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Закрытие по клику на фон
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                skipAuth();
            }
        });
    }
    
    modal.classList.remove('hidden');
    
    const usernameInput = document.getElementById('authUsername');
    const confirmBtn = document.getElementById('authConfirmBtn');
    const skipBtn = document.getElementById('authSkipBtn');
    
    // Убираем старые обработчики
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newSkipBtn = skipBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);
    
    newConfirmBtn.onclick = () => {
        const username = usernameInput.value.trim();
        if (validateUsername(username)) {
            setUsername(username);
            closeAuthModal();
            if (authResolve) authResolve(true);
            showToast(`👋 Добро пожаловать, ${username}!`, 'success');
        } else {
            showToast('Имя должно быть от 3 до 20 символов (буквы, цифры, _)', 'error');
        }
    };
    
    newSkipBtn.onclick = () => skipAuth();
    
    // Enter для подтверждения
    usernameInput.onkeypress = (e) => {
        if (e.key === 'Enter') {
            newConfirmBtn.click();
        }
    };
    
    usernameInput.focus();
}

function skipAuth() {
    const guestName = generateGuestName();
    setUsername(guestName);
    closeAuthModal();
    if (authResolve) authResolve(true);
    showToast(`👋 Вы вошли как "${guestName}". Сменить имя можно в профиле`, 'info');
}

function generateGuestName() {
    const adjectives = ['Храбрый', 'Быстрый', 'Мудрый', 'Тихий', 'Весёлый', 'Смелый', 'Добрый'];
    const nouns = ['Странник', 'Искатель', 'Путник', 'Воин', 'Маг', 'Друг', 'Герой'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 1000);
    return `${adj}_${noun}_${num}`;
}

function validateUsername(username) {
    if (!username) return false;
    if (username.length < 3 || username.length > 20) return false;
    return /^[a-zA-Zа-яА-Я0-9_]+$/.test(username);
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('hidden');
}

/**
 * Показывает модалку смены имени (из профиля)
 * @returns {Promise<boolean>}
 */
export function showChangeUsernameModal() {
    return new Promise((resolve) => {
        let modal = document.getElementById('changeNameModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'changeNameModal';
            modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 hidden';
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl">
                    <div class="text-center mb-4">
                        <div class="text-5xl mb-2">✏️</div>
                        <h2 class="text-xl font-bold">Сменить имя</h2>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-1">Новый никнейм</label>
                        <input type="text" id="newUsername" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" placeholder="Введите новое имя" maxlength="20">
                    </div>
                    <div class="flex gap-3">
                        <button id="cancelNameBtn" class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 transition">Отмена</button>
                        <button id="confirmNameBtn" class="flex-1 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition">Сменить</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        modal.classList.remove('hidden');
        const input = document.getElementById('newUsername');
        input.value = user.account?.username || '';
        input.focus();
        
        const confirmBtn = document.getElementById('confirmNameBtn');
        const cancelBtn = document.getElementById('cancelNameBtn');
        
        const cleanup = () => {
            modal.classList.add('hidden');
            resolve(false);
        };
        
        const changeName = () => {
            const newName = input.value.trim();
            if (validateUsername(newName)) {
                setUsername(newName);
                modal.classList.add('hidden');
                showToast(`✅ Имя изменено на "${newName}"`, 'success');
                resolve(true);
                // Обновляем профиль, если открыт
                if (typeof renderProfile === 'function') {
                    renderProfile();
                }
            } else {
                showToast('Имя должно быть от 3 до 20 символов (буквы, цифры, _)', 'error');
            }
        };
        
        confirmBtn.onclick = changeName;
        cancelBtn.onclick = cleanup;
        input.onkeypress = (e) => {
            if (e.key === 'Enter') changeName();
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) cleanup();
        };
    });
}