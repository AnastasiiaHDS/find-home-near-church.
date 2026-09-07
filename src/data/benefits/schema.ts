// Схема базы знаний по льготам (§3.3 ТЗ).
// База — это ДАННЫЕ (JSON), не код: условия меняются 1–2 раза в год и правятся вручную.
import type { Family, Property } from '../../types';

export type BenefitLevel = 'federal' | 'regional';
export type BenefitKind = 'mortgage' | 'payout' | 'capital' | 'land' | 'other';

/** Условия применимости — все опциональны; движок проверяет только заданные. */
export interface BenefitConditions {
  newBuildOnly?: boolean; // только новостройка (критично для домов/вторички — §3.3)
  housingType?: 'apartment' | 'house' | 'any';
  minChildren?: number;
  childUnderAge?: number; // требуется ребёнок младше N лет
  requiresDisabledChild?: boolean;
  requiresMaternityCapital?: boolean;
  regions?: string[]; // коды регионов, где действует (пусто/нет = вся РФ)
  spousesMustBeCoborrowers?: boolean; // правило «супруги — созаёмщики»
}

/** Одна запись базы знаний. */
export interface Benefit {
  id: string;
  level: BenefitLevel;
  kind: BenefitKind;
  name: string;
  eligibility: string; // человекочитаемо: кто имеет право
  benefit: string; // что даёт
  amount?: number; // сумма, ₽ (если разовая/лимит)
  validUntil?: string; // ISO-дата «действует до»
  sourceUrl: string; // ссылка на источник
  lastVerifiedAt: string; // ISO-дата последней проверки актуальности
  conditions: BenefitConditions;
  documents: string[]; // чек-лист документов
  note?: string; // важные оговорки
}

export type ApplicabilityStatus = 'applicable' | 'conditional' | 'not_applicable';

export interface BenefitEvaluation {
  benefit: Benefit;
  status: ApplicabilityStatus;
  reasons: string[]; // почему подходит / не подходит
  warnings: string[]; // предупреждения (напр. «только новостройка, а объект — дом»)
  stale: boolean; // проверка старше порога (§4: > 3 мес)
}

export const STALE_THRESHOLD_DAYS = 90; // §4 ТЗ: предупреждение при просрочке > 3 месяцев

export function isStale(lastVerifiedAt: string, now: Date = new Date()): boolean {
  const verified = new Date(lastVerifiedAt).getTime();
  if (Number.isNaN(verified)) return true;
  const days = (now.getTime() - verified) / (1000 * 60 * 60 * 24);
  return days > STALE_THRESHOLD_DAYS;
}

/** Тип семьи, применимо только к семье (без объекта). */
export type { Family, Property };
