import { describe, it, expect } from 'vitest';
import { deadlineInfo, humanDaysLeft, programDeadlines } from './deadlines';
import { buildIcs } from './ics';

describe('deadlineInfo', () => {
  const now = new Date('2026-09-07');
  it('просрочено — отрицательные дни, статус overdue', () => {
    const r = deadlineInfo('2026-08-01', now);
    expect(r.daysLeft).toBeLessThan(0);
    expect(r.status).toBe('overdue');
  });
  it('в пределах 30 дней — soon', () => {
    expect(deadlineInfo('2026-09-20', now).status).toBe('soon');
  });
  it('31–90 дней — upcoming', () => {
    expect(deadlineInfo('2026-11-01', now).status).toBe('upcoming');
  });
  it('дальше 90 дней — far', () => {
    expect(deadlineInfo('2027-06-01', now).status).toBe('far');
  });
  it('сегодня — 0 дней', () => {
    expect(deadlineInfo('2026-09-07', now).daysLeft).toBe(0);
  });
});

describe('humanDaysLeft', () => {
  it('форматирует прошлое/настоящее/будущее', () => {
    expect(humanDaysLeft(0)).toBe('сегодня');
    expect(humanDaysLeft(5)).toBe('через 5 дн.');
    expect(humanDaysLeft(-3)).toBe('просрочено 3 дн. назад');
  });
});

describe('programDeadlines', () => {
  it('берёт льготы с validUntil и сортирует по дате', () => {
    const list = programDeadlines(new Date('2026-09-07'));
    expect(list.length).toBeGreaterThan(0);
    for (let i = 1; i < list.length; i++) {
      expect(list[i - 1].date <= list[i].date).toBe(true);
    }
    // Семейная ипотека (до 2030) и выплата 450к (до 2031) должны присутствовать.
    const ids = list.map((d) => d.id);
    expect(ids).toContain('family-mortgage');
    expect(ids).toContain('mortgage-payoff-450k');
  });
});

describe('buildIcs', () => {
  it('формирует валидный VCALENDAR с событием и напоминанием', () => {
    const ics = buildIcs([{ uid: 'x1', title: 'Подать на 450к', date: '2027-06-01', description: 'через банк' }]);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART;VALUE=DATE:20270601');
    expect(ics).toContain('SUMMARY:Подать на 450к');
    expect(ics).toContain('TRIGGER:-P7D'); // напоминание за 7 дней
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('\r\n'); // CRLF по RFC 5545
  });
  it('экранирует запятые и точки с запятой', () => {
    const ics = buildIcs([{ uid: 'x2', title: 'A, B; C', date: '2027-01-01' }]);
    expect(ics).toContain('SUMMARY:A\\, B\\; C');
  });
});
