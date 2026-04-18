// js/authSystem.js
// ============================================================
// СИСТЕМА АВТОРИЗАЦИИ — УПРАВЛЕНИЕ ВХОДОМ, РЕГИСТРАЦИЕЙ, ГОСТЕВЫМ РЕЖИМОМ
// ============================================================

import { 
    supabase, signUp, signIn, signOut, resetPassword,
    getCurrentUser, isAuthenticated, getProfile, getTotalPlayersCount,
    syncUserWithCloud, saveUserToCloud, isGuestMode, enableGuestMode, disableGuestMode
} from './supabase-client.js'
import { user, saveUserData, loadUserData, updateUserCard } from './user.js'
import { showToast, showConfetti } from './ui.js'

// ============================================================
// ПЕРЕМЕННЫЕ
// ============================================================

let onAuthCallback = null

// ============================================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАПУСКЕ
// ============================================================

export async function initAuth() {
    console.log('🔐 Инициализация системы авторизации...')
    
    // Проверяем сессию в Supabase
    const authenticated = await isAuthenticated()
    const guestMode = isGuestMode()
    
    if (authenticated) {
        // Пользователь авторизован в Supabase
        console.log('✅ Найдена активная сессия Supabase')
        await loadUserFromCloud()
        disableGuestMode()
        showWelcomeBack()
        return true
    } else if (guestMode) {
        // Гостевой режим
        console.log('👤 Гостевой режим')
        loadUserData()
        showToast('👋 Добро пожаловать в гостевом режиме! Зарегистрируйтесь, чтобы сохранить прогресс', 'info')
        return true
    } else {
        // Нет авторизации — показываем окно входа
        console.log('❌ Нет активной сессии, показываем окно входа')
        showAuthModal()
        return false
    }
}

// ============================================================
// ЗАГРУЗКА ДАННЫХ ИЗ ОБЛАКА
// ============================================================

async function loadUserFromCloud() {
    try {
        // Загружаем профиль
        const profile = await getProfile()
        if (!profile) {
            console.warn('Профиль не найден')
            return
        }
        
        // Загружаем прогресс
        await syncUserWithCloud(user)
        
        // Обновляем локальные данные
        user.account = user.account || {}
        user.account.username = profile.username
        user.account.isGuest = false
        user.account.userId = profile.id
        
        user.coins = profile.coins
        user.level = profile.level
        user.totalPoints = profile.total_points
        user.dailyStreak = profile.daily_streak
        user.currentAvatar = profile.avatar
        
        saveUserData()
        updateUserCard()
        
        console.log('✅ Данные загружены из облака')
    } catch (error) {
        console.error('Ошибка загрузки из облака:', error)
        showToast('❌ Ошибка загрузки данных из облака', 'error')
    }
}

// ============================================================
// ПОКАЗ ПРИВЕТСТВИЯ
// ============================================================

function showWelcomeBack() {
    const username = user.account?.username || 'Игрок'
    showToast(`👋 С возвращением, ${username}!`, 'success')
    showConfetti()
}

function showWelcomeNew(username) {
    showToast(`🎉 Добро пожаловать, ${username}!`, 'success')
    showConfetti()
}

// ============================================================
// МОДАЛЬНЫЕ ОКНА
// ============================================================

export function showAuthModal() {
    const loginModal = document.getElementById('loginModal')
    if (loginModal) loginModal.classList.remove('hidden')
}

export function hideAuthModals() {
    const modals = ['loginModal', 'registerModal', 'resetPasswordModal']
    modals.forEach(id => {
        const modal = document.getElementById(id)
        if (modal) modal.classList.add('hidden')
    })
}

export function showRegisterModal() {
    hideAuthModals()
    const registerModal = document.getElementById('registerModal')
    if (registerModal) registerModal.classList.remove('hidden')
}

export function showResetPasswordModal() {
    hideAuthModals()
    const resetModal = document.getElementById('resetPasswordModal')
    if (resetModal) resetModal.classList.remove('hidden')
}

// ============================================================
// РЕГИСТРАЦИЯ
// ============================================================

