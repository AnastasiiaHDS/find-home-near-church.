// Демо-данные для показа (кнопка на главной). Заполняет сторы согласованным
// примером: многодетная семья в Иркутске, два объекта, напоминания.
import { useFamilyStore } from '../store/familyStore';
import { defaultChecklist, usePropertiesStore } from '../store/propertiesStore';
import { useRemindersStore } from '../store/remindersStore';
import type { Anchor, Child, Family, Property, SearchParams } from '../types';

const uid = () => Math.random().toString(36).slice(2, 10);

/** ISO-дата через N дней от сегодня (для напоминаний). */
function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const children: Child[] = [
  { id: uid(), birthYear: 2015, disabled: false },
  { id: uid(), birthYear: 2019, disabled: false },
  { id: uid(), birthYear: 2023, disabled: false },
];

const family: Family = {
  region: 'irkutsk',
  children,
  spouses: 2,
  hasMaternityCapital: true,
  maternityCapitalAmount: 630000,
  monthlyIncome: 180000,
  mandatoryExpenses: 70000,
  existingLoansPayment: 15000,
  ownFunds: 1500000,
  maxDebtBurdenPct: 50,
};

const anchors: Anchor[] = [
  { id: uid(), label: 'Школа №19', lat: 52.2726, lon: 104.2586, weight: 5 },
  { id: uid(), label: 'Работа (центр)', lat: 52.2864, lon: 104.2807, weight: 3 },
];

const search: SearchParams = {
  housingType: 'any',
  budgetMax: 8000000,
  areaMin: 0,
  areaMax: 0,
  rooms: 2,
  yearBuiltMin: null,
  radiusKm: 3,
};

function buildProperties(): Property[] {
  return [
    {
      id: uid(),
      title: '3-к квартира, Академгородок',
      address: 'Иркутск, Академгородок',
      lat: 52.2726,
      lon: 104.2586,
      price: 7200000,
      housingType: 'apartment',
      market: 'new',
      area: 78,
      rooms: 3,
      floor: 5,
      totalFloors: 10,
      yearBuilt: 2024,
      landStatus: 'unknown',
      photoUrl: '',
      sourceUrl: '',
      notes: 'Рядом школа и парк, новостройка с сейсмоусилением.',
      floodRisk: false,
      seismicReinforced: true,
      favorite: true,
      checklist: defaultChecklist(),
      createdAt: Date.now(),
    },
    {
      id: uid(),
      title: 'Дом 120 м², Иркутский р-н',
      address: 'Иркутский район, пос. Молодёжный',
      lat: 52.28,
      lon: 104.15,
      price: 6500000,
      housingType: 'house',
      market: 'secondary',
      area: 120,
      rooms: 4,
      floor: null,
      totalFloors: 1,
      yearBuilt: 2012,
      landStatus: 'IZHS',
      photoUrl: '',
      sourceUrl: '',
      notes: 'Проверить подтопляемость и сейсмоусиление — частный сектор.',
      floodRisk: true,
      seismicReinforced: false,
      favorite: true,
      checklist: defaultChecklist(),
      createdAt: Date.now() + 1,
    },
  ];
}

/** Загружает демо-данные во все сторы (перезаписывает текущие). */
export function loadDemoData(): void {
  useFamilyStore.setState({ family, anchors, search });
  usePropertiesStore.setState({ properties: buildProperties() });
  useRemindersStore.setState({
    reminders: [
      { id: uid(), title: 'Подать на выплату 450 000 ₽ (ДОМ.РФ)', date: inDays(18), note: 'через Госуслуги после рождения 3-го ребёнка', done: false },
      { id: uid(), title: 'Распорядиться материнским капиталом', date: inDays(69), note: 'заявление в СФР на погашение долга', done: false },
      { id: uid(), title: 'Выделить доли детям после маткапитала', date: inDays(175), note: '', done: false },
    ],
  });
}

/** Полная очистка данных во всех сторах. */
export function clearAllData(): void {
  useFamilyStore.setState({
    family: {
      region: 'irkutsk',
      children: [],
      spouses: 2,
      hasMaternityCapital: false,
      maternityCapitalAmount: 0,
      monthlyIncome: 0,
      mandatoryExpenses: 0,
      existingLoansPayment: 0,
      ownFunds: 0,
      maxDebtBurdenPct: 50,
    },
    anchors: [],
    search: { housingType: 'any', budgetMax: 0, areaMin: 0, areaMax: 0, rooms: 'any', yearBuiltMin: null, radiusKm: 3 },
  });
  usePropertiesStore.setState({ properties: [] });
  useRemindersStore.setState({ reminders: [] });
}
