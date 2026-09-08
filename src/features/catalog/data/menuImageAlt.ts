import sources from '../../../assets/menu/sources.json';

export const menuImageAlt = (key: string, locale: 'ru' | 'en'): string | undefined => {
  const asset = sources.assets.find((entry) => entry.key === key);
  if (!asset) return undefined;
  return (locale === 'ru' ? 'Иллюстрация демоменю: ' : 'Demo menu illustration: ') + asset.alt[locale];
};
