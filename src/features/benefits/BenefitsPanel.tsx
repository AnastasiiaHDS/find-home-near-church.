import { Badge } from '../../components/ui';
import { evaluateAll } from '../../lib/benefitsEngine';
import type { BenefitEvaluation } from '../../data/benefits/schema';
import type { Family, Property } from '../../types';
import { formatRub } from '../../lib/format';

function StatusBadge({ ev }: { ev: BenefitEvaluation }) {
  if (ev.status === 'applicable') return <Badge tone="green">Применимо</Badge>;
  if (ev.status === 'conditional') return <Badge tone="amber">С условиями</Badge>;
  return <Badge tone="slate">Не подходит</Badge>;
}

export function BenefitCard({ ev }: { ev: BenefitEvaluation }) {
  const b = ev.benefit;
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-800">{b.name}</h3>
        <div className="flex items-center gap-1.5">
          <StatusBadge ev={ev} />
          <Badge tone={b.level === 'federal' ? 'brand' : 'slate'}>{b.level === 'federal' ? 'Федеральная' : 'Региональная'}</Badge>
          {ev.stale && <Badge tone="red">Проверка устарела</Badge>}
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-600">{b.benefit}</p>
      {b.amount ? <p className="mt-1 text-sm font-medium text-brand-700">до {formatRub(b.amount)}</p> : null}

      {ev.warnings.length > 0 && (
        <ul className="mt-2 space-y-1">
          {ev.warnings.map((w, i) => (
            <li key={i} className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">⚠️ {w}</li>
          ))}
        </ul>
      )}

      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-medium text-slate-500">Условия, документы, источник</summary>
        <div className="mt-2 space-y-2 text-xs text-slate-600">
          <p><span className="font-medium">Кто имеет право:</span> {b.eligibility}</p>
          {ev.reasons.length > 0 && (
            <ul className="list-inside list-disc">
              {ev.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          )}
          {b.documents.length > 0 && (
            <div>
              <span className="font-medium">Документы:</span>
              <ul className="list-inside list-disc">
                {b.documents.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}
          {b.note && <p className="rounded bg-slate-50 px-2 py-1"><span className="font-medium">Важно:</span> {b.note}</p>}
          <p>
            Проверено: {b.lastVerifiedAt}
            {b.validUntil ? ` · действует до ${b.validUntil}` : ''} ·{' '}
            <a href={b.sourceUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">источник</a>
          </p>
        </div>
      </details>
    </div>
  );
}

export default function BenefitsPanel({ family, property }: { family: Family; property?: Property }) {
  const evals = evaluateAll(family, property);
  const applicable = evals.filter((e) => e.status !== 'not_applicable');
  const rest = evals.filter((e) => e.status === 'not_applicable');

  return (
    <div className="space-y-3">
      {family.children.length === 0 && (
        <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Укажите детей в разделе «Семья и бюджет» — тогда список льгот станет точнее.
        </p>
      )}
      {applicable.map((ev) => <BenefitCard key={ev.benefit.id} ev={ev} />)}
      {rest.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-slate-500">Не подходят по текущим данным ({rest.length})</summary>
          <div className="mt-2 space-y-2 opacity-70">
            {rest.map((ev) => <BenefitCard key={ev.benefit.id} ev={ev} />)}
          </div>
        </details>
      )}
    </div>
  );
}
