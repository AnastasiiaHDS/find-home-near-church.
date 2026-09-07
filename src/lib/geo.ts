// Гео-утилиты: расстояние между точками и оценка близости к якорным адресам (§3.1).
import type { Anchor } from '../types';

/** Расстояние по формуле гаверсинуса, км. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // радиус Земли, км
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface AnchorDistance {
  anchor: Anchor;
  distanceKm: number;
  withinRadius: boolean;
}

/** Расстояния от объекта до каждого якоря + взвешенная оценка близости.
 *  Чем ближе к важным (большой вес) якорям — тем выше score (0..100). */
export function evaluateAnchors(
  lat: number,
  lon: number,
  anchors: Anchor[],
  radiusKm: number,
): { distances: AnchorDistance[]; score: number } {
  const distances = anchors.map((anchor) => {
    const distanceKm = Math.round(haversineKm(lat, lon, anchor.lat, anchor.lon) * 100) / 100;
    return { anchor, distanceKm, withinRadius: distanceKm <= radiusKm };
  });

  const totalWeight = anchors.reduce((s, a) => s + a.weight, 0);
  if (totalWeight === 0) return { distances, score: 0 };

  // Вклад каждого якоря: 1 в центре радиуса, линейно падает до 0 на границе (и дальше 0).
  const weighted = distances.reduce((s, d) => {
    const proximity = Math.max(0, 1 - d.distanceKm / radiusKm);
    return s + proximity * d.anchor.weight;
  }, 0);

  return { distances, score: Math.round((weighted / totalWeight) * 100) };
}
