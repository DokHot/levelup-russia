// js/supabase-client.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ============================================================
// КОНФИГУРАЦИЯ (ВАШИ КЛЮЧИ ИЗ SUPABASE)
// ============================================================

const SUPABASE_URL = 'https://qlupgdgcwtefapzezxbd.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_vw3kyPzABeFM6Y2kn3XqlA_AerDDJbW'

// Создаём клиент Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ============================================================
// АУТЕНТИФИКАЦИЯ
// ============================================================

/**
 * Регистрация нового пользователя
 * @param {string} email - Email пользователя
 * @param {string} password - Пароль (минимум 6 символов)
 * @param {string} username - Имя пользователя
 */
export async function signUp(email, password, username) {
    // 1. Регистрируем пользователя в Supabase Auth
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    })
    
    if (error) throw error
    
    // 2. Создаём профиль в таблице profiles
    const { error: profileError } = await supabase
        .from('profiles')
        .insert({
            id: data.user.id,
            username: username,
            avatar: '🏆',
            level: 1,
            coins: 200,
            total_points: 0,
            daily_streak: 0
        })
    
    if (profileError) throw profileError
    
    return data
}

/**
 * Вход пользователя
 * @param {string} email - Email
 * @param {string} password - Пароль
 */
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })
    if (error) throw error
    return data
}

/**
 * Выход из аккаунта
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

/**
 * Получение текущего пользователя
 * @returns {Promise<Object|null>} Объект пользователя или null
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) return null
    return user
}

/**
 * Проверка, авторизован ли пользователь
 */
export async function isAuthenticated() {
    const user = await getCurrentUser()
    return user !== null
}

// ============================================================
// ПРОФИЛЬ
// ============================================================

/**
 * Получение профиля пользователя
 */
export async function getProfile() {
    const user = await getCurrentUser()
    if (!user) return null
    
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
    
    if (error) throw error
    return data
}

/**
 * Обновление профиля пользователя
 * @param {Object} updates - Объект с обновляемыми полями
 */
export async function updateProfile(updates) {
    const user = await getCurrentUser()
    if (!user) throw new Error('Не авторизован')
    
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
    
    if (error) throw error
    return data
}

// ============================================================
// ПРОГРЕСС
// ============================================================

/**
 * Сохранение прогресса пользователя в облако
 * @param {Object} progressData - Данные прогресса из user
 */
export async function saveProgress(progressData) {
    const user = await getCurrentUser()
    if (!user) return
    
    const { error } = await supabase
        .from('user_progress')
        .upsert({
            user_id: user.id,
            active_tasks: progressData.activeTasks || [],
            completed_tasks: progressData.completedTasks || [],
            purchased_tasks: progressData.purchasedTasks || [],
            achievements: progressData.achievements || [],
            category_progress: progressData.categoryProgress || {},
            pet_data: progressData.pet || {},
            settings: progressData.settings || {},
            updated_at: new Date()
        })
    
    if (error) throw error
    return true
}

/**
 * Загрузка прогресса пользователя из облака
 */
export async function loadProgress() {
    const user = await getCurrentUser()
    if (!user) return null
    
    const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
    
    if (error) throw error
    return data
}

/**
 * Синхронизация локального прогресса с облаком
 * @param {Object} localUser - Локальный объект user
 */
export async function syncUserWithCloud(localUser) {
    const isAuth = await isAuthenticated()
    if (!isAuth) return false
    
    try {
        // Загружаем облачный прогресс
        const cloudProgress = await loadProgress()
        
        if (cloudProgress) {
            // Восстанавливаем данные из облака в локального пользователя
            if (cloudProgress.active_tasks) localUser.activeTasks = cloudProgress.active_tasks
            if (cloudProgress.completed_tasks) localUser.completedTasks = cloudProgress.completed_tasks
            if (cloudProgress.purchased_tasks) localUser.purchasedTasks = cloudProgress.purchased_tasks
            if (cloudProgress.achievements) localUser.achievements = cloudProgress.achievements
            if (cloudProgress.category_progress) localUser.categoryProgress = cloudProgress.category_progress
            if (cloudProgress.pet_data) localUser.pet = cloudProgress.pet_data
            if (cloudProgress.settings) localUser.settings = cloudProgress.settings
            
            // Загружаем профиль
            const profile = await getProfile()
            if (profile) {
                localUser.coins = profile.coins
                localUser.level = profile.level
                localUser.totalPoints = profile.total_points
                localUser.dailyStreak = profile.daily_streak
            }
        }
        
        return true
    } catch (error) {
        console.error('Sync error:', error)
        return false
    }
}

/**
 * Сохранение локального прогресса в облако
 * @param {Object} localUser - Локальный объект user
 */
export async function saveUserToCloud(localUser) {
    const isAuth = await isAuthenticated()
    if (!isAuth) return false
    
    try {
        // Сохраняем прогресс
        await saveProgress({
            activeTasks: localUser.activeTasks,
            completedTasks: localUser.completedTasks,
            purchasedTasks: localUser.purchasedTasks,
            achievements: localUser.achievements,
            categoryProgress: localUser.categoryProgress,
            pet: localUser.pet,
            settings: localUser.settings
        })
        
        // Сохраняем профиль
        await updateProfile({
            coins: localUser.coins,
            level: localUser.level,
            total_points: localUser.totalPoints,
            daily_streak: localUser.dailyStreak
        })
        
        return true
    } catch (error) {
        console.error('Save to cloud error:', error)
        return false
    }
}

// ============================================================
// УТИЛИТЫ
// ============================================================

/**
 * Подписка на изменения профиля в реальном времени
 * @param {Function} callback - Функция, вызываемая при изменении
 */
export function subscribeToProfileChanges(callback) {
    const subscription = supabase
        .channel('profile_changes')
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles'
            },
            (payload) => {
                callback(payload.new)
            }
        )
        .subscribe()
    
    return subscription
}