import { describe, it, expect } from 'vitest';
import { calcPrice } from './priceCalc';

describe('calcPrice', () => {
  it('вычитает свои средства, маткапитал и субсидии из суммы кредита', () => {
    const r = calcPrice({
      price: 6_000_000,
      ownFunds: 1_000_000,
      maternityCapital: 630_000,
      upfrontSubsidies: 0,
      ratePct: 6,
      termMonths: 240,
      scheme: 'annuity',
    });
    expect(r.downPayment).toBe(1_630_000);
    expect(r.loanAmount).toBe(4_370_000);
    expect(r.monthlyPayment).toBeGreaterThan(0);
  });

  it('выплата 450к после сделки уменьшает переплату (учтена как досрочка)', () => {
    const withoutPayoff = calcPrice({
      price: 5_000_000,
      ownFunds: 1_000_000,
      maternityCapital: 0,
      upfrontSubsidies: 0,
      ratePct: 6,
      termMonths: 240,
      scheme: 'annuity',
    });
    const withPayoff = calcPrice({
      price: 5_000_000,
      ownFunds: 1_000_000,
      maternityCapital: 0,
      upfrontSubsidies: 0,
      ratePct: 6,
      termMonths: 240,
      scheme: 'annuity',
      postDealPayoff: { amount: 450_000, month: 13 },
    });
    expect(withPayoff.totalInterest).toBeLessThan(withoutPayoff.totalInterest);
    expect(withPayoff.postDealPayoff).toBe(450_000);
  });

  it('первый взнос 0 при цене 0 не ломает процент', () => {
    const r = calcPrice({
      price: 0,
      ownFunds: 0,
      maternityCapital: 0,
      upfrontSubsidies: 0,
      ratePct: 6,
      termMonths: 240,
      scheme: 'annuity',
    });
    expect(r.downPaymentPct).toBe(0);
    expect(r.loanAmount).toBe(0);
  });
});
