// Движок применимости льгот (§3.3 ТЗ): сопоставляет параметры семьи и объекта
// с условиями каждой льготы, формирует статус, причины и предупреждения.
import type { Benefit, BenefitEvaluation, ApplicabilityStatus } from '../data/benefits/schema';
import { isStale } from '../data/benefits/schema';
import federal from '../data/benefits/federal.json';
import irkutsk from '../data/benefits/irkutsk.json';
import type { Family, Property } from '../types';

const ALL_BENEFITS: Benefit[] = [...(federal as Benefit[]), ...(irkutsk as Benefit[])];

/** Все записи базы (для раздела «Справочник льгот»). */
export function allBenefits(): Benefit[] {
  return ALL_BENEFITS;
}

function childrenCount(family: Family): number {
  return family.children.length;
}

function youngestChildAge(family: Family, now: Date): number | null {
  if (family.children.length === 0) return null;
  const currentYear = now.getFullYear();
  return Math.min(...family.children.map((c) => currentYear - c.birthYear));
}

/**
 * Оценка одной льготы.
 * - status `applicable` — семья подходит (объект не задан или соответствует).
 * - status `conditional` — по семье подходит, но по объекту есть предупреждение
 *   (например, льгота «только новостройка», а объект — вторичка/дом).
 * - status `not_applicable` — семья не проходит по базовым условиям.
 */
export function evaluateBenefit(
  benefit: Benefit,
  family: Family,
  property?: Property,
  now: Date = new Date(),
): BenefitEvaluation {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const c = benefit.conditions;
  let familyEligible = true;

  if (c.regions && c.regions.length > 0 && !c.regions.includes(family.region)) {
    familyEligible = false;
    reasons.push(`Действует только в регионах: ${c.regions.join(', ')}; ваш регион — ${family.region}.`);
  }

  if (typeof c.minChildren === 'number') {
    if (childrenCount(family) >= c.minChildren) {
      reasons.push(`Детей: ${childrenCount(family)} (нужно от ${c.minChildren}).`);
    } else {
      familyEligible = false;
      reasons.push(`Нужно от ${c.minChildren} детей, у вас ${childrenCount(family)}.`);
    }
  }

  if (typeof c.childUnderAge === 'number') {
    const age = youngestChildAge(family, now);
    if (age !== null && age < c.childUnderAge) {
      reasons.push(`Есть ребёнок младше ${c.childUnderAge} лет.`);
    } else {
      familyEligible = false;
      reasons.push(`Нужен ребёнок младше ${c.childUnderAge} лет.`);
    }
  }

  if (c.requiresDisabledChild) {
    if (family.children.some((child) => child.disabled)) {
      reasons.push('Есть ребёнок-инвалид.');
    } else {
      familyEligible = false;
      reasons.push('Требуется ребёнок-инвалид.');
    }
  }

  if (c.requiresMaternityCapital) {
    if (family.hasMaternityCapital) {
      reasons.push('Материнский капитал оформлен.');
    } else {
      familyEligible = false;
      reasons.push('Требуется наличие материнского капитала.');
    }
  }

  if (c.spousesMustBeCoborrowers && family.spouses < 2) {
    warnings.push('Правило «супруги — созаёмщики»: если брак есть, второй супруг обязан быть созаёмщиком.');
  }

  // Проверки по объекту (если он передан).
  if (property) {
    if (c.newBuildOnly && property.market !== 'new') {
      warnings.push(
        'Программа рассчитана на новостройки. Для вторички/частного дома доступна не всегда — проверяйте по конкретному населённому пункту (данные ЕИСЖС).',
      );
    }
    if (c.housingType && c.housingType !== 'any' && property.housingType !== c.housingType) {
      warnings.push(`Условие по типу жилья: ${c.housingType}, а объект — ${property.housingType}.`);
    }
  }

  let status: ApplicabilityStatus;
  if (!familyEligible) status = 'not_applicable';
  else if (warnings.length > 0) status = 'conditional';
  else status = 'applicable';

  return {
    benefit,
    status,
    reasons,
    warnings,
    stale: isStale(benefit.lastVerifiedAt, now),
  };
}

/** Оценка всей базы под конкретную семью (и опционально объект). */
export function evaluateAll(family: Family, property?: Property, now: Date = new Date()): BenefitEvaluation[] {
  return ALL_BENEFITS.map((b) => evaluateBenefit(b, family, property, now)).sort((a, b) => {
    const order: Record<ApplicabilityStatus, number> = { applicable: 0, conditional: 1, not_applicable: 2 };
    return order[a.status] - order[b.status];
  });
}
