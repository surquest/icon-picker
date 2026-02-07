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

    static async downloadZip(icons, size, color, format, canvasElement) {
        if (!window.JSZip) {
            alert('JSZip library is missing!');
            return;
        }

        const zip = new JSZip();
        
        const getIconBlob = (icon) => new Promise((resolve) => {
            const processed = this.getProcessedSVG(icon.markup, size, color);
            
            if (format === 'svg') {
                const blob = new Blob([processed], {type: 'image/svg+xml;charset=utf-8'});
                resolve({ name: `${icon.name}.svg`, blob });
            } else {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = size;
                tempCanvas.height = size;
                const ctx = tempCanvas.getContext('2d');
                
                const svgBlob = new Blob([processed], {type: 'image/svg+xml;charset=utf-8'});
                const url = URL.createObjectURL(svgBlob);
                
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, size, size);
                    tempCanvas.toBlob((blob) => {
                        URL.revokeObjectURL(url);
                        resolve({ name: `${icon.name}.png`, blob });
                    }, 'image/png');
                };
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    resolve(null);
                };
                img.src = url;
            }
        });

        const blobs = await Promise.all(icons.map(getIconBlob));
        
        blobs.forEach(item => {
            if (item) {
                zip.file(item.name, item.blob);
            }
        });

        const zipBlob = await zip.generateAsync({type: 'blob'});
        this.triggerDownload(zipBlob, 'icons.zip');
    }

    static downloadCSS(icons) {
        let cssContent = `.icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  background-color: currentColor;

  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: contain;

  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  -webkit-mask-size: contain;
}\n\n`;

        icons.forEach(icon => {
            // Clean up SVG for mask usage
            const parser = new DOMParser();
            const doc = parser.parseFromString(icon.markup, 'image/svg+xml');
            const svg = doc.querySelector('svg');
            
            if (svg) {
                // Ensure proper attributes for mask
                svg.removeAttribute('width');
                svg.removeAttribute('height');
                svg.removeAttribute('fill');
                svg.removeAttribute('style');
                if (!svg.hasAttribute('xmlns')) {
                    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                }

                const serialized = new XMLSerializer().serializeToString(svg);
                // Double quotes need to be handled if we wrap in double quotes in CSS
                // But encodeURIComponent handles quotes. 
                // We use single quotes in the URL to avoid escaping double quotes inside if possible, 
                // but encodeURIComponent escapes ' as %27 so it should be fine.
                const encoded = encodeURIComponent(serialized)
                    .replace(/'/g, '%27')
                    .replace(/"/g, '%22');

                cssContent += `.icon-${icon.name} {
    -webkit-mask-image: url("data:image/svg+xml,${encoded}");
    mask-image: url("data:image/svg+xml,${encoded}");
}\n`;
            }
        });

        const blob = new Blob([cssContent], {type: 'text/css'});
        this.triggerDownload(blob, 'icons.css');
    }
}
