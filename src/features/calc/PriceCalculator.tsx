import { useMemo, useState } from 'react';
import { Button, Field, NumberInput, Select, Stat } from '../../components/ui';
import { calcPrice, type PriceResult } from '../../lib/priceCalc';
import type { PaymentScheme } from '../../lib/mortgage';
import { formatRub, formatTerm } from '../../lib/format';
import type { Family } from '../../types';

export interface Scenario {
  id: string;
  name: string;
  ownFunds: number;
  maternityCapital: number;
  upfrontSubsidies: number;
  ratePct: number;
  termYears: number;
  scheme: PaymentScheme;
  usePayoff450: boolean;
  payoffMonth: number;
}

function makeScenario(name: string, family: Family, ratePct: number): Scenario {
  return {
    id: Math.random().toString(36).slice(2, 8),
    name,
    ownFunds: family.ownFunds,
    maternityCapital: family.hasMaternityCapital ? family.maternityCapitalAmount : 0,
    upfrontSubsidies: 0,
    ratePct,
    termYears: 20,
    scheme: 'annuity',
    usePayoff450: false,
    payoffMonth: 13,
  };
}

function run(price: number, s: Scenario): PriceResult {
  return calcPrice({
    price,
    ownFunds: s.ownFunds,
    maternityCapital: s.maternityCapital,
    upfrontSubsidies: s.upfrontSubsidies,
    ratePct: s.ratePct,
    termMonths: s.termYears * 12,
    scheme: s.scheme,
    postDealPayoff: s.usePayoff450 ? { amount: 450_000, month: s.payoffMonth } : undefined,
  });
}

/** onResult — отдаёт наружу первый (базовый) сценарий для финплана. */
export default function PriceCalculator({
  price,
  family,
  onBaseResult,
}: {
  price: number;
  family: Family;
  onBaseResult?: (r: PriceResult, ratePct: number, termMonths: number) => void;
}) {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    { ...makeScenario('Семейная ипотека 6%', family, 6) },
    { ...makeScenario('Без льготы 18%', family, 18) },
  ]);

  const results = useMemo(() => scenarios.map((s) => ({ s, r: run(price, s) })), [scenarios, price]);

  // Отдаём базовый сценарий наружу (для финплана) — через ключ пересчёта.
  const base = results[0];
  useMemo(() => {
    if (base && onBaseResult) onBaseResult(base.r, base.s.ratePct, base.s.termYears * 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base?.r.loanAmount, base?.r.monthlyPayment]);

  const update = (id: string, patch: Partial<Scenario>) =>
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const addScenario = () =>
    setScenarios((prev) => (prev.length >= 3 ? prev : [...prev, makeScenario('Сценарий', family, 6)]));
  const removeScenario = (id: string) => setScenarios((prev) => prev.filter((s) => s.id !== id));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {results.map(({ s, r }) => (
          <div key={s.id} className="rounded-xl border border-slate-200 p-4">
            <input
              value={s.name}
              onChange={(e) => update(s.id, { name: e.target.value })}
              className="mb-3 w-full border-b border-transparent text-sm font-semibold text-slate-800 outline-none focus:border-brand-300"
            />
            <div className="space-y-2">
              <Field label="Ставка, % годовых"><NumberInput value={s.ratePct} onChange={(v) => update(s.id, { ratePct: v })} /></Field>
              <Field label="Срок, лет"><NumberInput value={s.termYears} onChange={(v) => update(s.id, { termYears: v })} /></Field>
              <Field label="Свои средства, ₽"><NumberInput value={s.ownFunds} onChange={(v) => update(s.id, { ownFunds: v })} /></Field>
              <Field label="Маткапитал, ₽"><NumberInput value={s.maternityCapital} onChange={(v) => update(s.id, { maternityCapital: v })} /></Field>
              <Field label="Разовые субсидии, ₽"><NumberInput value={s.upfrontSubsidies} onChange={(v) => update(s.id, { upfrontSubsidies: v })} /></Field>
              <Field label="Схема">
                <Select value={s.scheme} onChange={(v) => update(s.id, { scheme: v as PaymentScheme })}>
                  <option value="annuity">Аннуитет</option>
                  <option value="differentiated">Дифференцированная</option>
                </Select>
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={s.usePayoff450} onChange={(e) => update(s.id, { usePayoff450: e.target.checked })} />
                Выплата 450 000 ₽ после сделки
              </label>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat label="Первый взнос" value={formatRub(r.downPayment)} sub={`${r.downPaymentPct}%`} />
              <Stat label="Сумма кредита" value={formatRub(r.loanAmount)} />
              <Stat label="Платёж/мес" value={formatRub(r.monthlyPayment)} />
              <Stat label="Переплата" value={formatRub(r.totalInterest)} />
              <Stat label="Срок факт." value={formatTerm(r.actualTermMonths)} />
              <Stat label="Полная стоимость" value={formatRub(r.totalCost)} />
            </div>
            {scenarios.length > 1 && (
              <Button variant="ghost" onClick={() => removeScenario(s.id)} className="mt-2">Удалить сценарий</Button>
            )}
          </div>
        ))}
      </div>
      {scenarios.length < 3 && <Button variant="secondary" onClick={addScenario}>+ Добавить сценарий сравнения</Button>}
    </div>
  );
}
