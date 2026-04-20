// js/supabase-client.js
// ============================================================
// SUPABASE КЛИЕНТ — ВСЕ ФУНКЦИИ ДЛЯ РАБОТЫ С ОБЛАКОМ
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://pxznbbvpkhgkhfqpxwyd.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_7tX6LpuwjpMLKZzJv5CPTg_unwHwBdy'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ============================================================
// АУТЕНТИФИКАЦИЯ
// ============================================================

export async function signUp(email, password, username) {
    // Проверяем уникальность имени
    const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle()
    
    if (existing) {
        throw new Error('Имя пользователя уже занято. Выберите другое')
    }
    
    // Регистрация в Supabase Auth
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: { username: username }
        }
    })
    
    if (error) {
        if (error.message.includes('already registered')) {
            throw new Error('Этот email уже зарегистрирован')
        }
        throw error
    }
    
    return data
}

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    })
    if (error) throw error
    return data
}

export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

export async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
    })
    if (error) throw error
}

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) return null
    return user
}

export async function isAuthenticated() {
    const user = await getCurrentUser()
    return user !== null
}

// ============================================================
// ПРОФИЛЬ
// ============================================================

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

export async function getTotalPlayersCount() {
    const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    return count
}

// ============================================================
// ПРОГРЕСС
// ============================================================

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
}

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

export async function syncUserWithCloud(localUser) {
    const isAuth = await isAuthenticated()
    if (!isAuth) return false
    
    try {
        const cloudProgress = await loadProgress()
        
        if (cloudProgress) {
            if (cloudProgress.active_tasks) localUser.activeTasks = cloudProgress.active_tasks
            if (cloudProgress.completed_tasks) localUser.completedTasks = cloudProgress.completed_tasks
            if (cloudProgress.purchased_tasks) localUser.purchasedTasks = cloudProgress.purchased_tasks
            if (cloudProgress.achievements) localUser.achievements = cloudProgress.achievements
            if (cloudProgress.category_progress) localUser.categoryProgress = cloudProgress.category_progress
            if (cloudProgress.pet_data) localUser.pet = cloudProgress.pet_data
            if (cloudProgress.settings) localUser.settings = cloudProgress.settings
            
            const profile = await getProfile()
            if (profile) {
                localUser.coins = profile.coins
                localUser.level = profile.level
                localUser.totalPoints = profile.total_points
                localUser.dailyStreak = profile.daily_streak
                localUser.currentAvatar = profile.avatar
            }
        }
        
        return true
    } catch (error) {
        console.error('Sync error:', error)
        return false
    }
}

export async function saveUserToCloud(localUser) {
    const isAuth = await isAuthenticated()
    if (!isAuth) return false
    
    try {
        await saveProgress({
            activeTasks: localUser.activeTasks,
            completedTasks: localUser.completedTasks,
            purchasedTasks: localUser.purchasedTasks,
            achievements: localUser.achievements,
            categoryProgress: localUser.categoryProgress,
            pet: localUser.pet,
            settings: localUser.settings
        })
        
        await updateProfile({
            coins: localUser.coins,
            level: localUser.level,
            total_points: localUser.totalPoints,
            daily_streak: localUser.dailyStreak,
            avatar: localUser.currentAvatar
        })
        
        return true
    } catch (error) {
        console.error('Save to cloud error:', error)
        return false
    }
}

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

export async function isUsernameUnique(username) {
    const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle()
    
    if (error && error.code !== 'PGRST116') throw error
    return !data
}