// Пользовательские напоминания о дедлайнах (§8). Персист в localStorage.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Reminder {
  id: string;
  title: string;
  date: string; // ISO-дата (день дедлайна)
  note: string;
  done: boolean;
}

interface RemindersState {
  reminders: Reminder[];
  addReminder: (r: Omit<Reminder, 'id' | 'done'>) => void;
  updateReminder: (id: string, patch: Partial<Reminder>) => void;
  removeReminder: (id: string) => void;
  toggleDone: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

/** Готовые шаблоны напоминаний — типичные дедлайны после покупки/рождения. */
export const REMINDER_TEMPLATES: { title: string; note: string }[] = [
  { title: 'Подать на выплату 450 000 ₽ (ДОМ.РФ)', note: 'После рождения 3-го ребёнка — через Госуслуги или банк. Договор — до 01.07.2031.' },
  { title: 'Распорядиться материнским капиталом', note: 'Заявление в СФР/Госуслуги: первый взнос или погашение долга.' },
  { title: 'Подать на областной маткапитал (Иркутская обл.)', note: 'СФР/МФЦ. Проверить условие проживания в регионе ≥ 1 года.' },
  { title: 'Встать в очередь на земельный участок / компенсацию', note: 'Минимущества Иркутской обл. / МФЦ. Компенсация — при очереди ≥ 3 лет.' },
  { title: 'Выделить доли детям после маткапитала', note: 'Обязательство по закону — не пропустить срок оформления.' },
];

export const useRemindersStore = create<RemindersState>()(
  persist(
    (set) => ({
      reminders: [],
      addReminder: (r) => set((s) => ({ reminders: [...s.reminders, { ...r, id: uid(), done: false }] })),
      updateReminder: (id, patch) =>
        set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      removeReminder: (id) => set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),
      toggleDone: (id) =>
        set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, done: !r.done } : r)) })),
    }),
    { name: 'fh-reminders' },
  ),
);
