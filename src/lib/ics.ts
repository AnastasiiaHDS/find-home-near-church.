// Генерация файла календаря (.ics, RFC 5545) — чтобы напоминания о дедлайнах
// реально приходили в календарь телефона/почты. Без бэкенда: файл собирается
// в браузере и скачивается.

export interface IcsEvent {
  uid: string;
  title: string;
  date: string; // ISO-дата (день события)
  description?: string;
}

/** Дата → YYYYMMDD (для VALUE=DATE, событие на весь день). */
function toIcsDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/** Экранирование спецсимволов в тексте по RFC 5545. */
function esc(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Собирает VCALENDAR из событий. Каждому событию — напоминание за 7 дней (VALARM). */
export function buildIcs(events: IcsEvent[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Подбор жилья//Напоминания о субсидиях//RU',
    'CALSCALE:GREGORIAN',
  ];
  for (const e of events) {
    const start = toIcsDate(e.date);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@find-home-near-church`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `SUMMARY:${esc(e.title)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    lines.push(
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(e.title)}`,
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  // RFC 5545 требует CRLF.
  return lines.join('\r\n');
}

/** Скачивание .ics как файла (работает в обычном браузере при локальном запуске). */
export function downloadIcs(events: IcsEvent[], filename = 'napominaniya.ics'): void {
  const blob = new Blob([buildIcs(events)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
