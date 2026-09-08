import { useLocale } from '../shared/i18n/useLocale';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="language-switcher" role="group" aria-label={t('Язык интерфейса', 'Interface language')}>
      <button type="button" lang="ru" aria-pressed={locale === 'ru'} onClick={() => setLocale('ru')}>
        RU
      </button>
      <button type="button" lang="en" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>
        EN
      </button>
    </div>
  );
}

