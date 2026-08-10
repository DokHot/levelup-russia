// js/about.js
// ============================================================
// О ПРОЕКТЕ — ИСТОРИЯ ВЕРСИЙ, РАЗРАБОТЧИК, ПЛАН РАЗВИТИЯ
// Версия 0.8.1
// ============================================================

export function renderAbout() {
    const container = document.getElementById('aboutView');
    if (!container) return;

    const versionHistory = [
        {
            version: '0.8.1',
            date: '12 июля 2026',
            title: '🎯 Финальная полировка',
            changes: [
                '🐛 Исправлена ошибка загрузки базовых дел',
                '📦 Восстановлена работа сборников (пакетов) дел',
                '🎨 Оптимизирована светлая и тёмная темы',
                '📊 Исправлена статистика — теперь показывает только активные пакеты',
                '🔄 Улучшена система синхронизации данных',
                '⚡ Ускорена загрузка страницы'
            ]
        },
        {
            version: '0.8',
            date: '12 июля 2026',
            title: '🎯 Ребрендинг и система сборников',
            changes: [
                '🎯 Ребрендинг: «1000 возможностей России» → «Жизнь в делах»',
                '📦 Система сборников (пакетов) дел',
                '🌿 Сезонные сборники: Лето, Осень, Зима, Весна',
                '🎯 Тематические сборники: Путешествия, Здоровье, Карьера',
                '📋 Новая структура: 5 вкладок вместо 14',
                '🎨 Светлое оформление по умолчанию',
                '➕ Возможность добавлять свои дела через интерфейс',
                '📥 Быстрый импорт дел из текста',
                '📊 Новая вкладка «Статистика»',
                '🏠 Вкладка «Мои дела» — объединяет магазин, активные и историю',
                '🔧 Полноценная вкладка «Настройки»',
                '☁️ Синхронизация через Supabase',
                '📦 Экспорт/импорт данных с поддержкой сборников',
                '🎨 8 тем оформления',
                '🌲 3 фона (стандартный, лесной, космос)',
                '🐾 Питомец (Tamagotchi) с 7 питомцами',
                '⚡ Бустеры (временные усиления)',
                '🏆 Достижения (простые, категорийные, скрытые)',
                '📅 Календарь достижений с ежедневными наградами',
                '🎡 Рулетка (случайные дела)',
                '⚠️ Срочные дела с таймером',
                '📸 Фото к делам и галерея',
                '🗺️ Яндекс.Карты с метками',
                '👥 Социальные функции (друзья, рейтинг, подарки)'
            ]
        },
        {
            version: '7.6',
            date: '19 апреля 2026',
            title: '🔐 Облачная регистрация и синхронизация',
            changes: [
                '🔐 Полная система регистрации и входа через Supabase',
                '👤 Гостевой режим без регистрации',
                '📧 Восстановление пароля через email',
                '☁️ Автоматическая синхронизация прогресса между устройствами',
                '🏅 Порядковый номер игрока',
                '🚪 Кнопка выхода из аккаунта в профиле',
                '🔄 Импорт гостевого прогресса при регистрации',
                '📊 Отображение общего количества игроков',
                '🔒 Уникальность имени пользователя'
            ]
        },
        {
            version: '7.5',
            date: '18 апреля 2026',
            title: '⚡ Оптимизация + Облачное хранилище фото',
            changes: [
                '⚡ Виртуальная прокрутка магазина',
                '🚀 Ленивая загрузка модулей',
                '📸 Облачное хранилище фото',
                '🔄 Фоновая синхронизация между устройствами',
                '💾 IndexedDB кэш для фото',
                '🎯 Debounce/Throttle для фильтров и поиска',
                '📦 Service Worker для PWA и офлайн-режима',
                '🔧 Сжатие фото перед загрузкой',
                '📊 Оптимизация памяти',
                '👤 Кнопка синхронизации в профиле',
                '☁️ Настройки облачного хранилища'
            ]
        },
        {
            version: '7.4',
            date: '17-18 апреля 2026',
            title: '👥 Социальная честность',
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
            title: '👤 Профиль и настройки',
            changes: [
                '👤 Система профиля (имя, ID, стрик входов)',
                '💾 Экспорт/импорт прогресса',
                '🎨 8 готовых тем оформления',
                '🎨 Индивидуальная настройка цветов',
                '🏆 Три вкладки достижений',
                '❓ Скрытые достижения (50 шт.)',
                '🌙 Учёт ночных дел'
            ]
        },
        {
            version: '7.2',
            date: '17 апреля 2026',
            title: '💎 Премиум друг',
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
            title: '🎨 Полировка и удобство',
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
            title: '🐾 Верный друг — питомцы Тамагочи',
            changes: [
                '🐹 5 базовых питомцев (хомяк бесплатно)',
                '📊 4 шкалы состояния',
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
            title: '🎮 Фундамент для расширения',
            changes: [
                '🎮 Полноценная RPG-система',
                '📋 1000+ дел',
                '📈 20 уровней',
                '⚡ Бустеры, ачивки, календарь, карта, фото',
                '🏗️ Готовая модульная архитектура',
                '🐾 Готовность к добавлению питомцев',
                '👥 Готовность к социальным функциям'
            ]
        },
        {
            version: '6.2',
            date: '16 апреля 2026',
            title: '🔐 Достижения и секреты',
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
            title: '🎨 Улучшение UI',
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
            title: '🎡 Рандом и кастомизация',
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
            title: '📸 Мультимедиа и карта',
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
            title: '📊 Визуализация и прогресс',
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
            title: '⏰ Дедлайны и сложность',
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
            title: '💰 Экономика и уровни',
            changes: [
                '💰 Система монет и опыта',
                '📈 Уровни игрока (1-20)',
                '🛒 Магазин дел (покупка заданий за монеты)'
            ]
        },
        {
            version: '1.0',
            date: '14 апреля 2026',
            title: '🏗️ MVP — Минимально жизнеспособный продукт',
            changes: [
                '📋 Простой список дел',
                '✅ Ручное отмечание выполнения',
                '💾 Локальное хранение в localStorage',
                '🏗️ Базовая структура HTML'
            ]
        }
    ];

    const futurePlans = [
        {
            version: '0.9',
            title: 'Умные списки и аналитика',
            features: [
                '📊 Графики прогресса по дням/неделям/месяцам',
                '📋 Шаблоны списков',
                '🔔 Ежедневные напоминания о делах',
                '📅 Интеграция с Google Calendar',
                '📥 Импорт из CSV/Excel',
                '🎯 Интеллектуальные рекомендации дел'
            ]
        },
        {
            version: '1.0',
            title: 'Релизная версия',
            features: [
                '📱 Полноценное мобильное приложение (PWA)',
                '🤖 Сборка Android APK',
                '☁️ Полная облачная синхронизация',
                '🔔 Push-уведомления',
                '🎨 Финальный дизайн',
                '📖 Онбординг для новых пользователей'
            ]
        },
        {
            version: '1.1',
            title: 'Социальное взаимодействие',
            features: [
                '💬 Личные сообщения между игроками',
                '✅ Система подтверждения выполнения дел друзьями',
                '🎁 Ежедневные подарки и бонусы',
                '⚔️ Дуэли питомцев',
                '🏅 Еженедельные турниры'
            ]
        },
        {
            version: '1.2',
            title: 'Экономика и контент',
            features: [
                '🎫 Ежедневный магазин со скидками',
                '🎰 Лутбоксы с редкими предметами',
                '🏆 Battle Pass (сезонный)',
                '📦 Новые тематические сборники',
                '🌟 Система рейтинга и званий'
            ]
        }
    ];

    // Сборка HTML
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

    const html = `
        <div class="max-w-3xl mx-auto">
            <!-- Текущая версия -->
            <div class="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-6 text-white mb-8">
                <div class="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <span class="text-sm opacity-80">Текущая версия</span>
                        <h2 class="text-3xl font-bold">0.8.1</h2>
                        <p class="text-sm opacity-80 mt-1">от 12 июля 2026</p>
                    </div>
                    <div class="text-right">
                        <div class="text-sm opacity-80">📦 Сборники дел</div>
                        <div class="text-sm opacity-80">📊 Статистика</div>
                        <div class="text-sm opacity-80">☁️ Синхронизация</div>
                        <div class="text-sm opacity-80">🐾 7 питомцев</div>
                    </div>
                </div>
                <p class="mt-4 text-white/90">
                    «Жизнь в делах» — это твой персональный трекер целей и свершений.
                    Покупай дела, заботься о питомце, отслеживай прогресс и живи насыщенной жизнью!
                </p>
            </div>

            <!-- Разработчик -->
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-8">
                <div class="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <span class="text-sm opacity-80">👨‍💻 Разработчик</span>
                        <h2 class="text-3xl font-bold">InShiro</h2>
                        <p class="text-sm opacity-80 mt-1">Идейный вдохновитель и разработчик</p>
                    </div>
                    <div class="text-right">
                        <div class="flex gap-2">
                            <a href="https://github.com/DokHot" target="_blank" class="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">
                                <i class="fab fa-github"></i>
                            </a>
                            <a href="https://t.me/inshiro" target="_blank" class="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">
                                <i class="fab fa-telegram"></i>
                            </a>
                            <a href="mailto:inshiro@example.com" class="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">
                                <i class="fas fa-envelope"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <p class="mt-4 text-white/90 text-sm">
                    Проект создан и поддерживается <strong>InShiro</strong>. Вся обратная связь и предложения приветствуются!
                </p>
            </div>

            <!-- Статистика проекта -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <span class="text-2xl">📊</span> Статистика проекта
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <div class="text-2xl font-bold text-green-600">18</div>
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
                        <div class="text-2xl font-bold text-teal-600">5</div>
                        <div class="text-xs text-gray-500">вкладок</div>
                    </div>
                </div>
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

            <!-- Благодарности -->
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-8">
                <h2 class="text-xl font-bold mb-2 flex items-center gap-2">
                    <span class="text-2xl">🙏</span> Благодарности
                </h2>
                <p class="text-sm text-white/90">
                    Особенная благодарность <strong>DeepSeek</strong> — искусственному интеллекту,
                    который помог реализовать этот проект за рекордные 90 дней.
                    От идеи до полноценной RPG-экосистемы с питомцами, социальными функциями, облачным хранилищем,
                    системой сборников и сотнями заданий.
                </p>
                <p class="text-sm text-white/80 mt-3">
                    🤖 DeepSeek — это не просто помощник, а полноценный соавтор,
                    который писал код, проектировал архитектуру, отлаживал ошибки и предлагал идеи.
                </p>
            </div>

            <!-- Контакты -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                    <span class="text-2xl">📧</span> Обратная связь
                </h2>
                <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                        Нашли баг или есть предложения по улучшению?<br>
                        Проект активно развивается, и каждый фидбек важен!
                    </p>
                    <div class="flex flex-wrap gap-3 mt-4">
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

    // Обработчики
    document.getElementById('reportBugBtn')?.addEventListener('click', () => {
        alert('📧 Свяжитесь с разработчиком:\nTelegram: @inshiro\nEmail: inshiro@example.com\n\nСпасибо за обратную связь!');
    });

    document.getElementById('suggestFeatureBtn')?.addEventListener('click', () => {
        alert('💡 Идеи можно отправить разработчику:\nTelegram: @inshiro\nEmail: inshiro@example.com\n\nСпасибо за ваши предложения!');
    });
}