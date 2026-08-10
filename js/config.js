// js/config.js
// ============================================================
// КОНФИГУРАЦИЯ — ВСЕ КОНСТАНТЫ ПРИЛОЖЕНИЯ
// Версия 3.0 — Полная привязка к пакетам
// ============================================================

// ============================================================
// СЛОЖНОСТИ ДЕЛ
// ============================================================
export const DIFFICULTY_CONFIG = {
    1: { freePrice: 0, paidPrice: 20, baseReward: 35, baseXP: 10, name: "Простые" },
    2: { price: 60, baseReward: 90, baseXP: 20, name: "Средние" },
    3: { price: 200, baseReward: 280, baseXP: 40, name: "Сложные" },
    4: { price: 500, baseReward: 700, baseXP: 80, name: "Экспертные" },
    5: { price: 1200, baseReward: 1600, baseXP: 150, name: "Эпические" }
};

// ============================================================
// УРОВНИ (20 шт.)
// ============================================================
export const LEVELS = [
    { level: 1, title: "🟢 Новичок", pointsNeeded: 0, reward: 50 },
    { level: 2, title: "🔵 Любопытный", pointsNeeded: 100, reward: 50 },
    { level: 3, title: "🟡 Искатель", pointsNeeded: 300, reward: 100 },
    { level: 4, title: "🟠 Путешественник", pointsNeeded: 600, reward: 100 },
    { level: 5, title: "🔴 Исследователь", pointsNeeded: 1000, reward: 150 },
    { level: 6, title: "🟣 Эксперт", pointsNeeded: 1500, reward: 150 },
    { level: 7, title: "⭐ Мастер", pointsNeeded: 2100, reward: 200 },
    { level: 8, title: "🌟 Профи", pointsNeeded: 2800, reward: 200 },
    { level: 9, title: "💎 Виртуоз", pointsNeeded: 3600, reward: 250 },
    { level: 10, title: "👑 Легенда", pointsNeeded: 4500, reward: 500 },
    { level: 11, title: "🔥 Герой", pointsNeeded: 5500, reward: 600 },
    { level: 12, title: "⚡ Легендарный", pointsNeeded: 6600, reward: 700 },
    { level: 13, title: "🏆 Чемпион", pointsNeeded: 7800, reward: 800 },
    { level: 14, title: "🎯 Снайпер", pointsNeeded: 9100, reward: 900 },
    { level: 15, title: "🦅 Орёл", pointsNeeded: 10500, reward: 1000 },
    { level: 16, title: "🐺 Волк", pointsNeeded: 12000, reward: 1100 },
    { level: 17, title: "👁️ Провидец", pointsNeeded: 13600, reward: 1200 },
    { level: 18, title: "🌀 Абсолют", pointsNeeded: 15300, reward: 1300 },
    { level: 19, title: "💥 Неудержимый", pointsNeeded: 17100, reward: 1400 },
    { level: 20, title: "🌌 Бессмертный", pointsNeeded: 19000, reward: 2000 }
];

