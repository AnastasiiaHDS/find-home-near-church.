import { Link } from 'react-router-dom';
import { Badge, Card } from '../../components/ui';
import { usePropertiesStore } from '../../store/propertiesStore';
import { formatRub } from '../../lib/format';

export default function ComparePage() {
  const favorites = usePropertiesStore((s) => s.properties.filter((p) => p.favorite));

  if (favorites.length === 0) {
    return (
      <Card title="Сравнение избранного">
        <p className="text-slate-500">
          Отметьте объекты звёздочкой ★ в разделе «Объекты» — здесь появится таблица для сравнения.
        </p>
      </Card>
    );
  }

  const rows: { label: string; render: (p: (typeof favorites)[number]) => React.ReactNode }[] = [
    { label: 'Цена', render: (p) => formatRub(p.price) },
    { label: 'Тип', render: (p) => (p.housingType === 'house' ? 'Дом' : 'Квартира') },
    { label: 'Рынок', render: (p) => (p.market === 'new' ? 'Новостройка' : 'Вторичка') },
    { label: 'Площадь', render: (p) => (p.area ? `${p.area} м²` : '—') },
    { label: 'Цена за м²', render: (p) => (p.area ? formatRub(Math.round(p.price / p.area)) : '—') },
    { label: 'Комнат', render: (p) => p.rooms || '—' },
    { label: 'Год', render: (p) => p.yearBuilt || '—' },
    { label: 'Подтопление', render: (p) => (p.floodRisk === null ? '—' : p.floodRisk ? '⚠️ риск' : 'нет') },
    { label: 'Сейсмоусиление', render: (p) => (p.seismicReinforced === null ? '—' : p.seismicReinforced ? 'есть' : '⚠️ нет') },
    {
      label: 'Чек-лист',
      render: (p) => `${p.checklist.filter((i) => i.status === 'done').length}/${p.checklist.length}`,
    },
  ];

  return (
    <Card title={`Сравнение избранного (${favorites.length})`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left text-slate-400" />
              {favorites.map((p) => (
                <th key={p.id} className="min-w-40 p-2 text-left">
                  <Link to={`/properties/${p.id}`} className="font-semibold text-brand-700 hover:underline">{p.title}</Link>
                  <div className="mt-1"><Badge tone="brand">{p.housingType === 'house' ? 'Дом' : 'Квартира'}</Badge></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-slate-100">
                <td className="p-2 font-medium text-slate-500">{row.label}</td>
                {favorites.map((p) => (
                  <td key={p.id} className="p-2 text-slate-700">{row.render(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
