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
        
        this.selectedIcons = new Set();
        
        this.ui = new UIManager();
    }

    async init() {
        try {
            this.ui.renderColors(COLORS, this.currentColor);
            this.ui.renderBulkColors(COLORS, this.currentColor);
            
            // Load Data
            this.icons = await IconService.fetchLibrary();
            this.ui.renderGrid(this.icons, this.selectedIcons); // Initial render
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
            this.ui.renderGrid(filtered, this.selectedIcons);
        });

        // Grid Selection
        els.grid.addEventListener('click', (e) => {
            const card = e.target.closest('.icon-card');
            if (card) {
                const id = card.dataset.id;
                
                // Check if clicked the checkbox container
                if (e.target.closest('.selection-checkbox')) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleSelection(id);
                } else {
                    this.selectIcon(id);
                }
            }
        });

        // Sidebar Close
        els.closeSidebarBtn.addEventListener('click', () => {
            this.ui.closeSidebar();
        });

        // --- Sidebar Configuration ---

        // Color Picker (Swatches)
        els.colorPicker.addEventListener('click', (e) => {
            const swatch = e.target.closest('.color-swatch');
            if (swatch) {
                this.currentColor = swatch.dataset.color;
                this.ui.updateActiveSwatch(this.currentColor);
                if (els.customColorPicker) els.customColorPicker.value = this.currentColor;
                if (els.customColorInput) els.customColorInput.value = this.currentColor;
                this.refreshPreview();
            }
        });

        // Custom Color Picker (Input type=color)
        if (els.customColorPicker) {
            els.customColorPicker.addEventListener('input', (e) => {
                this.currentColor = e.target.value;
                this.ui.updateActiveSwatch(null);
                if (els.customColorInput) els.customColorInput.value = this.currentColor;
                this.refreshPreview();
            });
        }

        // Custom Color Input (Input type=text)
        if (els.customColorInput) {
            els.customColorInput.addEventListener('input', (e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    this.currentColor = val;
                    this.ui.updateActiveSwatch(null);
                    if (els.customColorPicker) els.customColorPicker.value = val;
                    this.refreshPreview();
                }
            });
        }

        // Size Sync
        const updateSidebarSize = (val) => {
            if (Number.isNaN(val)) return;
            val = Math.max(16, Math.min(512, val));
            this.currentSize = val;
            this.ui.updateSizeLabel(val);
            this.refreshPreview();
        };

        if (els.sizeSlider) {
            els.sizeSlider.addEventListener('input', (e) => updateSidebarSize(parseInt(e.target.value)));
        }
        if (els.sizeInput) {
            els.sizeInput.addEventListener('input', (e) => updateSidebarSize(parseInt(e.target.value)));
        }

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

        // Copy Code
        els.copyCodeBtn.addEventListener('click', async () => {
            const code = els.codePreview.textContent;
            if (code) {
                try {
                    await navigator.clipboard.writeText(code);
                    this.ui.setCopiedFeedback();
                } catch (err) {
                    console.error('Failed to copy!', err);
                }
            }
        });

        // --- Bulk Actions ---

        // Open Dialog
        els.bulkDownloadBtn.addEventListener('click', () => {
            els.bulkDialog.show();
        });

        // Bulk Color Picker (Swatches)
        if (els.bulkColorPicker) {
            els.bulkColorPicker.addEventListener('click', (e) => {
                const swatch = e.target.closest('.color-swatch');
                if (swatch) {
                    const color = swatch.dataset.color;
                    this.ui.updateBulkActiveSwatch(color);
                    if(els.bulkCustomColorPicker) els.bulkCustomColorPicker.value = color;
                    if(els.bulkCustomColorInput) els.bulkCustomColorInput.value = color;
                }
            });
        }

        // Bulk Custom Color Sync
        const updateBulkColor = (val) => {
            this.ui.updateBulkActiveSwatch(null);
            if(els.bulkCustomColorPicker) els.bulkCustomColorPicker.value = val;
            if(els.bulkCustomColorInput) els.bulkCustomColorInput.value = val;
        };

        if (els.bulkCustomColorPicker) {
             els.bulkCustomColorPicker.addEventListener('input', (e) => updateBulkColor(e.target.value));
        }
        if (els.bulkCustomColorInput) {
             els.bulkCustomColorInput.addEventListener('input', (e) => {
                 if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) updateBulkColor(e.target.value);
             });
        }

        // Bulk Size Sync
        const updateBulkSize = (val) => {
            if (Number.isNaN(val)) return;
            val = Math.max(16, Math.min(512, val));
            
            if(els.bulkSizeLabel) els.bulkSizeLabel.textContent = `${val}px`;
            if(els.bulkSizeSlider && parseInt(els.bulkSizeSlider.value) !== val) els.bulkSizeSlider.value = val;
            if(els.bulkSizeInput && parseInt(els.bulkSizeInput.value) !== val) els.bulkSizeInput.value = val;
        };

        if (els.bulkSizeSlider) els.bulkSizeSlider.addEventListener('input', (e) => updateBulkSize(parseInt(e.target.value)));
        if (els.bulkSizeInput) els.bulkSizeInput.addEventListener('input', (e) => updateBulkSize(parseInt(e.target.value)));

        // Confirm Bulk Download
        if (els.confirmBulkDownload) {
            els.confirmBulkDownload.addEventListener('click', async () => {
                await this.handleBulkDownload();
                els.bulkDialog.close();
            });
        }

        // --- CSS Download ---
        if (els.downloadCssBtn) {
            els.downloadCssBtn.addEventListener('click', () => {
                els.cssDialog.show();
            });
        }

        if (els.confirmCssDownload) {
            els.confirmCssDownload.addEventListener('click', () => {
                const targets = this.selectedIcons.size > 0 
                    ? this.icons.filter(i => this.selectedIcons.has(i.name))
                    : this.icons;
                IconUtils.downloadCSS(targets);
                els.cssDialog.close();
            });
        }
        
        // Select All / Deselect All
        if (els.selectAllBtn) {
            els.selectAllBtn.addEventListener('click', () => {
                this.icons.forEach(i => this.selectedIcons.add(i.name));
                this.updateAllSelectionVisuals();
            });
        }
        if (els.deselectAllBtn) {
            els.deselectAllBtn.addEventListener('click', () => {
                this.selectedIcons.clear();
                this.updateAllSelectionVisuals();
            });
        }
    }

    updateAllSelectionVisuals() {
        // Optimally, we could just re-render, but updating DOM is better for performance if list is long.
        // For simplicity and correctness with existing code:
        const els = this.ui.elements;
        const cards = els.grid.querySelectorAll('.icon-card');
        cards.forEach(card => {
            const id = card.dataset.id;
            const isSelected = this.selectedIcons.has(id);
            card.classList.toggle('selected', isSelected);
            const checkbox = card.querySelector('md-checkbox');
            if (checkbox) checkbox.checked = isSelected;
        });
        
        this.ui.toggleBulkActions(this.selectedIcons.size);
    }

    toggleSelection(id) {
        if (this.selectedIcons.has(id)) {
            this.selectedIcons.delete(id);
        } else {
            this.selectedIcons.add(id);
        }
        
        // Find card and update UI partially or re-render
        // Re-rendering is easier for now to ensure consistency, but less efficient.
        // Given icon count is small-ish, re-render is fine. 
        // Or update just the specific card class and checkbox.
        const card = document.querySelector(`.icon-card[data-id="${id}"]`);
        if (card) {
            const isSelected = this.selectedIcons.has(id);
            card.classList.toggle('selected', isSelected);
            const checkbox = card.querySelector('md-checkbox');
            if (checkbox) checkbox.checked = isSelected;
        }

        this.ui.toggleBulkActions(this.selectedIcons.size);
    }

    async handleBulkDownload() {
        const els = this.ui.elements;
        // Check active tab. We assume SVG is active unless PNG tab is active.
        // For MdTabs, checking 'active' property on the tab element is best.
        const isPng = document.getElementById('tab-png').active;
        const formatType = isPng ? 'png' : 'svg';

        const size = parseInt(els.bulkSizeSlider.value);
        
        // Get color
        let color = '#000000';
        const activeSwatch = els.bulkColorPicker ? els.bulkColorPicker.querySelector('.color-swatch.active') : null;
        if (activeSwatch) {
            color = activeSwatch.dataset.color;
        } else if (els.bulkCustomColorPicker) {
            color = els.bulkCustomColorPicker.value;
        }

        const iconsToDownload = this.icons.filter(i => this.selectedIcons.has(i.name));
        
        if (iconsToDownload.length > 0) {
            await IconUtils.downloadZip(iconsToDownload, size, color, formatType, els.exportCanvas);
        }
    }

    selectIcon(id) {
        const icon = this.icons.find(i => i.name === id);
        if (icon) {
            this.currentIcon = icon;
            this.ui.openSidebar(icon.name);
            this.ui.updateSizeLabel(this.currentSize);
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

