import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, DisclaimerBanner, Field } from '../../components/ui';
import { usePropertiesStore } from '../../store/propertiesStore';
import { buildBookmarklet } from '../../lib/bookmarklet';
import {
  decodeImportPayload,
  draftFromImport,
  extractFromHtml,
  parseListingText,
  type ImportedListing,
} from '../../lib/listingParser';
import PropertyForm, { type PropertyDraft } from '../properties/PropertyForm';

export default function ImportPage() {
  const addProperty = usePropertiesStore((s) => s.addProperty);
  const navigate = useNavigate();
  const [draft, setDraft] = useState<PropertyDraft | null>(null);
  const [source, setSource] = useState<'bookmarklet' | 'paste' | null>(null);
  const [pasteUrl, setPasteUrl] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteMsg, setPasteMsg] = useState('');

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const bookmarklet = useMemo(() => buildBookmarklet(appOrigin), [appOrigin]);

  // При заходе с букмарлета: /import#<payload> — декодируем и предзаполняем форму.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const decoded = decodeImportPayload(hash);
    if (decoded) {
      setDraft(draftFromImport(decoded));
      setSource('bookmarklet');
      // Убираем payload из URL, чтобы не сохранять его в истории/при обновлении.
      history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const applyImported = (imported: ImportedListing) => {
    setDraft(draftFromImport({ ...imported, sourceUrl: imported.sourceUrl || pasteUrl || undefined }));
    setSource('paste');
  };

  const handleParse = () => {
    const looksLikeHtml = /<[a-z][\s\S]*>/i.test(pasteText);
    const imported = looksLikeHtml ? extractFromHtml(pasteText) : parseListingText(pasteText);
    const found = Object.values(imported).filter((v) => v !== undefined && v !== '').length;
    if (found === 0 && !pasteUrl) {
      setPasteMsg('Не удалось ничего распознать. Проверьте текст или заполните форму вручную.');
      return;
    }
    setPasteMsg(`Распознано полей: ${found}. Проверьте и сохраните.`);
    applyImported(imported);
  };

  const save = (d: PropertyDraft) => {
    const id = addProperty(d);
    navigate(`/properties/${id}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-800">Импорт из объявления</h1>
      <DisclaimerBanner />

      {draft && (
        <Card title={source === 'bookmarklet' ? 'Данные из объявления (проверьте и сохраните)' : 'Проверьте распознанные данные'}>
          <p className="mb-4 text-sm text-slate-500">
            Поля заполнены автоматически. Отредактируйте при необходимости, задайте координаты (кнопка «Определить
            координаты») и сохраните — объект попадёт в список с картой, льготами и расчётом.
          </p>
          <PropertyForm initial={draft} submitLabel="Сохранить объект" onSubmit={save} />
        </Card>
      )}

      <Card title="Способ 1. Кнопка-букмарлет (рекомендуется)">
        <ol className="mb-4 list-inside list-decimal space-y-1 text-sm text-slate-600">
          <li>Перетащите кнопку ниже на панель закладок браузера.</li>
          <li>Откройте страницу объявления (Циан, Авито, Домклик и др.).</li>
          <li>Нажмите закладку — данные объявления откроются здесь, в форме на подтверждение.</li>
        </ol>
        <a
          href={bookmarklet}
          onClick={(e) => e.preventDefault()}
          className="inline-block cursor-move rounded-lg border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700"
          title="Перетащите на панель закладок"
        >
          🏡 В помощник
        </a>
        <p className="mt-3 text-xs text-slate-400">
          Букмарлет читает только уже открытую вами страницу (из её же контекста — без обхода защиты) и передаёт
          распознанные поля сюда через ссылку. Никакого стороннего сервера и массового сбора — это не нарушает правила
          площадок.
        </p>
      </Card>

      <Card title="Способ 2. Ручная вставка">
        <p className="mb-3 text-sm text-slate-500">
          Если букмарлет недоступен — вставьте ссылку и/или скопированный со страницы текст (или HTML). Разберём цену,
          площадь, комнаты и адрес по возможности.
        </p>
        <div className="space-y-3">
          <Field label="Ссылка на объявление (необязательно)">
            <input
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </Field>
          <Field label="Текст или HTML объявления">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={6}
              placeholder="Вставьте сюда описание объявления (Ctrl+A, Ctrl+C на странице) или исходный HTML"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </Field>
          <div className="flex items-center gap-3">
            <Button onClick={handleParse}>Разобрать</Button>
            {pasteMsg && <span className="text-sm text-slate-500">{pasteMsg}</span>}
          </div>
        </div>
      </Card>
    </div>
  );
}
