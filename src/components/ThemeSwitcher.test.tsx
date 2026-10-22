import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeSwitcher } from './ThemeSwitcher';
import { LocaleProvider } from '../shared/i18n/LocaleProvider';
import { THEME_STORAGE_KEY } from '../shared/theme/theme';

function mockSystemTheme(dark = false) {
  const listeners = new Set<() => void>();
  const media = {
    matches: dark,
    addEventListener: vi.fn((_event: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_event: string, listener: () => void) => listeners.delete(listener)),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => media));
  return {
    listeners,
    change: (next: boolean) => {
      media.matches = next;
      act(() => listeners.forEach((listener) => listener()));
    },
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.removeItem(THEME_STORAGE_KEY);
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = '';
});

describe('theme preference', () => {
  it('follows device changes in Auto and releases its listener on unmount', () => {
    const system = mockSystemTheme(true);
    const { unmount } = render(<ThemeSwitcher />);
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByRole('button', { name: /Тема: Авто/ })).toBeVisible();

    system.change(false);
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    unmount();
    expect(system.listeners.size).toBe(0);
  });

  it('cycles to an explicit theme, keeps it on device changes and restores it on remount', () => {
    const system = mockSystemTheme();
    const { unmount } = render(<ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /Включить светлую тему/ }));
    fireEvent.click(screen.getByRole('button', { name: /Включить тёмную тему/ }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}')).toEqual({
      schemaVersion: 1, preference: 'dark',
    });
    system.change(false);
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    unmount();
    render(<ThemeSwitcher />);
    expect(screen.getByRole('button', { name: /Тема: Тёмная/ })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Использовать тему устройства/ }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('ignores malformed storage and lets the current tab switch when storage is blocked', () => {
    mockSystemTheme();
    localStorage.setItem(THEME_STORAGE_KEY, '{invalid');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    render(<ThemeSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: /Включить светлую тему/ }));
    fireEvent.click(screen.getByRole('button', { name: /Включить тёмную тему/ }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('exposes localized names without relying on the icon', () => {
    mockSystemTheme();
    localStorage.setItem('napoli:locale:v1', JSON.stringify({ schemaVersion: 1, locale: 'en' }));
    render(<LocaleProvider><ThemeSwitcher /></LocaleProvider>);
    expect(screen.getByRole('button', { name: 'Theme: Auto. Use light theme' })).toBeVisible();
    localStorage.removeItem('napoli:locale:v1');
  });
});
