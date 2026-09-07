import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Field, NumberInput, Select, TextInput } from '../../components/ui';
import { usePropertiesStore } from '../../store/propertiesStore';
import { geocode } from '../../lib/overpass';
import { formatRub } from '../../lib/format';
import type { HousingType, LandStatus, MarketType } from '../../types';

const emptyForm = {
  title: '',
  address: '',
  price: 0,
  housingType: 'apartment' as HousingType,
  market: 'new' as MarketType,
  area: 0,
  rooms: 1,
  floor: null as number | null,
  totalFloors: null as number | null,
  yearBuilt: null as number | null,
  landStatus: 'unknown' as LandStatus,
  photoUrl: '',
  sourceUrl: '',
  notes: '',
  lat: null as number | null,
  lon: null as number | null,
  floodRisk: null as boolean | null,
  seismicReinforced: null as boolean | null,
};

export default function PropertiesPage() {
  const { properties, addProperty, removeProperty, toggleFavorite } = usePropertiesStore();
  const [form, setForm] = useState({ ...emptyForm });
  const [showForm, setShowForm] = useState(false);
  const [geoMsg, setGeoMsg] = useState('');

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleGeocode = async () => {
    if (!form.address.trim()) return;
    setGeoMsg('Определяю координаты…');
    const res = await geocode(form.address);
    if (res) {
      set('lat', res.lat);
      set('lon', res.lon);
      setGeoMsg(`Координаты: ${res.lat.toFixed(4)}, ${res.lon.toFixed(4)}`);
    } else {
      setGeoMsg('Не найдено — можно ввести координаты вручную.');
    }
  };

  const submit = () => {
    if (!form.title.trim()) return;
    addProperty(form);
    setForm({ ...emptyForm });
    setShowForm(false);
    setGeoMsg('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Объекты</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Скрыть форму' : '+ Добавить объект'}</Button>
      </div>

      {showForm && (
        <Card title="Новый объект (ручной ввод)">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Название"><TextInput value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="2-к квартира, Академгородок" /></Field>
            <Field label="Цена, ₽"><NumberInput value={form.price} onChange={(v) => set('price', v)} /></Field>
            <Field label="Тип жилья">
              <Select value={form.housingType} onChange={(v) => set('housingType', v as HousingType)}>
                <option value="apartment">Квартира</option>
                <option value="house">Дом</option>
              </Select>
            </Field>
            <Field label="Рынок">
              <Select value={form.market} onChange={(v) => set('market', v as MarketType)}>
                <option value="new">Новостройка</option>
                <option value="secondary">Вторичка</option>
              </Select>
            </Field>
            <Field label="Площадь, м²"><NumberInput value={form.area} onChange={(v) => set('area', v)} /></Field>
            <Field label="Комнат"><NumberInput value={form.rooms} onChange={(v) => set('rooms', v)} /></Field>
            <Field label="Этаж"><NumberInput value={form.floor ?? 0} onChange={(v) => set('floor', v)} /></Field>
            <Field label="Этажей всего"><NumberInput value={form.totalFloors ?? 0} onChange={(v) => set('totalFloors', v)} /></Field>
            <Field label="Год постройки"><NumberInput value={form.yearBuilt ?? 0} onChange={(v) => set('yearBuilt', v)} /></Field>
            {form.housingType === 'house' && (
              <Field label="Статус земли">
                <Select value={form.landStatus} onChange={(v) => set('landStatus', v as LandStatus)}>
                  <option value="unknown">Не указан</option>
                  <option value="IZHS">ИЖС</option>
                  <option value="SNT">СНТ</option>
                  <option value="LPH">ЛПХ</option>
                  <option value="other">Другое</option>
                </Select>
              </Field>
            )}
            <Field label="Фото (URL)"><TextInput value={form.photoUrl} onChange={(e) => set('photoUrl', e.target.value)} /></Field>
            <Field label="Ссылка на объявление"><TextInput value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} /></Field>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-2">
            <Field label="Адрес"><TextInput value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Иркутск, ..." className="w-72" /></Field>
            <Button variant="secondary" onClick={handleGeocode}>Определить координаты</Button>
            {geoMsg && <span className="text-sm text-slate-500">{geoMsg}</span>}
          </div>

          <div className="mt-4">
            <Field label="Заметки"><TextInput value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
          </div>

          <div className="mt-4">
            <Button onClick={submit}>Сохранить объект</Button>
          </div>
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