// ============================================================
// КАТЕГОРИЙНЫЕ ДОСТИЖЕНИЯ С ПРИВЯЗКОЙ К ПАКЕТАМ
// ============================================================
export const CATEGORY_ACHIEVEMENTS = [
    // ============================================================
    // БАЗОВЫЙ ПАКЕТ (core) — всегда активен
    // ============================================================
    { id: "cat_health", name: "💪 ЗОЖник", category: "Здоровье и тело", levels: [5, 10, 15, 30], rewards: [50, 100, 200, 500], packageId: "core" },
    { id: "cat_home", name: "🏠 Хозяин/Хозяйка", category: "Дом и быт", levels: [5, 12, 20, 35], rewards: [50, 100, 200, 500], packageId: "core" },
    { id: "cat_creative", name: "🎨 Творец", category: "Творчество", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "core" },
    { id: "cat_psychology", name: "🧠 Мастер психологии", category: "Психология", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "core" },
    { id: "cat_volunteer", name: "🤝 Доброволец", category: "Волонтёрство", levels: [2, 5, 10, 20], rewards: [50, 100, 200, 500], packageId: "core" },
    { id: "cat_relationships", name: "💕 Мастер отношений", category: "Отношения и любовь", levels: [3, 8, 15, 30], rewards: [50, 100, 200, 500], packageId: "core" },
    { id: "cat_emotions_core", name: "🎢 Эмоциональный интеллект", category: "Эмоции и впечатления", levels: [3, 7, 12, 20], rewards: [50, 100, 200, 500], packageId: "core" },
    { id: "cat_religion", name: "🙏 Духовный искатель", category: "Религия и духовное", levels: [3, 7, 12, 20], rewards: [50, 100, 200, 500], packageId: "core" },
    { id: "cat_strange", name: "🤪 Любитель странного", category: "Странные дела", levels: [3, 7, 12, 20], rewards: [50, 100, 200, 500], packageId: "core" },
    
    // ============================================================
    // ПАКЕТ "ПУТЕШЕСТВИЯ" (travel) — уровень 3
    // ============================================================
    { id: "cat_travel", name: "🇷🇺 Знаток России", category: "Путешествия по России", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "travel" },
    { id: "cat_geo", name: "📍 Первооткрыватель", category: "Географические точки", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "travel" },
    { id: "cat_transport", name: "🚗 Путешественник", category: "Транспорт и дороги", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "travel" },
    { id: "cat_astronomy", name: "🌙 Звездочёт", category: "Астрономия и космос", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "travel" },
    
    // ============================================================
    // ПАКЕТ "СПОРТ И ЗДОРОВЬЕ" (health) — уровень 3
    // ============================================================
    { id: "cat_sport", name: "🏋️ Спортсмен", category: "Экстрим", levels: [3, 7, 12, 20], rewards: [50, 100, 200, 500], packageId: "health" },
    { id: "cat_sleep", name: "😴 Король сна", category: "Сон и восстановление", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "health" },
    { id: "cat_beauty", name: "💄 Стильный", category: "Красота и уход", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "health" },
    { id: "cat_biohacking", name: "🧬 Биохакер", category: "Биохакинг", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "health" },
    { id: "cat_defense", name: "🥋 Защитник", category: "Самооборона", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "health" },
    
    // ============================================================
    // ПАКЕТ "КУЛИНАРИЯ" (cooking) — уровень 3
    // ============================================================
    { id: "cat_cooking", name: "👨‍🍳 Мастер кулинарии", category: "Кулинария", levels: [3, 7, 14, 30], rewards: [50, 100, 200, 500], packageId: "cooking" },
    { id: "cat_street_food", name: "🌭 Гурман", category: "Уличная еда", levels: [3, 7, 12, 20], rewards: [50, 100, 200, 500], packageId: "cooking" },
    { id: "cat_hospitality", name: "🍷 Хлебосол", category: "Гостеприимство", levels: [3, 7, 12, 20], rewards: [50, 100, 200, 500], packageId: "cooking" },
    
    // ============================================================
    // ПАКЕТ "ПРИРОДА" (nature) — уровень 3
    // ============================================================
    { id: "cat_nature", name: "🌿 Хранитель природы", category: "Гербарий и ботаника", levels: [3, 8, 15, 25], rewards: [50, 100, 200, 500], packageId: "nature" },
    { id: "cat_garden", name: "🌱 Садовод", category: "Садоводство и огород", levels: [3, 8, 15, 25], rewards: [50, 100, 200, 500], packageId: "nature" },
    { id: "cat_ecology", name: "♻️ Эко-герой", category: "Экология", levels: [3, 8, 15, 25], rewards: [50, 100, 200, 500], packageId: "nature" },
    { id: "cat_animals", name: "🐄 Животновод", category: "Животноводство", levels: [3, 8, 15, 25], rewards: [50, 100, 200, 500], packageId: "nature" },
    
    // ============================================================
    // ПАКЕТ "ТВОРЧЕСТВО" (creative) — уровень 4
    // ============================================================
    { id: "cat_art", name: "🖼️ Художник", category: "Искусство", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "creative" },
    { id: "cat_photo", name: "📷 Фотограф-путешественник", category: "Фотография", levels: [10, 30, 60, 100], rewards: [50, 100, 200, 500], packageId: "creative" },
    { id: "cat_collector", name: "🪙 Коллекционер", category: "Коллекционирование", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "creative" },
    { id: "cat_city", name: "🏙️ Исследователь города", category: "Городские исследования", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "creative" },
    
    // ============================================================
    // ПАКЕТ "САМОРАЗВИТИЕ" (selfdev) — уровень 4
    // ============================================================
    { id: "cat_selfdev", name: "📚 Книжный червь", category: "Навыки и саморазвитие", levels: [5, 15, 30, 50], rewards: [50, 100, 200, 500], packageId: "selfdev" },
    { id: "cat_learning", name: "🎓 Ученик", category: "Обучение и курсы", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "selfdev" },
    { id: "cat_finance", name: "💰 Финансист", category: "Финансы", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "selfdev" },
    { id: "cat_career", name: "💼 Карьерист", category: "Работа и карьера", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "selfdev" },
    { id: "cat_digital", name: "📱 Цифровой гигиенист", category: "Цифровая гигиена", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "selfdev" },
    { id: "cat_media", name: "📰 Медиа-эксперт", category: "Медиа и информация", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "selfdev" },
    
    // ============================================================
    // ПАКЕТ "ОТНОШЕНИЯ" (relationships) — уровень 4
    // ============================================================
    { id: "cat_letters", name: "✉️ Мастер писем", category: "Письма", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "relationships" },
    { id: "cat_charity", name: "🎁 Благотворитель", category: "Благотворительность", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "relationships" },
    
    // ============================================================
    // ПАКЕТ "РЫБАЛКА И ОХОТА" (fishing) — уровень 5
    // ============================================================
    { id: "cat_fishing", name: "🎣 Рыбак-любитель", category: "Рыбалка и охота", levels: [3, 7, 12, 20], rewards: [50, 100, 200, 500], packageId: "fishing" },
    
    // ============================================================
    // ПАКЕТ "ЭКСТРИМ" (extreme) — уровень 5
    // ============================================================
    { id: "cat_extreme", name: "🏔️ Покоритель вершин", category: "Экстрим", levels: [2, 5, 8, 15], rewards: [50, 100, 200, 500], packageId: "extreme" },
    
    // ============================================================
    // ПАКЕТ "ЧЕЛЛЕНДЖИ" (challenges) — уровень 6
    // ============================================================
    { id: "cat_challenges", name: "🏆 Чемпион", category: "Челленджи", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "challenges" },
    { id: "cat_life", name: "✨ Мастер жизни", category: "Один раз в жизни", levels: [5, 10, 15, 25], rewards: [50, 100, 200, 500], packageId: "challenges" }
];

