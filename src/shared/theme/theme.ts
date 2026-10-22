export type ThemePreference = 'system' | 'light' | 'dark';
export type ColorTheme = Exclude<ThemePreference, 'system'>;

export const THEME_STORAGE_KEY = 'napoli:theme:v1';
export const DARK_THEME_QUERY = '(prefers-color-scheme: dark)';

export function readThemePreference(): ThemePreference {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? 'null');
    if (value && typeof value === 'object' && 'schemaVersion' in value &&
      value.schemaVersion === 1 && 'preference' in value &&
      (value.preference === 'light' || value.preference === 'dark' || value.preference === 'system')) {
      return value.preference;
    }
  } catch {
    // A blocked or damaged preference must never block the menu.
  }
  return 'system';
}

export function persistThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, preference }));
  } catch {
    // The current tab can still use the chosen theme without persistence.
  }
}

export function applyTheme(preference: ThemePreference, prefersDark: boolean): ColorTheme {
  const theme = preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content', theme === 'dark' ? '#14171d' : '#f6f3ec',
  );
  return theme;
}
