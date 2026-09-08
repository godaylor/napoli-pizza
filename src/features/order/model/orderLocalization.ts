import type { Locale } from '../../../shared/i18n/locale';

export const localizeOrderLabel = (value: string, locale: Locale): string => {
  const branded = value.replace(/FORNO 22|React Pizza/gi, 'Napoli');
  if (locale === 'ru') return branded;

  return branded
    .replace('самовывоз из', 'pickup from')
    .replace('Доставка', 'Delivery')
    .replace('Самовывоз', 'Pickup')
    .replace('Москва', 'Moscow')
    .replace('Готово через', 'Ready in')
    .replace('Выбранное время', 'Selected time')
    .replace('Сегодня', 'Today')
    .replace('Завтра', 'Tomorrow')
    .replace('Тверская', 'Tverskaya')
    .replace('Курская', 'Kurskaya')
    .replace('Земляной Вал', 'Zemlyanoy Val')
    .replace('Ежедневно', 'Daily')
    .replace('минут', 'minutes')
    .replace('мин', 'min');
};
