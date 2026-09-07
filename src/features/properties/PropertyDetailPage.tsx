import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, Field, Select, Stat } from '../../components/ui';
import { usePropertiesStore } from '../../store/propertiesStore';
import { useFamilyStore } from '../../store/familyStore';
import { evaluateAnchors } from '../../lib/geo';
import { formatRub } from '../../lib/format';
import type { PoiCategory } from '../../lib/overpass';
import MapView from '../map/MapView';
import BenefitsPanel from '../benefits/BenefitsPanel';
import PriceCalculator from '../calc/PriceCalculator';
import LegalChecklist from '../checklist/LegalChecklist';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const property = usePropertiesStore((s) => s.properties.find((p) => p.id === id));
  const updateProperty = usePropertiesStore((s) => s.updateProperty);
  const { family, anchors, search } = useFamilyStore();
  const [transportCount, setTransportCount] = useState<number | null>(null);

  if (!property) {
    return (
      <div>
        <p className="text-slate-500">Объект не найден.</p>
        <Link to="/properties" className="text-brand-600 underline">← к списку объектов</Link>
      </div>
    );
  }

  const hasCoords = property.lat !== null && property.lon !== null;
  const anchorEval = hasCoords ? evaluateAnchors(property.lat!, property.lon!, anchors, search.radiusKm) : null;

  const onPoiStats = (counts: Record<PoiCategory, number>) => setTransportCount(counts.transport);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <Link to="/properties" className="text-sm text-brand-600 underline">← к списку объектов</Link>
        <Button variant="secondary" onClick={() => window.print()}>🖨 Экспорт карточки (PDF)</Button>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row">
          {property.photoUrl ? (
            <img src={property.photoUrl} alt={property.title} className="h-40 w-56 rounded-lg object-cover" />
          ) : (
            <div className="flex h-40 w-56 items-center justify-center rounded-lg bg-slate-100 text-5xl">🏠</div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-slate-800">{property.title}</h1>
            <p className="text-slate-500">{property.address || 'адрес не указан'}</p>
            <p className="mt-1 text-2xl font-bold text-brand-700">{formatRub(property.price)}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge tone="brand">{property.housingType === 'house' ? 'Дом' : 'Квартира'}</Badge>
              <Badge tone={property.market === 'new' ? 'green' : 'slate'}>{property.market === 'new' ? 'Новостройка' : 'Вторичка'}</Badge>
              {property.area > 0 && <Badge>{property.area} м²</Badge>}
              {property.rooms > 0 && <Badge>{property.rooms}-комн.</Badge>}
              {property.yearBuilt ? <Badge>{property.yearBuilt} г.</Badge> : null}
              {property.housingType === 'house' && property.landStatus !== 'unknown' && <Badge tone="amber">{property.landStatus}</Badge>}
            </div>
            {property.sourceUrl && (
              <a href={property.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-brand-600 underline no-print">
                Открыть объявление ↗
              </a>
            )}
          </div>
        </div>
      </Card>

      {/* Иркутск-специфика: обязательные пункты проверки (§3.2). */}
      <Card title="Проверка рисков (Иркутская область)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Подтопляемость участка" hint="Частая тема для частного сектора">
            <Select
              value={property.floodRisk === null ? 'unknown' : property.floodRisk ? 'yes' : 'no'}
              onChange={(v) => updateProperty(property.id, { floodRisk: v === 'unknown' ? null : v === 'yes' })}
            >
              <option value="unknown">Не проверено</option>
              <option value="yes">Есть риск</option>
              <option value="no">Нет риска</option>
            </Select>
          </Field>
          <Field label="Сейсмоусиление" hint="Регион сейсмоопасный — обязательный пункт для домов">
            <Select
              value={property.seismicReinforced === null ? 'unknown' : property.seismicReinforced ? 'yes' : 'no'}
              onChange={(v) => updateProperty(property.id, { seismicReinforced: v === 'unknown' ? null : v === 'yes' })}
            >
              <option value="unknown">Не проверено</option>
              <option value="yes">Есть</option>
              <option value="no">Нет</option>
            </Select>
          </Field>
        </div>
        {(property.floodRisk || property.seismicReinforced === false) && (
          <p className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            ⚠️ Обратите внимание на риски: {property.floodRisk ? 'подтопляемость; ' : ''}
            {property.seismicReinforced === false ? 'нет сейсмоусиления в сейсмоопасном регионе.' : ''}
          </p>
        )}
      </Card>

      <Card title="Карта района и локация">
        {hasCoords ? (
          <>
            <MapView lat={property.lat!} lon={property.lon!} radiusKm={search.radiusKm} anchors={anchors} onPoiStats={onPoiStats} />
            {anchorEval && anchors.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Оценка близости к якорным адресам:</span>
                  <Badge tone={anchorEval.score >= 60 ? 'green' : anchorEval.score >= 30 ? 'amber' : 'red'}>{anchorEval.score}/100</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {anchorEval.distances.map((d) => (
                    <Stat
                      key={d.anchor.id}
                      label={`${d.anchor.label} (вес ${d.anchor.weight})`}
                      value={`${d.distanceKm} км`}
                      sub={d.withinRadius ? 'в радиусе' : 'вне радиуса'}
                    />
                  ))}
                </div>
              </div>
            )}
            {transportCount !== null && (
              <p className="mt-3 text-sm text-slate-500">
                Транспортная доступность: найдено остановок в радиусе — {transportCount}.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-400">
            Не заданы координаты объекта. Откройте объект в разделе «Объекты» и нажмите «Определить координаты».
          </p>
        )}
      </Card>

      <Card title="Применимые льготы для этого объекта">
        <BenefitsPanel family={family} property={property} />
      </Card>

      <Card title="Калькулятор цены и сравнение сценариев">
        <PriceCalculator price={property.price} family={family} />
      </Card>

      <Card title="Риелторский чек-лист проверки">
        <LegalChecklist property={property} />
      </Card>
    </div>
  );
}
