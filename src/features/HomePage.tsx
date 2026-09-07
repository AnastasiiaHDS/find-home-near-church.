import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, DisclaimerBanner, Stat } from '../components/ui';
import { useFamilyStore } from '../store/familyStore';
import { usePropertiesStore } from '../store/propertiesStore';
import { evaluateAll } from '../lib/benefitsEngine';
import { formatRub } from '../lib/format';
import { clearAllData, loadDemoData } from '../lib/demoData';

const steps = [
  { to: '/family', title: '1. Семья и бюджет', desc: 'Дети, доход, собственные средства, якорные адреса.' },
  { to: '/properties', title: '2. Объекты', desc: 'Добавьте варианты жилья вручную — по каждому будет «паспорт».' },
  { to: '/benefits', title: '3. Льготы', desc: 'Что применимо к вашей семье: федеральные и по Иркутской области.' },
  { to: '/finance', title: '4. Финплан', desc: 'График платежей, долговая нагрузка, стресс-сценарии.' },
];

export default function HomePage() {
  const family = useFamilyStore((s) => s.family);
  const anchors = useFamilyStore((s) => s.anchors);
  const properties = usePropertiesStore((s) => s.properties);

  const applicableCount = evaluateAll(family).filter((e) => e.status !== 'not_applicable').length;
  const favorites = properties.filter((p) => p.favorite).length;
  const hasData = family.children.length > 0 || properties.length > 0;
  const [msg, setMsg] = useState('');

  const handleLoadDemo = () => {
    if (hasData && !window.confirm('Загрузить демонстрационный пример? Текущие данные будут заменены.')) return;
    loadDemoData();
    setMsg('Демо-данные загружены — откройте разделы «Объекты», «Льготы», «Финплан».');
  };
  const handleClear = () => {
    if (!window.confirm('Очистить все данные (семья, объекты, напоминания)?')) return;
    clearAllData();
    setMsg('Данные очищены.');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white">
        <h1 className="text-2xl font-bold">Семейный помощник по подбору жилья</h1>
        <p className="mt-2 max-w-2xl text-brand-100">
          Ищем и оцениваем жильё рядом с важными адресами, проверяем льготы для многодетной семьи, считаем реальную цену
          после субсидий и строим финансовый план. Приватно — данные хранятся только в этом браузере.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadDemo}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            ✨ Загрузить демо-данные
          </button>
          <button
            onClick={handleClear}
            className="rounded-lg border border-white/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Очистить всё
          </button>
          {msg && <span className="text-sm text-brand-100">{msg}</span>}
        </div>
      </div>

      <DisclaimerBanner />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Детей в профиле" value={family.children.length} />
        <Stat label="Якорных адресов" value={anchors.length} />
        <Stat label="Объектов" value={properties.length} sub={`${favorites} в избранном`} />
        <Stat label="Доступных льгот" value={applicableCount} />
      </div>

      <Card title="С чего начать">
        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map((s) => (
            <Link key={s.to} to={s.to} className="rounded-xl border border-slate-200 p-4 transition hover:border-brand-300 hover:bg-brand-50">
              <h3 className="font-semibold text-slate-800">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
            </Link>
          ))}
        </div>
      </Card>

      {properties.length > 0 && (
        <Card title="Ваши объекты">
          <div className="flex flex-wrap gap-2">
            {properties.map((p) => (
              <Link key={p.id} to={`/properties/${p.id}`}>
                <Badge tone="brand">{p.title} · {formatRub(p.price)}</Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
