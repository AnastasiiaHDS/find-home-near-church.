import { describe, it, expect } from 'vitest';
import { evaluateBenefit } from './benefitsEngine';
import type { Benefit } from '../data/benefits/schema';
import type { Family, Property } from '../types';

const familyBase: Family = {
  region: 'irkutsk',
  children: [
    { id: '1', birthYear: 2015, disabled: false },
    { id: '2', birthYear: 2018, disabled: false },
    { id: '3', birthYear: 2022, disabled: false },
  ],
  spouses: 2,
  hasMaternityCapital: true,
  maternityCapitalAmount: 630_000,
  monthlyIncome: 150_000,
  mandatoryExpenses: 60_000,
  existingLoansPayment: 0,
  ownFunds: 1_500_000,
  maxDebtBurdenPct: 50,
};

const newBuildBenefit: Benefit = {
  id: 'test-new',
  level: 'federal',
  kind: 'mortgage',
  name: 'Тестовая новостроечная',
  eligibility: '',
  benefit: '',
  sourceUrl: '',
  lastVerifiedAt: '2026-09-01',
  conditions: { newBuildOnly: true, minChildren: 3 },
  documents: [],
};

const house: Property = {
  id: 'p1',
  title: 'Дом',
  address: 'Иркутский район',
  lat: 52.2,
  lon: 104.2,
  price: 5_000_000,
  housingType: 'house',
  market: 'secondary',
  area: 120,
  rooms: 4,
  floor: null,
  totalFloors: 1,
  yearBuilt: 2010,
  landStatus: 'IZHS',
  photoUrl: '',
  sourceUrl: '',
  notes: '',
  floodRisk: null,
  seismicReinforced: null,
  favorite: false,
  checklist: [],
  createdAt: 0,
};

describe('evaluateBenefit', () => {
  it('льгота «только новостройка» для дома-вторички → conditional с предупреждением', () => {
    const ev = evaluateBenefit(newBuildBenefit, familyBase, house);
    expect(ev.status).toBe('conditional');
    expect(ev.warnings.length).toBeGreaterThan(0);
  });

  it('без объекта та же льгота применима (семья проходит по 3 детям)', () => {
    const ev = evaluateBenefit(newBuildBenefit, familyBase);
    expect(ev.status).toBe('applicable');
  });

  it('семья с 1 ребёнком не проходит порог minChildren=3', () => {
    const oneChild: Family = { ...familyBase, children: [familyBase.children[0]] };
    const ev = evaluateBenefit(newBuildBenefit, oneChild);
    expect(ev.status).toBe('not_applicable');
  });

  it('региональная льгота другого региона не применима', () => {
    const regional: Benefit = {
      ...newBuildBenefit,
      id: 'reg',
      conditions: { minChildren: 3, regions: ['moscow'] },
    };
    const ev = evaluateBenefit(regional, familyBase);
    expect(ev.status).toBe('not_applicable');
  });

  it('помечает устаревшую проверку (> 90 дней) как stale', () => {
    const old: Benefit = { ...newBuildBenefit, lastVerifiedAt: '2020-01-01' };
    const ev = evaluateBenefit(old, familyBase, undefined, new Date('2026-09-07'));
    expect(ev.stale).toBe(true);
  });
});
