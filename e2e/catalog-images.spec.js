import { expect, test } from '@playwright/test';

test('all 36 products load distinct photographs across responsive widths', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/menu');
  const cards = page.getByRole('article');
  await expect(cards).toHaveCount(36);
  const photos = cards.getByRole('img');
  await expect(photos).toHaveCount(36);
  const sources = await photos.evaluateAll(images => images.map(image => image.getAttribute('src')));
  expect(new Set(sources).size).toBe(36);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (let index = 0; index < 36; index++) {
      const photo = photos.nth(index);
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(() => photo.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      await expect(photo).toHaveAttribute('alt', /.+/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath(`menu-${width}.png`), fullPage: width >= 768 });
  }
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Menu', level: 1 })).toBeVisible();
  await expect(photos).toHaveCount(36);
  expect(await photos.evaluateAll(images => images.map(image => image.getAttribute('src')))).toEqual(sources);
  await page.getByRole('button', { name: 'RU', exact: true }).click();
  await expect(photos).toHaveCount(36);
  await page.getByRole('article', { name: 'Мортаделла и фисташка', exact: true }).getByRole('link').click();
  await expect(page.getByRole('heading', { name: 'Мортаделла и фисташка', level: 1 })).toBeVisible();
  await expect(page.locator('main img[data-product-image]')).toHaveAttribute('src', '/menu/mortadella-pistachio-960.jpg');
  await page.getByRole('button', { name: /^Добавить за/ }).click();
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Мортаделла и фисташка' })).toBeVisible();
  expect(errors).toEqual([]);
});