// ============================================================
// ГРУППЫ КАТЕГОРИЙ
// ============================================================
export const CATEGORY_GROUPS = [
    { name: "ПРИРОДА И ПУТЕШЕСТВИЯ", icon: "🌍", categories: [
        "Путешествия по России", "Транспорт и дороги", "Географические точки",
        "Астрономия и космос", "Рыбалка и охота", "Гербарий и ботаника",
        "Садоводство и огород", "Животноводство"
    ]},
    { name: "АКТИВНЫЙ ОБРАЗ ЖИЗНИ", icon: "⚡", categories: [
        "Экстрим", "Здоровье и тело", "Эмоции и впечатления",
        "Сон и восстановление", "Биохакинг", "Красота и уход", "Самооборона"
    ]},
    { name: "ПРИРОДА, ДОМ, ЕДА", icon: "🍃", categories: [
        "Уличная еда", "Кулинария", "Дом и быт", "Гостеприимство"
    ]},
    { name: "ЛЮДИ И ПОМОЩЬ", icon: "💕", categories: [
        "Отношения и любовь", "Волонтёрство", "Благотворительность", "Письма"
    ]},
    { name: "УМ, ТВОРЧЕСТВО, НАВЫКИ", icon: "🎨", categories: [
        "Навыки и саморазвитие", "Обучение и курсы", "Творчество",
        "Искусство", "Фотография", "Коллекционирование", "Городские исследования"
    ]},
    { name: "ВНУТРЕННИЙ МИР", icon: "🧠", categories: [
        "Психология", "Религия и духовное", "Челленджи",
        "Один раз в жизни", "Странные дела"
    ]},
    { name: "ДЕНЬГИ, РАБОТА, ТЕХНОЛОГИИ", icon: "💰", categories: [
        "Финансы", "Работа и карьера", "Цифровая гигиена",
        "Экология", "Медиа и информация"
    ]}
];

// ============================================================
// МНОЖИТЕЛИ ДЕДЛАЙНОВ
// ============================================================
export const DEADLINE_MULTIPLIERS = {
    1: { multiplier: 2.0, penalty: 0.9, name: "1 день", icon: "⚡" },
    3: { multiplier: 1.5, penalty: 0.7, name: "3 дня", icon: "🔥" },
    7: { multiplier: 1.2, penalty: 0.5, name: "7 дней", icon: "📅" },
    14: { multiplier: 1.0, penalty: 0.3, name: "14 дней", icon: "📆" },
    30: { multiplier: 0.8, penalty: 0.2, name: "30 дней", icon: "🐢" }
};

// ============================================================
// СРОЧНЫЕ ЗАДАНИЯ
// ============================================================
export const URGENT_TASKS = [
    { text: "🏃 Срочная пробежка!", desc: "Пробежать 3 км", timeLimit: 2, reward: 100, fastBonus: 50, xp: 30 },
    { text: "📸 Поймай закат!", desc: "Сфотографировать закат", timeLimit: 4, reward: 60, fastBonus: 30, xp: 15 },
    { text: "🍳 Срочный ужин!", desc: "Приготовить ужин", timeLimit: 3, reward: 80, fastBonus: 40, xp: 20 },
    { text: "📞 Позвони родным!", desc: "Позвонить близкому", timeLimit: 6, reward: 50, fastBonus: 25, xp: 10 },
    { text: "🧘 Медитация!", desc: "10 минут медитации", timeLimit: 3, reward: 55, fastBonus: 25, xp: 15 },
    { text: "💪 100 отжиманий!", desc: "Сделать 100 отжиманий", timeLimit: 4, reward: 150, fastBonus: 75, xp: 40 },
    { text: "📖 Прочитай главу!", desc: "20 страниц книги", timeLimit: 8, reward: 70, fastBonus: 35, xp: 20 }
];

// ============================================================
// АВАТАРКИ
// ============================================================

export const NORMAL_AVATARS = [
    { id: "cat", icon: "🐱", name: "Кот", price: 100, type: "normal", category: "normal" },
    { id: "dog", icon: "🐶", name: "Пёс", price: 150, type: "normal", category: "normal" },
    { id: "fox", icon: "🦊", name: "Лиса", price: 200, type: "normal", category: "normal" },
    { id: "panda", icon: "🐼", name: "Панда", price: 250, type: "normal", category: "normal" },
    { id: "penguin", icon: "🐧", name: "Пингвин", price: 300, type: "normal", category: "normal" },
    { id: "chef", icon: "👨‍🍳", name: "Повар", price: 350, type: "normal", category: "normal" },
    { id: "astronaut", icon: "👩‍🚀", name: "Космонавт", price: 400, type: "normal", category: "normal" },
    { id: "mage", icon: "🧙‍♂️", name: "Маг", price: 450, type: "normal", category: "normal" },
    { id: "hero", icon: "🦸", name: "Герой", price: 500, type: "normal", category: "normal" },
    { id: "elf", icon: "🧝", name: "Эльф", price: 550, type: "normal", category: "normal" },
    { id: "lion", icon: "🦁", name: "Лев", price: 600, type: "normal", category: "normal" },
    { id: "tiger", icon: "🐯", name: "Тигр", price: 650, type: "normal", category: "normal" },
    { id: "monkey", icon: "🐒", name: "Обезьяна", price: 700, type: "normal", category: "normal" },
    { id: "owl", icon: "🦉", name: "Сова", price: 750, type: "normal", category: "normal" },
    { id: "dolphin", icon: "🐬", name: "Дельфин", price: 800, type: "normal", category: "normal" },
    { id: "unicorn", icon: "🦄", name: "Единорог", price: 850, type: "normal", category: "normal" },
    { id: "dragon", icon: "🐉", name: "Дракон", price: 900, type: "normal", category: "normal" },
    { id: "phoenix", icon: "🔥", name: "Феникс", price: 950, type: "normal", category: "normal" },
    { id: "wizard", icon: "🧙", name: "Волшебник", price: 1000, type: "normal", category: "normal" },
    { id: "knight", icon: "⚔️", name: "Рыцарь", price: 1050, type: "normal", category: "normal" },
    { id: "pirate", icon: "🏴‍☠️", name: "Пират", price: 1100, type: "normal", category: "normal" },
    { id: "ninja", icon: "🥷", name: "Ниндзя", price: 1150, type: "normal", category: "normal" },
    { id: "vampire", icon: "🧛", name: "Вампир", price: 1200, type: "normal", category: "normal" },
    { id: "zombie", icon: "🧟", name: "Зомби", price: 1250, type: "normal", category: "normal" },
    { id: "alien", icon: "👽", name: "Инопланетянин", price: 1300, type: "normal", category: "normal" },
    { id: "robot", icon: "🤖", name: "Робот", price: 1350, type: "normal", category: "normal" },
    { id: "ghost", icon: "👻", name: "Призрак", price: 1400, type: "normal", category: "normal" },
    { id: "mermaid", icon: "🧜‍♀️", name: "Русалка", price: 1450, type: "normal", category: "normal" },
    { id: "fairy", icon: "🧚", name: "Фея", price: 1500, type: "normal", category: "normal" }
];

