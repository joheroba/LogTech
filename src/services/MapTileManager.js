/**
 * MapTileManager.js
 * Lógica para la pre-carga de tiles de Mapbox en la Cache API.
 */

export const MAP_CACHE_NAME = 'aris-map-tiles-v1';

/**
 * Calcula los tiles necesarios para una ruta básica (bounding box simplificado).
 * @param {Array} start [lng, lat]
 * @param {Array} end [lng, lat]
 * @param {number} zoomLevel 
 */
export function getTilesInBBox(start, end, zoom) {
    const latRad = (lat) => (lat * Math.PI) / 180;
    const lon2tile = (lon, zoom) => Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
    const lat2tile = (lat, zoom) =>
        Math.floor(
            ((1 - Math.log(Math.tan(latRad(lat)) + 1 / Math.cos(latRad(lat))) / Math.PI) / 2) * Math.pow(2, zoom)
        );

    const x1 = lon2tile(Math.min(start[0], end[0]), zoom);
    const x2 = lon2tile(Math.max(start[0], end[0]), zoom);
    const y1 = lat2tile(Math.max(start[1], end[1]), zoom);
    const y2 = lat2tile(Math.min(start[1], end[1]), zoom);

    const tiles = [];
    for (let x = x1; x <= x2; x++) {
        for (let y = y1; y <= y2; y++) {
            tiles.push({ x, y, z: zoom });
        }
    }
    return tiles;
}

/**
 * Descarga y almacena los tiles en el Cache API.
 * @param {Array} tiles [{x, y, z}, ...]
 * @param {string} styleUrl 
 * @param {string} accessToken 
 * @param {Function} onProgress 
 */
export async function downloadTiles(tiles, styleUrl, accessToken, onProgress) {
    const cache = await caches.open(MAP_CACHE_NAME);
    let downloaded = 0;

    // Obtener la base de la URL de tiles de Mapbox (esto varía según el estilo)
    // Para simplificar, asumimos el endpoint estándar de tiles vectoriales
    const baseUrl = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8`;

    for (const tile of tiles) {
        const url = `${baseUrl}/${tile.z}/${tile.x}/${tile.y}.vector.pbf?access_token=${accessToken}`;

        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                downloaded++;
                onProgress(Math.round((downloaded / tiles.length) * 100));
            }
        } catch (err) {
            console.error(`Error descargando tile ${tile.z}/${tile.x}/${tile.y}:`, err);
        }
    }

    return downloaded;
}
