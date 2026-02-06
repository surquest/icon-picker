import { COLORS } from './constants.js';
import { IconService } from './IconService.js';
import { IconUtils } from './IconUtils.js';
import { UIManager } from './UIManager.js';

export class App {
    constructor() {
        this.icons = [];
        this.currentIcon = null;
        this.currentColor = COLORS[0];
        this.currentSize = 120;
        
        this.ui = new UIManager();
    }

    async init() {
        try {
            this.ui.renderColors(COLORS, this.currentColor);
            
            // Load Data
            this.icons = await IconService.fetchLibrary();
            this.ui.renderGrid(this.icons); // Initial render
            this.ui.hideLoading();

            this.setupEventListeners();
        } catch (error) {
            console.error(error);
            this.ui.showError('Please ensure you are running this via a local server (e.g. Live Server) and that <code>icons/.metadata.json</code> exists.');
            this.ui.hideLoading();
        }
    }

    setupEventListeners() {
        const els = this.ui.elements;

        // Search
        els.searchField.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = this.icons.filter(i => 
                i.name.toLowerCase().includes(query) || (i.tags && i.tags.some(t => t.includes(query)))
            );
            this.ui.renderGrid(filtered);
        });

        // Grid Selection
        els.grid.addEventListener('click', (e) => {
            const card = e.target.closest('.icon-card');
            if (card) {
                const id = card.dataset.id;
                this.selectIcon(id);
            }
        });

        // Sidebar Close
        els.closeSidebarBtn.addEventListener('click', () => {
            this.ui.closeSidebar();
        });

        // Color Picker
        els.colorPicker.addEventListener('click', (e) => {
            const swatch = e.target.closest('.color-swatch');
            if (swatch) {
                this.currentColor = swatch.dataset.color;
                this.ui.updateActiveSwatch(this.currentColor);
                this.refreshPreview();
            }
        });

        // Size Slider
        els.sizeSlider.addEventListener('input', (e) => {
            this.currentSize = parseInt(e.target.value);
            this.ui.updateSizeLabel(this.currentSize);
            this.refreshPreview();
        });

        // Downloads
        els.downloadSvgBtn.addEventListener('click', () => {
            if (this.currentIcon) {
                IconUtils.downloadSVG(
                    this.currentIcon.name, 
                    this.currentIcon.markup, 
                    this.currentSize, 
                    this.currentColor
                );
            }
        });

        els.downloadPngBtn.addEventListener('click', () => {
            if (this.currentIcon) {
                IconUtils.downloadPNG(
                    this.currentIcon.name, 
                    this.currentIcon.markup, 
                    this.currentSize, 
                    this.currentColor,
                    els.exportCanvas
                );
            }
        });
    }

    selectIcon(id) {
        const icon = this.icons.find(i => i.name === id);
        if (icon) {
            this.currentIcon = icon;
            this.ui.openSidebar(icon.name);
            this.refreshPreview();
        }
    }

    refreshPreview() {
        if (this.currentIcon) {
            this.ui.updatePreview(
                this.currentIcon.markup, 
                this.currentSize, 
                this.currentColor
            );
        }
    }
}