export const RARE_AVATARS = [
    { id: "chef_master", icon: "👨‍🍳", name: "Шеф-повар", condition: "cooking_30", desc: "Приготовить 30 блюд", type: "rare", category: "rare" },
    { id: "runner", icon: "🏃‍♂️", name: "Марафонец", condition: "run_100km", desc: "Пробежать 100 км", type: "rare", category: "rare" },
    { id: "artist", icon: "🎨", name: "Художник", condition: "draw_20", desc: "Нарисовать 20 картин", type: "rare", category: "rare" },
    { id: "photographer", icon: "📸", name: "Фотограф", condition: "photo_50", desc: "Сделать 50 фото", type: "rare", category: "rare" },
    { id: "yogi", icon: "🧘", name: "Йог", condition: "meditate_100", desc: "Помедитировать 100 раз", type: "rare", category: "rare" },
    { id: "musician", icon: "🎸", name: "Музыкант", condition: "guitar_learn", desc: "Научиться играть на гитаре", type: "rare", category: "rare" },
    { id: "traveler", icon: "🗺️", name: "Путешественник", condition: "regions_10", desc: "Посетить 10 регионов", type: "rare", category: "rare" },
    { id: "athlete", icon: "💪", name: "Атлет", condition: "pushups_1000", desc: "Сделать 1000 отжиманий", type: "rare", category: "rare" },
    { id: "bookworm", icon: "📖", name: "Книжный червь", condition: "books_50", desc: "Прочитать 50 книг", type: "rare", category: "rare" },
    { id: "adventurer", icon: "🎯", name: "Авантюрист", condition: "tasks_100", desc: "Выполнить 100 дел", type: "rare", category: "rare" },
    { id: "legend", icon: "👑", name: "Легенда", condition: "tasks_1000", desc: "Выполнить 1000 дел", type: "rare", category: "rare" },
    { id: "nature_keeper", icon: "🌿", name: "Хранитель природы", condition: "nature_50", desc: "50 дел из пакета Природа", type: "rare", category: "rare" },
    { id: "world_traveler", icon: "🌍", name: "Мировой странник", condition: "travel_50", desc: "50 дел из пакета Путешествия", type: "rare", category: "rare" },
    { id: "chef_legend", icon: "🍳", name: "Легенда кулинарии", condition: "cooking_50", desc: "50 дел из пакета Кулинария", type: "rare", category: "rare" },
    { id: "creative_master", icon: "🎭", name: "Мастер творчества", condition: "creative_50", desc: "50 дел из пакета Творчество", type: "rare", category: "rare" },
    { id: "selfdev_guru", icon: "🧠", name: "Гуру саморазвития", condition: "selfdev_50", desc: "50 дел из пакета Саморазвитие", type: "rare", category: "rare" },
    { id: "relationship_expert", icon: "💕", name: "Эксперт отношений", condition: "relationships_50", desc: "50 дел из пакета Отношения", type: "rare", category: "rare" },
    { id: "fishing_master", icon: "🎣", name: "Мастер рыбалки", condition: "fishing_50", desc: "50 дел из пакета Рыбалка", type: "rare", category: "rare" },
    { id: "extreme_hero", icon: "⚡", name: "Герой экстрима", condition: "extreme_50", desc: "50 дел из пакета Экстрим", type: "rare", category: "rare" },
    { id: "challenge_winner", icon: "🏆", name: "Победитель челленджей", condition: "challenges_50", desc: "50 дел из пакета Челленджи", type: "rare", category: "rare" },
    { id: "streak_7", icon: "📅", name: "Недельный стрик", condition: "streak_7", desc: "7 дней подряд", type: "rare", category: "streak" },
    { id: "streak_14", icon: "🔥", name: "Двухнедельный стрик", condition: "streak_14", desc: "14 дней подряд", type: "rare", category: "streak" },
    { id: "streak_30", icon: "⭐", name: "Месячный стрик", condition: "streak_30", desc: "30 дней подряд", type: "rare", category: "streak" },
    { id: "streak_60", icon: "🌟", name: "Двухмесячный стрик", condition: "streak_60", desc: "60 дней подряд", type: "rare", category: "streak" },
    { id: "streak_100", icon: "👑", name: "Стодневный стрик", condition: "streak_100", desc: "100 дней подряд", type: "rare", category: "streak" }
];

