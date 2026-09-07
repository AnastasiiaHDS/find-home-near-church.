// Разбор объявлений (Этап 4 ТЗ). Работает без бэкенда:
//  - extractFromHtml — из HTML-строки (вставленной вручную) через DOMParser: JSON-LD + OpenGraph + текст;
//  - parseListingText — из простого текста объявления (эвристики по регэкспам);
//  - encode/decodeImportPayload — упаковка данных в URL-хэш для букмарлета.
// Массового парсинга нет: только одна страница, инициированная пользователем.
import type { HousingType, MarketType, Property } from '../types';

/** Импортированные из объявления поля — все опциональны (что нашли, то нашли). */
export interface ImportedListing {
  title?: string;
  price?: number;
  address?: string;
  area?: number;
  rooms?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  housingType?: HousingType;
  market?: MarketType;
  photoUrl?: string;
  sourceUrl?: string;
}

// ---------- Текстовые эвристики ----------

/** Цена: «7 200 000 ₽», «7200000 руб», «7,2 млн ₽». Берём первое правдоподобное число. */
export function parsePrice(text: string): number | undefined {
  const mln = text.match(/(\d+(?:[.,]\d+)?)\s*млн/i);
  if (mln) {
    const v = parseFloat(mln[1].replace(',', '.')) * 1_000_000;
    if (v > 0) return Math.round(v);
  }
  // Число с разделителями тысяч (пробел/неразрывный пробел), рядом ₽/руб.
  const m = text.match(/(\d[\d\s  ]{5,})\s*(?:₽|руб|р\.)/i);
  if (m) {
    const v = Number(m[1].replace(/[\s  ]/g, ''));
    if (v >= 100_000) return v;
  }
  return undefined;
}

export function parseArea(text: string): number | undefined {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(?:м²|кв\.?\s?м|m2)/i);
  if (m) {
    const v = parseFloat(m[1].replace(',', '.'));
    if (v > 0 && v < 100000) return v;
  }
  return undefined;
}

export function parseRooms(text: string): number | undefined {
  if (/студи/i.test(text)) return 1;
  const m = text.match(/(\d+)\s*-?\s*(?:комн|к\.|ккв|-к\b)/i);
  if (m) {
    const v = Number(m[1]);
    if (v >= 1 && v <= 10) return v;
  }
  return undefined;
}

export function parseYear(text: string): number | undefined {
  const m = text.match(/(?:год постройки|построен[а]?)[^\d]{0,10}(\d{4})/i);
  if (m) {
    const v = Number(m[1]);
    if (v >= 1900 && v <= new Date().getFullYear() + 5) return v;
  }
  return undefined;
}

function guessHousingType(text: string): HousingType | undefined {
  // \b в JS-регэкспах не работает с кириллицей — используем явные границы (не-буква/край строки).
  const t = ' ' + text.toLowerCase() + ' ';
  if (/(коттедж|таунхаус)/.test(t) || /[^а-яё]дом[^а-яё]/.test(t)) return 'house';
  if (/(квартир|студи|апартамент)/.test(t)) return 'apartment';
  return undefined;
}

function guessMarket(text: string): MarketType | undefined {
  const t = ' ' + text.toLowerCase() + ' ';
  if (/(новостройк|новый дом|сдача|жилой комплекс)/.test(t) || /[^а-яё]жк[^а-яё]/.test(t)) return 'new';
  if (/вторичк|вторичн/.test(t)) return 'secondary';
  return undefined;
}

/** Разбор из свободного текста объявления. */
export function parseListingText(text: string): ImportedListing {
  const cleaned = text.replace(/\r/g, ' ');
  const result: ImportedListing = {
    price: parsePrice(cleaned),
    area: parseArea(cleaned),
    rooms: parseRooms(cleaned),
    yearBuilt: parseYear(cleaned),
    housingType: guessHousingType(cleaned),
    market: guessMarket(cleaned),
  };
  // Заголовок — первая непустая строка.
  const firstLine = cleaned.split('\n').map((l) => l.trim()).find((l) => l.length > 0);
  if (firstLine) result.title = firstLine.slice(0, 120);
  return result;
}

// ---------- Извлечение из HTML (JSON-LD + OpenGraph) ----------

/** Достаёт числа из строк вида «7 200 000 ₽», а также из чистых чисел. */
function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^\d.]/g, ''));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

