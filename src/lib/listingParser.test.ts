import { describe, it, expect } from 'vitest';
import {
  decodeImportPayload,
  encodeImportPayload,
  extractFromHtml,
  parseArea,
  parseListingText,
  parsePrice,
  parseRooms,
  type ImportedListing,
} from './listingParser';

describe('текстовые эвристики', () => {
  it('цена с разделителями и ₽', () => {
    expect(parsePrice('Цена: 7 200 000 ₽')).toBe(7_200_000);
  });
  it('цена в млн', () => {
    expect(parsePrice('7,2 млн руб')).toBe(7_200_000);
  });
  it('площадь в м²', () => {
    expect(parseArea('Общая площадь 78 м²')).toBe(78);
  });
  it('комнаты', () => {
    expect(parseRooms('3-комн. квартира')).toBe(3);
    expect(parseRooms('Студия 25 м²')).toBe(1);
  });
  it('parseListingText собирает несколько полей', () => {
    const r = parseListingText('3-комн. квартира, 78 м²\nЦена 7 200 000 ₽, новостройка ЖК Академ');
    expect(r.rooms).toBe(3);
    expect(r.area).toBe(78);
    expect(r.price).toBe(7_200_000);
    expect(r.market).toBe('new');
    expect(r.housingType).toBe('apartment');
  });
});

describe('extractFromHtml', () => {
  it('читает JSON-LD (schema.org Offer)', () => {
    const html = `<html><head>
      <script type="application/ld+json">${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: '2-к квартира в Иркутске',
        image: ['https://example.com/photo.jpg'],
        offers: { '@type': 'Offer', price: '6500000', priceCurrency: 'RUB' },
        floorSize: { value: 54 },
        numberOfRooms: 2,
        address: { streetAddress: 'ул. Ленина 1', addressLocality: 'Иркутск' },
      })}</script>
      </head><body></body></html>`;
    const r = extractFromHtml(html);
    expect(r.title).toContain('квартира');
    expect(r.price).toBe(6_500_000);
    expect(r.photoUrl).toBe('https://example.com/photo.jpg');
    expect(r.area).toBe(54);
    expect(r.rooms).toBe(2);
    expect(r.address).toContain('Иркутск');
  });

  it('падает обратно на OpenGraph', () => {
    const html = `<html><head>
      <meta property="og:title" content="Дом 120 м² в Иркутском районе" />
      <meta property="og:image" content="https://example.com/house.jpg" />
      <meta property="product:price:amount" content="6500000" />
      </head><body>Продаётся дом, ИЖС</body></html>`;
    const r = extractFromHtml(html);
    expect(r.title).toContain('Дом');
    expect(r.price).toBe(6_500_000);
    expect(r.photoUrl).toBe('https://example.com/house.jpg');
    expect(r.housingType).toBe('house');
  });
});

describe('payload encode/decode', () => {
  it('round-trip сохраняет данные (в т.ч. кириллицу)', () => {
    const listing: ImportedListing = {
      title: 'Квартира в Иркутске',
      price: 7_200_000,
      address: 'ул. Академическая, Иркутск',
      area: 78,
      rooms: 3,
      housingType: 'apartment',
      market: 'new',
      sourceUrl: 'https://example.com/1',
    };
    const encoded = encodeImportPayload(listing);
    expect(encoded).not.toMatch(/[+/=]/); // base64url без спецсимволов
    expect(decodeImportPayload(encoded)).toEqual(listing);
  });

  it('невалидный payload → null', () => {
    expect(decodeImportPayload('не-base64-@#')).toBeNull();
  });
});
