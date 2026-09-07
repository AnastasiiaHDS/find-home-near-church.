import { useMemo, useState } from 'react';
import { Card, DisclaimerBanner, Field, NumberInput, Stat } from '../../components/ui';
import { annuityPayment } from '../../lib/mortgage';
import { formatRub } from '../../lib/format';

// Упрощённый калькулятор «аренда vs ипотека» (§8).
export default function RentVsBuyPage() {
  const [rent, setRent] = useState(35_000);
  const [price, setPrice] = useState(6_000_000);
  const [down, setDown] = useState(1_500_000);
  const [ratePct, setRatePct] = useState(6);
  const [years, setYears] = useState(10);

  const result = useMemo(() => {
    const months = years * 12;
    const loan = Math.max(price - down, 0);
    const payment = annuityPayment(loan, ratePct, 240); // платёж как при 20-летней ипотеке
    const totalRent = rent * months;
    const totalMortgage = down + payment * months;
    return { payment, totalRent, totalMortgage, months };
  }, [rent, price, down, ratePct, years]);

  return (
    <div className="space-y-6">
      <DisclaimerBanner />
      <Card title="Аренда vs ипотека">
        <p className="mb-4 text-sm text-slate-500">
          Грубое сравнение расходов за выбранный горизонт. Не учитывает рост цен, инфляцию и доход от альтернативных
          вложений — только прямые платежи.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Аренда, ₽/мес"><NumberInput value={rent} onChange={setRent} /></Field>
          <Field label="Цена жилья, ₽"><NumberInput value={price} onChange={setPrice} /></Field>
          <Field label="Первый взнос, ₽"><NumberInput value={down} onChange={setDown} /></Field>
          <Field label="Ставка ипотеки, %"><NumberInput value={ratePct} onChange={setRatePct} /></Field>
          <Field label="Горизонт, лет"><NumberInput value={years} onChange={setYears} /></Field>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat label="Платёж по ипотеке/мес" value={formatRub(result.payment)} />
          <Stat label={`Аренда за ${years} лет`} value={formatRub(result.totalRent)} />
          <Stat label={`Ипотека за ${years} лет`} value={formatRub(result.totalMortgage)} sub="взнос + платежи" />
        </div>

        <p className="mt-4 rounded bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {result.totalMortgage <= result.totalRent
            ? 'За этот горизонт ипотека выходит не дороже аренды — и при этом формирует собственность.'
            : `За этот горизонт прямые расходы по ипотеке выше аренды на ${formatRub(result.totalMortgage - result.totalRent)}, но вы становитесь собственником жилья.`}
        </p>
      </Card>
    </div>
  );
}
