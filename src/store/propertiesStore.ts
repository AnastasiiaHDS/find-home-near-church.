// Объекты недвижимости (ручной ввод, §3.6). Персист в localStorage.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChecklistItem, Property } from '../types';

interface PropertiesState {
  properties: Property[];
  addProperty: (p: Omit<Property, 'id' | 'createdAt' | 'checklist' | 'favorite'>) => string;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  removeProperty: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateChecklistItem: (propId: string, itemId: string, patch: Partial<ChecklistItem>) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

/** Стартовый чек-лист «риелторской» проверки (§3.7). Для Иркутска — сейсмика/подтопления. */
export function defaultChecklist(): ChecklistItem[] {
  return [
    { id: uid(), label: 'Проверить собственника и обременения (выписка ЕГРН, Росреестр/Госуслуги)', status: 'todo' },
    { id: uid(), label: 'Для дома: газ / вода / канализация, подключение к сетям', status: 'todo' },
    { id: uid(), label: 'Статус земли (ИЖС / СНТ / ЛПХ)', status: 'todo' },
    { id: uid(), label: 'Иркутск: сейсмоусиление и год постройки (сейсмоопасный регион)', status: 'todo' },
    { id: uid(), label: 'Иркутск: подтопляемость участка (особенно частный сектор)', status: 'todo' },
    { id: uid(), label: 'Пригодность жилья для маткапитала/льготной ипотеки (не аварийное, коммуникации)', status: 'todo' },
  ];
}

export const usePropertiesStore = create<PropertiesState>()(
  persist(
    (set) => ({
      properties: [],
      addProperty: (p) => {
        const id = uid();
        set((s) => ({
          properties: [
            ...s.properties,
            { ...p, id, favorite: false, checklist: defaultChecklist(), createdAt: Date.now() },
          ],
        }));
        return id;
      },
      updateProperty: (id, patch) =>
        set((s) => ({ properties: s.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removeProperty: (id) => set((s) => ({ properties: s.properties.filter((p) => p.id !== id) })),
      toggleFavorite: (id) =>
        set((s) => ({ properties: s.properties.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)) })),
      updateChecklistItem: (propId, itemId, patch) =>
        set((s) => ({
          properties: s.properties.map((p) =>
            p.id === propId
              ? { ...p, checklist: p.checklist.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
              : p,
          ),
        })),
    }),
    { name: 'fh-properties' },
  ),
);
