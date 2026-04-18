// js/lottie.js
// ============================================================
// LOTTIE-АНИМАЦИИ — ЗАГРУЗКА JSON-АНИМАЦИЙ ДЛЯ ПИТОМЦЕВ
// С ЗАГЛУШКАМИ — НЕ ЛОМАЕТСЯ, ЕСЛИ ФАЙЛОВ НЕТ
// ============================================================

let lottiePlayerLoaded = false;
let lottiePlayerError = false;

/**
 * Загружает Lottie Player библиотеку
 * @returns {Promise}
 */
export function loadLottiePlayer() {
    return new Promise((resolve) => {
        // Если уже была ошибка — не пытаемся снова
        if (lottiePlayerError) {
            resolve(false);
            return;
        }
        
        // Если уже загружено
        if (typeof window.lottie !== 'undefined' || document.querySelector('lottie-player')) {
            lottiePlayerLoaded = true;
            resolve(true);
            return;
        }
        
        // Загружаем скрипт
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';
        script.onload = () => {
            lottiePlayerLoaded = true;
            resolve(true);
        };
        script.onerror = () => {
            console.warn('Lottie player failed to load, using fallback emoji');
            lottiePlayerError = true;
            resolve(false);
        };
        document.head.appendChild(script);
        
        // Таймаут на всякий случай
        setTimeout(() => {
            if (!lottiePlayerLoaded) {
                lottiePlayerError = true;
                resolve(false);
            }
        }, 5000);
    });
}

/**
 * Пытается загрузить Lottie-анимацию для питомца
 * @param {Object} pet - объект питомца
 * @param {string} containerId - ID контейнера
 * @returns {Promise<boolean>} успех загрузки
 */
export async function loadPetAnimation(pet, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return false;
    
    // Если нет Lottie-анимации — показываем эмодзи
    if (!pet.lottieUrl || pet.type !== 'premium') {
        container.innerHTML = `<div class="text-6xl text-center">${pet.icon}</div>`;
        return false;
    }
    
    const loaded = await loadLottiePlayer();
    if (!loaded) {
        container.innerHTML = `<div class="text-6xl text-center">${pet.icon}</div>`;
        return false;
    }
    
    // Пробуем загрузить JSON-анимацию
    try {
        const response = await fetch(pet.lottieUrl);
        if (!response.ok) throw new Error('Lottie file not found');
        
        container.innerHTML = `
            <lottie-player
                src="${pet.lottieUrl}"
                background="transparent"
                speed="1"
                loop
                autoplay
                style="width: 120px; height: 120px; margin: 0 auto;">
            </lottie-player>
        `;
        return true;
    } catch (e) {
        console.warn(`Lottie animation not found for ${pet.name}:`, e);
        container.innerHTML = `<div class="text-6xl text-center">${pet.icon}</div>`;
        return false;
    }
}

/**
 * Обновляет анимацию питомца (при смене состояния)
 * @param {Object} pet - объект питомца
 * @param {string} containerId - ID контейнера
 * @param {string} state - состояние (idle, happy, sad, hungry)
 */
export async function updatePetAnimation(pet, containerId, state = 'idle') {
    if (!pet || pet.type !== 'premium') return;
    
    const stateUrls = {
        idle: pet.lottieUrl,
        happy: pet.lottieUrl?.replace('idle', 'happy'),
        sad: pet.lottieUrl?.replace('idle', 'sad'),
        hungry: pet.lottieUrl?.replace('idle', 'hungry')
    };
    
    const url = stateUrls[state] || stateUrls.idle;
    if (url && url !== pet.lottieUrl) {
        const container = document.getElementById(containerId);
        if (container) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    container.innerHTML = `
                        <lottie-player
                            src="${url}"
                            background="transparent"
                            speed="1"
                            loop
                            autoplay
                            style="width: 120px; height: 120px; margin: 0 auto;">
                        </lottie-player>
                    `;
                }
            } catch (e) {
                // тихо падаем
            }
        }
    }
}