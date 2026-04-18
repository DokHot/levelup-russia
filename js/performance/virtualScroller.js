// js/performance/virtualScroller.js
// ============================================================
// ВИРТУАЛЬНАЯ ПРОКРУТКА ДЛЯ БОЛЬШИХ СПИСКОВ
// Версия 1.0
// ============================================================

/**
 * Класс для виртуальной прокрутки больших списков
 * Рендерит только видимые элементы + буфер
 */
export class VirtualScroller {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.container - контейнер для списка
     * @param {Array} options.items - массив данных
     * @param {number} options.itemHeight - высота одного элемента в px
     * @param {Function} options.renderItem - функция рендера элемента (item, index) => HTMLElement
     * @param {number} options.bufferSize - размер буфера (сколько элементов вне экрана рендерить)
     * @param {Function} options.onScrollEnd - коллбэк при достижении конца
     * @param {number} options.scrollThreshold - порог для подгрузки (в px до конца)
     */
    constructor(options) {
        this.container = options.container;
        this.items = options.items || [];
        this.itemHeight = options.itemHeight;
        this.renderItem = options.renderItem;
        this.bufferSize = options.bufferSize || 5;
        this.onScrollEnd = options.onScrollEnd;
        this.scrollThreshold = options.scrollThreshold || 200;
        
        this.scrollTop = 0;
        this.containerHeight = 0;
        this.renderedItems = new Map(); // index -> DOM element
        this.isScrolling = false;
        this.rafId = null;
        
        this.init();
    }
    
    /**
     * Инициализация
     */
    init() {
        // Создаём контейнер для содержимого
        this.contentContainer = document.createElement('div');
        this.contentContainer.style.position = 'relative';
        this.container.innerHTML = '';
        this.container.appendChild(this.contentContainer);
        
        // Устанавливаем высоту контейнера
        this.updateTotalHeight();
        
        // Слушаем скролл
        this.container.addEventListener('scroll', () => this.handleScroll());
        
        // Слушаем изменение размера
        const resizeObserver = new ResizeObserver(() => {
            this.handleResize();
        });
        resizeObserver.observe(this.container);
        
        // Первоначальный рендер
        this.updateVisibleItems();
    }
    
    /**
     * Обновление общей высоты
     */
    updateTotalHeight() {
        const totalHeight = this.items.length * this.itemHeight;
        this.contentContainer.style.height = `${totalHeight}px`;
    }
    
    /**
     * Обработка скролла
     */
    handleScroll() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        
        this.rafId = requestAnimationFrame(() => {
            this.scrollTop = this.container.scrollTop;
            this.updateVisibleItems();
            this.checkScrollEnd();
            this.rafId = null;
        });
    }
    
    /**
     * Обработка изменения размера контейнера
     */
    handleResize() {
        this.containerHeight = this.container.clientHeight;
        this.updateVisibleItems();
    }
    
    /**
     * Обновление видимых элементов
     */
    updateVisibleItems() {
        const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.bufferSize);
        const endIndex = Math.min(
            this.items.length,
            Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight) + this.bufferSize
        );
        
        // Удаляем элементы вне диапазона
        for (const [index, element] of this.renderedItems) {
            if (index < startIndex || index >= endIndex) {
                element.remove();
                this.renderedItems.delete(index);
            }
        }
        
        // Добавляем новые элементы
        for (let i = startIndex; i < endIndex; i++) {
            if (!this.renderedItems.has(i)) {
                const element = this.renderItem(this.items[i], i);
                if (element) {
                    element.style.position = 'absolute';
                    element.style.top = `${i * this.itemHeight}px`;
                    element.style.left = '0';
                    element.style.right = '0';
                    element.style.height = `${this.itemHeight}px`;
                    this.contentContainer.appendChild(element);
                    this.renderedItems.set(i, element);
                }
            }
        }
    }
    
    /**
     * Проверка достижения конца списка
     */
    checkScrollEnd() {
        if (!this.onScrollEnd) return;
        
        const scrollBottom = this.scrollTop + this.containerHeight;
        const totalHeight = this.items.length * this.itemHeight;
        
        if (totalHeight - scrollBottom <= this.scrollThreshold) {
            this.onScrollEnd();
        }
    }
    
    /**
     * Обновление данных
     * @param {Array} newItems - новый массив данных
     */
    updateItems(newItems) {
        this.items = newItems;
        this.updateTotalHeight();
        
        // Очищаем все отрендеренные элементы
        for (const element of this.renderedItems.values()) {
            element.remove();
        }
        this.renderedItems.clear();
        
        // Перерендер
        this.updateVisibleItems();
    }
    
    /**
     * Прокрутка к элементу
     * @param {number} index - индекс элемента
     */
    scrollToIndex(index) {
        if (index < 0 || index >= this.items.length) return;
        
        this.container.scrollTo({
            top: index * this.itemHeight,
            behavior: 'smooth'
        });
    }
    
    /**
     * Получение текущих данных
     */
    getItems() {
        return this.items;
    }
    
    /**
     * Очистка
     */
    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.container.removeEventListener('scroll', this.handleScroll);
        this.container.innerHTML = '';
        this.renderedItems.clear();
    }
}