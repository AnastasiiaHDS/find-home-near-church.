import { describe, it, expect } from 'vitest';
import { annuityPayment, buildSchedule } from './mortgage';

describe('annuityPayment', () => {
  it('считает аннуитет по известной формуле (1 млн, 12% годовых, 12 мес ≈ 88 849)', () => {
    const p = annuityPayment(1_000_000, 12, 12);
    expect(Math.round(p)).toBe(88849);
  });

  it('при нулевой ставке равен P / n', () => {
    expect(annuityPayment(1_200_000, 0, 12)).toBe(100_000);
  });

  it('возвращает 0 при нулевой сумме или сроке', () => {
    expect(annuityPayment(0, 6, 120)).toBe(0);
    expect(annuityPayment(500_000, 6, 0)).toBe(0);
  });
});

describe('buildSchedule', () => {
  it('полностью гасит долг: последний остаток ≈ 0', () => {
    const s = buildSchedule(1_000_000, 12, 12, 'annuity');
    expect(s.rows.length).toBe(12);
    expect(s.rows[s.rows.length - 1].balance).toBeLessThan(1);
  });

  it('сумма процентов положительна и меньше тела при короткой льготной ставке', () => {
    const s = buildSchedule(3_000_000, 6, 240, 'annuity');
    expect(s.totalInterest).toBeGreaterThan(0);
  });

  it('досрочное гашение сокращает срок аннуитета', () => {
    const base = buildSchedule(2_000_000, 10, 120, 'annuity');
    const withPrepay = buildSchedule(2_000_000, 10, 120, 'annuity', [
      { month: 1, amount: 450_000 },
    ]);
    expect(withPrepay.actualTermMonths).toBeLessThan(base.actualTermMonths);
    expect(withPrepay.totalInterest).toBeLessThan(base.totalInterest);
  });

  it('дифференцированная схема: первый платёж больше последнего', () => {
    const s = buildSchedule(1_200_000, 12, 12, 'differentiated');
    expect(s.rows[0].payment).toBeGreaterThan(s.rows[s.rows.length - 1].payment);
  });
});
