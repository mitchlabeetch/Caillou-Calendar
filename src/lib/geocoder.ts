/**
 * OpenStreetMap preview URL.
 *
 * Returns an embeddable map image (staticmap style) for a free-text
 * location. No API key required — OSM tiles are public. Falls back
 * to a search URL when geocoding fails.
 */

const OVERPASS = 'https://nominatim.openstreetmap.org/search';

export interface MapPreview {
  lat: number;
  lon: number;
  embedUrl: string;
  staticImageUrl: string;
  label: string;
}

export async function geocodeLocation(query: string): Promise<MapPreview | null> {
  if (!query || query.trim().length < 2) return null;
  try {
    const url = `${OVERPASS}?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': navigator.language ?? 'en' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const first = data[0];
    if (!first) return null;
    const lat = parseFloat(first.lat);
    const lon = parseFloat(first.lon);
    return {
      lat,
      lon,
      label: first.display_name,
      embedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lon}`,
      staticImageUrl: `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=14&size=400x200&markers=${lat},${lon},red`,
    };
  } catch {
    return null;
  }
}