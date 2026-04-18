// js/performance/lazyLoader.js
// ============================================================
// ЛЕНИВАЯ ЗАГРУЗКА МОДУЛЕЙ И РЕСУРСОВ
// Версия 1.0
// ============================================================

/**
 * Кэш загруженных модулей
 */
const moduleCache = new Map();

/**
 * Очередь загрузки (для приоритетов)
 */
let loadingQueue = [];
let isProcessingQueue = false;

/**
 * Загрузка модуля с ленивой инициализацией
 * @param {string} moduleName - имя модуля
 * @param {Function} importFn - функция динамического импорта
 * @param {number} priority - приоритет (1-5, 5 - наивысший)
 * @returns {Promise<any>}
 */
export async function lazyLoad(moduleName, importFn, priority = 3) {
    // Проверяем кэш
    if (moduleCache.has(moduleName)) {
        return moduleCache.get(moduleName);
    }
    
    // Добавляем в очередь
    return new Promise((resolve, reject) => {
        loadingQueue.push({
            name: moduleName,
            importFn,
            priority,
            resolve,
            reject,
            timestamp: Date.now()
        });
        
        // Сортируем по приоритету
        loadingQueue.sort((a, b) => b.priority - a.priority);
        
        // Запускаем обработку очереди
        if (!isProcessingQueue) {
            processQueue();
        }
    });
}

/**
 * Обработка очереди загрузки
 */
async function processQueue() {
    if (loadingQueue.length === 0) {
        isProcessingQueue = false;
        return;
    }
    
    isProcessingQueue = true;
    const task = loadingQueue.shift();
    
    try {
        const module = await task.importFn();
        moduleCache.set(task.name, module);
        task.resolve(module);
    } catch (error) {
        console.error(`Failed to load module ${task.name}:`, error);
        task.reject(error);
    }
    
    // Небольшая задержка между загрузками для избежания блокировки
    setTimeout(processQueue, 50);
}

/**
 * Предзагрузка модуля (без ожидания)
 * @param {string} moduleName - имя модуля
 * @param {Function} importFn - функция динамического импорта
 * @param {number} priority - приоритет
 */
export function preloadModule(moduleName, importFn, priority = 1) {
    // Не ждём результат, просто запускаем загрузку
    lazyLoad(moduleName, importFn, priority).catch(console.debug);
}

/**
 * Загрузка изображения с ленивой загрузкой
 * @param {string} src - URL изображения
 * @param {HTMLElement} container - контейнер для вставки
 * @param {Object} options - опции
 * @returns {Promise<HTMLImageElement>}
 */
export function lazyLoadImage(src, container, options = {}) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const placeholder = options.placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        if (options.className) img.className = options.className;
        if (options.alt) img.alt = options.alt;
        
        img.onload = () => {
            img.style.opacity = '1';
            resolve(img);
        };
        
        img.onerror = reject;
        img.src = src;
        
        // Вставляем плейсхолдер
        if (container) {
            container.innerHTML = '';
            container.appendChild(img);
        }
    });
}

/**
 * Использование Intersection Observer для ленивой загрузки элементов
 * @param {HTMLElement[]} elements - массив элементов
 * @param {Function} loadCallback - коллбэк загрузки
 * @param {Object} options - опции Intersection Observer
 * @returns {IntersectionObserver}
 */
export function setupLazyObserver(elements, loadCallback, options = {}) {
    const defaultOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.01
    };
    
    const observerOptions = { ...defaultOptions, ...options };
    const loaded = new Set();
    
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting && !loaded.has(entry.target)) {
                loaded.add(entry.target);
                loadCallback(entry.target);
                observer.unobserve(entry.target);
            }
        }
    }, observerOptions);
    
    for (const element of elements) {
        observer.observe(element);
    }
    
    return observer;
}

/**
 * Загрузка CSS динамически
 * @param {string} href - URL CSS файла
 * @returns {Promise<void>}
 */
export function loadCSS(href) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
        
        document.head.appendChild(link);
    });
}

/**
 * Загрузка скрипта динамически
 * @param {string} src - URL скрипта
 * @returns {Promise<void>}
 */
export function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        
        document.head.appendChild(script);
    });
}

/**
 * Предзагрузка ресурсов (prefetch)
 * @param {string[]} urls - массив URL для предзагрузки
 */
export function prefetchResources(urls) {
    for (const url of urls) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    }
}

/**
 * Очистка кэша модулей (для разработки)
 */
export function clearModuleCache() {
    moduleCache.clear();
}

/**
 * Получение статуса загрузки модуля
 * @param {string} moduleName - имя модуля
 * @returns {boolean}
 */
export function isModuleLoaded(moduleName) {
    return moduleCache.has(moduleName);
}