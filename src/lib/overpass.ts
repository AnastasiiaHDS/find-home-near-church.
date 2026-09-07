// Слои инфраструктуры вокруг объекта через публичный Overpass API (OSM) — §3.2.
// В сеть уходят ТОЛЬКО координаты объекта и радиус, никаких персональных данных.

export type PoiCategory = 'school' | 'kindergarten' | 'clinic' | 'shop' | 'transport' | 'park';

export interface Poi {
  id: number;
  category: PoiCategory;
  name: string;
  lat: number;
  lon: number;
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// OSM-теги для каждой категории инфраструктуры.
const CATEGORY_QUERIES: Record<PoiCategory, string> = {
  school: 'node["amenity"="school"]',
  kindergarten: 'node["amenity"="kindergarten"]',
  clinic: 'node["amenity"~"clinic|hospital|doctors"]',
  shop: 'node["shop"~"supermarket|convenience|mall"]',
  transport: 'node["public_transport"="platform"]',
  park: 'node["leisure"="park"]',
};

export const CATEGORY_LABELS: Record<PoiCategory, string> = {
  school: 'Школы',
  kindergarten: 'Детсады',
  clinic: 'Поликлиники',
  shop: 'Магазины',
  transport: 'Остановки',
  park: 'Парки',
};

/** Запрашивает POI вокруг точки в заданном радиусе (метры). */
export async function fetchPois(
  lat: number,
  lon: number,
  radiusMeters: number,
  categories: PoiCategory[],
): Promise<Poi[]> {
  const parts = categories
    .map((cat) => `${CATEGORY_QUERIES[cat]}(around:${radiusMeters},${lat},${lon});`)
    .join('\n');
  const query = `[out:json][timeout:25];(${parts});out center 200;`;

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
  const data = await res.json();

  const catByQuery = (tags: Record<string, string> | undefined): PoiCategory | null => {
    if (!tags) return null;
    if (tags.amenity === 'school') return 'school';
    if (tags.amenity === 'kindergarten') return 'kindergarten';
    if (['clinic', 'hospital', 'doctors'].includes(tags.amenity)) return 'clinic';
    if (['supermarket', 'convenience', 'mall'].includes(tags.shop)) return 'shop';
    if (tags.public_transport === 'platform') return 'transport';
    if (tags.leisure === 'park') return 'park';
    return null;
  };

  const pois: Poi[] = [];
  for (const el of data.elements ?? []) {
    const category = catByQuery(el.tags);
    if (!category) continue;
    const pLat = el.lat ?? el.center?.lat;
    const pLon = el.lon ?? el.center?.lon;
    if (typeof pLat !== 'number' || typeof pLon !== 'number') continue;
    pois.push({
      id: el.id,
      category,
      name: el.tags?.name ?? CATEGORY_LABELS[category],
      lat: pLat,
      lon: pLon,
    });
  }
  return pois;
}

/** Простая геокодировка адреса через Nominatim (OSM). Возвращает первую точку. */
export async function geocode(query: string): Promise<{ lat: number; lon: number; display: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'ru' } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name };
}
