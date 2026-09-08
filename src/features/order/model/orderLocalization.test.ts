import { describe, expect, it } from 'vitest';
import { localizeOrderLabel } from './orderLocalization';

describe('fulfillment labels across checkout and order pages', () => {
  it('translates pickup ETA and public store details', () => {
    expect(localizeOrderLabel('Готово через 20–25 мин', 'en')).toBe('Ready in 20–25 min');
    expect(localizeOrderLabel('Napoli · Курская · Москва, Земляной Вал, 12', 'en'))
      .toBe('Napoli · Kurskaya · Moscow, Zemlyanoy Val, 12');
    expect(localizeOrderLabel('Сегодня, 18:00–18:30', 'en')).toBe('Today, 18:00–18:30');
  });
  it('preserves Russian copy and migrates legacy branding', () => {
    expect(localizeOrderLabel('Готово через 20–25 мин', 'ru')).toBe('Готово через 20–25 мин');
    expect(localizeOrderLabel('Demo · самовывоз из FORNO 22', 'en')).toBe('Demo · pickup from Napoli');
  });
});
