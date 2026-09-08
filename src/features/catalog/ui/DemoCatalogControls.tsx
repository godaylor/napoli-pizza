import type { CatalogScenario } from '../model/catalog.types';
import { useLocale } from '../../../shared/i18n/useLocale';

interface DemoCatalogControlsProps {
  scenario: CatalogScenario;
  onChange: (scenario: CatalogScenario) => void;
}

const scenarioOptions: Array<{ value: CatalogScenario; label: string; labelEn: string }> = [
  { value: 'default', label: 'Обычная загрузка', labelEn: 'Normal load' },
  { value: 'slow', label: 'Медленная загрузка', labelEn: 'Slow load' },
  { value: 'empty', label: 'Пустой ответ', labelEn: 'Empty response' },
  { value: 'error', label: 'Ошибка кухни · 500', labelEn: 'Kitchen error · 500' },
  { value: 'offline', label: 'Нет сети', labelEn: 'Offline' },
  { value: 'stale', label: 'Фоновое обновление', labelEn: 'Background refresh' },
];

export function DemoCatalogControls({
  scenario,
  onChange,
}: DemoCatalogControlsProps) {
  const { locale, t } = useLocale();
  return (
    <details className="demo-controls">
      <summary>{t('Проверить состояния каталога', 'Test menu states')}</summary>
      <div>
        <label htmlFor="catalog-demo-scenario">{t('Демо-сценарий', 'Demo scenario')}</label>
        <select
          id="catalog-demo-scenario"
          value={scenario}
          onChange={(event) => onChange(event.target.value as CatalogScenario)}>
          {scenarioOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {locale === 'ru' ? option.label : option.labelEn}
            </option>
          ))}
        </select>
        <p>{t('Локальный стенд: заказ, оплата и личные данные здесь не используются.', 'Local demo: no order, payment, or personal data is used here.')}</p>
      </div>
    </details>
  );
}
