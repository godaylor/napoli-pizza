import { expect, test } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
});

const seedHeader = async (page, locale, count) => {
  await page.addInitScript(({ locale, count }) => {
    localStorage.setItem('napoli:locale:v1', JSON.stringify({ schemaVersion: 1, locale }));
    localStorage.setItem('napoli:favorites:v1', JSON.stringify({
      schemaVersion: 1,
      productIds: Array.from({ length: count }, (_, index) => String(101 + index)),
    }));
    localStorage.setItem('napoli:commerce:v1', JSON.stringify({
      schemaVersion: 1,
      cart: { lines: count ? [{
        configuration: { productId: '101', variantId: '101-25-thin', removedIngredientIds: [], modifierSelections: [] },
        quantity: count,
      }] : [] },
    }));
  }, { locale, count });
};

for (const locale of ['ru', 'en']) {
  for (const count of [0, 10]) {
    test(`keeps ${locale} header links separate at tablet boundaries with ${count} items`, async ({ page }) => {
      await seedHeader(page, locale, count);
      await page.setViewportSize({ width: 640, height: 360 });
      await page.goto('/menu');
      await expect(page.getByRole('heading', { name: locale === 'ru' ? 'Меню' : 'Menu', level: 1 })).toBeVisible();
      const brand = page.getByRole('link', { name: locale === 'ru' ? 'Napoli — в меню' : 'Napoli — to menu' });
      const navigation = page.getByRole('navigation', { name: locale === 'ru' ? 'Основная навигация' : 'Primary navigation' });
      await expect(navigation.getByRole('link', { name: locale === 'ru' ? `Корзина, товаров: ${count}` : `Cart, items: ${count}` }))
        .toBeVisible();
      await expect(navigation.getByRole('link', { name: locale === 'ru' ? `Избранное${count ? ` · ${count}` : ''}` : `Favorites${count ? ` · ${count}` : ''}`, exact: true }))
        .toBeVisible();

      for (const [width, height] of [[640, 360], [667, 375], [700, 400], [768, 1024]]) {
        await page.setViewportSize({ width, height });
        const links = await navigation.getByRole('link').all();
        const boxes = await Promise.all([brand, ...links].map((link) => link.boundingBox()));
        for (let index = 0; index < boxes.length; index += 1) {
          const box = boxes[index];
          expect(box, `${locale}/${count}/${width}: visible link ${index}`).not.toBeNull();
          expect(box.x, `${locale}/${count}/${width}: left edge ${index}`).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width, `${locale}/${count}/${width}: right edge ${index}`).toBeLessThanOrEqual(width);
          for (const other of boxes.slice(index + 1)) {
            const overlapX = Math.min(box.x + box.width, other.x + other.width) - Math.max(box.x, other.x);
            const overlapY = Math.min(box.y + box.height, other.y + other.height) - Math.max(box.y, other.y);
            expect(overlapX > 0.5 && overlapY > 0.5, `${locale}/${count}/${width}: interactive areas overlap`).toBe(false);
          }
        }
        const geometry = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, available: document.documentElement.clientWidth }));
        expect(geometry.scroll, `${locale}/${count}/${width}: document width`).toBeLessThanOrEqual(geometry.available);
      }
    });
  }
}

test('fits menu and configurator at 320 px with a reserved vertical scrollbar', async ({ page, browserName }) => {
  // Chromium's stable gutter reserves classic-scrollbar space even in headless mode.
  test.skip(browserName !== 'chromium', 'The classic scrollbar regression uses Chromium scrollbar geometry.');
  await page.setViewportSize({ width: 320, height: 568 });
  for (const path of ['/menu', '/menu/margherita-napoli']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.addStyleTag({ content: 'html { overflow-y: scroll; scrollbar-gutter: stable; } ::-webkit-scrollbar { width: 15px; }' });
    const geometry = await page.evaluate(() => {
      const root = document.documentElement;
      return {
        viewport: window.innerWidth,
        available: root.getBoundingClientRect().width,
        body: document.body.getBoundingClientRect().width,
        scroll: root.scrollWidth,
      };
    });
    expect(geometry.available, `${path}: the scrollbar must reserve real layout space`).toBeLessThan(geometry.viewport);
    expect(geometry.body, `${path}: body fits beside scrollbar`).toBeLessThanOrEqual(geometry.available);
    expect(geometry.scroll, `${path}: document fits beside scrollbar`).toBeLessThanOrEqual(geometry.available);
  }
});
