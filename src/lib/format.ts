// Форматирование денег, процентов и сроков — единообразно по всему приложению.

const rub = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

export function formatRub(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return rub.format(Math.round(value));
}

export function formatPct(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${value}%`;
}

/** Срок в месяцах → «X лет Y мес». */
export function formatTerm(months: number): string {
  if (months <= 0) return '0 мес';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${plural(years, 'год', 'года', 'лет')}`);
  if (rest > 0) parts.push(`${rest} мес`);
  return parts.join(' ') || '0 мес';
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