export const PREMIUM_AVATARS = [
    { id: "sleeping_cat", icon: "🐱", name: "Спящий кот", price: 2000, animClass: "avatar-sleeping-cat", type: "premium", category: "animated" },
    { id: "running_dog", icon: "🐶", name: "Бегущий пёс", price: 2000, animClass: "avatar-running-dog", type: "premium", category: "animated" },
    { id: "flying_eagle", icon: "🦅", name: "Летящий орёл", price: 2500, animClass: "avatar-flying-eagle", type: "premium", category: "animated" },
    { id: "spinning_penguin", icon: "🐧", name: "Крутящийся пингвин", price: 2500, animClass: "avatar-spinning-penguin", type: "premium", category: "animated" },
    { id: "floating_fairy", icon: "🧚", name: "Летающая фея", price: 3000, animClass: "avatar-floating-fairy", type: "premium", category: "animated" },
    { id: "glowing_dragon", icon: "🐉", name: "Огненный дракон", price: 5000, animClass: "avatar-glowing-dragon", type: "premium", category: "animated" },
    { id: "walking_robot", icon: "🤖", name: "Шагающий робот", price: 3000, animClass: "avatar-walking-robot", type: "premium", category: "animated" },
    { id: "swimming_mermaid", icon: "🧜‍♀️", name: "Плавающая русалка", price: 3500, animClass: "avatar-swimming-mermaid", type: "premium", category: "animated" },
    { id: "dancing_ballerina", icon: "🩰", name: "Танцующая балерина", price: 3000, animClass: "avatar-floating-fairy", type: "premium", category: "animated" },
    { id: "levitating_mage", icon: "🧙", name: "Левитирующий маг", price: 4000, animClass: "avatar-floating-fairy", type: "premium", category: "animated" },
    { id: "cosmic_phoenix", icon: "🔥", name: "Космический феникс", price: 6000, animClass: "avatar-glowing-dragon", type: "premium", category: "animated" }
];

// ============================================================
// РАМКИ
// ============================================================
export const AVAILABLE_FRAMES = [
    { id: "bronze", name: "Бронзовая", price: 200, class: "frame-bronze", type: "normal" },
    { id: "silver", name: "Серебряная", price: 400, class: "frame-silver", type: "normal" },
    { id: "gold", name: "Золотая", price: 600, class: "frame-gold", type: "normal" },
    { id: "diamond", name: "Алмазная", price: 800, class: "frame-diamond", type: "normal" },
    { id: "legendary", name: "Легендарная", price: 1000, class: "frame-legendary", type: "premium" },
    { id: "cosmic", name: "Космическая", price: 1200, class: "frame-cosmic", type: "premium" }
];

// ============================================================
// ФОНЫ
// ============================================================
export const AVAILABLE_BACKGROUNDS = [
    { id: "default", name: "Стандартный", price: 0, class: "" },
    { id: "forest", name: "🌲 Лесной", price: 500, class: "bg-forest" },
    { id: "cosmic", name: "🌌 Космос", price: 1000, class: "bg-cosmic" },
    { id: "ocean", name: "🌊 Океан", price: 800, class: "bg-ocean" },
    { id: "sunset", name: "🌅 Закатный", price: 800, class: "bg-sunset" }
];

// ============================================================
// БУСТЕРЫ
// ============================================================
export const AVAILABLE_BOOSTERS = [
    { id: "xp_boost", name: "⚡ Бустер опыта", desc: "+50% опыта за дела", effect: { type: "xp_multiplier", value: 1.5 }, price: 50, duration: 3600000, icon: "⚡" },
    { id: "coin_boost", name: "💰 Бустер монет", desc: "+50% монет за дела", effect: { type: "coin_multiplier", value: 1.5 }, price: 50, duration: 3600000, icon: "💰" },
    { id: "double_xp", name: "🔥 Двойной опыт", desc: "x2 опыта за дела", effect: { type: "xp_multiplier", value: 2.0 }, price: 100, duration: 3600000, icon: "🔥" },
    { id: "double_coins", name: "💎 Двойные монеты", desc: "x2 монет за дела", effect: { type: "coin_multiplier", value: 2.0 }, price: 100, duration: 3600000, icon: "💎" },
    { id: "penalty_shield", name: "🛡️ Защита от штрафа", desc: "Штраф за просрочку -50%", effect: { type: "penalty_reduction", value: 0.5 }, price: 30, duration: 86400000, icon: "🛡️" },
    { id: "super_boost", name: "🚀 Супер-бустер", desc: "x2 опыт и монеты", effect: { type: "both_multiplier", value: 2.0 }, price: 150, duration: 3600000, icon: "🚀" }
];

