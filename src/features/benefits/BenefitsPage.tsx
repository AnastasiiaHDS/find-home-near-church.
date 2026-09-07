import { Card, DisclaimerBanner } from '../../components/ui';
import { useFamilyStore } from '../../store/familyStore';
import BenefitsPanel from './BenefitsPanel';

export default function BenefitsPage() {
  const family = useFamilyStore((s) => s.family);
  return (
    <div className="space-y-6">
      <DisclaimerBanner />
      <Card title="Справочник льгот и выплат">
        <p className="mb-4 text-sm text-slate-500">
          База знаний обновляется вручную (условия меняются 1–2 раза в год). У каждой льготы — дата последней проверки,
          источник и чек-лист документов. Применимость рассчитана под вашу семью из раздела «Семья и бюджет».
        </p>
        <BenefitsPanel family={family} />
      </Card>
      <Card title="Источники для сверки актуальности">
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
          <li><a className="text-brand-600 underline" href="https://irkobl.ru/" target="_blank" rel="noreferrer">irkobl.ru</a> — Правительство Иркутской области (региональные меры)</li>
          <li><a className="text-brand-600 underline" href="https://sfr.gov.ru/" target="_blank" rel="noreferrer">sfr.gov.ru</a> — Соцфонд, отделение по Иркутской области</li>
          <li><a className="text-brand-600 underline" href="https://xn--d1aqf.xn--p1ai/" target="_blank" rel="noreferrer">дом.рф</a> — каталог региональных программ поддержки при ипотеке</li>
          <li><a className="text-brand-600 underline" href="https://www.gosuslugi.ru/" target="_blank" rel="noreferrer">Госуслуги</a> — условия «Семейной ипотеки» и выплаты 450 000 ₽</li>
          <li><a className="text-brand-600 underline" href="https://rosreestr.gov.ru/" target="_blank" rel="noreferrer">Росреестр</a> — выписки ЕГРН для проверки объектов</li>
        </ul>
      </Card>
    </div>
  );
}
