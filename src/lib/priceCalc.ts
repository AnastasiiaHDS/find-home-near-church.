// Калькулятор итоговой цены покупки с учётом гос. выплат (§3.4 ТЗ).
import { annuityPayment, buildSchedule, type PaymentScheme, type Prepayment } from './mortgage';

export interface PriceInput {
  price: number; // цена объекта, ₽
  ownFunds: number; // собственные средства (первый взнос), ₽
  maternityCapital: number; // маткапитал, идёт в первый взнос / уменьшение кредита, ₽
  upfrontSubsidies: number; // разовые субсидии, доступные сразу (напр. региональные), ₽
  ratePct: number; // ставка выбранной программы, % годовых
  termMonths: number; // срок кредита, мес
  scheme: PaymentScheme;
  // Выплата на погашение ипотеки ПОСЛЕ сделки (до 450 000 ₽) — уменьшает долг
  // не сразу, а в указанный месяц после события (§3.4).
  postDealPayoff?: { amount: number; month: number };
}

export interface PriceResult {
  price: number;
  downPayment: number; // итоговый первый взнос (свои + маткапитал + разовые субсидии)
  downPaymentPct: number;
  loanAmount: number; // сумма кредита
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number; // полная стоимость покупки = свои средства + всё уплаченное банку
  actualTermMonths: number;
  postDealPayoff: number; // сколько «прилетит» позже (справочно)
}

/** Основной расчёт. Маткапитал и разовые субсидии уменьшают сумму кредита сразу;
 *  выплата 450к после сделки — отдельным досрочным гашением. */
export function calcPrice(input: PriceInput): PriceResult {
  const downPayment = input.ownFunds + input.maternityCapital + input.upfrontSubsidies;
  const loanAmount = Math.max(input.price - downPayment, 0);

  const prepayments: Prepayment[] = [];
  if (input.postDealPayoff && input.postDealPayoff.amount > 0) {
    prepayments.push({
      month: input.postDealPayoff.month,
      amount: input.postDealPayoff.amount,
      label: 'Выплата на погашение ипотеки',
    });
  }

  const schedule = buildSchedule(loanAmount, input.ratePct, input.termMonths, input.scheme, prepayments);
  const monthlyPayment =
    input.scheme === 'annuity'
      ? annuityPayment(loanAmount, input.ratePct, input.termMonths)
      : schedule.monthlyPayment;

  return {
    price: input.price,
    downPayment,
    downPaymentPct: input.price > 0 ? round1((downPayment / input.price) * 100) : 0,
    loanAmount,
    monthlyPayment: Math.round(monthlyPayment),
    totalInterest: Math.round(schedule.totalInterest),
    totalCost: Math.round(input.ownFunds + schedule.totalPaid),
    actualTermMonths: schedule.actualTermMonths,
    postDealPayoff: input.postDealPayoff?.amount ?? 0,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
