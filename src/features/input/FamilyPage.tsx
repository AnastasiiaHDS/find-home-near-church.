import { useState } from 'react';
import { Button, Card, DisclaimerBanner, Field, NumberInput, Select, TextInput } from '../../components/ui';
import { useFamilyStore } from '../../store/familyStore';
import { geocode } from '../../lib/overpass';

export default function FamilyPage() {
  const { family, setFamily, addChild, updateChild, removeChild } = useFamilyStore();
  const { anchors, addAnchor, updateAnchor, removeAnchor, search, setSearch } = useFamilyStore();
  const [anchorQuery, setAnchorQuery] = useState('');
  const [anchorLabel, setAnchorLabel] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState('');

  const handleAddAnchor = async () => {
    if (!anchorQuery.trim()) return;
    setGeocoding(true);
    setGeoError('');
    try {
      const res = await geocode(anchorQuery);
      if (!res) {
        setGeoError('Адрес не найден. Уточните запрос.');
        return;
      }
      addAnchor({ label: anchorLabel || anchorQuery, lat: res.lat, lon: res.lon, weight: 3 });
      setAnchorQuery('');
      setAnchorLabel('');
    } catch {
      setGeoError('Ошибка геокодирования (нет сети?). Можно ввести координаты вручную ниже.');
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      <Card title="Состав семьи">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Регион">
            <Select value={family.region} onChange={(v) => setFamily({ region: v })}>
              <option value="irkutsk">Иркутская область</option>
              <option value="other">Другой регион</option>
            </Select>
          </Field>
          <Field label="Супругов (созаёмщиков)" hint="Для «Семейной ипотеки» супруги обязаны быть созаёмщиками">
            <Select value={String(family.spouses)} onChange={(v) => setFamily({ spouses: Number(v) })}>
              <option value="1">1</option>
              <option value="2">2</option>
            </Select>
          </Field>
          <Field label="Материнский капитал">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={family.hasMaternityCapital}
                onChange={(e) => setFamily({ hasMaternityCapital: e.target.checked })}
                className="h-4 w-4"
              />
              <NumberInput
                value={family.maternityCapitalAmount}
                onChange={(v) => setFamily({ maternityCapitalAmount: v })}
                placeholder="сумма, ₽"
                disabled={!family.hasMaternityCapital}
              />
            </div>
          </Field>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-600">Дети</h3>
            <Button variant="secondary" onClick={addChild}>+ Добавить ребёнка</Button>
          </div>
          {family.children.length === 0 && <p className="text-sm text-slate-400">Добавьте детей — от их количества и возраста зависят применимые льготы.</p>}
          <div className="space-y-2">
            {family.children.map((child, i) => (
              <div key={child.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3">
                <span className="text-sm text-slate-500">Ребёнок {i + 1}</span>
                <label className="flex items-center gap-1 text-sm">
                  Год рождения
                  <NumberInput
                    value={child.birthYear}
                    onChange={(v) => updateChild(child.id, { birthYear: v })}
                    className="w-24"
                  />
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={child.disabled}
                    onChange={(e) => updateChild(child.id, { disabled: e.target.checked })}
                  />
                  инвалидность
                </label>
                <Button variant="danger" onClick={() => removeChild(child.id)} className="ml-auto">Удалить</Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Бюджет и финансы">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Совокупный доход семьи, ₽/мес">
            <NumberInput value={family.monthlyIncome} onChange={(v) => setFamily({ monthlyIncome: v })} />
          </Field>
          <Field label="Обязательные расходы, ₽/мес">
            <NumberInput value={family.mandatoryExpenses} onChange={(v) => setFamily({ mandatoryExpenses: v })} />
          </Field>
          <Field label="Платёж по текущим кредитам, ₽/мес">
            <NumberInput value={family.existingLoansPayment} onChange={(v) => setFamily({ existingLoansPayment: v })} />
          </Field>
          <Field label="Собственные средства (первый взнос), ₽">
            <NumberInput value={family.ownFunds} onChange={(v) => setFamily({ ownFunds: v })} />
          </Field>
          <Field label="Порог долговой нагрузки, %" hint="Банки обычно смотрят ~50% дохода. Настраивается.">
            <NumberInput value={family.maxDebtBurdenPct} onChange={(v) => setFamily({ maxDebtBurdenPct: v })} />
          </Field>
        </div>
      </Card>

      <Card title="Якорные адреса и поиск">
        <p className="mb-3 text-sm text-slate-500">
          Точки отсчёта поиска (школа, работа, родные). Вес — насколько важна близость (1…5).
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Метка">
            <TextInput value={anchorLabel} onChange={(e) => setAnchorLabel(e.target.value)} placeholder="Школа №1" className="w-40" />
          </Field>
          <Field label="Адрес для поиска">
            <TextInput value={anchorQuery} onChange={(e) => setAnchorQuery(e.target.value)} placeholder="Иркутск, ул. ..." className="w-64" />
          </Field>
          <Button onClick={handleAddAnchor} disabled={geocoding}>{geocoding ? 'Ищу…' : 'Найти и добавить'}</Button>
        </div>
        {geoError && <p className="mt-2 text-sm text-red-600">{geoError}</p>}

        <div className="mt-4 space-y-2">
          {anchors.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm">
              <span className="font-medium">{a.label}</span>
              <span className="text-slate-400">{a.lat.toFixed(4)}, {a.lon.toFixed(4)}</span>
              <label className="flex items-center gap-1">
                вес
                <NumberInput value={a.weight} onChange={(v) => updateAnchor(a.id, { weight: Math.max(1, Math.min(5, v)) })} className="w-16" />
              </label>
              <Button variant="danger" onClick={() => removeAnchor(a.id)} className="ml-auto">Удалить</Button>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Радиус поиска, км">
            <NumberInput value={search.radiusKm} onChange={(v) => setSearch({ radiusKm: v })} />
          </Field>
          <Field label="Тип жилья">
            <Select value={search.housingType} onChange={(v) => setSearch({ housingType: v as never })}>
              <option value="any">Любой</option>
              <option value="apartment">Квартира</option>
              <option value="house">Дом</option>
            </Select>
          </Field>
          <Field label="Бюджет, ₽ (макс)">
            <NumberInput value={search.budgetMax} onChange={(v) => setSearch({ budgetMax: v })} />
          </Field>
          <Field label="Комнат (мин)">
            <Select value={String(search.rooms)} onChange={(v) => setSearch({ rooms: v === 'any' ? 'any' : Number(v) })}>
              <option value="any">Любое</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4+</option>
            </Select>
          </Field>
        </div>
      </Card>
    </div>
  );
}
