import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
});

test('English pickup keeps distinct configurations, correct hours and translated recovery through reload', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/menu/margherita-napoli');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Margherita Napoli', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: /^Add for/ }).click();
  await page.getByRole('checkbox', { name: /^Remove / }).first().check();
  await page.getByRole('button', { name: /^Add for/ }).click();
  await page.getByRole('link', { name: 'Open cart', exact: true }).click();
  await page.goto('/checkout');
  await page.getByRole('radio', { name: /Pickup/ }).first().check();
  await expect(page.getByText('Daily 10:00–23:00')).toBeVisible();
  await page.getByRole('combobox', { name: 'Pizzeria', exact: true }).selectOption('store-kurskaya');
  await expect(page.getByText('Daily 09:00–22:00')).toBeVisible();
  await page.getByRole('button', { name: /Check pickup/ }).click();
  await expect(page.getByText('Pickup confirmed', { exact: true })).toBeVisible();
  await expect(page.getByText(/Ready in 20–25 min/).first()).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Order preview' })).toContainText('No parmesan');
  await expect(page.locator('main')).not.toContainText(/[А-Яа-яЁё]/);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath(`portfolio-checkout-en-${width}.png`) });
  }
  await page.getByRole('button', { name: 'Confirm total', exact: true }).click();
  await expect(page.getByText('Final total confirmed', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Demo payment outcome' }).selectOption('decline');
  await page.getByRole('button', { name: /^Pay .* and place order$/ }).click();
  await expect(page.getByText('Demo payment declined', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Demo payment outcome' }).selectOption('success');
  await page.getByRole('button', { name: /^Pay .* and place order$/ }).click();
  await expect(page.getByRole('heading', { name: 'Order confirmed', level: 1 })).toBeVisible();
  await expect(page.getByText('Margherita Napoli × 1', { exact: true })).toHaveCount(2);
  await expect(page.locator('main')).toContainText('No parmesan');
  await page.reload();
  await expect(page.getByText('Margherita Napoli × 1', { exact: true })).toHaveCount(2);
  await expect(page.locator('main')).not.toContainText(/[А-Яа-яЁё]/);
  await page.getByRole('button', { name: 'RU', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Заказ подтверждён', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('link', { name: 'Track order', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Preparing for pickup', level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.locator('main')).not.toContainText(/[А-Яа-яЁё]/);
  expect(errors).toEqual([]);
});

test('direct static routes load with assets and locale after reload', async ({ page }) => {
  for (const route of ['/menu/margherita-napoli', '/cart', '/checkout', '/favorites', '/orders', '/order/unknown/confirmed', '/order/unknown/track', '/missing-page']) {
    const response = await page.goto(route);
    expect(response.status()).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main h1')).toBeVisible();
  }
});
