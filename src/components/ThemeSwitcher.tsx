import { useEffect, useState } from 'react';

import { useLocale } from '../shared/i18n/useLocale';
import {
  applyTheme,
  DARK_THEME_QUERY,
  persistThemePreference,
  readThemePreference,
  type ThemePreference,
} from '../shared/theme/theme';
import styles from './ThemeSwitcher.module.scss';

const nextPreference: Record<ThemePreference, ThemePreference> = {
  system: 'light', light: 'dark', dark: 'system',
};

export function ThemeSwitcher() {
  const { t } = useLocale();
  const [preference, setPreference] = useState(readThemePreference);

  useEffect(() => {
    const media = window.matchMedia?.(DARK_THEME_QUERY);
    const update = () => applyTheme(preference, media?.matches ?? false);
    update();
    media?.addEventListener('change', update);
    return () => media?.removeEventListener('change', update);
  }, [preference]);

  const labels = {
    light: t('Светлая', 'Light'),
    dark: t('Тёмная', 'Dark'),
    system: t('Авто', 'Auto'),
  };
  const next = nextPreference[preference];
  const nextActions = {
    light: t('Включить светлую тему', 'Use light theme'),
    dark: t('Включить тёмную тему', 'Use dark theme'),
    system: t('Использовать тему устройства', 'Use device theme'),
  };
  const label = `${t('Тема', 'Theme')}: ${labels[preference]}. ${nextActions[next]}`;

  return (
    <button
      className={styles.button}
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        setPreference(next);
        persistThemePreference(next);
      }}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {preference === 'light' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
          </>
        ) : preference === 'dark' ? (
          <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />
        ) : (
          <>
            <rect x="3" y="4" width="18" height="13" rx="2" />
            <path d="M8 21h8m-4-4v4" />
          </>
        )}
      </svg>
      <span>{labels[preference]}</span>
    </button>
  );
}
