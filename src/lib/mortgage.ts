// Ипотечные расчёты: ежемесячный платёж (аннуитет / дифференцированный),
// полный график погашения с учётом досрочных гашений (в т.ч. из субсидий).
// Все суммы в рублях, ставка — годовая в % (6 = 6%).

export type PaymentScheme = 'annuity' | 'differentiated';

/** Досрочное гашение: в месяце `month` в счёт основного долга вносится `amount` ₽.
 *  Используется, например, для выплаты 450 000 ₽ после определённого события (§3.4). */
export interface Prepayment {
  month: number; // порядковый номер месяца (1 = первый платёж)
  amount: number;
  label?: string;
}

export interface ScheduleRow {
  month: number;
  payment: number; // всего заплачено в этом месяце (регулярный платёж + досрочное)
  principal: number; // сколько ушло в тело долга
  interest: number; // сколько ушло в проценты
  prepayment: number; // досрочное гашение в этом месяце
  balance: number; // остаток долга после платежа
}

export interface ScheduleResult {
  rows: ScheduleRow[];
  monthlyPayment: number; // регулярный платёж (для аннуитета — константа)
  totalInterest: number;
  totalPaid: number;
  actualTermMonths: number; // фактический срок с учётом досрочек
}

/** Аннуитетный платёж: A = P * i / (1 - (1+i)^-n). При нулевой ставке — P/n. */
export function annuityPayment(principal: number, annualRatePct: number, termMonths: number): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  const i = annualRatePct / 100 / 12;
  if (i === 0) return principal / termMonths;
  const factor = Math.pow(1 + i, -termMonths);
  return (principal * i) / (1 - factor);
}

/** Полный график погашения. При досрочных гашениях срок аннуитета сокращается
 *  (платёж остаётся прежним — самый частый выбор заёмщика). */
export function buildSchedule(
  principal: number,
  annualRatePct: number,
  termMonths: number,
  scheme: PaymentScheme = 'annuity',
  prepayments: Prepayment[] = [],
): ScheduleResult {
  const i = annualRatePct / 100 / 12;
  const prepayByMonth = new Map<number, number>();
  for (const p of prepayments) {
    prepayByMonth.set(p.month, (prepayByMonth.get(p.month) ?? 0) + p.amount);
  }

  const rows: ScheduleRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPaid = 0;

  const regular = scheme === 'annuity' ? annuityPayment(principal, annualRatePct, termMonths) : 0;
  const fixedPrincipal = scheme === 'differentiated' ? principal / termMonths : 0;

  let month = 0;
  // Ограничитель на случай, если платёж не покрывает проценты (защита от бесконечного цикла).
  const maxMonths = termMonths + 12;
  while (balance > 0.005 && month < maxMonths) {
    month += 1;
    const interest = balance * i;

    let scheduledPayment: number;
    if (scheme === 'annuity') {
      scheduledPayment = Math.min(regular, balance + interest);
    } else {
      scheduledPayment = Math.min(fixedPrincipal + interest, balance + interest);
    }

    let principalPart = scheduledPayment - interest;
    if (principalPart < 0) principalPart = 0; // платёж не покрывает проценты
    balance -= principalPart;

    // Досрочное гашение — целиком в тело долга.
    let prepay = prepayByMonth.get(month) ?? 0;
    if (prepay > balance) prepay = balance;
    balance -= prepay;

    const paidThisMonth = scheduledPayment + prepay;
    totalInterest += interest;
    totalPaid += paidThisMonth;

    rows.push({
      month,
      payment: round2(paidThisMonth),
      principal: round2(principalPart + prepay),
      interest: round2(interest),
      prepayment: round2(prepay),
      balance: round2(Math.max(balance, 0)),
    });
  }

  return {
    rows,
    monthlyPayment: round2(scheme === 'annuity' ? regular : fixedPrincipal + principal * i),
    totalInterest: round2(totalInterest),
    totalPaid: round2(totalPaid),
    actualTermMonths: rows.length,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
