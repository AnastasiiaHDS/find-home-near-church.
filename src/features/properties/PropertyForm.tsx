import { useState } from 'react';
import { Button, Field, NumberInput, Select, TextInput } from '../../components/ui';
import { geocode } from '../../lib/overpass';
import type { HousingType, LandStatus, MarketType, Property } from '../../types';

/** Черновик объекта (без служебных полей) — форма создаёт/редактирует именно его. */
export type PropertyDraft = Omit<Property, 'id' | 'createdAt' | 'checklist' | 'favorite'>;

export const emptyDraft: PropertyDraft = {
  title: '',
  address: '',
  lat: null,
  lon: null,
  price: 0,
  housingType: 'apartment',
  market: 'new',
  area: 0,
  rooms: 1,
  floor: null,
  totalFloors: null,
  yearBuilt: null,
  landStatus: 'unknown',
  photoUrl: '',
  sourceUrl: '',
  notes: '',
  floodRisk: null,
  seismicReinforced: null,
};

/** Переиспользуемая форма объекта: ручной ввод (PropertiesPage) и подтверждение импорта (ImportPage). */
export default function PropertyForm({
  initial,
  submitLabel = 'Сохранить объект',
  onSubmit,
}: {
  initial?: Partial<PropertyDraft>;
  submitLabel?: string;
  onSubmit: (draft: PropertyDraft) => void;
}) {
  const [form, setForm] = useState<PropertyDraft>({ ...emptyDraft, ...initial });
  const [geoMsg, setGeoMsg] = useState('');

  const set = <K extends keyof PropertyDraft>(k: K, v: PropertyDraft[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleGeocode = async () => {
    if (!form.address.trim()) return;
    setGeoMsg('Определяю координаты…');
    const res = await geocode(form.address);
    if (res) {
      setForm((f) => ({ ...f, lat: res.lat, lon: res.lon }));
      setGeoMsg(`Координаты: ${res.lat.toFixed(4)}, ${res.lon.toFixed(4)}`);
    } else {
      setGeoMsg('Не найдено — можно ввести координаты вручную.');
    }
  };

  const submit = () => {
    if (!form.title.trim()) return;
    onSubmit(form);
  };

  return (
    <>
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
        <Button onClick={submit}>{submitLabel}</Button>
      </div>
    </>
  );
}
