import { Badge, Select } from '../../components/ui';
import { usePropertiesStore } from '../../store/propertiesStore';
import type { CheckStatus, Property } from '../../types';

const statusTone: Record<CheckStatus, 'green' | 'amber' | 'slate'> = {
  done: 'green',
  in_progress: 'amber',
  todo: 'slate',
};
const statusLabel: Record<CheckStatus, string> = { done: 'Готово', in_progress: 'В процессе', todo: 'Нет' };

export default function LegalChecklist({ property }: { property: Property }) {
  const updateChecklistItem = usePropertiesStore((s) => s.updateChecklistItem);
  const done = property.checklist.filter((i) => i.status === 'done').length;

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        Компенсирует отсутствие риелтора: юридическая и техническая проверка объекта. Выполнено {done} из {property.checklist.length}.
      </p>
      <div className="space-y-2">
        {property.checklist.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
            <Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge>
            <span className="flex-1 text-sm text-slate-700">{item.label}</span>
            <Select
              value={item.status}
              onChange={(v) => updateChecklistItem(property.id, item.id, { status: v as CheckStatus })}
            >
              <option value="todo">Нет</option>
              <option value="in_progress">В процессе</option>
              <option value="done">Готово</option>
            </Select>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Выписку ЕГРН можно заказать через Росреестр / Госуслуги. Для домов в Иркутске критичны сейсмоусиление и подтопляемость.
      </p>
    </div>
  );
}