export async function handleRegister(email, password, passwordConfirm, username) {
    // Валидация
    if (!username || username.length < 3) {
        showToast('❌ Имя пользователя должно быть не менее 3 символов', 'error')
        return false
    }
    
    if (!email || !email.includes('@')) {
        showToast('❌ Введите корректный email', 'error')
        return false
    }
    
    if (!password || password.length < 6) {
        showToast('❌ Пароль должен быть не менее 6 символов', 'error')
        return false
    }
    
    if (password !== passwordConfirm) {
        showToast('❌ Пароли не совпадают', 'error')
        return false
    }
    
    try {
        showToast('🔄 Регистрация...', 'info')
        
        // Сохраняем гостевой прогресс до регистрации
        const guestProgress = { ...user }
        
        // Регистрация
        await signUp(email, password, username)
        
        // Вход после регистрации
        await signIn(email, password)
        
        // Перенос гостевого прогресса
        if (guestProgress.stats?.tasksCompleted > 0) {
            await saveUserToCloud(guestProgress)
        }
        
        // Загрузка данных из облака
        await loadUserFromCloud()
        
        hideAuthModals()
        disableGuestMode()
        showWelcomeNew(username)
        
        return true
    } catch (error) {
        showToast(`❌ ${error.message}`, 'error')
        return false
    }
}

// ============================================================
// ВХОД
// ============================================================

export async function handleLogin(email, password) {
    if (!email || !password) {
        showToast('❌ Заполните все поля', 'error')
        return false
    }
    
    try {
        showToast('🔄 Вход...', 'info')
        await signIn(email, password)
        await loadUserFromCloud()
        
        hideAuthModals()
        disableGuestMode()
        showWelcomeBack()
        
        return true
    } catch (error) {
        showToast(`❌ Ошибка входа: ${error.message}`, 'error')
        return false
    }
}

// ============================================================
// ВОССТАНОВЛЕНИЕ ПАРОЛЯ
// ============================================================

export async function handleResetPassword(email) {
    if (!email || !email.includes('@')) {
        showToast('❌ Введите корректный email', 'error')
        return false
    }
    
    try {
        showToast('🔄 Отправка письма...', 'info')
        await resetPassword(email)
        showToast('✅ Ссылка для сброса пароля отправлена на email', 'success')
        hideAuthModals()
        showAuthModal()
        return true
    } catch (error) {
        showToast(`❌ ${error.message}`, 'error')
        return false
    }
}

// ============================================================
// ГОСТЕВОЙ РЕЖИМ
// ============================================================

export function handleGuestMode() {
    enableGuestMode()
    loadUserData()
    hideAuthModals()
    showToast('👋 Добро пожаловать в гостевом режиме!', 'success')
    
    // Генерируем случайное имя для гостя
    if (!user.account?.username) {
        const guestName = 'Гость_' + Math.floor(Math.random() * 10000)
        user.account = user.account || {}
        user.account.username = guestName
        user.account.isGuest = true
        saveUserData()
        updateUserCard()
    }
    
    return true
}

// ============================================================
// ВЫХОД
// ============================================================

export async function handleLogout() {
    try {
        // Сохраняем прогресс перед выходом
        await saveUserToCloud(user)
        await signOut()
        disableGuestMode()
        
        // Очищаем локальные данные
        localStorage.removeItem('russia1000_user')
        
        showToast('👋 Вы вышли из аккаунта', 'info')
        
        // Перезагружаем страницу для сброса состояния
        setTimeout(() => location.reload(), 1000)
    } catch (error) {
        console.error('Logout error:', error)
        showToast('❌ Ошибка выхода', 'error')
    }
}

// ============================================================
// НАСТРОЙКА ОБРАБОТЧИКОВ МОДАЛЬНЫХ ОКОН
// ============================================================

