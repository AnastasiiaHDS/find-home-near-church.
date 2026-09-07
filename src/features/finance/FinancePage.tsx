import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge, Card, DisclaimerBanner, Field, NumberInput, Select, Stat } from '../../components/ui';
import { useFamilyStore } from '../../store/familyStore';
import { buildSchedule, type PaymentScheme } from '../../lib/mortgage';
import { buildStressScenarios, calcDebtBurden } from '../../lib/financePlan';
import { formatRub, formatTerm } from '../../lib/format';

export default function FinancePage() {
  const family = useFamilyStore((s) => s.family);
  const setFamily = useFamilyStore((s) => s.setFamily);

  const [loanAmount, setLoanAmount] = useState(4_000_000);
  const [ratePct, setRatePct] = useState(6);
  const [termYears, setTermYears] = useState(20);
  const [scheme, setScheme] = useState<PaymentScheme>('annuity');
  const [prepayAmount, setPrepayAmount] = useState(0);
  const [prepayMonth, setPrepayMonth] = useState(13);

  const termMonths = termYears * 12;

  const schedule = useMemo(
    () =>
      buildSchedule(loanAmount, ratePct, termMonths, scheme, prepayAmount > 0 ? [{ month: prepayMonth, amount: prepayAmount }] : []),
    [loanAmount, ratePct, termMonths, scheme, prepayAmount, prepayMonth],
  );

  const burden = useMemo(
    () =>
      calcDebtBurden({
        monthlyIncome: family.monthlyIncome,
        existingLoansPayment: family.existingLoansPayment,
        newLoanPayment: schedule.monthlyPayment,
        maxDebtBurdenPct: family.maxDebtBurdenPct,
      }),
    [family, schedule.monthlyPayment],
  );

  const stress = useMemo(
    () =>
      buildStressScenarios({
        loanAmount,
        ratePct,
        termMonths,
        monthlyIncome: family.monthlyIncome,
        existingLoansPayment: family.existingLoansPayment,
        maxDebtBurdenPct: family.maxDebtBurdenPct,
      }),
    [loanAmount, ratePct, termMonths, family],
  );

  // Данные графика: остаток долга по годам (берём каждый 12-й месяц).
  const balanceByYear = schedule.rows
    .filter((r) => r.month % 12 === 0 || r.month === schedule.rows.length)
    .map((r) => ({ year: Math.ceil(r.month / 12), balance: r.balance }));

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <Card title="Параметры кредита и график платежей">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Сумма кредита, ₽"><NumberInput value={loanAmount} onChange={setLoanAmount} /></Field>
          <Field label="Ставка, % годовых"><NumberInput value={ratePct} onChange={setRatePct} /></Field>
          <Field label="Срок, лет"><NumberInput value={termYears} onChange={setTermYears} /></Field>
          <Field label="Схема">
            <Select value={scheme} onChange={(v) => setScheme(v as PaymentScheme)}>
              <option value="annuity">Аннуитет</option>
              <option value="differentiated">Дифференцированная</option>
            </Select>
          </Field>
          <Field label="Досрочное гашение, ₽" hint="напр. субсидия 450 000 ₽"><NumberInput value={prepayAmount} onChange={setPrepayAmount} /></Field>
          <Field label="…в месяце №"><NumberInput value={prepayMonth} onChange={setPrepayMonth} /></Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Платёж/мес" value={formatRub(schedule.monthlyPayment)} />
          <Stat label="Переплата" value={formatRub(schedule.totalInterest)} />
          <Stat label="Всего выплат" value={formatRub(schedule.totalPaid)} />
          <Stat label="Срок факт." value={formatTerm(schedule.actualTermMonths)} />
        </div>

        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceByYear} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="year" tickFormatter={(y) => `${y} г.`} fontSize={12} />
              <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}М`} fontSize={12} />
              <Tooltip formatter={(v: number) => formatRub(v)} labelFormatter={(y) => `Год ${y}`} />
              <Line type="monotone" dataKey="balance" name="Остаток долга" stroke="#1f57db" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Долговая нагрузка семьи">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Доход семьи, ₽/мес"><NumberInput value={family.monthlyIncome} onChange={(v) => setFamily({ monthlyIncome: v })} /></Field>
          <Field label="Текущие кредиты, ₽/мес"><NumberInput value={family.existingLoansPayment} onChange={(v) => setFamily({ existingLoansPayment: v })} /></Field>
          <Field label="Порог нагрузки, %"><NumberInput value={family.maxDebtBurdenPct} onChange={(v) => setFamily({ maxDebtBurdenPct: v })} /></Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge tone={burden.withinLimit ? 'green' : 'red'}>
            Нагрузка {burden.burdenPct}% {burden.withinLimit ? '— в пределах порога' : '— превышает порог'}
          </Badge>
          <span className="text-sm text-slate-500">
            Платежи по кредитам: {formatRub(burden.totalPayments)} · банк ориентировочно одобрит платёж до {formatRub(burden.maxAllowedPayment)} · свободно после платежей: {formatRub(burden.freeAfterPayments)}
          </span>
        </div>
      </Card>

      <Card title="Стресс-сценарии">
        <p className="mb-3 text-sm text-slate-500">Что будет с нагрузкой при росте ставки или падении дохода (§3.5).</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stress} margin={{ top: 8, right: 16, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="label" fontSize={11} angle={-15} textAnchor="end" interval={0} height={60} />
              <YAxis tickFormatter={(v) => `${v}%`} fontSize={12} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
              <Bar dataKey="burdenPct" name="Долговая нагрузка, %">
                {stress.map((s, i) => (
                  <Cell key={i} fill={s.withinLimit ? '#16a34a' : '#dc2626'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {stress.map((s, i) => (
            <Stat key={i} label={s.label} value={`${s.burdenPct}%`} sub={`платёж ${formatRub(s.newLoanPayment)} · ${s.withinLimit ? 'ок' : 'риск'}`} />
          ))}
        </div>
      </Card>
    </div>
  );
}
