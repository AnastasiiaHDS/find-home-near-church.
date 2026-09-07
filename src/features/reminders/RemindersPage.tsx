import { useMemo, useState } from 'react';
import { Badge, Button, Card, DisclaimerBanner, Field, TextInput } from '../../components/ui';
import { REMINDER_TEMPLATES, useRemindersStore } from '../../store/remindersStore';
import {
  STATUS_LABEL,
  STATUS_TONE,
  deadlineInfo,
  humanDaysLeft,
  programDeadlines,
} from '../../lib/deadlines';
import { downloadIcs, type IcsEvent } from '../../lib/ics';

export default function RemindersPage() {
  const { reminders, addReminder, removeReminder, toggleDone } = useRemindersStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  const programs = useMemo(() => programDeadlines(), []);

  const sortedReminders = useMemo(
    () => [...reminders].sort((a, b) => a.date.localeCompare(b.date)),
    [reminders],
  );

  const add = () => {
    if (!title.trim() || !date) return;
    addReminder({ title: title.trim(), date, note: note.trim() });
    setTitle('');
    setDate('');
    setNote('');
  };

  const useTemplate = (t: { title: string; note: string }) => {
    setTitle(t.title);
    setNote(t.note);
  };

  const exportAll = () => {
    const events: IcsEvent[] = [
      ...programs.map((p) => ({ uid: `prog-${p.id}`, title: p.title.replace(' — действует до', ' — дедлайн'), date: p.date, description: p.note })),
      ...reminders.filter((r) => !r.done).map((r) => ({ uid: `rem-${r.id}`, title: r.title, date: r.date, description: r.note })),
    ];
    if (events.length === 0) return;
    downloadIcs(events);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-slate-800">Напоминания о дедлайнах</h1>
        <Button variant="secondary" onClick={exportAll}>📅 Скачать в календарь (.ics)</Button>
      </div>
      <DisclaimerBanner />

      <Card title="Дедлайны программ поддержки">
        <p className="mb-3 text-sm text-slate-500">
          Автоматически из базы льгот (срок действия программ). Сроки индексируются/меняются — сверяйте перед подачей.
        </p>
        <div className="space-y-2">
          {programs.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
              <Badge tone={STATUS_TONE[p.info.status]}>{STATUS_LABEL[p.info.status]}</Badge>
              <div className="flex-1">
                <span className="text-sm font-medium text-slate-700">{p.title} {formatDate(p.date)}</span>
                <span className="ml-2 text-xs text-slate-400">{humanDaysLeft(p.info.daysLeft)}</span>
              </div>
              {p.sourceUrl && (
                <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 underline">источник</a>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Мои напоминания">
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <Field label="Что сделать"><TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Подать на выплату 450 000 ₽" className="w-72" /></Field>
          <Field label="Дата дедлайна">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </Field>
          <Field label="Заметка"><TextInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="через Госуслуги" className="w-56" /></Field>
          <Button onClick={add}>Добавить</Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-1">
          <span className="mr-1 self-center text-xs text-slate-400">Шаблоны:</span>
          {REMINDER_TEMPLATES.map((t) => (
            <button key={t.title} onClick={() => useTemplate(t)} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50">
              {t.title}
            </button>
          ))}
        </div>

        {sortedReminders.length === 0 && <p className="text-sm text-slate-400">Пока нет напоминаний. Добавьте вручную или из шаблона выше.</p>}
        <div className="space-y-2">
          {sortedReminders.map((r) => {
            const info = deadlineInfo(r.date);
            return (
              <div key={r.id} className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${r.done ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-200'}`}>
                <input type="checkbox" checked={r.done} onChange={() => toggleDone(r.id)} className="h-4 w-4" />
                {!r.done && <Badge tone={STATUS_TONE[info.status]}>{STATUS_LABEL[info.status]}</Badge>}
                <div className="flex-1">
                  <span className={`text-sm font-medium ${r.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{r.title}</span>
                  <span className="ml-2 text-xs text-slate-400">{formatDate(r.date)} · {humanDaysLeft(info.daysLeft)}</span>
                  {r.note && <div className="text-xs text-slate-500">{r.note}</div>}
                </div>
                <Button variant="danger" onClick={() => removeReminder(r.id)}>Удалить</Button>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Кнопка «Скачать в календарь» создаёт файл .ics со всеми дедлайнами и напоминаниями (с оповещением за 7 дней) —
          откройте его в Google Календаре, Apple Календаре или почте, чтобы напоминания приходили на телефон.
        </p>
      </Card>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
