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
            sizeInput: document.getElementById('size-input'),
            sizeLabel: document.getElementById('size-label'),
            sidebarTitle: document.getElementById('sidebar-title'),
            sidebarTags: document.getElementById('sidebar-tags'),
            loadingOverlay: document.getElementById('loading-overlay'),
            closeSidebarBtn: document.getElementById('close-sidebar'),
            
            customColorPicker: document.getElementById('custom-color-picker'),
            customColorInput: document.getElementById('custom-color-input'),

            downloadSvgBtn: document.getElementById('download-svg'),
            downloadPngBtn: document.getElementById('download-png'),
            exportCanvas: document.getElementById('export-canvas'),
            codePreview: document.getElementById('code-preview'),
            copyCodeBtn: document.getElementById('copy-code-btn'),
            
            // Bulk Actions
            bulkActions: document.getElementById('bulk-actions'),
            bulkDownloadBtn: document.getElementById('bulk-download-btn'),
            bulkDialog: document.getElementById('bulk-download-dialog'),
            bulkCount: document.getElementById('bulk-count'),
            bulkFormatTabs: document.getElementById('bulk-format-tabs'),
            bulkSizeSlider: document.getElementById('bulk-size-slider'),
            bulkSizeInput: document.getElementById('bulk-size-input'),
            bulkSizeLabel: document.getElementById('bulk-size-label'),
            bulkColorPicker: document.getElementById('bulk-color-picker'),
            
            bulkCustomColorPicker: document.getElementById('bulk-custom-color-picker'),
            bulkCustomColorInput: document.getElementById('bulk-custom-color-input'),
            
            confirmBulkDownload: document.getElementById('confirm-bulk-download'),

            // CSS Download
            downloadCssBtn: document.getElementById('download-css-btn'),
            cssDialog: document.getElementById('css-tutorial-dialog'),
            confirmCssDownload: document.getElementById('confirm-css-download'),

            // Selection Controls
            selectAllBtn: document.getElementById('select-all-btn'),
            deselectAllBtn: document.getElementById('deselect-all-btn')
        };
    }

    renderGrid(icons, selectedIcons = new Set()) {
        this.elements.grid.innerHTML = icons.map(icon => {
            // Create a temporary stripped version for the card preview
            const strippedMarkup = IconUtils.getProcessedSVG(icon.markup, 48, '#555');
            const isSelected = selectedIcons.has(icon.name);
            
            // We use tabindex="0" on the card to make it focusable (for the "Edit" action)
            // The checkbox is natively focusable.
            return `
                <md-elevated-card class="icon-card ${isSelected ? 'selected' : ''}" data-id="${icon.name}" tabindex="0" role="button" aria-label="Edit ${icon.name}">
                    <div class="selection-checkbox" data-action="toggle-select">
                        <md-checkbox touch-target="wrapper" ${isSelected ? 'checked' : ''} aria-label="Select ${icon.name}"></md-checkbox>
                    </div>
                    <div class="mb-4 pointer-events-none" aria-hidden="true">
                        ${strippedMarkup}
                    </div>
                    <div class="text-sm font-medium text-center truncate w-full pointer-events-none">${icon.name}</div>
                </md-elevated-card>
            `;
        }).join('');
    }

    renderBulkColors(colors, activeColor) {
        if (!this.elements.bulkColorPicker) return;
        this.elements.bulkColorPicker.innerHTML = colors.map(color => `
            <button class="color-swatch ${color === activeColor ? 'active' : ''}" 
                 style="background: ${color}" 
                 data-color="${color}"
                 aria-label="Select color ${color}"
                 type="button"></button>
        `).join('');
    }

    updateBulkActiveSwatch(activeColor) {
        if (!this.elements.bulkColorPicker) return;
        const swatches = this.elements.bulkColorPicker.querySelectorAll('.color-swatch');
        swatches.forEach(s => {
            s.classList.toggle('active', s.dataset.color === activeColor);
        });
    }

    toggleBulkActions(count) {
        if (count > 0) {
            this.elements.bulkActions.classList.remove('hidden');
            this.elements.bulkCount.textContent = count;
        } else {
            this.elements.bulkActions.classList.add('hidden');
        }
    }

    renderColors(colors, activeColor) {
        this.elements.colorPicker.innerHTML = colors.map(color => `
            <button class="color-swatch ${color === activeColor ? 'active' : ''}" 
                 style="background: ${color}" 
                 data-color="${color}"
                 aria-label="Select color ${color}"
                 type="button"></button>
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
            this.elements.codePreview.textContent = '';
            return;
        }
        const processed = IconUtils.getProcessedSVG(markup, size, color);
        this.elements.previewArea.innerHTML = processed;
        this.elements.codePreview.textContent = processed;
    }

    setCopiedFeedback() {
        const icon = this.elements.copyCodeBtn.querySelector('md-icon');
        const original = icon.textContent;
        icon.textContent = 'check';
        setTimeout(() => icon.textContent = 'content_copy', 2000);
    }

    updateSizeLabel(size) {
        this.elements.sizeLabel.textContent = `${size}px`;
        if (this.elements.sizeSlider) this.elements.sizeSlider.value = size;
        if (this.elements.sizeInput) this.elements.sizeInput.value = size;
    }

    openSidebar(iconName, tags = []) {
        this.elements.sidebarTitle.textContent = iconName;
        
        if (this.elements.sidebarTags) {
            this.elements.sidebarTags.innerHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        }
        
        this.elements.sidebar.classList.add('open');
    }

    closeSidebar() {
        this.elements.sidebar.classList.remove('open');
    }

    showError(message) {
        this.elements.grid.innerHTML = `<div class="col-span-full text-center py-12 text-gray-700">
            <p class="text-red-500 font-bold mb-2">Error</p>
            <p class="text-sm">${message}</p>
        </div>`;
    }

    hideLoading() {
        this.elements.loadingOverlay.style.display = 'none';
    }
}