// ============================================================
// ЦВЕТА КАТЕГОРИЙ
// ============================================================
export const CATEGORY_COLORS = {
    // ПРИРОДА И ПУТЕШЕСТВИЯ
    "Путешествия по России": "#3B82F6",
    "Транспорт и дороги": "#10B981",
    "Географические точки": "#8B5CF6",
    "Астрономия и космос": "#6366F1",
    "Рыбалка и охота": "#0EA5E9",
    "Гербарий и ботаника": "#22C55E",
    "Садоводство и огород": "#84CC16",
    "Животноводство": "#F97316",
    
    // АКТИВНЫЙ ОБРАЗ ЖИЗНИ
    "Экстрим": "#EF4444",
    "Здоровье и тело": "#14B8A6",
    "Эмоции и впечатления": "#F59E0B",
    "Сон и восстановление": "#8B5CF6",
    "Биохакинг": "#A855F7",
    "Красота и уход": "#F43F5E",
    "Самооборона": "#7C3AED",
    
    // ПРИРОДА, ДОМ, ЕДА
    "Уличная еда": "#F43F5E",
    "Кулинария": "#EC4899",
    "Дом и быт": "#A855F7",
    "Гостеприимство": "#FBBF24",
    
    // ЛЮДИ И ПОМОЩЬ
    "Отношения и любовь": "#FB7185",
    "Волонтёрство": "#2DD4BF",
    "Благотворительность": "#F472B6",
    "Письма": "#A78BFA",
    
    // УМ, ТВОРЧЕСТВО, НАВЫКИ
    "Навыки и саморазвитие": "#38BDF8",
    "Обучение и курсы": "#4ADE80",
    "Творчество": "#C084FC",
    "Искусство": "#E879F9",
    "Фотография": "#FDE047",
    "Коллекционирование": "#FDBA74",
    "Городские исследования": "#94A3B8",
    
    // ВНУТРЕННИЙ МИР
    "Психология": "#06B6D4",
    "Религия и духовное": "#D946EF",
    "Челленджи": "#F97316",
    "Один раз в жизни": "#EAB308",
    "Странные дела": "#D4D4D8",
    
    // ДЕНЬГИ, РАБОТА, ТЕХНОЛОГИИ
    "Финансы": "#2DD4BF",
    "Работа и карьера": "#34D399",
    "Цифровая гигиена": "#60A5FA",
    "Экология": "#4ADE80",
    "Медиа и информация": "#818CF8",
    
    // ДОПОЛНИТЕЛЬНЫЕ
    "Срочное": "#EF4444",
    "Случайное дело": "#8B5CF6"
};

// ============================================================
// ИКОНКИ КАТЕГОРИЙ
// ============================================================
export function getCategoryIcon(category) {
    const icons = {
        // ПРИРОДА И ПУТЕШЕСТВИЯ
        "Путешествия по России": "🏔️",
        "Транспорт и дороги": "🚗",
        "Географические точки": "📍",
        "Астрономия и космос": "🌙",
        "Рыбалка и охота": "🎣",
        "Гербарий и ботаника": "🌿",
        "Садоводство и огород": "🌱",
        "Животноводство": "🐄",
        
        // АКТИВНЫЙ ОБРАЗ ЖИЗНИ
        "Экстрим": "🧗",
        "Здоровье и тело": "💪",
        "Эмоции и впечатления": "🎢",
        "Сон и восстановление": "😴",
        "Биохакинг": "🧬",
        "Красота и уход": "💄",
        "Самооборона": "🥋",
        
        // ПРИРОДА, ДОМ, ЕДА
        "Уличная еда": "🌭",
        "Кулинария": "🍳",
        "Дом и быт": "🏠",
        "Гостеприимство": "🍷",
        
        // ЛЮДИ И ПОМОЩЬ
        "Отношения и любовь": "💕",
        "Волонтёрство": "🤝",
        "Благотворительность": "🎁",
        "Письма": "✉️",
        
        // УМ, ТВОРЧЕСТВО, НАВЫКИ
        "Навыки и саморазвитие": "📚",
        "Обучение и курсы": "🎓",
        "Творчество": "🎨",
        "Искусство": "🖼️",
        "Фотография": "📸",
        "Коллекционирование": "🪙",
        "Городские исследования": "🏙️",
        
        // ВНУТРЕННИЙ МИР
        "Психология": "🧠",
        "Религия и духовное": "🙏",
        "Челленджи": "🏆",
        "Один раз в жизни": "✨",
        "Странные дела": "🤪",
        
        // ДЕНЬГИ, РАБОТА, ТЕХНОЛОГИИ
        "Финансы": "💰",
        "Работа и карьера": "💼",
        "Цифровая гигиена": "🔐",
        "Экология": "♻️",
        "Медиа и информация": "📱"
    };
    return icons[category] || "📌";
}

// ============================================================
// ПОЛУЧЕНИЕ ЦВЕТА КАТЕГОРИИ
// ============================================================
export function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || "#6B7280";
}

