// js/auth-ui.js
import { signUp, signIn, signOut, getCurrentUser, syncUserWithCloud, saveUserToCloud, isAuthenticated } from './supabase-client.js'
import { user, saveUserData, loadUserData } from './user.js'
import { showToast, showConfetti } from './ui.js'
import { updateUserCard } from './user.js'

// Переменные состояния
let isLoggedIn = false
let currentUserEmail = null

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

/**
 * Проверка авторизации при загрузке приложения
 */
export async function initAuth() {
    const authenticated = await isAuthenticated()
    
    if (authenticated) {
        isLoggedIn = true
        const userData = await getCurrentUser()
        currentUserEmail = userData?.email
        
        // Синхронизируем облачный прогресс с локальным
        await syncUserWithCloud(user)
        saveUserData()
        updateUserCard()
        
        showToast(`☁️ Добро пожаловать, ${user.account?.username || 'игрок'}! Прогресс синхронизирован`, 'success')
        
        // Обновляем кнопку входа в шапке
        updateAuthButton()
    } else {
        isLoggedIn = false
        updateAuthButton()
    }
}

/**
 * Обновление кнопки входа в шапке
 */
function updateAuthButton() {
    const headerProfileBtn = document.getElementById('headerProfileBtn')
    if (!headerProfileBtn) return
    
    if (isLoggedIn) {
        headerProfileBtn.innerHTML = '👤✅'
        headerProfileBtn.title = 'Профиль (синхронизация включена)'
    } else {
        headerProfileBtn.innerHTML = '👤'
        headerProfileBtn.title = 'Войти в аккаунт'
    }
}

// ============================================================
// МОДАЛЬНЫЕ ОКНА
// ============================================================

/**
 * Показать модальное окно входа
 */
export function showLoginModal() {
    const modal = document.getElementById('loginModal')
    if (modal) modal.classList.remove('hidden')
    
    // Очищаем поля
    const emailInput = document.getElementById('loginEmail')
    const passwordInput = document.getElementById('loginPassword')
    if (emailInput) emailInput.value = ''
    if (passwordInput) passwordInput.value = ''
}

/**
 * Показать модальное окно регистрации
 */
export function showRegisterModal() {
    const modal = document.getElementById('registerModal')
    if (modal) modal.classList.remove('hidden')
    
    // Очищаем поля
    const usernameInput = document.getElementById('regUsername')
    const emailInput = document.getElementById('regEmail')
    const passwordInput = document.getElementById('regPassword')
    if (usernameInput) usernameInput.value = ''
    if (emailInput) emailInput.value = ''
    if (passwordInput) passwordInput.value = ''
}

/**
 * Скрыть все модальные окна
 */
function hideAllModals() {
    const loginModal = document.getElementById('loginModal')
    const registerModal = document.getElementById('registerModal')
    if (loginModal) loginModal.classList.add('hidden')
    if (registerModal) registerModal.classList.add('hidden')
}

// ============================================================
// ОБРАБОТЧИКИ
// ============================================================

/**
 * Обработчик входа
 */
async function handleLogin() {
    const email = document.getElementById('loginEmail')?.value
    const password = document.getElementById('loginPassword')?.value
    
    if (!email || !password) {
        showToast('❌ Заполните все поля', 'error')
        return
    }
    
    try {
        showToast('🔄 Вход...', 'info')
        await signIn(email, password)
        
        isLoggedIn = true
        currentUserEmail = email
        
        // Синхронизируем облачный прогресс
        await syncUserWithCloud(user)
        saveUserData()
        updateUserCard()
        
        hideAllModals()
        showToast('✅ Вход выполнен! Прогресс синхронизирован', 'success')
        showConfetti()
        updateAuthButton()
        
        // Обновляем интерфейс
        if (typeof renderShop === 'function') renderShop()
        if (typeof renderActiveTasks === 'function') renderActiveTasks()
        
    } catch (error) {
        console.error('Login error:', error)
        showToast('❌ Ошибка входа: ' + error.message, 'error')
    }
}

/**
 * Обработчик регистрации
 */
async function handleRegister() {
    const username = document.getElementById('regUsername')?.value
    const email = document.getElementById('regEmail')?.value
    const password = document.getElementById('regPassword')?.value
    
    if (!username || !email || !password) {
        showToast('❌ Заполните все поля', 'error')
        return
    }
    
    if (username.length < 3) {
        showToast('❌ Имя пользователя должно быть не менее 3 символов', 'error')
        return
    }
    
    if (password.length < 6) {
        showToast('❌ Пароль должен быть не менее 6 символов', 'error')
        return
    }
    
    try {
        showToast('🔄 Регистрация...', 'info')
        await signUp(email, password, username)
        
        // Обновляем имя пользователя в локальном профиле
        if (user.account) {
            user.account.username = username
            user.account.isGuest = false
            saveUserData()
        }
        
        hideAllModals()
        showToast('✅ Регистрация успешна! Теперь войдите в аккаунт', 'success')
        
        // Показываем окно входа
        setTimeout(() => showLoginModal(), 1000)
        
    } catch (error) {
        console.error('Register error:', error)
        showToast('❌ Ошибка регистрации: ' + error.message, 'error')
    }
}

/**
 * Обработчик выхода
 */
