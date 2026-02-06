import { IconUtils } from './IconUtils.js';

export class UIManager {
    constructor() {
        this.elements = {
            grid: document.getElementById('icon-grid'),
            sidebar: document.getElementById('sidebar'),
            searchField: document.getElementById('search-field'),
            previewArea: document.getElementById('preview-area'),
            colorPicker: document.getElementById('color-picker'),
            sizeSlider: document.getElementById('size-slider'),
            sizeLabel: document.getElementById('size-label'),
            sidebarTitle: document.getElementById('sidebar-title'),
            loadingOverlay: document.getElementById('loading-overlay'),
            closeSidebarBtn: document.getElementById('close-sidebar'),
            downloadSvgBtn: document.getElementById('download-svg'),
            downloadPngBtn: document.getElementById('download-png'),
            exportCanvas: document.getElementById('export-canvas')
        };
    }

    renderGrid(icons) {
        this.elements.grid.innerHTML = icons.map(icon => {
            // Create a temporary stripped version for the card preview
            const strippedMarkup = IconUtils.getProcessedSVG(icon.markup, 48, '#555');
            
            return `
                <md-elevated-card class="icon-card" data-id="${icon.name}">
                    <div class="mb-4">
                        ${strippedMarkup}
                    </div>
                    <div class="text-sm font-medium text-center truncate w-full">${icon.name}</div>
                </md-elevated-card>
            `;
        }).join('');
    }

    renderColors(colors, activeColor) {
        this.elements.colorPicker.innerHTML = colors.map(color => `
            <div class="color-swatch ${color === activeColor ? 'active' : ''}" 
                 style="background: ${color}" 
                 data-color="${color}"></div>
        `).join('');
    }

    updateActiveSwatch(activeColor) {
        const swatches = this.elements.colorPicker.querySelectorAll('.color-swatch');
        swatches.forEach(s => {
            s.classList.toggle('active', s.dataset.color === activeColor);
        });
    }

    updatePreview(markup, size, color) {
        if (!markup) {
            this.elements.previewArea.innerHTML = '';
            return;
        }
        const processed = IconUtils.getProcessedSVG(markup, size, color);
        this.elements.previewArea.innerHTML = processed;
    }

    updateSizeLabel(size) {
        this.elements.sizeLabel.textContent = `${size}px`;
    }

    openSidebar(iconName) {
        this.elements.sidebarTitle.textContent = iconName;
        this.elements.sidebar.classList.add('open');
    }

    closeSidebar() {
        this.elements.sidebar.classList.remove('open');
    }

    showError(message) {
        this.elements.grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-500">
            <p class="text-red-500 font-bold mb-2">Error</p>
            <p class="text-sm">${message}</p>
        </div>`;
    }

    hideLoading() {
        this.elements.loadingOverlay.style.display = 'none';
    }
}