// ============================================================
// СЛУЧАЙНЫЕ ДЕЛА ДЛЯ РУЛЕТКИ
// ============================================================
export const RANDOM_QUESTS = [
    { id: 1, text: "🏃‍♂️ Сделать 5000 шагов", reward: 40, xp: 15 },
    { id: 2, text: "📖 Прочитать 20 страниц книги", reward: 35, xp: 10 },
    { id: 3, text: "💧 Выпить 2 литра воды", reward: 30, xp: 10 },
    { id: 4, text: "📸 Сфотографировать закат", reward: 45, xp: 15 },
    { id: 5, text: "🎵 Послушать новый альбом", reward: 35, xp: 10 },
    { id: 6, text: "☕ Приготовить завтрак", reward: 40, xp: 10 },
    { id: 7, text: "🧘 Помедитировать 10 минут", reward: 45, xp: 15 },
    { id: 8, text: "📝 Написать список дел на день", reward: 30, xp: 5 },
    { id: 9, text: "🚿 Принять контрастный душ", reward: 35, xp: 10 },
    { id: 10, text: "📞 Позвонить родным", reward: 50, xp: 15 },
    { id: 11, text: "🏋️‍♂️ Сделать 50 отжиманий", reward: 70, xp: 20 },
    { id: 12, text: "🍳 Приготовить ужин с нуля", reward: 80, xp: 25 },
    { id: 13, text: "📺 Посмотреть документальный фильм", reward: 65, xp: 20 },
    { id: 14, text: "🎨 Нарисовать рисунок", reward: 75, xp: 25 },
    { id: 15, text: "🏃‍♂️ Пробежать 5 км", reward: 120, xp: 40 },
    { id: 16, text: "🍰 Испечь пирог", reward: 130, xp: 45 },
    { id: 17, text: "📝 Написать пост в блог", reward: 110, xp: 35 },
    { id: 18, text: "🎬 Смонтировать видео", reward: 140, xp: 50 },
    { id: 19, text: "🗺️ Спланировать путешествие", reward: 100, xp: 30 },
    { id: 20, text: "🧘 Провести час без телефона", reward: 120, xp: 40 },
    { id: 21, text: "🎸 Научиться аккорду на гитаре", reward: 90, xp: 30 },
    { id: 22, text: "💰 Отложить деньги в копилку", reward: 65, xp: 15 },
    { id: 23, text: "🚶‍♀️ Прогуляться 60 минут", reward: 60, xp: 15 },
    { id: 24, text: "🧹 Сделать уборку", reward: 60, xp: 15 },
    { id: 25, text: "📚 Прочитать 50 страниц", reward: 80, xp: 25 },
    { id: 26, text: "🎲 Сыграть в настольную игру", reward: 70, xp: 20 },
    { id: 27, text: "🧘 Сходить на йогу", reward: 85, xp: 25 },
    { id: 28, text: "🎨 Посетить выставку", reward: 80, xp: 25 },
    { id: 29, text: "🍰 Испечь печенье", reward: 75, xp: 20 },
    { id: 30, text: "🧵 Связать что-то", reward: 90, xp: 30 },
    { id: 31, text: "🎯 Выполнить 5 дел из списка", reward: 100, xp: 35 },
    { id: 32, text: "🌿 Посадить растение", reward: 70, xp: 20 },
    { id: 33, text: "📸 Сделать портрет друга", reward: 85, xp: 25 },
    { id: 34, text: "🎵 Написать песню", reward: 120, xp: 40 },
    { id: 35, text: "🧘 Провести день в осознанности", reward: 150, xp: 50 }
];

// ============================================================
// ПИТОМЦЫ
// ============================================================

export const BASIC_PETS = [
    { 
        id: "hamster", 
        name: "Хомяк", 
        icon: "🐹", 
        price: 0, 
        isFree: true,
        baseStats: { hunger: 80, mood: 70, health: 90, cleanliness: 75 },
        personality: "Неприхотливый",
        specialAbility: "Запасливый",
        abilityDesc: "Раз в день даёт 5 монет"
    },
    { 
        id: "cat", 
        name: "Кот", 
        icon: "🐱", 
        price: 150, 
        isFree: false,
        baseStats: { hunger: 80, mood: 70, health: 90, cleanliness: 75 },
        personality: "Независимый",
        specialAbility: "Мурлыка",
        abilityDesc: "+10% к восстановлению настроения"
    },
    { 
        id: "rabbit", 
        name: "Кролик", 
        icon: "🐰", 
        price: 180, 
        isFree: false,
        baseStats: { hunger: 80, mood: 70, health: 90, cleanliness: 85 },
        personality: "Чистоплотный",
        specialAbility: "Быстрый",
        abilityDesc: "-10% к длительности дедлайнов"
    },
    { 
        id: "dog", 
        name: "Пёс", 
        icon: "🐶", 
        price: 200, 
        isFree: false,
        baseStats: { hunger: 85, mood: 75, health: 85, cleanliness: 70 },
        personality: "Энергичный",
        specialAbility: "Охранник",
        abilityDesc: "Напоминает о просроченных делах"
    },
    { 
        id: "parrot", 
        name: "Попугай", 
        icon: "🦜", 
        price: 250, 
        isFree: false,
        baseStats: { hunger: 75, mood: 80, health: 80, cleanliness: 75 },
        personality: "Общительный",
        specialAbility: "Повторюша",
        abilityDesc: "Повторяет одно дело в день"
    }
];

export const PREMIUM_PETS = [
    { 
        id: "fennec", 
        name: "Фенек", 
        icon: "🦊", 
        price: 1500, 
        isFree: false,
        baseStats: { hunger: 80, mood: 75, health: 85, cleanliness: 80 },
        personality: "Ночной охотник",
        specialAbility: "Ночной охотник",
        abilityDesc: "+15% монет за дела, выполненные ночью (20:00 - 06:00)",
        type: "premium",
        lottieUrl: "assets/pets/lottie/fennec_idle.json"
    },
    { 
        id: "phoenix", 
        name: "Феникс", 
        icon: "🔥", 
        price: 2000, 
        isFree: false,
        baseStats: { hunger: 85, mood: 80, health: 95, cleanliness: 85 },
        personality: "Бессмертный",
        specialAbility: "Возрождение",
        abilityDesc: "Один раз воскресает бесплатно",
        type: "premium",
        lottieUrl: "assets/pets/lottie/phoenix_idle.json"
    },
    { 
        id: "dragon", 
        name: "Дракон", 
        icon: "🐉", 
        price: 3000, 
        isFree: false,
        baseStats: { hunger: 90, mood: 85, health: 100, cleanliness: 80 },
        personality: "Могущественный",
        specialAbility: "Огненное дыхание",
        abilityDesc: "+20% к наградам за эпические дела",
        type: "premium",
        lottieUrl: "assets/pets/lottie/dragon_idle.json"
    },
    { 
        id: "unicorn", 
        name: "Единорог", 
        icon: "🦄", 
        price: 2500, 
        isFree: false,
        baseStats: { hunger: 85, mood: 95, health: 90, cleanliness: 90 },
        personality: "Чистый",
        specialAbility: "Магия удачи",
        abilityDesc: "Раз в день даёт случайный бустер",
        type: "premium",
        lottieUrl: "assets/pets/lottie/unicorn_idle.json"
    }
];

