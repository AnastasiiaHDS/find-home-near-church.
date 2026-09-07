import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card } from '../../components/ui';
import { usePropertiesStore } from '../../store/propertiesStore';
import { formatRub } from '../../lib/format';
import PropertyForm from './PropertyForm';

export default function PropertiesPage() {
  const { properties, addProperty, removeProperty, toggleFavorite } = usePropertiesStore();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-800">Объекты</h1>
        <div className="flex gap-2">
          <Link to="/import"><Button variant="secondary">↧ Импорт из объявления</Button></Link>
          <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Скрыть форму' : '+ Добавить объект'}</Button>
        </div>
      </div>

      {showForm && (
        <Card title="Новый объект (ручной ввод)">
          <PropertyForm
            onSubmit={(draft) => {
              addProperty(draft);
              setShowForm(false);
            }}
          />
        </Card>
      )}

      {properties.length === 0 && <p className="text-slate-400">Пока нет объектов. Добавьте первый — по нему появится «паспорт» с картой, льготами и расчётом.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <Card key={p.id} className="flex flex-col">
            {p.photoUrl ? (
              <img src={p.photoUrl} alt={p.title} className="mb-3 h-36 w-full rounded-lg object-cover" />
            ) : (
              <div className="mb-3 flex h-36 w-full items-center justify-center rounded-lg bg-slate-100 text-4xl">🏠</div>
            )}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-800">{p.title}</h3>
              <button onClick={() => toggleFavorite(p.id)} title="В избранное" className="text-xl">
                {p.favorite ? '★' : '☆'}
              </button>
            </div>
            <p className="text-sm text-slate-500">{p.address || 'адрес не указан'}</p>
            <p className="mt-1 text-lg font-semibold text-brand-700">{formatRub(p.price)}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge tone="brand">{p.housingType === 'house' ? 'Дом' : 'Квартира'}</Badge>
              <Badge tone={p.market === 'new' ? 'green' : 'slate'}>{p.market === 'new' ? 'Новостройка' : 'Вторичка'}</Badge>
              {p.area > 0 && <Badge>{p.area} м²</Badge>}
              {p.rooms > 0 && <Badge>{p.rooms}-комн.</Badge>}
            </div>
            <div className="mt-3 flex gap-2">
              <Link to={`/properties/${p.id}`} className="flex-1">
                <Button className="w-full">Паспорт объекта</Button>
              </Link>
              <Button variant="danger" onClick={() => removeProperty(p.id)}>Удалить</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
