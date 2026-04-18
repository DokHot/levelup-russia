// js/cloud/photoCompression.js
// ============================================================
// СЖАТИЕ И РЕСАЙЗ ФОТО
// Версия 1.0
// ============================================================

/**
 * Сжатие фото до указанного размера
 * @param {File|Blob} file - исходный файл
 * @param {number} maxSizeKB - максимальный размер в КБ (по умолчанию 500)
 * @returns {Promise<Blob>} сжатый blob
 */
export async function compressPhoto(file, maxSizeKB = 500) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                
                // Ограничиваем максимальные размеры
                const maxDim = 1280;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = (height * maxDim) / width;
                        width = maxDim;
                    } else {
                        width = (width * maxDim) / height;
                        height = maxDim;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Пробуем разные степени сжатия
                let quality = 0.85;
                
                const tryCompress = () => {
                    canvas.toBlob((blob) => {
                        const sizeKB = blob.size / 1024;
                        if (sizeKB <= maxSizeKB || quality <= 0.3) {
                            resolve(blob);
                        } else {
                            quality -= 0.1;
                            tryCompress();
                        }
                    }, 'image/jpeg', quality);
                };
                
                tryCompress();
            };
            
            img.onerror = (err) => reject(err);
            img.src = e.target.result;
        };
        
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

/**
 * Создание миниатюры (thumbnail)
 * @param {Blob} blob - исходный blob
 * @param {number} thumbSize - размер миниатюры в px (по умолчанию 200)
 * @returns {Promise<Blob>} миниатюра
 */
export async function createThumbnail(blob, thumbSize = 200) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ratio = thumbSize / Math.min(img.width, img.height);
            
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((thumbBlob) => {
                URL.revokeObjectURL(url);
                resolve(thumbBlob);
            }, 'image/jpeg', 0.7);
        };
        
        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
        
        img.src = url;
    });
}

/**
 * Получение размеров изображения
 * @param {Blob} blob - blob изображения
 * @returns {Promise<{width: number, height: number}>}
 */
export async function getImageDimensions(blob) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.width, height: img.height });
        };
        
        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
        
        img.src = url;
    });
}

/**
 * Конвертация Base64 в Blob
 * @param {string} base64 - строка base64
 * @returns {Blob} blob
 */
export function base64ToBlob(base64) {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; i++) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
}

/**
 * Конвертация Blob в Base64
 * @param {Blob} blob - blob
 * @returns {Promise<string>} base64 строка
 */
export function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}