// Логика дедлайнов и напоминаний (§8 ТЗ). Без бэкенда: статусы считаются от текущей даты,
// программные дедлайны берутся из базы льгот (поле validUntil).
import { allBenefits } from './benefitsEngine';

export type DeadlineStatus = 'overdue' | 'soon' | 'upcoming' | 'far';

export interface DeadlineInfo {
  daysLeft: number; // может быть отрицательным (просрочено)
  status: DeadlineStatus;
}

const DAY = 1000 * 60 * 60 * 24;

/** Кол-во дней до даты (по календарным дням, без учёта времени) и статус. */
export function deadlineInfo(dateIso: string, now: Date = new Date()): DeadlineInfo {
  const target = new Date(dateIso);
  const t0 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const t1 = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const daysLeft = Math.round((t1 - t0) / DAY);
  let status: DeadlineStatus;
  if (daysLeft < 0) status = 'overdue';
  else if (daysLeft <= 30) status = 'soon';
  else if (daysLeft <= 90) status = 'upcoming';
  else status = 'far';
  return { daysLeft, status };
}

export interface ProgramDeadline {
  id: string;
  title: string;
  date: string; // ISO
  note?: string;
  sourceUrl?: string;
  info: DeadlineInfo;
}

/** Дедлайны программ поддержки — из льгот с заданным validUntil. Отсортированы по дате. */
export function programDeadlines(now: Date = new Date()): ProgramDeadline[] {
  return allBenefits()
    .filter((b) => Boolean(b.validUntil))
    .map((b) => ({
      id: b.id,
      title: `${b.name} — действует до`,
      date: b.validUntil as string,
      note: b.note,
      sourceUrl: b.sourceUrl,
      info: deadlineInfo(b.validUntil as string, now),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const STATUS_LABEL: Record<DeadlineStatus, string> = {
  overdue: 'Просрочено',
  soon: 'Скоро (≤30 дн.)',
  upcoming: 'Приближается',
  far: 'Есть время',
};

export const STATUS_TONE: Record<DeadlineStatus, 'red' | 'amber' | 'brand' | 'slate'> = {
  overdue: 'red',
  soon: 'amber',
  upcoming: 'brand',
  far: 'slate',
};

/** Человекочитаемо: «через N дн.» / «просрочено N дн. назад» / «сегодня». */
export function humanDaysLeft(daysLeft: number): string {
  if (daysLeft === 0) return 'сегодня';
  if (daysLeft > 0) return `через ${daysLeft} дн.`;
  return `просрочено ${Math.abs(daysLeft)} дн. назад`;
}