// ============================================================
// ПРЕДМЕТЫ ДЛЯ ПИТОМЦЕВ
// ============================================================

export const PET_ITEMS = {
    food: [
        { id: "cheap_food", name: "Обычный корм", icon: "🍚", price: 10, restore: { hunger: 20 }, desc: "Голод +20%" },
        { id: "good_food", name: "Вкусный корм", icon: "🍗", price: 25, restore: { hunger: 40, mood: 10 }, desc: "Голод +40%, настроение +10%" },
        { id: "premium_food", name: "Деликатес", icon: "🍣", price: 50, restore: { hunger: 60, mood: 20, health: 5 }, desc: "Голод +60%, настроение +20%, здоровье +5%" },
        { id: "gourmet_food", name: "Гурманский корм", icon: "🥩", price: 80, restore: { hunger: 80, mood: 30, health: 10 }, desc: "Голод +80%, настроение +30%, здоровье +10%" }
    ],
    toys: [
        { id: "ball", name: "Мячик", icon: "⚽", price: 15, restore: { mood: 20 }, desc: "Настроение +20%" },
        { id: "bone", name: "Кость", icon: "🦴", price: 20, restore: { mood: 30, hunger: -5 }, desc: "Настроение +30%, голод -5%" },
        { id: "laser", name: "Лазер", icon: "🔦", price: 40, restore: { mood: 50, hunger: -10 }, desc: "Настроение +50%, голод -10%" },
        { id: "interactive_toy", name: "Интерактивная игрушка", icon: "🎮", price: 60, restore: { mood: 70, hunger: -5 }, desc: "Настроение +70%, голод -5%" }
    ],
    hygiene: [
        { id: "brush", name: "Щётка", icon: "🪥", price: 12, restore: { cleanliness: 25 }, desc: "Чистота +25%" },
        { id: "shampoo", name: "Шампунь", icon: "🧴", price: 30, restore: { cleanliness: 50, mood: 10 }, desc: "Чистота +50%, настроение +10%" },
        { id: "spa", name: "СПА", icon: "🛁", price: 60, restore: { cleanliness: 80, mood: 20, health: 10 }, desc: "Чистота +80%, настроение +20%, здоровье +10%" }
    ],
    medicine: [
        { id: "vitamins", name: "Витамины", icon: "💊", price: 20, restore: { health: 20 }, desc: "Здоровье +20%" },
        { id: "first_aid", name: "Аптечка", icon: "🩹", price: 45, restore: { health: 45, mood: 10 }, desc: "Здоровье +45%, настроение +10%" },
        { id: "elixir", name: "Эликсир", icon: "🧪", price: 100, restore: { health: 100, hunger: 20, mood: 20 }, desc: "Полное восстановление здоровья" }
    ]
};

// ============================================================
// КОМНАТЫ ДЛЯ ПИТОМЦА
// ============================================================

export const PET_ROOMS = [
    { id: "basic_room", name: "Обычная", icon: "🏠", price: 0, bonus: { type: null, value: 0 }, desc: "Стандартная комната" },
    { id: "cozy_room", name: "Уютная", icon: "🛋️", price: 300, bonus: { type: "mood", value: 5 }, desc: "+5% к восстановлению настроения" },
    { id: "forest_room", name: "Лесная поляна", icon: "🌲", price: 500, bonus: { type: "health", value: 5 }, desc: "+5% к здоровью" },
    { id: "luxury_room", name: "Люкс", icon: "🏰", price: 800, bonus: { type: "all", value: 10 }, desc: "+10% ко всем восстановлениям" },
    { id: "space_room", name: "Космос", icon: "🚀", price: 1000, bonus: { type: "xp", value: 10 }, desc: "+10% к опыту от дел" },
    { id: "underwater_room", name: "Подводный мир", icon: "🌊", price: 1200, bonus: { type: "all", value: 15 }, desc: "+15% ко всем восстановлениям" }
];

// ============================================================
// УРОВНИ ПИТОМЦА
// ============================================================

export const PET_LEVELS = [
    { level: 1, xpNeeded: 0, bonus: 0, reward: 0 },
    { level: 2, xpNeeded: 100, bonus: 2, reward: 50 },
    { level: 3, xpNeeded: 300, bonus: 5, reward: 100 },
    { level: 4, xpNeeded: 600, bonus: 10, reward: 150 },
    { level: 5, xpNeeded: 1000, bonus: 15, reward: 200 }
];

// ============================================================
// ПОРОГИ ПОБЕГА ПИТОМЦА
// ============================================================

export const PET_ESCAPE_THRESHOLDS = {
    hunger: 10,
    health: 5,
    cleanliness: 8
};

export const PET_DECAY_RATES = {
    hunger: 5,
    mood: 3,
    cleanliness: 2
};

export const PET_RETURN_COST = 300;
export const PET_FREE_AFTER_DAYS = 3;

// ============================================================
// ИМЕНА ПАКЕТОВ ДЛЯ ОТОБРАЖЕНИЯ
// ============================================================

export const PACKAGE_NAMES = {
    'core': 'Базовый',
    'travel': '🌍 Путешествия',
    'health': '💪 Спорт и здоровье',
    'cooking': '🍳 Кулинария',
    'nature': '🌿 Природа',
    'creative': '🎨 Творчество',
    'selfdev': '🧠 Саморазвитие',
    'relationships': '💕 Отношения',
    'fishing': '🎣 Рыбалка и охота',
    'extreme': '⚡ Экстрим',
    'challenges': '🎯 Челленджи'
};

export function getPackageName(packageId) {
    return PACKAGE_NAMES[packageId] || packageId;
}