export async function handleLogout() {
    if (!isLoggedIn) return
    
    try {
        // Сохраняем прогресс перед выходом
        await saveUserToCloud(user)
        
        await signOut()
        
        isLoggedIn = false
        currentUserEmail = null
        
        showToast('👋 Вы вышли из аккаунта', 'info')
        updateAuthButton()
        
        // Перезагружаем страницу для сброса состояния
        setTimeout(() => location.reload(), 1000)
        
    } catch (error) {
        console.error('Logout error:', error)
        showToast('❌ Ошибка выхода', 'error')
    }
}

// ============================================================
// НАСТРОЙКА ОБРАБОТЧИКОВ
// ============================================================

export function setupAuthUI() {
    // Кнопка входа в шапке
    const headerProfileBtn = document.getElementById('headerProfileBtn')
    if (headerProfileBtn) {
        headerProfileBtn.onclick = () => {
            if (isLoggedIn) {
                // Если авторизован — показываем профиль с возможностью выхода
                showAuthProfileMenu()
            } else {
                showLoginModal()
            }
        }
    }
    
    // Кнопки в модальных окнах
    const doLoginBtn = document.getElementById('doLoginBtn')
    const doRegisterBtn = document.getElementById('doRegisterBtn')
    const closeLoginModal = document.getElementById('closeLoginModal')
    const closeRegisterModal = document.getElementById('closeRegisterModal')
    const showRegisterFromLoginBtn = document.getElementById('showRegisterFromLoginBtn')
    const showLoginFromRegisterBtn = document.getElementById('showLoginFromRegisterBtn')
    
    if (doLoginBtn) doLoginBtn.onclick = handleLogin
    if (doRegisterBtn) doRegisterBtn.onclick = handleRegister
    if (closeLoginModal) closeLoginModal.onclick = () => hideAllModals()
    if (closeRegisterModal) closeRegisterModal.onclick = () => hideAllModals()
    if (showRegisterFromLoginBtn) showRegisterFromLoginBtn.onclick = () => {
        hideAllModals()
        showRegisterModal()
    }
    if (showLoginFromRegisterBtn) showLoginFromRegisterBtn.onclick = () => {
        hideAllModals()
        showLoginModal()
    }
    
    // Закрытие по клику на фон
    const loginModal = document.getElementById('loginModal')
    const registerModal = document.getElementById('registerModal')
    
    if (loginModal) {
        loginModal.onclick = (e) => {
            if (e.target === loginModal) hideAllModals()
        }
    }
    
    if (registerModal) {
        registerModal.onclick = (e) => {
            if (e.target === registerModal) hideAllModals()
        }
    }
    
    // Enter для отправки
    const loginPassword = document.getElementById('loginPassword')
    const regPassword = document.getElementById('regPassword')
    
    if (loginPassword) {
        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin()
        })
    }
    
    if (regPassword) {
        regPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleRegister()
        })
    }
}

//**
 * Меню профиля для авторизованного пользователя
 */
function showAuthProfileMenu() {
    // Создаём временное меню
    const menu = document.createElement('div')
    menu.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50'
    menu.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full mx-4 p-6 text-center">
            <div class="text-5xl mb-4">${user.currentAvatar || '👤'}</div>
            <h3 class="text-xl font-bold mb-1">${user.account?.username || 'Игрок'}</h3>
            <p class="text-sm text-gray-500 mb-2">${currentUserEmail || ''}</p>
            
            <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 mb-4">
                <div class="flex justify-between text-sm">
                    <span>💰 Монет:</span>
                    <span class="font-bold">${user.coins || 0}</span>
                </div>
                <div class="flex justify-between text-sm mt-1">
                    <span>⭐ Уровень:</span>
                    <span class="font-bold">${user.level || 1}</span>
                </div>
                <div class="flex justify-between text-sm mt-1">
                    <span>✅ Выполнено дел:</span>
                    <span class="font-bold">${user.stats?.tasksCompleted || 0}</span>
                </div>
            </div>
            
            <div class="text-xs text-gray-400 mb-4">
                ☁️ Прогресс синхронизируется автоматически
            </div>
            
            <button id="logoutFromMenuBtn" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-full font-bold transition mb-2">
                🚪 Выйти из аккаунта
            </button>
            
            <button id="syncNowMenuBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-full font-bold transition mb-2">
                🔄 Синхронизировать сейчас
            </button>
            
            <button id="closeMenuBtn" class="w-full text-gray-400 hover:text-gray-600 text-sm">
                Закрыть
            </button>
        </div>
    `
    
    document.body.appendChild(menu)
    
    // Кнопка выхода
    document.getElementById('logoutFromMenuBtn')?.addEventListener('click', () => {
        menu.remove()
        handleLogout()
    })
    
    // Кнопка принудительной синхронизации
    document.getElementById('syncNowMenuBtn')?.addEventListener('click', async () => {
        try {
            showToast('🔄 Синхронизация...', 'info')
            await saveUserToCloud(user)
            showToast('✅ Прогресс синхронизирован!', 'success')
        } catch (error) {
            showToast('❌ Ошибка синхронизации', 'error')
        }
    })
    
    // Кнопка закрытия
    document.getElementById('closeMenuBtn')?.addEventListener('click', () => {
        menu.remove()
    })
    
    // Закрытие по клику на фон
    menu.addEventListener('click', (e) => {
        if (e.target === menu) menu.remove()
    })
}