// js/authSystem.js
// ============================================================
// СИСТЕМА АВТОРИЗАЦИИ — ПОЛНАЯ ВЕРСИЯ
// ============================================================

import { 
    signUp, signIn, signOut, resetPassword,
    isAuthenticated, getProfile, getTotalPlayersCount,
    syncUserWithCloud, saveUserToCloud
} from './supabase-client.js'
import { user, saveUserData, updateUserCard } from './user.js'
import { showToast, showConfetti } from './ui.js'

// ============================================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАПУСКЕ
// ============================================================

export async function initAuth() {
    console.log('🔐 Инициализация системы авторизации...')
    
    const authenticated = await isAuthenticated()
    
    if (authenticated) {
        console.log('✅ Найдена активная сессия Supabase')
        await loadUserFromCloud()
        showWelcomeBack()
        return true
    } else {
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
        const profile = await getProfile()
        if (!profile) {
            console.warn('Профиль не найден')
            return
        }
        
        await syncUserWithCloud(user)
        
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
// УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ
// ============================================================

export function showAuthModal() {
    hideAuthModals()
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
    console.log('✅ Окно регистрации открыто')
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
        
        await signUp(email, password, username)
        await signIn(email, password)
        await loadUserFromCloud()
        
        hideAuthModals()
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
// ВЫХОД
// ============================================================

export async function handleLogout() {
    try {
        await saveUserToCloud(user)
        await signOut()
        
        localStorage.removeItem('russia1000_user')
        localStorage.removeItem('guestMode')
        
        showToast('👋 Вы вышли из аккаунта', 'info')
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
    console.log('🔧 Настройка модальных окон авторизации...')
    
    // Кнопки входа
    const doLoginBtn = document.getElementById('doLoginBtn')
    if (doLoginBtn) {
        doLoginBtn.onclick = async () => {
            const email = document.getElementById('loginEmail')?.value
            const password = document.getElementById('loginPassword')?.value
            await handleLogin(email, password)
        }
    }
    
    // Кнопки регистрации
    const doRegisterBtn = document.getElementById('doRegisterBtn')
    if (doRegisterBtn) {
        doRegisterBtn.onclick = async () => {
            const username = document.getElementById('regUsername')?.value
            const email = document.getElementById('regEmail')?.value
            const password = document.getElementById('regPassword')?.value
            const passwordConfirm = document.getElementById('regPasswordConfirm')?.value
            await handleRegister(email, password, passwordConfirm, username)
        }
    }
    
    // Восстановление пароля
    const doResetPasswordBtn = document.getElementById('doResetPasswordBtn')
    if (doResetPasswordBtn) {
        doResetPasswordBtn.onclick = async () => {
            const email = document.getElementById('resetEmail')?.value
            await handleResetPassword(email)
        }
    }
    
    // Переключение между окнами
    const showRegisterFromLoginBtn = document.getElementById('showRegisterFromLoginBtn')
    if (showRegisterFromLoginBtn) {
        showRegisterFromLoginBtn.onclick = () => {
            hideAuthModals()
            showRegisterModal()
        }
    }
    
    const showLoginFromRegisterBtn = document.getElementById('showLoginFromRegisterBtn')
    if (showLoginFromRegisterBtn) {
        showLoginFromRegisterBtn.onclick = () => {
            hideAuthModals()
            showAuthModal()
        }
    }
    
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn')
    if (forgotPasswordBtn) {
        forgotPasswordBtn.onclick = () => {
            hideAuthModals()
            showResetPasswordModal()
        }
    }
    
    const backToLoginBtn = document.getElementById('backToLoginBtn')
    if (backToLoginBtn) {
        backToLoginBtn.onclick = () => {
            hideAuthModals()
            showAuthModal()
        }
    }
    
    // ============================================================
    // ЗАКРЫТИЕ МОДАЛЬНЫХ ОКОН (ТОЛЬКО ПО КНОПКЕ)
    // ============================================================
    
    const closeLoginModal = document.getElementById('closeLoginModal')
    if (closeLoginModal) {
        closeLoginModal.onclick = () => {
            console.log('🔴 Закрытие окна входа')
            const modal = document.getElementById('loginModal')
            if (modal) modal.classList.add('hidden')
        }
    }
    
    const closeRegisterModal = document.getElementById('closeRegisterModal')
    if (closeRegisterModal) {
        closeRegisterModal.onclick = () => {
            console.log('🔴 Закрытие окна регистрации')
            const modal = document.getElementById('registerModal')
            if (modal) modal.classList.add('hidden')
        }
    }
    
    const closeResetModal = document.getElementById('closeResetModal')
    if (closeResetModal) {
        closeResetModal.onclick = () => {
            console.log('🔴 Закрытие окна восстановления')
            const modal = document.getElementById('resetPasswordModal')
            if (modal) modal.classList.add('hidden')
        }
    }
    
    // ============================================================
    // ЗАКРЫТИЕ ПО ESC
    // ============================================================
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            console.log('🔴 ESC нажат, закрываем все окна')
            const loginModal = document.getElementById('loginModal')
            const registerModal = document.getElementById('registerModal')
            const resetModal = document.getElementById('resetPasswordModal')
            
            if (loginModal && !loginModal.classList.contains('hidden')) loginModal.classList.add('hidden')
            if (registerModal && !registerModal.classList.contains('hidden')) registerModal.classList.add('hidden')
            if (resetModal && !resetModal.classList.contains('hidden')) resetModal.classList.add('hidden')
        }
    })
    
    // ============================================================
    // ЗАКРЫТИЕ ПО КЛИКУ НА ФОН — ОТКЛЮЧЕНО
    // ============================================================
    
    // Enter для отправки
    const loginPassword = document.getElementById('loginPassword')
    if (loginPassword) {
        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doLoginBtn?.click()
        })
    }
    
    const regPassword = document.getElementById('regPassword')
    if (regPassword) {
        regPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doRegisterBtn?.click()
        })
    }
    
    console.log('✅ Все обработчики авторизации настроены')
}
