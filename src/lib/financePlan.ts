// Финансовый план семьи (§3.5 ТЗ): долговая нагрузка и стресс-сценарии.
import { annuityPayment } from './mortgage';

export interface DebtBurdenInput {
  monthlyIncome: number;
  existingLoansPayment: number; // текущие кредиты, ₽/мес
  newLoanPayment: number; // платёж по планируемой ипотеке, ₽/мес
  maxDebtBurdenPct: number; // настраиваемый порог, % (дефолт ~50)
}

export interface DebtBurdenResult {
  totalPayments: number; // все платежи по кредитам, ₽/мес
  burdenPct: number; // доля дохода, уходящая на кредиты, %
  maxAllowedPayment: number; // сколько банк, вероятно, одобрит по платежу
  withinLimit: boolean;
  freeAfterPayments: number; // остаётся после всех кредитов, ₽/мес
}

/** Долговая нагрузка (аналог ПДН). Банки ориентируются, чтобы платежи по кредитам
 *  не превышали ~50% дохода — порог настраиваемый (§3.5). */
export function calcDebtBurden(input: DebtBurdenInput): DebtBurdenResult {
  const totalPayments = input.existingLoansPayment + input.newLoanPayment;
  const burdenPct = input.monthlyIncome > 0 ? (totalPayments / input.monthlyIncome) * 100 : 0;
  const maxAllowedPayment = (input.monthlyIncome * input.maxDebtBurdenPct) / 100;
  return {
    totalPayments: Math.round(totalPayments),
    burdenPct: Math.round(burdenPct * 10) / 10,
    maxAllowedPayment: Math.round(maxAllowedPayment),
    withinLimit: totalPayments <= maxAllowedPayment,
    freeAfterPayments: Math.round(input.monthlyIncome - totalPayments),
  };
}

export interface StressInput {
  loanAmount: number;
  ratePct: number;
  termMonths: number;
  monthlyIncome: number;
  existingLoansPayment: number;
  maxDebtBurdenPct: number;
}

export interface StressScenario {
  label: string;
  ratePct: number;
  income: number;
  newLoanPayment: number;
  burdenPct: number;
  withinLimit: boolean;
}

/** Стресс-сценарии: рост ставки (для нефиксированных) и падение дохода (§3.5). */
export function buildStressScenarios(input: StressInput): StressScenario[] {
  const make = (label: string, ratePct: number, income: number): StressScenario => {
    const payment = annuityPayment(input.loanAmount, ratePct, input.termMonths);
    const total = input.existingLoansPayment + payment;
    const burdenPct = income > 0 ? (total / income) * 100 : 0;
    return {
      label,
      ratePct,
      income: Math.round(income),
      newLoanPayment: Math.round(payment),
      burdenPct: Math.round(burdenPct * 10) / 10,
      withinLimit: total <= (income * input.maxDebtBurdenPct) / 100,
    };
  };

  return [
    make('Базовый сценарий', input.ratePct, input.monthlyIncome),
    make('Ставка +3 п.п.', input.ratePct + 3, input.monthlyIncome),
    make('Ставка +5 п.п.', input.ratePct + 5, input.monthlyIncome),
    make('Доход −20%', input.ratePct, input.monthlyIncome * 0.8),
    make('Доход −20% и ставка +3 п.п.', input.ratePct + 3, input.monthlyIncome * 0.8),
  ];
}