/** Рекурсивно ищет в объекте JSON-LD цену/адрес/картинку/название. */
function fromJsonLd(node: unknown, acc: ImportedListing): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((n) => fromJsonLd(n, acc));
    return;
  }
  const obj = node as Record<string, unknown>;

  if (acc.title === undefined && typeof obj.name === 'string') acc.title = obj.name.slice(0, 120);

  // offers.price / price
  const offers = obj.offers as Record<string, unknown> | undefined;
  if (acc.price === undefined) {
    acc.price = toNumber(obj.price) ?? toNumber(offers?.price) ?? toNumber(offers?.lowPrice);
  }

  // image может быть строкой, массивом или объектом ImageObject
  if (acc.photoUrl === undefined) {
    const img = obj.image;
    if (typeof img === 'string') acc.photoUrl = img;
    else if (Array.isArray(img) && typeof img[0] === 'string') acc.photoUrl = img[0] as string;
    else if (img && typeof img === 'object' && typeof (img as Record<string, unknown>).url === 'string') {
      acc.photoUrl = (img as Record<string, unknown>).url as string;
    }
  }

  // address: PostalAddress или строка
  if (acc.address === undefined) {
    const addr = obj.address;
    if (typeof addr === 'string') acc.address = addr;
    else if (addr && typeof addr === 'object') {
      const a = addr as Record<string, unknown>;
      acc.address = [a.streetAddress, a.addressLocality, a.addressRegion].filter(Boolean).join(', ') || undefined;
    }
  }

  if (acc.area === undefined) {
    const fs = obj.floorSize as Record<string, unknown> | undefined;
    acc.area = toNumber(fs?.value) ?? toNumber(obj.floorSize);
  }
  if (acc.rooms === undefined) acc.rooms = toNumber(obj.numberOfRooms);

  // Обойти вложенные объекты (mainEntity, itemOffered и т.п.)
  for (const key of ['mainEntity', 'itemOffered', 'about', 'item', '@graph']) {
    if (obj[key]) fromJsonLd(obj[key], acc);
  }
}

/** Разбор HTML-строки: JSON-LD → OpenGraph → текстовые эвристики (в порядке приоритета). */
export function extractFromHtml(html: string): ImportedListing {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const result: ImportedListing = {};

  // 1) JSON-LD
  doc.querySelectorAll('script[type="application/ld+json"]').forEach((el) => {
    try {
      fromJsonLd(JSON.parse(el.textContent || 'null'), result);
    } catch {
      /* невалидный JSON-LD — пропускаем */
    }
  });

  // 2) OpenGraph / meta
  const meta = (prop: string): string | undefined =>
    doc.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`)?.getAttribute('content') || undefined;

  if (result.title === undefined) result.title = meta('og:title')?.slice(0, 120);
  if (result.photoUrl === undefined) result.photoUrl = meta('og:image');
  if (result.price === undefined) result.price = toNumber(meta('product:price:amount') ?? meta('og:price:amount'));
  if (result.address === undefined) result.address = meta('og:street-address') ?? meta('og:locality');

  // 3) Текстовые эвристики по видимому тексту как последний резерв.
  const bodyText = doc.body?.textContent ?? '';
  const fromText = parseListingText(bodyText);
  for (const key of Object.keys(fromText) as (keyof ImportedListing)[]) {
    if (result[key] === undefined && fromText[key] !== undefined) {
      // @ts-expect-error разнотипные поля, значения совместимы по ключу
      result[key] = fromText[key];
    }
  }

  if (result.housingType === undefined) result.housingType = guessHousingType(result.title ?? bodyText);
  if (result.market === undefined) result.market = guessMarket(result.title ?? bodyText);
  return result;
}

// ---------- Payload для букмарлета (URL-хэш) ----------

/** Кодирование в base64url (безопасно для URL-хэша, поддерживает кириллицу). */
export function encodeImportPayload(listing: ImportedListing): string {
  const json = JSON.stringify(listing);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeImportPayload(param: string): ImportedListing | null {
  try {
    const b64 = param.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    const obj = JSON.parse(json);
    return obj && typeof obj === 'object' ? (obj as ImportedListing) : null;
  } catch {
    return null;
  }
}

/** Черновик объекта из импортированных данных — с безопасными дефолтами. */
export function draftFromImport(
  l: ImportedListing,
): Omit<Property, 'id' | 'createdAt' | 'checklist' | 'favorite'> {
  return {
    title: l.title || 'Объект из объявления',
    address: l.address || '',
    lat: null,
    lon: null,
    price: l.price || 0,
    housingType: l.housingType || 'apartment',
    market: l.market || 'secondary',
    area: l.area || 0,
    rooms: l.rooms || 1,
    floor: l.floor ?? null,
    totalFloors: l.totalFloors ?? null,
    yearBuilt: l.yearBuilt ?? null,
    landStatus: 'unknown',
    photoUrl: l.photoUrl || '',
    sourceUrl: l.sourceUrl || '',
    notes: '',
    floodRisk: null,
    seismicReinforced: null,
  };
}
