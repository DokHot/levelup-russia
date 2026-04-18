// js/testData.js
// ============================================================
// ТЕСТОВЫЕ ДАННЫЕ — ДЛЯ ОТЛАДКИ СОЦИАЛЬНЫХ ФУНКЦИЙ (версия 7.4)
// ============================================================

// Шаблоны для генерации тестовых пользователей
const FIRST_NAMES = ['Алексей', 'Дмитрий', 'Максим', 'Артём', 'Иван', 'Михаил', 'Андрей', 'Егор', 'Никита', 'Владимир', 'Сергей', 'Павел', 'Роман', 'Кирилл', 'Даниил'];
const LAST_NAMES = ['Смирнов', 'Иванов', 'Кузнецов', 'Соколов', 'Попов', 'Лебедев', 'Козлов', 'Новиков', 'Морозов', 'Петров', 'Волков', 'Соловьёв', 'Васильев', 'Зайцев', 'Павлов'];
const AVATARS = ['😀', '😎', '🦊', '🐱', '🐶', '🦁', '🐼', '🐧', '🦄', '🌟', '⭐', '🔥', '⚡', '💎', '👑'];

// Генерация случайного уровня (1-20)
function randomLevel() {
    return Math.floor(Math.random() * 20) + 1;
}

// Генерация случайного количества монет
function randomCoins() {
    return Math.floor(Math.random() * 10000) + 100;
}

// Генерация случайного количества выполненных дел
function randomTasksCompleted() {
    return Math.floor(Math.random() * 500) + 10;
}

// Генерация случайной даты последнего входа
function randomLastLogin() {
    const daysAgo = Math.floor(Math.random() * 30);
    return Date.now() - daysAgo * 24 * 60 * 60 * 1000;
}

// Генерация тестового пользователя
function generateTestUser(index) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const username = `${firstName}_${lastName}`;
    const userId = `test_user_${String(index + 1).padStart(3, '0')}`;
    const level = randomLevel();
    const lastLoginAt = randomLastLogin();
    
    return {
        account: {
            userId: userId,
            username: username,
            isGuest: false,
            createdAt: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
            lastLoginAt: lastLoginAt,
            loginStreak: Math.floor(Math.random() * 30)
        },
        level: level,
        totalPoints: level * 100 + Math.floor(Math.random() * 100),
        coins: randomCoins(),
        currentAvatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
        stats: {
            tasksCompleted: randomTasksCompleted(),
            tasksSurrendered: Math.floor(Math.random() * 10),
            urgentCompleted: Math.floor(Math.random() * 20),
            totalEarned: randomCoins() * 2,
            verifiedTasks: Math.floor(Math.random() * 50),
            confirmedTasks: Math.floor(Math.random() * 30)
        },
        pet: {
            currentPet: ['hamster', 'cat', 'dog', 'rabbit', 'parrot', 'fennec', 'phoenix'][Math.floor(Math.random() * 7)],
            level: Math.floor(Math.random() * 5) + 1,
            customName: ['Пушистик', 'Барсик', 'Шарик', 'Рыжик', 'Кеша'][Math.floor(Math.random() * 5)]
        },
        trust: {
            points: Math.floor(Math.random() * 500),
            level: ['newbie', 'verified', 'reliable', 'expert', 'master'][Math.floor(Math.random() * 5)],
            verifiedTasks: Math.floor(Math.random() * 50),
            confirmedTasks: Math.floor(Math.random() * 30)
        },
        friends: {
            list: [],
            incoming: [],
            outgoing: []
        },
        achievements: []
    };
}

// Генерация N тестовых пользователей
export function generateTestUsers(count = 50) {
    const users = [];
    for (let i = 0; i < count; i++) {
        users.push(generateTestUser(i));
    }
    return users;
}

// Сохранение тестовых пользователей в localStorage
export function saveTestUsers(users) {
    localStorage.setItem('russia1000_test_users', JSON.stringify(users));
}

// Загрузка тестовых пользователей
export function loadTestUsers() {
    const saved = localStorage.getItem('russia1000_test_users');
    if (saved) {
        return JSON.parse(saved);
    }
    const users = generateTestUsers(50);
    saveTestUsers(users);
    return users;
}

// Поиск пользователя по ID
export function findUserById(userId) {
    const users = loadTestUsers();
    return users.find(u => u.account.userId === userId);
}

// Поиск пользователей по имени (частичное совпадение)
export function findUsersByName(searchTerm) {
    const users = loadTestUsers();
    const term = searchTerm.toLowerCase();
    return users.filter(u => u.account.username.toLowerCase().includes(term));
}

// Обновление тестового пользователя
export function updateTestUser(updatedUser) {
    const users = loadTestUsers();
    const index = users.findIndex(u => u.account.userId === updatedUser.account.userId);
    if (index !== -1) {
        users[index] = updatedUser;
        saveTestUsers(users);
        return true;
    }
    return false;
}

// Быстрое создание тестовых данных (для отладки)
export function initTestData() {
    if (!localStorage.getItem('russia1000_test_users')) {
        const testUsers = generateTestUsers(50);
        saveTestUsers(testUsers);
        console.log(`✅ Создано ${testUsers.length} тестовых пользователей`);
    }
}

// Переключение на тестового пользователя (для отладки)
export function switchToTestUser(userId) {
    const testUsers = loadTestUsers();
    const testUser = testUsers.find(u => u.account.userId === userId);
    if (!testUser) return false;
    
    // Сохраняем текущего пользователя как "основного"
    const currentUser = localStorage.getItem('russia1000_user');
    localStorage.setItem('russia1000_main_user_backup', currentUser);
    
    // Загружаем тестового
    localStorage.setItem('russia1000_user', JSON.stringify(testUser));
    
    return true;
}

// Возврат к основному пользователю
export function switchToMainUser() {
    const mainUser = localStorage.getItem('russia1000_main_user_backup');
    if (mainUser) {
        localStorage.setItem('russia1000_user', mainUser);
        return true;
    }
    return false;
}