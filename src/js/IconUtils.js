export class IconUtils {
    /**
     * Injects size and color into an SVG string.
     * @param {string} markup - Raw SVG string
     * @param {number} size - Size in pixels
     * @param {string} color - Hex color string
     * @returns {string} Processed SVG string
     */
    static getProcessedSVG(markup, size, color) {
        if (!markup) return '';
        const parser = new DOMParser();
        const doc = parser.parseFromString(markup, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        
        if (!svg) return '';

        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('fill', color);
        svg.removeAttribute('style');

        // Tint all relevant child elements
        const elements = svg.querySelectorAll('path, circle, rect, polygon, ellipse');
        elements.forEach(el => {
            el.removeAttribute('style');
            el.setAttribute('fill', color);
        });

        return new XMLSerializer().serializeToString(svg);
    }

    /**
     * Triggers a browser download for a Blob.
     * @param {Blob} blob 
     * @param {string} filename 
     */
    static triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    static downloadSVG(name, markup, size, color) {
        const processed = this.getProcessedSVG(markup, size, color);
        const blob = new Blob([processed], {type: 'image/svg+xml'});
        this.triggerDownload(blob, `${name.replace(/\s+/g, '_').toLowerCase()}.svg`);
    }

    static downloadPNG(name, markup, size, color, canvasElement) {
        if (!canvasElement) return;
        const ctx = canvasElement.getContext('2d');
        canvasElement.width = size;
        canvasElement.height = size;
        ctx.clearRect(0, 0, size, size);

        const processed = this.getProcessedSVG(markup, size, color);
        const svgBlob = new Blob([processed], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, size, size);
            canvasElement.toBlob((blob) => {
                this.triggerDownload(blob, `${name.replace(/\s+/g, '_').toLowerCase()}.png`);
                URL.revokeObjectURL(url);
            }, 'image/png');
        };
        img.src = url;
    }
}
