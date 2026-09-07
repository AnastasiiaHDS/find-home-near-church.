import { useEffect, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Marker, Popup, TileLayer, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { CATEGORY_LABELS, fetchPois, type Poi, type PoiCategory } from '../../lib/overpass';
import type { Anchor } from '../../types';
import { Button } from '../../components/ui';

// Иконка объекта через divIcon — избегаем проблемы с отсутствующими PNG Leaflet.
const houseIcon = L.divIcon({
  html: '<div style="font-size:26px;line-height:26px">🏠</div>',
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

const CATEGORY_COLORS: Record<PoiCategory, string> = {
  school: '#2563eb',
  kindergarten: '#7c3aed',
  clinic: '#dc2626',
  shop: '#16a34a',
  transport: '#ca8a04',
  park: '#059669',
};

const ALL_CATEGORIES: PoiCategory[] = ['school', 'kindergarten', 'clinic', 'shop', 'transport', 'park'];

interface Props {
  lat: number;
  lon: number;
  radiusKm: number;
  anchors: Anchor[];
  /** callback: сколько остановок нашлось (для оценки транспортной доступности). */
  onPoiStats?: (counts: Record<PoiCategory, number>) => void;
}

export default function MapView({ lat, lon, radiusKm, anchors, onPoiStats }: Props) {
  const [pois, setPois] = useState<Poi[]>([]);
  const [active, setActive] = useState<PoiCategory[]>(['school', 'kindergarten', 'shop', 'transport']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPois = async () => {
    setLoading(true);
    setError('');
    try {
      const found = await fetchPois(lat, lon, radiusKm * 1000, ALL_CATEGORIES);
      setPois(found);
      if (onPoiStats) {
        const counts = ALL_CATEGORIES.reduce((acc, c) => {
          acc[c] = found.filter((p) => p.category === c).length;
          return acc;
        }, {} as Record<PoiCategory, number>);
        onPoiStats(counts);
      }
    } catch {
      setError('Не удалось загрузить инфраструктуру (Overpass недоступен или нет сети).');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPois([]), [lat, lon]);

  const toggle = (c: PoiCategory) =>
    setActive((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const shown = pois.filter((p) => active.includes(p.category));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={loadPois} disabled={loading}>
          {loading ? 'Загрузка…' : 'Показать инфраструктуру рядом'}
        </Button>
        {ALL_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => toggle(c)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              active.includes(c) ? 'border-transparent text-white' : 'border-slate-200 bg-white text-slate-500'
            }`}
            style={active.includes(c) ? { backgroundColor: CATEGORY_COLORS[c] } : undefined}
          >
            {CATEGORY_LABELS[c]}
            {pois.length > 0 && <> · {pois.filter((p) => p.category === c).length}</>}
          </button>
        ))}
      </div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="h-96 overflow-hidden rounded-xl border border-slate-200">
        <MapContainer center={[lat, lon]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; участники OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lon]} icon={houseIcon}>
            <Popup>Объект</Popup>
          </Marker>
          <Circle center={[lat, lon]} radius={radiusKm * 1000} pathOptions={{ color: '#3376f6', fillOpacity: 0.05 }} />

          {anchors.map((a) => (
            <CircleMarker key={a.id} center={[a.lat, a.lon]} radius={7} pathOptions={{ color: '#111', fillColor: '#fbbf24', fillOpacity: 1 }}>
              <Tooltip permanent direction="top">{a.label} (вес {a.weight})</Tooltip>
            </CircleMarker>
          ))}

          {shown.map((p) => (
            <CircleMarker
              key={`${p.category}-${p.id}`}
              center={[p.lat, p.lon]}
              radius={5}
              pathOptions={{ color: CATEGORY_COLORS[p.category], fillColor: CATEGORY_COLORS[p.category], fillOpacity: 0.8 }}
            >
              <Popup>{CATEGORY_LABELS[p.category]}: {p.name}</Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
