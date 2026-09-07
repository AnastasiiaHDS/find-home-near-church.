// Состояние семьи, бюджета и якорных адресов. Персист в localStorage —
// чувствительные данные (§4 ТЗ) не покидают браузер.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Anchor, Child, Family, SearchParams } from '../types';

interface FamilyState {
  family: Family;
  anchors: Anchor[];
  search: SearchParams;
  setFamily: (patch: Partial<Family>) => void;
  addChild: () => void;
  updateChild: (id: string, patch: Partial<Child>) => void;
  removeChild: (id: string) => void;
  addAnchor: (anchor: Omit<Anchor, 'id'>) => void;
  updateAnchor: (id: string, patch: Partial<Anchor>) => void;
  removeAnchor: (id: string) => void;
  setSearch: (patch: Partial<SearchParams>) => void;
}

const defaultFamily: Family = {
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
};

const defaultSearch: SearchParams = {
  housingType: 'any',
  budgetMax: 0,
  areaMin: 0,
  areaMax: 0,
  rooms: 'any',
  yearBuiltMin: null,
  radiusKm: 3,
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      family: defaultFamily,
      anchors: [],
      search: defaultSearch,
      setFamily: (patch) => set((s) => ({ family: { ...s.family, ...patch } })),
      addChild: () =>
        set((s) => ({
          family: {
            ...s.family,
            children: [...s.family.children, { id: uid(), birthYear: new Date().getFullYear(), disabled: false }],
          },
        })),
      updateChild: (id, patch) =>
        set((s) => ({
          family: {
            ...s.family,
            children: s.family.children.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          },
        })),
      removeChild: (id) =>
        set((s) => ({
          family: { ...s.family, children: s.family.children.filter((c) => c.id !== id) },
        })),
      addAnchor: (anchor) => set((s) => ({ anchors: [...s.anchors, { ...anchor, id: uid() }] })),
      updateAnchor: (id, patch) =>
        set((s) => ({ anchors: s.anchors.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      removeAnchor: (id) => set((s) => ({ anchors: s.anchors.filter((a) => a.id !== id) })),
      setSearch: (patch) => set((s) => ({ search: { ...s.search, ...patch } })),
    }),
    { name: 'fh-family' },
  ),
);
