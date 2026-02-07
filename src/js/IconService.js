import { CONFIG } from './constants.js';

export class IconService {
    /**
     * Fetches metadata and then all SVG contents.
     * @returns {Promise<Array>} Array of icon objects with {name, path, tags, markup}.
     */
    static async fetchLibrary() {
        try {
            const getPath = (p) => CONFIG.BASE_PATH ? `${CONFIG.BASE_PATH}/${p}`.replace('//', '/') : p;

            // Fetch metadata relative to the project root
            const metadataUrl = getPath('icons/_metadata.json');
            console.log(`[IconService] Fetching metadata: ${metadataUrl}`);
            
            const response = await fetch(metadataUrl);
            if (!response.ok) {
                throw new Error(`Metadata fetch failed: ${response.status} ${response.statusText}`);
            }
            
            const metadata = await response.json();

            const fetchPromises = metadata.map(async (item) => {
                try {
                    const svgRes = await fetch(getPath(item.path));
                    if (!svgRes.ok) return null;
                    const markup = await svgRes.text();
                    return { ...item, markup };
                } catch (e) {
                    console.error(`[IconService] Failed to load SVG for ${item.name}`, e);
                    return null;
                }
            });

            const results = await Promise.all(fetchPromises);
            const collection = results.filter(i => i !== null);
            
            if (collection.length === 0) {
                throw new Error('No icons found in remote path');
            }

            return collection;
        } catch (error) {
            console.error('[IconService] Error:', error);
            throw error;
        }
    }
}