export function setupAuthModals() {
    // Кнопки входа/регистрации
    const doLoginBtn = document.getElementById('doLoginBtn')
    const doRegisterBtn = document.getElementById('doRegisterBtn')
    const doResetPasswordBtn = document.getElementById('doResetPasswordBtn')
    
    // Кнопки переключения между модальными окнами
    const showRegisterFromLoginBtn = document.getElementById('showRegisterFromLoginBtn')
    const showLoginFromRegisterBtn = document.getElementById('showLoginFromRegisterBtn')
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn')
    const backToLoginBtn = document.getElementById('backToLoginBtn')
    
    // Гостевой режим
    const guestLoginBtn = document.getElementById('guestLoginBtn')
    const guestRegisterBtn = document.getElementById('guestRegisterBtn')
    
    // Кнопки закрытия
    const closeLoginModal = document.getElementById('closeLoginModal')
    const closeRegisterModal = document.getElementById('closeRegisterModal')
    const closeResetModal = document.getElementById('closeResetModal')
    
    // ========== ВХОД ==========
    if (doLoginBtn) {
        doLoginBtn.onclick = async () => {
            const email = document.getElementById('loginEmail')?.value
            const password = document.getElementById('loginPassword')?.value
            await handleLogin(email, password)
        }
    }
    
    // ========== РЕГИСТРАЦИЯ ==========
    if (doRegisterBtn) {
        doRegisterBtn.onclick = async () => {
            const username = document.getElementById('regUsername')?.value
            const email = document.getElementById('regEmail')?.value
            const password = document.getElementById('regPassword')?.value
            const passwordConfirm = document.getElementById('regPasswordConfirm')?.value
            await handleRegister(email, password, passwordConfirm, username)
        }
    }
    
    // ========== ВОССТАНОВЛЕНИЕ ПАРОЛЯ ==========
    if (doResetPasswordBtn) {
        doResetPasswordBtn.onclick = async () => {
            const email = document.getElementById('resetEmail')?.value
            await handleResetPassword(email)
        }
    }
    
    // ========== ПЕРЕКЛЮЧЕНИЕ МЕЖДУ ОКНАМИ ==========
    if (showRegisterFromLoginBtn) {
        showRegisterFromLoginBtn.onclick = () => {
            console.log('🔄 Переход на регистрацию')
            showRegisterModal()
        }
    }
    
    if (showLoginFromRegisterBtn) {
        showLoginFromRegisterBtn.onclick = () => {
            console.log('🔄 Переход на вход')
            hideAuthModals()
            showAuthModal()
        }
    }
    
    if (forgotPasswordBtn) {
        forgotPasswordBtn.onclick = () => {
            console.log('🔄 Переход на восстановление пароля')
            showResetPasswordModal()
        }
    }
    
    if (backToLoginBtn) {
        backToLoginBtn.onclick = () => {
            console.log('🔄 Возврат ко входу')
            hideAuthModals()
            showAuthModal()
        }
    }
    
    // ========== ГОСТЕВОЙ РЕЖИМ ==========
    if (guestLoginBtn) {
        guestLoginBtn.onclick = () => {
            console.log('👤 Гостевой режим (из входа)')
            handleGuestMode()
        }
    }
    
    if (guestRegisterBtn) {
        guestRegisterBtn.onclick = () => {
            console.log('👤 Гостевой режим (из регистрации)')
            handleGuestMode()
        }
    }
    
    // ========== ЗАКРЫТИЕ МОДАЛЬНЫХ ОКОН ==========
    if (closeLoginModal) {
        closeLoginModal.onclick = hideAuthModals
    }
    if (closeRegisterModal) {
        closeRegisterModal.onclick = hideAuthModals
    }
    if (closeResetModal) {
        closeResetModal.onclick = hideAuthModals
    }
    
    // ========== ЗАКРЫТИЕ ПО КЛИКУ НА ФОН ==========
    const modals = ['loginModal', 'registerModal', 'resetPasswordModal']
    modals.forEach(id => {
        const modal = document.getElementById(id)
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) hideAuthModals()
            })
        }
    })
    
    // ========== ENTER ДЛЯ ОТПРАВКИ ==========
    const loginPassword = document.getElementById('loginPassword')
    const regPassword = document.getElementById('regPassword')
    
    if (loginPassword) {
        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doLoginBtn?.click()
        })
    }
    
    if (regPassword) {
        regPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doRegisterBtn?.click()
        })
    }
    
    console.log('✅ Auth модальные окна настроены')
}