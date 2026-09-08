import { describe, expect, it } from 'vitest';
import { menuImageAlt } from './menuImageAlt';
import sources from '../../../assets/menu/sources.json';

describe('licensed menu images', () => {
  it('records eight distinct licensed sources with honest bilingual descriptions', () => {
    expect(sources.assets).toHaveLength(8);
    expect(new Set(sources.assets.map((asset) => asset.id)).size).toBe(8);
    for (const asset of sources.assets) {
      expect(asset.author).not.toBe('');
      expect(asset.page).toMatch(/^https:\/\/www\.pexels\.com\/photo\//);
      expect(menuImageAlt(asset.key, 'ru')).toContain('Иллюстрация демоменю:');
      expect(menuImageAlt(asset.key, 'en')).toContain('Demo menu illustration:');
      expect(menuImageAlt(asset.key, 'en')).not.toMatch(/[А-Яа-яЁё]/);
    }
  });
  it('allows an explicit fallback for unknown keys', () => {
    expect(menuImageAlt('missing', 'en')).toBeUndefined();
  });
});
