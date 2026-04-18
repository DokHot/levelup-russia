// js/about.js
// ============================================================
// О ПРОЕКТЕ — ИСТОРИЯ ВЕРСИЙ, РАЗРАБОТЧИК, ПЛАН РАЗВИТИЯ (версия 7.6)
// ============================================================

/**
 * Рендер страницы "О проекте"
 */
export function renderAbout() {
    const container = document.getElementById('aboutView');
    if (!container) return;
    
    const currentVersion = '7.6';
    const currentVersionDate = '19 апреля 2026';
    
    // Информация о разработчике
    const developer = {
        name: 'InShiro',
        role: 'Идейный вдохновитель и разработчик',
        telegram: '@inshiro',
        email: 'inshiro@example.com',
        github: 'https://github.com/DokHot'
    };
    
    // Реальная история создания
    const projectStory = {
        startDate: '14 апреля 2026',
        daysInDevelopment: 6,
        aiAssistant: 'DeepSeek (ИИ-ассистент)',
        developer: 'InShiro'
    };
    
    const versionHistory = [
        {
            version: '7.6',
            date: '19 апреля 2026',
            title: 'Облачная регистрация и синхронизация',
            changes: [
                '🔐 Полная система регистрации и входа через Supabase',
                '👤 Гостевой режим без регистрации',
                '📧 Восстановление пароля через email',
                '☁️ Автоматическая синхронизация прогресса между устройствами',
                '🏅 Порядковый номер игрока (#42 из 1000+)',
                '🚪 Кнопка выхода из аккаунта в профиле',
                '🔄 Импорт гостевого прогресса при регистрации',
                '📊 Отображение общего количества игроков',
                '🔒 Уникальность имени пользователя'
            ]
        },
        {
            version: '7.5',
            date: '18 апреля 2026',
            title: 'Оптимизация + Облачное хранилище фото',
            changes: [
                '⚡ Виртуальная прокрутка магазина (1000+ дел без фризов)',
                '🚀 Ленивая загрузка модулей (ускорение в 2 раза)',
                '📸 Облачное хранилище фото (Google Drive, Яндекс.Диск, S3)',
                '🔄 Фоновая синхронизация между устройствами',
                '💾 IndexedDB кэш для фото (офлайн-доступ)',
                '🎯 Debounce/Throttle для фильтров и поиска',
                '📦 Service Worker для PWA и офлайн-режима',
                '🔧 Сжатие фото перед загрузкой (до 500 КБ)',
                '📊 Оптимизация памяти (RAM < 40 МБ)',
                '👤 Кнопка синхронизации в профиле',
                '☁️ Настройки облачного хранилища'
            ]
        },
        {
            version: '7.4',
            date: '17-18 апреля 2026',
            title: 'Социальная честность',
            changes: [
                '👥 Друзья (добавление/удаление, заявки)',
                '🎁 Подарки друзьям (монеты, предметы)',
                '🏆 Таблица лидеров (5 категорий)',
                '🔍 Поиск игроков',
                '👤 Публичные профили',
                '⭐ Система доверия (5 уровней)',
                '📸 Бонусы за фото-подтверждение',
                '📍 Геолокация для географических дел',
                '📜 Страница "О проекте" с историей версий'
            ]
        },
        {
            version: '7.1.2',
            date: '17 апреля 2026',
            title: 'Профиль и настройки',
            changes: [
                '👤 Система профиля (имя, ID, стрик входов)',
                '💾 Экспорт/импорт прогресса',
                '🎨 8 готовых тем оформления',
                '🎨 Индивидуальная настройка цветов',
                '🏆 Три вкладки достижений (простые, категорийные, скрытые)',
                '❓ Скрытые достижения (50 шт.)',
                '🌙 Учёт ночных дел'
            ]
        },
        {
            version: '7.2',
            date: '17 апреля 2026',
            title: 'Премиум друг',
            changes: [
                '💎 2 премиум-питомца (Фенек, Феникс)',
                '🌙 Способность Фенека: +15% монет ночью',
                '🔥 Способность Феникса: 1 бесплатное воскрешение',
                '🏰 2 новые комнаты (Люкс, Космос)',
                '🎬 Lottie-анимации (с заглушками)',
                '🏆 6 новых достижений'
            ]
        },
        {
            version: '7.1.1',
            date: '16 апреля 2026',
            title: 'Полировка и удобство',
            changes: [
                '🎨 Светлый фон карточек питомца',
                '⚡ Кнопка быстрого пополнения предметов',
                '🔄 Клик по карточке в магазине = переворот',
                '📏 Анимация увеличения карточек',
                '🟢🔴 Цветовая индикация в истории',
                '🏠 Светлые карточки комнат'
            ]
        },
        {
            version: '7.1',
            date: '16 апреля 2026',
            title: 'Верный друг — питомцы Тамагочи',
            changes: [
                '🐹 5 базовых питомцев (хомяк бесплатно)',
                '📊 4 шкалы состояния (голод, настроение, здоровье, чистота)',
                '🍖 Действия ухода (корм, игра, мытьё, лечение)',
                '🏃 Побег и возвращение за монеты',
                '🔗 Связь с делами (бонусы от питомца)',
                '📈 Уровни питомца 1-5 с особыми способностями',
                '🏠 3 комнаты для питомца',
                '🏆 6 достижений питомца'
            ]
        },
        {
            version: '7.0',
            date: '16 апреля 2026',
            title: 'Фундамент для расширения',
            changes: [
                '🎮 Полноценная RPG-система',
                '📋 1000+ дел',
                '📈 20 уровней',
                '⚡ Бустеры, ачивки, календарь, карта, фото',
                '🏗️ Готовая модульная архитектура',
                '🐾 Готовность к добавлению питомцев (7.1)',
                '👥 Готовность к социальным функциям (7.4)'
            ]
        },
        {
            version: '6.2',
            date: '16 апреля 2026',
            title: 'Достижения и секреты',
            changes: [
                '🔐 50 скрытых достижений',
                '🏆 10 категорийных достижений (4 уровня)',
                '🌙 Учёт ночных/утренних дел',
                '🎲 Генерация секретных ачивок'
            ]
        },
        {
            version: '6.1',
            date: '15 апреля 2026',
            title: 'Улучшение UI',
            changes: [
                '🌙 Тёмная тема',
                '✨ Анимации (confetti, fade-in)',
                '🎴 Улучшенные карточки магазина',
                '🔄 Рефакторинг на модули (ES6 imports)'
            ]
        },
        {
            version: '6.0',
            date: '15 апреля 2026',
            title: 'Рандом и кастомизация',
            changes: [
                '🎡 Рулетка (случайные дела)',
                '👤 Аватарки (обычные, премиум, редкие)',
                '🖼️ Рамки для аватарок',
                '🌲 Фоны (лесной, космический)',
                '⚡ Бустеры (временные усиления)'
            ]
        },
        {
            version: '5.0',
            date: '15 апреля 2026',
            title: 'Мультимедиа и карта',
            changes: [
                '📸 Фото к делам (галерея)',
                '🗺️ Яндекс.Карты с метками',
                '📍 Геолокация',
                '⚡ Срочные дела (таймер)'
            ]
        },
        {
            version: '4.0',
            date: '14 апреля 2026',
            title: 'Визуализация и прогресс',
            changes: [
                '📊 Прогресс-бары',
                '📈 Статистика на главной',
                '📅 Календарь достижений',
                '🏆 Ачивки (первые версии)'
            ]
        },
        {
            version: '3.0',
            date: '14 апреля 2026',
            title: 'Дедлайны и сложность',
            changes: [
                '⏰ Выбор срока выполнения (1, 3, 7, 14, 30 дней)',
                '⚠️ Штрафы за просрочку',
                '⭐ Сложность дел (1-5 звёзд)',
                '🏷️ Фильтрация по категориям'
            ]
        },
        {
            version: '2.0',
            date: '14 апреля 2026',
            title: 'Экономика и уровни',
            changes: [
                '💰 Система монет и опыта',
                '📈 Уровни игрока (1-20)',
                '🛒 Магазин дел (покупка заданий за монеты)'
            ]
        },
        {
            version: '1.0',
            date: '14 апреля 2026',
            title: 'MVP — Минимально жизнеспособный продукт',
            changes: [
                '📋 Простой список дел',
                '✅ Ручное отмечание выполнения (чекбоксы)',
                '💾 Локальное хранение в localStorage',
                '🏗️ Базовая структура HTML'
            ]
        }
    ];
    
    const futurePlans = [
        {
            version: '7.7',
            title: 'Социальное взаимодействие',
            features: [
                '💬 Личные сообщения между игроками',
                '✅ Система подтверждения выполнения дел друзьями',
                '🔔 Push-уведомления о событиях',
                '🎁 Ежедневные подарки и бонусы'
            ]
        },
        {
            version: '7.8',
            title: 'Соревнования и экономика',
            features: [
                '⚔️ Дуэли питомцев',
                '🏅 Еженедельные турниры',
                '🎫 Ежедневный магазин со скидками',
                '🎰 Лутбоксы с редкими предметами',
                '🏆 Battle Pass (сезонный)'
            ]
        },
        {
            version: '8.0',
            title: 'Релиз на Android',
            features: [
                '📱 PWA (установка на телефон)',
                '🤖 Сборка Android APK',
                '☁️ Полная облачная синхронизация',
                '🔔 Push-уведомления'
            ]
        }
    ];
    
    let historyHtml = '';
    for (const v of versionHistory) {
        historyHtml += `
            <div class="border-l-4 border-green-500 pl-4 mb-6">
                <div class="flex justify-between items-start flex-wrap gap-2">
                    <h3 class="text-lg font-bold">Версия ${v.version} — ${v.title}</h3>
                    <span class="text-xs text-gray-500">${v.date}</span>
                </div>
                <ul class="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    ${v.changes.map(change => `<li>${change}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    let futureHtml = '';
    for (const plan of futurePlans) {
        futureHtml += `
            <div class="border-l-4 border-purple-500 pl-4 mb-6">
                <h3 class="text-lg font-bold">${plan.version} — ${plan.title}</h3>
                <ul class="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    ${plan.features.map(f => `<li>✨ ${f}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    let html = `
        <div class="max-w-3xl mx-auto">
            <!-- Текущая версия -->
            <div class="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-6 text-white mb-8">
                <div class="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <span class="text-sm opacity-80">Текущая версия</span>
                        <h2 class="text-3xl font-bold">${currentVersion}</h2>
                        <p class="text-sm opacity-80 mt-1">от ${currentVersionDate}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-sm opacity-80">⚡ Оптимизация</div>
                        <div class="text-sm opacity-80">☁️ Облачная синхронизация</div>
                        <div class="text-sm opacity-80">🔐 Регистрация и вход</div>
                        <div class="text-sm opacity-80">🐾 7 питомцев</div>
                    </div>
                </div>
                <p class="mt-4 text-white/90">
                    «1000 возможностей России» — это RPG-трекер, превращающий выполнение реальных дел в увлекательную игру.
                    Покупайте задания, заботьтесь о питомце, соревнуйтесь с друзьями и исследуйте Россию!
                </p>
            </div>
            
            <!-- Разработчик -->
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-8">
                <div class="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <span class="text-sm opacity-80">👨‍💻 Разработчик</span>
                        <h2 class="text-3xl font-bold">${developer.name}</h2>
                        <p class="text-sm opacity-80 mt-1">${developer.role}</p>
                    </div>
                    <div class="text-right">
                        <div class="flex gap-2">
                            <a href="${developer.github}" target="_blank" class="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">
                                <i class="fab fa-github"></i>
                            </a>
                            <a href="https://t.me/${developer.telegram.replace('@', '')}" target="_blank" class="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">
                                <i class="fab fa-telegram"></i>
                            </a>
                            <a href="mailto:${developer.email}" class="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">
                                <i class="fas fa-envelope"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <p class="mt-4 text-white/90 text-sm">
                    Проект создан и поддерживается <strong>InShiro</strong>. Вся обратная связь и предложения приветствуются!
                </p>
            </div>
            
            <!-- История создания -->
            <div class="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white mb-8">
                <div class="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <span class="text-sm opacity-80">🚀 История создания</span>
                        <h2 class="text-2xl font-bold mt-1">${projectStory.daysInDevelopment} дней на разработку</h2>
                        <p class="text-sm opacity-80 mt-1">с ${projectStory.startDate}</p>
                    </div>
                    <div class="text-right">
                        <div class="text-sm opacity-80">🤖 ИИ-ассистент: ${projectStory.aiAssistant}</div>
                        <div class="text-sm opacity-80">👨‍💻 Разработчик: ${projectStory.developer}</div>
                    </div>
                </div>
                <p class="mt-4 text-white/90 text-sm">
                    Проект прошёл путь от простого списка дел до полноценной RPG-экосистемы за ${projectStory.daysInDevelopment} дней.
                    Каждая версия добавляла новые механики, улучшала интерфейс и расширяла возможности игры.
                    Особая благодарность искусственному интеллекту DeepSeek за неоценимую помощь в разработке.
                </p>
            </div>
            
            <!-- История версий -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <span class="text-2xl">📜</span> История версий
                </h2>
                <div class="max-h-[500px] overflow-y-auto pr-2 space-y-2">
                    ${historyHtml}
                </div>
            </div>
            
            <!-- План развития -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <span class="text-2xl">🚀</span> План развития
                </h2>
                ${futureHtml}
            </div>
            
            <!-- Технологии -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <span class="text-2xl">🛠️</span> Технологии
                </h2>
                <div class="flex flex-wrap gap-2">
                    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-sm">HTML5</span>
                    <span class="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-sm">CSS3 + Tailwind</span>
                    <span class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full text-sm">JavaScript (ES6 Modules)</span>
                    <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-sm">localStorage</span>
                    <span class="px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full text-sm">Яндекс.Карты API</span>
                    <span class="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 rounded-full text-sm">Lottie-анимации</span>
                    <span class="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-sm">IndexedDB</span>
                    <span class="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 rounded-full text-sm">Service Worker</span>
                    <span class="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full text-sm">Supabase (Auth + Database)</span>
                </div>
            </div>
            
            <!-- Статистика проекта -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <span class="text-2xl">📊</span> Статистика проекта
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <div class="text-2xl font-bold text-green-600">16</div>
                        <div class="text-xs text-gray-500">версий</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-blue-600">1000+</div>
                        <div class="text-xs text-gray-500">дел</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-yellow-600">90+</div>
                        <div class="text-xs text-gray-500">достижений</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-purple-600">8</div>
                        <div class="text-xs text-gray-500">тем оформления</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-orange-600">20</div>
                        <div class="text-xs text-gray-500">уровней игрока</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-red-600">7</div>
                        <div class="text-xs text-gray-500">питомцев</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-indigo-600">35+</div>
                        <div class="text-xs text-gray-500">JS модулей</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-teal-600">4</div>
                        <div class="text-xs text-gray-500">облачных провайдера</div>
                    </div>
                </div>
            </div>
            
            <!-- О проекте -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <span class="text-2xl">👥</span> О проекте
                </h2>
                <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                        <strong>«1000 возможностей России»</strong> — это уникальный трекер-игра, 
                        который мотивирует вас исследовать свою страну, развиваться и заботиться 
                        о виртуальном питомце, выполняя реальные дела.
                    </p>
                    <p>
                        🎯 <strong>Цель проекта:</strong> превратить список желаний и целей в увлекательную RPG, 
                        где каждое выполненное дело приносит награду и приближает к новым достижениям.
                    </p>
                    <p>
                        💡 <strong>Идея:</strong> объединить геймификацию, социальное взаимодействие 
                        и систему честности (подтверждение выполнения через друзей и фото).
                    </p>
                    <p>
                        📈 <strong>Эволюция:</strong> от простого чек-листа до полноценной социальной RPG с 
                        питомцами, достижениями, таблицей лидеров, облачным хранилищем, системой доверия
                        и полноценной регистрацией пользователей.
                    </p>
                </div>
            </div>
            
            <!-- Благодарности -->
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-8">
                <h2 class="text-xl font-bold mb-2 flex items-center gap-2">
                    <span class="text-2xl">🙏</span> Благодарности
                </h2>
                <p class="text-sm text-white/90">
                    Особенная благодарность <strong>DeepSeek</strong> — искусственному интеллекту, 
                    который помог реализовать этот проект за рекордные ${projectStory.daysInDevelopment} дней. 
                    От идеи до полноценной RPG-экосистемы с питомцами, социальными функциями, облачным хранилищем, 
                    регистрацией пользователей и сотнями заданий.
                </p>
                <p class="text-sm text-white/80 mt-3">
                    🤖 DeepSeek — это не просто помощник, а полноценный соавтор, 
                    который писал код, проектировал архитектуру, отлаживал ошибки и предлагал идеи.
                </p>
                <p class="text-sm text-white/80 mt-3">
                    📊 <strong>Вехи развития:</strong> 16 версий, 6 дней разработки, 
                    полный цикл от MVP до социальной RPG-экосистемы с облачной синхронизацией.
                </p>
            </div>
            
            <!-- Контакты и обратная связь -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <span class="text-2xl">📧</span> Обратная связь
                </h2>
                <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                        Нашли баг или есть предложения по улучшению?<br>
                        Проект активно развивается, и каждый фидбек важен!
                    </p>
                    <div class="flex gap-3 mt-4">
                        <button id="reportBugBtn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-sm transition">
                            🐛 Сообщить о баге
                        </button>
                        <button id="suggestFeatureBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm transition">
                            💡 Предложить идею
                        </button>
                        <a href="https://t.me/inshiro" target="_blank" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm transition flex items-center gap-2">
                            <i class="fab fa-telegram"></i> Telegram
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Обработчики кнопок
    document.getElementById('reportBugBtn')?.addEventListener('click', () => {
        alert('📧 Свяжитесь с разработчиком:\nTelegram: @inshiro\nEmail: inshiro@example.com\n\nСпасибо за обратную связь!');
    });
    
    document.getElementById('suggestFeatureBtn')?.addEventListener('click', () => {
        alert('💡 Идеи можно отправить разработчику:\nTelegram: @inshiro\nEmail: inshiro@example.com\n\nСпасибо за ваши предложения!');
    });
}