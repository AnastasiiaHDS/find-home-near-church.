// Доменные типы сервиса подбора жилья.
// Все денежные величины — в рублях (число), проценты — как годовая ставка в % (например 6 = 6%).

export type HousingType = 'apartment' | 'house';
export type MarketType = 'new' | 'secondary'; // новостройка / вторичка
export type LandStatus = 'IZHS' | 'SNT' | 'LPH' | 'other' | 'unknown'; // ИЖС / СНТ / ЛПХ

/** Ребёнок семьи — для проверки применимости льгот важен возраст и инвалидность. */
export interface Child {
  id: string;
  birthYear: number;
  disabled: boolean;
}

/** Данные семьи и бюджета. Хранятся ТОЛЬКО в браузере (см. §4 ТЗ — приватность). */
export interface Family {
  region: string; // код региона, напр. 'irkutsk'
  children: Child[];
  spouses: number; // 1 или 2 (для правила «супруги — созаёмщики»)
  hasMaternityCapital: boolean;
  maternityCapitalAmount: number; // ₽, если оформлен/положен
  // Финансы
  monthlyIncome: number; // совокупный доход семьи, ₽/мес
  mandatoryExpenses: number; // обязательные расходы, ₽/мес
  existingLoansPayment: number; // платёж по действующим кредитам, ₽/мес
  ownFunds: number; // собственные средства для первого взноса, ₽
  // Настраиваемый порог долговой нагрузки (§3.5 — не жёстко зашит)
  maxDebtBurdenPct: number; // напр. 50 (%)
}

/** Якорный адрес — точка отсчёта поиска (школа, работа, родные) с весом важности. */
export interface Anchor {
  id: string;
  label: string;
  lat: number;
  lon: number;
  weight: number; // 1..5, насколько важна близость к этой точке
}

/** Фильтры поиска (§3.1). */
export interface SearchParams {
  housingType: HousingType | 'any';
  budgetMax: number;
  areaMin: number;
  areaMax: number;
  rooms: number | 'any';
  yearBuiltMin: number | null;
  radiusKm: number; // радиус поиска от якорных точек
}

/** Статус пункта чек-листа (§3.7, §8). */
export type CheckStatus = 'done' | 'in_progress' | 'todo';

export interface ChecklistItem {
  id: string;
  label: string;
  status: CheckStatus;
  note?: string;
}

/** Объект недвижимости — «паспорт объекта» (§2, §3.6). */
export interface Property {
  id: string;
  title: string;
  address: string;
  lat: number | null;
  lon: number | null;
  price: number;
  housingType: HousingType;
  market: MarketType;
  area: number; // м²
  rooms: number;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  landStatus: LandStatus; // для домов
  photoUrl: string;
  sourceUrl: string; // ссылка на объявление (если есть)
  notes: string;
  // Иркутск-специфика (§3.2): обязательные пункты проверки
  floodRisk: boolean | null; // подтопляемость
  seismicReinforced: boolean | null; // сейсмоусиление
  favorite: boolean;
  checklist: ChecklistItem[];
  createdAt: number;
}
